/**
 * Chat flow tests against a local in-process Nostr relay.
 *
 * Public relays are unreachable from a sandbox, so Vanguard's send / receive /
 * retry behaviour had no coverage at all. This drives the real code path:
 * publish → relay ack → optimistic reconciliation, incoming events from another
 * author, profile resolution, channel isolation, and the failure branch.
 *
 *   node scripts/chat.mjs
 */
import { chromium } from "playwright";
import { readFileSync } from "node:fs";
import { generateSecretKey, getPublicKey, finalizeEvent } from "nostr-tools";
import { serveDist, launchBrowser } from "./lib/harness.mjs";
import { startRelay } from "./lib/relay.mjs";

const DIST = "dist";
const WEB_PORT = Number(process.env.CHAT_WEB_PORT || 4326);
const RELAY_PORT = Number(process.env.CHAT_RELAY_PORT || 4327);
const base = `http://localhost:${WEB_PORT}`;

/**
 * Read from the app source rather than retyping: a one-character drift here
 * silently stops every injected event from matching the subscription filter,
 * which is indistinguishable from a broken app.
 */
const ROOM_ID = readFileSync(new URL("../src/pages/Vanguard.tsx", import.meta.url), "utf8").match(
  /const ROOM_ID = "([0-9a-f]+)"/,
)[1];
if (ROOM_ID.length !== 64) throw new Error(`unexpected ROOM_ID length ${ROOM_ID.length}`);

/**
 * nostr-tools verifies every inbound event's id and signature and silently drops
 * anything that fails, so injected events must be genuinely signed — a hand-made
 * `{ id: "b".repeat(64) }` is discarded by the client before React ever sees it,
 * which is indistinguishable from a broken subscription.
 */
const peerSecret = generateSecretKey();
const PEER_PUBKEY = getPublicKey(peerSecret);

const sign = (template) => finalizeEvent(template, peerSecret);

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

const useRelay = (page, url) =>
  page.evaluate(
    ([k, v]) => localStorage.setItem(`CapacitorStorage.${k}`, v),
    ["user_relays", JSON.stringify([url])],
  );

/** A message can briefly exist twice (optimistic copy plus relay copy). */
const visible = (page, re) =>
  waitFor(() => page.getByText(re).first().isVisible().catch(() => false));

const main = async () => {
  const server = await serveDist(DIST, WEB_PORT);
  let relay = await startRelay({ port: RELAY_PORT });
  const browser = await launchBrowser(chromium);
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await ctx.newPage();

  const pageErrors = [];
  page.on("pageerror", (e) => {
    if (!/WebSocket|ERR_/.test(e.message)) pageErrors.push(e.message);
  });

  /* ── 1. Connect and send ────────────────────────────────────────────── */
  await page.goto(`${base}/#/vanguard`, { waitUntil: "domcontentloaded" });
  await useRelay(page, relay.url);
  await page.reload({ waitUntil: "domcontentloaded" });

  const live = await waitFor(async () => {
    const text = await page.locator("main").innerText();
    return /1 relay live/.test(text);
  });
  log(Boolean(live), "Vanguard reports the relay as live", String(live));

  await page.locator("#vanguard-composer").fill("Day 47 and I finally stopped negotiating with it.");
  await page.getByRole("button", { name: /send message/i }).click();

  log(await visible(page, /finally stopped negotiating/i), "the sent message appears immediately");

  const sent = await waitFor(() => relay.received.find((e) => e.kind === 42));
  log(Boolean(sent), "the message reaches the relay as a kind-42 event");
  log(
    sent?.content === "Day 47 and I finally stopped negotiating with it.",
    "content survives signing and transport",
    sent?.content,
  );
  log(
    sent?.tags?.some((t) => t[0] === "t" && t[1] === "fursan_general"),
    "the channel tag is present",
    JSON.stringify(sent?.tags),
  );
  log(
    sent?.tags?.some((t) => t[0] === "e" && t[1] === ROOM_ID),
    "the room tag is present",
  );
  log(
    sent?.tags?.some((t) => t[0] === "streak"),
    "the streak tag is present (provenance for the community)",
    JSON.stringify(sent?.tags?.find((t) => t[0] === "streak")),
  );
  log(
    (await page.getByText(/sending|not sent/i).count()) === 0,
    "the message settles out of its sending state",
  );

  /* ── 2. Receive from another author, and resolve their profile ──────── */
  const now = Math.floor(Date.now() / 1000);
  relay.inject(
    sign({
      kind: 0,
      created_at: now,
      tags: [],
      content: JSON.stringify({ name: "stranger", display_name: "Stranger" }),
    }),
  );
  relay.inject(
    sign({
      kind: 42,
      created_at: now + 1,
      tags: [
        ["e", ROOM_ID, "", "root"],
        ["t", "fursan_general"],
      ],
      content: "How long did it take you the first time?",
    }),
  );

  log(await visible(page, /how long did it take you/i), "an incoming message from another author renders");
  log(
    await visible(page, /^Stranger$/),
    "the author's kind-0 profile resolves to a display name",
  );
  log(
    (await page.getByText(/^Stranger$/).count()) === 1,
    "the profile cache renders one byline, not one per render",
    `${await page.getByText(/^Stranger$/).count()} bylines`,
  );

  /* ── 3. Channel isolation ───────────────────────────────────────────── */
  await page.getByRole("tab", { name: /sos/i }).click();
  // The whole list must clear: only clearing the event buffer left the previous
  // channel's messages on screen, which is what this assertion caught.
  const isolated = await waitFor(async () => {
    const text = await page.locator("main").innerText();
    return /Quiet in here/.test(text) ? "cleared" : false;
  });
  log(
    Boolean(isolated),
    "switching channel clears the list rather than inheriting the previous one",
    isolated ? "" : `main=${JSON.stringify((await page.locator("main").innerText()).slice(0, 200))}`,
  );

  await page.getByRole("tab", { name: /general/i }).click();
  log(await visible(page, /how long did it take you/i), "switching back restores them from the relay");

  /* ── 4. Failure branch and retry ───────────────────────────────────── */
  relay.close();
  await new Promise((r) => setTimeout(r, 500));
  await page.reload({ waitUntil: "domcontentloaded" });
  await useRelay(page, relay.url); // now unreachable
  await page.reload({ waitUntil: "domcontentloaded" });

  const reportedOffline = await waitFor(() =>
    page.getByText(/No relay connection/i).isVisible().catch(() => false),
  );
  log(Boolean(reportedOffline), "an unreachable relay is reported in the composer area");

  await page.locator("#vanguard-composer").fill("This one should not make it.");
  await page.getByRole("button", { name: /send message/i }).click();
  log(await visible(page, /not sent/i), "an unreachable relay marks the message as not sent");

  relay = await startRelay({ port: RELAY_PORT });
  // Wait for the client to notice the relay is back before retrying.
  await waitFor(async () => !(await page.getByText(/No relay connection/i).isVisible().catch(() => false)), {
    timeout: 25_000,
  });

  await page.getByRole("button", { name: /retry/i }).first().click();
  const retried = await waitFor(() =>
    relay.received.some((e) => e.content === "This one should not make it."),
  );
  log(Boolean(retried), "retrying a failed message publishes it once the relay returns");
  log(
    (await page.getByText(/not sent/i).count()) === 0,
    "the retried message settles out of its failed state",
    `${await page.getByText(/not sent/i).count()} still failed`,
  );

  /* ── 5. No duplicate publishes for one send ─────────────────────────── */
  const duplicates = relay.received.filter(
    (e) => e.content === "This one should not make it.",
  ).length;
  log(duplicates === 1, "one retry publishes exactly one event", `${duplicates} events`);

  await browser.close();
  relay.close();
  server.close();

  console.log(`\n── chat ──────────────────────────────────────────────`);
  console.log(`${passes} passed, ${failures} failed`);
  if (pageErrors.length) console.log(`\npage errors: ${[...new Set(pageErrors)].join(" | ")}`);
  console.log("");
  if (failures > 0) process.exitCode = 1;
};

await main();