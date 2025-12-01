const CACHE_NAME = 'silvastream-v2.5.0';
const OFFLINE_PAGE = '/offline.html';
const ASSETS_TO_CACHE = [
    '/',
    '/index.html',
    '/styles/root.css',
    '/styles/components.css',
    '/styles/main.css',
    '/styles/animations.css',
    '/scripts/app.js',
    '/scripts/api.js',
    '/scripts/utils.js',
    '/assets/favicon.png',
    '/assets/logo.svg',
    '/assets/default-avatar.jpg',
    '/assets/placeholder.jpg'
];

// Install event
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Caching app shell');
                return cache.addAll(ASSETS_TO_CACHE);
            })
            .then(() => self.skipWaiting())
    );
});

// Activate event
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

// Fetch event with cache-first strategy
self.addEventListener('fetch', event => {
    // Skip non-GET requests
    if (event.request.method !== 'GET') return;

    // Skip API requests for caching
    if (event.request.url.includes('/api/')) {
        return event.respondWith(
            fetch(event.request).catch(() => {
                return new Response(JSON.stringify({
                    error: 'Network error',
                    offline: true
                }), {
                    headers: { 'Content-Type': 'application/json' }
                });
            })
        );
    }

    event.respondWith(
        caches.match(event.request)
            .then(response => {
                // Return cached response if found
                if (response) {
                    return response;
                }

                // Clone the request
                const fetchRequest = event.request.clone();

                return fetch(fetchRequest)
                    .then(response => {
                        // Check if valid response
                        if (!response || response.status !== 200 || response.type !== 'basic') {
                            return response;
                        }

                        // Clone the response
                        const responseToCache = response.clone();

                        // Cache the new response
                        caches.open(CACHE_NAME)
                            .then(cache => {
                                cache.put(event.request, responseToCache);
                            });

                        return response;
                    })
                    .catch(() => {
                        // If offline and request is for HTML, return offline page
                        if (event.request.headers.get('accept').includes('text/html')) {
                            return caches.match(OFFLINE_PAGE);
                        }

                        // Return cached images or placeholders for failed image requests
                        if (event.request.destination === 'image') {
                            return caches.match('/assets/placeholder.jpg');
                        }

                        return new Response('Offline', {
                            status: 503,
                            statusText: 'Service Unavailable',
                            headers: new Headers({
                                'Content-Type': 'text/plain'
                            })
                        });
                    });
            })
    );
});

// Background sync for failed requests
self.addEventListener('sync', event => {
    if (event.tag === 'sync-failed-requests') {
        event.waitUntil(syncFailedRequests());
    }
});

async function syncFailedRequests() {
    const cache = await caches.open('failed-requests');
    const requests = await cache.keys();
    
    for (const request of requests) {
        try {
            const response = await fetch(request);
            if (response.ok) {
                await cache.delete(request);
            }
        } catch (error) {
            console.log('Failed to sync:', request.url);
        }
    }
}

// Push notifications
self.addEventListener('push', event => {
    const options = {
        body: event.data ? event.data.text() : 'New update from SilvaStream',
        icon: '/assets/notification-icon.png',
        badge: '/assets/badge-icon.png',
        vibrate: [200, 100, 200],
        data: {
            dateOfArrival: Date.now(),
            primaryKey: '2'
        },
        actions: [
            {
                action: 'explore',
                title: 'Explore',
                icon: '/assets/explore-icon.png'
            },
            {
                action: 'close',
                title: 'Close',
                icon: '/assets/close-icon.png'
            }
        ]
    };

    event.waitUntil(
        self.registration.showNotification('SilvaStream', options)
    );
});

self.addEventListener('notificationclick', event => {
    event.notification.close();

    if (event.action === 'explore') {
        event.waitUntil(
            clients.openWindow('/')
        );
    } else {
        event.waitUntil(
            clients.openWindow('/')
        );
    }
});
