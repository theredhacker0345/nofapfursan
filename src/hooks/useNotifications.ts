import { useSyncExternalStore, useCallback, useEffect } from "react";
import { LocalNotifications } from "@capacitor/local-notifications";
import { Capacitor } from "@capacitor/core";
import { MOTIVATIONAL_MESSAGES } from "@/data/motivation";

const ENABLED_KEY = "fursan_notifications_enabled";
const INTERVAL_KEY = "fursan_notification_interval_hours";
const DEFAULT_INTERVAL_HOURS = 3;
const HORIZON = 10;

/**
 * Shared singleton state.
 *
 * This hook used to be instantiated twice (once by Settings, once inside
 * NotificationToggle) with independent `useState` and independent effects, so
 * the Enable button and the interval slider disagreed until a reload. Module
 * scope plus `useSyncExternalStore` makes every consumer read one truth.
 */
interface NotificationState {
  permission: NotificationPermission | string;
  enabled: boolean;
  intervalHours: number;
  supported: boolean;
}

const isSupported = () => Capacitor.isNativePlatform() || typeof window !== "undefined" && "Notification" in window;

const readStored = (): Pick<NotificationState, "enabled" | "intervalHours"> => {
  try {
    const rawInterval = parseInt(localStorage.getItem(INTERVAL_KEY) ?? "", 10);
    return {
      enabled: localStorage.getItem(ENABLED_KEY) === "true",
      intervalHours: Number.isFinite(rawInterval)
        ? Math.min(24, Math.max(1, rawInterval))
        : DEFAULT_INTERVAL_HOURS,
    };
  } catch {
    return { enabled: false, intervalHours: DEFAULT_INTERVAL_HOURS };
  }
};

let state: NotificationState = { permission: "default", ...readStored(), supported: isSupported() };
const listeners = new Set<() => void>();

const setState = (patch: Partial<NotificationState>) => {
  state = { ...state, ...patch };
  for (const listener of listeners) listener();
};

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

const getSnapshot = () => state;

const persist = (patch: Partial<NotificationState>) => {
  setState(patch);
  try {
    if (patch.enabled !== undefined) localStorage.setItem(ENABLED_KEY, String(patch.enabled));
    if (patch.intervalHours !== undefined)
      localStorage.setItem(INTERVAL_KEY, String(patch.intervalHours));
  } catch {
    /* storage unavailable — the in-memory value still applies */
  }
};

const cancelAll = async () => {
  if (!Capacitor.isNativePlatform()) return;
  try {
    const pending = await LocalNotifications.getPending();
    if (pending.notifications.length > 0) await LocalNotifications.cancel(pending);
  } catch (error) {
    console.warn("[Notifications] Cancel failed", error);
  }
};

const schedule = async (intervalHours: number, probe: boolean) => {
  if (!isSupported()) return false;

  await cancelAll();

  const intervalMs = intervalHours * 3_600_000;
  const body = MOTIVATIONAL_MESSAGES[Math.floor(Math.random() * MOTIVATIONAL_MESSAGES.length)];

  if (Capacitor.isNativePlatform()) {
    const notifications = Array.from({ length: HORIZON }, (_, i) => ({
      id: i + 1,
      title: "Fursan",
      body,
      schedule: { at: new Date(Date.now() + intervalMs * (i + 1)) },
      // A monochrome drawable must exist in res/ or scheduling throws.
      smallIcon: "ic_stat_icon",
    }));
    try {
      await LocalNotifications.schedule({ notifications });
      return true;
    } catch (error) {
      console.error("[Notifications] Scheduling failed", error);
      return false;
    }
  }

  if (!probe) {
    // Browsers cannot schedule future notifications from a page. Be honest
    // rather than logging "SIMULATED" and reporting success.
    return false;
  }
  try {
    new Notification("Fursan", { body, tag: "fursan-reminder" });
    return true;
  } catch (error) {
    console.warn("[Notifications] Web notification failed", error);
    return false;
  }
};

let initialised = false;

export function useNotifications() {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  const refreshPermission = useCallback(async () => {
    try {
      if (Capacitor.isNativePlatform()) {
        const status = await LocalNotifications.checkPermissions();
        setState({ permission: status.display });
      } else if ("Notification" in window) {
        setState({ permission: Notification.permission });
      }
    } catch (error) {
      console.warn("[Notifications] Permission check failed", error);
    }
  }, []);

  const showTestNotification = useCallback(async () => {
    const body = MOTIVATIONAL_MESSAGES[Math.floor(Math.random() * MOTIVATIONAL_MESSAGES.length)];
    if (Capacitor.isNativePlatform()) {
      try {
        await LocalNotifications.schedule({
          notifications: [
            { id: 999, title: "Fursan", body, schedule: { at: new Date(Date.now() + 800) } },
          ],
        });
        return true;
      } catch (error) {
        console.warn("[Notifications] Test notification failed", error);
        return false;
      }
    }
    if ("Notification" in window && Notification.permission === "granted") {
      try {
        new Notification("Fursan", { body });
        return true;
      } catch {
        return false;
      }
    }
    return false;
  }, []);

  const enable = useCallback(async () => {
    try {
      let granted = false;
      if (Capacitor.isNativePlatform()) {
        const result = await LocalNotifications.requestPermissions();
        setState({ permission: result.display });
        granted = result.display === "granted";
      } else if ("Notification" in window) {
        const result =
          Notification.permission === "default"
            ? await Notification.requestPermission()
            : Notification.permission;
        setState({ permission: result });
        granted = result === "granted";
      }

      if (!granted) {
        persist({ enabled: false });
        return false;
      }

      persist({ enabled: true });
      await schedule(state.intervalHours, false);
      void showTestNotification();
      return true;
    } catch (error) {
      console.error("[Notifications] Enable failed", error);
      persist({ enabled: false });
      return false;
    }
  }, [showTestNotification]);

  const disable = useCallback(async () => {
    persist({ enabled: false });
    await cancelAll();
    return false;
  }, []);

  const toggleNotifications = useCallback(
    () => (state.enabled ? disable() : enable()),
    [disable, enable],
  );

  const setIntervalHours = useCallback(
    async (hours: number) => {
      const clamped = Math.min(24, Math.max(1, Math.round(hours)));
      persist({ intervalHours: clamped });
      if (state.enabled) await schedule(clamped, false);
    },
    [],
  );

  // Initialising during render would be a side effect; do it once on mount.
  useEffect(() => {
    if (initialised) return;
    initialised = true;
    void (async () => {
      await refreshPermission();
      const stored = readStored();
      setState(stored);
      if (stored.enabled) await schedule(stored.intervalHours, false);
    })();
  }, [refreshPermission]);

  return {
    permission: snapshot.permission,
    enabled: snapshot.enabled,
    intervalHours: snapshot.intervalHours,
    setIntervalHours,
    toggleNotifications,
    showTestNotification,
    refreshPermission,
    /** False on the web, where future notifications cannot be scheduled. */
    canScheduleAhead: Capacitor.isNativePlatform(),
    isSupported: snapshot.supported,
  };
}