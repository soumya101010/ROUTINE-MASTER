const CACHE_NAME = 'routinemaster-v7-feb6';
const urlsToCache = [
    '/',
    '/index.html',
    '/manifest.json',
    '/icon-192.png',
    '/icon-512.png'
];

// Install a service worker
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Opened cache');
                return cache.addAll(urlsToCache);
            })
    );
    // Force the waiting service worker to become the active service worker
    self.skipWaiting();
});

// Network-First strategy for navigation, Cache-First for assets
self.addEventListener('fetch', event => {
    const { request } = event;

    // For navigation requests (HTML pages), always use network first
    if (request.mode === 'navigate' || request.destination === 'document') {
        event.respondWith(
            fetch(request)
                .then(async response => {
                    if (response.status === 404) {
                        const indexFallback = await caches.match('/') || await caches.match('/index.html');
                        if (indexFallback) return indexFallback;
                    }
                    const responseClone = response.clone();
                    caches.open(CACHE_NAME).then(cache => {
                        cache.put(request, responseClone);
                    });
                    return response;
                })
                .catch(async () => {
                    const cached = await caches.match(request);
                    if (cached) return cached;
                    return (await caches.match('/')) || (await caches.match('/index.html'));
                })
        );
    } else {
        // For CSS/JS assets, use network-first to prevent Android caching issues
        // For images and other static assets, use cache-first
        const isCssOrJs = request.url.includes('.css') || request.url.includes('.js') || request.url.includes('/src/');

        if (isCssOrJs) {
            // Network-first for CSS/JS to ensure fresh styles on Android
            event.respondWith(
                fetch(request)
                    .then(response => {
                        const responseClone = response.clone();
                        caches.open(CACHE_NAME).then(cache => {
                            cache.put(request, responseClone);
                        });
                        return response;
                    })
                    .catch(() => {
                        return caches.match(request);
                    })
            );
        } else {
            // Cache-first for images and static assets
            event.respondWith(
                caches.match(request)
                    .then(response => {
                        return response || fetch(request).then(fetchResponse => {
                            return caches.open(CACHE_NAME).then(cache => {
                                cache.put(request, fetchResponse.clone());
                                return fetchResponse;
                            });
                        });
                    })
            );
        }
    }
});

// Update a service worker
self.addEventListener('activate', event => {
    const cacheWhitelist = [CACHE_NAME];
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheWhitelist.indexOf(cacheName) === -1) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});

// Push notification logic
self.addEventListener('push', event => {
    const data = event.data.json();
    const options = {
        body: data.body,
        icon: '/icon-192.png',
        badge: '/icon-192.png',
        vibrate: [100, 50, 100],
        data: {
            dateOfArrival: Date.now(),
            primaryKey: 1
        },
        actions: [
            { action: 'explore', title: 'Open App', icon: '/icon-192.png' },
            { action: 'close', title: 'Close', icon: '/icon-192.png' },
        ]
    };

    event.waitUntil(
        self.registration.showNotification(data.title, options)
    );
});
