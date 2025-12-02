// Cache Management for SilvaStream
class CacheManager {
    constructor() {
        this.cacheName = 'silvastream-v3';
        this.cacheDuration = 3600000; // 1 hour in milliseconds
        this.maxItems = 100;
        this.init();
    }

    async init() {
        // Check if cache API is available
        if ('caches' in window) {
            await this.cleanupOldCaches();
        }
    }

    async set(key, data, duration = this.cacheDuration) {
        const cacheData = {
            data: data,
            timestamp: Date.now(),
            expires: Date.now() + duration
        };

        try {
            // Try IndexedDB first
            if ('indexedDB' in window) {
                await this.setIndexedDB(key, cacheData);
            } else {
                // Fallback to localStorage
                localStorage.setItem(`cache_${key}`, JSON.stringify(cacheData));
            }

            // Also store in memory cache for quick access
            sessionStorage.setItem(`cache_${key}`, JSON.stringify(cacheData));
        } catch (error) {
            console.error('Cache set error:', error);
        }
    }

    async get(key) {
        // Check memory cache first
        const memoryCache = sessionStorage.getItem(`cache_${key}`);
        if (memoryCache) {
            const parsed = JSON.parse(memoryCache);
            if (parsed.expires > Date.now()) {
                return parsed.data;
            }
            sessionStorage.removeItem(`cache_${key}`);
        }

        try {
            let cacheData = null;

            // Try IndexedDB
            if ('indexedDB' in window) {
                cacheData = await this.getIndexedDB(key);
            } else {
                // Try localStorage
                const localData = localStorage.getItem(`cache_${key}`);
                if (localData) {
                    cacheData = JSON.parse(localData);
                }
            }

            if (!cacheData) return null;

            // Check if expired
            if (cacheData.expires <= Date.now()) {
                await this.remove(key);
                return null;
            }

            // Update memory cache
            sessionStorage.setItem(`cache_${key}`, JSON.stringify(cacheData));

            return cacheData.data;
        } catch (error) {
            console.error('Cache get error:', error);
            return null;
        }
    }

    async remove(key) {
        try {
            sessionStorage.removeItem(`cache_${key}`);
            localStorage.removeItem(`cache_${key}`);

            if ('indexedDB' in window) {
                await this.removeIndexedDB(key);
            }
        } catch (error) {
            console.error('Cache remove error:', error);
        }
    }

    async clear() {
        try {
            sessionStorage.clear();
            
            // Clear all cache items from localStorage
            Object.keys(localStorage).forEach(key => {
                if (key.startsWith('cache_')) {
                    localStorage.removeItem(key);
                }
            });

            if ('indexedDB' in window) {
                await this.clearIndexedDB();
            }

            // Clear service worker cache
            if ('caches' in window) {
                const cacheKeys = await caches.keys();
                await Promise.all(
                    cacheKeys.map(key => caches.delete(key))
                );
            }
        } catch (error) {
            console.error('Cache clear error:', error);
        }
    }

    async cleanupOldCaches() {
        try {
            if (!('caches' in window)) return;

            const cacheKeys = await caches.keys();
            const currentCache = await caches.open(this.cacheName);

            // Clean up old cache versions
            for (const key of cacheKeys) {
                if (key !== this.cacheName) {
                    await caches.delete(key);
                }
            }

            // Clean up expired items from current cache
            const requests = await currentCache.keys();
            const now = Date.now();

            for (const request of requests) {
                const response = await currentCache.match(request);
                if (response) {
                    const cachedDate = new Date(response.headers.get('cached-date'));
                    if (now - cachedDate.getTime() > this.cacheDuration) {
                        await currentCache.delete(request);
                    }
                }
            }
        } catch (error) {
            console.error('Cache cleanup error:', error);
        }
    }

    // IndexedDB methods
    async initIndexedDB() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open('SilvaStreamCache', 1);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(request.result);

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                if (!db.objectStoreNames.contains('cache')) {
                    const store = db.createObjectStore('cache', { keyPath: 'key' });
                    store.createIndex('expires', 'expires', { unique: false });
                }
            };
        });
    }

    async setIndexedDB(key, data) {
        try {
            const db = await this.initIndexedDB();
            const transaction = db.transaction('cache', 'readwrite');
            const store = transaction.objectStore('cache');
            
            await store.put({
                key: key,
                ...data
            });

            return transaction.complete;
        } catch (error) {
            console.error('IndexedDB set error:', error);
        }
    }

    async getIndexedDB(key) {
        try {
            const db = await this.initIndexedDB();
            const transaction = db.transaction('cache', 'readonly');
            const store = transaction.objectStore('cache');
            
            return new Promise((resolve, reject) => {
                const request = store.get(key);
                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(request.error);
            });
        } catch (error) {
            console.error('IndexedDB get error:', error);
            return null;
        }
    }

    async removeIndexedDB(key) {
        try {
            const db = await this.initIndexedDB();
            const transaction = db.transaction('cache', 'readwrite');
            const store = transaction.objectStore('cache');
            
            await store.delete(key);
            return transaction.complete;
        } catch (error) {
            console.error('IndexedDB remove error:', error);
        }
    }

    async clearIndexedDB() {
        try {
            const db = await this.initIndexedDB();
            const transaction = db.transaction('cache', 'readwrite');
            const store = transaction.objectStore('cache');
            
            await store.clear();
            return transaction.complete;
        } catch (error) {
            console.error('IndexedDB clear error:', error);
        }
    }

    // API Response Caching
    async cacheApiResponse(url, response, duration = this.cacheDuration) {
        try {
            if ('caches' in window) {
                const cache = await caches.open(this.cacheName);
                const headers = new Headers(response.headers);
                headers.set('cached-date', new Date().toISOString());
                
                const cachedResponse = new Response(response.body, {
                    status: response.status,
                    statusText: response.statusText,
                    headers: headers
                });

                await cache.put(url, cachedResponse);
            }

            // Also store in data cache
            const data = await response.clone().json();
            await this.set(`api_${this.hashString(url)}`, data, duration);

            return data;
        } catch (error) {
            console.error('API cache error:', error);
            return null;
        }
    }

    async getCachedApiResponse(url) {
        try {
            // Check memory/data cache first
            const cacheKey = `api_${this.hashString(url)}`;
            const cachedData = await this.get(cacheKey);
            
            if (cachedData) {
                return new Response(JSON.stringify(cachedData), {
                    status: 200,
                    headers: { 'Content-Type': 'application/json' }
                });
            }

            // Check service worker cache
            if ('caches' in window) {
                const cache = await caches.open(this.cacheName);
                const cachedResponse = await cache.match(url);
                
                if (cachedResponse) {
                    const cachedDate = new Date(cachedResponse.headers.get('cached-date'));
                    if (Date.now() - cachedDate.getTime() < this.cacheDuration) {
                        return cachedResponse;
                    }
                    await cache.delete(url);
                }
            }

            return null;
        } catch (error) {
            console.error('Get cached API error:', error);
            return null;
        }
    }

    // Image Caching
    async cacheImage(url) {
        try {
            if ('caches' in window) {
                const cache = await caches.open('silvastream-images');
                const cached = await cache.match(url);
                
                if (!cached) {
                    const response = await fetch(url);
                    if (response.ok) {
                        await cache.put(url, response.clone());
                    }
                    return response;
                }
                
                return cached;
            }
            
            // Fallback to regular fetch
            return fetch(url);
        } catch (error) {
            console.error('Image cache error:', error);
            return fetch(url);
        }
    }

    // Helper methods
    hashString(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return hash.toString();
    }

    getCacheStats() {
        const stats = {
            sessionStorage: Object.keys(sessionStorage).filter(k => k.startsWith('cache_')).length,
            localStorage: Object.keys(localStorage).filter(k => k.startsWith('cache_')).length,
            memoryUsage: this.getMemoryUsage(),
            totalCached: 0
        };

        stats.totalCached = stats.sessionStorage + stats.localStorage;
        return stats;
    }

    getMemoryUsage() {
        if (performance.memory) {
            return {
                used: (performance.memory.usedJSHeapSize / 1048576).toFixed(2) + ' MB',
                total: (performance.memory.totalJSHeapSize / 1048576).toFixed(2) + ' MB',
                limit: (performance.memory.jsHeapSizeLimit / 1048576).toFixed(2) + ' MB'
            };
        }
        return 'Not available';
    }

    // Cache warming for frequently accessed data
    async warmCache() {
        const urlsToCache = [
            '/api/categories',
            '/api/genres',
            '/api/trending'
        ];

        try {
            for (const url of urlsToCache) {
                const response = await fetch(url);
                if (response.ok) {
                    await this.cacheApiResponse(url, response.clone());
                }
            }
        } catch (error) {
            console.error('Cache warming error:', error);
        }
    }
}

// Global cache instance
const CACHE = new CacheManager();

export { CACHE };
