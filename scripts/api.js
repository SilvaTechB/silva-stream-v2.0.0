// Enhanced API Service with Caching and Performance Optimizations
class MovieAPI {
    constructor() {
        this.cache = new Map();
        this.pendingRequests = new Map();
        this.requestQueue = [];
        this.maxConcurrentRequests = 6;
        this.activeRequests = 0;
        this.offlineMode = false;
        this.retryDelays = [1000, 3000, 5000];
        
        // Initialize Service Worker for caching
        this.initServiceWorker();
        
        // Setup offline detection
        this.setupOfflineDetection();
    }

    async initServiceWorker() {
        if ('serviceWorker' in navigator) {
            try {
                const registration = await navigator.serviceWorker.register('/service-worker.js');
                console.log('Service Worker registered:', registration);
                
                // Listen for messages from service worker
                navigator.serviceWorker.addEventListener('message', (event) => {
                    if (event.data.type === 'CACHE_UPDATED') {
                        this.clearCache(event.data.key);
                    }
                });
            } catch (error) {
                console.warn('Service Worker registration failed:', error);
            }
        }
    }

    setupOfflineDetection() {
        this.offlineMode = !navigator.onLine;
        
        window.addEventListener('online', () => {
            this.offlineMode = false;
            this.processQueue();
        });
        
        window.addEventListener('offline', () => {
            this.offlineMode = true;
        });
    }

    async makeRequest(url, options = {}) {
        const cacheKey = this.generateCacheKey(url, options);
        
        // Check cache first
        const cached = this.getFromCache(cacheKey);
        if (cached && !options.forceRefresh) {
            return cached;
        }

        // Check if request is already pending
        if (this.pendingRequests.has(cacheKey)) {
            return this.pendingRequests.get(cacheKey);
        }

        // Create request promise
        const requestPromise = this.executeRequest(url, options, cacheKey);
        this.pendingRequests.set(cacheKey, requestPromise);

        try {
            const result = await requestPromise;
            this.cache.set(cacheKey, {
                data: result,
                timestamp: Date.now(),
                ttl: Config.API_CONFIG.CACHE_TTL
            });
            return result;
        } finally {
            this.pendingRequests.delete(cacheKey);
        }
    }

    async executeRequest(url, options, cacheKey) {
        // Queue management for rate limiting
        if (this.activeRequests >= this.maxConcurrentRequests) {
            await new Promise(resolve => {
                this.requestQueue.push(resolve);
            });
        }

        this.activeRequests++;

        try {
            let lastError;
            
            for (let attempt = 0; attempt <= Config.API_CONFIG.RETRY_ATTEMPTS; attempt++) {
                try {
                    if (attempt > 0) {
                        // Exponential backoff with jitter
                        const delay = this.retryDelays[attempt - 1] || 5000;
                        const jitter = Math.random() * 1000;
                        await new Promise(resolve => setTimeout(resolve, delay + jitter));
                    }

                    const controller = new AbortController();
                    const timeoutId = setTimeout(() => controller.abort(), Config.API_CONFIG.TIMEOUT);

                    const response = await fetch(url, {
                        ...options,
                        signal: controller.signal,
                        headers: {
                            'Content-Type': 'application/json',
                            'Accept': 'application/json',
                            'X-App-Version': Config.APP_CONFIG.VERSION,
                            ...options.headers
                        }
                    });

                    clearTimeout(timeoutId);

                    if (!response.ok) {
                        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                    }

                    const data = await response.json();
                    
                    // Send to service worker for caching
                    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
                        navigator.serviceWorker.controller.postMessage({
                            type: 'CACHE_API_RESPONSE',
                            key: cacheKey,
                            data: data,
                            url: url
                        });
                    }

                    return data;
                } catch (error) {
                    lastError = error;
                    
                    if (error.name === 'AbortError') {
                        console.warn(`Request timed out (attempt ${attempt + 1})`);
                    } else if (error.message.includes('Failed to fetch')) {
                        console.warn(`Network error (attempt ${attempt + 1})`);
                    } else {
                        throw error;
                    }
                }
            }

            throw lastError || new Error('Request failed after all retry attempts');
        } finally {
            this.activeRequests--;
            
            // Process next request in queue
            if (this.requestQueue.length > 0) {
                const nextResolver = this.requestQueue.shift();
                nextResolver();
            }
        }
    }

    async searchMovies(query, options = {}) {
        const url = Config.getApiUrl(Config.API_CONFIG.ENDPOINTS.SEARCH, { 
            q: query,
            limit: options.limit || 20,
            page: options.page || 1
        });
        
        return this.makeRequest(url, {
            method: 'GET',
            ...options
        });
    }

    async getMovieInfo(movieId, options = {}) {
        const url = Config.getApiUrl(`${Config.API_CONFIG.ENDPOINTS.MOVIE_INFO}/${movieId}`);
        
        return this.makeRequest(url, {
            method: 'GET',
            ...options
        });
    }

    async getDownloadSources(movieId, season = null, episode = null) {
        let url = Config.getApiUrl(`${Config.API_CONFIG.ENDPOINTS.DOWNLOAD_SOURCES}/${movieId}`);
        
        if (season !== null && episode !== null) {
            url += `?season=${season}&episode=${episode}`;
        }
        
        return this.makeRequest(url, {
            method: 'GET'
        });
    }

    async getMovieTrailers(movieId) {
        const url = Config.getApiUrl(`${Config.API_CONFIG.ENDPOINTS.TRAILERS}/${movieId}`);
        
        return this.makeRequest(url, {
            method: 'GET'
        });
    }

    async getMovieCast(movieId) {
        const url = Config.getApiUrl(`${Config.API_CONFIG.ENDPOINTS.CAST}/${movieId}`);
        
        return this.makeRequest(url, {
            method: 'GET'
        });
    }

    async getSimilarMovies(movieId) {
        const url = Config.getApiUrl(`${Config.API_CONFIG.ENDPOINTS.SIMILAR}/${movieId}`);
        
        return this.makeRequest(url, {
            method: 'GET'
        });
    }

    async getTrendingMovies(category = 'all', limit = 20) {
        const url = Config.getApiUrl(Config.API_CONFIG.ENDPOINTS.TRENDING, {
            category: category,
            limit: limit
        });
        
        return this.makeRequest(url, {
            method: 'GET'
        });
    }

    async getPopularMovies(limit = 20) {
        const url = Config.getApiUrl(Config.API_CONFIG.ENDPOINTS.POPULAR, {
            limit: limit
        });
        
        return this.makeRequest(url, {
            method: 'GET'
        });
    }

    async getUpcomingMovies(limit = 10) {
        const url = Config.getApiUrl(Config.API_CONFIG.ENDPOINTS.UPCOMING, {
            limit: limit
        });
        
        return this.makeRequest(url, {
            method: 'GET'
        });
    }

    // Batch requests for performance
    async batchRequests(requests) {
        const results = [];
        
        for (const request of requests) {
            try {
                const result = await this.makeRequest(request.url, request.options);
                results.push(result);
            } catch (error) {
                console.warn('Batch request failed:', error);
                results.push(null);
            }
        }
        
        return results;
    }

    // Prefetch data for better UX
    prefetch(url) {
        if ('connection' in navigator && navigator.connection.saveData) {
            return; // Don't prefetch if data saver is enabled
        }
        
        this.makeRequest(url, {
            method: 'GET',
            priority: 'low'
        }).catch(() => {
            // Silently fail for prefetch requests
        });
    }

    // Cache management
    getFromCache(key) {
        const cached = this.cache.get(key);
        
        if (!cached) return null;
        
        const now = Date.now();
        const age = now - cached.timestamp;
        
        if (age > cached.ttl) {
            this.cache.delete(key);
            return null;
        }
        
        return cached.data;
    }

    clearCache(key = null) {
        if (key) {
            this.cache.delete(key);
        } else {
            this.cache.clear();
        }
    }

    generateCacheKey(url, options) {
        const sortedOptions = Object.keys(options)
            .sort()
            .reduce((obj, key) => {
                obj[key] = options[key];
                return obj;
            }, {});
        
        return `${url}:${JSON.stringify(sortedOptions)}`;
    }

    // Image optimization
    getOptimizedImageUrl(originalUrl, size = 'medium') {
        if (!originalUrl) return null;
        
        const sizes = {
            'small': 'w300',
            'medium': 'w500',
            'large': 'w780',
            'original': 'original'
        };
        
        const sizeParam = sizes[size] || sizes.medium;
        
        // For placeholder images
        if (originalUrl.includes('placeholder.com')) {
            return originalUrl;
        }
        
        // Add image optimization parameters
        return `${originalUrl}?format=webp&quality=80&width=${sizeParam}`;
    }

    // Lazy load helper
    lazyLoadImage(imgElement, imageUrl, placeholder = null) {
        if (!imgElement) return;
        
        const placeholderUrl = placeholder || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiB2aWV3Qm94PSIwIDAgMTAwIDEwMCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iIzFhMWEyZSIvPjxwYXRoIGQ9Ik0yMCA0MEg4MFY2MEgyMFY0MFoiIGZpbGw9IiMyMjIyM2QiLz48L3N2Zz4K';
        
        imgElement.src = placeholderUrl;
        imgElement.dataset.src = this.getOptimizedImageUrl(imageUrl, Config.getImageQuality());
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.src = img.dataset.src;
                    img.classList.add('loaded');
                    observer.unobserve(img);
                }
            });
        }, {
            rootMargin: `${Config.APP_CONFIG.PERFORMANCE.LAZY_LOAD_THRESHOLD}px`
        });
        
        observer.observe(imgElement);
    }

    // Performance monitoring
    async measurePerformance(url) {
        const startTime = performance.now();
        
        try {
            await this.makeRequest(url, { method: 'GET' });
            const endTime = performance.now();
            const duration = endTime - startTime;
            
            // Log performance metrics
            if (Config.APP_CONFIG.ANALYTICS.ENABLED) {
                console.log(`API Performance: ${url} - ${duration.toFixed(2)}ms`);
            }
            
            return duration;
        } catch (error) {
            console.error('Performance measurement failed:', error);
            return null;
        }
    }

    // Queue management for offline mode
    processQueue() {
        if (!this.offlineMode && this.requestQueue.length > 0) {
            while (this.requestQueue.length > 0 && this.activeRequests < this.maxConcurrentRequests) {
                const resolve = this.requestQueue.shift();
                resolve();
            }
        }
    }

    // Utility methods
    static isMovie(content) {
        return content.subjectType === 1;
    }

    static isSeries(content) {
        return content.subjectType === 2;
    }

    static formatDuration(minutes) {
        if (!minutes) return 'N/A';
        
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        
        if (hours > 0) {
            return `${hours}h ${mins}m`;
        }
        return `${mins}m`;
    }

    static formatFileSize(bytes) {
        if (!bytes) return 'Unknown';
        
        const units = ['B', 'KB', 'MB', 'GB'];
        let size = bytes;
        let unitIndex = 0;
        
        while (size >= 1024 && unitIndex < units.length - 1) {
            size /= 1024;
            unitIndex++;
        }
        
        return `${size.toFixed(1)} ${units[unitIndex]}`;
    }
}

// Create singleton instance
const movieAPI = new MovieAPI();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { MovieAPI, movieAPI };
}
