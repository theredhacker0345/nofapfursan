/* Fursan service worker.
 *
 * Precaches the whole build manifest, not a hand-written list. The previous
 * version cached six URLs and nothing else, so a cold install that went offline
 * before visiting a route failed its dynamic import and rendered the global
 * error screen.
 *
 * `__PRECACHE__` is replaced with the real asset list at build time by
 * scripts/build-sw.mjs. Do not edit that placeholder.
 */

const VERSION = "__BUILD_ID__";
const CACHE_NAME = `fursan-${VERSION}`;

const PRECACHE = [
  "__PRECACHE__",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      // Individually, so one missing icon cannot reject the whole install.
      await Promise.all(
        PRECACHE.map((url) =>
          cache.add(new Request(url, { cache: "reload" })).catch(() => undefined),
        ),
      );
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.filter((name) => name !== CACHE_NAME).map((name) => caches.delete(name)));
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return; // relays, fonts, CDN stay untouched

  // Hashed assets are immutable — serve them straight from the cache.
  if (/\/assets\/.+-[A-Za-z0-9_-]{8,}\.(js|css|woff2|png|jpg|svg)$/.test(url.pathname)) {
    event.respondWith(
      caches.match(request).then(
        (hit) =>
          hit ||
          fetch(request).then((response) => {
            if (response.ok) {
              const copy = response.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
            }
            return response;
          }),
      ),
    );
    return;
  }

  // Navigations: network first, cached shell as the offline fallback.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put("/index.html", copy));
          return response;
        })
        .catch(() => caches.match("/index.html").then((hit) => hit ?? offlineResponse())),
    );
    return;
  }

  // Everything else same-origin: stale-while-revalidate.
  event.respondWith(
    caches.match(request).then((hit) => {
      const network = fetch(request)
        .then((response) => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(() => hit ?? offlineResponse());
      return hit ?? network;
    }),
  );
});

function offlineResponse() {
  return new Response("Offline", {
    status: 503,
    headers: { "Content-Type": "text/plain" },
  });
}

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") self.skipWaiting();
});