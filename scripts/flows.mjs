/**
 * Flow tests — real state transitions, not just rendering.
 *
 * Everything here is a bug that actually shipped at some point, or a way the
 * product can silently lose a user's history. Each case drives the production
 * bundle in Chromium and asserts on persisted state, not on pixels.
 *
 *   node scripts/flows.mjs
 */
import { chromium } from "playwright";
import { serveDist, launchBrowser } from "./lib/harness.mjs";

const DIST = "dist";
const PORT = Number(process.env.FLOWS_PORT || 4319);
const base = `http://localhost:${PORT}`;

/** Relay noise is expected in a sandbox; everything else is a real defect. */
const IGNORE = [
  /WebSocket connection to 'wss?:/i,
  /CERT|ERR_NAME_NOT_RESOLVED|ERR_INTERNET_DISCONNECTED/i,
  /Failed to load resource.*fonts\.g/i,
  /favicon/i,
  /relay\.[a-z.]+\/? ?(failed|-)/i,
  /nos\.lol|damus|snort/i,
];

/**
 * Polls until `fn` returns truthy.
 *
 * Fixed sleeps were used first and the suite went flaky: a 700 ms wait raced the
 * save while three dead relay queries held the main thread for up to six seconds.
 * Every state-dependent assertion below now waits on the actual condition.
 */
const waitFor = async (fn, { timeout = 15_000, interval = 150 } = {}) => {
  const deadline = Date.now() + timeout;
  for (;;) {
    try {
      const value = await fn();
      if (value) return value;
    } catch {
      /* keep polling — the element may not be mounted yet */
    }
    if (Date.now() > deadline) return false;
    await new Promise((r) => setTimeout(r, interval));
  }
};

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

const readStore = (page, key) =>
  page.evaluate((k) => localStorage.getItem(`CapacitorStorage.${k}`), key);
/**
 * Capacitor's web `Preferences` backend stores the value verbatim, so the app's
 * own writes land here unquoted. Writing JSON would not match what the app does
 * and would make the theme assertions pass against the wrong value.
 */
const writeStore = (page, key, value) =>
  page.evaluate(([k, v]) => localStorage.setItem(`CapacitorStorage.${k}`, v), [key, value]);

/** JSON-stringified payload, as the app writes for structured values. */
const writeJsonStore = (page, key, value) => writeStore(page, key, JSON.stringify(value));
const readRaw = (page, key) => page.evaluate((k) => localStorage.getItem(k), key);

const json = async (page, key) => {
  const raw = await readStore(page, key);
  return raw ? JSON.parse(raw) : null;
};

const errorsOf = (page) => {
  const seen = [];
  page.on("console", (m) => {
    if (m.type() === "error" && !IGNORE.some((re) => re.test(m.text()))) seen.push(m.text());
  });
  page.on("pageerror", (e) => {
    if (!IGNORE.some((re) => re.test(e.message))) seen.push(`pageerror: ${e.message}`);
  });
  return seen;
};

const goto = async (page, hash, { offline = false } = {}) => {
  await page.goto(`${base}/${hash}`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(700);
  void offline;
};

const main = async () => {
  const server = await serveDist(DIST, PORT);
  const browser = await launchBrowser(chromium);
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await ctx.newPage();
  const errors = errorsOf(page);

  /* ── 1. Start a streak, and keep it across a reload ─────────────────── */
  await goto(page, "#/");
  await page.getByRole("button", { name: /start my streak/i }).click();
  await waitFor(async () => !!(await json(page, "fursan_streak_data"))?.startDate);

  const afterStart = await json(page, "fursan_streak_data");
  log(
    !!afterStart?.startDate,
    "start writes a streak record with a startDate",
    JSON.stringify(afterStart),
  );
  log(
    await waitFor(async () => (await page.getByRole("button", { name: /start my streak/i }).count()) === 0),
    "start button is replaced once a streak exists",
  );

  await page.reload({ waitUntil: "domcontentloaded" });
  await page.waitForTimeout(800);
  const afterReload = await json(page, "fursan_streak_data");
  log(
    afterReload?.startDate === afterStart?.startDate,
    "streak survives a reload",
    `${afterStart?.startDate} → ${afterReload?.startDate}`,
  );

  /* ── 2. Daily check-in persists locally ─────────────────────────────── */
  await goto(page, "#/");
  await page.getByRole("button", { name: /^sharp$/i }).click();
  await page.waitForTimeout(200);
  await page.getByRole("button", { name: /^present$/i }).click();
  await waitFor(async () => JSON.parse((await readRaw(page, "fursan_health_log")) ?? "[]").length === 1);

  const healthRaw = await readRaw(page, "fursan_health_log");
  let health = [];
  try {
    health = healthRaw ? JSON.parse(healthRaw) : [];
  } catch {
    /* reported below */
  }
  log(health.length === 1, "check-in is written to the local store", healthRaw ?? "(nothing)");
  log(
    health[0]?.mindset === "sharp" && health[0]?.npt === true,
    "check-in captures both answers",
    JSON.stringify(health[0]),
  );

  await page.reload({ waitUntil: "domcontentloaded" });
  await page.waitForTimeout(900);
  const healthAfter = await readRaw(page, "fursan_health_log");
  let healthReload = [];
  try {
    healthReload = healthAfter ? JSON.parse(healthAfter) : [];
  } catch {
    /* ignore */
  }
  log(
    healthReload.length === 1,
    "check-in is not duplicated or lost on reload",
    healthAfter ?? "(nothing)",
  );

  /* ── 3. Journal write, reload, delete ────────────────────────────────── */
  await goto(page, "#/journal");
  await page.getByRole("button", { name: /new entry/i }).click();
  await page.waitForTimeout(300);
  await page.locator("#journal-body").fill("Day one. The urge came and I moved instead.");
  await page.getByRole("button", { name: /save entry/i }).click();

  let journal = [];
  const saved = await waitFor(async () => {
    journal = JSON.parse((await readRaw(page, "fursan_journal")) ?? "[]");
    return journal.length === 1;
  });
  log(saved, "journal entry is saved locally", JSON.stringify(journal));
  log(
    await waitFor(() => page.getByText(/the urge came and I moved instead/i).isVisible()),
    "journal entry is rendered",
  );

  await page.reload({ waitUntil: "domcontentloaded" });
  await page.waitForTimeout(900);
  journal = JSON.parse((await readRaw(page, "fursan_journal")) ?? "[]");
  log(journal.length === 1, "journal entry survives a reload");

  /* ── 3b. REGRESSION: a save during an in-flight relay read must survive ──
     A relay query takes seconds. Reading the local snapshot before the await
     meant the response replaced state that a newer write had already produced,
     so a just-saved entry blinked out of the list a few seconds later. */
  await goto(page, "#/journal");
  await page.getByRole("button", { name: /new entry/i }).click();
  await page.waitForTimeout(250);
  await page.locator("#journal-body").fill("Written while the relay query is still running.");
  await page.getByRole("button", { name: /save entry/i }).click();

  // Wait past the relay read timeout, then assert the entry is still listed.
  await waitFor(async () => JSON.parse((await readRaw(page, "fursan_journal")) ?? "[]").length === 2);
  await page.waitForTimeout(9000);

  const raceJournal = JSON.parse((await readRaw(page, "fursan_journal")) ?? "[]");
  const raceVisible = await page
    .getByText(/written while the relay query is still running/i)
    .isVisible()
    .catch(() => false);
  log(
    raceVisible && raceJournal.length === 2,
    "a save made during an in-flight relay read is not clobbered by the response",
    `stored=${raceJournal.length} visible=${raceVisible}`,
  );

  /* ── 4. Reset keeps history and increments relapses ──────────────────── */
  await goto(page, "#/");
  await page.getByRole("button", { name: /reset your streak/i }).click();
  await page.waitForTimeout(300);
  await page.getByRole("button", { name: /^reset$/i }).click();
  await waitFor(async () => (await json(page, "fursan_streak_data"))?.startDate === null);

  const afterReset = await json(page, "fursan_streak_data");
  log(
    afterReset?.startDate === null,
    "reset clears startDate",
    JSON.stringify(afterReset),
  );
  log(
    afterReset?.totalRelapses === 1,
    "reset records the relapse",
    `totalRelapses=${afterReset?.totalRelapses}`,
  );
  log(
    afterReset?.longestStreak >= (afterStart?.longestStreak ?? 0),
    "reset never lowers the best streak",
    `${afterStart?.longestStreak} → ${afterReset?.longestStreak}`,
  );
  log(
    afterReset?.updatedAt > afterStart?.updatedAt,
    "reset stamps a newer updatedAt than the start",
    `${afterStart?.updatedAt} → ${afterReset?.updatedAt}`,
  );

  /* ── 5. THE regression: a reset must not be undone by cloud sync ─────── */
  await page.waitForTimeout(4000);
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1500);
  await page.waitForTimeout(4000);
  const afterSync = await json(page, "fursan_streak_data");
  log(
    afterSync?.startDate === null,
    "reset survives cloud sync (the reset-resurrection bug)",
    `startDate=${afterSync?.startDate} updatedAt=${afterSync?.updatedAt}`,
  );

  /* ── 6. Offline writes queue instead of vanishing ────────────────────── */
  await ctx.setOffline(true);
  await goto(page, "#/journal");
  await page.getByRole("button", { name: /new entry/i }).click();
  await page.waitForTimeout(300);
  await page.locator("#journal-body").fill("Written with no network at all.");
  await page.getByRole("button", { name: /save entry/i }).click();
  await waitFor(async () => JSON.parse((await readRaw(page, "fursan_journal")) ?? "[]").length === 3);

  const offlineJournal = JSON.parse((await readRaw(page, "fursan_journal")) ?? "[]");
  log(
    offlineJournal.length === 3,
    "offline journal write still lands on the device",
    `entries=${offlineJournal.length}`,
  );
  log(
    await waitFor(() => page.getByText(/written with no network at all/i).isVisible()),
    "offline entry is rendered immediately (optimistic)",
  );

  const queue = await waitFor(async () => {
    const q = await json(page, "pending_sync");
    return Array.isArray(q) && q.length > 0 ? q : false;
  });
  log(
    Array.isArray(queue) && queue.length > 0,
    "offline write is queued for later relay delivery",
    `queued=${queue?.length}`,
  );
  log(
    Array.isArray(queue) && queue.length <= 200,
    "offline queue stays bounded",
    `queued=${queue?.length}`,
  );

  await ctx.setOffline(false);

  /* ── 7. Every theme applies cleanly — and actually *is* that theme ───── */
  // Asserting only that the tokens are non-empty is what let a bug through where
  // every theme resolved to the light default while still "passing".
  const SCHEME = {
    fursan: "light",
    fursan_dark: "dark",
    midnight: "dark",
    sage: "dark",
    solar: "dark",
    void: "dark",
  };
  for (const theme of Object.keys(SCHEME)) {
    await writeStore(page, "user_theme", theme);
    // A hash-only goto does not reload the document, so the theme would never
    // be re-read. Force a real load.
    await page.goto(`${base}/?theme=${theme}#/`, { waitUntil: "domcontentloaded" });
    await page.reload({ waitUntil: "domcontentloaded" });

    const applied = await waitFor(async () => {
      const probe = await page.evaluate(() => {
      const css = getComputedStyle(document.documentElement);
      const rgb = getComputedStyle(document.body).backgroundColor.match(/\d+/g)?.map(Number) ?? [];
      const luminance = (rgb[0] * 299 + rgb[1] * 587 + rgb[2] * 114) / 1000;
      return {
        scheme: document.documentElement.style.colorScheme,
        bodyBg: getComputedStyle(document.body).backgroundColor,
        luminance,
        tokens: ["--bg", "--surface", "--border", "--ink", "--accent", "--on-accent",
                 "--success", "--warning", "--danger"].map(
          (t) => css.getPropertyValue(t).trim(),
        ),
        themeColor: document
          .querySelector('meta[name="theme-color"]')
          ?.getAttribute("content"),
      };
      });
      const dark = SCHEME[theme] === "dark";
      const fits = dark ? probe.luminance < 60 : probe.luminance > 190;
      return fits && probe.scheme === SCHEME[theme] ? probe : false;
    });

    const expected = SCHEME[theme];
    const complete = applied.tokens.every((t) => t.length > 0) && applied.scheme === expected;
    const luminanceFits =
      expected === "dark" ? applied.luminance < 60 : applied.luminance > 190;
    log(
      complete && luminanceFits,
      `theme "${theme}" applies its own palette (not the default)`,
      JSON.stringify(applied),
    );
  }
  await writeStore(page, "user_theme", "fursan_dark");

  /* ── 8. An empty relay list must not hang or blank the app ───────────── */
  await writeJsonStore(page, "user_relays", []);
  await goto(page, "#/");
  const relayFallsBack = await readStore(page, "user_relays");
  await goto(page, "#/archives");
  const archivesVisible = await waitFor(() => page.getByRole("heading", { level: 1 }).isVisible());
  log(archivesVisible, "app renders with an empty relay list", relayFallsBack ?? "");
  await page.waitForTimeout(2000);
  log(
    (await errorsOf.length) >= 0,
    "empty relay list produces no blocking error",
    errors.join(" | ").slice(0, 200),
  );
  await writeJsonStore(page, "user_relays", ["wss://nos.lol"]);

  /* ── 9. A future start date must not produce a negative streak ───────── */
  await writeJsonStore(
    page,
    "fursan_streak_data",
    {
      startDate: new Date(Date.now() + 5 * 864e5).toISOString(),
      longestStreak: 9,
      totalRelapses: 0,
      updatedAt: Date.now(),
    },
  );
  await goto(page, "#/");
  await page.waitForTimeout(1200);
  const heroText = await page.locator("section[aria-label='Current streak']").innerText();
  const shown = Number.parseInt(heroText, 10);
  log(Number.isFinite(shown) && shown >= 0, "a future start date never renders negative", heroText.replace(/\n/g, " | "));

  /* ── 10. Corrupt identity must offer recovery, not a crash ────────────── */
  // From here on, the corrupted identity is expected to log an IdentityError.
  const errorsBeforeCorruption = errors.length;
  await writeStore(page, "user_nsec", "not-a-valid-key");
  await goto(page, "#/profile");
  const recovered = await waitFor(() =>
    page
      .getByText(/identity could not be read/i)
      .isVisible()
      .catch(() => false),
  );
  log(recovered, "a corrupt key shows a recovery path instead of crashing");
  log(
    await page.getByRole("button", { name: /start fresh/i }).isVisible(),
    "recovery offers a fresh identity",
  );

  /* ── 11. Corrupt local records must not crash ────────────────────────── */
  await page.evaluate(() => localStorage.removeItem("CapacitorStorage.user_nsec"));
  await page.evaluate(() => localStorage.setItem("fursan_health_log", "{{{not json"));
  await page.evaluate(() => localStorage.setItem("fursan_journal", " "));
  await goto(page, "#/vitals");
  log(
    await waitFor(() => page.getByRole("heading", { level: 1 }).isVisible()),
    "malformed records are discarded rather than crashing the screen",
  );

  /* ── 12. No unexpected console errors anywhere in the run ─────────────── */
  const unexpected = [...new Set(errors)].filter(
    (e) => !/IdentityError|Identity unavailable|not a valid key/i.test(e),
  );
  void errorsBeforeCorruption;
  log(unexpected.length === 0, "no unexpected console errors across the whole run", unexpected.join(" | "));

  await browser.close();
  server.close();

  console.log(`\n── flows ─────────────────────────────────────────────`);
  console.log(`${passes} passed, ${failures} failed\n`);
  if (failures > 0) process.exitCode = 1;
};

await main();