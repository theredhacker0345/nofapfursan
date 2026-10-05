/**
 * Local record store.
 *
 * Everything the user creates — check-ins, journal entries, the activity log —
 * is written here first and treated as the source of truth. Relays are a
 * *backup and a cross-device channel*, never the only copy. Before this existed
 * a single day offline (or one unreachable relay) made a new user's entire
 * history disappear.
 */

import { SecureStorage } from "./secureStorage";

const DAY = 86_400_000;

export type Mindset = "sharp" | "foggy" | "stormy";

export interface HealthCheck {
  id?: string;
  /** Morning signal. */
  npt: boolean;
  mindset: Mindset;
  timestamp: number;
}

export interface JournalEntry {
  id?: string;
  content: string;
  mood: number;
  energy: number;
  timestamp: number;
}

export type ActivityType =
  | "journal_save"
  | "streak_start"
  | "streak_reset"
  | "profile_update"
  | "cloud_sync"
  | "health_check"
  | "note";

export interface ActivityEntry {
  id: string;
  type: ActivityType;
  message: string;
  timestamp: number;
}

export const HEALTH_KEY = "fursan_health_log";
export const JOURNAL_KEY = "fursan_journal";
export const ACTIVITY_KEY = "fursan_activity_log";

/** Bounds keep local storage inside a few hundred KB after years of use. */
const HEALTH_LIMIT = 400;
const JOURNAL_LIMIT = 300;
const ACTIVITY_LIMIT = 60;

export const localDayIndex = (d: Date): number =>
  Math.floor(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / DAY);

/** Stable per-day key so a local record and its relay copy collapse into one. */
export const healthDedupeKey = (entry: Pick<HealthCheck, "npt" | "mindset" | "timestamp">): string => {
  const d = new Date(entry.timestamp);
  const day = Number.isNaN(d.getTime()) ? entry.timestamp : localDayIndex(d);
  return `${day}|${entry.mindset}|${entry.npt ? 1 : 0}`;
};

export const journalDedupeKey = (entry: Pick<JournalEntry, "content" | "timestamp">): string =>
  `${entry.timestamp}|${entry.content.length}:${entry.content.slice(0, 64)}`;

const read = <T,>(key: string, fallback: T, validate: (v: unknown) => T): T => {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return validate(JSON.parse(raw));
  } catch {
    return fallback;
  }
};

const write = (key: string, value: unknown): boolean => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    // A full quota must be visible to the caller rather than silently dropping
    // the write after the UI already reported success.
    console.error(`[LocalStore] Write failed for ${key}`, error);
    return false;
  }
};

const asArray = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);

const isNumber = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v);

/* ── Health check-ins ─────────────────────────────────────────────────── */

const validateHealth = (v: unknown): HealthCheck[] =>
  asArray(v)
    .filter(
      (e): e is HealthCheck =>
        !!e &&
        typeof e === "object" &&
        isNumber((e as HealthCheck).timestamp) &&
        typeof (e as HealthCheck).mindset === "string" &&
        typeof (e as HealthCheck).npt === "boolean",
    )
    .map((e) => ({
      id: typeof e.id === "string" ? e.id : undefined,
      timestamp: e.timestamp,
      mindset: (["sharp", "foggy", "stormy"] as const).includes(e.mindset) ? e.mindset : "foggy",
      npt: e.npt,
    }))
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, HEALTH_LIMIT);

export function getLocalHealthChecks(): HealthCheck[] {
  return read(HEALTH_KEY, [], validateHealth);
}

export function saveLocalHealthCheck(entry: HealthCheck): boolean {
  const existing = getLocalHealthChecks();
  const key = healthDedupeKey(entry);
  const deduped = existing.filter((e) => healthDedupeKey(e) !== key);
  return write(HEALTH_KEY, [entry, ...deduped].slice(0, HEALTH_LIMIT));
}

/** Union of local and relay copies, newest first, deduplicated per day. */
export function mergeHealthChecks(local: HealthCheck[], remote: HealthCheck[]): HealthCheck[] {
  const byKey = new Map<string, HealthCheck>();
  for (const entry of [...remote, ...local]) {
    const key = healthDedupeKey(entry);
    const existing = byKey.get(key);
    if (!existing || (existing.id == null && entry.id != null)) byKey.set(key, entry);
  }
  return [...byKey.values()].sort((a, b) => b.timestamp - a.timestamp).slice(0, HEALTH_LIMIT);
}

/* ── Journal ──────────────────────────────────────────────────────────── */

const validateJournal = (v: unknown): JournalEntry[] =>
  asArray(v)
    .filter(
      (e): e is JournalEntry =>
        !!e &&
        typeof e === "object" &&
        isNumber((e as JournalEntry).timestamp) &&
        typeof (e as JournalEntry).content === "string",
    )
    .map((e) => ({
      id: typeof e.id === "string" ? e.id : undefined,
      content: e.content.slice(0, 4000),
      timestamp: e.timestamp,
      mood: clampScore(e.mood),
      energy: clampScore(e.energy),
    }))
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, JOURNAL_LIMIT);

const clampScore = (v: unknown): number =>
  isNumber(v) ? Math.min(10, Math.max(1, Math.round(v))) : 5;

export function getLocalJournalEntries(): JournalEntry[] {
  return read(JOURNAL_KEY, [], validateJournal);
}

export function saveLocalJournalEntry(entry: JournalEntry): boolean {
  const existing = getLocalJournalEntries();
  const key = journalDedupeKey(entry);
  const deduped = existing.filter((e) => journalDedupeKey(e) !== key);
  return write(JOURNAL_KEY, [entry, ...deduped].slice(0, JOURNAL_LIMIT));
}

export function deleteLocalJournalEntry(timestamp: number): void {
  write(
    JOURNAL_KEY,
    getLocalJournalEntries().filter((e) => e.timestamp !== timestamp),
  );
}

export function mergeJournalEntries(local: JournalEntry[], remote: JournalEntry[]): JournalEntry[] {
  const byKey = new Map<string, JournalEntry>();
  for (const entry of [...remote, ...local]) {
    const key = journalDedupeKey(entry);
    const existing = byKey.get(key);
    if (!existing || (existing.id == null && entry.id != null)) byKey.set(key, entry);
  }
  return [...byKey.values()].sort((a, b) => b.timestamp - a.timestamp).slice(0, JOURNAL_LIMIT);
}

/* ── Activity log ─────────────────────────────────────────────────────── */

const validateActivity = (v: unknown): ActivityEntry[] =>
  asArray(v)
    .filter(
      (e): e is ActivityEntry =>
        !!e && typeof e === "object" && isNumber((e as ActivityEntry).timestamp),
    )
    .slice(0, ACTIVITY_LIMIT);

export function getActivityLog(): ActivityEntry[] {
  return read(ACTIVITY_KEY, [], validateActivity);
}

export function logActivity(type: ActivityType, message: string): ActivityEntry {
  const entry: ActivityEntry = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    type,
    message,
    timestamp: Date.now(),
  };
  write(ACTIVITY_KEY, [entry, ...getActivityLog()].slice(0, ACTIVITY_LIMIT));
  return entry;
}

export function clearActivityLog(): void {
  try {
    localStorage.removeItem(ACTIVITY_KEY);
  } catch {
    /* nothing to clear */
  }
}

/** LocalStorage-backed copies that must survive an identity wipe. */
export const LOCAL_ONLY_KEYS = [HEALTH_KEY, JOURNAL_KEY, ACTIVITY_KEY] as const;

/** Async mirror so the same records are readable by the Capacitor Preferences backend. */
export async function mirrorToSecureStorage(): Promise<void> {
  const pairs: [string, unknown[]][] = [
    [HEALTH_KEY, getLocalHealthChecks()],
    [JOURNAL_KEY, getLocalJournalEntries()],
    [ACTIVITY_KEY, getActivityLog()],
  ];
  for (const [key, value] of pairs) {
    if (value.length === 0) continue;
    try {
      await SecureStorage.set(key, JSON.stringify(value));
    } catch {
      /* Preferences may be unavailable in private mode — localStorage already has it */
    }
  }
}

/** One-shot recovery for installs whose localStorage was cleared by a WebView. */
export async function restoreFromSecureStorage(): Promise<void> {
  const pairs: [string, (v: unknown) => unknown[]][] = [
    [HEALTH_KEY, validateHealth],
    [JOURNAL_KEY, validateJournal],
    [ACTIVITY_KEY, validateActivity],
  ];
  for (const [key, validate] of pairs) {
    let hasLocal = false;
    try {
      hasLocal = localStorage.getItem(key) !== null;
    } catch {
      hasLocal = false;
    }
    if (hasLocal) continue;
    try {
      const stored = await SecureStorage.get(key);
      if (stored) write(key, validate(JSON.parse(stored)));
    } catch {
      /* nothing recoverable */
    }
  }
}