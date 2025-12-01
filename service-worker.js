// service-worker.js
const CACHE_NAME = 'silvastream-v2.0.0';
const API_CACHE = 'silvastream-api-v1';
const ASSETS_CACHE = 'silvastream-assets-v1';

// Assets to cache on install
const PRECACHE_ASSETS = [
    '/',
    '/index.html',
    '/styles/main.css',
    '/scripts/api.js',
    '/scripts/app.js',
    '/manifest.json',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css'
];

// API endpoints to cache
const API_ENDPOINTS = [
    '/api/search/',
    '/api/info/',
    '/api/sources/'
];

// Install event - precache assets
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(PRECACHE_ASSETS))
            .then(() => self.skipWaiting())
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME && 
                        cacheName !== API_CACHE && 
                        cacheName !== ASSETS_CACHE) {
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

// Fetch event - cache strategies
self.addEventListener('fetch', event => {
    const url = new URL(event.request.url);
    
    // API requests - Cache with network fallback
    if (API_ENDPOINTS.some(endpoint => url.pathname.includes(endpoint))) {
        event.respondWith(
            caches.open(API_CACHE).then(cache => {
                return fetch(event.request)
                    .then(response => {
                        // Cache successful API responses
                        if (response.status === 200) {
                            cache.put(event.request, response.clone());
                        }
                        return response;
                    })
                    .catch(() => {
                        // Return cached response if network fails
                        return cache.match(event.request);
                    });
            })
        );
        return;
    }
    
    // Static assets - Cache first, then network
    if (url.origin === self.location.origin) {
        event.respondWith(
            caches.match(event.request).then(cachedResponse => {
                if (cachedResponse) {
                    // Update cache in background
                    fetch(event.request)
                        .then(response => {
                            caches.open(CACHE_NAME)
                                .then(cache => cache.put(event.request, response));
                        })
                        .catch(() => {});
                    return cachedResponse;
                }
                
                return fetch(event.request)
                    .then(response => {
                        // Don't cache non-successful responses
                        if (!response || response.status !== 200) {
                            return response;
                        }
                        
                        // Clone the response
                        const responseToCache = response.clone();
                        
                        caches.open(CACHE_NAME)
                            .then(cache => cache.put(event.request, responseToCache));
                        
                        return response;
                    });
            })
        );
        return;
    }
    
    // External resources - Network first, then cache
    if (url.origin.includes('cdnjs.cloudflare.com') || 
        url.origin.includes('movieapi.giftedtech.co.ke')) {
        event.respondWith(
            fetch(event.request)
                .then(response => {
                    // Cache successful responses
                    if (response.status === 200) {
                        const responseToCache = response.clone();
                        caches.open(ASSETS_CACHE)
                            .then(cache => cache.put(event.request, responseToCache));
                    }
                    return response;
                })
                .catch(() => {
                    return caches.match(event.request);
                })
        );
        return;
    }
});

// Background sync for failed requests
self.addEventListener('sync', event => {
    if (event.tag === 'sync-api-requests') {
        event.waitUntil(syncFailedRequests());
    }
});

async function syncFailedRequests() {
    // Implementation for background sync
    // This would retry failed API requests
}

// Push notifications
self.addEventListener('push', event => {
    const options = {
        body: event.data?.text() || 'New content available on SilvaStream!',
        icon: '/icons/icon-192x192.png',
        badge: '/icons/badge-72x72.png',
        vibrate: [100, 50, 100],
        data: {
            dateOfArrival: Date.now(),
            primaryKey: '1'
        },
        actions: [
            {
                action: 'explore',
                title: 'Explore Now'
            },
            {
                action: 'close',
                title: 'Close'
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
    }
});

// Periodic background sync for updates
self.addEventListener('periodicsync', event => {
    if (event.tag === 'update-content') {
        event.waitUntil(updateCachedContent());
    }
});

async function updateCachedContent() {
    // Update cached content periodically
    const cache = await caches.open(CACHE_NAME);
    const requests = await cache.keys();
    
    for (const request of requests) {
        try {
            const response = await fetch(request);
            if (response.ok) {
                await cache.put(request, response);
            }
        } catch (error) {
            console.log('Failed to update:', request.url);
        }
    }
}
