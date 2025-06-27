// Authentication and user management

async function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const role = document.getElementById('userRole').value;

    try {
        const res = await fetch('http://localhost:5500/api/users/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        const data = await res.json();
        if (!res.ok) {
            showNotification(data.message || 'Login failed', 'error');
            return;
        }
        // Save token and user info
        localStorage.setItem('bup-token', data.token);
        localStorage.setItem('bup-current-user', JSON.stringify(data.user));
        currentUser = data.user;
        showNotification(`Welcome back, ${currentUser.email}!`, 'success');
        closeLoginModal();
        updateUIForLoggedInUser();
    } catch (err) {
        showNotification('Login error', 'error');
    }
}

async function handleRegistration(e) {
    e.preventDefault();
    // You may want to collect dept from a select input
    const email = document.getElementById('regEmail').value;
    const password = document.getElementById('regPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const role = document.getElementById('regRole').value;
    const dept = document.getElementById('department') ? document.getElementById('department').value : '';

    if (password !== confirmPassword) {
        showNotification('Passwords do not match', 'error');
        return;
    }

    try {
        const res = await fetch('/api/users', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password, role, dept })
        });
        const data = await res.json();
        if (!res.ok) {
            showNotification(data.message || 'Registration failed', 'error');
            return;
        }
        showNotification('Registration successful! Please login.', 'success');
        closeRegisterModal();
        showLoginModal();
    } catch (err) {
        showNotification('Registration error', 'error');
    }
}

/**
 * Update UI elements based on logged in user
 */
function updateUIForLoggedInUser() {
    if (!currentUser) return;
    
    // Update login button to show user info
    const loginBtn = document.querySelector('.login-btn');
    if (loginBtn) {
        loginBtn.innerHTML = `
            <i class="fas fa-user-circle"></i>
            ${currentUser.name || currentUser.email}
        `;
        loginBtn.onclick = showUserMenu;
    }
    
    // Show role-specific tabs
    if (currentUser.role === 'admin') {
        document.getElementById('adminTab').style.display = 'block';
    } else if (currentUser.role === 'authority') {
        document.getElementById('authorityTab').style.display = 'block';
    } else if (currentUser.role === 'technician') {
        document.getElementById('technicianTab').style.display = 'block';
    }
    
    // Dispatch auth state changed event
    window.dispatchEvent(new CustomEvent('authStateChanged', { 
        detail: { user: currentUser } 
    }));
}

function showUserMenu() {
    // Remove any existing dropdown
    const existingDropdown = document.querySelector('.user-dropdown');
    if (existingDropdown) {
        existingDropdown.remove();
        return;
    }

    // Create dropdown menu
    const dropdown = document.createElement('div');
    dropdown.className = 'user-dropdown';
    
    // Get the name from user object, fallback to email if no name
    const displayName = currentUser.name || currentUser.email.split('@')[0];
    
    dropdown.innerHTML = `
        <div class="user-dropdown-header">
            <div class="user-avatar">
                <i class="fas fa-user-circle"></i>
            </div>
            <div class="user-info">
                <span class="user-name">${displayName}</span>
                <span class="user-role">${currentUser.role}</span>
                <span class="user-email">${currentUser.email}</span>
            </div>
        </div>
        <div class="user-dropdown-divider"></div>
        <div class="user-dropdown-menu">
            <a href="#" onclick="showProfile(); closeUserMenu();">
                <i class="fas fa-user"></i>
                <span>My Profile</span>
            </a>
            <a href="#" onclick="showSettings(); closeUserMenu();">
                <i class="fas fa-cog"></i>
                <span>Settings</span>
            </a>
            <a href="#" onclick="showNotifications(); closeUserMenu();">
                <i class="fas fa-bell"></i>
                <span>Notifications</span>
                <span class="notification-badge">3</span>
            </a>
            <a href="#" onclick="showMyIssues(); closeUserMenu();">
                <i class="fas fa-list"></i>
                <span>My Issues</span>
            </a>
            <div class="user-dropdown-divider"></div>
            <a href="#" onclick="showHelp(); closeUserMenu();">
                <i class="fas fa-question-circle"></i>
                <span>Help & Support</span>
            </a>
            <a href="#" onclick="logout(); closeUserMenu();" class="logout-link">
                <i class="fas fa-sign-out-alt"></i>
                <span>Logout</span>
            </a>
        </div>
    `;

    // Position dropdown relative to user menu button
    const userMenu = document.querySelector('.user-menu');
    userMenu.style.position = 'relative';
    userMenu.appendChild(dropdown);

    // Close dropdown when clicking outside
    setTimeout(() => {
        document.addEventListener('click', handleOutsideClick);
    }, 10);
}

function closeUserMenu() {
    const dropdown = document.querySelector('.user-dropdown');
    if (dropdown) {
        dropdown.remove();
        document.removeEventListener('click', handleOutsideClick);
    }
}

function handleOutsideClick(event) {
    const dropdown = document.querySelector('.user-dropdown');
    const userMenu = document.querySelector('.user-menu');
    
    if (dropdown && !userMenu.contains(event.target)) {
        closeUserMenu();
    }
}

function showProfile() {
    if (!currentUser) return;
    
    const profileModal = createProfileModal();
    document.body.appendChild(profileModal);
    profileModal.style.display = 'block';
}

function createProfileModal() {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.id = 'profileModal';
    
    // Get the name from user object, fallback to email if no name
    const displayName = currentUser.name || currentUser.email.split('@')[0];
    
    modal.innerHTML = `
        <div class="modal-content profile-modal">
            <span class="close" onclick="closeProfileModal()">&times;</span>
            <h2>User Profile</h2>
            <div class="profile-content">
                <div class="profile-avatar">
                    <i class="fas fa-user-circle"></i>
                    <button class="btn-secondary change-avatar-btn">Change Avatar</button>
                </div>
                <div class="profile-info">
                    <div class="form-group">
                        <label>Full Name</label>
                        <input type="text" id="profileName" value="${displayName}" readonly>
                        <button class="edit-btn" onclick="toggleEdit('profileName')">
                            <i class="fas fa-edit"></i>
                        </button>
                    </div>
                    <div class="form-group">
                        <label>Email</label>
                        <input type="email" id="profileEmail" value="${currentUser.email}" readonly>
                    </div>
                    <div class="form-group">
                        <label>Role</label>
                        <input type="text" id="profileRole" value="${currentUser.role}" readonly>
                    </div>
                    <div class="form-group">
                        <label>Department</label>
                        <input type="text" id="profileDepartment" value="${currentUser.department || 'Not specified'}" readonly>
                        <button class="edit-btn" onclick="toggleEdit('profileDepartment')">
                            <i class="fas fa-edit"></i>
                        </button>
                    </div>
                    <div class="form-group">
                        <label>Phone Number</label>
                        <input type="tel" id="profilePhone" value="${currentUser.phone || ''}" placeholder="Add phone number" readonly>
                        <button class="edit-btn" onclick="toggleEdit('profilePhone')">
                            <i class="fas fa-edit"></i>
                        </button>
                    </div>
                </div>
            </div>
            <div class="profile-actions">
                <button class="btn-primary" onclick="saveProfile()">Save Changes</button>
                <button class="btn-secondary" onclick="closeProfileModal()">Cancel</button>
            </div>
        </div>
    `;
    return modal;
}

function toggleEdit(fieldId) {
    const field = document.getElementById(fieldId);
    const isReadonly = field.hasAttribute('readonly');
    
    if (isReadonly) {
        field.removeAttribute('readonly');
        field.focus();
        field.style.borderColor = 'var(--primary-color)';
    } else {
        field.setAttribute('readonly', true);
        field.style.borderColor = 'var(--gray-200)';
    }
}

function saveProfile() {
    const updatedData = {
        name: document.getElementById('profileName').value,
        department: document.getElementById('profileDepartment').value,
        phone: document.getElementById('profilePhone').value
    };
    
    // Update current user object
    Object.assign(currentUser, updatedData);
    
    // Update localStorage
    localStorage.setItem('bup-current-user', JSON.stringify(currentUser));
    
    // Update UI
    updateUIForLoggedInUser();
    
    showNotification('Profile updated successfully!', 'success');
    closeProfileModal();
}

function showSettings() {
    const settingsModal = createSettingsModal();
    document.body.appendChild(settingsModal);
    settingsModal.style.display = 'block';
}

function createSettingsModal() {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.id = 'settingsModal';
    modal.innerHTML = `
        <div class="modal-content settings-modal">
            <span class="close" onclick="closeSettingsModal()">&times;</span>
            <h2>Settings</h2>
            <div class="settings-content">
                <div class="settings-section">
                    <h3>Theme Preferences</h3>
                    <div class="setting-item">
                        <label>Theme Mode</label>
                        <div class="theme-options">
                            <label class="radio-option">
                                <input type="radio" name="theme" value="light" ${!isDarkMode ? 'checked' : ''}>
                                <span>Light Mode</span>
                            </label>
                            <label class="radio-option">
                                <input type="radio" name="theme" value="dark" ${isDarkMode ? 'checked' : ''}>
                                <span>Dark Mode</span>
                            </label>
                            <label class="radio-option">
                                <input type="radio" name="theme" value="system">
                                <span>System Default</span>
                            </label>
                        </div>
                    </div>
                </div>
                
                <div class="settings-section">
                    <h3>Notification Preferences</h3>
                    <div class="setting-item">
                        <label class="checkbox-setting">
                            <input type="checkbox" checked>
                            <span>Email notifications for issue updates</span>
                        </label>
                    </div>
                    <div class="setting-item">
                        <label class="checkbox-setting">
                            <input type="checkbox" checked>
                            <span>SMS notifications for urgent issues</span>
                        </label>
                    </div>
                    <div class="setting-item">
                        <label class="checkbox-setting">
                            <input type="checkbox">
                            <span>Weekly summary reports</span>
                        </label>
                    </div>
                </div>
                
                <div class="settings-section">
                    <h3>Privacy & Security</h3>
                    <div class="setting-item">
                        <button class="btn-secondary" onclick="changePassword()">Change Password</button>
                    </div>
                    <div class="setting-item">
                        <button class="btn-secondary" onclick="downloadData()">Download My Data</button>
                    </div>
                </div>
            </div>
            <div class="settings-actions">
                <button class="btn-primary" onclick="saveSettings()">Save Settings</button>
                <button class="btn-secondary" onclick="closeSettingsModal()">Cancel</button>
            </div>
        </div>
    `;
    return modal;
}

function saveSettings() {
    const selectedTheme = document.querySelector('input[name="theme"]:checked').value;
    
    if (selectedTheme === 'dark') {
        enableDarkMode();
    } else if (selectedTheme === 'light') {
        disableDarkMode();
    }
    
    showNotification('Settings saved successfully!', 'success');
    closeSettingsModal();
}

// Add this function to fix logout functionality
function logout() {
    try {
        // Clear user data
        currentUser = null;
        localStorage.removeItem('bup-current-user');
        
        // Show notification if available
        if (typeof showNotification === 'function') {
            showNotification('Logged out successfully', 'success');
        } else {
            console.log('Logged out successfully');
        }
        
        // Close user menu
        if (typeof closeUserMenu === 'function') {
            closeUserMenu();
        }
        
        // Reset UI elements that depend on logged-in state
        resetUIAfterLogout();
        
        // Redirect to login page after a short delay
        setTimeout(() => {
            window.location.href = 'auth.html';
        }, 1000);
    } catch (error) {
        console.error('Error during logout:', error);
        // Fallback redirect if there's an error
        window.location.href = 'auth.html';
    }
}

/**
 * Handle logout
 */
function handleLogout() {
    currentUser = null;
    localStorage.removeItem('bup-current-user');
    localStorage.removeItem('bup-token');
    
    // Show notification
    showNotification('You have been logged out successfully', 'success');
    
    // Dispatch auth state changed event
    window.dispatchEvent(new CustomEvent('authStateChanged', { 
        detail: { user: null } 
    }));
    
    // Redirect to login page after a short delay
    setTimeout(() => {
        window.location.href = 'auth.html';
    }, 1000);
}

// Helper function to reset UI elements after logout
function resetUIAfterLogout() {
    // Reset login button
    const loginBtn = document.querySelector('.login-btn');
    if (loginBtn) {
        loginBtn.innerHTML = '<i class="fas fa-user"></i> Login';
        loginBtn.onclick = showLoginModal;
    }
    
    // Hide role-specific tabs
    const roleTabs = ['adminTab', 'authorityTab', 'technicianTab'];
    roleTabs.forEach(tabId => {
        const tab = document.getElementById(tabId);
        if (tab) {
            tab.style.display = 'none';
        }
    });
}

// Make these functions available globally
window.handleLogin = handleLogin;
window.handleRegistration = handleRegistration;
window.updateUIForLoggedInUser = updateUIForLoggedInUser;
window.showUserMenu = showUserMenu;
window.closeUserMenu = closeUserMenu;
window.handleOutsideClick = handleOutsideClick;
window.showProfile = showProfile;
window.createProfileModal = createProfileModal;
window.toggleEdit = toggleEdit;
window.saveProfile = saveProfile;
window.showSettings = showSettings;
window.createSettingsModal = createSettingsModal;
window.saveSettings = saveSettings;
window.logout = logout;
window.resetUIAfterLogout = resetUIAfterLogout;
