// scripts/search.js
class SearchPage {
    constructor() {
        this.currentQuery = '';
        this.currentPage = 1;
        this.totalResults = 0;
        this.totalPages = 1;
        this.results = [];
        this.filters = {
            type: '',
            genre: '',
            year: ''
        };
        this.sortBy = 'relevance';
        this.isLoading = false;
        
        this.init();
    }

    init() {
        this.setupDOM();
        this.setupEvents();
        this.loadInitialQuery();
        this.performSearch();
    }

    setupDOM() {
        this.searchInput = document.getElementById('search-input');
        this.searchButton = document.getElementById('search-button');
        this.resultsGrid = document.getElementById('results-grid');
        this.resultsTitle = document.getElementById('results-title');
        this.resultsCount = document.getElementById('results-count');
        this.loading = document.getElementById('loading');
        this.noResults = document.getElementById('no-results');
        this.pagination = document.getElementById('pagination');
        this.prevPage = document.getElementById('prev-page');
        this.nextPage = document.getElementById('next-page');
        this.pageInfo = document.getElementById('page-info');
        
        // Filter elements
        this.filterType = document.getElementById('filter-type');
        this.filterGenre = document.getElementById('filter-genre');
        this.filterYear = document.getElementById('filter-year');
        this.sortBySelect = document.getElementById('sort-by');
        
        // Suggestions
        this.suggestionTags = document.querySelectorAll('.suggestion-tag');
    }

    setupEvents() {
        // Search button
        this.searchButton.addEventListener('click', () => this.performSearch());
        
        // Search input events
        this.searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.performSearch();
        });
        
        // Filter changes
        this.filterType.addEventListener('change', () => this.onFilterChange());
        this.filterGenre.addEventListener('change', () => this.onFilterChange());
        this.filterYear.addEventListener('change', () => this.onFilterChange());
        this.sortBySelect.addEventListener('change', () => this.onSortChange());
        
        // Pagination
        this.prevPage.addEventListener('click', () => this.goToPage(this.currentPage - 1));
        this.nextPage.addEventListener('click', () => this.goToPage(this.currentPage + 1));
        
        // Suggestions
        this.suggestionTags.forEach(tag => {
            tag.addEventListener('click', (e) => {
                this.searchInput.value = e.target.dataset.query;
                this.performSearch();
            });
        });
        
        // Debounced search for real-time suggestions
        this.setupRealTimeSearch();
    }

    setupRealTimeSearch() {
        let timeout;
        this.searchInput.addEventListener('input', () => {
            clearTimeout(timeout);
            timeout = setTimeout(() => {
                if (this.searchInput.value.length >= 3) {
                    this.showSuggestions(this.searchInput.value);
                }
            }, 500);
        });
    }

    loadInitialQuery() {
        const urlParams = new URLSearchParams(window.location.search);
        const query = urlParams.get('q') || localStorage.getItem('searchQuery') || '';
        
        if (query) {
            this.searchInput.value = decodeURIComponent(query);
            this.currentQuery = query;
        }
        
        // Load saved filters
        const savedFilters = localStorage.getItem('searchFilters');
        if (savedFilters) {
            this.filters = JSON.parse(savedFilters);
            this.filterType.value = this.filters.type;
            this.filterGenre.value = this.filters.genre;
            this.filterYear.value = this.filters.year;
        }
    }

    async performSearch() {
        const query = this.searchInput.value.trim();
        
        if (!query && !this.filters.type && !this.filters.genre && !this.filters.year) {
            this.showNoResults();
            return;
        }
        
        this.currentQuery = query;
        this.currentPage = 1;
        this.showLoading();
        
        // Update URL
        const newUrl = new URL(window.location);
        newUrl.searchParams.set('q', encodeURIComponent(query));
        window.history.replaceState({}, '', newUrl);
        
        // Save search
        localStorage.setItem('searchQuery', query);
        localStorage.setItem('searchFilters', JSON.stringify(this.filters));
        
        try {
            const results = await MovieAPI.searchMovies(query);
            this.processResults(results);
        } catch (error) {
            console.error('Search error:', error);
            this.showError('Failed to search. Please try again.');
        } finally {
            this.hideLoading();
        }
    }

    processResults(results) {
        if (!results?.results?.items || results.results.items.length === 0) {
            this.showNoResults();
            return;
        }
        
        this.results = results.results.items;
        this.totalResults = this.results.length;
        
        // Apply filters
        this.applyFilters();
        
        // Apply sorting
        this.applySorting();
        
        // Update pagination
        this.totalPages = Math.ceil(this.results.length / 20);
        this.updatePagination();
        
        // Display results
        this.displayResults();
        
        // Update UI
        this.updateResultsInfo();
    }

    applyFilters() {
        if (!this.filters.type && !this.filters.genre && !this.filters.year) {
            return;
        }
        
        this.results = this.results.filter(item => {
            // Type filter
            if (this.filters.type === 'movie' && !MovieAPI.isMovie(item)) {
                return false;
            }
            if (this.filters.type === 'series' && !MovieAPI.isSeries(item)) {
                return false;
            }
            
            // Genre filter
            if (this.filters.genre && item.genre) {
                const genres = item.genre.toLowerCase().split(',');
                if (!genres.some(g => g.includes(this.filters.genre.toLowerCase()))) {
                    return false;
                }
            }
            
            // Year filter
            if (this.filters.year && item.year) {
                if (parseInt(item.year) !== parseInt(this.filters.year)) {
                    return false;
                }
            }
            
            return true;
        });
    }

    applySorting() {
        switch (this.sortBy) {
            case 'year':
                this.results.sort((a, b) => (b.year || 0) - (a.year || 0));
                break;
            case 'rating':
                this.results.sort((a, b) => (b.rating || 0) - (a.rating || 0));
                break;
            case 'title':
                this.results.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
                break;
            default: // relevance
                // Keep API order for relevance
                break;
        }
    }

    displayResults() {
        if (!this.resultsGrid) return;
        
        const startIndex = (this.currentPage - 1) * 20;
        const endIndex = startIndex + 20;
        const pageResults = this.results.slice(startIndex, endIndex);
        
        if (pageResults.length === 0) {
            this.showNoResults();
            return;
        }
        
        this.resultsGrid.innerHTML = pageResults.map(item => {
            const isMovie = MovieAPI.isMovie(item);
            const posterUrl = item.cover?.url || item.cover || item.thumbnail || 
                              'https://via.placeholder.com/300x450/2a2a2a/ffffff?text=No+Image';
            
            return `
                <div class="result-card" data-id="${item.subjectId}" data-type="${isMovie ? 'movie' : 'series'}">
                    <img src="${posterUrl}" 
                         alt="${item.title}" 
                         class="result-poster"
                         loading="lazy"
                         onerror="this.src='https://via.placeholder.com/300x450/2a2a2a/ffffff?text=No+Image'">
                    <div class="result-info">
                        <div class="result-title">${item.title}</div>
                        <div class="result-meta">
                            <span>${item.year || ''}</span>
                            <span class="result-type">${isMovie ? 'MOVIE' : 'SERIES'}</span>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
        
        // Add click events
        this.resultsGrid.querySelectorAll('.result-card').forEach(card => {
            card.addEventListener('click', () => {
                const id = card.dataset.id;
                const type = card.dataset.type;
                window.location.href = `${type}-details.html?id=${id}`;
            });
        });
    }

    updateResultsInfo() {
        if (this.resultsTitle) {
            this.resultsTitle.textContent = this.currentQuery ? 
                `Results for "${this.currentQuery}"` : 
                'Search Results';
        }
        
        if (this.resultsCount) {
            const filteredCount = this.results.length;
            this.resultsCount.textContent = `${filteredCount} result${filteredCount !== 1 ? 's' : ''}`;
        }
        
        if (this.pageInfo) {
            this.pageInfo.textContent = `Page ${this.currentPage} of ${this.totalPages}`;
        }
    }

    updatePagination() {
        if (!this.pagination) return;
        
        if (this.totalPages > 1) {
            this.pagination.style.display = 'flex';
            this.prevPage.disabled = this.currentPage === 1;
            this.nextPage.disabled = this.currentPage === this.totalPages;
        } else {
            this.pagination.style.display = 'none';
        }
    }

    goToPage(page) {
        if (page < 1 || page > this.totalPages) return;
        
        this.currentPage = page;
        this.displayResults();
        this.updatePagination();
        
        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    onFilterChange() {
        this.filters = {
            type: this.filterType.value,
            genre: this.filterGenre.value,
            year: this.filterYear.value
        };
        
        // Re-apply filters and display
        this.applyFilters();
        this.currentPage = 1;
        this.updatePagination();
        this.displayResults();
        this.updateResultsInfo();
        
        // Save filters
        localStorage.setItem('searchFilters', JSON.stringify(this.filters));
    }

    onSortChange() {
        this.sortBy = this.sortBySelect.value;
        this.applySorting();
        this.currentPage = 1;
        this.updatePagination();
        this.displayResults();
    }

    async showSuggestions(query) {
        // This would call a suggestions API
        // For now, we'll just log it
        console.log('Showing suggestions for:', query);
    }

    showLoading() {
        this.isLoading = true;
        if (this.loading) {
            this.loading.style.display = 'flex';
        }
        if (this.resultsGrid) {
            this.resultsGrid.style.opacity = '0.5';
        }
    }

    hideLoading() {
        this.isLoading = false;
        if (this.loading) {
            this.loading.style.display = 'none';
        }
        if (this.resultsGrid) {
            this.resultsGrid.style.opacity = '1';
        }
    }

    showNoResults() {
        if (this.noResults) {
            this.noResults.style.display = 'block';
        }
        if (this.resultsGrid) {
            this.resultsGrid.innerHTML = '';
        }
        if (this.pagination) {
            this.pagination.style.display = 'none';
        }
        if (this.resultsCount) {
            this.resultsCount.textContent = '0 results';
        }
    }

    showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = message;
        errorDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: var(--primary);
            color: white;
            padding: 1rem 1.5rem;
            border-radius: var(--border-radius);
            z-index: 1000;
            box-shadow: var(--card-shadow);
            animation: slideIn 0.3s ease;
        `;
        
        document.body.appendChild(errorDiv);
        
        setTimeout(() => {
            errorDiv.remove();
        }, 3000);
    }
}

// Initialize search page
document.addEventListener('DOMContentLoaded', () => {
    new SearchPage();
});
