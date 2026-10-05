/**
 * Offline / PWA install test.
 *
 * The service worker used to precache six hand-written URLs, so a cold install
 * that lost the network before visiting a route failed that route's dynamic
 * import and rendered the global "CATASTROPHIC FAILURE" screen. This proves the
 * opposite: install once, go offline, and reach every route including ones never
 * visited.
 *
 *   node scripts/offline.mjs
 */
import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import { serveDist, launchBrowser } from "./lib/harness.mjs";

const DIST = "dist";
const PORT = Number(process.env.OFFLINE_PORT || 4320);
const SHOTS = "scripts/shots/offline";
const WANT_SHOTS = process.argv.includes("--screenshots");

const ALL_ROUTES = [
  "#/",
  "#/vitals",
  "#/journal",
  "#/vanguard",
  "#/archives",
  "#/library",
  "#/nutrition",
  "#/profile",
  "#/settings",
  "#/auth",
  "#/join",
  "#/nope",
];

let failures = 0;
let passes = 0;
const log = (ok, name, detail) => {
  if (ok) {
    passes++;
    console.log(`  ok   ${name}`);
  } else {
    failures++;
    console.log(`  FAIL ${name}${detail ? `\n       ${detail}` : ""}`);
  }
};

const waitFor = async (fn, { timeout = 15_000, interval = 150 } = {}) => {
  const deadline = Date.now() + timeout;
  for (;;) {
    try {
      const value = await fn();
      if (value) return value;
    } catch {
      /* keep polling */
    }
    if (Date.now() > deadline) return false;
    await new Promise((r) => setTimeout(r, interval));
  }
};

const main = async () => {
  if (WANT_SHOTS) await mkdir(SHOTS, { recursive: true });

  const server = await serveDist(DIST, PORT);
  const browser = await launchBrowser(chromium);
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await ctx.newPage();

  const base = `http://localhost:${PORT}`;

  /* ── 1. Cold install: online, service worker activates and precaches ──── */
  await page.goto(`${base}/#/`, { waitUntil: "load" });
  const controlled = await waitFor(async () =>
    page.evaluate(async () => {
      const reg = await navigator.serviceWorker.ready;
      return Boolean(reg.active);
    }),
  );
  log(controlled, "service worker activates after the first visit");

  const cached = await waitFor(async () =>
    page.evaluate(async () => {
      const names = await caches.keys();
      if (!names.length) return false;
      const cache = await caches.open(names[0]);
      const keys = await cache.keys();
      return { name: names[0], count: keys.length };
    }),
  );
  log(
    cached && cached.count >= 20,
    "install precaches the build manifest, not a hand-written list",
    JSON.stringify(cached),
  );

  // A reload puts the page under the worker's control.
  await page.reload({ waitUntil: "load" });
  const isControlled = await page.evaluate(() => Boolean(navigator.serviceWorker.controller));
  log(isControlled, "page is controlled by the service worker");

const manifest = await page.evaluate(async () => {
    const res = await fetch("/sw.js");
    const text = await res.text();
    const marker = "const PRECACHE = ";
    const start = text.indexOf(marker);
    if (start < 0) return null;
    const from = start + marker.length;
    const end = text.indexOf("\n];", from);
    if (end < 0) return null;
    return JSON.parse(text.slice(from, end + 2));
  });
  log(
    Array.isArray(manifest) && manifest.length > 20,
    "service worker manifest lists every built asset",
    `entries=${manifest?.length}`,
  );

  /* ── 2. Go offline and reach every route, including unvisited ones ────── */
  await ctx.setOffline(true);

  for (const route of ALL_ROUTES) {
    const errors = [];
    const onError = (e) => errors.push(e.message);
    page.on("pageerror", onError);

    await page.goto(`${base}/${route}`, { waitUntil: "domcontentloaded" }).catch((e) =>
      errors.push(String(e)),
    );
    await page.waitForTimeout(1200);

    const rendered = await page.evaluate(() => {
      const main = document.querySelector("main") ?? document.body;
      return {
        text: (main.innerText ?? "").trim().length,
        heading: document.querySelector("h1")?.textContent?.trim() ?? "",
        catastrophic: /CATASTROPHIC|Boot Error|Something broke/i.test(document.body.innerText),
      };
    });

    const ok = rendered.text > 0 && !rendered.catastrophic;
    log(ok, `offline: ${route} renders from cache`, JSON.stringify(rendered).slice(0, 160));
    log(
      !errors.some((e) => /Failed to fetch|dynamically imported module|Importing a module/i.test(e)),
      `offline: ${route} resolves its chunk`,
      errors.find((e) => !/WebSocket|ERR_INTERNET|Failed to load resource/i.test(e)) ?? "",
    );

    if (WANT_SHOTS) await page.screenshot({ path: join(SHOTS, `${route.replace(/[#/]/g, "_")}.png`) });
    page.off("pageerror", onError);
  }

  /* ── 3. Offline writes still work and still queue ─────────────────────── */
  await page.goto(`${base}/#/journal`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(900);
  await page.getByRole("button", { name: /new entry/i }).click();
  await page.waitForTimeout(250);
  await page.locator("#journal-body").fill("Written with the network switched off entirely.");
  await page.getByRole("button", { name: /save entry/i }).click();

  const stored = await waitFor(async () =>
    page.evaluate(() => JSON.parse(localStorage.getItem("fursan_journal") ?? "[]").length > 0),
  );
  log(stored, "offline: a write persists with the network off");

  const queued = await waitFor(async () =>
    page.evaluate(() => {
      const q = JSON.parse(localStorage.getItem("CapacitorStorage.pending_sync") ?? "[]");
      return q.length > 0;
    }),
  );
  log(queued, "offline: the write is queued for later delivery");

  /* ── 4. Reconnect keeps retrying without growing the queue ──────────────
     Relays are unreachable in this sandbox, so the queue correctly does NOT
     drain. What matters is that retry attempts happen, retryCount is persisted
     across sessions, and the queue stays bounded — the original bug was an
     unbounded queue whose retry counter was never written anywhere. */
  const before = await page.evaluate(
    () => JSON.parse(localStorage.getItem("CapacitorStorage.pending_sync") ?? "[]"),
  );

  await ctx.setOffline(false);
  await page.waitForTimeout(30_000);

  const after = await page.evaluate(
    () => JSON.parse(localStorage.getItem("CapacitorStorage.pending_sync") ?? "[]"),
  );

  log(
    after.length <= before.length,
    "reconnect does not grow the offline queue",
    `${before.length} → ${after.length}`,
  );
  log(
    after.every((e) => typeof e.retryCount === "number" && e.retryCount >= 1),
    "retryCount is persisted so retries are bounded across sessions",
    JSON.stringify(after.map((e) => e.retryCount)),
  );
  log(
    after.length <= 200,
    "the queue stays inside its hard cap",
    `entries=${after.length}`,
  );

  await browser.close();
  server.close();

  console.log(`\n── offline ───────────────────────────────────────────`);
  console.log(`${passes} passed, ${failures} failed\n`);
  if (failures > 0) process.exitCode = 1;
};

await main();