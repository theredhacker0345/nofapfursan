// Service Worker registration.
//
// Notes on what the previous version got wrong:
//  - `registerBackgroundSync`, `registerPeriodicSync` and `subscribeToPush`
//    were exported but never called by anything, and `subscribeToPush` embedded
//    a VAPID key with no push service behind it. All three are gone; the app's
//    own queue in src/services/nostr.ts is what actually retries writes, and it
//    works with or without a service worker.
//  - The update path only logged to the console, so users stayed pinned to a
//    stale shell forever. It now activates the new worker and refreshes.

let registrationPromise: Promise<ServiceWorkerRegistration | null> | null = null;

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (registrationPromise) return registrationPromise;

  registrationPromise = (async () => {
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return null;
    // Dev servers and tests do not need a worker; it only adds noise.
    if (import.meta.env.DEV) return null;

    try {
      const registration = await navigator.serviceWorker.register("/sw.js", { scope: "/" });

      registration.addEventListener("updatefound", () => {
        const installing = registration.installing;
        if (!installing) return;
        installing.addEventListener("statechange", () => {
          // An updated worker is only safe to activate when there are no other
          // clients; `skipWaiting` alone can swap assets out from under a live
          // page mid-session.
          if (installing.state === "installed" && navigator.serviceWorker.controller) {
            installing.postMessage({ type: "SKIP_WAITING" });
          }
        });
      });

      let refreshing = false;
      navigator.serviceWorker.addEventListener("controllerchange", () => {
        if (refreshing) return;
        refreshing = true;
        window.location.reload();
      });

      return registration;
    } catch (error) {
      console.warn("[PWA] Service worker registration failed:", error);
      return null;
    }
  })();

  return registrationPromise;
}

/** Feature detection, used by the diagnostics in Settings. */
export function checkPWASupport() {
  const sw = typeof navigator !== "undefined" && "serviceWorker" in navigator;
  return {
    serviceWorker: sw,
    notifications: typeof window !== "undefined" && "Notification" in window,
    backgroundSync: typeof window !== "undefined" && "SyncManager" in window,
    // Future-dated notifications are a native-only capability; the web build
    // cannot schedule them and says so in Settings.
    scheduledReminders: import.meta.env.MOBILE === "true",
  };
}