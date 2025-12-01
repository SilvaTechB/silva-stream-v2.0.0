// Service Worker for SilvaStream
const CACHE_NAME = 'silvastream-v2.0.0';
const STATIC_CACHE = 'static-v2';
const DYNAMIC_CACHE = 'dynamic-v2';
const API_CACHE = 'api-v2';

// Assets to cache on install
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/styles/main.css',
    '/styles/animations.css',
    '/styles/details.css',
    '/scripts/config.js',
    '/scripts/api.js',
    '/scripts/app.js',
    '/scripts/player.js',
    '/scripts/theme.js',
    '/manifest.json',
    '/icons/icon-192.png',
    '/icons/icon-512.png'
];

// Install Event
self.addEventListener('install', (event) => {
    console.log('Service Worker: Installing...');
    
    event.waitUntil(
        caches.open(STATIC_CACHE)
            .then(cache => {
                console.log('Service Worker: Caching Static Assets');
                return cache.addAll(STATIC_ASSETS);
            })
            .then(() => {
                console.log('Service Worker: Install Complete');
                return self.skipWaiting();
            })
    );
});

// Activate Event
self.addEventListener('activate', (event) => {
    console.log('Service Worker: Activating...');
    
    // Clean up old caches
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== STATIC_CACHE && 
                        cacheName !== DYNAMIC_CACHE && 
                        cacheName !== API_CACHE) {
                        console.log('Service Worker: Clearing Old Cache', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
        .then(() => {
            console.log('Service Worker: Activate Complete');
            return self.clients.claim();
        })
    );
});

// Fetch Event with Cache Strategy
self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);
    
    // Skip non-HTTP requests
    if (!url.protocol.startsWith('http')) {
        return;
    }
    
    // API Requests - Cache with network-first strategy
    if (url.pathname.includes('/api/')) {
        event.respondWith(
            caches.open(API_CACHE).then(cache => {
                return fetch(event.request)
                    .then(response => {
                        // Clone the response
                        const responseClone = response.clone();
                        
                        // Cache successful responses
                        if (response.status === 200) {
                            cache.put(event.request, responseClone);
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
    
    // Static Assets - Cache-first strategy
    if (STATIC_ASSETS.some(asset => url.pathname.endsWith(asset))) {
        event.respondWith(
            caches.match(event.request).then(cachedResponse => {
                // Return cached response if available
                if (cachedResponse) {
                    return cachedResponse;
                }
                
                // Otherwise fetch from network
                return fetch(event.request).then(response => {
                    // Don't cache if not successful
                    if (!response || response.status !== 200) {
                        return response;
                    }
                    
                    // Clone and cache the response
                    const responseClone = response.clone();
                    caches.open(STATIC_CACHE).then(cache => {
                        cache.put(event.request, responseClone);
                    });
                    
                    return response;
                });
            })
        );
        return;
    }
    
    // Dynamic Content - Stale-while-revalidate strategy
    event.respondWith(
        caches.match(event.request).then(cachedResponse => {
            // Always make network request
            const fetchPromise = fetch(event.request).then(networkResponse => {
                // Update cache with new response
                caches.open(DYNAMIC_CACHE).then(cache => {
                    cache.put(event.request, networkResponse.clone());
                });
                
                // Send message to client about cache update
                self.clients.matchAll().then(clients => {
                    clients.forEach(client => {
                        client.postMessage({
                            type: 'CACHE_UPDATED',
                            url: event.request.url
                        });
                    });
                });
                
                return networkResponse;
            }).catch(error => {
                console.error('Fetch failed:', error);
            });
            
            // Return cached response immediately, then update from network
            return cachedResponse || fetchPromise;
        })
    );
});

// Background Sync for offline actions
self.addEventListener('sync', (event) => {
    if (event.tag === 'sync-playback-data') {
        event.waitUntil(syncPlaybackData());
    }
    
    if (event.tag === 'sync-analytics') {
        event.waitUntil(syncAnalyticsData());
    }
});

// Push Notification Handler
self.addEventListener('push', (event) => {
    if (!event.data) return;
    
    const data = event.data.json();
    const options = {
        body: data.body || 'New update available',
        icon: '/icons/icon-192.png',
        badge: '/icons/badge.png',
        tag: data.tag || 'silvastream-notification',
        data: data.data || {},
        actions: data.actions || []
    };
    
    event.waitUntil(
        self.registration.showNotification(data.title || 'SilvaStream', options)
    );
});

// Notification Click Handler
self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    
    const urlToOpen = event.notification.data.url || '/';
    
    event.waitUntil(
        clients.matchAll({
            type: 'window',
            includeUncontrolled: true
        }).then(windowClients => {
            // Check if window is already open
            for (let client of windowClients) {
                if (client.url === urlToOpen && 'focus' in client) {
                    return client.focus();
                }
            }
            
            // Open new window if not already open
            if (clients.openWindow) {
                return clients.openWindow(urlToOpen);
            }
        })
    );
});

// Message Handler from Client
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'CACHE_API_RESPONSE') {
        caches.open(API_CACHE).then(cache => {
            const request = new Request(event.data.url);
            const response = new Response(JSON.stringify(event.data.data), {
                headers: { 'Content-Type': 'application/json' }
            });
            cache.put(request, response);
        });
    }
    
    if (event.data && event.data.type === 'GET_CACHED_DATA') {
        caches.match(event.data.url).then(response => {
            if (response) {
                response.json().then(data => {
                    event.ports[0].postMessage({ success: true, data: data });
                });
            } else {
                event.ports[0].postMessage({ success: false });
            }
        });
    }
});

// Helper Functions
async function syncPlaybackData() {
    const playbackData = await getStoredData('playbackQueue');
    
    if (playbackData && playbackData.length > 0) {
        // Send playback data to server
        try {
            await fetch('/api/sync-playback', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(playbackData)
            });
            
            // Clear local queue on success
            await clearStoredData('playbackQueue');
        } catch (error) {
            console.error('Sync failed:', error);
        }
    }
}

async function syncAnalyticsData() {
    const analyticsData = await getStoredData('analyticsQueue');
    
    if (analyticsData && analyticsData.length > 0) {
        // Send analytics data to server in batches
        const batchSize = 10;
        for (let i = 0; i < analyticsData.length; i += batchSize) {
            const batch = analyticsData.slice(i, i + batchSize);
            
            try {
                await fetch('/api/analytics', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(batch)
                });
            } catch (error) {
                console.error('Analytics sync failed:', error);
                break;
            }
        }
        
        // Clear processed data
        const remaining = analyticsData.slice(Math.floor(analyticsData.length / batchSize) * batchSize);
        await setStoredData('analyticsQueue', remaining);
    }
}

async function getStoredData(key) {
    const cache = await caches.open(DYNAMIC_CACHE);
    const response = await cache.match(`/data/${key}`);
    
    if (response) {
        return response.json();
    }
    
    return null;
}

async function setStoredData(key, data) {
    const cache = await caches.open(DYNAMIC_CACHE);
    const request = new Request(`/data/${key}`);
    const response = new Response(JSON.stringify(data), {
        headers: { 'Content-Type': 'application/json' }
    });
    
    await cache.put(request, response);
}

async function clearStoredData(key) {
    const cache = await caches.open(DYNAMIC_CACHE);
    await cache.delete(`/data/${key}`);
}

// Periodically clean old cache entries
setInterval(async () => {
    const cache = await caches.open(DYNAMIC_CACHE);
    const requests = await cache.keys();
    
    const weekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
    
    for (const request of requests) {
        const response = await cache.match(request);
        if (response) {
            const date = response.headers.get('date');
            if (date && new Date(date).getTime() < weekAgo) {
                await cache.delete(request);
            }
        }
    }
}, 24 * 60 * 60 * 1000); // Run daily
