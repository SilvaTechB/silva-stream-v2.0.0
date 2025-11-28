// API Functions
class MovieAPI {
    static async searchMovies(query) {
        try {
            const response = await fetch(
                `https://movieapi.giftedtech.co.ke/api/search/${encodeURIComponent(query)}`
            );
            if (!response.ok) {
                throw new Error(`API error: ${response.status}`);
            }
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error searching movies:', error);
            throw error;
        }
    }

    static async getMovieInfo(movieId) {
        try {
            const response = await fetch(
                `https://movieapi.giftedtech.co.ke/api/info/${movieId}`
            );
            if (!response.ok) {
                throw new Error(`API error: ${response.status}`);
            }
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error fetching movie info:', error);
            throw error;
        }
    }

    static async getDownloadSources(movieId, season = null, episode = null) {
        try {
            let url = `https://movieapi.giftedtech.co.ke/api/sources/${movieId}`;
            if (season !== null && episode !== null) {
                url += `?season=${season}&episode=${episode}`;
            }
            
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`API error: ${response.status}`);
            }
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error fetching download sources:', error);
            throw error;
        }
    }

    // Helper to determine if content is a movie or series
    static isMovie(content) {
        return content.subjectType === 1;
    }

    static isSeries(content) {
        return content.subjectType === 2;
    }
}

// Category configurations
const categories = [
    { id: 'trending-now', query: 'trending', icon: 'fas fa-fire' },
    { id: 'hollywood-movies', query: 'hollywood', icon: 'fas fa-film' },
    { id: 'teen-romance', query: 'romance', icon: 'fas fa-heart' },
    { id: 'halloween-special', query: 'horror', icon: 'fas fa-ghost' },
    { id: 'nollywood', query: 'nollywood', icon: 'fas fa-globe-africa' },
    { id: 'sa-drama', query: 'drama', icon: 'fas fa-tv' },
    { id: 'premium-vip', query: 'marvel', icon: 'fas fa-crown' },
    { id: 'western-tv', query: 'western', icon: 'fas fa-hat-cowboy' },
    { id: 'k-drama', query: 'korean', icon: 'fas fa-theater-masks' },
    { id: 'animated-film', query: 'animation', icon: 'fas fa-dragon' },
    { id: 'black-shows', query: 'black panther', icon: 'fas fa-users' },
    { id: 'action-movies', query: 'action', icon: 'fas fa-explosion' },
    { id: 'adventure-movies', query: 'adventure', icon: 'fas fa-mountain' },
    { id: 'deadly-hunt', query: 'hunt', icon: 'fas fa-bullseye' },
    { id: 'most-trending', query: 'popular', icon: 'fas fa-chart-line' }
];
