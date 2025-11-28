// Series Details Page
class SeriesDetails {
    constructor() {
        this.seriesId = this.getSeriesIdFromURL();
        this.selectedDownloadQuality = null;
        if (this.seriesId) {
            this.init();
        } else {
            this.showError('No series ID provided in URL');
        }
    }

    init() {
        this.setupDOM();
        this.setupEvents();
        this.loadSeriesDetails();
    }

    setupDOM() {
        this.loading = document.getElementById('loading');
        this.errorMessage = document.getElementById('error-message');
        this.seriesDetails = document.getElementById('series-details');
        this.detailsBackdrop = document.getElementById('details-backdrop');
        this.detailsPoster = document.getElementById('details-poster');
        this.detailsTitle = document.getElementById('details-title');
        this.detailsYear = document.getElementById('details-year');
        this.detailsSeasons = document.getElementById('details-seasons');
        this.detailsGenre = document.getElementById('details-genre');
        this.detailsRating = document.getElementById('details-rating');
        this.detailsOverview = document.getElementById('details-overview');
        this.watchBtn = document.getElementById('watch-btn');
        this.trailerBtn = document.getElementById('trailer-btn');
        this.seasonsContainer = document.getElementById('seasons-container');
        
        // Modal elements
        this.downloadQualityModal = document.getElementById('download-quality-modal');
        this.downloadQualityOptions = document.getElementById('download-quality-options');
    }

    setupEvents() {
        if (this.watchBtn) {
            this.watchBtn.addEventListener('click', () => this.playFirstEpisode());
        }
        if (this.trailerBtn) {
            this.trailerBtn.addEventListener('click', () => this.playTrailer());
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

    getSeriesIdFromURL() {
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

    async loadSeriesDetails() {
        this.showLoading();
        try {
            const seriesInfo = await MovieAPI.getMovieInfo(this.seriesId);
            console.log('Series Info:', seriesInfo);
            
            if (seriesInfo && seriesInfo.results && seriesInfo.results.subject) {
                this.displaySeriesDetails(seriesInfo.results);
                this.displaySeasons(seriesInfo.results);
            } else {
                this.showError('Failed to load series details');
            }
        } catch (error) {
            console.error('Error loading series details:', error);
            this.showError('Error loading series details. Please try again.');
        } finally {
            this.hideLoading();
        }
    }

    displaySeriesDetails(seriesData) {
        const series = seriesData.subject;
        
        // Update UI with series details
        const backdropUrl = series.cover?.url || series.cover || series.stills?.url || '';
        const posterUrl = series.cover?.url || series.cover || '';
        
        if (this.detailsBackdrop && backdropUrl) {
            this.detailsBackdrop.src = backdropUrl;
        }
        if (this.detailsPoster && posterUrl) {
            this.detailsPoster.src = posterUrl;
        }
        if (this.detailsTitle) {
            this.detailsTitle.textContent = series.title || 'Unknown Title';
            document.title = `${series.title} - SilvaStream`;
        }
        if (this.detailsYear) {
            this.detailsYear.textContent = series.year || series.releaseDate || 'N/A';
        }
        if (this.detailsGenre) {
            this.detailsGenre.textContent = series.genre || 'N/A';
        }
        if (this.detailsRating) {
            const rating = series.imdbRatingValue ? `${series.imdbRatingValue}/10` : 'N/A';
            this.detailsRating.innerHTML = `<i class="fas fa-star"></i> ${rating}`;
        }
        if (this.detailsOverview) {
            this.detailsOverview.textContent = series.description || 'No description available.';
        }

        // Show series details section
        if (this.seriesDetails) {
            this.seriesDetails.style.display = 'block';
        }
    }

    displaySeasons(seriesData) {
        if (!this.seasonsContainer || !seriesData.resource || !seriesData.resource.seasons) return;

        const seasons = seriesData.resource.seasons;
        
        // Update seasons count
        if (this.detailsSeasons) {
            this.detailsSeasons.textContent = `${seasons.length} Season${seasons.length !== 1 ? 's' : ''}`;
        }

        this.seasonsContainer.innerHTML = seasons.map((season, index) => {
            const episodeCount = season.maxEp || season.resolutions?.[0]?.epNum || 0;
            // Start seasons from 1 instead of 0
            const seasonNumber = index + 1;
            return `
                <div class="season-card">
                    <div class="season-header" onclick="seriesDetails.toggleSeason(${index})">
                        <h3>Season ${seasonNumber}</h3>
                        <span>${episodeCount} Episodes <i class="fas fa-chevron-down"></i></span>
                    </div>
                    <div class="episodes-grid" id="season-${index}">
                        ${this.generateEpisodes(season, seasonNumber)}
                    </div>
                </div>
            `;
        }).join('');
    }

    generateEpisodes(season, seasonNumber) {
        const episodeCount = season.maxEp || season.resolutions?.[0]?.epNum || 0;
        let episodesHTML = '';
        
        for (let i = 1; i <= episodeCount; i++) {
            episodesHTML += `
                <div class="episode-card">
                    <div class="episode-info">
                        <div class="episode-number">Episode ${i}</div>
                        <div class="episode-title">Season ${seasonNumber}, Episode ${i}</div>
                    </div>
                    <div class="episode-actions">
                        <button class="episode-play-btn" onclick="seriesDetails.watchEpisode(${seasonNumber}, ${i})">
                            <i class="fas fa-play"></i> Play
                        </button>
                        <button class="episode-download-btn" onclick="seriesDetails.showEpisodeDownloadQuality(${seasonNumber}, ${i})">
                            <i class="fas fa-download"></i> Download
                        </button>
                    </div>
                </div>
            `;
        }
        
        return episodesHTML;
    }

    toggleSeason(index) {
        const seasonCard = document.querySelectorAll('.season-card')[index];
        seasonCard.classList.toggle('active');
    }

    watchEpisode(season, episode) {
        if (this.seriesId) {
            window.location.href = `playback.html?id=${this.seriesId}&type=series&season=${season}&episode=${episode}`;
        } else {
            this.showError('Cannot play episode, series ID is missing.');
        }
    }

    async showEpisodeDownloadQuality(season, episode) {
        this.showLoading();
        try {
            const sources = await MovieAPI.getDownloadSources(this.seriesId, season, episode);
            console.log('Episode Sources:', sources);
            
            this.populateDownloadQualityOptions(sources);
            this.openModal('download-quality-modal');
        } catch (error) {
            console.error('Error loading episode sources:', error);
            this.showError('Error loading episode sources. Please try again.');
        } finally {
            this.hideLoading();
        }
    }

    populateDownloadQualityOptions(sources) {
        if (!this.downloadQualityOptions || !sources || !sources.results) return;

        const downloadableSources = sources.results.filter(source =>
            source.download_url
        );

        if (downloadableSources.length === 0) {
            this.downloadQualityOptions.innerHTML = '<p>No downloadable sources available for this episode.</p>';
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

    playFirstEpisode() {
        // Play first episode of first season (season 1, episode 1)
        this.watchEpisode(1, 1);
    }

    playTrailer() {
        // For now, we'll play the first episode as trailer
        this.playFirstEpisode();
    }

    formatFileSize(bytes) {
        if (!bytes) return 'Unknown size';
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
    }
}

// Initialize series details page when DOM is loaded
let seriesDetails;
document.addEventListener('DOMContentLoaded', () => {
    seriesDetails = new SeriesDetails();
});
