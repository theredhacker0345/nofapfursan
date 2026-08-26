import { useState, useEffect, useCallback, useMemo } from "react";
import { StreakData, getStreakData, saveStreakData, calculateStreak } from "@/lib/streakUtils";
import { useNostrStreak } from "./useNostrStreak";
import { logActivity } from "@/lib/activityLog";

export function useStreak() {
    const [streakData, setStreakData] = useState<StreakData>({
        startDate: null,
        longestStreak: 0,
        totalRelapses: 0,
    });

    const { saveStreak, fetchStreak, isSyncing, isOnline, pendingCount } = useNostrStreak();

    // Load local data
    const loadLocalData = useCallback(async () => {
        const data = await getStreakData();
        setStreakData(data);
    }, []);

    useEffect(() => {
        loadLocalData();

        // Listen for internal updates (e.g. from other tabs or components)
        const handleUpdate = () => loadLocalData();
        window.addEventListener('fursan_streak_updated', handleUpdate);
        return () => window.removeEventListener('fursan_streak_updated', handleUpdate);
    }, [loadLocalData]);

    // Sync from Nostr on load
    useEffect(() => {
        const sync = async () => {
            const remote = await fetchStreak();
            if (remote) {
                const local = await getStreakData();
                // Compare start dates directly: keep whichever streak started most
                // recently so a stale cloud backup can never roll back a newer
                // local reset/start.
                const localStartMs = local.startDate ? new Date(local.startDate).getTime() : 0;
                const remoteStartMs = remote.startDate ? new Date(remote.startDate).getTime() : 0;
                const needsUpdate =
                    remoteStartMs !== localStartMs ||
                    (remote.longestStreak || 0) > (local.longestStreak || 0) ||
                    (remote.totalRelapses || 0) > (local.totalRelapses || 0);

                if (needsUpdate) {
                    const merged: StreakData = {
                        startDate: remoteStartMs >= localStartMs ? remote.startDate : local.startDate,
                        longestStreak: Math.max(local.longestStreak || 0, remote.longestStreak || 0),
                        totalRelapses: Math.max(local.totalRelapses || 0, remote.totalRelapses || 0),
                    };
                    setStreakData(merged);
                    await saveStreakData(merged);
                }
            }
        };
        const timer = setTimeout(sync, 1500);
        return () => clearTimeout(timer);
    }, [fetchStreak]);

    // Live streak calculation
    const [liveStreak, setLiveStreak] = useState({ days: 0, hours: 0, minutes: 0 });

    const updateLiveStreak = useCallback(() => {
        setLiveStreak(calculateStreak(streakData.startDate));
    }, [streakData.startDate]);

    useEffect(() => {
        updateLiveStreak();
        const interval = setInterval(updateLiveStreak, 60000);
        return () => clearInterval(interval);
    }, [updateLiveStreak]);

    // Auto-update longest streak
    useEffect(() => {
        setStreakData(prev => {
            if (liveStreak.days > prev.longestStreak) {
                const updated = { ...prev, longestStreak: liveStreak.days };
                saveStreakData(updated);
                return updated;
            }
            return prev;
        });
    }, [liveStreak.days]);

    const handleStart = useCallback(() => {
        const newData: StreakData = {
            ...streakData,
            startDate: new Date().toISOString(),
        };
        setStreakData(newData);
        saveStreakData(newData);
        logActivity('streak_start', 'New streak started - Day 0 begins!');
        saveStreak({
            days: 0,
            startDate: newData.startDate,
            longestStreak: newData.longestStreak,
            totalRelapses: newData.totalRelapses,
            timestamp: Date.now(),
        });
    }, [streakData, saveStreak]);

    const handleReset = useCallback(() => {
        const current = calculateStreak(streakData.startDate);
        const newData: StreakData = {
            startDate: null,
            longestStreak: Math.max(streakData.longestStreak, current.days),
            totalRelapses: streakData.totalRelapses + 1,
        };
        setStreakData(newData);
        saveStreakData(newData);
        logActivity('streak_reset', `Streak reset after ${current.days} days`);
        saveStreak({
            days: 0,
            startDate: null,
            longestStreak: newData.longestStreak,
            totalRelapses: newData.totalRelapses,
            timestamp: Date.now(),
        });
    }, [streakData, saveStreak]);

    return {
        streakData,
        liveStreak,
        isSyncing,
        isOnline,
        pendingCount,
        handleStart,
        handleReset,
        fetchStreak // optionally expose
    };
}
