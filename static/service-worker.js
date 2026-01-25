// Minimal service worker for caching static assets and enabling basic offline support.
// Strategy:
// - On install: cache a set of core files.
// - On fetch: serve same-origin static assets from cache first, fall back to network.
// - Do not aggressively cache cross-origin API responses (like scryfall API).

const CACHE_NAME = 'Naereens-MTG-Life-Tracker-v1';
const CORE_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icons/favicon.ico',
  './icons/icon-128x128.png',
  './icons/icon-192x192.png',
  './icons/icon-256x256.png',
  './icons/icon-512x512.png',
  './icons/icon-1024x1024.png',
  './black-mana-symbol.webp',
  './blue-mana-symbol.webp',
  './green-mana-symbol.webp',
  './red-mana-symbol.webp',
  './storm-counter-symbol.webp',
  './waste-mana-symbol.webp',
  './white-mana-symbol.webp',
  './dicefont/dicefont.woff',
  './dicefont/dicefont.svg',
  './dicefont/dicefont.ttf',
  './dicefont/dicefont.eot',
  './dicefont/dicefont.css'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(CORE_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
    ))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // For same-origin navigation and static assets: cache-first
  if (url.origin === location.origin) {
    event.respondWith(
      caches.match(req).then(cached => {
        if (cached) return cached;
        return fetch(req).then(networkRes => {
          // Optionally cache fetched asset if it's a GET and response OK
          if (req.method === 'GET' && networkRes && networkRes.status === 200) {
            const copy = networkRes.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(req, copy));
          }
          return networkRes;
        }).catch(() => {
          // Fallback: if navigation, serve cached index.html
          if (req.mode === 'navigate') return caches.match('/index.html');
          return new Response('Offline', { status: 503, statusText: 'Offline' });
        });
      })
    );
    return;
  }

  // For cross-origin requests (APIs like scryfall), prefer network and don't cache here
  event.respondWith(fetch(req).catch(() => new Response('Offline', { status: 503 })));
});

// Simple message handler (optional)
self.addEventListener('message', (event) => {
  if (event.data === 'skipWaiting') self.skipWaiting();
});
