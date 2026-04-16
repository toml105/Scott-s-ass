const CACHE_NAME = 'tavern-royale-v10';
const ASSETS = [
  './',
  './index.html',
  './css/styles.css?v=9',
  './css/animations.css?v=9',
  './js/cards.js?v=9',
  './js/game.js?v=9',
  './js/rounds.js?v=9',
  './js/ui.js?v=9',
  './js/app.js?v=9',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './manifest.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Network-first: try fresh files, fall back to cache for offline
self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
