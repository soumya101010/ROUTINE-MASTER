// KILLER SERVICE WORKER - v3
// This file exists solely to replace the old 'sw.js' and wipe the cache.
// Once installed, it deletes all caches and claims the client.

const CACHE_NAME = 'killer-sw-v3-feb6';

self.addEventListener('install', (event) => {
  // Install immediately, don't wait
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      // DELETE ALL CACHES
      return Promise.all(
        cacheNames.map((cacheName) => {
          console.log('Killer SW deleting cache:', cacheName);
          return caches.delete(cacheName);
        })
      );
    }).then(() => {
      // Take control of the page immediately
      return self.clients.claim();
    })
  );
});

// Pass through all fetches to network (no caching)
self.addEventListener('fetch', (event) => {
  event.respondWith(fetch(event.request));
});
