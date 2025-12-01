<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0">
    <title>Watch - SilvaStream</title>
    
    <!-- Meta Tags -->
    <meta property="og:title" content="Watch Now - SilvaStream">
    <meta property="og:description" content="Streaming now on SilvaStream">
    <meta property="og:image" content="">
    <meta property="og:url" content="">
    
    <!-- Stylesheets -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap">
    <link rel="stylesheet" href="styles/main.css">
    <link rel="stylesheet" href="styles/animations.css">
    <link rel="stylesheet" href="styles/player.css">
</head>
<body class="dark-mode">
    <!-- Player Container -->
    <div class="player-container" id="playerContainer">
        <!-- Video Player -->
        <div class="video-wrapper">
            <video id="videoPlayer" class="video-player" playsinline>
                Your browser does not support the video tag.
            </video>
            
            <!-- Loading Spinner -->
            <div class="video-loading" id="videoLoading">
                <div class="loading-spinner"></div>
                <p>Loading video...</p>
            </div>
            
            <!-- Error Overlay -->
            <div class="video-error" id="videoError" style="display: none;">
                <i class="fas fa-exclamation-triangle"></i>
                <h3>Video Playback Error</h3>
                <p>Failed to load video. Please try again.</p>
                <button class="btn btn-primary retry-btn" id="retryBtn">
                    <i class="fas fa-redo"></i> Retry
                </button>
            </div>
            
            <!-- Custom Controls -->
            <div class="video-controls" id="videoControls">
                <!-- Top Controls -->
                <div class="controls-top">
                    <button class="control-btn back-btn" id="backBtn">
                        <i class="fas fa-arrow-left"></i>
                    </button>
                    <div class="video-title" id="videoTitle">
                        Loading...
                    </div>
                    <div class="controls-right">
                        <button class="control-btn" id="castBtn" title="Cast">
                            <i class="fas fa-cast"></i>
                        </button>
                        <button class="control-btn" id="settingsBtn" title="Settings">
                            <i class="fas fa-cog"></i>
                        </button>
                        <button class="control-btn" id="fullscreenBtn" title="Fullscreen">
                            <i class="fas fa-expand"></i>
                        </button>
                    </div>
                </div>
                
                <!-- Center Controls -->
                <div class="controls-center">
                    <button class="control-btn-large play-btn" id="playBtn" title="Play/Pause (Space)">
                        <i class="fas fa-play"></i>
                    </button>
                    <button class="control-btn-large rewind-btn" id="rewindBtn" title="Rewind 10s (←)">
                        <i class="fas fa-backward"></i>
                    </button>
                    <button class="control-btn-large forward-btn" id="forwardBtn" title="Forward 10s (→)">
                        <i class="fas fa-forward"></i>
                    </button>
                </div>
                
                <!-- Bottom Controls -->
                <div class="controls-bottom">
                    <!-- Progress Bar -->
                    <div class="progress-container">
                        <span class="time-current" id="timeCurrent">00:00</span>
                        <input type="range" class="progress-bar" id="progressBar" min="0" max="100" value="0">
                        <span class="time-duration" id="timeDuration">00:00</span>
                    </div>
                    
                    <!-- Control Buttons -->
                    <div class="controls-bottom-left">
                        <button class="control-btn" id="playPauseBtn" title="Play/Pause">
                            <i class="fas fa-play"></i>
                        </button>
                        <button class="control-btn" id="volumeBtn" title="Volume">
                            <i class="fas fa-volume-up"></i>
                        </button>
                        <input type="range" class="volume-slider" id="volumeSlider" min="0" max="100" value="100">
                        <span class="time-display" id="timeDisplay">00:00 / 00:00</span>
                    </div>
                    
                    <div class="controls-bottom-right">
                        <button class="control-btn" id="subtitlesBtn" title="Subtitles (C)">
                            <i class="fas fa-closed-captioning"></i>
                        </button>
                        <button class="control-btn" id="qualityBtn" title="Quality">
                            <i class="fas fa-hd"></i>
                        </button>
                        <button class="control-btn" id="speedBtn" title="Playback Speed (S)">
                            1x
                        </button>
                        <button class="control-btn" id="pipBtn" title="Picture-in-Picture">
                            <i class="fas fa-picture-in-picture"></i>
                        </button>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Video Info Panel -->
        <div class="video-info-panel" id="videoInfoPanel">
            <div class="info-header">
                <h3 id="infoTitle">Now Playing</h3>
                <button class="close-info" id="closeInfoBtn">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            
            <div class="info-content">
                <div class="info-section">
                    <h4>About</h4>
                    <p id="infoDescription">Loading description...</p>
                </div>
                
                <div class="info-section">
                    <h4>Details</h4>
                    <div class="info-details" id="infoDetails">
                        <!-- Details will be loaded here -->
                    </div>
                </div>
                
                <div class="info-section">
                    <h4>Next Up</h4>
                    <div class="next-up" id="nextUp">
                        <!-- Next episode/movie will be loaded here -->
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Modals -->
    <div class="modal" id="qualityModal">
        <div class="modal-content">
            <div class="modal-header">
                <h3>Select Quality</h3>
                <button class="modal-close">&times;</button>
            </div>
            <div class="modal-body">
                <div class="quality-options" id="qualityOptions">
                    <!-- Quality options will be loaded here -->
                </div>
            </div>
        </div>
    </div>

    <div class="modal" id="subtitlesModal">
        <div class="modal-content">
            <div class="modal-header">
                <h3>Subtitles</h3>
                <button class="modal-close">&times;</button>
            </div>
            <div class="modal-body">
                <div class="subtitle-options" id="subtitleOptions">
                    <!-- Subtitle options will be loaded here -->
                </div>
            </div>
        </div>
    </div>

    <div class="modal" id="speedModal">
        <div class="modal-content">
            <div class="modal-header">
                <h3>Playback Speed</h3>
                <button class="modal-close">&times;</button>
            </div>
            <div class="modal-body">
                <div class="speed-options" id="speedOptions">
                    <!-- Speed options will be loaded here -->
                </div>
            </div>
        </div>
    </div>

    <div class="modal" id="settingsModal">
        <div class="modal-content">
            <div class="modal-header">
                <h3>Player Settings</h3>
                <button class="modal-close">&times;</button>
            </div>
            <div class="modal-body">
                <div class="settings-options">
                    <div class="setting-item">
                        <label>
                            <input type="checkbox" id="autoPlayNext" checked>
                            <span>Auto-play next episode</span>
                        </label>
                    </div>
                    <div class="setting-item">
                        <label>
                            <input type="checkbox" id="autoSkipIntro" checked>
                            <span>Auto-skip intro</span>
                        </label>
                    </div>
                    <div class="setting-item">
                        <label>
                            <input type="checkbox" id="showSubtitlesByDefault">
                            <span>Show subtitles by default</span>
                        </label>
                    </div>
                    <div class="setting-item">
                        <label>
                            <input type="checkbox" id="rememberPlaybackPosition" checked>
                            <span>Remember playback position</span>
                        </label>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Loading Overlay -->
    <div class="loading-overlay" id="loadingOverlay">
        <div class="loading-content">
            <div class="loader">
                <div class="loader-film">
                    <div class="film-strip"></div>
                    <div class="film-strip"></div>
                    <div class="film-strip"></div>
                </div>
            </div>
            <p>Loading player...</p>
        </div>
    </div>

    <!-- Scripts -->
    <script src="scripts/config.js"></script>
    <script src="scripts/api.js"></script>
    <script src="scripts/cache.js"></script>
    <script src="scripts/ui-manager.js"></script>
    <script src="scripts/auth.js"></script>
    <script src="scripts/theme.js"></script>
    <script src="scripts/player.js"></script>
    
    <script>
        document.addEventListener('DOMContentLoaded', () => {
            // Initialize theme
            const theme = new ThemeManager();
            theme.init();
            
            // Initialize player
            const player = new SilvaStreamPlayer();
            player.init();
            
            // Modal close buttons
            document.querySelectorAll('.modal-close').forEach(btn => {
                btn.addEventListener('click', function() {
                    const modal = this.closest('.modal');
                    if (modal) {
                        modal.style.display = 'none';
                    }
                });
            });
            
            // Close modal when clicking outside
            document.querySelectorAll('.modal').forEach(modal => {
                modal.addEventListener('click', (e) => {
                    if (e.target === modal) {
                        modal.style.display = 'none';
                    }
                });
            });
            
            // Close modal with Escape key
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') {
                    document.querySelectorAll('.modal').forEach(modal => {
                        modal.style.display = 'none';
                    });
                }
            });
            
            // Back button
            const backBtn = document.getElementById('backBtn');
            if (backBtn) {
                backBtn.addEventListener('click', () => {
                    window.history.back();
                });
            }
            
            // Close info panel
            const closeInfoBtn = document.getElementById('closeInfoBtn');
            if (closeInfoBtn) {
                closeInfoBtn.addEventListener('click', () => {
                    const infoPanel = document.getElementById('videoInfoPanel');
                    if (infoPanel) {
                        infoPanel.classList.remove('active');
                    }
                });
            }
            
            // Toggle info panel when clicking video title
            const videoTitle = document.getElementById('videoTitle');
            if (videoTitle) {
                videoTitle.addEventListener('click', () => {
                    const infoPanel = document.getElementById('videoInfoPanel');
                    if (infoPanel) {
                        infoPanel.classList.toggle('active');
                    }
                });
            }
        });
    </script>
</body>
</html>
