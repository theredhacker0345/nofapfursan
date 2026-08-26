// Service Worker Registration
export async function registerServiceWorker() {
  try {
    if (!('serviceWorker' in navigator)) return null;

    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
    });

    console.log('[FURSAN] SW registered:', registration.scope);

    // Check for updates
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;
      if (newWorker) {
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            console.log('[FURSAN] New content available, refresh to update');
          }
        });
      }
    });

    return registration;
  } catch (error) {
    console.warn('[FURSAN] SW registration failed (non-blocking):', error);
    return null;
  }
}

// Background Sync Registration
export async function registerBackgroundSync() {
  try {
    const registration = await navigator.serviceWorker.ready;
    if ('sync' in registration) {
      await (registration as ServiceWorkerRegistration & { sync: SyncManagerLike }).sync.register('sync-streak-data');
      console.log('[FURSAN-PWA] Background sync registered');
      return true;
    }
  } catch (error) {
    console.warn('[FURSAN-PWA] Background sync not supported or denied (non-blocking).');
  }
  return false;
}

// Periodic Background Sync Registration
interface SyncManagerLike {
  register: (tag: string) => Promise<void>;
}

interface PeriodicSyncRegistration extends ServiceWorkerRegistration {
  periodicSync?: {
    register: (tag: string, options: { minInterval: number }) => Promise<void>;
  };
}

function supportsPeriodicSync(): boolean {
  return typeof window !== 'undefined' &&
    'ServiceWorkerRegistration' in window &&
    'periodicSync' in window.ServiceWorkerRegistration.prototype;
}

export async function registerPeriodicSync() {
  if ('serviceWorker' in navigator && supportsPeriodicSync()) {
    try {
      const registration = await navigator.serviceWorker.ready;
      const status = await navigator.permissions.query({
        name: 'periodic-background-sync' as PermissionName,
      });

      if (status.state === 'granted') {
        const storedInterval = localStorage.getItem("fursan_notification_interval_hours");
        const intervalHours = storedInterval ? parseInt(storedInterval) : 3;
        await (registration as PeriodicSyncRegistration).periodicSync?.register('check-motivation', {
          minInterval: intervalHours * 60 * 60 * 1000,
        });
        console.log(`Periodic sync registered (Interval: ${intervalHours}h)`);
        return true;
      }
    } catch (error) {
      console.error('Periodic sync registration failed:', error);
    }
  }
  return false;
}

// Push Notification Subscription
export async function subscribeToPush(): Promise<PushSubscription | null> {
  if ('serviceWorker' in navigator && 'PushManager' in window) {
    try {
      const registration = await navigator.serviceWorker.ready;

      // Check existing subscription
      let subscription = await registration.pushManager.getSubscription();

      if (!subscription) {
        // Create new subscription (using a placeholder VAPID key - replace with real one for production)
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(
            'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U'
          ),
        });
        console.log('Push subscription created');
      }

      return subscription;
    } catch (error) {
      console.error('Push subscription failed:', error);
      return null;
    }
  }
  return null;
}

// Helper to convert VAPID key
function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray.buffer;
}

// Check if all PWA features are supported
export function checkPWASupport() {
  return {
    serviceWorker: 'serviceWorker' in navigator,
    push: 'PushManager' in window,
    notifications: 'Notification' in window,
    backgroundSync: 'SyncManager' in window,
    periodicSync: supportsPeriodicSync(),
  };
}
