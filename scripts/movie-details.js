// Movie Details Page
class MovieDetails {
    constructor() {
        this.movieId = this.getMovieIdFromURL();
        this.sources = null;
        this.selectedDownloadQuality = null;
        if (this.movieId) {
            this.init();
        } else {
            this.showError('No movie ID provided in URL');
        }
    }

    init() {
        this.setupDOM();
        this.setupEvents();
        this.loadMovieDetails();
    }

    setupDOM() {
        this.loading = document.getElementById('loading');
        this.errorMessage = document.getElementById('error-message');
        this.movieDetails = document.getElementById('movie-details');
        this.detailsBackdrop = document.getElementById('details-backdrop');
        this.detailsPoster = document.getElementById('details-poster');
        this.detailsTitle = document.getElementById('details-title');
        this.detailsYear = document.getElementById('details-year');
        this.detailsRuntime = document.getElementById('details-runtime');
        this.detailsGenre = document.getElementById('details-genre');
        this.detailsRating = document.getElementById('details-rating');
        this.detailsOverview = document.getElementById('details-overview');
        this.watchBtn = document.getElementById('watch-btn');
        this.trailerBtn = document.getElementById('trailer-btn');
        this.downloadBtn = document.getElementById('download-btn');
        this.sourcesSection = document.getElementById('sources-section');
        this.sourcesGrid = document.getElementById('sources-grid');
        
        // Modal elements
        this.downloadQualityModal = document.getElementById('download-quality-modal');
        this.downloadQualityOptions = document.getElementById('download-quality-options');
    }

    setupEvents() {
        if (this.watchBtn) {
            this.watchBtn.addEventListener('click', () => this.watchMovie());
        }
        if (this.trailerBtn) {
            this.trailerBtn.addEventListener('click', () => this.playTrailer());
        }
        if (this.downloadBtn) {
            this.downloadBtn.addEventListener('click', () => this.showDownloadQualitySelection());
        }

        // Modal close events
        document.querySelectorAll('.close-modal').forEach(button => {
            button.addEventListener('click', (e) => {
                const modalId = e.target.getAttribute('data-modal');
                this.closeModal(modalId);
            });
        });

        // Close modal when clicking outside
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeModal(modal.id);
                }
            });
        });

        // Close modal with Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeAllModals();
            }
        });
    }

    getMovieIdFromURL() {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('id');
    }

    showError(message) {
        if (this.errorMessage) {
            this.errorMessage.textContent = message;
            this.errorMessage.style.display = 'block';
        }
    }

    showLoading() {
        if (this.loading) this.loading.style.display = 'block';
    }

    hideLoading() {
        if (this.loading) this.loading.style.display = 'none';
    }

    async loadMovieDetails() {
        this.showLoading();
        try {
            const movieInfo = await MovieAPI.getMovieInfo(this.movieId);
            console.log('Movie Info:', movieInfo);
            
            if (movieInfo && movieInfo.results && movieInfo.results.subject) {
                this.displayMovieDetails(movieInfo.results);
                // Preload sources for quality selection
                await this.loadSources();
            } else {
                this.showError('Failed to load movie details');
            }
        } catch (error) {
            console.error('Error loading movie details:', error);
            this.showError('Error loading movie details. Please try again.');
        } finally {
            this.hideLoading();
        }
    }

    async loadSources() {
        try {
            this.sources = await MovieAPI.getDownloadSources(this.movieId);
            console.log('Sources loaded:', this.sources);
        } catch (error) {
            console.error('Error loading sources:', error);
        }
    }

    displayMovieDetails(movieData) {
        const movie = movieData.subject;
        
        // Update UI with movie details
        const backdropUrl = movie.cover?.url || movie.cover || movie.stills?.url || '';
        const posterUrl = movie.cover?.url || movie.cover || '';
        
        if (this.detailsBackdrop && backdropUrl) {
            this.detailsBackdrop.src = backdropUrl;
        }
        if (this.detailsPoster && posterUrl) {
            this.detailsPoster.src = posterUrl;
        }
        if (this.detailsTitle) {
            this.detailsTitle.textContent = movie.title || 'Unknown Title';
            document.title = `${movie.title} - SilvaStream`;
        }
        if (this.detailsYear) {
            this.detailsYear.textContent = movie.year || movie.releaseDate || 'N/A';
        }
        if (this.detailsRuntime) {
            const duration = movie.duration ? `${Math.floor(movie.duration / 60)} min` : 'N/A';
            this.detailsRuntime.textContent = duration;
        }
        if (this.detailsGenre) {
            this.detailsGenre.textContent = movie.genre || 'N/A';
        }
        if (this.detailsRating) {
            const rating = movie.imdbRatingValue ? `${movie.imdbRatingValue}/10` : 'N/A';
            this.detailsRating.innerHTML = `<i class="fas fa-star"></i> ${rating}`;
        }
        if (this.detailsOverview) {
            this.detailsOverview.textContent = movie.description || 'No description available.';
        }

        // Show movie details section
        if (this.movieDetails) {
            this.movieDetails.style.display = 'block';
        }
    }

    watchMovie() {
        if (this.movieId) {
            window.location.href = `playback.html?id=${this.movieId}&type=movie`;
        } else {
            this.showError('Cannot play movie, ID is missing.');
        }
    }

    async showDownloadQualitySelection() {
        if (!this.sources) {
            this.showLoading();
            await this.loadSources();
            this.hideLoading();
        }

        if (!this.sources || !this.sources.results || !Array.isArray(this.sources.results)) {
            this.showError('No download sources available for this movie.');
            return;
        }

        this.populateDownloadQualityOptions();
        this.openModal('download-quality-modal');
    }

    populateDownloadQualityOptions() {
        if (!this.downloadQualityOptions || !this.sources.results) return;

        const downloadableSources = this.sources.results.filter(source => 
            source.download_url
        );

        if (downloadableSources.length === 0) {
            this.downloadQualityOptions.innerHTML = '<p>No downloadable sources available.</p>';
            return;
        }

        // Sort by quality
        downloadableSources.sort((a, b) => {
            const qualityA = this.parseQuality(a.quality);
            const qualityB = this.parseQuality(b.quality);
            return qualityB - qualityA;
        });

        this.downloadQualityOptions.innerHTML = downloadableSources.map((source, index) => {
            return `
                <div class="quality-option">
                    <div class="quality-info">
                        <div class="quality-name">${source.quality || 'Unknown Quality'}</div>
                        <div class="quality-details">
                            <span>Format: ${source.format || 'mp4'}</span>
                            <span>Size: ${this.formatFileSize(source.size)}</span>
                        </div>
                    </div>
                    <a href="${source.download_url}" class="quality-action" download>
                        <i class="fas fa-download"></i> Download
                    </a>
                </div>
            `;
        }).join('');
    }

    isStreamableFormat(format) {
        const streamableFormats = ['mp4', 'm3u8', 'webm', 'mkv'];
        return streamableFormats.includes((format || 'mp4').toLowerCase());
    }

    parseQuality(quality) {
        if (!quality) return 0;
        const match = quality.match(/(\d+)p/);
        return match ? parseInt(match[1]) : 0;
    }

    openModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'block';
            document.body.style.overflow = 'hidden';
        }
    }

    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
    }

    closeAllModals() {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.style.display = 'none';
        });
        document.body.style.overflow = 'auto';
    }

    async playTrailer() {
        // For now, we'll use the same as playMovie
        this.watchMovie();
    }

    formatFileSize(bytes) {
        if (!bytes) return 'Unknown size';
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
    }
}

// Initialize movie details page when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new MovieDetails();
});
