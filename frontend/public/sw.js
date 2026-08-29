/* CareFlow service worker — installability only (display: standalone).
 *
 * S-36: recommend is online-only. Never cache /facilities/recommend or any
 * API response. This worker calls skipWaiting and does not put requests
 * in the Cache API. Same-origin static shell is also not cached here.
 */
self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Do not intercept API traffic (including NEXT_PUBLIC_API_URL and
  // /facilities/recommend). Browser default: network only, never Cache Storage.
  if (
    url.pathname.includes("/facilities/recommend") ||
    url.pathname.startsWith("/api")
  ) {
    return;
  }

  // No respondWith — no offline shell, no API cache.
});
