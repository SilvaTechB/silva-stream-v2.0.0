class VideoPlayback {
    constructor() {
        this.videoPlayer = null;
        this.currentQuality = 'auto';
        this.currentSubtitles = 'off';
        this.currentSpeed = 1;
        this.isPlaying = false;
        this.isFullscreen = false;
        this.isPIP = false;
        this.isBuffering = false;
        this.currentTime = 0;
        this.duration = 0;
        this.buffered = 0;
        this.playbackSources = [];
        this.subtitleTracks = [];
        this.watchHistory = JSON.parse(localStorage.getItem('watch_history') || '[]');
        
        this.init();
    }

    async init() {
        this.setupDOM();
        this.setupEventListeners();
        await this.loadVideoData();
        this.setupVideoPlayer();
        this.startPlaybackMonitoring();
    }

    setupDOM() {
        // Cache DOM elements
        this.elements = {
            // Video player
            videoPlayer: document.getElementById('videoPlayer'),
            loadingOverlay: document.getElementById('loadingOverlay'),
            connectionSpeed: document.getElementById('connectionSpeed'),
            bufferStatus: document.getElementById('bufferStatus'),
            playerContainer: document.getElementById('playerContainer'),
            customControls: document.getElementById('customControls'),
            errorOverlay: document.getElementById('errorOverlay'),
            errorMessage: document.getElementById('errorMessage'),
            nextEpisodeOverlay: document.getElementById('nextEpisodeOverlay'),
            countdownTimer: document.getElementById('countdownTimer'),
            
            // Controls
            playerBackBtn: document.getElementById('playerBackBtn'),
            playerTitle: document.getElementById('playerTitle'),
            playerCurrentTime: document.getElementById('playerCurrentTime'),
            playerDuration: document.getElementById('playerDuration'),
            centerPlayBtn: document.getElementById('centerPlayBtn'),
            progressSlider: document.getElementById('progressSlider'),
            progressBuffer: document.getElementById('progressBuffer'),
            progressFilled: document.getElementById('progressFilled'),
            currentTimeDisplay: document.getElementById('currentTimeDisplay'),
            totalTimeDisplay: document.getElementById('totalTimeDisplay'),
            playPauseBtn: document.getElementById('playPauseBtn'),
            rewindBtn: document.getElementById('rewindBtn'),
            forwardBtn: document.getElementById('forwardBtn'),
            volumeBtn: document.getElementById('volumeBtn'),
            volumeSlider: document.getElementById('volumeSlider'),
            qualityBtn: document.getElementById('qualityBtn'),
            subtitleBtn: document.getElementById('subtitleBtn'),
            speedBtn: document.getElementById('speedBtn'),
            pipBtn: document.getElementById('pipBtn'),
            fullscreenBtn: document.getElementById('fullscreenBtn'),
            
            // Info
            connectionInfo: document.getElementById('connectionInfo'),
            serverInfo: document.getElementById('serverInfo'),
            bufferInfo: document.getElementById('bufferInfo'),
            
            // Sidebar
            playerSidebar: document.getElementById('playerSidebar'),
            sidebarToggle: document.getElementById('sidebarToggle'),
            contentPoster: document.getElementById('contentPoster'),
            contentTitle: document.getElementById('contentTitle'),
            contentYear: document.getElementById('contentYear'),
            contentRating: document.getElementById('contentRating'),
            contentType: document.getElementById('contentType'),
            contentDescription: document.getElementById('contentDescription'),
            episodeListSection: document.getElementById('episodeListSection'),
            seasonSelect: document.getElementById('seasonSelect'),
            episodeScroll: document.getElementById('episodeScroll'),
            relatedList: document.getElementById('relatedList'),
            
            // Modals
            qualityModal: document.getElementById('qualityModal'),
            subtitleModal: document.getElementById('subtitleModal'),
            speedModal: document.getElementById('speedModal'),
            qualityOptions: document.getElementById('qualityOptions'),
            subtitleOptions: document.getElementById('subtitleOptions'),
            speedOptions: document.getElementById('speedOptions'),
            
            // Error actions
            retryBtn: document.getElementById('retryBtn'),
            qualitySelectBtn: document.getElementById('qualitySelectBtn'),
            downloadBtn: document.getElementById('downloadBtn'),
            
            // Next episode
            playNextBtn: document.getElementById('playNextBtn'),
            cancelNextBtn: document.getElementById('cancelNextBtn')
        };

        this.state = {
            videoType: null,
            videoId: null,
            season: null,
            episode: null,
            videoData: null,
            sources: [],
            currentSourceIndex: 0,
            nextEpisodeCountdown: null,
            controlsVisible: true,
            controlsTimeout: null,
            connectionStats: {
                speed: 0,
                latency: 0,
                quality: 'unknown'
            }
        };
    }

    setupEventListeners() {
        // Navigation
        this.elements.playerBackBtn.addEventListener('click', () => this.goBack());
        
        // Playback controls
        this.elements.centerPlayBtn.addEventListener('click', () => this.togglePlay());
        this.elements.playPauseBtn.addEventListener('click', () => this.togglePlay());
        this.elements.rewindBtn.addEventListener('click', () => this.rewind(10));
        this.elements.forwardBtn.addEventListener('click', () => this.forward(10));
        
        // Progress
        this.elements.progressSlider.addEventListener('input', (e) => this.seekVideo(e.target.value));
        this.elements.progressSlider.addEventListener('mousedown', () => this.pauseVideo());
        this.elements.progressSlider.addEventListener('mouseup', () => {
            if (this.isPlaying) this.playVideo();
        });
        
        // Volume
        this.elements.volumeSlider.addEventListener('input', (e) => this.setVolume(e.target.value));
        this.elements.volumeBtn.addEventListener('click', () => this.toggleMute());
        
        // Quality/Subtitles/Speed
        this.elements.qualityBtn.addEventListener('click', () => this.showQualityModal());
        this.elements.subtitleBtn.addEventListener('click', () => this.showSubtitleModal());
        this.elements.speedBtn.addEventListener('click', () => this.showSpeedModal());
        
        // PIP & Fullscreen
        this.elements.pipBtn.addEventListener('click', () => this.togglePIP());
        this.elements.fullscreenBtn.addEventListener('click', () => this.toggleFullscreen());
        
        // Sidebar
        this.elements.sidebarToggle.addEventListener('click', () => this.toggleSidebar());
        
        // Season select
        this.elements.seasonSelect.addEventListener('change', (e) => this.loadSeasonEpisodes(e.target.value));
        
        // Error actions
        this.elements.retryBtn.addEventListener('click', () => this.retryPlayback());
        this.elements.qualitySelectBtn.addEventListener('click', () => this.showQualityModal());
        this.elements.downloadBtn.addEventListener('click', () => this.downloadVideo());
        
        // Next episode
        this.elements.playNextBtn.addEventListener('click', () => this.playNextEpisode());
        this.elements.cancelNextBtn.addEventListener('click', () => this.cancelNextEpisode());
        
        // Modal close buttons
        document.querySelectorAll('.modal-close').forEach(btn => {
            btn.addEventListener('click', () => this.closeModals());
        });
        
        // Close modals on outside click
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) this.closeModals();
            });
        });
        
        // Video events will be set up after player initialization
        this.setupVideoEvents();
        
        // Mouse move for controls visibility
        this.elements.playerContainer.addEventListener('mousemove', () => this.showControls());
        this.elements.playerContainer.addEventListener('mouseleave', () => this.hideControls());
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => this.handleKeyboardShortcuts(e));
    }

    async loadVideoData() {
        const urlParams = new URLSearchParams(window.location.search);
        this.state.videoId = urlParams.get('id');
        this.state.videoType = urlParams.get('type');
        this.state.season = urlParams.get('season');
        this.state.episode = urlParams.get('episode');
        const directUrl = urlParams.get('url');
        
        if (!this.state.videoId || !this.state.videoType) {
            this.showError('Invalid video parameters');
            return;
        }
        
        this.showLoading();
        
        try {
            // Load video info
            this.state.videoData = await MovieAPI.getMovieInfo(this.state.videoId);
            
            if (!this.state.videoData) {
                throw new Error('Failed to load video data');
            }
            
            // Update UI with video info
            this.updateVideoInfo();
            
            // Load sources
            if (directUrl) {
                // Direct URL provided
                this.state.sources = [{
                    url: decodeURIComponent(directUrl),
                    quality: 'Direct',
                    format: 'direct'
                }];
                this.loadVideoSource(0);
            } else if (this.state.videoType === 'movie') {
                const sourcesData = await MovieAPI.getDownloadSources(this.state.videoId);
                this.state.sources = sourcesData?.results || [];
                this.loadBestSource();
            } else if (this.state.videoType === 'series' && this.state.season && this.state.episode) {
                const sourcesData = await MovieAPI.getDownloadSources(
                    this.state.videoId,
                    this.state.season,
                    this.state.episode
                );
                this.state.sources = sourcesData?.results || [];
                this.loadBestSource();
                
                // Load episodes for sidebar
                this.loadEpisodes();
            }
            
            // Load related content
            this.loadRelatedContent();
            
            // Load subtitles
            this.loadSubtitles();
            
        } catch (error) {
            console.error('Error loading video data:', error);
            this.showError('Failed to load video. Please try again.');
        } finally {
            this.hideLoading();
        }
    }

    loadBestSource() {
        if (!this.state.sources || this.state.sources.length === 0) {
            this.showError('No video sources available');
            return;
        }
        
        // Sort sources by quality (highest first)
        const sortedSources = [...this.state.sources].sort((a, b) => {
            const qualityA = this.parseQuality(a.quality);
            const qualityB = this.parseQuality(b.quality);
            return qualityB - qualityA;
        });
        
        // Check connection and select appropriate quality
        const connectionSpeed = this.state.connectionStats.speed;
        let selectedIndex = 0;
        
        if (connectionSpeed > 0) {
            if (connectionSpeed < 2) { // Less than 2 Mbps
                selectedIndex = sortedSources.findIndex(s => this.parseQuality(s.quality) <= 480);
            } else if (connectionSpeed < 5) { // 2-5 Mbps
                selectedIndex = sortedSources.findIndex(s => this.parseQuality(s.quality) <= 720);
            } else if (connectionSpeed < 10) { // 5-10 Mbps
                selectedIndex = sortedSources.findIndex(s => this.parseQuality(s.quality) <= 1080);
            }
            // For >10 Mbps, use highest quality
        }
        
        selectedIndex = Math.max(0, Math.min(selectedIndex, sortedSources.length - 1));
        this.loadVideoSource(selectedIndex);
    }

    parseQuality(qualityString) {
        if (!qualityString) return 0;
        const match = qualityString.match(/(\d+)p/);
        return match ? parseInt(match[1]) : 0;
    }

    loadVideoSource(sourceIndex) {
        if (!this.state.sources[sourceIndex]) {
            this.showError('Selected source not available');
            return;
        }
        
        this.state.currentSourceIndex = sourceIndex;
        const source = this.state.sources[sourceIndex];
        
        if (this.videoPlayer) {
            // Update source
            this.videoPlayer.src({
                src: source.download_url || source.url,
                type: this.getMimeType(source.format)
            });
            
            // Update quality display
            this.elements.qualityBtn.innerHTML = `
                <i class="fas fa-hd"></i>
                <span class="btn-tooltip">${source.quality || 'Unknown'}</span>
            `;
            
            // Save to watch history
            this.saveToWatchHistory();
        }
    }

    getMimeType(format) {
        const mimeTypes = {
            'mp4': 'video/mp4',
            'm3u8': 'application/x-mpegURL',
            'webm': 'video/webm',
            'mkv': 'video/x-matroska'
        };
        return mimeTypes[format?.toLowerCase()] || 'video/mp4';
    }

    setupVideoPlayer() {
        if (!this.videoPlayer && this.elements.videoPlayer) {
            this.videoPlayer = videojs(this.elements.videoPlayer, {
                controls: false, // Using custom controls
                autoplay: true,
                preload: 'auto',
                fluid: true,
                responsive: true,
                playbackRates: [0.5, 0.75, 1, 1.25, 1.5, 2],
                html5: {
                    nativeTextTracks: false,
                    vhs: {
                        overrideNative: true,
                        enableLowInitialPlaylist: true,
                        smoothQualityChange: true,
                        bandwidth: 1000000 // Start with 1 Mbps
                    }
                }
            });
            
            this.setupVideoEvents();
        }
    }

    setupVideoEvents() {
        if (!this.videoPlayer) return;
        
        // Play/Pause
        this.videoPlayer.on('play', () => {
            this.isPlaying = true;
            this.updatePlayPauseButton();
            this.hideLoading();
        });
        
        this.videoPlayer.on('pause', () => {
            this.isPlaying = false;
            this.updatePlayPauseButton();
        });
        
        this.videoPlayer.on('waiting', () => {
            this.isBuffering = true;
            this.showBuffering();
        });
        
        this.videoPlayer.on('playing', () => {
            this.isBuffering = false;
            this.hideBuffering();
        });
        
        // Time updates
        this.videoPlayer.on('timeupdate', () => {
            this.updateProgress();
            this.updateTimeDisplay();
        });
        
        this.videoPlayer.on('loadedmetadata', () => {
            this.duration = this.videoPlayer.duration();
            this.updateDurationDisplay();
        });
        
        // Progress updates
        this.videoPlayer.on('progress', () => {
            this.updateBufferProgress();
        });
        
        // Ended
        this.videoPlayer.on('ended', () => {
            this.videoEnded();
        });
        
        // Error handling
        this.videoPlayer.on('error', (error) => {
            console.error('Video player error:', error);
            this.handlePlaybackError();
        });
    }

    updateVideoInfo() {
        if (!this.state.videoData) return;
        
        const video = this.state.videoData.results?.subject;
        if (!video) return;
        
        // Update title
        const title = video.title || 'Unknown';
        this.elements.playerTitle.textContent = title;
        this.elements.contentTitle.textContent = title;
        document.title = `${title} - SilvaStream`;
        
        // Update poster
        if (video.cover?.url) {
            this.elements.contentPoster.src = video.cover.url;
        }
        
        // Update metadata
        this.elements.contentYear.textContent = video.year || 'N/A';
        this.elements.contentRating.textContent = video.imdbRatingValue ? `${video.imdbRatingValue}/10` : 'N/A';
        this.elements.contentType.textContent = this.state.videoType === 'movie' ? 'Movie' : 'Series';
        this.elements.contentDescription.textContent = video.description || 'No description available.';
        
        // Update episode section visibility
        if (this.state.videoType === 'series') {
            this.elements.episodeListSection.style.display = 'block';
            this.loadSeasons();
        } else {
            this.elements.episodeListSection.style.display = 'none';
        }
    }

    async loadSeasons() {
        try {
            const seasons = this.state.videoData.results?.resource?.seasons || [];
            
            // Populate season selector
            this.elements.seasonSelect.innerHTML = seasons.map((season, index) => {
                const seasonNum = index + 1;
                return `<option value="${seasonNum}" ${seasonNum == this.state.season ? 'selected' : ''}>
                    Season ${seasonNum}
                </option>`;
            }).join('');
            
            // Load episodes for current season
            this.loadEpisodes();
        } catch (error) {
            console.error('Error loading seasons:', error);
        }
    }

    async loadEpisodes() {
        try {
            const seasonNum = parseInt(this.state.season) || 1;
            const season = this.state.videoData.results?.resource?.seasons?.[seasonNum - 1];
            
            if (!season) return;
            
            const episodeCount = season.maxEp || season.resolutions?.[0]?.epNum || 0;
            const currentEpisode = parseInt(this.state.episode) || 1;
            
            // Generate episode list
            let episodesHTML = '';
            for (let i = 1; i <= episodeCount; i++) {
                const isCurrent = i === currentEpisode;
                episodesHTML += `
                    <div class="episode-item ${isCurrent ? 'current' : ''}" 
                         data-season="${seasonNum}" 
                         data-episode="${i}">
                        <div class="episode-number">${i}</div>
                        <div class="episode-info">
                            <div class="episode-title">Episode ${i}</div>
                            <div class="episode-duration">45 min</div>
                        </div>
                        ${isCurrent ? '<div class="episode-watching"><i class="fas fa-play"></i> Watching</div>' : ''}
                        <button class="episode-play-btn">
                            <i class="fas fa-play"></i>
                        </button>
                    </div>
                `;
            }
            
            this.elements.episodeScroll.innerHTML = episodesHTML;
            
            // Add event listeners
            this.elements.episodeScroll.querySelectorAll('.episode-item').forEach(item => {
                item.addEventListener('click', (e) => {
                    if (!e.target.closest('.episode-play-btn')) {
                        const season = item.dataset.season;
                        const episode = item.dataset.episode;
                        this.playEpisode(season, episode);
                    }
                });
            });
            
            this.elements.episodeScroll.querySelectorAll('.episode-play-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const item = e.target.closest('.episode-item');
                    const season = item.dataset.season;
                    const episode = item.dataset.episode;
                    this.playEpisode(season, episode);
                });
            });
            
        } catch (error) {
            console.error('Error loading episodes:', error);
        }
    }

    async loadRelatedContent() {
        try {
            const similar = await MovieAPI.getSimilarMovies(this.state.videoId);
            if (!similar || similar.length === 0) return;
            
            // Display up to 3 related items
            const relatedHTML = similar.slice(0, 3).map(item => {
                const isMovie = MovieAPI.isMovie(item);
                const type = isMovie ? 'movie' : 'series';
                
                return `
                    <div class="related-item" data-id="${item.subjectId}" data-type="${type}">
                        <img src="${item.cover?.url || 'assets/placeholder.jpg'}" 
                             alt="${item.title}"
                             loading="lazy">
                        <div class="related-overlay">
                            <i class="fas fa-play"></i>
                        </div>
                        <div class="related-info">
                            <div class="related-title">${item.title}</div>
                            <div class="related-year">${item.year || ''}</div>
                        </div>
                    </div>
                `;
            }).join('');
            
            this.elements.relatedList.innerHTML = relatedHTML;
            
            // Add event listeners
            this.elements.relatedList.querySelectorAll('.related-item').forEach(item => {
                item.addEventListener('click', () => {
                    const id = item.dataset.id;
                    const type = item.dataset.type;
                    window.location.href = `playback.html?id=${id}&type=${type}`;
                });
            });
            
        } catch (error) {
            console.error('Error loading related content:', error);
        }
    }

    async loadSubtitles() {
        try {
            let subtitleData;
            
            if (this.state.videoType === 'movie') {
                const sources = await MovieAPI.getDownloadSources(this.state.videoId);
                subtitleData = sources?.subtitles;
            } else if (this.state.videoType === 'series' && this.state.season && this.state.episode) {
                const sources = await MovieAPI.getDownloadSources(
                    this.state.videoId,
                    this.state.season,
                    this.state.episode
                );
                subtitleData = sources?.subtitles;
            }
            
            if (!subtitleData) return;
            
            this.subtitleTracks = subtitleData;
            this.populateSubtitleOptions();
            
        } catch (error) {
            console.error('Error loading subtitles:', error);
        }
    }

    populateSubtitleOptions() {
        if (!this.subtitleTracks || this.subtitleTracks.length === 0) return;
        
        let optionsHTML = '<div class="subtitle-option active" data-lang="off"><span class="subtitle-name">Off</span></div>';
        
        optionsHTML += this.subtitleTracks.map(sub => `
            <div class="subtitle-option" data-lang="${sub.lan}" data-url="${sub.url}">
                <span class="subtitle-name">${sub.lanName} (${sub.lan})</span>
            </div>
        `).join('');
        
        this.elements.subtitleOptions.innerHTML = optionsHTML;
        
        // Add event listeners
        this.elements.subtitleOptions.querySelectorAll('.subtitle-option').forEach(option => {
            option.addEventListener('click', () => {
                this.selectSubtitle(option.dataset.lang, option.dataset.url);
            });
        });
    }

    selectSubtitle(lang, url) {
        // Remove active class from all options
        this.elements.subtitleOptions.querySelectorAll('.subtitle-option').forEach(opt => {
            opt.classList.remove('active');
        });
        
        // Add active class to selected
        const selected = this.elements.subtitleOptions.querySelector(`[data-lang="${lang}"]`);
        if (selected) selected.classList.add('active');
        
        if (lang === 'off') {
            this.disableSubtitles();
        } else {
            this.loadSubtitle(url, lang);
        }
        
        this.closeModals();
    }

    async loadSubtitle(url, lang) {
        try {
            // Fetch and convert SRT to VTT
            const response = await fetch(url);
            const srtText = await response.text();
            const vttText = this.convertSrtToWebVTT(srtText);
            
            // Create blob URL
            const blob = new Blob([vttText], { type: 'text/vtt' });
            const vttUrl = URL.createObjectURL(blob);
            
            // Remove existing track
            const existingTrack = this.videoPlayer.remoteTextTracks().getTrackById('custom-subtitle');
            if (existingTrack) {
                this.videoPlayer.remoteTextTracks().removeTrack(existingTrack);
            }
            
            // Add new track
            this.videoPlayer.addRemoteTextTrack({
                kind: 'subtitles',
                srclang: lang,
                label: lang.toUpperCase(),
                src: vttUrl,
                id: 'custom-subtitle',
                default: true
            }, true);
            
            // Update subtitle button
            this.elements.subtitleBtn.classList.add('active');
            this.elements.subtitleBtn.innerHTML = `
                <i class="fas fa-closed-captioning"></i>
                <span class="btn-tooltip">${lang.toUpperCase()}</span>
            `;
            
        } catch (error) {
            console.error('Error loading subtitle:', error);
            this.showToast('Failed to load subtitle', 'error');
        }
    }

    disableSubtitles() {
        // Remove all text tracks
        const tracks = this.videoPlayer.remoteTextTracks();
        for (let i = tracks.length - 1; i >= 0; i--) {
            this.videoPlayer.removeRemoteTextTrack(tracks[i]);
        }
        
        // Update subtitle button
        this.elements.subtitleBtn.classList.remove('active');
        this.elements.subtitleBtn.innerHTML = `
            <i class="fas fa-closed-captioning"></i>
            <span class="btn-tooltip">Subtitles</span>
        `;
    }

    convertSrtToWebVTT(srtText) {
        // Convert SRT to WebVTT format
        let vttText = 'WEBVTT\n\n';
        vttText += srtText
            .replace(/\r\n/g, '\n')
            .replace(/\n\r/g, '\n')
            .replace(/\r/g, '\n')
            .replace(/(\d+)\n(\d{2}:\d{2}:\d{2},\d{3}) --> (\d{2}:\d{2}:\d{2},\d{3})/g, '$2 --> $3')
            .replace(/(\d{2}:\d{2}:\d{2}),(\d{3})/g, '$1.$2');
        
        return vttText;
    }

    // Playback Controls
    togglePlay() {
        if (this.videoPlayer) {
            if (this.videoPlayer.paused()) {
                this.playVideo();
            } else {
                this.pauseVideo();
            }
        }
    }

    playVideo() {
        if (this.videoPlayer) {
            this.videoPlayer.play();
        }
    }

    pauseVideo() {
        if (this.videoPlayer) {
            this.videoPlayer.pause();
        }
    }

    rewind(seconds) {
        if (this.videoPlayer) {
            const newTime = Math.max(0, this.videoPlayer.currentTime() - seconds);
            this.videoPlayer.currentTime(newTime);
            this.showToast(`Rewound ${seconds} seconds`);
        }
    }

    forward(seconds) {
        if (this.videoPlayer) {
            const newTime = Math.min(this.videoPlayer.duration(), this.videoPlayer.currentTime() + seconds);
            this.videoPlayer.currentTime(newTime);
            this.showToast(`Forwarded ${seconds} seconds`);
        }
    }

    seekVideo(percentage) {
        if (this.videoPlayer) {
            const time = (percentage / 100) * this.videoPlayer.duration();
            this.videoPlayer.currentTime(time);
        }
    }

    setVolume(value) {
        if (this.videoPlayer) {
            const volume = value / 100;
            this.videoPlayer.volume(volume);
            this.updateVolumeButton(volume);
        }
    }

    toggleMute() {
        if (this.videoPlayer) {
            this.videoPlayer.muted(!this.videoPlayer.muted());
            this.updateVolumeButton(this.videoPlayer.volume());
        }
    }

    updateVolumeButton(volume) {
        let icon = 'fa-volume-up';
        
        if (this.videoPlayer.muted() || volume === 0) {
            icon = 'fa-volume-mute';
        } else if (volume < 0.5) {
            icon = 'fa-volume-down';
        }
        
        this.elements.volumeBtn.innerHTML = `<i class="fas ${icon}"></i>`;
        this.elements.volumeSlider.value = volume * 100;
    }

    updatePlayPauseButton() {
        const icon = this.isPlaying ? 'fa-pause' : 'fa-play';
        this.elements.playPauseBtn.innerHTML = `<i class="fas ${icon}"></i>`;
        this.elements.centerPlayBtn.innerHTML = `<i class="fas ${this.isPlaying ? 'fa-pause' : 'fa-play'}"></i>`;
    }

    updateProgress() {
        if (!this.videoPlayer) return;
        
        const currentTime = this.videoPlayer.currentTime();
        const duration = this.videoPlayer.duration();
        
        if (duration > 0) {
            const percentage = (currentTime / duration) * 100;
            this.elements.progressSlider.value = percentage;
            this.elements.progressFilled.style.width = `${percentage}%`;
            
            // Update time displays
            this.elements.currentTimeDisplay.textContent = this.formatTime(currentTime);
            this.elements.playerCurrentTime.textContent = this.formatTime(currentTime);
        }
    }

    updateBufferProgress() {
        if (!this.videoPlayer) return;
        
        const buffered = this.videoPlayer.buffered();
        const duration = this.videoPlayer.duration();
        
        if (duration > 0 && buffered.length > 0) {
            const bufferEnd = buffered.end(buffered.length - 1);
            const bufferPercentage = (bufferEnd / duration) * 100;
            this.elements.progressBuffer.style.width = `${bufferPercentage}%`;
            this.elements.bufferInfo.textContent = `${Math.round(bufferPercentage)}%`;
        }
    }

    updateTimeDisplay() {
        if (!this.videoPlayer) return;
        
        const currentTime = this.videoPlayer.currentTime();
        const duration = this.videoPlayer.duration();
        
        this.elements.currentTimeDisplay.textContent = this.formatTime(currentTime);
        this.elements.playerCurrentTime.textContent = this.formatTime(currentTime);
        
        if (duration) {
            this.elements.totalTimeDisplay.textContent = this.formatTime(duration);
            this.elements.playerDuration.textContent = this.formatTime(duration);
        }
    }

    updateDurationDisplay() {
        if (!this.videoPlayer) return;
        
        const duration = this.videoPlayer.duration();
        if (duration) {
            this.elements.totalTimeDisplay.textContent = this.formatTime(duration);
            this.elements.playerDuration.textContent = this.formatTime(duration);
        }
    }

    formatTime(seconds) {
        const hrs = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);
        
        if (hrs > 0) {
            return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        }
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }

    // Quality Selection
    showQualityModal() {
        if (!this.state.sources || this.state.sources.length === 0) {
            this.showToast('No quality options available', 'error');
            return;
        }
        
        // Sort sources by quality
        const sortedSources = [...this.state.sources].sort((a, b) => {
            const qualityA = this.parseQuality(a.quality);
            const qualityB = this.parseQuality(b.quality);
            return qualityB - qualityA;
        });
        
        // Create quality options
        this.elements.qualityOptions.innerHTML = sortedSources.map((source, index) => {
            const isCurrent = index === this.state.currentSourceIndex;
            const quality = source.quality || 'Unknown';
            const format = source.format || 'mp4';
            const size = this.formatFileSize(source.size);
            
            return `
                <div class="quality-option ${isCurrent ? 'current' : ''}" data-index="${index}">
                    <div class="quality-info">
                        <div class="quality-name">${quality}</div>
                        <div class="quality-details">
                            <span>${format.toUpperCase()}</span>
                            ${size ? `<span>• ${size}</span>` : ''}
                        </div>
                    </div>
                    ${isCurrent ? '<div class="quality-current">Current</div>' : ''}
                    <button class="btn btn-sm ${isCurrent ? 'btn-primary' : 'btn-outline'} select-quality">
                        Select
                    </button>
                </div>
            `;
        }).join('');
        
        // Add event listeners
        this.elements.qualityOptions.querySelectorAll('.select-quality').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const option = e.target.closest('.quality-option');
                const index = parseInt(option.dataset.index);
                this.changeQuality(index);
            });
        });
        
        // Auto quality setting
        this.elements.autoQuality.checked = this.currentQuality === 'auto';
        
        this.elements.qualityModal.classList.add('active');
    }

    changeQuality(index) {
        if (index === this.state.currentSourceIndex) {
            this.closeModals();
            return;
        }
        
        this.loadVideoSource(index);
        this.closeModals();
        this.showToast('Quality changed successfully', 'success');
    }

    // Speed Selection
    showSpeedModal() {
        this.elements.speedModal.classList.add('active');
        
        // Add event listeners to speed options
        this.elements.speedOptions.querySelectorAll('.speed-option').forEach(option => {
            option.addEventListener('click', () => {
                const speed = parseFloat(option.dataset.speed);
                this.setPlaybackSpeed(speed);
            });
        });
    }

    setPlaybackSpeed(speed) {
        if (this.videoPlayer) {
            this.videoPlayer.playbackRate(speed);
            this.currentSpeed = speed;
            
            // Update active button
            this.elements.speedOptions.querySelectorAll('.speed-option').forEach(opt => {
                opt.classList.toggle('active', parseFloat(opt.dataset.speed) === speed);
            });
            
            this.closeModals();
            this.showToast(`Playback speed: ${speed}x`, 'success');
        }
    }

    // PIP & Fullscreen
    togglePIP() {
        if (document.pictureInPictureEnabled && this.videoPlayer) {
            if (this.isPIP) {
                document.exitPictureInPicture();
            } else {
                this.videoPlayer.enterPictureInPicture();
            }
        }
    }

    toggleFullscreen() {
        const container = this.elements.playerContainer;
        
        if (!this.isFullscreen) {
            if (container.requestFullscreen) {
                container.requestFullscreen();
            } else if (container.webkitRequestFullscreen) {
                container.webkitRequestFullscreen();
            } else if (container.msRequestFullscreen) {
                container.msRequestFullscreen();
            }
            this.isFullscreen = true;
            this.elements.fullscreenBtn.innerHTML = '<i class="fas fa-compress"></i>';
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            } else if (document.webkitExitFullscreen) {
                document.webkitExitFullscreen();
            } else if (document.msExitFullscreen) {
                document.msExitFullscreen();
            }
            this.isFullscreen = false;
            this.elements.fullscreenBtn.innerHTML = '<i class="fas fa-expand"></i>';
        }
    }

    // Sidebar
    toggleSidebar() {
        this.elements.playerSidebar.classList.toggle('collapsed');
        this.elements.sidebarToggle.innerHTML = this.elements.playerSidebar.classList.contains('collapsed') 
            ? '<i class="fas fa-chevron-right"></i>' 
            : '<i class="fas fa-chevron-left"></i>';
    }

    // Episode Management
    playEpisode(season, episode) {
        if (this.state.videoType === 'series') {
            window.location.href = `playback.html?id=${this.state.videoId}&type=series&season=${season}&episode=${episode}`;
        }
    }

    loadSeasonEpisodes(season) {
        this.state.season = season;
        this.state.episode = 1;
        this.loadEpisodes();
    }

    videoEnded() {
        if (this.state.videoType === 'series') {
            // Check if there's a next episode
            const currentEpisode = parseInt(this.state.episode);
            const seasonData = this.state.videoData.results?.resource?.seasons?.[this.state.season - 1];
            const episodeCount = seasonData?.maxEp || 0;
            
            if (currentEpisode < episodeCount) {
                // Show next episode countdown
                this.showNextEpisodeCountdown();
            }
        }
        
        // Save completion to history
        this.saveToWatchHistory(true);
    }

    showNextEpisodeCountdown() {
        let countdown = 5;
        this.elements.nextEpisodeOverlay.style.display = 'block';
        this.elements.countdownTimer.textContent = countdown;
        
        this.state.nextEpisodeCountdown = setInterval(() => {
            countdown--;
            this.elements.countdownTimer.textContent = countdown;
            
            if (countdown <= 0) {
                this.playNextEpisode();
            }
        }, 1000);
    }

    playNextEpisode() {
        clearInterval(this.state.nextEpisodeCountdown);
        this.elements.nextEpisodeOverlay.style.display = 'none';
        
        const nextEpisode = parseInt(this.state.episode) + 1;
        this.playEpisode(this.state.season, nextEpisode);
    }

    cancelNextEpisode() {
        clearInterval(this.state.nextEpisodeCountdown);
        this.elements.nextEpisodeOverlay.style.display = 'none';
    }

    // Watch History
    saveToWatchHistory(completed = false) {
        if (!this.state.videoData) return;
        
        const video = this.state.videoData.results?.subject;
        if (!video) return;
        
        const historyItem = {
            id: this.state.videoId,
            type: this.state.videoType,
            title: video.title,
            poster: video.cover?.url,
            timestamp: new Date().toISOString(),
            progress: this.videoPlayer ? this.videoPlayer.currentTime() : 0,
            duration: this.videoPlayer ? this.videoPlayer.duration() : 0,
            completed: completed,
            season: this.state.season,
            episode: this.state.episode
        };
        
        // Remove if already exists
        this.watchHistory = this.watchHistory.filter(item => 
            !(item.id === historyItem.id && 
              item.season === historyItem.season && 
              item.episode === historyItem.episode)
        );
        
        // Add to beginning
        this.watchHistory.unshift(historyItem);
        
        // Keep only last 100 items
        this.watchHistory = this.watchHistory.slice(0, 100);
        
        // Save to localStorage
        localStorage.setItem('watch_history', JSON.stringify(this.watchHistory));
    }

    // Error Handling
    handlePlaybackError() {
        this.showError('Playback error occurred. Trying alternative source...');
        
        // Try next source
        const nextIndex = (this.state.currentSourceIndex + 1) % this.state.sources.length;
        if (nextIndex !== this.state.currentSourceIndex) {
            setTimeout(() => {
                this.loadVideoSource(nextIndex);
            }, 2000);
        }
    }

    retryPlayback() {
        this.hideError();
        this.loadVideoSource(this.state.currentSourceIndex);
    }

    downloadVideo() {
        if (this.state.sources[this.state.currentSourceIndex]?.download_url) {
            const link = document.createElement('a');
            link.href = this.state.sources[this.state.currentSourceIndex].download_url;
            link.download = `${this.state.videoData.results?.subject?.title || 'video'}.mp4`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } else {
            this.showToast('Download not available for this source', 'error');
        }
    }

    // Connection Monitoring
    startPlaybackMonitoring() {
        // Monitor connection every 30 seconds
        setInterval(() => {
            this.checkConnection();
        }, 30000);
        
        // Initial check
        this.checkConnection();
    }

    async checkConnection() {
        try {
            // Simple connection check
            const startTime = Date.now();
            await fetch('https://www.google.com/favicon.ico', { mode: 'no-cors' });
            const latency = Date.now() - startTime;
            
            // Estimate speed (simplified)
            const speed = await this.estimateConnectionSpeed();
            
            this.state.connectionStats = {
                speed: speed,
                latency: latency,
                quality: this.getConnectionQuality(speed, latency)
            };
            
            this.updateConnectionDisplay();
            
            // Auto-quality adjustment
            if (this.currentQuality === 'auto') {
                this.adjustQualityBasedOnConnection();
            }
            
        } catch (error) {
            console.error('Connection check failed:', error);
        }
    }

    async estimateConnectionSpeed() {
        // Simplified speed estimation
        const testUrl = 'https://speed.cloudflare.com/__down?bytes=1000000'; // 1MB file
        const startTime = Date.now();
        
        try {
            const response = await fetch(testUrl);
            const blob = await response.blob();
            const endTime = Date.now();
            
            const duration = (endTime - startTime) / 1000; // seconds
            const size = blob.size / 1000000; // MB
            const speed = size / duration; // MBps
            
            return speed;
        } catch (error) {
            return 0;
        }
    }

    getConnectionQuality(speed, latency) {
        if (speed >= 10 && latency < 50) return 'excellent';
        if (speed >= 5 && latency < 100) return 'good';
        if (speed >= 2 && latency < 200) return 'fair';
        return 'poor';
    }

    updateConnectionDisplay() {
        const stats = this.state.connectionStats;
        this.elements.connectionInfo.textContent = stats.quality.toUpperCase();
        this.elements.connectionSpeed.textContent = `${stats.speed.toFixed(1)} Mbps`;
        
        // Update color based on quality
        const colors = {
            excellent: '#00ff00',
            good: '#aaff00',
            fair: '#ffff00',
            poor: '#ff0000'
        };
        
        this.elements.connectionInfo.style.color = colors[stats.quality] || '#ffffff';
    }

    adjustQualityBasedOnConnection() {
        const quality = this.state.connectionStats.quality;
        const currentQuality = this.parseQuality(
            this.state.sources[this.state.currentSourceIndex]?.quality || '480p'
        );
        
        let targetQuality;
        
        switch(quality) {
            case 'excellent':
                targetQuality = 1080;
                break;
            case 'good':
                targetQuality = 720;
                break;
            case 'fair':
                targetQuality = 480;
                break;
            case 'poor':
                targetQuality = 360;
                break;
            default:
                return;
        }
        
        if (currentQuality > targetQuality) {
            // Find appropriate source
            const newIndex = this.state.sources.findIndex(source => 
                this.parseQuality(source.quality) <= targetQuality
            );
            
            if (newIndex !== -1 && newIndex !== this.state.currentSourceIndex) {
                this.loadVideoSource(newIndex);
                this.showToast(`Auto-adjusted to ${this.state.sources[newIndex].quality} due to connection`, 'info');
            }
        }
    }

    formatFileSize(bytes) {
        if (!bytes) return '';
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
    }

    // UI Controls Visibility
    showControls() {
        this.elements.customControls.classList.add('visible');
        clearTimeout(this.state.controlsTimeout);
        
        this.state.controlsTimeout = setTimeout(() => {
            if (this.isPlaying) {
                this.elements.customControls.classList.remove('visible');
            }
        }, 3000);
    }

    hideControls() {
        if (this.isPlaying) {
            this.elements.customControls.classList.remove('visible');
        }
    }

    // Loading States
    showLoading() {
        this.elements.loadingOverlay.style.display = 'flex';
    }

    hideLoading() {
        this.elements.loadingOverlay.style.display = 'none';
    }

    showBuffering() {
        // Show buffering indicator
        this.elements.bufferStatus.textContent = 'Buffering...';
    }

    hideBuffering() {
        this.elements.bufferStatus.textContent = 'Ready';
    }

    showError(message) {
        this.elements.errorMessage.textContent = message;
        this.elements.errorOverlay.style.display = 'flex';
    }

    hideError() {
        this.elements.errorOverlay.style.display = 'none';
    }

    // Navigation
    goBack() {
        if (window.history.length > 1) {
            window.history.back();
        } else {
            window.location.href = 'index.html';
        }
    }

    closeModals() {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.classList.remove('active');
        });
    }

    // Keyboard Shortcuts
    handleKeyboardShortcuts(e) {
        // Skip if input is focused
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
        
        switch(e.key.toLowerCase()) {
            case ' ':
            case 'k':
                e.preventDefault();
                this.togglePlay();
                break;
            case 'f':
                e.preventDefault();
                this.toggleFullscreen();
                break;
            case 'm':
                e.preventDefault();
                this.toggleMute();
                break;
            case 'arrowleft':
                e.preventDefault();
                this.rewind(5);
                break;
            case 'arrowright':
                e.preventDefault();
                this.forward(5);
                break;
            case 'j':
                this.rewind(10);
                break;
            case 'l':
                this.forward(10);
                break;
            case 'c':
                this.showSubtitleModal();
                break;
            case 'escape':
                this.closeModals();
                if (this.isFullscreen) {
                    this.toggleFullscreen();
                }
                break;
        }
    }

    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
            <span>${message}</span>
        `;
        
        this.elements.playerContainer.appendChild(toast);
        
        setTimeout(() => toast.classList.add('show'), 10);
        
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }
}

// Initialize playback when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.videoPlayback = new VideoPlayback();
});

// Handle fullscreen changes
document.addEventListener('fullscreenchange', () => {
    const playback = window.videoPlayback;
    if (playback) {
        playback.isFullscreen = !playback.isFullscreen;
        playback.elements.fullscreenBtn.innerHTML = playback.isFullscreen 
            ? '<i class="fas fa-compress"></i>' 
            : '<i class="fas fa-expand"></i>';
    }
});

// Handle PIP changes
document.addEventListener('enterpictureinpicture', () => {
    const playback = window.videoPlayback;
    if (playback) playback.isPIP = true;
});

document.addEventListener('leavepictureinpicture', () => {
    const playback = window.videoPlayback;
    if (playback) playback.isPIP = false;
});
