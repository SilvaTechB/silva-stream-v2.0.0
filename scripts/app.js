// scripts/app.js - ENHANCED VERSION

class SilvaStreamApp {
    constructor() {
        this.theme = 'dark';
        this.userProfile = null;
        this.watchHistory = [];
        this.init();
    }

    async init() {
        await this.loadUserData();
        this.setupDOM();
        this.setupEvents();
        this.setupTheme();
        this.loadInitialContent();
        this.setupServiceWorker();
        this.setupIntersectionObserver();
    }

    async loadUserData() {
        // Load user data from localStorage
        const savedTheme = localStorage.getItem('silvastream-theme');
        const savedProfile = localStorage.getItem('silvastream-profile');
        const savedHistory = localStorage.getItem('silvastream-history');

        if (savedTheme) this.theme = savedTheme;
        if (savedProfile) this.userProfile = JSON.parse(savedProfile);
        if (savedHistory) this.watchHistory = JSON.parse(savedHistory);
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
        this.themeToggle = document.querySelector('.theme-toggle');
        
        // Create theme toggle if not exists
        if (!this.themeToggle) {
            this.themeToggle = document.createElement('button');
            this.themeToggle.className = 'theme-toggle';
            this.themeToggle.innerHTML = '<i class="fas fa-moon"></i>';
            document.body.appendChild(this.themeToggle);
        }
    }

    setupEvents() {
        // Window events
        window.addEventListener('scroll', () => this.handleScroll());
        
        // Search events
        if (this.searchBtn) {
            this.searchBtn.addEventListener('click', () => this.openSearchPage());
        }
        if (this.searchInput) {
            this.searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') this.openSearchPage();
            });
        }
        
        // Theme toggle
        this.themeToggle.addEventListener('click', () => this.toggleTheme());
        
        // Hero section events
        if (this.heroWatchBtn) {
            this.heroWatchBtn.addEventListener('click', () => this.showRandomMovie());
        }
        if (this.heroInfoBtn) {
            this.heroInfoBtn.addEventListener('click', () => {
                document.getElementById('trending-now').scrollIntoView({ 
                    behavior: 'smooth' 
                });
            });
        }

        // Mobile menu toggle (for smaller screens)
        this.setupMobileMenu();
    }

    setupTheme() {
        document.documentElement.setAttribute('data-theme', this.theme);
        const icon = this.theme === 'dark' ? 'fa-sun' : 'fa-moon';
        this.themeToggle.innerHTML = `<i class="fas ${icon}"></i>`;
    }

    toggleTheme() {
        this.theme = this.theme === 'dark' ? 'light' : 'dark';
        this.setupTheme();
        localStorage.setItem('silvastream-theme', this.theme);
    }

    handleScroll() {
        if (window.scrollY > 100) {
            this.header.classList.add('scrolled');
        } else {
            this.header.classList.remove('scrolled');
        }

        // Parallax effect for hero
        const hero = document.querySelector('.hero');
        if (hero) {
            const scrolled = window.pageYOffset;
            const rate = scrolled * -0.5;
            hero.style.transform = `translate3d(0, ${rate}px, 0)`;
        }
    }

    showError(message, type = 'error') {
        if (!this.errorMessage) return;
        
        this.errorMessage.textContent = message;
        this.errorMessage.className = `error-message ${type}`;
        this.errorMessage.style.display = 'block';
        
        setTimeout(() => {
            this.errorMessage.style.display = 'none';
        }, 5000);
    }

    showLoading() {
        if (this.loading) {
            this.loading.style.display = 'flex';
        }
    }

    hideLoading() {
        if (this.loading) {
            this.loading.style.display = 'none';
        }
    }

    async openSearchPage() {
        const query = this.searchInput?.value.trim() || '';
        localStorage.setItem('searchQuery', query);
        window.location.href = `search.html?q=${encodeURIComponent(query)}`;
    }

    async showRandomMovie() {
        try {
            const randomCategories = ['action', 'drama', 'comedy', 'adventure'];
            const randomCategory = randomCategories[Math.floor(Math.random() * randomCategories.length)];
            const results = await MovieAPI.searchMovies(randomCategory);
            
            if (results?.results?.items?.length > 0) {
                const randomMovie = results.results.items[Math.floor(Math.random() * results.results.items.length)];
                window.location.href = `movie-details.html?id=${randomMovie.subjectId}`;
            }
        } catch (error) {
            console.error('Error loading random movie:', error);
        }
    }

    async loadInitialContent() {
        this.showLoading();
        
        try {
            // Load categories with view more functionality
            await this.loadCategoriesWithViewMore();
            
            // Load movie slider
            await this.loadMovieSlider();
            
            // Load continue watching
            await this.loadContinueWatching();
            
            // Load recommendations based on history
            await this.loadRecommendations();
            
        } catch (error) {
            console.error('Error loading initial content:', error);
            this.showError('Failed to load content. Please check your connection.');
        } finally {
            this.hideLoading();
        }
    }

    async loadCategoriesWithViewMore() {
        for (const category of categories) {
            try {
                const results = await MovieAPI.searchMovies(category.query);
                if (results?.results?.items) {
                    this.displayMovies(results.results.items.slice(0, 10), category.id);
                    
                    // Add view more button
                    this.addViewMoreButton(category.id, category.query, results.results.items);
                }
            } catch (error) {
                console.error(`Error loading ${category.id}:`, error);
            }
        }
    }

    addViewMoreButton(containerId, categoryName, allItems) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const viewMoreBtn = document.createElement('button');
        viewMoreBtn.className = 'view-more';
        viewMoreBtn.innerHTML = '<i class="fas fa-arrow-right"></i> View More';
        viewMoreBtn.addEventListener('click', () => {
            this.openCategoryPage(categoryName, allItems);
        });

        container.parentNode.insertBefore(viewMoreBtn, container.nextSibling);
    }

    openCategoryPage(categoryName, items) {
        localStorage.setItem('categoryItems', JSON.stringify(items));
        localStorage.setItem('categoryName', categoryName);
        window.location.href = `category.html?name=${encodeURIComponent(categoryName)}`;
    }

    async loadMovieSlider() {
        try {
            const results = await MovieAPI.searchMovies('trending');
            if (results?.results?.items) {
                this.createMovieSlider(results.results.items.slice(0, 10));
            }
        } catch (error) {
            console.error('Error loading movie slider:', error);
        }
    }

    createMovieSlider(movies) {
        const sliderSection = document.createElement('section');
        sliderSection.className = 'movie-slider';
        sliderSection.innerHTML = `
            <div class="slider-header">
                <h2 class="section-title">
                    <i class="fas fa-star"></i> Recommended For You
                </h2>
                <div class="slider-controls">
                    <button class="slider-prev"><i class="fas fa-chevron-left"></i></button>
                    <button class="slider-next"><i class="fas fa-chevron-right"></i></button>
                </div>
            </div>
            <div class="slider-container" id="movie-slider-container"></div>
            <div class="whatsapp-promo-slider">
                <i class="fab fa-whatsapp"></i>
                <p>Follow SilvaStream on WhatsApp for updates!</p>
                <a href="https://whatsapp.com/channel/0029VaAgJ8PAe5ViH81LR41u" 
                   target="_blank" class="whatsapp-btn">
                    Join Channel
                </a>
            </div>
        `;

        const main = document.querySelector('main');
        if (main) {
            main.insertBefore(sliderSection, main.firstChild);
        }

        const sliderContainer = document.getElementById('movie-slider-container');
        if (sliderContainer) {
            sliderContainer.innerHTML = movies.map(movie => this.createSliderCard(movie)).join('');

            // Setup slider controls
            this.setupSliderControls();
        }
    }

    createSliderCard(movie) {
        const isMovie = MovieAPI.isMovie(movie);
        const posterUrl = movie.cover?.url || 'https://via.placeholder.com/300x450/2a2a2a/ffffff?text=No+Image';
        
        return `
            <div class="slider-card" data-id="${movie.subjectId}" data-type="${isMovie ? 'movie' : 'series'}">
                <img src="${posterUrl}" alt="${movie.title}" class="slider-poster">
                <div class="slider-overlay">
                    <div class="slider-info">
                        <h3>${movie.title}</h3>
                        <p>${movie.year || ''}</p>
                        <button class="slider-play-btn">
                            <i class="fas fa-play"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    setupSliderControls() {
        const sliderContainer = document.getElementById('movie-slider-container');
        const prevBtn = document.querySelector('.slider-prev');
        const nextBtn = document.querySelector('.slider-next');

        let scrollAmount = 0;
        const scrollStep = 300;

        prevBtn?.addEventListener('click', () => {
            scrollAmount = Math.max(0, scrollAmount - scrollStep);
            sliderContainer.scrollTo({ left: scrollAmount, behavior: 'smooth' });
        });

        nextBtn?.addEventListener('click', () => {
            scrollAmount += scrollStep;
            sliderContainer.scrollTo({ left: scrollAmount, behavior: 'smooth' });
        });

        // Auto-scroll
        let autoScroll = setInterval(() => {
            scrollAmount += scrollStep;
            if (scrollAmount >= sliderContainer.scrollWidth - sliderContainer.clientWidth) {
                scrollAmount = 0;
            }
            sliderContainer.scrollTo({ left: scrollAmount, behavior: 'smooth' });
        }, 5000);

        // Pause on hover
        sliderContainer.addEventListener('mouseenter', () => clearInterval(autoScroll));
        sliderContainer.addEventListener('mouseleave', () => {
            autoScroll = setInterval(() => {
                scrollAmount += scrollStep;
                if (scrollAmount >= sliderContainer.scrollWidth - sliderContainer.clientWidth) {
                    scrollAmount = 0;
                }
                sliderContainer.scrollTo({ left: scrollAmount, behavior: 'smooth' });
            }, 5000);
        });
    }

    async loadContinueWatching() {
        if (this.watchHistory.length === 0) return;

        const historySection = document.createElement('section');
        historySection.className = 'continue-watching';
        historySection.innerHTML = `
            <h2 class="section-title">
                <i class="fas fa-history"></i> Continue Watching
            </h2>
            <div class="history-grid" id="history-grid"></div>
        `;

        const main = document.querySelector('main');
        if (main) {
            const moviesSection = document.querySelector('.movies-section');
            main.insertBefore(historySection, moviesSection);
        }

        const historyGrid = document.getElementById('history-grid');
        if (historyGrid) {
            // Load last 5 items from history
            const recentItems = this.watchHistory.slice(-5).reverse();
            
            for (const item of recentItems) {
                try {
                    const movieInfo = await MovieAPI.getMovieInfo(item.id);
                    if (movieInfo?.results?.subject) {
                        const card = this.createHistoryCard(movieInfo.results.subject, item);
                        historyGrid.innerHTML += card;
                    }
                } catch (error) {
                    console.error('Error loading history item:', error);
                }
            }
        }
    }

    createHistoryCard(movie, historyItem) {
        const posterUrl = movie.cover?.url || 'https://via.placeholder.com/300x450/2a2a2a/ffffff?text=No+Image';
        
        return `
            <div class="history-card" data-id="${movie.subjectId}">
                <img src="${posterUrl}" alt="${movie.title}" class="history-poster">
                <div class="progress-bar">
                    <div class="progress" style="width: ${historyItem.progress || 0}%"></div>
                </div>
                <div class="history-info">
                    <h3>${movie.title}</h3>
                    <p>Continue from ${this.formatTime(historyItem.timestamp || 0)}</p>
                    <button class="resume-btn">
                        <i class="fas fa-play"></i> Resume
                    </button>
                </div>
            </div>
        `;
    }

    async loadRecommendations() {
        if (this.watchHistory.length === 0) return;

        // Simple recommendation based on most watched genre
        const genreCount = {};
        this.watchHistory.forEach(item => {
            if (item.genre) {
                item.genre.split(',').forEach(genre => {
                    genreCount[genre.trim()] = (genreCount[genre.trim()] || 0) + 1;
                });
            }
        });

        const topGenre = Object.keys(genreCount).sort((a, b) => genreCount[b] - genreCount[a])[0];
        
        if (topGenre) {
            try {
                const results = await MovieAPI.searchMovies(topGenre);
                if (results?.results?.items) {
                    this.createRecommendationsSection(results.results.items.slice(0, 10), topGenre);
                }
            } catch (error) {
                console.error('Error loading recommendations:', error);
            }
        }
    }

    createRecommendationsSection(movies, genre) {
        const recSection = document.createElement('section');
        recSection.className = 'recommendations';
        recSection.innerHTML = `
            <h2 class="section-title">
                <i class="fas fa-magic"></i> Because you watched ${genre}
            </h2>
            <div class="rec-grid" id="rec-grid"></div>
        `;

        const main = document.querySelector('main');
        if (main) {
            main.appendChild(recSection);
        }

        const recGrid = document.getElementById('rec-grid');
        if (recGrid) {
            recGrid.innerHTML = movies.map(movie => this.createMovieCard(movie)).join('');
            this.addMovieCardEvents();
        }
    }

    createMovieCard(movie) {
        const isMovie = MovieAPI.isMovie(movie);
        const posterUrl = movie.cover?.url || movie.cover || movie.thumbnail || 'https://via.placeholder.com/300x450/2a2a2a/ffffff?text=No+Image';
        
        return `
            <div class="movie-card" data-id="${movie.subjectId}" data-type="${isMovie ? 'movie' : 'series'}">
                <img src="${posterUrl}" 
                     alt="${movie.title}" 
                     class="movie-poster" 
                     loading="lazy"
                     onerror="this.src='https://via.placeholder.com/300x450/2a2a2a/ffffff?text=No+Image'">
                <div class="movie-type">${isMovie ? 'MOVIE' : 'SERIES'}</div>
                <div class="movie-info">
                    <h3 class="movie-title">${movie.title}</h3>
                    <p class="movie-year">${movie.year || movie.releaseDate || 'N/A'}</p>
                </div>
                <div class="movie-hover">
                    <button class="play-btn">
                        <i class="fas fa-play"></i>
                    </button>
                    <button class="add-btn">
                        <i class="fas fa-plus"></i>
                    </button>
                    <button class="info-btn">
                        <i class="fas fa-info"></i>
                    </button>
                </div>
            </div>
        `;
    }

    displayMovies(movies, containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        if (!movies || movies.length === 0) {
            container.innerHTML = '<p>No movies found. Try a different search.</p>';
            return;
        }

        container.innerHTML = movies.map(movie => this.createMovieCard(movie)).join('');
        this.addMovieCardEvents();
    }

    addMovieCardEvents() {
        document.querySelectorAll('.movie-card').forEach(card => {
            const playBtn = card.querySelector('.play-btn');
            const addBtn = card.querySelector('.add-btn');
            const infoBtn = card.querySelector('.info-btn');

            card.addEventListener('click', (e) => {
                if (!playBtn.contains(e.target) && !addBtn.contains(e.target) && !infoBtn.contains(e.target)) {
                    this.navigateToDetails(card);
                }
            });

            playBtn?.addEventListener('click', (e) => {
                e.stopPropagation();
                this.playMovie(card);
            });

            addBtn?.addEventListener('click', (e) => {
                e.stopPropagation();
                this.addToMyList(card);
            });

            infoBtn?.addEventListener('click', (e) => {
                e.stopPropagation();
                this.navigateToDetails(card);
            });
        });
    }

    navigateToDetails(card) {
        const movieId = card.dataset.id;
        const isMovie = card.dataset.type === 'movie';
        
        if (isMovie) {
            window.location.href = `movie-details.html?id=${movieId}`;
        } else {
            window.location.href = `series-details.html?id=${movieId}`;
        }
    }

    async playMovie(card) {
        const movieId = card.dataset.id;
        const isMovie = card.dataset.type === 'movie';
        
        // Add to watch history
        this.addToWatchHistory(movieId, isMovie);
        
        if (isMovie) {
            window.location.href = `playback.html?id=${movieId}&type=movie`;
        } else {
            window.location.href = `playback.html?id=${movieId}&type=series`;
        }
    }

    addToMyList(card) {
        const movieId = card.dataset.id;
        const title = card.querySelector('.movie-title').textContent;
        
        // Get current my list
        let myList = JSON.parse(localStorage.getItem('silvastream-mylist') || '[]');
        
        // Check if already in list
        if (!myList.some(item => item.id === movieId)) {
            myList.push({ id: movieId, title: title, addedAt: Date.now() });
            localStorage.setItem('silvastream-mylist', JSON.stringify(myList));
            
            this.showNotification('Added to My List!');
        } else {
            this.showNotification('Already in My List!');
        }
    }

    addToWatchHistory(id, isMovie, progress = 0) {
        const historyItem = {
            id,
            type: isMovie ? 'movie' : 'series',
            timestamp: progress,
            watchedAt: Date.now()
        };

        this.watchHistory.push(historyItem);
        
        // Keep only last 50 items
        if (this.watchHistory.length > 50) {
            this.watchHistory = this.watchHistory.slice(-50);
        }

        localStorage.setItem('silvastream-history', JSON.stringify(this.watchHistory));
    }

    showNotification(message) {
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: var(--primary);
            color: white;
            padding: 12px 20px;
            border-radius: var(--border-radius);
            z-index: 3000;
            box-shadow: var(--shadow);
            animation: slideIn 0.3s ease;
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    setupMobileMenu() {
        if (window.innerWidth <= 768) {
            const menuBtn = document.createElement('button');
            menuBtn.className = 'mobile-menu-btn';
            menuBtn.innerHTML = '<i class="fas fa-bars"></i>';
            
            this.header.querySelector('.header-content').prepend(menuBtn);
            
            menuBtn.addEventListener('click', () => {
                this.navLinks?.classList.toggle('mobile-open');
            });
        }
    }

    setupServiceWorker() {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/service-worker.js')
                .then(reg => console.log('Service Worker registered:', reg))
                .catch(err => console.log('Service Worker failed:', err));
        }
    }

    setupIntersectionObserver() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    
                    // Lazy load images
                    const img = entry.target.querySelector('img[data-src]');
                    if (img) {
                        img.src = img.dataset.src;
                        img.removeAttribute('data-src');
                    }
                }
            });
        }, { threshold: 0.1 });

        // Observe all movie cards
        document.querySelectorAll('.movie-card').forEach(card => {
            observer.observe(card);
        });
    }

    formatTime(seconds) {
        const hrs = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);
        
        if (hrs > 0) {
            return `${hrs}h ${mins}m ${secs}s`;
        }
        return `${mins}m ${secs}s`;
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new SilvaStreamApp();
});

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
    
    .movie-card.visible {
        animation: fadeInUp 0.6s ease;
    }
    
    @keyframes fadeInUp {
        from { opacity: 0; transform: translateY(20px); }
        to { opacity: 1; transform: translateY(0); }
    }
`;
document.head.appendChild(style);
