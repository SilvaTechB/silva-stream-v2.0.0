// Cache Manager with improved performance and error handling
class CacheManager {
    constructor() {
        this.prefix = 'silvastream_';
        this.defaultTTL = 3600000; // 1 hour
        this.memoryCache = new Map();
        this.init();
    }

    init() {
        // Clean up expired items on init
        this.cleanup();
        
        // Listen for storage events (cross-tab communication)
        window.addEventListener('storage', (e) => {
            if (e.key && e.key.startsWith(this.prefix)) {
                this.handleStorageEvent(e);
            }
        });
        
        // Listen for online/offline events
        window.addEventListener('online', () => {
            this.syncOfflineData();
        });
    }

    set(key, value, ttl = this.defaultTTL) {
        const cacheKey = this.prefix + key;
        const item = {
            value: value,
            expiry: Date.now() + ttl,
            timestamp: Date.now()
        };
        
        try {
            // Store in memory cache
            this.memoryCache.set(cacheKey, item);
            
            // Store in localStorage
            localStorage.setItem(cacheKey, JSON.stringify(item));
            
            // Broadcast to other tabs
            this.broadcastUpdate(key, value);
            
            return true;
        } catch (error) {
            console.error('Cache set error:', error);
            
            // If localStorage is full, try to clean up
            if (error.name === 'QuotaExceededError') {
                this.clearOldest(10); // Remove 10 oldest items
                try {
                    localStorage.setItem(cacheKey, JSON.stringify(item));
                    return true;
                } catch (e) {
                    console.error('Cache cleanup failed:', e);
                }
            }
            
            return false;
        }
    }

    get(key) {
        const cacheKey = this.prefix + key;
        
        // Check memory cache first
        if (this.memoryCache.has(cacheKey)) {
            const item = this.memoryCache.get(cacheKey);
            if (this.isValid(item)) {
                return item.value;
            } else {
                this.memoryCache.delete(cacheKey);
            }
        }
        
        // Check localStorage
        try {
            const itemStr = localStorage.getItem(cacheKey);
            if (!itemStr) return null;
            
            const item = JSON.parse(itemStr);
            
            if (!this.isValid(item)) {
                localStorage.removeItem(cacheKey);
                return null;
            }
            
            // Update memory cache
            this.memoryCache.set(cacheKey, item);
            
            return item.value;
        } catch (error) {
            console.error('Cache get error:', error);
            localStorage.removeItem(cacheKey);
            return null;
        }
    }

    append(key, value, ttl = this.defaultTTL) {
        const existing = this.get(key) || [];
        if (Array.isArray(existing)) {
            existing.push(value);
            this.set(key, existing, ttl);
        }
    }

    remove(key) {
        const cacheKey = this.prefix + key;
        
        // Remove from memory cache
        this.memoryCache.delete(cacheKey);
        
        // Remove from localStorage
        localStorage.removeItem(cacheKey);
        
        // Broadcast removal
        this.broadcastRemoval(key);
    }

    clear(prefix = '') {
        const searchKey = this.prefix + prefix;
        
        // Clear memory cache
        for (const key of this.memoryCache.keys()) {
            if (key.startsWith(searchKey)) {
                this.memoryCache.delete(key);
            }
        }
        
        // Clear localStorage
        for (let i = localStorage.length - 1; i >= 0; i--) {
            const key = localStorage.key(i);
            if (key && key.startsWith(searchKey)) {
                localStorage.removeItem(key);
            }
        }
        
        console.log(`Cache cleared for prefix: ${prefix}`);
    }

    clearOldest(count = 10) {
        const items = [];
        
        // Collect all cache items
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith(this.prefix)) {
                try {
                    const itemStr = localStorage.getItem(key);
                    const item = JSON.parse(itemStr);
                    items.push({
                        key: key,
                        timestamp: item.timestamp || 0
                    });
                } catch (error) {
                    // Remove invalid items
                    localStorage.removeItem(key);
                }
            }
        }
        
        // Sort by timestamp (oldest first)
        items.sort((a, b) => a.timestamp - b.timestamp);
        
        // Remove oldest items
        const toRemove = items.slice(0, Math.min(count, items.length));
        toRemove.forEach(item => {
            localStorage.removeItem(item.key);
            this.memoryCache.delete(item.key);
        });
        
        console.log(`Removed ${toRemove.length} oldest cache items`);
    }

    cleanup() {
        const now = Date.now();
        let removed = 0;
        
        for (let i = localStorage.length - 1; i >= 0; i--) {
            const key = localStorage.key(i);
            if (key && key.startsWith(this.prefix)) {
                try {
                    const itemStr = localStorage.getItem(key);
                    const item = JSON.parse(itemStr);
                    
                    if (item.expiry && now > item.expiry) {
                        localStorage.removeItem(key);
                        this.memoryCache.delete(key);
                        removed++;
                    }
                } catch (error) {
                    // Remove invalid items
                    localStorage.removeItem(key);
                    removed++;
                }
            }
        }
        
        if (removed > 0) {
            console.log(`Cache cleanup removed ${removed} expired items`);
        }
    }

    isValid(item) {
        if (!item || !item.expiry) return false;
        return Date.now() < item.expiry;
    }

    broadcastUpdate(key, value) {
        // Create a custom event for cross-tab communication
        const event = new CustomEvent('cacheUpdate', {
            detail: { key: key, value: value }
        });
        window.dispatchEvent(event);
    }

    broadcastRemoval(key) {
        const event = new CustomEvent('cacheRemoval', {
            detail: { key: key }
        });
        window.dispatchEvent(event);
    }

    handleStorageEvent(event) {
        if (event.newValue) {
            try {
                const item = JSON.parse(event.newValue);
                const key = event.key.replace(this.prefix, '');
                this.memoryCache.set(event.key, item);
                
                // Dispatch internal event
                const internalEvent = new CustomEvent('cacheUpdate', {
                    detail: { key: key, value: item.value }
                });
                window.dispatchEvent(internalEvent);
            } catch (error) {
                console.error('Failed to parse storage event:', error);
            }
        } else if (event.oldValue) {
            const key = event.key.replace(this.prefix, '');
            this.memoryCache.delete(event.key);
            
            // Dispatch internal event
            const internalEvent = new CustomEvent('cacheRemoval', {
                detail: { key: key }
            });
            window.dispatchEvent(internalEvent);
        }
    }

    async syncOfflineData() {
        // Get offline queue
        const offlineQueue = this.get('offline_queue') || [];
        
        if (offlineQueue.length > 0) {
            console.log(`Syncing ${offlineQueue.length} offline items...`);
            
            for (const item of offlineQueue) {
                try {
                    // Attempt to sync each item
                    await this.syncItem(item);
                } catch (error) {
                    console.error('Failed to sync item:', error);
                    // Keep in queue for next sync
                }
            }
            
            // Clear successful items from queue
            this.set('offline_queue', []);
        }
    }

    async syncItem(item) {
        // Implement based on your sync requirements
        // This would typically send data to your backend
        return new Promise((resolve) => {
            setTimeout(resolve, 100);
        });
    }

    // Cache statistics
    getStats() {
        const stats = {
            total: 0,
            memory: 0,
            localStorage: 0,
            expired: 0
        };
        
        // Count memory cache
        stats.memory = this.memoryCache.size;
        
        // Count localStorage cache
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith(this.prefix)) {
                stats.localStorage++;
                
                try {
                    const itemStr = localStorage.getItem(key);
                    const item = JSON.parse(itemStr);
                    if (!this.isValid(item)) {
                        stats.expired++;
                    }
                } catch (error) {
                    stats.expired++;
                }
            }
        }
        
        stats.total = stats.localStorage;
        
        return stats;
    }

    // Image caching
    cacheImage(url) {
        return new Promise((resolve, reject) => {
            if (!url) {
                reject(new Error('No URL provided'));
                return;
            }
            
            const cacheKey = this.prefix + 'img_' + this.hashString(url);
            
            // Check if already cached
            const cached = this.get(cacheKey);
            if (cached) {
                resolve(cached);
                return;
            }
            
            // Fetch and cache the image
            fetch(url)
                .then(response => {
                    if (!response.ok) throw new Error('Failed to fetch image');
                    return response.blob();
                })
                .then(blob => {
                    const reader = new FileReader();
                    reader.onloadend = () => {
                        const base64data = reader.result;
                        this.set(cacheKey, base64data, 86400000); // Cache for 24 hours
                        resolve(base64data);
                    };
                    reader.readAsDataURL(blob);
                })
                .catch(reject);
        });
    }

    hashString(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return Math.abs(hash).toString(16);
    }

    // Batch operations
    setMany(items, ttl = this.defaultTTL) {
        const results = [];
        
        for (const [key, value] of Object.entries(items)) {
            const success = this.set(key, value, ttl);
            results.push({ key, success });
        }
        
        return results;
    }

    getMany(keys) {
        const results = {};
        
        for (const key of keys) {
            results[key] = this.get(key);
        }
        
        return results;
    }

    // Cache warming
    warmCache(keys) {
        keys.forEach(key => {
            if (!this.get(key)) {
                // Trigger fetch for missing cache items
                this.prefetch(key);
            }
        });
    }

    prefetch(key) {
        // Implement based on your data fetching logic
        // This would typically fetch data and cache it
        console.log(`Prefetching: ${key}`);
    }
}

// Create global instance
const cacheManager = new CacheManager();

// Make available globally
window.CacheManager = CacheManager;
window.cacheManager = cacheManager;

// Auto-cleanup every 5 minutes
setInterval(() => {
    cacheManager.cleanup();
}, 300000);
