const CACHE_NAME = 'saveup-v1'; // Renamed to synchronize with 'SaveUp'
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/style.css',
  '/script.js',
  '/manifest.json', // Added manifest for full PWA compliance
  'https://cdn.tailwindcss.com',
  'https://cdn.jsdelivr.net/npm/feather-icons/dist/feather.min.js'
];

// Install Event: Caches all essential files listed above
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(ASSETS_TO_CACHE);
      })
  );
  // Forces the waiting service worker to become the active service worker
  self.skipWaiting(); 
});

// Fetch Event: Intercepts network requests and serves from cache if available
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return file from cache if found, otherwise go to network
        return response || fetch(event.request);
      })
  );
});

// Activate Event: Cleans up old cache versions
self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          // Delete any cache that is NOT the current version (saveup-v1)
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
