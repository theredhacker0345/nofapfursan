import { useState, useCallback, useEffect, useRef } from "react";
import {
  saveStreak as nostrSaveStreak,
  fetchStreak as nostrFetchStreak,
  syncStreak as nostrSyncStreak,
  generateOrLoadKeys,
  initNetworkListener,
  subscribeToNetworkState,
  manualFlush,
  getPendingCount,
  StreakPayload,
  NetworkState,
} from "@/services/nostr";

interface UseNostrStreakOptions {
  autoSync?: boolean;
}

interface UseNostrStreakReturn {
  isSyncing: boolean;
  lastSyncTime: Date | null;
  error: string | null;

  publicKey: string | null;

  isOnline: boolean;
  pendingCount: number;

  saveStreak: (data: StreakPayload) => Promise<boolean>;
  fetchStreak: () => Promise<StreakPayload | null>;
  syncStreak: (localData: StreakPayload) => Promise<StreakPayload>;
  initializeKeys: () => Promise<void>;
  flushPendingEvents: () => Promise<void>;
}

export function useNostrStreak(options: UseNostrStreakOptions = {}): UseNostrStreakReturn {
  const { autoSync = false } = options;

  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [publicKey, setPublicKey] = useState<string | null>(null);

  const [isOnline, setIsOnline] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);

  // Read through a ref so every callback below keeps a stable identity. A new
  // `fetchStreak` on each connectivity flip used to re-trigger the cloud-sync
  // effect, which is how a fresh reset got undone within seconds.
  const onlineRef = useRef(true);
  const mountedRef = useRef(true);
  const networkReadyRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  /* ── Network state wiring (once per hook instance) ─────────────────── */
  useEffect(() => {
    if (networkReadyRef.current) return;
    networkReadyRef.current = true;

    void initNetworkListener().catch((err) => {
      console.error("[useNostrStreak] Network listener init failed", err);
    });

    const unsubscribe = subscribeToNetworkState((state: NetworkState) => {
      onlineRef.current = state.isOnline;
      if (!mountedRef.current) return;
      setIsOnline(state.isOnline);
      setPendingCount(state.pendingCount);
      if (state.isSyncing) setIsSyncing(true);
    });

    void getPendingCount().then((count) => {
      if (mountedRef.current) setPendingCount(count);
    });

    return unsubscribe;
  }, []);

  const initializeKeys = useCallback(async () => {
    try {
      const keys = await generateOrLoadKeys();
      if (mountedRef.current) setPublicKey(keys.publicKey);
    } catch {
      // A corrupt/absent identity must never crash a screen — surfaces that
      // need one show an explicit recovery state instead.
      if (mountedRef.current) setError("Identity unavailable");
    }
  }, []);

  const refreshPending = useCallback(async () => {
    const count = await getPendingCount();
    if (mountedRef.current) setPendingCount(count);
  }, []);

  const saveStreak = useCallback(
    async (data: StreakPayload): Promise<boolean> => {
      setIsSyncing(true);
      setError(null);
      try {
        const success = await nostrSaveStreak(data);
        if (success) setLastSyncTime(new Date());
        await refreshPending();
        return success;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to save streak");
        console.error("[useNostrStreak] Save failed", err);
        return false;
      } finally {
        if (mountedRef.current) setIsSyncing(false);
      }
    },
    [refreshPending],
  );

  const fetchStreak = useCallback(async (): Promise<StreakPayload | null> => {
    if (!onlineRef.current) return null;
    setIsSyncing(true);
    setError(null);
    try {
      const data = await nostrFetchStreak();
      if (data) setLastSyncTime(new Date());
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch streak");
      console.error("[useNostrStreak] Fetch failed", err);
      return null;
    } finally {
      if (mountedRef.current) setIsSyncing(false);
    }
  }, []);

  const syncStreak = useCallback(async (localData: StreakPayload): Promise<StreakPayload> => {
    setIsSyncing(true);
    setError(null);
    try {
      const merged = await nostrSyncStreak(localData);
      setLastSyncTime(new Date());
      return merged;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to sync streak");
      console.error("[useNostrStreak] Sync failed", err);
      return localData;
    } finally {
      if (mountedRef.current) setIsSyncing(false);
    }
  }, []);

  const flushPendingEvents = useCallback(async () => {
    if (!onlineRef.current) {
      setError("Cannot sync while offline");
      return;
    }
    setIsSyncing(true);
    try {
      await manualFlush();
      await refreshPending();
      setLastSyncTime(new Date());
    } catch (err) {
      console.error("[useNostrStreak] Flush failed", err);
    } finally {
      if (mountedRef.current) setIsSyncing(false);
    }
  }, [refreshPending]);

  useEffect(() => {
    void initializeKeys();
  }, [initializeKeys]);

  // Keep `autoSync` meaningful instead of decorative.
  const syncStreakRef = useRef(syncStreak);
  syncStreakRef.current = syncStreak;
  useEffect(() => {
    if (!autoSync || !isOnline) return;
    void syncStreakRef.current({
      days: 0,
      startDate: null,
      longestStreak: 0,
      totalRelapses: 0,
      updatedAt: 0,
      timestamp: 0,
    });
  }, [autoSync, isOnline]);

  return {
    isSyncing,
    lastSyncTime,
    error,
    publicKey,
    isOnline,
    pendingCount,
    saveStreak,
    fetchStreak,
    syncStreak,
    initializeKeys,
    flushPendingEvents,
  };
}