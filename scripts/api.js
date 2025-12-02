// Enhanced Movie API Class
class MovieAPI {
    constructor() {
        this.baseUrl = 'https://movieapi.giftedtech.co.ke/api';
        this.cache = new Map();
        this.requestQueue = [];
        this.isProcessingQueue = false;
    }

    // Utility method to get movie ID from URL
    getMovieIdFromURL() {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('id');
    }

    // Utility method to get content type
    getContentType() {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('type') || 'movie';
    }

    // Queue management for rate limiting
    async processQueue() {
        if (this.isProcessingQueue || this.requestQueue.length === 0) return;
        
        this.isProcessingQueue = true;
        
        while (this.requestQueue.length > 0) {
            const request = this.requestQueue.shift();
            try {
                const response = await fetch(request.url, request.options);
                request.resolve(response);
            } catch (error) {
                request.reject(error);
            }
            
            // Rate limiting delay
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        this.isProcessingQueue = false;
    }

    // Generic fetch with caching and queue
    async fetchWithCache(endpoint, options = {}, cacheTime = 300000) { // 5 minutes cache
        const cacheKey = `${endpoint}-${JSON.stringify(options)}`;
        
        // Check cache first
        if (this.cache.has(cacheKey)) {
            const cached = this.cache.get(cacheKey);
            if (Date.now() - cached.timestamp < cacheTime) {
                return cached.data;
            }
        }

        return new Promise((resolve, reject) => {
            this.requestQueue.push({
                url: `${this.baseUrl}${endpoint}`,
                options,
                resolve: async (response) => {
                    try {
                        if (!response.ok) {
                            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                        }
                        
                        const data = await response.json();
                        
                        // Cache the response
                        this.cache.set(cacheKey, {
                            data,
                            timestamp: Date.now()
                        });
                        
                        resolve(data);
                    } catch (error) {
                        reject(error);
                    }
                },
                reject
            });
            
            this.processQueue();
        });
    }

    // Search movies
    async searchMovies(query, page = 1, limit = 20) {
        try {
            const encodedQuery = encodeURIComponent(query);
            return await this.fetchWithCache(`/search/${encodedQuery}?page=${page}&limit=${limit}`, {}, 60000); // 1 minute cache
        } catch (error) {
            console.error('Search error:', error);
            throw error;
        }
    }

    // Get movie info
    async getMovieInfo(movieId) {
        try {
            return await this.fetchWithCache(`/info/${movieId}`);
        } catch (error) {
            console.error('Movie info error:', error);
            throw error;
        }
    }

    // Get download sources
    async getDownloadSources(movieId, season = null, episode = null) {
        try {
            let endpoint = `/sources/${movieId}`;
            if (season !== null && episode !== null) {
                endpoint += `?season=${season}&episode=${episode}`;
            }
            return await this.fetchWithCache(endpoint);
        } catch (error) {
            console.error('Download sources error:', error);
            throw error;
        }
    }

    // Get series episodes
    async getSeriesEpisodes(seriesId) {
        try {
            // First get series info
            const seriesInfo = await this.getMovieInfo(seriesId);
            
            // Parse episodes from series info
            const episodes = this.parseEpisodesFromSeriesInfo(seriesInfo);
            return episodes;
        } catch (error) {
            console.error('Series episodes error:', error);
            throw error;
        }
    }

    // Parse episodes from series info
    parseEpisodesFromSeriesInfo(seriesInfo) {
        const episodes = [];
        
        if (seriesInfo.results?.resource?.seasons) {
            seriesInfo.results.resource.seasons.forEach((season, seasonIndex) => {
                const seasonNumber = seasonIndex + 1;
                
                // Generate episodes based on season data
                if (season.maxEp) {
                    for (let ep = 1; ep <= season.maxEp; ep++) {
                        episodes.push({
                            id: `${seriesInfo.results.subject.subjectId}-s${seasonNumber}e${ep}`,
                            season: seasonNumber,
                            episode: ep,
                            title: `Episode ${ep}`,
                            description: `Season ${seasonNumber}, Episode ${ep}`,
                            duration: 2400, // 40 minutes default
                            thumbnail: seriesInfo.results.subject.cover?.url || '',
                            releaseDate: new Date().toISOString().split('T')[0]
                        });
                    }
                }
            });
        }
        
        return episodes;
    }

    // Get trending movies
    async getTrendingMovies(limit = 20) {
        try {
            // Search for popular movies
            return await this.searchMovies('popular', 1, limit);
        } catch (error) {
            console.error('Trending movies error:', error);
            throw error;
        }
    }

    // Get movie recommendations
    async getRecommendations(movieId, limit = 10) {
        try {
            // Get movie info first
            const movieInfo = await this.getMovieInfo(movieId);
            const genre = movieInfo.results?.subject?.genre?.split(',')[0];
            
            if (genre) {
                return await this.searchMovies(genre, 1, limit);
            }
            
            return { results: { items: [] } };
        } catch (error) {
            console.error('Recommendations error:', error);
            throw error;
        }
    }

    // Check if content is a movie
    isMovie(content) {
        return content.subjectType === 1;
    }

    // Check if content is a series
    isSeries(content) {
        return content.subjectType === 2;
    }

    // Clear cache
    clearCache() {
        this.cache.clear();
    }

    // Get cache statistics
    getCacheStats() {
        return {
            size: this.cache.size,
            entries: Array.from(this.cache.entries())
        };
    }
}

// Global API instance
window.movieAPI = new MovieAPI();
