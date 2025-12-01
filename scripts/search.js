class SearchPage {
    constructor() {
        this.currentPage = 1;
        this.totalPages = 1;
        this.currentQuery = '';
        this.currentType = 'all';
        this.filters = {
            genre: [],
            yearFrom: null,
            yearTo: null,
            minRating: 0
        };
        
        this.init();
    }

    init() {
        this.setupDOM();
        this.setupEventListeners();
        this.loadSearchFromURL();
    }

    setupDOM() {
        // Cache DOM elements
        this.elements = {
            loading: document.getElementById('loadingOverlay'),
            searchInput: document.getElementById('searchInput'),
            clearSearch: document.getElementById('clearSearch'),
            searchFilters: document.getElementById('searchFilters'),
            searchQuery: document.getElementById('searchQuery'),
            resultsCount: document.getElementById('resultsCount'),
            resultsSection: document.getElementById('resultsSection'),
            resultsGrid: document.getElementById('resultsGrid'),
            noResults: document.getElementById('noResults'),
            pagination: document.getElementById('pagination'),
            prevPage: document.getElementById('prevPage'),
            nextPage: document.getElementById('nextPage'),
            pageNumbers: document.getElementById('pageNumbers'),
            genreFilters: document.getElementById('genreFilters'),
            yearFrom: document.getElementById('yearFrom'),
            yearTo: document.getElementById('yearTo'),
            ratingRange: document.getElementById('ratingRange'),
            ratingValue: document.getElementById('ratingValue'),
            applyFilters: document.getElementById('applyFilters')
        };
    }

    setupEventListeners() {
        // Search input
        this.elements.searchInput.addEventListener('input', (e) => {
            this.debounceSearch(e.target.value);
        });
        
        this.elements.searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.performSearch();
            }
        });
        
        this.elements.clearSearch.addEventListener('click', () => {
            this.elements.searchInput.value = '';
            this.elements.searchInput.focus();
        });
        
        // Filter buttons
        this.elements.searchFilters.querySelectorAll('.filter-btn[data-type]').forEach(btn => {
            btn.addEventListener('click', () => {
                this.changeFilterType(btn.dataset.type);
            });
        });
        
        // Filter controls
        this.elements.ratingRange.addEventListener('input', (e) => {
            this.elements.ratingValue.textContent = `${e.target.value}+`;
        });
        
        this.elements.applyFilters.addEventListener('click', () => {
            this.applyFilters();
        });
        
        // Pagination
        this.elements.prevPage.addEventListener('click', () => this.goToPage(this.currentPage - 1));
        this.elements.nextPage.addEventListener('click', () => this.goToPage(this.currentPage + 1));
    }

    loadSearchFromURL() {
        const urlParams = new URLSearchParams(window.location.search);
        const query = urlParams.get('q');
        const page = parseInt(urlParams.get('page') || '1');
        const type = urlParams.get('type') || 'all';
        
        if (query) {
            this.currentQuery = query;
            this.currentPage = page;
            this.currentType = type;
            
            this.elements.searchInput.value = query;
            this.elements.searchQuery.textContent = query;
            
            // Set active filter button
            this.elements.searchFilters.querySelectorAll('.filter-btn[data-type]').forEach(btn => {
                btn.classList.toggle('active', btn.dataset.type === type);
            });
            
            this.performSearch();
        } else {
            this.showEmptyState();
        }
    }

    debounceSearch(query) {
        clearTimeout(this.searchTimeout);
        
        if (query.length >= 2) {
            this.searchTimeout = setTimeout(() => {
                this.updateURL(query, 1, this.currentType);
                this.performSearch();
            }, 500);
        } else if (query.length === 0) {
            this.clearResults();
        }
    }

    updateURL(query, page, type) {
        const url = new URL(window.location);
        url.searchParams.set('q', query);
        url.searchParams.set('page', page);
        url.searchParams.set('type', type);
        window.history.replaceState({}, '', url);
    }

    async performSearch() {
        const query = this.elements.searchInput.value.trim();
        
        if (!query || query.length < 2) {
            this.clearResults();
            return;
        }
        
        this.showLoading();
        
        try {
            const results = await MovieAPI.searchMovies(query, this.currentPage);
            
            if (results?.results?.items) {
                this.displayResults(results.results.items, results.results.total);
                this.updatePagination(results.results.total);
            } else {
                this.showNoResults();
            }
        } catch (error) {
            console.error('Search error:', error);
            this.showError('Failed to search. Please try again.');
        } finally {
            this.hideLoading();
        }
    }

    displayResults(items, total) {
        if (!items || items.length === 0) {
            this.showNoResults();
            return;
        }
        
        // Filter by type if needed
        let filteredItems = items;
        if (this.currentType !== 'all') {
            filteredItems = items.filter(item => {
                if (this.currentType === 'movie') return MovieAPI.isMovie(item);
                if (this.currentType === 'series') return MovieAPI.isSeries(item);
                return true;
            });
        }
        
        // Apply additional filters
        filteredItems = this.applyAdditionalFilters(filteredItems);
        
        if (filteredItems.length === 0) {
            this.showNoResults();
            return;
        }
        
        // Update stats
        this.elements.resultsCount.textContent = `${filteredItems.length} of ${total} results`;
        
        // Display results
        this.elements.resultsGrid.innerHTML = filteredItems.map(item => {
            const isMovie = MovieAPI.isMovie(item);
            const type = isMovie ? 'movie' : 'series';
            const year = item.year || 'N/A';
            const rating = item.imdbRatingValue || 'N/A';
            
            return `
                <a href="${type}-details.html?id=${item.subjectId}" class="result-card">
                    <div class="result-poster">
                        <img src="${item.cover?.url || 'assets/placeholder.jpg'}" 
                             alt="${item.title}"
                             loading="lazy"
                             onerror="this.src='assets/placeholder.jpg'">
                        <div class="result-badge">${type.toUpperCase()}</div>
                        ${rating !== 'N/A' ? `
                            <div class="result-rating">
                                <i class="fas fa-star"></i>
                                <span>${rating}</span>
                            </div>
                        ` : ''}
                    </div>
                    <div class="result-info">
                        <h4 class="result-title">${item.title}</h4>
                        <div class="result-meta">
                            <span>${year}</span>
                            <span>•</span>
                            <span>${type}</span>
                        </div>
                        <p class="result-description">${item.description?.substring(0, 100) || 'No description available'}...</p>
                    </div>
                </a>
            `;
        }).join('');
        
        this.elements.resultsSection.style.display = 'block';
        this.elements.noResults.style.display = 'none';
    }

    applyAdditionalFilters(items) {
        return items.filter(item => {
            // Genre filter
            if (this.filters.genre.length > 0 && item.genre) {
                const itemGenres = item.genre.toLowerCase().split(',').map(g => g.trim());
                const hasMatchingGenre = this.filters.genre.some(filterGenre => 
                    itemGenres.includes(filterGenre.toLowerCase())
                );
                if (!hasMatchingGenre) return false;
            }
            
            // Year filter
            if (this.filters.yearFrom && item.year) {
                if (parseInt(item.year) < parseInt(this.filters.yearFrom)) return false;
            }
            
            if (this.filters.yearTo && item.year) {
                if (parseInt(item.year) > parseInt(this.filters.yearTo)) return false;
            }
            
            // Rating filter
            if (this.filters.minRating > 0 && item.imdbRatingValue) {
                if (parseFloat(item.imdbRatingValue) < this.filters.minRating) return false;
            }
            
            return true;
        });
    }

    updatePagination(total) {
        const itemsPerPage = 20;
        this.totalPages = Math.ceil(total / itemsPerPage);
        
        // Update button states
        this.elements.prevPage.disabled = this.currentPage <= 1;
        this.elements.nextPage.disabled = this.currentPage >= this.totalPages;
        
        // Update page numbers
        this.elements.pageNumbers.innerHTML = '';
        
        const maxVisiblePages = 5;
        let startPage = Math.max(1, this.currentPage - Math.floor(maxVisiblePages / 2));
        let endPage = Math.min(this.totalPages, startPage + maxVisiblePages - 1);
        
        if (endPage - startPage + 1 < maxVisiblePages) {
            startPage = Math.max(1, endPage - maxVisiblePages + 1);
        }
        
        for (let i = startPage; i <= endPage; i++) {
            const pageBtn = document.createElement('button');
            pageBtn.className = `page-number ${i === this.currentPage ? 'active' : ''}`;
            pageBtn.textContent = i;
            pageBtn.addEventListener('click', () => this.goToPage(i));
            this.elements.pageNumbers.appendChild(pageBtn);
        }
    }

    goToPage(page) {
        if (page < 1 || page > this.totalPages || page === this.currentPage) return;
        
        this.currentPage = page;
        this.updateURL(this.currentQuery, page, this.currentType);
        this.performSearch();
        
        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    changeFilterType(type) {
        this.currentType = type;
        
        // Update active button
        this.elements.searchFilters.querySelectorAll('.filter-btn[data-type]').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.type === type);
        });
        
        // Update URL and search
        this.updateURL(this.currentQuery, 1, type);
        this.currentPage = 1;
        this.performSearch();
    }

    applyFilters() {
        // Get filter values
        this.filters.genre = Array.from(
            this.elements.genreFilters.querySelectorAll('input:checked')
        ).map(input => input.value);
        
        this.filters.yearFrom = this.elements.yearFrom.value || null;
        this.filters.yearTo = this.elements.yearTo.value || null;
        this.filters.minRating = parseFloat(this.elements.ratingRange.value) || 0;
        
        // Perform search with filters
        this.performSearch();
    }

    clearResults() {
        this.elements.resultsSection.style.display = 'none';
        this.elements.noResults.style.display = 'none';
        this.elements.resultsCount.textContent = '0 results';
        this.elements.searchQuery.textContent = '';
    }

    showEmptyState() {
        this.elements.resultsSection.style.display = 'none';
        this.elements.noResults.style.display = 'block';
        this.elements.noResults.innerHTML = `
            <div class="no-results-content">
                <i class="fas fa-search"></i>
                <h3>Start Searching</h3>
                <p>Enter a movie, TV show, or actor name to begin</p>
                <div class="popular-searches">
                    <h4>Popular Searches:</h4>
                    <div class="popular-tags">
                        <span class="popular-tag" data-query="action">Action</span>
                        <span class="popular-tag" data-query="comedy">Comedy</span>
                        <span class="popular-tag" data-query="marvel">Marvel</span>
                        <span class="popular-tag" data-query="korean drama">K-Drama</span>
                        <span class="popular-tag" data-query="nollywood">Nollywood</span>
                    </div>
                </div>
            </div>
        `;
        
        // Add event listeners to popular tags
        this.elements.noResults.querySelectorAll('.popular-tag').forEach(tag => {
            tag.addEventListener('click', () => {
                const query = tag.dataset.query;
                this.elements.searchInput.value = query;
                this.currentQuery = query;
                this.currentPage = 1;
                this.updateURL(query, 1, 'all');
                this.performSearch();
            });
        });
    }

    showNoResults() {
        this.elements.resultsSection.style.display = 'none';
        this.elements.noResults.style.display = 'block';
        this.elements.noResults.innerHTML = `
            <div class="no-results-content">
                <i class="fas fa-search"></i>
                <h3>No results found for "${this.currentQuery}"</h3>
                <p>Try these suggestions:</p>
                <div class="suggestions">
                    <a href="category.html?type=trending" class="suggestion-link">Trending Now</a>
                    <a href="category.html?type=hollywood" class="suggestion-link">Hollywood Movies</a>
                    <a href="category.html?type=korean" class="suggestion-link">K-Drama Series</a>
                    <a href="new.html" class="suggestion-link">New Releases</a>
                </div>
                <div class="search-tips">
                    <h4>Search Tips:</h4>
                    <ul>
                        <li>Check your spelling</li>
                        <li>Try more general keywords</li>
                        <li>Browse by category instead</li>
                    </ul>
                </div>
            </div>
        `;
    }

    showError(message) {
        this.elements.resultsSection.style.display = 'none';
        this.elements.noResults.style.display = 'block';
        this.elements.noResults.innerHTML = `
            <div class="no-results-content">
                <i class="fas fa-exclamation-triangle"></i>
                <h3>Search Error</h3>
                <p>${message}</p>
                <button class="btn btn-primary" onclick="searchPage.performSearch()">
                    <i class="fas fa-redo"></i> Try Again
                </button>
            </div>
        `;
    }

    showLoading() {
        this.elements.loading.style.display = 'flex';
    }

    hideLoading() {
        this.elements.loading.style.display = 'none';
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.searchPage = new SearchPage();
});
