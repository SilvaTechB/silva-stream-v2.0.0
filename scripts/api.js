// scripts/api.js - ENHANCED WITH CACHING
class MovieAPI {
    static cache = new Map();
    static cacheDuration = 5 * 60 * 1000; // 5 minutes
    static maxCacheSize = 100;

    static async searchMovies(query, options = {}) {
        const cacheKey = `search_${query}_${JSON.stringify(options)}`;
        
        // Check cache first
        const cached = this.getFromCache(cacheKey);
        if (cached) {
            console.log('Cache hit for search:', query);
            return cached;
        }

        try {
            const response = await fetch(
                `https://movieapi.giftedtech.co.ke/api/search/${encodeURIComponent(query)}`,
                {
                    signal: options.signal || AbortSignal.timeout(10000), // 10 second timeout
                    headers: {
                        'Cache-Control': 'max-age=300',
                        'Accept': 'application/json'
                    }
                }
            );
            
            if (!response.ok) {
                throw new Error(`API error: ${response.status}`);
            }
            
            const data = await response.json();
            
            // Cache the result
            this.addToCache(cacheKey, data);
            
            // Preload movie details for first few results
            if (data.results?.items) {
                this.preloadDetails(data.results.items.slice(0, 3));
            }
            
            return data;
        } catch (error) {
            console.error('Error searching movies:', error);
            
            // Try to return stale cache if available
            const staleCache = this.getStaleCache(cacheKey);
            if (staleCache) {
                console.log('Using stale cache for:', query);
                return staleCache;
            }
            
            throw error;
        }
    }

    static async getMovieInfo(movieId) {
        const cacheKey = `info_${movieId}`;
        
        // Check cache first
        const cached = this.getFromCache(cacheKey);
        if (cached) {
            console.log('Cache hit for movie info:', movieId);
            return cached;
        }

        try {
            const response = await fetch(
                `https://movieapi.giftedtech.co.ke/api/info/${movieId}`,
                {
                    signal: AbortSignal.timeout(15000), // 15 second timeout
                    headers: {
                        'Cache-Control': 'max-age=300',
                        'Accept': 'application/json'
                    }
                }
            );
            
            if (!response.ok) {
                throw new Error(`API error: ${response.status}`);
            }
            
            const data = await response.json();
            
            // Cache the result
            this.addToCache(cacheKey, data);
            
            // Preload sources
            this.preloadSources(movieId);
            
            return data;
        } catch (error) {
            console.error('Error fetching movie info:', error);
            
            // Try to return stale cache if available
            const staleCache = this.getStaleCache(cacheKey);
            if (staleCache) {
                console.log('Using stale cache for movie info:', movieId);
                return staleCache;
            }
            
            throw error;
        }
    }

    static async getDownloadSources(movieId, season = null, episode = null) {
        const cacheKey = `sources_${movieId}_${season}_${episode}`;
        
        // Check cache first
        const cached = this.getFromCache(cacheKey);
        if (cached) {
            console.log('Cache hit for sources:', movieId);
            return cached;
        }

        try {
            let url = `https://movieapi.giftedtech.co.ke/api/sources/${movieId}`;
            if (season !== null && episode !== null) {
                url += `?season=${season}&episode=${episode}`;
            }
            
            const response = await fetch(url, {
                signal: AbortSignal.timeout(20000), // 20 second timeout
                headers: {
                    'Cache-Control': 'max-age=300',
                    'Accept': 'application/json'
                }
            });
            
            if (!response.ok) {
                throw new Error(`API error: ${response.status}`);
            }
            
            const data = await response.json();
            
            // Cache the result
            this.addToCache(cacheKey, data);
            
            return data;
        } catch (error) {
            console.error('Error fetching download sources:', error);
            
            // Try to return stale cache if available
            const staleCache = this.getStaleCache(cacheKey);
            if (staleCache) {
                console.log('Using stale cache for sources:', movieId);
                return staleCache;
            }
            
            throw error;
        }
    }

    static async getTrailers(movieId) {
        const cacheKey = `trailers_${movieId}`;
        
        const cached = this.getFromCache(cacheKey);
        if (cached) return cached;

        try {
            // This is a mock - you'll need to implement actual trailer API
            const mockTrailers = [
                {
                    id: '1',
                    title: 'Official Trailer',
                    type: 'trailer',
                    url: 'https://example.com/trailer1.mp4',
                    thumbnail: 'https://example.com/thumb1.jpg'
                },
                {
                    id: '2',
                    title: 'Behind the Scenes',
                    type: 'featurette',
                    url: 'https://example.com/behind-scenes.mp4',
                    thumbnail: 'https://example.com/thumb2.jpg'
                }
            ];
            
            this.addToCache(cacheKey, mockTrailers);
            return mockTrailers;
        } catch (error) {
            console.error('Error fetching trailers:', error);
            return [];
        }
    }

    static async getCast(movieId) {
        const cacheKey = `cast_${movieId}`;
        
        const cached = this.getFromCache(cacheKey);
        if (cached) return cached;

        try {
            // This is a mock - you'll need to implement actual cast API
            const mockCast = [
                {
                    id: '1',
                    name: 'Actor One',
                    character: 'Main Character',
                    photo: 'https://example.com/actor1.jpg',
                    popularity: 8.5
                },
                {
                    id: '2',
                    name: 'Actor Two',
                    character: 'Supporting Role',
                    photo: 'https://example.com/actor2.jpg',
                    popularity: 7.2
                }
            ];
            
            this.addToCache(cacheKey, mockCast);
            return mockCast;
        } catch (error) {
            console.error('Error fetching cast:', error);
            return [];
        }
    }

    static async getSimilarMovies(movieId) {
        const cacheKey = `similar_${movieId}`;
        
        const cached = this.getFromCache(cacheKey);
        if (cached) return cached;

        try {
            // For now, we'll use search with a delay to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 100));
            return [];
        } catch (error) {
            console.error('Error fetching similar movies:', error);
            return [];
        }
    }

    // Cache management methods
    static getFromCache(key) {
        const cached = this.cache.get(key);
        if (cached && Date.now() - cached.timestamp < this.cacheDuration) {
            return cached.data;
        }
        return null;
    }

    static getStaleCache(key) {
        const cached = this.cache.get(key);
        return cached ? cached.data : null;
    }

    static addToCache(key, data) {
        // Clean up old cache entries if we're at max size
        if (this.cache.size >= this.maxCacheSize) {
            const oldestKey = Array.from(this.cache.keys())[0];
            this.cache.delete(oldestKey);
        }
        
        this.cache.set(key, {
            data: data,
            timestamp: Date.now()
        });
    }

    static clearCache() {
        this.cache.clear();
        console.log('API cache cleared');
    }

    static clearStaleCache() {
        const now = Date.now();
        for (const [key, value] of this.cache.entries()) {
            if (now - value.timestamp > this.cacheDuration) {
                this.cache.delete(key);
            }
        }
    }

    // Preloading methods for better UX
    static async preloadDetails(movies) {
        if (!movies || !Array.isArray(movies)) return;
        
        // Preload details for first few movies in background
        const preloadPromises = movies.slice(0, 3).map(async (movie) => {
            try {
                await this.getMovieInfo(movie.subjectId);
            } catch (error) {
                // Silent fail for preloading
            }
        });
        
        // Don't await, let it happen in background
        Promise.allSettled(preloadPromises);
    }

    static async preloadSources(movieId) {
        try {
            await this.getDownloadSources(movieId);
        } catch (error) {
            // Silent fail for preloading
        }
    }

    // Helper to determine if content is a movie or series
    static isMovie(content) {
        return content.subjectType === 1;
    }

    static isSeries(content) {
        return content.subjectType === 2;
    }

    // Batch requests for better performance
    static async batchGetMovieInfo(movieIds) {
        const requests = movieIds.map(id => this.getMovieInfo(id));
        return Promise.allSettled(requests);
    }

    // Get trending movies with pagination
    static async getTrending(page = 1, limit = 20) {
        const cacheKey = `trending_${page}_${limit}`;
        
        const cached = this.getFromCache(cacheKey);
        if (cached) return cached;

        try {
            // Using search with trending query
            const results = await this.searchMovies('trending');
            
            // Simulate pagination
            const startIndex = (page - 1) * limit;
            const endIndex = startIndex + limit;
            const paginatedResults = results.results?.items?.slice(startIndex, endIndex) || [];
            
            const data = {
                page,
                total: results.results?.items?.length || 0,
                results: paginatedResults
            };
            
            this.addToCache(cacheKey, data);
            return data;
        } catch (error) {
            console.error('Error fetching trending:', error);
            throw error;
        }
    }

    // Get recommendations based on movie
    static async getRecommendations(movieId, limit = 10) {
        const cacheKey = `recommendations_${movieId}_${limit}`;
        
        const cached = this.getFromCache(cacheKey);
        if (cached) return cached;

        try {
            // Get movie info first
            const movieInfo = await this.getMovieInfo(movieId);
            if (!movieInfo?.results?.subject) {
                return [];
            }
            
            const movie = movieInfo.results.subject;
            const query = movie.genre ? movie.genre.split(',')[0] : movie.title.split(' ')[0];
            
            const results = await this.searchMovies(query);
            const recommendations = results.results?.items
                ?.filter(item => item.subjectId !== movieId)
                ?.slice(0, limit) || [];
            
            this.addToCache(cacheKey, recommendations);
            return recommendations;
        } catch (error) {
            console.error('Error fetching recommendations:', error);
            return [];
        }
    }
}

// Initialize cache cleanup on interval
setInterval(() => {
    MovieAPI.clearStaleCache();
}, 60000); // Cleanup every minute

// Category configurations with entertainment themes
const categories = [
    { 
        id: 'trending-now', 
        query: 'trending', 
        icon: 'fas fa-fire',
        theme: 'hot',
        color: '#e50914'
    },
    { 
        id: 'hollywood-movies', 
        query: 'hollywood', 
        icon: 'fas fa-film',
        theme: 'premium',
        color: '#ffd700'
    },
    { 
        id: 'teen-romance', 
        query: 'romance', 
        icon: 'fas fa-heart',
        theme: 'romantic',
        color: '#ff3366'
    },
    { 
        id: 'halloween-special', 
        query: 'horror', 
        icon: 'fas fa-ghost',
        theme: 'spooky',
        color: '#9d00ff'
    },
    { 
        id: 'nollywood', 
        query: 'nollywood', 
        icon: 'fas fa-globe-africa',
        theme: 'cultural',
        color: '#38b000'
    },
    { 
        id: 'sa-drama', 
        query: 'drama', 
        icon: 'fas fa-tv',
        theme: 'dramatic',
        color: '#00b4d8'
    },
    { 
        id: 'premium-vip', 
        query: 'marvel', 
        icon: 'fas fa-crown',
        theme: 'exclusive',
        color: '#ff9e00'
    },
    { 
        id: 'western-tv', 
        query: 'western', 
        icon: 'fas fa-hat-cowboy',
        theme: 'western',
        color: '#8b4513'
    },
    { 
        id: 'k-drama', 
        query: 'korean', 
        icon: 'fas fa-theater-masks',
        theme: 'asian',
        color: '#f72585'
    },
    { 
        id: 'animated-film', 
        query: 'animation', 
        icon: 'fas fa-dragon',
        theme: 'animated',
        color: '#7209b7'
    },
    { 
        id: 'black-shows', 
        query: 'black panther', 
        icon: 'fas fa-users',
        theme: 'diverse',
        color: '#000000'
    },
    { 
        id: 'action-movies', 
        query: 'action', 
        icon: 'fas fa-explosion',
        theme: 'action',
        color: '#e63946'
    },
    { 
        id: 'adventure-movies', 
        query: 'adventure', 
        icon: 'fas fa-mountain',
        theme: 'adventure',
        color: '#2a9d8f'
    },
    { 
        id: 'deadly-hunt', 
        query: 'hunt', 
        icon: 'fas fa-bullseye',
        theme: 'thriller',
        color: '#e76f51'
    },
    { 
        id: 'most-trending', 
        query: 'popular', 
        icon: 'fas fa-chart-line',
        theme: 'popular',
        color: '#f4a261'
    }
];

// Make categories available globally
window.categories = categories;
