import { SecureStorage } from "@/services/secureStorage";

/* ──────────────────────────────────────────────────────────────────────────
   Streak model
   ────────────────────────────────────────────────────────────────────────── */

export interface StreakData {
  startDate: string | null;
  longestStreak: number;
  totalRelapses: number;
  /**
   * Strictly-increasing stamp of the last local write. Cloud merges are
   * last-writer-wins on this value, so a relapse can never be resurrected by
   * a stale relay copy.
   */
  updatedAt: number;
}

export interface StreakProgress {
  /** Completed local calendar days since the start (day 0 = the day you began). */
  days: number;
  /** Real elapsed wall-clock time. */
  elapsedMs: number;
  /** Total elapsed hours (not a remainder). */
  hours: number;
  /** Total elapsed minutes (not a remainder). */
  minutes: number;
}

export const EMPTY_STREAK: StreakData = Object.freeze({
  startDate: null,
  longestStreak: 0,
  totalRelapses: 0,
  updatedAt: 0,
});

const STREAK_KEY = "fursan_streak_data";

const HOUR = 1000 * 60 * 60;
const DAY = 24 * HOUR;

/** Days since the Unix epoch in the *local* calendar. DST-proof by construction. */
const localDayIndex = (d: Date): number =>
  Math.floor(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / DAY);

const parseDate = (value: string | null | undefined): Date | null => {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
};

/**
 * Calendar-day difference. A streak started at 00:10 reads as day 1 the next
 * morning rather than 24h later, and no DST boundary can shift it.
 * Clamped at 0 so a backwards clock jump can never render a negative streak.
 */
export function daysSinceStart(startDate: string | null, now: Date = new Date()): number {
  const start = parseDate(startDate);
  if (!start) return 0;
  return Math.max(0, localDayIndex(now) - localDayIndex(start));
}

export function calculateStreak(
  startDate: string | null,
  now: Date = new Date(),
): StreakProgress {
  const start = parseDate(startDate);
  if (!start) return { days: 0, elapsedMs: 0, hours: 0, minutes: 0 };

  // A device clock set into the future must not inflate the streak.
  const elapsedMs = Math.max(0, now.getTime() - start.getTime());
  return {
    days: daysSinceStart(startDate, now),
    elapsedMs,
    hours: Math.floor(elapsedMs / HOUR),
    minutes: Math.floor(elapsedMs / (1000 * 60)),
  };
}

/** "12d 04h 19m" — the compact elapsed form used in list rows. */
export function formatElapsed(elapsedMs: number): string {
  if (elapsedMs <= 0) return "0m";
  const d = Math.floor(elapsedMs / DAY);
  const h = Math.floor((elapsedMs % DAY) / HOUR);
  const m = Math.floor((elapsedMs % HOUR) / (1000 * 60));
  if (d > 0) return `${d}d ${String(h).padStart(2, "0")}h`;
  if (h > 0) return `${h}h ${String(m).padStart(2, "0")}m`;
  return `${m}m`;
}

const sanitise = (raw: unknown): StreakData => {
  if (!raw || typeof raw !== "object") return { ...EMPTY_STREAK };
  const o = raw as Record<string, unknown>;
  const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? Math.max(0, Math.trunc(v)) : 0);
  const start = parseDate(typeof o.startDate === "string" ? o.startDate : null);
  return {
    startDate: start ? start.toISOString() : null,
    longestStreak: num(o.longestStreak),
    totalRelapses: num(o.totalRelapses),
    // Legacy records predate the stamp: treat them as just-written so a local
    // decision (notably a reset) always wins over an older cloud copy.
    updatedAt: num(o.updatedAt) || Date.now(),
  };
};

/** Last-writer-wins merge. Historical counters are monotonic (max), never lost. */
export function mergeStreakData(local: StreakData, remote: Partial<StreakData> | null): StreakData {
  if (!remote) return local;
  const remoteStart = parseDate(remote.startDate);
  const localWins = local.updatedAt >= (remote.updatedAt ?? 0);
  const startDate = localWins ? local.startDate : remoteStart ? remoteStart.toISOString() : null;

  return {
    startDate,
    longestStreak: Math.max(local.longestStreak, remote.longestStreak ?? 0),
    totalRelapses: Math.max(local.totalRelapses, remote.totalRelapses ?? 0),
    updatedAt: Math.max(local.updatedAt, remote.updatedAt ?? 0),
  };
}

export async function getStreakData(): Promise<StreakData> {
  try {
    const stored = await SecureStorage.get(STREAK_KEY);
    if (stored) return sanitise(JSON.parse(stored));
  } catch {
    // Corrupt record — fall through to the legacy path, then to the default.
  }

  try {
    const legacy = localStorage.getItem(STREAK_KEY);
    if (legacy) {
      const parsed = sanitise(JSON.parse(legacy));
      await SecureStorage.set(STREAK_KEY, JSON.stringify(parsed));
      localStorage.removeItem(STREAK_KEY);
      return parsed;
    }
  } catch {
    // Unreadable legacy value: start clean rather than wedging the app.
  }

  return { ...EMPTY_STREAK, updatedAt: Date.now() };
}

export async function saveStreakData(data: StreakData): Promise<StreakData> {
  const next: StreakData = {
    ...data,
    startDate: parseDate(data.startDate)?.toISOString() ?? null,
    updatedAt: Math.max(data.updatedAt || 0, Date.now()),
  };
  try {
    await SecureStorage.set(STREAK_KEY, JSON.stringify(next));
  } catch (error) {
    console.error("[Streak] Failed to persist streak", error);
  }
  window.dispatchEvent(new Event("fursan_streak_updated"));
  return next;
}

/* ──────────────────────────────────────────────────────────────────────────
   Progression ladder
   ────────────────────────────────────────────────────────────────────────── */

export interface Milestone {
  id: string;
  name: string;
  minDays: number;
  /** Lucide icon name — emoji are not themeable and render differently per OS. */
  icon: "Shield" | "Flame" | "Mountain" | "Anchor" | "Gem" | "Crown";
  description: string;
}

export const MILESTONES: Milestone[] = [
  {
    id: "resolve",
    name: "Resolve",
    minDays: 0,
    icon: "Shield",
    description: "The decision is made. Everything from here is repetition.",
  },
  {
    id: "discipline",
    name: "Discipline",
    minDays: 7,
    icon: "Flame",
    description: "A full week. The urge still comes; it no longer decides.",
  },
  {
    id: "endurance",
    name: "Endurance",
    minDays: 30,
    icon: "Mountain",
    description: "A month is long enough to change what you find normal.",
  },
  {
    id: "fortitude",
    name: "Fortitude",
    minDays: 90,
    icon: "Anchor",
    description: "Ninety days. This is no longer effort, it is identity.",
  },
  {
    id: "mastery",
    name: "Mastery",
    minDays: 180,
    icon: "Gem",
    description: "Half a year. You have outlasted every previous version of yourself.",
  },
  {
    id: "legend",
    name: "Legend",
    minDays: 365,
    icon: "Crown",
    description: "A full year. There is nothing left to prove to yourself.",
  },
];

export function getMilestone(days: number): Milestone {
  for (let i = MILESTONES.length - 1; i >= 0; i--) {
    if (days >= MILESTONES[i].minDays) return MILESTONES[i];
  }
  return MILESTONES[0];
}

export function getNextMilestone(days: number): Milestone | null {
  const next = MILESTONES.find((m) => days < m.minDays);
  return next ?? null;
}

export function getDaysUntilMilestone(days: number): number {
  const next = getNextMilestone(days);
  return next ? next.minDays - days : 0;
}

/** True once the live streak matches (or passes) the stored best. */
export function isNewRecord(days: number, longestStreak: number): boolean {
  return longestStreak > 0 && days >= longestStreak;
}

/* ──────────────────────────────────────────────────────────────────────────
   Check-in history helpers
   ────────────────────────────────────────────────────────────────────────── */

export function calculateConsecutiveCheckins(
  history: { timestamp: number }[],
  now: Date = new Date(),
): number {
  if (!history?.length) return 0;

  const days = new Set<number>();
  for (const entry of history) {
    const d = new Date(entry.timestamp);
    if (Number.isNaN(d.getTime())) continue;
    days.add(localDayIndex(d));
  }
  if (days.size === 0) return 0;

  const today = localDayIndex(now);
  const sorted = [...days].sort((a, b) => b - a);
  // Grace period: today or yesterday still counts as "alive".
  if (sorted[0] < today - 1) return 0;

  let consecutive = 1;
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i - 1] - sorted[i] === 1) consecutive++;
    else break;
  }
  return consecutive;
}

/** 5+ consecutive check-ins unlocks the streak-aura highlight. */
export function hasAuraBonus(history: { timestamp: number }[], now: Date = new Date()): boolean {
  return calculateConsecutiveCheckins(history, now) >= 5;
}

export function getRandomQuote(quotes: readonly string[]): string {
  if (quotes.length === 0) return "";
  return quotes[Math.floor(Math.random() * quotes.length)];
}