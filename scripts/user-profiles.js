// scripts/user-profiles.js
class UserProfiles {
    constructor() {
        this.currentProfile = null;
        this.profiles = [];
        this.init();
    }

    init() {
        this.loadProfiles();
        this.setupProfileSelector();
    }

    loadProfiles() {
        const savedProfiles = localStorage.getItem('silvastream-profiles');
        if (savedProfiles) {
            this.profiles = JSON.parse(savedProfiles);
        } else {
            // Create default profile
            this.createDefaultProfile();
        }
        
        // Load current profile
        const currentProfileId = localStorage.getItem('silvastream-current-profile');
        this.currentProfile = this.profiles.find(p => p.id === currentProfileId) || this.profiles[0];
    }

    createDefaultProfile() {
        const defaultProfile = {
            id: 'default',
            name: 'Default',
            avatar: '👤',
            color: '#e50914',
            preferences: {
                autoPlay: true,
                quality: 'auto',
                subtitles: 'off',
                notifications: true
            },
            watchHistory: [],
            myList: [],
            createdAt: Date.now()
        };
        
        this.profiles = [defaultProfile];
        this.saveProfiles();
    }

    saveProfiles() {
        localStorage.setItem('silvastream-profiles', JSON.stringify(this.profiles));
    }

    setupProfileSelector() {
        // Create profile selector in header if not exists
        if (!document.querySelector('.profile-selector')) {
            this.createProfileSelector();
        }
    }

    createProfileSelector() {
        const userActions = document.querySelector('.user-actions');
        if (!userActions) return;

        const profileSelector = document.createElement('div');
        profileSelector.className = 'profile-selector';
        profileSelector.innerHTML = `
            <div class="current-profile" id="current-profile">
                <div class="profile-avatar" style="background: ${this.currentProfile.color}">
                    ${this.currentProfile.avatar}
                </div>
                <span class="profile-name">${this.currentProfile.name}</span>
                <i class="fas fa-chevron-down"></i>
            </div>
            <div class="profile-dropdown" id="profile-dropdown">
                ${this.profiles.map(profile => `
                    <div class="profile-option" data-id="${profile.id}">
                        <div class="profile-avatar" style="background: ${profile.color}">
                            ${profile.avatar}
                        </div>
                        <span class="profile-name">${profile.name}</span>
                        ${profile.id === this.currentProfile.id ? 
                            '<i class="fas fa-check"></i>' : ''}
                    </div>
                `).join('')}
                <div class="profile-divider"></div>
                <div class="profile-option manage-profiles">
                    <i class="fas fa-user-cog"></i>
                    <span>Manage Profiles</span>
                </div>
            </div>
        `;

        userActions.appendChild(profileSelector);
        this.setupProfileEvents();
    }

    setupProfileEvents() {
        const currentProfile = document.getElementById('current-profile');
        const profileDropdown = document.getElementById('profile-dropdown');

        currentProfile.addEventListener('click', () => {
            profileDropdown.classList.toggle('show');
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!profileDropdown.contains(e.target) && 
                !currentProfile.contains(e.target)) {
                profileDropdown.classList.remove('show');
            }
        });

        // Profile selection
        profileDropdown.querySelectorAll('.profile-option:not(.manage-profiles)').forEach(option => {
            option.addEventListener('click', () => {
                const profileId = option.dataset.id;
                this.switchProfile(profileId);
                profileDropdown.classList.remove('show');
            });
        });

        // Manage profiles
        profileDropdown.querySelector('.manage-profiles').addEventListener('click', () => {
            this.showManageProfiles();
            profileDropdown.classList.remove('show');
        });
    }

    switchProfile(profileId) {
        const profile = this.profiles.find(p => p.id === profileId);
        if (!profile) return;

        this.currentProfile = profile;
        localStorage.setItem('silvastream-current-profile', profileId);
        
        this.updateProfileSelector();
        this.dispatchProfileChangeEvent();
    }

    updateProfileSelector() {
        const currentProfileEl = document.getElementById('current-profile');
        const profileDropdown = document.getElementById('profile-dropdown');
        
        if (currentProfileEl) {
            currentProfileEl.querySelector('.profile-avatar').innerHTML = this.currentProfile.avatar;
            currentProfileEl.querySelector('.profile-avatar').style.background = this.currentProfile.color;
            currentProfileEl.querySelector('.profile-name').textContent = this.currentProfile.name;
        }
        
        if (profileDropdown) {
            profileDropdown.innerHTML = this.profiles.map(profile => `
                <div class="profile-option" data-id="${profile.id}">
                    <div class="profile-avatar" style="background: ${profile.color}">
                        ${profile.avatar}
                    </div>
                    <span class="profile-name">${profile.name}</span>
                    ${profile.id === this.currentProfile.id ? 
                        '<i class="fas fa-check"></i>' : ''}
                </div>
            `).join('') + `
                <div class="profile-divider"></div>
                <div class="profile-option manage-profiles">
                    <i class="fas fa-user-cog"></i>
                    <span>Manage Profiles</span>
                </div>
            `;
        }
    }

    showManageProfiles() {
        const modal = document.createElement('div');
        modal.className = 'modal profiles-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Manage Profiles</h3>
                    <button class="close-modal">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="profiles-list" id="profiles-list">
                        ${this.profiles.map(profile => this.createProfileCard(profile)).join('')}
                    </div>
                    <button class="btn btn-primary" id="add-profile-btn">
                        <i class="fas fa-plus"></i> Add New Profile
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        modal.style.display = 'block';

        this.setupManageProfilesEvents(modal);
    }

    createProfileCard(profile) {
        return `
            <div class="profile-card" data-id="${profile.id}">
                <div class="profile-card-header">
                    <div class="profile-avatar-large" style="background: ${profile.color}">
                        ${profile.avatar}
                    </div>
                    <div class="profile-info">
                        <h4>${profile.name}</h4>
                        <p>${profile.watchHistory?.length || 0} titles watched</p>
                    </div>
                </div>
                <div class="profile-card-actions">
                    <button class="btn btn-secondary switch-profile-btn" data-id="${profile.id}">
                        Switch
                    </button>
                    <button class="btn btn-text edit-profile-btn" data-id="${profile.id}">
                        Edit
                    </button>
                    ${profile.id !== 'default' ? 
                        `<button class="btn btn-text delete-profile-btn" data-id="${profile.id}">
                            Delete
                        </button>` : ''
                    }
                </div>
            </div>
        `;
    }

    setupManageProfilesEvents(modal) {
        // Close modal
        modal.querySelector('.close-modal').addEventListener('click', () => {
            modal.remove();
        });

        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });

        // Add profile button
        modal.querySelector('#add-profile-btn').addEventListener('click', () => {
            this.showAddProfileForm(modal);
        });

        // Switch profile
        modal.querySelectorAll('.switch-profile-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const profileId = btn.dataset.id;
                this.switchProfile(profileId);
                modal.remove();
            });
        });

        // Edit profile
        modal.querySelectorAll('.edit-profile-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const profileId = btn.dataset.id;
                this.showEditProfileForm(modal, profileId);
            });
        });

        // Delete profile
        modal.querySelectorAll('.delete-profile-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const profileId = btn.dataset.id;
                this.deleteProfile(profileId);
                modal.remove();
                this.showManageProfiles();
            });
        });
    }

    showAddProfileForm(modal) {
        const formHtml = `
            <div class="profile-form">
                <h4>Add New Profile</h4>
                <div class="form-group">
                    <label>Profile Name</label>
                    <input type="text" id="profile-name" placeholder="Enter profile name" maxlength="20">
                </div>
                <div class="form-group">
                    <label>Avatar</label>
                    <div class="avatar-selector">
                        ${['👤', '👨', '👩', '🧑', '👦', '👧', '🦸', '🧙', '🧛', '👽'].map(avatar => `
                            <button class="avatar-option" data-avatar="${avatar}">${avatar}</button>
                        `).join('')}
                    </div>
                </div>
                <div class="form-group">
                    <label>Color</label>
                    <div class="color-selector">
                        ${['#e50914', '#00b4d8', '#ff9e00', '#9d4edd', '#ff6d00', '#38b000', '#7209b7', '#f72585'].map(color => `
                            <button class="color-option" style="background: ${color}" data-color="${color}"></button>
                        `).join('')}
                    </div>
                </div>
                <div class="form-actions">
                    <button class="btn btn-secondary" id="cancel-add">Cancel</button>
                    <button class="btn btn-primary" id="save-profile">Save Profile</button>
                </div>
            </div>
        `;

        const modalBody = modal.querySelector('.modal-body');
        modalBody.innerHTML = formHtml;

        this.setupProfileFormEvents(modal, null);
    }

    showEditProfileForm(modal, profileId) {
        const profile = this.profiles.find(p => p.id === profileId);
        if (!profile) return;

        const formHtml = `
            <div class="profile-form">
                <h4>Edit Profile</h4>
                <div class="form-group">
                    <label>Profile Name</label>
                    <input type="text" id="profile-name" value="${profile.name}" maxlength="20">
                </div>
                <div class="form-group">
                    <label>Avatar</label>
                    <div class="avatar-selector">
                        ${['👤', '👨', '👩', '🧑', '👦', '👧', '🦸', '🧙', '🧛', '👽'].map(avatar => `
                            <button class="avatar-option ${avatar === profile.avatar ? 'selected' : ''}" 
                                    data-avatar="${avatar}">${avatar}</button>
                        `).join('')}
                    </div>
                </div>
                <div class="form-group">
                    <label>Color</label>
                    <div class="color-selector">
                        ${['#e50914', '#00b4d8', '#ff9e00', '#9d4edd', '#ff6d00', '#38b000', '#7209b7', '#f72585'].map(color => `
                            <button class="color-option ${color === profile.color ? 'selected' : ''}" 
                                    style="background: ${color}" data-color="${color}"></button>
                        `).join('')}
                    </div>
                </div>
                <div class="form-actions">
                    <button class="btn btn-secondary" id="cancel-edit">Cancel</button>
                    <button class="btn btn-primary" id="update-profile">Update Profile</button>
                </div>
            </div>
        `;

        const modalBody = modal.querySelector('.modal-body');
        modalBody.innerHTML = formHtml;

        this.setupProfileFormEvents(modal, profileId);
    }

    setupProfileFormEvents(modal, profileId) {
        // Avatar selection
        modal.querySelectorAll('.avatar-option').forEach(btn => {
            btn.addEventListener('click', () => {
                modal.querySelectorAll('.avatar-option').forEach(b => b.classList.remove('selected'));
                btn.classList.add('selected');
            });
        });

        // Color selection
        modal.querySelectorAll('.color-option').forEach(btn => {
            btn.addEventListener('click', () => {
                modal.querySelectorAll('.color-option').forEach(b => b.classList.remove('selected'));
                btn.classList.add('selected');
            });
        });

        // Cancel button
        const cancelBtn = modal.querySelector('#cancel-add') || modal.querySelector('#cancel-edit');
        cancelBtn.addEventListener('click', () => {
            modal.remove();
            this.showManageProfiles();
        });

        // Save/Update button
        const saveBtn = modal.querySelector('#save-profile') || modal.querySelector('#update-profile');
        saveBtn.addEventListener('click', () => {
            this.saveProfile(modal, profileId);
        });
    }

    saveProfile(modal, existingProfileId) {
        const nameInput = modal.querySelector('#profile-name');
        const name = nameInput.value.trim();
        
        if (!name) {
            this.showFormError('Please enter a profile name');
            return;
        }

        const selectedAvatar = modal.querySelector('.avatar-option.selected');
        const selectedColor = modal.querySelector('.color-option.selected');
        
        if (!selectedAvatar || !selectedColor) {
            this.showFormError('Please select avatar and color');
            return;
        }

        const avatar = selectedAvatar.dataset.avatar;
        const color = selectedColor.dataset.color;

        if (existingProfileId) {
            // Update existing profile
            const profileIndex = this.profiles.findIndex(p => p.id === existingProfileId);
            if (profileIndex !== -1) {
                this.profiles[profileIndex].name = name;
                this.profiles[profileIndex].avatar = avatar;
                this.profiles[profileIndex].color = color;
            }
        } else {
            // Create new profile
            const newProfile = {
                id: `profile_${Date.now()}`,
                name,
                avatar,
                color,
                preferences: {
                    autoPlay: true,
                    quality: 'auto',
                    subtitles: 'off',
                    notifications: true
                },
                watchHistory: [],
                myList: [],
                createdAt: Date.now()
            };
            
            this.profiles.push(newProfile);
        }

        this.saveProfiles();
        modal.remove();
        this.showManageProfiles();
    }

    deleteProfile(profileId) {
        if (profileId === 'default') return;
        
        // Don't delete current profile
        if (profileId === this.currentProfile.id) {
            this.currentProfile = this.profiles.find(p => p.id === 'default');
            localStorage.setItem('silvastream-current-profile', 'default');
        }
        
        this.profiles = this.profiles.filter(p => p.id !== profileId);
        this.saveProfiles();
        this.updateProfileSelector();
    }

    showFormError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'form-error';
        errorDiv.textContent = message;
        errorDiv.style.cssText = `
            background: var(--primary);
            color: white;
            padding: 0.8rem 1rem;
            border-radius: var(--border-radius);
            margin-bottom: 1rem;
        `;
        
        const form = document.querySelector('.profile-form');
        form?.prepend(errorDiv);
        
        setTimeout(() => errorDiv.remove(), 3000);
    }

    dispatchProfileChangeEvent() {
        const event = new CustomEvent('profileChanged', {
            detail: { profile: this.currentProfile }
        });
        document.dispatchEvent(event);
    }

    // Get current profile's watch history
    getWatchHistory() {
        return this.currentProfile.watchHistory || [];
    }

    // Add to current profile's watch history
    addToWatchHistory(item) {
        if (!this.currentProfile.watchHistory) {
            this.currentProfile.watchHistory = [];
        }
        
        // Remove if already exists
        this.currentProfile.watchHistory = this.currentProfile.watchHistory.filter(
            i => i.id !== item.id
        );
        
        // Add to beginning
        this.currentProfile.watchHistory.unshift({
            ...item,
            watchedAt: Date.now()
        });
        
        // Keep only last 100 items
        if (this.currentProfile.watchHistory.length > 100) {
            this.currentProfile.watchHistory = this.currentProfile.watchHistory.slice(0, 100);
        }
        
        this.saveProfiles();
    }

    // Get current profile's my list
    getMyList() {
        return this.currentProfile.myList || [];
    }

    // Add to current profile's my list
    addToMyList(item) {
        if (!this.currentProfile.myList) {
            this.currentProfile.myList = [];
        }
        
        // Check if already in list
        const exists = this.currentProfile.myList.some(i => i.id === item.id);
        if (!exists) {
            this.currentProfile.myList.push({
                ...item,
                addedAt: Date.now()
            });
            this.saveProfiles();
            return true;
        }
        return false;
    }

    // Remove from current profile's my list
    removeFromMyList(itemId) {
        if (!this.currentProfile.myList) return false;
        
        const initialLength = this.currentProfile.myList.length;
        this.currentProfile.myList = this.currentProfile.myList.filter(i => i.id !== itemId);
        
        if (this.currentProfile.myList.length !== initialLength) {
            this.saveProfiles();
            return true;
        }
        return false;
    }
}

// Initialize user profiles
let userProfiles;

document.addEventListener('DOMContentLoaded', () => {
    userProfiles = new UserProfiles();
});

// Make available globally
window.UserProfiles = UserProfiles;
window.userProfiles = userProfiles;
