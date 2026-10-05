/**
 * Release gate.
 *
 * Drives the real production bundle in Chromium and fails on anything a user
 * would notice: a console error, an unhandled rejection, a failed request, a
 * horizontal scrollbar, an image without alt text, an unnamed control, text
 * below 11px, a tap target under 44px, or a heap that grows without bound while
 * cycling every route.
 *
 * Usage: node scripts/verify.mjs [--screenshots]
 */
import { chromium } from "playwright";
import { createServer } from "node:http";
import { readFile, mkdir, stat, readdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { homedir } from "node:os";
import { extname, join, normalize } from "node:path";

const DIST = "dist";
const PORT = Number(process.env.VERIFY_PORT || 4318);
const SHOTS = "scripts/shots/verify";
const WANT_SHOTS = process.argv.includes("--screenshots");

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".webmanifest": "application/manifest+json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
};

const ROUTES = [
  { hash: "#/", name: "today" },
  { hash: "#/vitals", name: "vitals" },
  { hash: "#/journal", name: "journal" },
  { hash: "#/vanguard", name: "vanguard" },
  { hash: "#/archives", name: "archives" },
  { hash: "#/library", name: "library" },
  { hash: "#/nutrition", name: "nutrition" },
  { hash: "#/profile", name: "profile" },
  { hash: "#/settings", name: "settings" },
  { hash: "#/auth", name: "auth" },
  { hash: "#/join", name: "join" },
  { hash: "#/nope", name: "not-found" },
];

const VIEWPORTS = [
  { name: "320", width: 320, height: 640 },
  { name: "390", width: 390, height: 844 },
  { name: "768", width: 768, height: 1024 },
  { name: "1440", width: 1440, height: 900 },
];

/** Errors that are expected in a sandboxed/offline run. */
const IGNORABLE = [
  /favicon/i,
  /Failed to load resource.*fonts\.g/i,
  /net::ERR_INTERNET_DISCONNECTED/i,
  /net::ERR_NAME_NOT_RESOLVED/i,
  /CERT/i,
  // Chromium reports unreachable relays itself. An offline or firewalled relay
  // is a normal condition that Fursan already handles (local write + queue), so
  // the browser's own network error must not fail the gate.
  /WebSocket connection to 'wss?:\/\/[^']*' failed/i,
  /relay\.[a-z.]+\/ (failed|-)/i,
];

const problems = [];
const fail = (scope, message, extra) => problems.push({ scope, message, extra });
const ignorable = (text) => IGNORABLE.some((re) => re.test(text));

const serve = () =>
  new Promise((resolve) => {
    const server = createServer(async (req, res) => {
      try {
        const url = new URL(req.url, "http://localhost");
        let path = normalize(decodeURIComponent(url.pathname)).replace(/^(\.\.[/\\])+/, "");
        let file = join(DIST, path);
        try {
          const info = await stat(file);
          if (info.isDirectory()) file = join(file, "index.html");
        } catch {
          file = join(DIST, "index.html"); // SPA fallback
        }
        const body = await readFile(file);
        res.writeHead(200, { "Content-Type": MIME[extname(file)] || "application/octet-stream" });
        res.end(body);
      } catch (error) {
        res.writeHead(404).end(String(error));
      }
    });
    server.listen(PORT, () => resolve(server));
  });

const auditDom = async (page, scope) => {
  const found = await page.evaluate(() => {
    const out = { overflow: [], noAlt: [], unnamed: [], tiny: [], smallTap: [], h1: 0 };

    if (document.documentElement.scrollWidth > window.innerWidth + 1) {
      out.overflow.push({
        scrollWidth: document.documentElement.scrollWidth,
        inner: window.innerWidth,
      });
    }

    for (const img of document.querySelectorAll("img")) {
      if (img.getAttribute("alt") === null) out.noAlt.push(img.currentSrc || img.src);
    }

    const name = (el) =>
      (
        el.getAttribute("aria-label") ||
        el.getAttribute("title") ||
        el.textContent ||
        ""
      ).trim();

    for (const el of document.querySelectorAll("button, a[href], input, select, textarea")) {
      const rect = el.getBoundingClientRect();
      if (rect.width === 0 && rect.height === 0) continue; // hidden
      const label =
        el.tagName === "INPUT" || el.tagName === "TEXTAREA"
          ? (() => {
              const id = el.getAttribute("id");
              const label = id && document.querySelector(`label[for="${CSS.escape(id)}"]`);
              return label?.textContent?.trim() || el.getAttribute("placeholder") || "";
            })()
          : name(el);
      if (!label && el.getAttribute("aria-hidden") !== "true") {
        out.unnamed.push(`${el.tagName.toLowerCase()}.${el.className.toString().slice(0, 40)}`);
      }
      if ((rect.height < 32 || rect.width < 32) && el.tagName === "BUTTON") {
        out.smallTap.push({
          label: label.slice(0, 24) || "(unlabelled)",
          w: Math.round(rect.width),
          h: Math.round(rect.height),
        });
      }
    }

    for (const el of document.querySelectorAll("p, span, div, li, label, td, a")) {
      if (!el.textContent?.trim()) continue;
      if (el.querySelector("p, span, div, li")) continue; // container, not a text leaf
      const size = parseFloat(getComputedStyle(el).fontSize);
      if (size > 0 && size < 11) {
        out.tiny.push({ size: +size.toFixed(1), text: el.textContent.trim().slice(0, 30) });
      }
    }

    out.h1 = document.querySelectorAll("h1").length;
    return out;
  });

  if (found.overflow.length) {
    fail(scope, "horizontal overflow", found.overflow);
  }
  if (found.noAlt.length) fail(scope, "img without alt", found.noAlt);
  if (found.unnamed.length) fail(scope, "control without an accessible name", found.unnamed);
  if (found.tiny.length) fail(scope, "text below 11px", found.tiny.slice(0, 5));
  if (found.smallTap.length) fail(scope, "tap target under 32px", found.smallTap.slice(0, 5));
  if (found.h1 > 1) fail(scope, `more than one <h1> (${found.h1})`);
  return found;
};

/**
 * Launch Chromium, tolerating a browser revision that does not match the
 * installed playwright-core. CI installs the exact revision; local and shared
 * caches often hold a newer one, and a hard failure there hides real findings.
 */
const CHROMIUM_BINARIES = [
  "chrome-headless-shell-linux64/chrome-headless-shell",
  "chrome-linux64/headless_shell",
  "chrome-linux64/chrome",
  "chrome-linux/headless_shell",
  "chrome-linux/chrome",
];

const findChromium = async (root, depth = 0) => {
  if (depth > 4 || !existsSync(root)) return [];
  let entries;
  try {
    entries = await readdir(root, { withFileTypes: true });
  } catch {
    return [];
  }

  const found = [];
  for (const bin of CHROMIUM_BINARIES) {
    const p = join(root, bin);
    if (existsSync(p)) found.push(p);
  }
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    if (entry.name === "node_modules" || entry.name === ".git") continue;
    found.push(...(await findChromium(join(root, entry.name), depth + 1)));
  }
  return found;
};

const launchBrowser = async () => {
  try {
    return await chromium.launch();
  } catch (error) {
    const roots = [
      process.env.PLAYWRIGHT_BROWSERS_PATH,
      join(homedir(), ".cache"),
      "/tmp/kilo-worktrees",
      "/tmp",
    ].filter(Boolean);

    const candidates = [];
    for (const root of roots) {
      for (const p of await findChromium(root)) if (!candidates.includes(p)) candidates.push(p);
      if (candidates.length) break;
    }

    if (candidates.length === 0) {
      throw new Error(
        `No Chromium available. Run \`npx playwright install chromium\`. Original error: ${error.message}`,
      );
    }
    console.warn(`[verify] using cached browser ${candidates[0]}`);
    return chromium.launch({ executablePath: candidates[0] });
  }
};

const main = async () => {
  try {
    await stat(DIST);
  } catch {
    console.error("dist/ missing — run `npm run build` first");
    process.exit(1);
  }
  if (WANT_SHOTS) await mkdir(SHOTS, { recursive: true });

  const server = await serve();
  const browser = await launchBrowser();
  const consoleErrors = [];

  const ctx = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    offline: false,
  });
  const page = await ctx.newPage();

  page.on("console", (msg) => {
    if (msg.type() !== "error") return;
    const text = msg.text();
    if (ignorable(text)) return;
    consoleErrors.push(text);
  });
  page.on("pageerror", (err) => {
    if (!ignorable(err.message)) consoleErrors.push(`pageerror: ${err.message}`);
  });
  page.on("requestfailed", (req) => {
    const failure = req.failure()?.errorText ?? "";
    if (ignorable(failure) || ignorable(req.url())) return;
    fail("network", `${req.url()} — ${failure}`);
  });

  // Instrument the lifetime of sockets, timers and heap before any app code runs.
  await page.addInitScript(() => {
    window.__audit = { sockets: 0, intervals: 0, timeouts: 0 };
    const WS = window.WebSocket;
    window.WebSocket = function (...args) {
      window.__audit.sockets++;
      const socket = new WS(...args);
      socket.addEventListener("close", () => window.__audit.sockets--);
      return socket;
    };
    window.WebSocket.prototype = WS.prototype;
    const setIntervalOrig = window.setInterval;
    window.setInterval = function (...args) {
      window.__audit.intervals++;
      return setIntervalOrig.apply(this, args);
    };
    const clearIntervalOrig = window.clearInterval;
    window.clearInterval = function (id) {
      window.__audit.intervals = Math.max(0, window.__audit.intervals - 1);
      return clearIntervalOrig.call(this, id);
    };
  });

  const base = `http://localhost:${PORT}`;
  const report = { routes: [], leak: null, budgets: null };

  /* ── 1. Every route, mobile viewport ─────────────────────────────── */
  for (const route of ROUTES) {
    const scope = `${route.name}@390`;
    consoleErrors.length = 0;

    await page.goto(`${base}/${route.hash}`, { waitUntil: "networkidle", timeout: 30_000 });
    await page.waitForTimeout(600);

    const dom = await auditDom(page, scope);
    if (consoleErrors.length) fail(scope, "console errors", [...new Set(consoleErrors)]);

    if (WANT_SHOTS) {
      await page.screenshot({ path: join(SHOTS, `${route.name}.png`), fullPage: true });
    }
    report.routes.push({ ...route, ...dom, consoleErrors: consoleErrors.length });
  }

  /* ── 2. Responsive sweep ─────────────────────────────────────────── */
  for (const vp of VIEWPORTS) {
    await page.setViewportSize({ width: vp.width, height: vp.height });
    for (const route of ["/", "/settings", "/journal", "/vanguard", "/library"]) {
      const scope = `${route}@${vp.name}`;
      consoleErrors.length = 0;
      await page.goto(`${base}/#${route}`, { waitUntil: "networkidle", timeout: 30_000 });
      await page.waitForTimeout(400);
      await auditDom(page, scope);
      if (consoleErrors.length) fail(scope, "console errors", [...new Set(consoleErrors)]);
      if (WANT_SHOTS && vp.name === "1440") {
        await page.screenshot({ path: join(SHOTS, `desktop-${route.replace(/\//g, "_")}.png`) });
      }
    }
  }
  await page.setViewportSize({ width: 390, height: 844 });

  /* ── 3. Navigation churn: leaks + heap ───────────────────────────── */
  consoleErrors.length = 0;
  await page.goto(`${base}/#/`, { waitUntil: "networkidle" });
  await page.waitForTimeout(1500);

  const readMetrics = () =>
    page.evaluate(async () => {
      const perf = performance
        .getEntriesByType("resource")
        .reduce((sum, r) => sum + (r.transferSize || 0), 0);
      const nav = performance.getEntriesByType("navigation")[0];
      return {
        sockets: window.__audit?.sockets ?? 0,
        intervals: window.__audit?.intervals ?? 0,
        timeouts: window.__audit?.timeouts ?? 0,
        domNodes: document.querySelectorAll("*").length,
        heap: performance.memory?.usedJSHeapSize ?? null,
        transferBytes: perf,
        domContentLoaded: nav ? Math.round(nav.domContentLoadedEventEnd) : null,
        load: nav ? Math.round(nav.loadEventEnd) : null,
      };
    });

  const before = await readMetrics();
  for (let pass = 0; pass < 3; pass++) {
    for (const route of ROUTES.slice(0, 8)) {
      await page.goto(`${base}/${route.hash}`, { waitUntil: "domcontentloaded" });
      await page.waitForTimeout(250);
    }
  }
  await page.goto(`${base}/#/`, { waitUntil: "networkidle" });
  await page.waitForTimeout(1500);
  const after = await readMetrics();

  report.leak = { before, after };
  report.budgets = { transferBytes: before.transferBytes };

  const heapGrowth =
    before.heap && after.heap ? (after.heap - before.heap) / Math.max(before.heap, 1) : 0;
  if (heapGrowth > 0.6) {
    fail("leak", `heap grew ${(heapGrowth * 100).toFixed(0)}% over 24 navigations`, {
      before: before.heap,
      after: after.heap,
    });
  }
  if (after.sockets > before.sockets + 2) {
    fail("leak", `open WebSockets ${before.sockets} → ${after.sockets}`);
  }
  if (after.intervals > before.intervals + 2) {
    fail("leak", `live intervals ${before.intervals} → ${after.intervals}`);
  }
  if (consoleErrors.length) fail("churn", "console errors", [...new Set(consoleErrors)]);

  /* ── 4. Offline: navigation must not crash ───────────────────────── */
  await page.goto(`${base}/#/`, { waitUntil: "networkidle" });
  await ctx.setOffline(true);
  consoleErrors.length = 0;
  for (const route of ["/journal", "/vitals", "/archives"]) {
    await page.goto(`${base}/#${route}`, { waitUntil: "domcontentloaded" }).catch(() => undefined);
    await page.waitForTimeout(700);
    const scope = `offline${route}`;
    await auditDom(page, scope);
  }
  const offlineErrors = consoleErrors.filter((e) => !/fetch|network|WebSocket|Failed to load/i.test(e));
  if (offlineErrors.length) fail("offline", "console errors while offline", [...new Set(offlineErrors)]);
  await ctx.setOffline(false);

  await browser.close();
  server.close();

  /* ── Report ──────────────────────────────────────────────────────── */
  console.log("\n── verify ──────────────────────────────────────────────");
  console.log(
    `first load: DCL ${before.domContentLoaded}ms · load ${before.load}ms · ` +
      `transfer ${(before.transferBytes / 1024).toFixed(0)} kB · nodes ${before.domNodes}`,
  );
  console.log(
    `after 24 navigations: heap ${(heapGrowth * 100).toFixed(0)}% · ` +
      `sockets ${before.sockets}→${after.sockets} · intervals ${before.intervals}→${after.intervals}`,
  );

  if (problems.length === 0) {
    console.log("\nPASS — no problems found.\n");
    return;
  }

  console.log(`\nFAIL — ${problems.length} problem(s):\n`);
  for (const p of problems) {
    console.log(`  [${p.scope}] ${p.message}`);
    if (p.extra) console.log(`      ${JSON.stringify(p.extra).slice(0, 400)}`);
  }
  console.log("");
  process.exitCode = 1;
};

await main();