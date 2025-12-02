// Main Application
class SilvaStreamApp {
    constructor() {
        this.init();
    }

    init() {
        this.setupDOM();
        this.setupEvents();
        this.loadInitialContent();
    }

    setupDOM() {
        // Cache DOM elements
        this.header = document.getElementById('header');
        this.searchInput = document.querySelector('.search-input');
        this.searchBtn = document.querySelector('.search-btn');
        this.loading = document.getElementById('loading');
        this.errorMessage = document.getElementById('error-message');
        this.heroWatchBtn = document.getElementById('hero-watch-btn');
        this.heroInfoBtn = document.getElementById('hero-info-btn');
    }

    setupEvents() {
        // Window events
        window.addEventListener('scroll', () => this.handleScroll());
        
        // Search events
        if (this.searchBtn) {
            this.searchBtn.addEventListener('click', () => this.performSearch());
        }
        if (this.searchInput) {
            this.searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') this.performSearch();
            });
        }
        
        // Hero section events
        if (this.heroWatchBtn) {
            this.heroWatchBtn.addEventListener('click', () => this.performSearch('action'));
        }
        if (this.heroInfoBtn) {
            this.heroInfoBtn.addEventListener('click', () => {
                document.getElementById('trending-now').scrollIntoView({ behavior: 'smooth' });
            });
        }
    }

    handleScroll() {
        if (window.scrollY > 100) {
            this.header.classList.add('scrolled');
        } else {
            this.header.classList.remove('scrolled');
        }
    }

    showError(message) {
        if (!this.errorMessage) return;
        this.errorMessage.textContent = message;
        this.errorMessage.style.display = 'block';
        setTimeout(() => {
            this.errorMessage.style.display = 'none';
        }, 5000);
    }

    showLoading() {
        if (this.loading) this.loading.style.display = 'block';
    }

    hideLoading() {
        if (this.loading) this.loading.style.display = 'none';
    }

    clearMoviesGrid() {
        document.querySelectorAll('.movies-row').forEach(row => {
            row.innerHTML = '';
        });
    }

    async performSearch(query = null) {
        const searchQuery = query || (this.searchInput ? this.searchInput.value.trim() : '');
        if (!searchQuery) return;

        this.showLoading();
        this.clearMoviesGrid();

        try {
            const results = await MovieAPI.searchMovies(searchQuery);
            if (results && results.results && results.results.items) {
                this.displayMovies(results.results.items, 'trending-now');
            } else {
                this.showError('No movies found. Try a different search.');
            }
        } catch (error) {
            console.error('Error searching movies:', error);
            this.showError('Failed to search movies. Please try again.');
        } finally {
            this.hideLoading();
        }
    }

    displayMovies(movies, containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        if (!movies || movies.length === 0) {
            container.innerHTML = '<p>No movies found. Try a different search.</p>';
            return;
        }

        container.innerHTML = movies.map(movie => {
            const isMovie = MovieAPI.isMovie(movie);
            const isSeries = MovieAPI.isSeries(movie);
            const posterUrl = movie.cover?.url || movie.cover || movie.thumbnail || 'https://via.placeholder.com/300x450/2a2a2a/ffffff?text=No+Image';
            
            return `
                <div class="movie-card" data-id="${movie.subjectId}" data-type="${isMovie ? 'movie' : 'series'}">
                    <img src="${posterUrl}" 
                         alt="${movie.title}" class="movie-poster" onerror="this.src='https://via.placeholder.com/300x450/2a2a2a/ffffff?text=No+Image'">
                    <div class="movie-type">${isMovie ? 'MOVIE' : 'SERIES'}</div>
                    <div class="movie-info">
                        <h3 class="movie-title">${movie.title}</h3>
                        <p class="movie-year">${movie.year || movie.releaseDate || 'N/A'}</p>
                    </div>
                </div>
            `;
        }).join('');

        // Add click event to movie cards
        document.querySelectorAll('.movie-card').forEach(card => {
            card.addEventListener('click', () => {
                const movieId = card.dataset.id;
                const isMovie = card.dataset.type === 'movie';
                
                if (isMovie) {
                    window.location.href = `movie-details.html?id=${movieId}`;
                } else {
                    window.location.href = `series-details.html?id=${movieId}`;
                }
            });
        });
    }

    async loadInitialContent() {
        this.showLoading();
        
        try {
            // Load each category with its specific search
            for (const category of categories) {
                try {
                    const results = await MovieAPI.searchMovies(category.query);
                    if (results && results.results && results.results.items) {
                        this.displayMovies(results.results.items.slice(0, 10), category.id);
                    }
                } catch (error) {
                    console.error(`Error loading ${category.id}:`, error);
                    // Add placeholder content if API fails
                    const container = document.getElementById(category.id);
                    if (container) {
                        container.innerHTML = '<p>Content loading failed. Try searching for movies above.</p>';
                    }
                }
            }
        } catch (error) {
            console.error('Error loading initial movies:', error);
            this.showError('Failed to load initial content. Please check your connection.');
        } finally {
            this.hideLoading();
        }
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new SilvaStreamApp();
});
