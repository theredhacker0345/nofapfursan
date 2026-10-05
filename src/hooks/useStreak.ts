import { useCallback, useEffect, useRef, useState } from "react";
import {
  StreakData,
  StreakProgress,
  EMPTY_STREAK,
  getStreakData,
  saveStreakData,
  calculateStreak,
  mergeStreakData,
} from "@/lib/streakUtils";
import { useNostrStreak } from "./useNostrStreak";
import { logActivity } from "@/services/localStore";

const IDLE: StreakProgress = { days: 0, elapsedMs: 0, hours: 0, minutes: 0 };

/** Minutes between recomputations — cheap, and it covers midnight rollover. */
const TICK_MS = 60_000;

export function useStreak() {
  const [streakData, setStreakData] = useState<StreakData>(EMPTY_STREAK);
  const [ready, setReady] = useState(false);
  const [progress, setProgress] = useState<StreakProgress>(IDLE);

  const { saveStreak, fetchStreak, isSyncing, isOnline, pendingCount, error } = useNostrStreak();

  // Only the start date is needed to recompute progress.
  const startDate = streakData.startDate;

  const recompute = useCallback(() => {
    setProgress(calculateStreak(startDate));
  }, [startDate]);

  /* ── Load local record (source of truth) ───────────────────────────── */
  useEffect(() => {
    let cancelled = false;

    (async () => {
      const data = await getStreakData();
      if (cancelled) return;
      setStreakData(data);
      setReady(true);
    })();

    const handleUpdate = () => {
      void (async () => {
        const data = await getStreakData();
        if (!cancelled) setStreakData(data);
      })();
    };

    window.addEventListener("fursan_streak_updated", handleUpdate);
    return () => {
      cancelled = true;
      window.removeEventListener("fursan_streak_updated", handleUpdate);
    };
  }, []);

  /* ── Live clock ────────────────────────────────────────────────────── */
  useEffect(() => {
    recompute();
    const id = setInterval(recompute, TICK_MS);
    // A tab restored from the background can be hours stale.
    const onVisible = () => {
      if (document.visibilityState === "visible") recompute();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [recompute]);

  /* ── Best-ever streak: derived at read time, persisted in an effect ── */
  const bestStreak = Math.max(streakData.longestStreak, progress.days);
  const persistedBest = useRef(streakData.longestStreak);

  useEffect(() => {
    if (!ready) return;
    if (bestStreak <= persistedBest.current) return;
    persistedBest.current = bestStreak;
    void saveStreakData({ ...streakData, longestStreak: bestStreak });
    // `streakData` is read for its non-longest fields only; the guard above is
    // what makes this idempotent.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bestStreak, ready]);

  /* ── Cloud sync ────────────────────────────────────────────────────── */
  const syncingRef = useRef(false);

  const syncFromCloud = useCallback(async () => {
    if (syncingRef.current) return;
    syncingRef.current = true;
    try {
      const remote = await fetchStreak();
      if (!remote) return;
      const local = await getStreakData();
      const merged = mergeStreakData(local, remote);
      const changed =
        merged.startDate !== local.startDate ||
        merged.longestStreak > local.longestStreak ||
        merged.totalRelapses > local.totalRelapses;
      if (!changed) return;
      const saved = await saveStreakData(merged);
      setStreakData(saved);
    } catch (err) {
      console.error("[Streak] Cloud sync failed", err);
    } finally {
      syncingRef.current = false;
    }
  }, [fetchStreak]);

  useEffect(() => {
    if (!ready) return;
    // One deferred pass on first load, one whenever connectivity returns.
    const initial = setTimeout(() => void syncFromCloud(), 1200);
    return () => clearTimeout(initial);
  }, [ready, syncFromCloud]);

  useEffect(() => {
    if (!ready || !isOnline) return;
    void syncFromCloud();
  }, [ready, isOnline, syncFromCloud]);

  /* ── Mutations ─────────────────────────────────────────────────────── */
  const persist = useCallback(
    async (next: StreakData, publish: boolean) => {
      const saved = await saveStreakData(next);
      setStreakData(saved);
      recompute();
      if (publish) {
        void saveStreak({
          days: saved.startDate ? calculateStreak(saved.startDate).days : 0,
          startDate: saved.startDate,
          longestStreak: Math.max(saved.longestStreak, progress.days),
          totalRelapses: saved.totalRelapses,
          updatedAt: saved.updatedAt,
          timestamp: saved.updatedAt,
        });
      }
    },
    [saveStreak, recompute, progress.days],
  );

  const handleStart = useCallback(() => {
    const startedAt = new Date().toISOString();
    logActivity("streak_start", "Streak started");
    return persist(
      { ...streakData, startDate: startedAt, longestStreak: Math.max(streakData.longestStreak, 0) },
      true,
    );
  }, [streakData, persist]);

  const handleReset = useCallback(() => {
    const current = calculateStreak(streakData.startDate);
    logActivity("streak_reset", `Streak reset after ${current.days} days`);
    return persist(
      {
        startDate: null,
        longestStreak: Math.max(streakData.longestStreak, current.days),
        totalRelapses: streakData.totalRelapses + 1,
        updatedAt: streakData.updatedAt + 1, // strict local win over any relay copy
      },
      true,
    );
  }, [streakData, persist]);

  return {
    streakData,
    liveStreak: progress,
    longestStreak: bestStreak,
    ready,
    isSyncing,
    isOnline,
    pendingCount,
    error,
    handleStart,
    handleReset,
    syncFromCloud,
  };
}