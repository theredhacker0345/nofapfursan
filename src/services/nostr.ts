/**
 * Nostr persistence layer.
 *
 * Design rules that this file enforces:
 *  1. Local store first. Every write lands on the device before it touches a
 *     relay, so an outage, a blocked relay or a reinstall never loses history.
 *  2. One pool. A single shared `SimplePool` with reconnect + ping, and every
 *     query bounded by `maxWait` *and* a hard race timeout — an unreachable
 *     relay can no longer leave a screen spinning forever.
 *  3. Bounded offline queue with a persisted retry counter and a dead-letter
 *     drop, so storage cannot grow without limit.
 *  4. Nothing wipes storage implicitly. `resetIdentity` removes named keys on
 *     both the Capacitor Preferences backend and the WebView localStorage.
 */

import { Preferences } from "@capacitor/preferences";
import { Network, ConnectionStatus } from "@capacitor/network";
import {
  generateSecretKey,
  getPublicKey,
  finalizeEvent,
  SimplePool,
  VerifiedEvent,
  nip19,
  nip44,
} from "nostr-tools";
import { bytesToHex, hexToBytes } from "@noble/hashes/utils";

import { SecureStorage } from "./secureStorage";
import {
  HealthCheck,
  JournalEntry,
  saveLocalHealthCheck,
  saveLocalJournalEntry,
  getLocalHealthChecks,
  getLocalJournalEntries,
  mergeHealthChecks,
  mergeJournalEntries,
  mirrorToSecureStorage,
} from "./localStore";

/* ──────────────────────────────────────────────────────────────────────────
   Relays
   ────────────────────────────────────────────────────────────────────────── */

export const DEFAULT_RELAYS = [
  "wss://nos.lol",
  "wss://relay.damus.io",
  "wss://relay.snort.social",
];

/** @deprecated Use {@link DEFAULT_RELAYS}. */
export const RELAYS = DEFAULT_RELAYS;

const RELAY_KEY = "user_relays";

const isRelayUrl = (value: unknown): value is string =>
  typeof value === "string" && /^wss?:\/\/[^\s]+$/i.test(value.trim());

const normaliseRelays = (value: unknown): string[] => {
  if (!Array.isArray(value)) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of value) {
    if (!isRelayUrl(raw)) continue;
    const url = raw.trim().replace(/\/+$/, "");
    if (seen.has(url)) continue;
    seen.add(url);
    out.push(url);
  }
  return out;
};

/**
 * Never returns an empty list. A relay set of `[]` used to make every
 * `querySync` hang forever and silently blank three screens.
 */
export async function getRelays(): Promise<string[]> {
  try {
    const { value } = await Preferences.get({ key: RELAY_KEY });
    const relays = normaliseRelays(value ? JSON.parse(value) : null);
    if (relays.length > 0) return relays;
  } catch {
    // Corrupt or unreadable — fall back below.
  }
  return [...DEFAULT_RELAYS];
}

export async function setRelays(urls: string[]): Promise<string[]> {
  const relays = normaliseRelays(urls);
  const next = relays.length > 0 ? relays : [...DEFAULT_RELAYS];
  await Preferences.set({ key: RELAY_KEY, value: JSON.stringify(next) });
  return next;
}

export async function addRelay(url: string): Promise<string[] | null> {
  if (!isRelayUrl(url)) return null;
  const trimmed = url.trim().replace(/\/+$/, "");
  const current = await getRelays();
  if (current.includes(trimmed)) return current;
  const next = await setRelays([...current, trimmed]);
  return next;
}

/** Refuses to remove the final relay — the app must always have somewhere to write. */
export async function removeRelay(url: string): Promise<{ relays: string[]; removed: boolean }> {
  const current = await getRelays();
  const remaining = current.filter((r) => r !== url);
  if (remaining.length === 0) return { relays: current, removed: false };
  const relays = await setRelays(remaining);
  pool.close([url]);
  return { relays, removed: true };
}

/* ──────────────────────────────────────────────────────────────────────────
   Shared pool + bounded queries
   ────────────────────────────────────────────────────────────────────────── */

const pool = new SimplePool({ enablePing: true, enableReconnect: true });

export const getPool = () => pool;

/** Shuts every socket down. Used on identity reset and app teardown. */
export function closeAllRelays(): void {
  pool.close([]);
}

export interface RelayHealth {
  reachable: boolean;
  metadata?: { name?: string; description?: string; supported_nips?: number[] };
}

/** Connectivity probe used before a relay is added to the list. */
export async function verifyRelay(url: string): Promise<RelayHealth> {
  const trimmed = url.trim().replace(/\/+$/, "");
  if (!isRelayUrl(trimmed)) return { reachable: false };
  try {
    await pool.ensureRelay(trimmed, { connectionTimeout: CONNECT_TIMEOUT_MS });
  } catch {
    return { reachable: false };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), METADATA_TIMEOUT_MS);
  try {
    const res = await fetch(trimmed.replace(/^ws/, "http"), {
      headers: { Accept: "application/nostr+json" },
      signal: controller.signal,
    });
    if (res.ok) {
      const data = (await res.json()) as RelayHealth["metadata"];
      return { reachable: true, metadata: data };
    }
  } catch {
    /* NIP-11 is optional — reachability is what matters here */
  } finally {
    clearTimeout(timer);
  }
  return { reachable: true };
}

const QUERY_TIMEOUT_MS = 6000;
const CONNECT_TIMEOUT_MS = 5000;
const withTimeout = async <T,>(promise: Promise<T>, ms: number, fallback: T): Promise<T> => {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<T>((resolve) => {
        timer = setTimeout(() => resolve(fallback), ms);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
};

/**
 * `querySync` resolves on relay arrival order and never sorts; on top of that an
 * empty/dead relay set can leave the promise pending forever. This wrapper
 * sorts by `created_at` descending and always resolves.
 */
async function queryRelays(
  filter: Record<string, unknown>,
  relays: string[],
  timeoutMs = QUERY_TIMEOUT_MS,
): Promise<VerifiedEvent[]> {
  if (relays.length === 0) return [];
  try {
    const events = await withTimeout(
      pool.querySync(relays, filter as never, { maxWait: timeoutMs }) as Promise<VerifiedEvent[]>,
      timeoutMs + 500,
      [] as VerifiedEvent[],
    );
    return events.sort((a, b) => b.created_at - a.created_at);
  } catch (error) {
    console.warn("[Nostr] Query failed", error);
    return [];
  }
}

/* ──────────────────────────────────────────────────────────────────────────
   Network state
   ────────────────────────────────────────────────────────────────────────── */

export interface NetworkState {
  isOnline: boolean;
  isSyncing: boolean;
  pendingCount: number;
  droppedCount: number;
}

let networkState: NetworkState = {
  isOnline: true,
  isSyncing: false,
  pendingCount: 0,
  droppedCount: 0,
};

type NetworkStateListener = (state: NetworkState) => void;
const networkStateListeners = new Set<NetworkStateListener>();

export function subscribeToNetworkState(listener: NetworkStateListener): () => void {
  networkStateListeners.add(listener);
  listener({ ...networkState });
  return () => {
    networkStateListeners.delete(listener);
  };
}

function updateNetworkState(updates: Partial<NetworkState>): void {
  networkState = { ...networkState, ...updates };
  for (const listener of networkStateListeners) listener({ ...networkState });
}

export function getNetworkState(): NetworkState {
  return { ...networkState };
}

/* ──────────────────────────────────────────────────────────────────────────
   Offline queue
   ────────────────────────────────────────────────────────────────────────── */

interface PendingEvent {
  id: string;
  event: VerifiedEvent;
  createdAt: number;
  retryCount: number;
  /** "streak" | "health" | "journal" — used for the storage-full message. */
  kind: string;
}

const PENDING_KEY = "pending_sync";
/** Bounds local storage; beyond this the oldest records are dropped first. */
const MAX_QUEUE = 200;
/** After this many failed attempts the event is dead-lettered, not retried forever. */
const MAX_RETRIES = 12;

async function readQueue(): Promise<PendingEvent[]> {
  try {
    const { value } = await Preferences.get({ key: PENDING_KEY });
    if (!value) return [];
    const parsed: unknown = JSON.parse(value);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (e): e is PendingEvent =>
        !!e && typeof e === "object" && typeof (e as PendingEvent).id === "string",
    );
  } catch {
    return [];
  }
}

async function writeQueue(events: PendingEvent[]): Promise<boolean> {
  try {
    await Preferences.set({ key: PENDING_KEY, value: JSON.stringify(events) });
    updateNetworkState({ pendingCount: events.length });
    return true;
  } catch (error) {
    console.error("[Nostr] Queue write failed — storage is full", error);
    return false;
  }
}

async function enqueue(event: VerifiedEvent, kind: string): Promise<boolean> {
  const queue = await readQueue();
  if (queue.some((e) => e.id === event.id)) return true;

  queue.push({ id: event.id, event, createdAt: Date.now(), retryCount: 0, kind });

  const trimmed = queue;
  let dropped = 0;
  while (trimmed.length > MAX_QUEUE) {
    trimmed.shift();
    dropped++;
  }
  if (dropped > 0) updateNetworkState({ droppedCount: networkState.droppedCount + dropped });

  return writeQueue(trimmed);
}

let flushInFlight: Promise<void> | null = null;

async function flushQueue(): Promise<void> {
  if (flushInFlight) return flushInFlight;

  flushInFlight = (async () => {
    const queue = await readQueue();
    if (queue.length === 0) {
      updateNetworkState({ isSyncing: false, pendingCount: 0 });
      return;
    }

    updateNetworkState({ isSyncing: true });
    const remaining: PendingEvent[] = [];
    let dropped = 0;

    for (const item of queue) {
      try {
        if (await publishEvent(item.event)) continue; // acked — drop from queue
        if (item.retryCount + 1 >= MAX_RETRIES) {
          dropped++;
          continue;
        }
        remaining.push({ ...item, retryCount: item.retryCount + 1 });
      } catch {
        remaining.push({ ...item, retryCount: item.retryCount + 1 });
      }
    }

    if (dropped > 0) {
      console.warn(`[Nostr] ${dropped} queued event(s) abandoned after ${MAX_RETRIES} attempts`);
      updateNetworkState({ droppedCount: networkState.droppedCount + dropped });
    }
    // Always persists — the retry counters must survive the session.
    await writeQueue(remaining);
    updateNetworkState({ isSyncing: false });
  })().finally(() => {
    flushInFlight = null;
  });

  return flushInFlight;
}

export async function manualFlush(): Promise<void> {
  if (!networkState.isOnline) {
    console.info("[Nostr] Offline — nothing to flush");
    return;
  }
  await flushQueue();
}

export async function getPendingCount(): Promise<number> {
  return (await readQueue()).length;
}

/* ──────────────────────────────────────────────────────────────────────────
   Publish
   ────────────────────────────────────────────────────────────────────────── */

const PUBLISH_TIMEOUT_MS = 6000;
const METADATA_TIMEOUT_MS = 3000;
const MIN_RELAY_CONFIRMATIONS = 1;

/** Resolves true as soon as one relay accepts the event. */
export async function publishEvent(event: VerifiedEvent, relays?: string[]): Promise<boolean> {
  const targets = relays ?? (await getRelays());
  if (targets.length === 0) return false;

  let acked = false;
  const attempts = targets.map(async (url) => {
    try {
      await pool.ensureRelay(url, { connectionTimeout: CONNECT_TIMEOUT_MS });
    } catch {
      return; // unreachable — the publish below will reject fast anyway
    }
    try {
      const [result] = await pool.publish([url], event);
      await result;
      acked = true;
    } catch {
      /* try the next relay */
    }
  });

  await withTimeout(
    Promise.allSettled(attempts).then(() => undefined),
    PUBLISH_TIMEOUT_MS,
    undefined,
  );
  return acked;
}

/**
 * Publish with a durable local fallback: on success the relay acknowledges,
 * otherwise the signed event is queued and the caller is still told the write
 * succeeded — because it did, on the device.
 */
async function publishOrQueue(event: VerifiedEvent, kind: string): Promise<boolean> {
  if (!networkState.isOnline) {
    await enqueue(event, kind);
    return true;
  }
  if (await publishEvent(event)) return true;
  return enqueue(event, kind);
}

/* ──────────────────────────────────────────────────────────────────────────
   Network listener
   ────────────────────────────────────────────────────────────────────────── */

let networkListenerHandle: { remove: () => Promise<void> } | null = null;
let healthTimer: ReturnType<typeof setInterval> | null = null;

export async function initNetworkListener(): Promise<void> {
  if (networkListenerHandle) return;

  try {
    const status = await Network.getStatus();
    updateNetworkState({ isOnline: status.connected });
  } catch {
    updateNetworkState({ isOnline: true });
  }

  networkListenerHandle = await Network.addListener("networkStatusChange", (status: ConnectionStatus) => {
    const wasOffline = !networkState.isOnline;
    updateNetworkState({ isOnline: status.connected });
    if (wasOffline && status.connected) void flushQueue();
  });

  const queue = await readQueue();
  updateNetworkState({ pendingCount: queue.length });
  if (networkState.isOnline && queue.length > 0) void flushQueue();

  // Keeps the queue moving and re-establishes sockets that dropped while the
  // app was backgrounded. `enableReconnect` alone does not recover a socket
  // that was killed by the OS.
  if (healthTimer) clearInterval(healthTimer);
  healthTimer = setInterval(() => {
    if (!document.hidden && networkState.isOnline) {
      if (networkState.pendingCount > 0) void flushQueue();
      else void warmRelays();
    }
  }, 45_000);

  document.addEventListener("visibilitychange", onVisible);
}

function onVisible() {
  if (document.visibilityState !== "visible" || !networkState.isOnline) return;
  void warmRelays();
  if (networkState.pendingCount > 0) void flushQueue();
}

async function warmRelays() {
  const relays = await getRelays();
  const status = pool.listConnectionStatus();
  await Promise.allSettled(
    relays.map(async (url) => {
      if (status.get(url) === true) return;
      try {
        await pool.ensureRelay(url, { connectionTimeout: CONNECT_TIMEOUT_MS });
      } catch {
        /* retried on the next tick */
      }
    }),
  );
}

/** Releases sockets and timers. Safe to call more than once. */
export async function shutdownNetwork(): Promise<void> {
  if (healthTimer) {
    clearInterval(healthTimer);
    healthTimer = null;
  }
  document.removeEventListener("visibilitychange", onVisible);
  if (networkListenerHandle) {
    await networkListenerHandle.remove().catch(() => undefined);
    networkListenerHandle = null;
  }
  closeAllRelays();
}

/* ──────────────────────────────────────────────────────────────────────────
   Identity
   ────────────────────────────────────────────────────────────────────────── */

export interface NostrKeys {
  privateKey: Uint8Array;
  publicKey: string;
  privateKeyHex: string;
}

const NSEC_KEY = "user_nsec";
const LEGACY_KEYS = ["user_private_key", "nostr_private_key"];

const isHexKey = (value: string): boolean => /^[0-9a-f]{64}$/i.test(value.trim());

/** Every key this app owns — the explicit wipe list. */
const APP_KEYS = [
  NSEC_KEY,
  ...LEGACY_KEYS,
  PENDING_KEY,
  RELAY_KEY,
  "user_theme",
  "fursan_streak_data",
  "fursan_health_log",
  "fursan_journal",
  "fursan_activity_log",
];

const LOCAL_STORAGE_PREFIXES = ["nostr_username_", "nostr_avatar_", "fursan_"];

/**
 * Loads the identity, creating one on first run.
 *
 * Throws `IdentityError` when a stored key is unusable so callers can offer a
 * real recovery path — a corrupt key used to brick the whole app silently.
 */
export class IdentityError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "IdentityError";
  }
}

export async function generateOrLoadKeys(): Promise<NostrKeys> {
  // Consolidate any legacy plain-localStorage keys first.
  for (const key of LEGACY_KEYS) {
    try {
      const legacy = localStorage.getItem(key);
      if (legacy && isHexKey(legacy) && !(await SecureStorage.get(NSEC_KEY))) {
        await SecureStorage.set(NSEC_KEY, legacy);
      }
      localStorage.removeItem(key);
    } catch {
      /* storage unavailable */
    }
  }

  const stored = await SecureStorage.get(NSEC_KEY);

  if (stored) {
    if (!isHexKey(stored)) {
      throw new IdentityError("Stored identity is not a valid key.");
    }
    const privateKey = hexToBytes(stored);
    return { privateKey, publicKey: getPublicKey(privateKey), privateKeyHex: stored };
  }

  const privateKey = generateSecretKey();
  const privateKeyHex = bytesToHex(privateKey);
  try {
    await SecureStorage.set(NSEC_KEY, privateKeyHex);
  } catch (error) {
    console.error("[Nostr] Could not persist new identity", error);
    throw new IdentityError("Device storage is unavailable; identity was not saved.");
  }
  return { privateKey, publicKey: getPublicKey(privateKey), privateKeyHex };
}

export async function hasKeys(): Promise<boolean> {
  const value = await SecureStorage.get(NSEC_KEY);
  return !!value && isHexKey(value);
}

/**
 * Destroys the identity and everything tied to it.
 *
 * Deliberately targeted: `localStorage.clear()` used to delete the unsynced
 * offline queue on web while erasing nothing at all on Android.
 */
export async function resetIdentity(options: { wipeRecords?: boolean } = {}): Promise<void> {
  await Promise.all(
    APP_KEYS.filter((key) => options.wipeRecords || key !== "fursan_streak_data").map((key) =>
      SecureStorage.remove(key).catch(() => undefined),
    ),
  );

  // WebView-localStorage copies and per-identity profile metadata.
  try {
    const doomed: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;
      if (LOCAL_STORAGE_PREFIXES.some((p) => key.startsWith(p)) || key.startsWith("CapacitorStorage.")) {
        doomed.push(key);
      }
    }
    for (const key of doomed) localStorage.removeItem(key);
  } catch {
    /* nothing stored here */
  }

  closeAllRelays();
  updateNetworkState({ pendingCount: 0, droppedCount: 0, isSyncing: false });
}

/** Clears a damaged identity so the next load mints a fresh one. */
export async function discardIdentity(): Promise<void> {
  await Promise.all([
    SecureStorage.remove(NSEC_KEY),
    ...LEGACY_KEYS.map((k) => SecureStorage.remove(k)),
  ]);
  try {
    for (const key of LEGACY_KEYS) localStorage.removeItem(key);
  } catch {
    /* ignore */
  }
  networkState = { isOnline: networkState.isOnline, isSyncing: false, pendingCount: 0, droppedCount: 0 };
}

export async function exportKeys(): Promise<{ nsec: string; npub: string } | null> {
  try {
    const keys = await generateOrLoadKeys();
    return { nsec: nip19.nsecEncode(keys.privateKey), npub: nip19.npubEncode(keys.publicKey) };
  } catch (error) {
    console.error("[Nostr] Failed to export keys", error);
    return null;
  }
}

/**
 * Imports an nsec. The outgoing identity's queued events are discarded first —
 * publishing another identity's encrypted records from this session would leak
 * them under the wrong key.
 */
export async function importKey(nsec: string): Promise<boolean> {
  const { type, data } = nip19.decode(nsec.trim());
  if (type !== "nsec") throw new Error("Expected an nsec (npub cannot restore your streak).");

  const privateKey = data as Uint8Array;
  if (privateKey.length !== 32) throw new Error("That key is not 32 bytes.");

  await writeQueue([]);
  closeAllRelays();
  await SecureStorage.set(NSEC_KEY, bytesToHex(privateKey));
  for (const key of LEGACY_KEYS) await SecureStorage.remove(key).catch(() => undefined);
  updateNetworkState({ pendingCount: 0 });
  return true;
}

export async function getPublicKeyNpub(): Promise<string | null> {
  try {
    return (await generateOrLoadKeys()).publicKey;
  } catch {
    return null;
  }
}

export { nip19 };

/* ──────────────────────────────────────────────────────────────────────────
   NIP-44 helpers
   ────────────────────────────────────────────────────────────────────────── */

/**
 * Self-directed conversation key: the payload is readable only by the holder of
 * the private key that signed it, which is exactly the intent for private
 * records mirrored to public relays.
 */
function selfKey(keys: NostrKeys) {
  return nip44.v2.utils.getConversationKey(keys.privateKey, keys.publicKey);
}

const encryptJson = (value: unknown, keys: NostrKeys): string =>
  nip44.v2.encrypt(JSON.stringify(value), selfKey(keys));

const decryptJson = <T,>(ciphertext: string, keys: NostrKeys): T | null => {
  try {
    return JSON.parse(nip44.v2.decrypt(ciphertext, selfKey(keys))) as T;
  } catch {
    return null;
  }
};

const noteTags = (tag: string) => [
  ["t", tag],
  ["encrypted", "nip44"],
];

/* ──────────────────────────────────────────────────────────────────────────
   Streak
   ────────────────────────────────────────────────────────────────────────── */

export interface StreakPayload {
  days: number;
  startDate: string | null;
  longestStreak: number;
  totalRelapses: number;
  /** Mirrors `StreakData.updatedAt`; drives last-writer-wins cloud merges. */
  updatedAt: number;
  timestamp: number;
}

const STREAK_KIND = 30078;
const STREAK_D_TAG = "nofapfursan-streak";

export async function saveStreak(streakData: StreakPayload): Promise<boolean> {
  try {
    const keys = await generateOrLoadKeys();
    const event = finalizeEvent(
      {
        kind: STREAK_KIND,
        created_at: Math.floor(Date.now() / 1000),
        tags: [["d", STREAK_D_TAG], ["t", "nofapfursan"], ["encrypted", "nip44"]],
        content: encryptJson(streakData, keys),
      },
      keys.privateKey,
    );
    return publishOrQueue(event, "streak");
  } catch (error) {
    console.error("[Nostr] saveStreak failed", error);
    return false;
  }
}

export async function fetchStreak(): Promise<StreakPayload | null> {
  if (!networkState.isOnline) return null;
  try {
    const keys = await generateOrLoadKeys();
    const relays = await getRelays();
    const events = await queryRelays(
      { kinds: [STREAK_KIND], authors: [keys.publicKey], "#d": [STREAK_D_TAG], limit: 10 },
      relays,
    );
    // Newest first: `querySync` returns arrival order, not chronological.
    for (const event of events) {
      const payload = decryptJson<StreakPayload>(event.content, keys);
      if (payload) return payload;
    }
    return null;
  } catch (error) {
    console.error("[Nostr] fetchStreak failed", error);
    return null;
  }
}

/**
 * Cloud pull. Pushing is owned by the caller so a merge never silently
 * overwrites a fresher local decision.
 */
export async function syncStreak(localStreak: StreakPayload): Promise<StreakPayload> {
  const remoteStreak = await fetchStreak();
  if (!remoteStreak) return localStreak;

  const localAt = localStreak.updatedAt || localStreak.timestamp || 0;
  const remoteAt = remoteStreak.updatedAt || remoteStreak.timestamp || 0;

  return {
    days: Math.max(localStreak.days, remoteStreak.days),
    startDate: remoteAt > localAt ? remoteStreak.startDate : localStreak.startDate,
    longestStreak: Math.max(localStreak.longestStreak, remoteStreak.longestStreak),
    totalRelapses: Math.max(localStreak.totalRelapses, remoteStreak.totalRelapses),
    updatedAt: Math.max(localAt, remoteAt),
    timestamp: Math.max(localStreak.timestamp, remoteStreak.timestamp),
  };
}

/* ──────────────────────────────────────────────────────────────────────────
   Health check-ins
   ────────────────────────────────────────────────────────────────────────── */

const HEALTH_TAG = "nofapfursan-health";
export type { HealthCheck };

export async function saveHealthCheck(entry: HealthCheck): Promise<boolean> {
  // Device first — this is the write that must never fail silently.
  if (!saveLocalHealthCheck(entry)) {
    toastFailure();
    return false;
  }
  void mirrorToSecureStorage();

  try {
    const keys = await generateOrLoadKeys();
    const event = finalizeEvent(
      {
        kind: 1,
        created_at: Math.floor(Date.now() / 1000),
        tags: noteTags(HEALTH_TAG),
        content: encryptJson(entry, keys),
      },
      keys.privateKey,
    );
    await publishOrQueue(event, "health");
    return true;
  } catch (error) {
    console.error("[Nostr] saveHealthCheck relay step failed", error);
    return true; // the local record is already durable
  }
}

/** Local ∪ relay, newest first, deduplicated per day. */
export async function fetchHealthChecks(): Promise<HealthCheck[]> {
  const local = getLocalHealthChecks();
  if (!networkState.isOnline) return local;

  try {
    const keys = await generateOrLoadKeys();
    const relays = await getRelays();
    const events = await queryRelays(
      { kinds: [1], authors: [keys.publicKey], "#t": [HEALTH_TAG], limit: 150 },
      relays,
    );
    const remote: HealthCheck[] = [];
    for (const event of events) {
      const data = decryptJson<HealthCheck>(event.content, keys);
      if (data && typeof data.timestamp === "number") remote.push({ ...data, id: event.id });
    }
    const merged = mergeHealthChecks(local, remote);
    if (remote.length > 0) void mirrorToSecureStorage();
    return merged;
  } catch (error) {
    console.error("[Nostr] fetchHealthChecks failed", error);
    return local;
  }
}

/* ──────────────────────────────────────────────────────────────────────────
   Journal
   ────────────────────────────────────────────────────────────────────────── */

const JOURNAL_TAG = "nofapfursan-journal";
export type { JournalEntry };

export async function saveJournalEntry(entry: JournalEntry): Promise<boolean> {
  if (!saveLocalJournalEntry(entry)) {
    toastFailure();
    return false;
  }
  void mirrorToSecureStorage();

  try {
    const keys = await generateOrLoadKeys();
    const event = finalizeEvent(
      {
        kind: 1,
        created_at: Math.floor(Date.now() / 1000),
        tags: noteTags(JOURNAL_TAG),
        content: encryptJson(entry, keys),
      },
      keys.privateKey,
    );
    await publishOrQueue(event, "journal");
    return true;
  } catch (error) {
    console.error("[Nostr] saveJournalEntry relay step failed", error);
    return true; // the local record is already durable
  }
}

export async function fetchJournalEntries(): Promise<JournalEntry[]> {
  const local = getLocalJournalEntries();
  if (!networkState.isOnline) return local;

  try {
    const keys = await generateOrLoadKeys();
    const relays = await getRelays();
    const events = await queryRelays(
      { kinds: [1], authors: [keys.publicKey], "#t": [JOURNAL_TAG], limit: 150 },
      relays,
    );
    const remote: JournalEntry[] = [];
    for (const event of events) {
      const data = decryptJson<JournalEntry>(event.content, keys);
      if (data && typeof data.timestamp === "number") remote.push({ ...data, id: event.id });
    }
    const merged = mergeJournalEntries(local, remote);
    if (remote.length > 0) void mirrorToSecureStorage();
    return merged;
  } catch (error) {
    console.error("[Nostr] fetchJournalEntries failed", error);
    return local;
  }
}

/** Storage-full is the one failure the user must see, so it gets a toast. */
function toastFailure() {
  const message = "Device storage is full — this entry could not be saved.";
  if (typeof window !== "undefined" && typeof window.dispatchEvent === "function") {
    window.dispatchEvent(new CustomEvent("fursan:storage-full", { detail: message }));
  }
  console.error(`[Nostr] ${message}`);
}