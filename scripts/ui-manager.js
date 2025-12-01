// UI Manager for handling loading states, notifications, and UI interactions
class UIManager {
    constructor() {
        this.loadingOverlay = document.getElementById('loadingOverlay');
        this.minimumLoadingTime = 1000; // 1 second minimum
        this.loadingStartTime = null;
        this.loadingTimeout = null;
        this.toastContainer = null;
        this.init();
    }

    init() {
        this.createToastContainer();
        this.setupErrorHandling();
    }

    showLoading() {
        if (this.loadingOverlay) {
            this.loadingStartTime = Date.now();
            this.loadingOverlay.style.display = 'flex';
            this.loadingOverlay.style.opacity = '1';
            
            // Clear any existing timeout
            if (this.loadingTimeout) {
                clearTimeout(this.loadingTimeout);
                this.loadingTimeout = null;
            }
            
            console.log('Loading overlay shown');
        } else {
            console.warn('Loading overlay element not found');
        }
    }

    hideLoading() {
        if (this.loadingOverlay) {
            const elapsed = Date.now() - this.loadingStartTime;
            const remaining = Math.max(0, this.minimumLoadingTime - elapsed);
            
            if (remaining > 0) {
                this.loadingTimeout = setTimeout(() => {
                    this.fadeOutLoading();
                }, remaining);
            } else {
                this.fadeOutLoading();
            }
        }
    }

    fadeOutLoading() {
        if (this.loadingOverlay) {
            this.loadingOverlay.style.opacity = '0';
            
            setTimeout(() => {
                this.loadingOverlay.style.display = 'none';
                console.log('Loading overlay hidden');
            }, 300); // Match CSS transition duration
        }
    }

    createToastContainer() {
        if (!document.getElementById('toastContainer')) {
            this.toastContainer = document.createElement('div');
            this.toastContainer.id = 'toastContainer';
            this.toastContainer.className = 'toast-container';
            document.body.appendChild(this.toastContainer);
        } else {
            this.toastContainer = document.getElementById('toastContainer');
        }
    }

    showNotification(message, type = 'info', duration = 3000) {
        if (!this.toastContainer) this.createToastContainer();
        
        const toast = document.createElement('div');
        toast.className = `toast toast-${type} animate-fade-in-up`;
        toast.innerHTML = `
            <div class="toast-icon">
                <i class="fas ${this.getToastIcon(type)}"></i>
            </div>
            <div class="toast-content">
                <div class="toast-message">${message}</div>
            </div>
            <button class="toast-close">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        this.toastContainer.appendChild(toast);
        
        // Add close event
        const closeBtn = toast.querySelector('.toast-close');
        closeBtn.addEventListener('click', () => {
            this.removeToast(toast);
        });
        
        // Auto remove after duration
        if (duration > 0) {
            setTimeout(() => {
                this.removeToast(toast);
            }, duration);
        }
        
        return toast;
    }

    showError(message, duration = 5000) {
        return this.showNotification(message, 'error', duration);
    }

    showSuccess(message, duration = 3000) {
        return this.showNotification(message, 'success', duration);
    }

    showInfo(message, duration = 3000) {
        return this.showNotification(message, 'info', duration);
    }

    showWarning(message, duration = 4000) {
        return this.showNotification(message, 'warning', duration);
    }

    removeToast(toast) {
        if (toast && toast.parentNode) {
            toast.classList.add('toast-exit');
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300);
        }
    }

    getToastIcon(type) {
        const icons = {
            'success': 'fa-check-circle',
            'error': 'fa-exclamation-circle',
            'warning': 'fa-exclamation-triangle',
            'info': 'fa-info-circle'
        };
        return icons[type] || 'fa-info-circle';
    }

    setupErrorHandling() {
        // Handle unhandled promise rejections
        window.addEventListener('unhandledrejection', (event) => {
            console.error('Unhandled promise rejection:', event.reason);
            this.showError('An unexpected error occurred. Please try again.');
        });

        // Handle JavaScript errors
        window.addEventListener('error', (event) => {
            console.error('JavaScript error:', event.error);
            this.showError('A JavaScript error occurred. Please refresh the page.');
        });
    }

    // Modal management
    showModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'flex';
            setTimeout(() => {
                modal.classList.add('active');
            }, 10);
        }
    }

    hideModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('active');
            setTimeout(() => {
                modal.style.display = 'none';
            }, 300);
        }
    }

    // Confirmation dialog
    confirm(message, title = 'Confirm') {
        return new Promise((resolve) => {
            const modalId = 'confirmModal';
            let modal = document.getElementById(modalId);
            
            if (!modal) {
                modal = document.createElement('div');
                modal.id = modalId;
                modal.className = 'modal';
                modal.innerHTML = `
                    <div class="modal-content">
                        <div class="modal-header">
                            <h3>${title}</h3>
                            <button class="modal-close">&times;</button>
                        </div>
                        <div class="modal-body">
                            <p>${message}</p>
                        </div>
                        <div class="modal-footer">
                            <button class="btn btn-outline" id="confirmCancel">Cancel</button>
                            <button class="btn btn-primary" id="confirmOk">OK</button>
                        </div>
                    </div>
                `;
                document.body.appendChild(modal);
            }
            
            const updateModal = () => {
                modal.querySelector('h3').textContent = title;
                modal.querySelector('p').textContent = message;
            };
            
            const cleanup = () => {
                modal.querySelector('#confirmCancel').removeEventListener('click', cancelHandler);
                modal.querySelector('#confirmOk').removeEventListener('click', okHandler);
                modal.querySelector('.modal-close').removeEventListener('click', cancelHandler);
                this.hideModal(modalId);
            };
            
            const cancelHandler = () => {
                cleanup();
                resolve(false);
            };
            
            const okHandler = () => {
                cleanup();
                resolve(true);
            };
            
            updateModal();
            
            modal.querySelector('#confirmCancel').addEventListener('click', cancelHandler);
            modal.querySelector('#confirmOk').addEventListener('click', okHandler);
            modal.querySelector('.modal-close').addEventListener('click', cancelHandler);
            
            this.showModal(modalId);
        });
    }

    // Loading state for buttons
    setButtonLoading(button, isLoading) {
        if (!button) return;
        
        if (isLoading) {
            const originalText = button.innerHTML;
            button.dataset.originalText = originalText;
            button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading...';
            button.disabled = true;
            button.classList.add('loading');
        } else {
            if (button.dataset.originalText) {
                button.innerHTML = button.dataset.originalText;
                delete button.dataset.originalText;
            }
            button.disabled = false;
            button.classList.remove('loading');
        }
    }

    // Form validation
    validateForm(formId) {
        const form = document.getElementById(formId);
        if (!form) return false;
        
        const inputs = form.querySelectorAll('input[required], select[required], textarea[required]');
        let isValid = true;
        
        inputs.forEach(input => {
            this.clearInputError(input);
            
            if (!input.value.trim()) {
                this.showInputError(input, 'This field is required');
                isValid = false;
            } else if (input.type === 'email' && !this.validateEmail(input.value)) {
                this.showInputError(input, 'Please enter a valid email address');
                isValid = false;
            } else if (input.type === 'password' && input.value.length < 6) {
                this.showInputError(input, 'Password must be at least 6 characters');
                isValid = false;
            }
        });
        
        return isValid;
    }

    showInputError(input, message) {
        input.classList.add('error');
        
        let errorElement = input.parentNode.querySelector('.error-message');
        if (!errorElement) {
            errorElement = document.createElement('div');
            errorElement.className = 'error-message';
            input.parentNode.appendChild(errorElement);
        }
        errorElement.textContent = message;
    }

    clearInputError(input) {
        input.classList.remove('error');
        const errorElement = input.parentNode.querySelector('.error-message');
        if (errorElement) {
            errorElement.remove();
        }
    }

    validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }

    // Progress bar
    showProgress(message) {
        const progressId = 'progressModal';
        let modal = document.getElementById(progressId);
        
        if (!modal) {
            modal = document.createElement('div');
            modal.id = progressId;
            modal.className = 'modal';
            modal.innerHTML = `
                <div class="modal-content">
                    <div class="modal-body">
                        <div class="progress-spinner"></div>
                        <p class="progress-message">${message}</p>
                        <div class="progress-bar">
                            <div class="progress-fill"></div>
                        </div>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);
        }
        
        this.showModal(progressId);
        return {
            update: (newMessage) => {
                const msgElement = modal.querySelector('.progress-message');
                if (msgElement) msgElement.textContent = newMessage;
            },
            setProgress: (percent) => {
                const fill = modal.querySelector('.progress-fill');
                if (fill) fill.style.width = `${percent}%`;
            },
            hide: () => this.hideModal(progressId)
        };
    }

    // Tooltips
    initializeTooltips() {
        const tooltipElements = document.querySelectorAll('[data-tooltip]');
        
        tooltipElements.forEach(element => {
            element.addEventListener('mouseenter', (e) => {
                const tooltipText = e.target.dataset.tooltip;
                const tooltip = document.createElement('div');
                tooltip.className = 'tooltip';
                tooltip.textContent = tooltipText;
                
                document.body.appendChild(tooltip);
                
                const rect = e.target.getBoundingClientRect();
                tooltip.style.position = 'fixed';
                tooltip.style.left = `${rect.left + rect.width / 2 - tooltip.offsetWidth / 2}px`;
                tooltip.style.top = `${rect.top - tooltip.offsetHeight - 10}px`;
                
                e.target.dataset.tooltipId = tooltip.id;
            });
            
            element.addEventListener('mouseleave', (e) => {
                const tooltipId = e.target.dataset.tooltipId;
                if (tooltipId) {
                    const tooltip = document.getElementById(tooltipId);
                    if (tooltip) {
                        tooltip.remove();
                    }
                    delete e.target.dataset.tooltipId;
                }
            });
        });
    }
}

// Create global instance
const uiManager = new UIManager();

// Make available globally
window.UIManager = UIManager;
window.uiManager = uiManager;
