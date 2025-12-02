// SilvaStream Search Engine
class SearchEngine {
    constructor() {
        this.api = window.movieAPI || new MovieAPI();
        this.utils = window.utils;
        this.searchHistory = this.loadSearchHistory();
        this.searchCache = new Map();
        this.init();
    }

    init() {
        this.setupSearchUI();
        this.setupEventListeners();
        this.setupKeyboardShortcuts();
        this.setupVoiceSearch();
    }

    setupSearchUI() {
        // Create search suggestions dropdown if not exists
        if (!document.getElementById('search-suggestions')) {
            const suggestions = document.createElement('div');
            suggestions.id = 'search-suggestions';
            suggestions.className = 'search-suggestions';
            document.body.appendChild(suggestions);
        }

        // Create search modal if not exists
        if (!document.getElementById('search-modal')) {
            this.createSearchModal();
        }
    }

    createSearchModal() {
        const modal = document.createElement('div');
        modal.id = 'search-modal';
        modal.className = 'search-modal';
        modal.innerHTML = `
            <div class="search-modal-content">
                <div class="search-modal-header">
                    <div class="search-input-container">
                        <i class="fas fa-search"></i>
                        <input type="text" 
                               id="modal-search-input" 
                               class="search-input"
                               placeholder="Search movies, series, actors..."
                               autocomplete="off"
                               autofocus>
                        <button class="search-clear" id="search-clear">&times;</button>
                    </div>
                    <button class="search-close" id="search-close">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="search-modal-body">
                    <div class="search-suggestions-container">
                        <div class="search-history" id="search-history">
                            <h4>Recent Searches</h4>
                            <div class="history-list"></div>
                            <button class="clear-history">Clear History</button>
                        </div>
                        <div class="trending-searches" id="trending-searches">
                            <h4>Trending Now</h4>
                            <div class="trending-tags"></div>
                        </div>
                        <div class="quick-filters">
                            <h4>Quick Filters</h4>
                            <div class="filter-tags">
                                <span class="filter-tag" data-filter="movie">🎬 Movies</span>
                                <span class="filter-tag" data-filter="series">📺 TV Series</span>
                                <span class="filter-tag" data-filter="2024">📅 2024</span>
                                <span class="filter-tag" data-filter="hd">🎥 HD</span>
                            </div>
                        </div>
                    </div>
                    <div class="search-results-container" id="search-results-container">
                        <!-- Results will be populated here -->
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }

    setupEventListeners() {
        // Global search trigger
        document.addEventListener('click', (e) => {
            const searchTrigger = e.target.closest('.search-trigger, .search-btn, [data-search-trigger]');
            if (searchTrigger) {
                e.preventDefault();
                this.openSearchModal();
            }
        });

        // Search input events
        document.addEventListener('input', this.debounce((e) => {
            if (e.target.matches('#global-search-input, #modal-search-input')) {
                const query = e.target.value.trim();
                if (query.length >= 2) {
                    this.showSuggestions(query);
                } else {
                    this.hideSuggestions();
                    this.showSearchHistory();
                }
            }
        }, 300));

        // Search submit
        document.addEventListener('keypress', (e) => {
            if ((e.key === 'Enter') && 
                (e.target.matches('#global-search-input, #modal-search-input'))) {
                e.preventDefault();
                this.performSearch(e.target.value);
            }
        });

        // Close search modal
        document.addEventListener('click', (e) => {
            if (e.target.id === 'search-close' || e.target.closest('#search-close')) {
                this.closeSearchModal();
            }
            
            if (e.target.id === 'search-modal') {
                this.closeSearchModal();
            }
        });

        // Clear search
        document.addEventListener('click', (e) => {
            if (e.target.id === 'search-clear' || e.target.closest('#search-clear')) {
                this.clearSearch();
            }
        });

        // Search history
        document.addEventListener('click', (e) => {
            if (e.target.closest('.history-item')) {
                const query = e.target.closest('.history-item').dataset.query;
                this.performSearch(query);
            }
            
            if (e.target.closest('.clear-history')) {
                this.clearSearchHistory();
            }
        });

        // Trending tags
        document.addEventListener('click', (e) => {
            if (e.target.closest('.trending-tag')) {
                const query = e.target.closest('.trending-tag').dataset.query;
                this.performSearch(query);
            }
        });

        // Filter tags
        document.addEventListener('click', (e) => {
            if (e.target.closest('.filter-tag')) {
                const filter = e.target.closest('.filter-tag').dataset.filter;
                this.applyFilter(filter
