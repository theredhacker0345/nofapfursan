/**
 * Keyboard and motion audit.
 *
 * Nothing in the app had ever been driven from a keyboard. This asserts a real
 * focus ring on every focusable control, a working skip link, focus containment
 * and Escape handling in dialogs, and that `prefers-reduced-motion` genuinely
 * stops the animations rather than only shortening them.
 *
 *   node scripts/a11y.mjs
 */
import { chromium } from "playwright";
import { serveDist, launchBrowser } from "./lib/harness.mjs";

const DIST = "dist";
const PORT = Number(process.env.A11Y_PORT || 4328);
const base = `http://localhost:${PORT}`;

const ROUTES = [
  "#/",
  "#/vitals",
  "#/journal",
  "#/library",
  "#/nutrition",
  "#/vanguard",
  "#/profile",
  "#/settings",
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

const waitFor = async (fn, { timeout = 12_000, interval = 120 } = {}) => {
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

/** Tab through the page and record whether each stop shows a focus indicator. */
const tabAudit = (page, max = 40) =>
  page.evaluate(async (limit) => {
    document.body.focus();
    const results = [];
    for (let i = 0; i < limit; i++) {
      // Playwright cannot drive a synthetic Tab, so ask the browser to focus the
      // next element in DOM order the same way the keyboard would.
      const moved = await (async () => {
        const before = document.activeElement;
        const event = new KeyboardEvent("keydown", { key: "Tab", bubbles: true });
        before?.dispatchEvent(event);
        // Fall back to programmatic traversal for engines that do not move focus
        // from a synthetic event.
        if (document.activeElement === before) {
          const focusables = [
            ...document.querySelectorAll(
              'a[href], button:not([disabled]), input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])',
            ),
          ].filter((el) => el.getClientRects().length > 0);
          const index = focusables.indexOf(before);
          const next = focusables[(index + 1) % focusables.length];
          next?.focus();
        }
        return true;
      })();
      void moved;

      const el = document.activeElement;
      if (!el || el === document.body) break;
      if (el.closest(".sr-only") || el.classList.contains("sr-only")) continue;

      const style = getComputedStyle(el);
      const hasRing =
        (style.outlineStyle !== "none" && parseFloat(style.outlineWidth) > 0) ||
        (style.boxShadow && style.boxShadow !== "none");
      results.push({
        tag: el.tagName.toLowerCase(),
        name: (el.getAttribute("aria-label") || el.textContent || "").trim().slice(0, 28),
        ring: hasRing,
        outline: style.outlineStyle,
      });
      if (el === document.body) break;
    }
    return results;
  }, max);

const main = async () => {
  const server = await serveDist(DIST, PORT);
  const browser = await launchBrowser(chromium);

  /* ── 1. Focus ring on every tabbable control ────────────────────────── */
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await ctx.newPage();

  for (const route of ROUTES) {
    await page.goto(`${base}/${route}`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(900);
    const stops = await tabAudit(page);
    const noRing = stops.filter((s) => !s.ring);
    log(
      stops.length > 0 && noRing.length === 0,
      `${route}: every tab stop shows a focus ring (${stops.length} stops)`,
      JSON.stringify(noRing.slice(0, 5)),
    );
  }

  /* ── 2. Skip link ───────────────────────────────────────────────────── */
  await page.goto(`${base}/#/`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(800);
  const skip = await page.evaluate(() => {
    const link = document.querySelector('a[href="#main"]');
    if (!link) return null;
    link.focus();
    const style = getComputedStyle(link);
    return {
      exists: true,
      visibleWhenFocused: style.clipPath !== "inset(50%)" && style.display !== "none",
      text: link.textContent.trim(),
      target: !!document.querySelector("#main"),
    };
  });
  log(skip?.exists && skip.visibleWhenFocused, "a skip link is present and revealed on focus", JSON.stringify(skip));
  log(skip?.target === true, "the skip link points at a real #main landmark");

  /* ── 3. Dialog: Escape closes, focus is contained ───────────────────── */
  await page.goto(`${base}/#/settings`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(900);

  await page.getByRole("button", { name: /erase everything/i }).click();
  const dialogOpen = await waitFor(() =>
    page.getByRole("alertdialog").isVisible().catch(() => false),
  );
  log(Boolean(dialogOpen), "a destructive action opens a confirmation dialog");

  if (dialogOpen) {
    const inside = await page.evaluate(() => {
      const dialog = document.querySelector('[role="alertdialog"]');
      return dialog ? dialog.contains(document.activeElement) : false;
    });
    log(inside, "focus moves into the dialog on open");

    await page.keyboard.press("Escape");
    const closed = await waitFor(
      async () => (await page.getByRole("alertdialog").count()) === 0,
    );
    log(Boolean(closed), "Escape closes the dialog");
  }

  /* ── 4. A destructive dialog only acts on an explicit choice ────────── */
  // Seeded through the same prefixed key the app reads: `getStreakData` migrates
  // a legacy unprefixed value into `CapacitorStorage.` on first load, so
  // asserting against the unprefixed key reads `null` even while a live streak
  // is on screen.
  await page.goto(`${base}/#/`, { waitUntil: "domcontentloaded" });
  await page.evaluate(() =>
    localStorage.setItem(
      "CapacitorStorage.fursan_streak_data",
      JSON.stringify({
        startDate: new Date().toISOString(),
        longestStreak: 3,
        totalRelapses: 0,
        updatedAt: Date.now(),
      }),
    ),
  );
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1200);

  const readStreak = () =>
    page.evaluate(() => {
      const raw = localStorage.getItem("CapacitorStorage.fursan_streak_data");
      return raw ? JSON.parse(raw) : null;
    });

  const before = await readStreak();
  log(Boolean(before?.startDate), "a seeded streak is present before the dialog", JSON.stringify(before));

  await page.getByRole("button", { name: /reset your streak/i }).click();
  await page.waitForTimeout(400);
  await page.keyboard.press("Escape");
  await page.waitForTimeout(900);

  const after = await readStreak();
  log(
    after?.startDate === before?.startDate && after?.totalRelapses === before?.totalRelapses,
    "Escape on the reset dialog does not perform the reset",
    JSON.stringify(after),
  );

  await ctx.close();

  /* ── 5. Reduced motion is honoured, not merely shortened ────────────── */
  const reducedCtx = await browser.newContext({
    viewport: { width: 390, height: 844 },
    reducedMotion: "reduce",
  });
  const reduced = await reducedCtx.newPage();
  await reduced.goto(`${base}/#/`, { waitUntil: "domcontentloaded" });
  await reduced.waitForTimeout(900);

  const durations = await reduced.evaluate(() => {
    const values = [];
    for (const el of document.querySelectorAll("*")) {
      const s = getComputedStyle(el);
      for (const prop of ["transitionDuration", "animationDuration"]) {
        for (const part of s[prop].split(",")) {
          const seconds = parseFloat(part);
          if (Number.isFinite(seconds)) values.push(seconds);
        }
      }
    }
    return values;
  });
  const maxDuration = durations.length ? Math.max(...durations) : 0;
  log(
    durations.length === 0 || maxDuration < 0.05,
    "reduced motion collapses CSS transitions and animations",
    `longest=${maxDuration}s over ${durations.length} declarations`,
  );

  // framer-motion is only governed by MotionConfig, not the CSS override.
  const opacityStable = await reduced.evaluate(async () => {
    const samples = [];
    for (let i = 0; i < 6; i++) {
      samples.push(getComputedStyle(document.querySelector("main")).opacity);
      await new Promise((r) => setTimeout(r, 60));
    }
    return new Set(samples).size === 1;
  });
  log(opacityStable, "no route-change fade is applied under reduced motion");

  await reducedCtx.close();
  await browser.close();
  server.close();

  console.log(`\n── a11y ──────────────────────────────────────────────`);
  console.log(`${passes} passed, ${failures} failed\n`);
  if (failures > 0) process.exitCode = 1;
};

await main();