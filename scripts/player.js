// Modern Video Player with Enhanced Features
class SilvaStreamPlayer {
    constructor() {
        this.video = null;
        this.playerContainer = null;
        this.controls = null;
        this.currentSource = null;
        this.currentQuality = '720p';
        this.currentSubtitle = null;
        this.playbackSpeed = 1;
        this.isFullscreen = false;
        this.isPictureInPicture = false;
        this.isMuted = false;
        this.volume = 1;
        this.playbackHistory = [];
        this.bufferHistory = [];
        
        this.init();
    }

    init() {
        this.setupDOM();
        this.setupVideo();
        this.setupControls();
        this.setupEventListeners();
        this.setupKeyboardShortcuts();
        this.setupQualitySelector();
        this.setupSubtitles();
        this.initializePlayer();
    }

    setupDOM() {
        this.playerContainer = document.getElementById('playerContainer');
        this.video = document.getElementById('videoPlayer');
        this.controls = {
            playPause: document.getElementById('playPauseBtn'),
            currentTime: document.getElementById('currentTime'),
            duration: document.getElementById('duration'),
            progress: document.getElementById('progressBar'),
            volume: document.getElementById('volumeSlider'),
            volumeBtn: document.getElementById('volumeBtn'),
            fullscreen: document.getElementById('fullscreenBtn'),
            pip: document.getElementById('pipBtn'),
            quality: document.getElementById('qualityBtn'),
            subtitles: document.getElementById('subtitlesBtn'),
            speed: document.getElementById('speedBtn'),
            download: document.getElementById('downloadBtn'),
            cast: document.getElementById('castBtn'),
            settings: document.getElementById('settingsBtn'),
            back: document.getElementById('backBtn')
        };
    }

    setupVideo() {
        // Configure video element
        this.video.preload = 'auto';
        this.video.crossOrigin = 'anonymous';
        this.video.playsInline = true;
        
        // Enable hardware acceleration
        this.video.style.transform = 'translateZ(0)';
        
        // Set default volume
        this.video.volume = this.volume;
        this.video.muted = this.isMuted;
    }

    setupControls() {
        // Update volume button
        this.updateVolumeButton();
        
        // Update play/pause button
        this.updatePlayButton();
        
        // Initialize tooltips
        this.initializeTooltips();
    }

    setupEventListeners() {
        // Video events
        this.video.addEventListener('loadedmetadata', () => this.onMetadataLoaded());
        this.video.addEventListener('timeupdate', () => this.onTimeUpdate());
        this.video.addEventListener('ended', () => this.onPlaybackEnded());
        this.video.addEventListener('error', (e) => this.onError(e));
        this.video.addEventListener('waiting', () => this.onBuffering());
        this.video.addEventListener('playing', () => this.onPlaying());
        this.video.addEventListener('volumechange', () => this.onVolumeChange());
        
        // Control events
        this.controls.playPause.addEventListener('click', () => this.togglePlayPause());
        this.controls.progress.addEventListener('input', (e) => this.seekTo(e.target.value));
        this.controls.volume.addEventListener('input', (e) => this.setVolume(e.target.value));
        this.controls.volumeBtn.addEventListener('click', () => this.toggleMute());
        this.controls.fullscreen.addEventListener('click', () => this.toggleFullscreen());
        this.controls.pip.addEventListener('click', () => this.togglePictureInPicture());
        this.controls.back.addEventListener('click', () => this.goBack());
        
        // Quality selection
        this.controls.quality.addEventListener('click', () => this.showQualitySelector());
        
        // Subtitles
        this.controls.subtitles.addEventListener('click', () => this.showSubtitlesMenu());
        
        // Playback speed
        this.controls.speed.addEventListener('click', () => this.showSpeedMenu());
        
        // Mouse events for controls visibility
        this.playerContainer.addEventListener('mousemove', () => this.showControls());
        this.playerContainer.addEventListener('mouseleave', () => this.hideControls());
        
        // Touch events for mobile
        this.playerContainer.addEventListener('touchstart', () => this.toggleControls());
        
        // Fullscreen change
        document.addEventListener('fullscreenchange', () => this.onFullscreenChange());
        document.addEventListener('webkitfullscreenchange', () => this.onFullscreenChange());
        
        // Picture in picture
        this.video.addEventListener('enterpictureinpicture', () => this.onEnterPIP());
        this.video.addEventListener('leavepictureinpicture', () => this.onLeavePIP());
    }

    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Don't trigger if user is typing in an input
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
            
            switch(e.key.toLowerCase()) {
                case ' ':
                case 'k':
                    e.preventDefault();
                    this.togglePlayPause();
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
                    this.skip(-10);
                    break;
                    
                case 'arrowright':
                    e.preventDefault();
                    this.skip(10);
                    break;
                    
                case 'j':
                    e.preventDefault();
                    this.skip(-10);
                    break;
                    
                case 'l':
                    e.preventDefault();
                    this.skip(10);
                    break;
                    
                case 'c':
                    e.preventDefault();
                    this.toggleSubtitles();
                    break;
                    
                case 's':
                    e.preventDefault();
                    this.cyclePlaybackSpeed();
                    break;
                    
                case '0':
                case '1':
                case '2':
                case '3':
                case '4':
                case '5':
                case '6':
                case '7':
                case '8':
                case '9':
                    e.preventDefault();
                    const percentage = parseInt(e.key) * 10;
                    this.seekToPercentage(percentage);
                    break;
                    
                case 'escape':
                    if (this.isFullscreen) {
                        this.exitFullscreen();
                    }
                    break;
            }
        });
    }

    setupQualitySelector() {
        this.qualitySelector = document.getElementById('qualitySelector');
        this.qualityOptions = document.getElementById('qualityOptions');
        
        if (this.qualitySelector) {
            this.qualitySelector.addEventListener('click', (e) => e.stopPropagation());
        }
    }

    setupSubtitles() {
        this.subtitlesMenu = document.getElementById('subtitlesMenu');
        this.subtitlesList = document.getElementById('subtitlesList');
        
        // Create text track for subtitles
        this.textTrack = this.video.addTextTrack('subtitles', 'English', 'en');
        this.textTrack.mode = 'hidden';
    }

    initializePlayer() {
        // Load video source from URL parameters
        const urlParams = new URLSearchParams(window.location.search);
        const videoId = urlParams.get('id');
        const videoType = urlParams.get('type') || 'movie';
        const resumeTime = urlParams.get('time');
        
        if (videoId) {
            this.loadVideo(videoId, videoType, resumeTime);
        } else {
            this.showError('No video specified');
        }
        
        // Initialize stats monitoring
        this.initializeStats();
    }

    async loadVideo(videoId, type, resumeTime = null) {
        try {
            this.showLoading();
            
            // Get video sources
            const sources = await movieAPI.getDownloadSources(videoId);
            
            if (sources && sources.results && sources.results.length > 0) {
                // Sort sources by quality
                const sortedSources = this.sortSourcesByQuality(sources.results);
                
                // Select best available quality
                this.currentSource = this.selectBestSource(sortedSources);
                
                // Set video source
                this.video.src = this.currentSource.download_url;
                
                // Load subtitles if available
                if (sources.subtitles) {
                    this.loadSubtitles(sources.subtitles);
                }
                
                // Resume playback if specified
                if (resumeTime) {
                    this.video.currentTime = parseFloat(resumeTime);
                }
                
                // Start playback
                await this.video.play();
                
                // Track playback start
                this.trackPlayback('start');
                
            } else {
                throw new Error('No video sources available');
            }
            
        } catch (error) {
            console.error('Failed to load video:', error);
            this.showError('Failed to load video. Please try again.');
        } finally {
            this.hideLoading();
        }
    }

    sortSourcesByQuality(sources) {
        const qualityOrder = ['1080p', '720p', '480p', '360p', '240p'];
        
        return sources.sort((a, b) => {
            const aIndex = qualityOrder.indexOf(a.quality);
            const bIndex = qualityOrder.indexOf(b.quality);
            
            // Handle unknown qualities
            if (aIndex === -1) return 1;
            if (bIndex === -1) return -1;
            
            return aIndex - bIndex;
        });
    }

    selectBestSource(sources) {
        // Check network conditions
        const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
        
        if (connection) {
            const effectiveType = connection.effectiveType;
            
            // Adjust quality based on connection
            if (effectiveType === '4g') {
                return sources.find(s => s.quality === '1080p') || sources[0];
            } else if (effectiveType === '3g') {
                return sources.find(s => s.quality === '720p') || sources[0];
            } else {
                return sources.find(s => s.quality === '480p') || sources[0];
            }
        }
        
        // Default to 720p or first available
        return sources.find(s => s.quality === '720p') || sources[0];
    }

    loadSubtitles(subtitles) {
        if (!subtitles || subtitles.length === 0) return;
        
        // Clear existing subtitles
        this.subtitlesList.innerHTML = '';
        
        // Add "Off" option
        const offOption = document.createElement('div');
        offOption.className = 'subtitle-option active';
        offOption.dataset.lang = 'off';
        offOption.innerHTML = `
            <i class="fas fa-ban"></i>
            <span>Subtitles Off</span>
        `;
        offOption.addEventListener('click', () => this.disableSubtitles());
        this.subtitlesList.appendChild(offOption);
        
        // Add available subtitle tracks
        subtitles.forEach((subtitle, index) => {
            const option = document.createElement('div');
            option.className = 'subtitle-option';
            option.dataset.lang = subtitle.language || `sub-${index}`;
            option.innerHTML = `
                <i class="fas fa-closed-captioning"></i>
                <span>${subtitle.language || `Subtitle ${index + 1}`}</span>
            `;
            
            option.addEventListener('click', () => {
                this.loadSubtitleTrack(subtitle.url, subtitle.language);
                this.setActiveSubtitle(option);
            });
            
            this.subtitlesList.appendChild(option);
        });
    }

    async loadSubtitleTrack(url, language) {
        try {
            const response = await fetch(url);
            const srtContent = await response.text();
            
            // Convert SRT to VTT
            const vttContent = this.convertSrtToVtt(srtContent);
            
            // Create blob URL
            const blob = new Blob([vttContent], { type: 'text/vtt' });
            const vttUrl = URL.createObjectURL(blob);
            
            // Create track element
            const track = document.createElement('track');
            track.kind = 'subtitles';
            track.label = language;
            track.srclang = language.substring(0, 2);
            track.src = vttUrl;
            track.default = true;
            
            // Remove existing tracks
            const existingTracks = this.video.querySelectorAll('track');
            existingTracks.forEach(t => t.remove());
            
            // Add new track
            this.video.appendChild(track);
            
            // Enable subtitles
            this.video.textTracks[0].mode = 'showing';
            this.currentSubtitle = language;
            
            // Update UI
            this.controls.subtitles.classList.add('active');
            
        } catch (error) {
            console.error('Failed to load subtitles:', error);
            this.showError('Failed to load subtitles');
        }
    }

    convertSrtToVtt(srtContent) {
        // Simple SRT to VTT conversion
        let vttContent = 'WEBVTT\n\n';
        
        vttContent += srtContent
            .replace(/\r\n/g, '\n')
            .replace(/\n\r/g, '\n')
            .replace(/\r/g, '\n')
            .replace(/(\d+)\n(\d{2}:\d{2}:\d{2},\d{3}) --> (\d{2}:\d{2}:\d{2},\d{3})/g, '$2 --> $3')
            .replace(/(\d{2}:\d{2}:\d{2}),(\d{3})/g, '$1.$2');
        
        return vttContent;
    }

    // Player Controls
    togglePlayPause() {
        if (this.video.paused) {
            this.play();
        } else {
            this.pause();
        }
    }

    play() {
        this.video.play();
        this.updatePlayButton();
        this.trackPlayback('play');
    }

    pause() {
        this.video.pause();
        this.updatePlayButton();
        this.trackPlayback('pause');
    }

    seekTo(value) {
        const time = (value / 100) * this.video.duration;
        this.video.currentTime = time;
    }

    seekToPercentage(percentage) {
        const time = (percentage / 100) * this.video.duration;
        this.video.currentTime = time;
    }

    skip(seconds) {
        this.video.currentTime += seconds;
    }

    setVolume(value) {
        this.volume = value;
        this.video.volume = value;
        this.updateVolumeButton();
    }

    toggleMute() {
        this.isMuted = !this.isMuted;
        this.video.muted = this.isMuted;
        this.updateVolumeButton();
    }

    toggleFullscreen() {
        if (!this.isFullscreen) {
            this.enterFullscreen();
        } else {
            this.exitFullscreen();
        }
    }

    enterFullscreen() {
        if (this.playerContainer.requestFullscreen) {
            this.playerContainer.requestFullscreen();
        } else if (this.playerContainer.webkitRequestFullscreen) {
            this.playerContainer.webkitRequestFullscreen();
        } else if (this.playerContainer.msRequestFullscreen) {
            this.playerContainer.msRequestFullscreen();
        }
    }

    exitFullscreen() {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        } else if (document.webkitExitFullscreen) {
            document.webkitExitFullscreen();
        } else if (document.msExitFullscreen) {
            document.msExitFullscreen();
        }
    }

    togglePictureInPicture() {
        if (!this.isPictureInPicture) {
            this.enterPictureInPicture();
        } else {
            this.exitPictureInPicture();
        }
    }

    async enterPictureInPicture() {
        if (document.pictureInPictureElement) {
            await document.exitPictureInPicture();
        }
        
        try {
            await this.video.requestPictureInPicture();
        } catch (error) {
            console.error('Failed to enter Picture-in-Picture:', error);
        }
    }

    exitPictureInPicture() {
        if (document.exitPictureInPicture) {
            document.exitPictureInPicture();
        }
    }

    toggleSubtitles() {
        if (this.currentSubtitle) {
            this.disableSubtitles();
        } else {
            this.enableSubtitles();
        }
    }

    enableSubtitles() {
        if (this.video.textTracks.length > 0) {
            this.video.textTracks[0].mode = 'showing';
            this.controls.subtitles.classList.add('active');
        }
    }

    disableSubtitles() {
        if (this.video.textTracks.length > 0) {
            this.video.textTracks[0].mode = 'disabled';
            this.controls.subtitles.classList.remove('active');
            this.currentSubtitle = null;
        }
    }

    cyclePlaybackSpeed() {
        const speeds = [0.5, 0.75, 1, 1.25, 1.5, 2];
        const currentIndex = speeds.indexOf(this.playbackSpeed);
        const nextIndex = (currentIndex + 1) % speeds.length;
        
        this.setPlaybackSpeed(speeds[nextIndex]);
    }

    setPlaybackSpeed(speed) {
        this.playbackSpeed = speed;
        this.video.playbackRate = speed;
        
        // Update UI
        this.controls.speed.textContent = `${speed}x`;
    }

    // Event Handlers
    onMetadataLoaded() {
        // Update duration display
        this.controls.duration.textContent = this.formatTime(this.video.duration);
        
        // Update progress bar max
        this.controls.progress.max = 100;
        
        // Show controls
        this.showControls();
    }

    onTimeUpdate() {
        // Update current time display
        this.controls.currentTime.textContent = this.formatTime(this.video.currentTime);
        
        // Update progress bar
        const progress = (this.video.currentTime / this.video.duration) * 100;
        this.controls.progress.value = progress;
        
        // Auto-hide controls after 3 seconds
        if (!this.video.paused) {
            this.hideControlsTimeout = setTimeout(() => {
                this.hideControls();
            }, 3000);
        }
        
        // Save playback position every 30 seconds
        if (Math.floor(this.video.currentTime) % 30 === 0) {
            this.savePlaybackPosition();
        }
    }

    onPlaybackEnded() {
        // Track playback completion
        this.trackPlayback('complete');
        
        // Auto-play next episode if available
        if (Config.APP_CONFIG.PLAYBACK.AUTO_PLAY_NEXT) {
            this.playNext();
        }
    }

    onError(error) {
        console.error('Video error:', error);
        
        // Try alternative source if available
        this.tryAlternativeSource();
    }

    onBuffering() {
        this.showBuffering();
    }

    onPlaying() {
        this.hideBuffering();
    }

    onVolumeChange() {
        this.updateVolumeButton();
    }

    onFullscreenChange() {
        this.isFullscreen = !!(document.fullscreenElement || 
                               document.webkitFullscreenElement || 
                               document.msFullscreenElement);
        
        this.controls.fullscreen.classList.toggle('active', this.isFullscreen);
    }

    onEnterPIP() {
        this.isPictureInPicture = true;
        this.controls.pip.classList.add('active');
    }

    onLeavePIP() {
        this.isPictureInPicture = false;
        this.controls.pip.classList.remove('active');
    }

    // UI Methods
    showControls() {
        clearTimeout(this.hideControlsTimeout);
        this.playerContainer.classList.add('show-controls');
    }

    hideControls() {
        if (!this.video.paused) {
            this.playerContainer.classList.remove('show-controls');
        }
    }

    toggleControls() {
        if (this.playerContainer.classList.contains('show-controls')) {
            this.hideControls();
        } else {
            this.showControls();
        }
    }

    updatePlayButton() {
        const icon = this.video.paused ? 'fa-play' : 'fa-pause';
        this.controls.playPause.innerHTML = `<i class="fas ${icon}"></i>`;
    }

    updateVolumeButton() {
        let icon = 'fa-volume-up';
        
        if (this.isMuted || this.volume === 0) {
            icon = 'fa-volume-mute';
        } else if (this.volume < 0.5) {
            icon = 'fa-volume-down';
        }
        
        this.controls.volumeBtn.innerHTML = `<i class="fas ${icon}"></i>`;
        this.controls.volume.value = this.volume;
    }

    showQualitySelector() {
        // Show quality selection modal
        const modal = document.getElementById('qualityModal');
        if (modal) {
            modal.style.display = 'block';
        }
    }

    showSubtitlesMenu() {
        // Show subtitles menu
        const menu = document.getElementById('subtitlesMenu');
        if (menu) {
            menu.style.display = 'block';
        }
    }

    showSpeedMenu() {
        // Show playback speed menu
        const menu = document.getElementById('speedMenu');
        if (menu) {
            menu.style.display = 'block';
        }
    }

    setActiveSubtitle(element) {
        // Remove active class from all options
        this.subtitlesList.querySelectorAll('.subtitle-option').forEach(opt => {
            opt.classList.remove('active');
        });
        
        // Add active class to selected option
        element.classList.add('active');
    }

    // Utility Methods
    formatTime(seconds) {
        if (isNaN(seconds)) return '00:00';
        
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);
        
        if (hours > 0) {
            return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        }
        
        return `${minutes}:${secs.toString().padStart(2, '0')}`;
    }

    showLoading() {
        const loading = document.getElementById('loadingOverlay');
        if (loading) {
            loading.style.display = 'flex';
        }
    }

    hideLoading() {
        const loading = document.getElementById('loadingOverlay');
        if (loading) {
            loading.style.display = 'none';
        }
    }

    showBuffering() {
        this.playerContainer.classList.add('buffering');
    }

    hideBuffering() {
        this.playerContainer.classList.remove('buffering');
    }

    showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'player-error';
        errorDiv.innerHTML = `
            <i class="fas fa-exclamation-triangle"></i>
            <p>${message}</p>
            <button class="btn btn-primary retry-btn">Retry</button>
        `;
        
        errorDiv.querySelector('.retry-btn').addEventListener('click', () => {
            location.reload();
        });
        
        this.playerContainer.appendChild(errorDiv);
    }

    initializeTooltips() {
        // Initialize tooltips for controls
        const tooltips = {
            playPause: 'Play/Pause (Space)',
            volumeBtn: 'Mute/Unmute (M)',
            fullscreen: 'Fullscreen (F)',
            pip: 'Picture-in-Picture',
            quality: 'Quality Settings',
            subtitles: 'Subtitles (C)',
            speed: 'Playback Speed (S)',
            download: 'Download',
            cast: 'Cast to Device',
            settings: 'Settings',
            back: 'Back to Details'
        };
        
        Object.keys(tooltips).forEach(key => {
            if (this.controls[key]) {
                this.controls[key].title = tooltips[key];
            }
        });
    }

    initializeStats() {
        // Monitor playback statistics
        setInterval(() => {
            this.collectStats();
        }, 10000); // Every 10 seconds
    }

    collectStats() {
        const stats = {
            currentTime: this.video.currentTime,
            duration: this.video.duration,
            buffered: this.getBufferedAmount(),
            playbackRate: this.video.playbackRate,
            volume: this.video.volume,
            muted: this.video.muted,
            networkState: this.video.networkState,
            readyState: this.video.readyState,
            error: this.video.error,
            timestamp: Date.now()
        };
        
        this.bufferHistory.push(stats);
        
        // Keep only last 100 entries
        if (this.bufferHistory.length > 100) {
            this.bufferHistory.shift();
        }
    }

    getBufferedAmount() {
        if (this.video.buffered.length > 0) {
            const bufferedEnd = this.video.buffered.end(this.video.buffered.length - 1);
            return bufferedEnd - this.video.currentTime;
        }
        return 0;
    }

    tryAlternativeSource() {
        // Implement fallback to lower quality
        const currentIndex = this.qualityOptions.indexOf(this.currentQuality);
        if (currentIndex > 0) {
            const lowerQuality = this.qualityOptions[currentIndex - 1];
            this.switchQuality(lowerQuality);
        }
    }

    switchQuality(quality) {
        // Implement quality switching logic
        console.log('Switching to quality:', quality);
        // This would involve changing the video source
    }

    playNext() {
        // Implement next episode/movie logic
        console.log('Playing next...');
    }

    savePlaybackPosition() {
        const urlParams = new URLSearchParams(window.location.search);
        const videoId = urlParams.get('id');
        const videoType = urlParams.get('type') || 'movie';
        
        if (videoId) {
            const playbackData = {
                id: videoId,
                type: videoType,
                time: this.video.currentTime,
                duration: this.video.duration,
                timestamp: Date.now()
            };
            
            // Save to localStorage
            const history = JSON.parse(localStorage.getItem('playbackHistory') || '[]');
            const existingIndex = history.findIndex(item => item.id === videoId);
            
            if (existingIndex !== -1) {
                history[existingIndex] = playbackData;
            } else {
                history.push(playbackData);
            }
            
            localStorage.setItem('playbackHistory', JSON.stringify(history));
            
            // Limit history size
            if (history.length > 100) {
                localStorage.setItem('playbackHistory', JSON.stringify(history.slice(-100)));
            }
        }
    }

    trackPlayback(action) {
        const urlParams = new URLSearchParams(window.location.search);
        const videoId = urlParams.get('id');
        
        if (videoId) {
            const eventData = {
                action: action,
                videoId: videoId,
                currentTime: this.video.currentTime,
                duration: this.video.duration,
                quality: this.currentQuality,
                timestamp: Date.now()
            };
            
            this.playbackHistory.push(eventData);
            
            // Send to analytics if enabled
            if (Config.APP_CONFIG.ANALYTICS.ENABLED) {
                // Send analytics data
                console.log('Playback Event:', eventData);
            }
        }
    }

    goBack() {
        window.history.back();
    }
}

// Initialize player when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const player = new SilvaStreamPlayer();
    window.player = player;
});

// Helper function for quality selection
function selectQuality(quality) {
    if (window.player) {
        window.player.switchQuality(quality);
    }
}

// Helper function for subtitle selection
function selectSubtitle(language) {
    if (window.player) {
        window.player.loadSubtitleTrack(language);
    }
}
