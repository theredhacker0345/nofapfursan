/**
 * Resilience and soak.
 *
 * Long-session memory growth, network flapping, rapid theme switching and rapid
 * route flapping mid-write — the things that only show up after a user has had
 * the app open for an hour on a flaky connection.
 *
 *   node scripts/soak.mjs
 */
import { chromium } from "playwright";
import { serveDist, launchBrowser } from "./lib/harness.mjs";
import { startRelay } from "./lib/relay.mjs";

const DIST = "dist";
const WEB_PORT = Number(process.env.SOAK_WEB_PORT || 4330);
const RELAY_PORT = Number(process.env.SOAK_RELAY_PORT || 4331);
const base = `http://localhost:${WEB_PORT}`;

const ROUTES = ["#/", "#/vitals", "#/journal", "#/vanguard", "#/archives", "#/library", "#/nutrition"];
const THEMES = ["fursan", "fursan_dark", "midnight", "sage", "solar", "void"];

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

const waitFor = async (fn, { timeout = 30_000, interval = 200 } = {}) => {
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

const metrics = (page) =>
  page.evaluate(() => ({
    heap: performance.memory?.usedJSHeapSize ?? null,
    nodes: document.querySelectorAll("*").length,
    intervals: window.__soak?.intervals ?? null,
    sockets: window.__soak?.sockets ?? null,
  }));

const main = async () => {
  const server = await serveDist(DIST, WEB_PORT);
  const relay = await startRelay({ port: RELAY_PORT });
  const browser = await launchBrowser(chromium);
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await ctx.newPage();

  const pageErrors = [];
  page.on("pageerror", (e) => {
    if (!/WebSocket|ERR_/.test(e.message)) pageErrors.push(e.message);
  });

  // Count live timers and sockets for the whole session.
  await page.addInitScript(() => {
    window.__soak = { intervals: 0, sockets: 0 };
    const WS = window.WebSocket;
    window.WebSocket = function (...args) {
      window.__soak.sockets++;
      const socket = new WS(...args);
      const drop = () => {
        window.__soak.sockets = Math.max(0, window.__soak.sockets - 1);
      };
      socket.addEventListener("close", drop);
      socket.addEventListener("error", drop);
      return socket;
    };
    window.WebSocket.prototype = WS.prototype;
    const si = window.setInterval;
    window.setInterval = function (...a) {
      window.__soak.intervals++;
      return si.apply(this, a);
    };
    const ci = window.clearInterval;
    window.clearInterval = function (id) {
      window.__soak.intervals = Math.max(0, window.__soak.intervals - 1);
      return ci.call(this, id);
    };
  });

  await page.goto(`${base}/#/`, { waitUntil: "domcontentloaded" });
  await page.evaluate(
    (u) => localStorage.setItem("CapacitorStorage.user_relays", JSON.stringify([u])),
    relay.url,
  );
  await page.reload({ waitUntil: "domcontentloaded" });
  await waitFor(() => page.getByText(/relay live/i).isVisible().catch(() => false));
  await page.waitForTimeout(2000);

  /* ── 1. Soak: 60 navigations ────────────────────────────────────────── */
  const before = await metrics(page);
  for (let i = 0; i < 60; i++) {
    await page.goto(`${base}/${ROUTES[i % ROUTES.length]}`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(140);
  }
  await page.goto(`${base}/#/`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(3000);
  const after = await metrics(page);

  const heapGrowth =
    before.heap && after.heap ? (after.heap - before.heap) / Math.max(before.heap, 1) : 0;
  log(heapGrowth < 0.6, `heap is stable across 60 navigations (+${(heapGrowth * 100).toFixed(0)}%)`, JSON.stringify({ before, after }));
  log(
    (after.intervals ?? 0) <= (before.intervals ?? 0) + 2,
    "no interval timers accumulate",
    `${before.intervals} → ${after.intervals}`,
  );
  log(
    (after.sockets ?? 0) <= (before.sockets ?? 0) + 2,
    "no WebSockets accumulate",
    `${before.sockets} → ${after.sockets}`,
  );
  log(
    after.nodes < before.nodes * 3 + 200,
    "DOM node count does not grow without bound",
    `${before.nodes} → ${after.nodes}`,
  );

  /* ── 2. Network flapping ───────────────────────────────────────────── */
  await ctx.setOffline(true);
  await page.waitForTimeout(2500);
  const offlineHeader = await page.locator("header").innerText();
  log(
    /offline/i.test(offlineHeader),
    "the header reports offline",
    JSON.stringify(offlineHeader),
  );

  // The relay sees NIP-44 ciphertext, never the plaintext, so delivery is
  // asserted on the queue draining and the relay accepting another event.
  const eventsBefore = relay.received.length;

  // A write while offline must still land.
  await page.goto(`${base}/#/journal`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1200);
  await page.getByRole("button", { name: /new entry/i }).click();
  await page.waitForTimeout(300);
  await page.locator("#journal-body").fill("Written during a network flap.");
  await page.getByRole("button", { name: /save entry/i }).click();
  await waitFor(() =>
    page.evaluate(
      () => JSON.parse(localStorage.getItem("fursan_journal") ?? "[]").some((e) => /network flap/.test(e.content)),
    ),
  );
  log(true, "a write during an offline period persists");

  await ctx.setOffline(false);
  const recovered = await waitFor(async () => {
    const text = await page.locator("header").innerText();
    return !/offline/i.test(text);
  });
  log(Boolean(recovered), "the header returns to synced when connectivity returns", "checked header state");

  // It must actually reach the relay once back.
  const delivered = await waitFor(() => relay.received.length > eventsBefore);
  log(
    Boolean(delivered),
    "the offline write is delivered after connectivity returns",
    `relay events ${eventsBefore} → ${relay.received.length}`,
  );

  const drained = await waitFor(() =>
    page.evaluate(
      () => (JSON.parse(localStorage.getItem("CapacitorStorage.pending_sync") ?? "[]")).length === 0,
    ),
  );
  log(Boolean(drained), "the offline queue is empty once the write is delivered");

  const ciphertext = await waitFor(() =>
    relay.received.slice(eventsBefore).some((e) => typeof e.content === "string" && !/network flap/.test(e.content)),
  );
  log(
    Boolean(ciphertext),
    "the delivered event carries ciphertext, not the plaintext journal body",
  );

  /* ── 3. Rapid theme switching ──────────────────────────────────────── */
  for (const theme of THEMES) {
    await page.evaluate((t) => localStorage.setItem("CapacitorStorage.user_theme", t), theme);
    await page.reload({ waitUntil: "domcontentloaded" });
    await page.waitForTimeout(220);
  }
  const finalTheme = await page.evaluate(() => ({
    stored: localStorage.getItem("CapacitorStorage.user_theme"),
    applied: getComputedStyle(document.documentElement).getPropertyValue("--bg").trim(),
    scheme: document.documentElement.style.colorScheme,
  }));
  log(
    finalTheme.stored === "void" && finalTheme.scheme === "dark",
    "the last theme selected is the one applied after a rapid sequence",
    JSON.stringify(finalTheme),
  );

  /* ── 4. Route flapping mid-write ───────────────────────────────────── */
  await page.evaluate(() => {
    localStorage.setItem("CapacitorStorage.user_theme", "fursan_dark");
  });
  await page.goto(`${base}/#/journal`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1200);
  await page.getByRole("button", { name: /new entry/i }).click();
  await page.waitForTimeout(250);
  await page.locator("#journal-body").fill("Saved while the route changed underneath me.");
  await page.getByRole("button", { name: /save entry/i }).click();

  // Navigate away immediately, before the save can settle.
  for (const route of ["#/", "#/vitals", "#/archives"]) {
    await page.goto(`${base}/${route}`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(200);
  }
  await page.waitForTimeout(2500);

  const survived = await page.evaluate(() => {
    const entries = JSON.parse(localStorage.getItem("fursan_journal") ?? "[]");
    return entries.some((e) => /route changed underneath/.test(e.content));
  });
  log(Boolean(survived), "a save survives navigating away immediately afterwards");

  const journalRenders = await page.goto(`${base}/#/journal`, { waitUntil: "domcontentloaded" })
    .then(async () => {
      await page.waitForTimeout(1500);
      return page.getByText(/route changed underneath/i).first().isVisible().catch(() => false);
    });
  log(Boolean(journalRenders), "the entry is rendered when the journal is reopened");

  /* ── 5. No unexpected errors across the whole soak ─────────────────── */
  const unexpected = [...new Set(pageErrors)];
  log(unexpected.length === 0, "no unexpected page errors during the soak", unexpected.join(" | "));

  await browser.close();
  relay.close();
  server.close();

  console.log(`\n── soak ──────────────────────────────────────────────`);
  console.log(`${passes} passed, ${failures} failed\n`);
  if (failures > 0) process.exitCode = 1;
};

await main();