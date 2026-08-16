// Sri Subramaniar Alayam — Service Worker
// Caches core app files so the app can install and open offline.
// Bump CACHE_NAME whenever core files change to force a refresh.
const CACHE_NAME = "temple-kiosk-v8";

const CORE_ASSETS = [
  "./index.html",
  "./style.css",
  "./script.js",
  "./data.js",
  "./content-data.js",
  "./manifest.json",
  "./assets/temple-logo.png",
  "./assets/qr-duitnow.jpg",
  "./assets/whatsapp-qr.png",
  "./assets/icons/icon-192.png",
  "./assets/icons/icon-512.png",
  "./assets/icons/icon-maskable-192.png",
  "./assets/icons/icon-maskable-512.png",
  "./assets/icons/apple-touch-icon.png",
  "./assets/deities/sri-subramaniar.jpg",
  "./assets/deities/sri-vinayagar.jpg",
  "./assets/deities/sri-ambal.jpg",
  "./assets/deities/vasantha-mandapam.jpg",
  "./assets/deities/sri-perumal.jpg",
  "./assets/deities/sri-garudar.jpg",
  "./assets/deities/anjenayar.jpg",
  "./assets/deities/sri-nagamma.jpg",
  "./assets/deities/sri-arasamara-pillayar.jpg",
  "./assets/deities/sri-idumban.jpg",
  "./assets/deities/sri-bairavar.jpg",
  "./assets/deities/navagraham.jpg"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) =>
        // Cache each file independently — if one path is wrong or briefly
        // unreachable, the rest still get cached and the service worker
        // still installs and activates. A strict cache.addAll() fails
        // installation entirely if even a single asset 404s, which silently
        // leaves the site with no active service worker — and without one,
        // Chrome won't offer a real "Install app", only a plain shortcut.
        Promise.allSettled(
          CORE_ASSETS.map((url) =>
            cache.add(url).catch((err) => {
              console.warn("[SW] failed to precache:", url, err);
            })
          )
        )
      )
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Cache-first for core assets; fall back to network, and cache anything new
// that gets fetched (e.g. Google Fonts) so subsequent visits work offline too.
// EXCEPTION: Google Sheets content requests always go network-first — this
// data is meant to update live when someone edits the sheet, so cache-first
// would freeze it at whatever was fetched the very first time.
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  // Browser extensions (ad blockers, password managers, etc.) can trigger
  // requests with schemes the Cache API doesn't support (chrome-extension:,
  // moz-extension:, etc.) — only handle real http(s) requests.
  if (!event.request.url.startsWith("http")) return;

  const isLiveSheetRequest = event.request.url.includes("docs.google.com/spreadsheets");

  if (isLiveSheetRequest) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response && response.status === 200) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          }
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request)
        .then((response) => {
          if (response && response.status === 200) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          }
          return response;
        })
        .catch(() => cached);
    })
  );
});
