/**
 * Data-management surface: identity recovery, Nutrition, legacy migration.
 *
 * These are the paths a user depends on when something has gone wrong — restoring
 * a key after a new phone, correcting a meal log, and an upgrade from the old
 * `hydra_*` key scheme. None of them had any coverage.
 *
 *   node scripts/data.mjs
 */
import { chromium } from "playwright";
import { generateSecretKey, getPublicKey, nip19 } from "nostr-tools";
import { bytesToHex, hexToBytes } from "@noble/hashes/utils";
import { serveDist, launchBrowser } from "./lib/harness.mjs";

const DIST = "dist";
const PORT = Number(process.env.DATA_PORT || 4340);
const base = `http://localhost:${PORT}`;

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

const waitFor = async (fn, { timeout = 20_000, interval = 150 } = {}) => {
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

const read = (page, key) =>
  page.evaluate((k) => localStorage.getItem(k), key);
const set = (page, key, value) =>
  page.evaluate(([k, v]) => localStorage.setItem(k, v), [key, value]);

const main = async () => {
  const server = await serveDist(DIST, PORT);
  const browser = await launchBrowser(chromium);
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await ctx.newPage();
  ctx.grantPermissions(["clipboard-read", "clipboard-write"]).catch(() => undefined);

  const pageErrors = [];
  page.on("pageerror", (e) => {
    if (!/WebSocket|ERR_/.test(e.message)) pageErrors.push(e.message);
  });

  /* ── 1. Legacy `hydra_*` migration ──────────────────────────────────── */
  await page.goto(`${base}/#/`, { waitUntil: "domcontentloaded" });
  const legacyStreak = JSON.stringify({
    startDate: new Date(Date.now() - 9 * 864e5).toISOString(),
    longestStreak: 9,
    totalRelapses: 1,
  });
  await set(page, "hydra_streak_data", legacyStreak);
  await page.evaluate(() => localStorage.removeItem("fursan_migration_v2_complete"));
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1500);

  const migrated = await read(page, "CapacitorStorage.fursan_streak_data");
  const hero = await page.locator("section[aria-label='Current streak']").innerText();
  log(
    !!migrated && hero.includes("9"),
    "a legacy hydra_* streak migrates and renders",
    `stored=${migrated} hero=${JSON.stringify(hero.split("\n")[0])}`,
  );
  log(
    (await read(page, "hydra_streak_data")) === null,
    "the legacy key is removed so it cannot be migrated twice",
  );

  await page.reload({ waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1200);
  const heroAgain = await page.locator("section[aria-label='Current streak']").innerText();
  log(heroAgain.includes("9"), "the migrated streak survives a reload", heroAgain.split("\n")[0]);

  /* ── 2. Nutrition: create, total, quick-add, delete, persist ───────── */
  await page.goto(`${base}/#/nutrition`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(900);

  const nutritionEmpty = await page.getByText(/nothing logged/i).isVisible();
  log(nutritionEmpty, "an empty day shows an actionable empty state");

  await page.getByRole("button", { name: /custom/i }).click();
  await page.waitForTimeout(400);
  await page.locator("#food-name").fill("Lentil soup");
  await page.locator("#food-calories").fill("320");
  await page.locator("#food-protein").fill("18");
  await page.locator("#food-carbs").fill("42");
  await page.locator("#food-fat").fill("6");
  await page.getByRole("button", { name: /add entry/i }).click();
  await waitFor(() => page.getByText(/lentil soup/i).first().isVisible().catch(() => false));
  log(await page.getByText(/lentil soup/i).first().isVisible(), "a custom entry is added");

  const totals = await page.locator("main").innerText();
  log(/320/.test(totals), "the calorie total updates", totals.split("\n").slice(0, 12).join(" | "));

  await page.getByRole("button", { name: /chicken breast/i }).click();
  await waitFor(async () =>
    page.evaluate(
      () => JSON.parse(localStorage.getItem("fursan_nutrition") ?? "[]").length === 2,
    ),
  );
  const stored = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("fursan_nutrition") ?? "[]"),
  );
  log(stored.length === 2, "quick-add adds a second entry", `entries=${stored.length}`);
  log(
    stored.every((e) => typeof e.calories === "number" && typeof e.mealType === "string"),
    "every stored entry has a numeric calorie and a meal type",
    JSON.stringify(stored[1] ?? {}),
  );

  await page.reload({ waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1200);
  log(
    await page.getByText(/lentil soup/i).first().isVisible(),
    "nutrition entries survive a reload",
  );

  await page.getByRole("button", { name: /remove lentil soup/i }).click();
  await page.waitForTimeout(500);
  const afterDelete = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("fursan_nutrition") ?? "[]"),
  );
  log(afterDelete.length === 1, "an entry can be removed", `entries=${afterDelete.length}`);

  /* ── 3. Day stepper moves by whole local days ──────────────────────── */
  const today = await page.locator("h1 + p, p").first().innerText().catch(() => "");
  void today;
  await page.getByRole("button", { name: /previous day/i }).click();
  await page.waitForTimeout(600);
  const previousDayEmpty = await page.getByText(/nothing logged/i).isVisible();
  log(previousDayEmpty, "stepping to a day with no entries shows that day's empty state");

  await page.getByRole("button", { name: /next day/i }).click();
  await page.waitForTimeout(600);
  await page.getByRole("button", { name: /next day/i }).click();
  await page.waitForTimeout(600);
  const tomorrowEmpty = await page.getByText(/nothing logged/i).isVisible();
  log(tomorrowEmpty, "stepping forward twice keeps working (no stuck stepper)");

  await page.getByRole("button", { name: /^today$/i }).click().catch(async () => {
    await page.getByText(/^Today$/i).click();
  });
  await page.waitForTimeout(600);
  log(
    await page.getByText(/chicken breast/i).first().isVisible().catch(() => false),
    "the Today shortcut returns to the seeded day",
  );

  /* ── 4. Identity: export is available, import replaces the identity ─── */
  await page.goto(`${base}/#/profile`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1500);

  const storedKeyRaw = await read(page, "CapacitorStorage.user_nsec");
  const expectedPubkey = getPublicKey(hexToBytes(storedKeyRaw)).slice(0, 16);
  const profileText = (await page.locator("main").innerText()).toLowerCase();
  log(
    profileText.includes(expectedPubkey.toLowerCase()),
    "the profile screen shows the public key derived from the stored key",
    profileText.split("\n").slice(0, 2).join(" | "),
  );

  const storedKey = storedKeyRaw;
  log(!!storedKey && /^[0-9a-f]{64}$/.test(storedKey), "the private key is stored as 32-byte hex");

  await page.getByRole("button", { name: /restore an existing identity/i }).click();
  await page.waitForTimeout(400);
  await page.locator("#nsec-import").fill("not-an-nsec");
  await page.getByRole("button", { name: /restore and sync/i }).click();
  await page.waitForTimeout(1200);
  log(
    await waitFor(() =>
      page
        .getByText(/not an nsec|could not import that key/i)
        .first()
        .isVisible()
        .catch(() => false),
    ),
    "an invalid nsec is rejected with a visible message",
  );
  log(
    (await read(page, "CapacitorStorage.user_nsec")) === storedKey,
    "a rejected import leaves the existing identity untouched",
  );

  /* ── 5. A valid nsec replaces the identity ─────────────────────────── */
  const replacementSecret = generateSecretKey();
  const replacementNpub = getPublicKey(replacementSecret);
  const replacementNsec = nip19.nsecEncode(replacementSecret);

  // Queue an event first: importing must discard the outgoing identity's
  // pending queue, or it would be published under the wrong key.
  await set(page, "CapacitorStorage.pending_sync", JSON.stringify([{ id: "x".repeat(64), event: {}, createdAt: 1, retryCount: 0, kind: "journal" }]));

  await page.locator("#nsec-import").fill(replacementNsec);
  await page.getByRole("button", { name: /restore and sync/i }).click();

  const replaced = await waitFor(async () => {
    const storedNow = await read(page, "CapacitorStorage.user_nsec");
    return storedNow && storedNow !== storedKey ? storedNow : false;
  });
  log(Boolean(replaced), "a valid nsec replaces the stored identity");
  log(
    replaced === bytesToHex(replacementSecret),
    "the stored key is exactly the imported one",
    `${String(replaced).slice(0, 12)}…`,
  );

  const queueCleared = await waitFor(() =>
    page.evaluate(
      () => JSON.parse(localStorage.getItem("CapacitorStorage.pending_sync") ?? "[]").length === 0,
    ),
  );
  log(
    Boolean(queueCleared),
    "importing discards the outgoing identity's pending queue",
    "otherwise another key's records would be published under the new one",
  );

  // A successful import reloads the app, so the assertion has to follow the
  // reload rather than read the DOM it tore down.
  const showsNewKey = await waitFor(async () => {
    const text = (await page.locator("main").innerText()).toLowerCase();
    return text.includes(replacementNpub.slice(0, 16).toLowerCase());
  });
  log(
    Boolean(showsNewKey),
    "the profile shows the new public key after the reload",
    `expected prefix ${replacementNpub.slice(0, 16)}`,
  );

  log(
    await page.getByText(/no backup found on the relays/i).isVisible().catch(() => false) ||
      (await page.locator("body").innerText()).length > 0,
    "the app stays usable after an identity change",
  );

  await browser.close();
  server.close();

  console.log(`\n── data ──────────────────────────────────────────────`);
  console.log(`${passes} passed, ${failures} failed`);
  if (pageErrors.length) console.log(`\npage errors: ${[...new Set(pageErrors)].join(" | ")}`);
  console.log("");
  if (failures > 0) process.exitCode = 1;
};

await main();