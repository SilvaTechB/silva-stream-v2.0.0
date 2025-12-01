// scripts/api.js
class MovieAPI {
    static BASE_URL = 'https://movieapi.giftedtech.co.ke/api';
    static CACHE_DURATION = 300000; // 5 minutes
    static CACHE_KEY = 'silvastream_cache';

    static async searchMovies(query, page = 1) {
        const cacheKey = `search_${query}_${page}`;
        const cached = this.getFromCache(cacheKey);
        if (cached) return cached;

        try {
            const response = await fetch(
                `${this.BASE_URL}/search/${encodeURIComponent(query)}?page=${page}`,
                {
                    headers: {
                        'Accept': 'application/json',
                        'Cache-Control': 'max-age=300'
                    }
                }
            );
            
            if (!response.ok) throw new Error(`API error: ${response.status}`);
            
            const data = await response.json();
            this.saveToCache(cacheKey, data);
            return data;
        } catch (error) {
            console.error('Search error:', error);
            throw new Error('Failed to search movies');
        }
    }

    static async getMovieInfo(movieId) {
        const cacheKey = `movie_${movieId}`;
        const cached = this.getFromCache(cacheKey);
        if (cached) return cached;

        try {
            const response = await fetch(`${this.BASE_URL}/info/${movieId}`, {
                headers: {
                    'Accept': 'application/json',
                    'Cache-Control': 'max-age=300'
                }
            });
            
            if (!response.ok) throw new Error(`API error: ${response.status}`);
            
            const data = await response.json();
            
            // Fetch cast and similar movies in parallel
            const [castData, similarData] = await Promise.all([
                this.getMovieCast(movieId),
                this.getSimilarMovies(movieId)
            ]);
            
            data.cast = castData || [];
            data.similar = similarData || [];
            
            this.saveToCache(cacheKey, data);
            return data;
        } catch (error) {
            console.error('Movie info error:', error);
            throw new Error('Failed to fetch movie details');
        }
    }

    static async getMovieCast(movieId) {
        const cacheKey = `cast_${movieId}`;
        const cached = this.getFromCache(cacheKey);
        if (cached) return cached;

        try {
            // Using a proxy to fetch cast from TMDB-like data
            const response = await fetch(
                `https://api.themoviedb.org/3/movie/${movieId}/credits?api_key=YOUR_TMDB_API_KEY`,
                {
                    headers: {
                        'Accept': 'application/json',
                        'Cache-Control': 'max-age=3600'
                    }
                }
            );
            
            if (!response.ok) {
                // Fallback to our API
                return await this.getFallbackCast(movieId);
            }
            
            const data = await response.json();
            const cast = data.cast?.slice(0, 10).map(person => ({
                id: person.id,
                name: person.name,
                character: person.character,
                photo: `https://image.tmdb.org/t/p/w200${person.profile_path}`,
                known_for: person.known_for_department
            })) || [];
            
            this.saveToCache(cacheKey, cast);
            return cast;
        } catch (error) {
            return await this.getFallbackCast(movieId);
        }
    }

    static async getFallbackCast(movieId) {
        try {
            // Fallback to local database or external service
            const response = await fetch(
                `${this.BASE_URL}/cast/${movieId}`
            );
            
            if (response.ok) {
                const data = await response.json();
                return data.cast || [];
            }
            
            return [];
        } catch (error) {
            return [];
        }
    }

    static async getSimilarMovies(movieId) {
        const cacheKey = `similar_${movieId}`;
        const cached = this.getFromCache(cacheKey);
        if (cached) return cached;

        try {
            const response = await fetch(
                `${this.BASE_URL}/similar/${movieId}`
            );
            
            if (!response.ok) {
                // Fallback to trending movies
                const trending = await this.searchMovies('trending');
                return trending.results?.items?.slice(0, 8) || [];
            }
            
            const data = await response.json();
            const similar = data.results?.items?.slice(0, 8) || [];
            
            this.saveToCache(cacheKey, similar);
            return similar;
        } catch (error) {
            const trending = await this.searchMovies('trending');
            return trending.results?.items?.slice(0, 8) || [];
        }
    }

    static async getTrailer(movieId) {
        const cacheKey = `trailer_${movieId}`;
        const cached = this.getFromCache(cacheKey);
        if (cached) return cached;

        try {
            const response = await fetch(
                `https://api.themoviedb.org/3/movie/${movieId}/videos?api_key=YOUR_TMDB_API_KEY`
            );
            
            if (!response.ok) throw new Error('Trailer not found');
            
            const data = await response.json();
            const trailer = data.results?.find(
                video => video.type === 'Trailer' && video.site === 'YouTube'
            );
            
            if (trailer) {
                const trailerData = {
                    id: trailer.key,
                    type: 'youtube',
                    url: `https://www.youtube.com/watch?v=${trailer.key}`,
                    embedUrl: `https://www.youtube.com/embed/${trailer.key}`
                };
                this.saveToCache(cacheKey, trailerData);
                return trailerData;
            }
            
            return null;
        } catch (error) {
            console.error('Trailer error:', error);
            return null;
        }
    }

    static async getDownloadSources(movieId, season = null, episode = null) {
        const cacheKey = `sources_${movieId}_${season}_${episode}`;
        const cached = this.getFromCache(cacheKey);
        if (cached) return cached;

        try {
            let url = `${this.BASE_URL}/sources/${movieId}`;
            if (season !== null && episode !== null) {
                url += `?season=${season}&episode=${episode}`;
            }
            
            const response = await fetch(url, {
                headers: {
                    'Accept': 'application/json',
                    'Cache-Control': 'max-age=300'
                }
            });
            
            if (!response.ok) throw new Error(`API error: ${response.status}`);
            
            const data = await response.json();
            this.saveToCache(cacheKey, data);
            return data;
        } catch (error) {
            console.error('Sources error:', error);
            throw new Error('Failed to fetch download sources');
        }
    }

    static async getCategoryContent(category, page = 1) {
        const cacheKey = `category_${category}_${page}`;
        const cached = this.getFromCache(cacheKey);
        if (cached) return cached;

        try {
            const response = await fetch(
                `${this.BASE_URL}/category/${category}?page=${page}`,
                {
                    headers: {
                        'Accept': 'application/json',
                        'Cache-Control': 'max-age=600'
                    }
                }
            );
            
            if (!response.ok) throw new Error(`API error: ${response.status}`);
            
            const data = await response.json();
            this.saveToCache(cacheKey, data);
            return data;
        } catch (error) {
            console.error('Category error:', error);
            throw new Error('Failed to fetch category content');
        }
    }

    static async getUserRecommendations(userId) {
        if (!userId) {
            const trending = await this.searchMovies('trending');
            return trending.results?.items?.slice(0, 12) || [];
        }

        const cacheKey = `recommendations_${userId}`;
        const cached = this.getFromCache(cacheKey);
        if (cached) return cached;

        try {
            const response = await fetch(
                `${this.BASE_URL}/recommendations/${userId}`,
                {
                    headers: {
                        'Accept': 'application/json',
                        'Cache-Control': 'max-age=300'
                    }
                }
            );
            
            if (!response.ok) {
                const trending = await this.searchMovies('trending');
                return trending.results?.items?.slice(0, 12) || [];
            }
            
            const data = await response.json();
            this.saveToCache(cacheKey, data);
            return data;
        } catch (error) {
            const trending = await this.searchMovies('trending');
            return trending.results?.items?.slice(0, 12) || [];
        }
    }

    static async getWatchHistory(userId) {
        if (!userId) return [];
        
        const cacheKey = `history_${userId}`;
        const cached = this.getFromCache(cacheKey);
        if (cached) return cached;

        try {
            const response = await fetch(
                `${this.BASE_URL}/history/${userId}`,
                {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`,
                        'Accept': 'application/json'
                    }
                }
            );
            
            if (!response.ok) return [];
            
            const data = await response.json();
            this.saveToCache(cacheKey, data);
            return data;
        } catch (error) {
            return [];
        }
    }

    static async getTrendingContent(type = 'all') {
        const cacheKey = `trending_${type}`;
        const cached = this.getFromCache(cacheKey);
        if (cached) return cached;

        try {
            const response = await fetch(
                `${this.BASE_URL}/trending/${type}`,
                {
                    headers: {
                        'Accept': 'application/json',
                        'Cache-Control': 'max-age=300'
                    }
                }
            );
            
            if (!response.ok) {
                const search = await this.searchMovies('trending');
                return search.results?.items || [];
            }
            
            const data = await response.json();
            this.saveToCache(cacheKey, data);
            return data;
        } catch (error) {
            const search = await this.searchMovies('trending');
            return search.results?.items || [];
        }
    }

    static isMovie(content) {
        return content.subjectType === 1;
    }

    static isSeries(content) {
        return content.subjectType === 2;
    }

    // Cache management
    static getFromCache(key) {
        try {
            const cache = JSON.parse(localStorage.getItem(this.CACHE_KEY) || '{}');
            const item = cache[key];
            
            if (item && Date.now() - item.timestamp < this.CACHE_DURATION) {
                return item.data;
            }
            
            // Remove expired item
            delete cache[key];
            localStorage.setItem(this.CACHE_KEY, JSON.stringify(cache));
            return null;
        } catch (error) {
            return null;
        }
    }

    static saveToCache(key, data) {
        try {
            const cache = JSON.parse(localStorage.getItem(this.CACHE_KEY) || '{}');
            cache[key] = {
                data,
                timestamp: Date.now()
            };
            localStorage.setItem(this.CACHE_KEY, JSON.stringify(cache));
        } catch (error) {
            console.error('Cache save error:', error);
        }
    }

    static clearCache() {
        localStorage.removeItem(this.CACHE_KEY);
    }

    static async preloadContent(contentIds) {
        // Preload content in background
        const promises = contentIds.map(id => this.getMovieInfo(id));
        try {
            await Promise.all(promises);
        } catch (error) {
            // Silent fail for preloading
        }
    }
}

// Category configurations with real API endpoints
const categories = [
    { id: 'trending-now', name: 'Trending Now', api: 'trending/all', icon: 'fas fa-fire' },
    { id: 'hollywood-movies', name: 'Hollywood Movies', api: 'category/hollywood', icon: 'fas fa-film' },
    { id: 'teen-romance', name: 'Teen Romance', api: 'category/romance', icon: 'fas fa-heart' },
    { id: 'halloween-special', name: 'Halloween Special', api: 'category/horror', icon: 'fas fa-ghost' },
    { id: 'nollywood', name: 'Nollywood', api: 'category/nollywood', icon: 'fas fa-globe-africa' },
    { id: 'sa-drama', name: 'SA Drama', api: 'category/drama', icon: 'fas fa-tv' },
    { id: 'premium-vip', name: 'Premium VIP', api: 'category/premium', icon: 'fas fa-crown' },
    { id: 'western-tv', name: 'Western TV', api: 'category/western', icon: 'fas fa-hat-cowboy' },
    { id: 'k-drama', name: 'K-Drama', api: 'category/korean', icon: 'fas fa-theater-masks' },
    { id: 'animated-film', name: 'Animated Film', api: 'category/animation', icon: 'fas fa-dragon' },
    { id: 'black-shows', name: 'Black Shows', api: 'category/black-panther', icon: 'fas fa-users' },
    { id: 'action-movies', name: 'Action Movies', api: 'category/action', icon: 'fas fa-explosion' },
    { id: 'adventure-movies', name: 'Adventure Movies', api: 'category/adventure', icon: 'fas fa-mountain' },
    { id: 'deadly-hunt', name: 'Deadly Hunt', api: 'category/hunt', icon: 'fas fa-bullseye' },
    { id: 'most-trending', name: 'Most Trending', api: 'trending/popular', icon: 'fas fa-chart-line' }
];

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MovieAPI;
}
