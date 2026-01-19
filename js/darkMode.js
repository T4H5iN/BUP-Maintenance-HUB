// Dark mode functionality

function initializeDarkMode() {
    const savedTheme = localStorage.getItem('bup-theme-preference');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (savedTheme === 'dark' || (!savedTheme && systemPrefersDark)) {
        enableDarkMode(false); // Pass false to prevent notification on page load
    } else if (savedTheme === 'light') {
        disableDarkMode(false); // Pass false to prevent notification on page load
    } else {
        // System preference
        if (systemPrefersDark) {
            enableDarkMode(false);
        } else {
            disableDarkMode(false);
        }
    }
    
    // Listen for system preference changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        if (localStorage.getItem('bup-theme-preference') === 'system') {
            if (e.matches) {
                enableDarkMode(true);
            } else {
                disableDarkMode(true);
            }
        }
    });
}

// Make sure toggleDarkMode correctly handles the theme change
function toggleDarkMode() {
    if (isDarkMode) {
        disableDarkMode(true);
    } else {
        enableDarkMode(true);
    }
}

function enableDarkMode(showNotifications = true) {
    document.body.classList.add('dark-mode');
    isDarkMode = true;
    localStorage.setItem('bup-theme-preference', 'dark');
    updateDarkModeToggle();
    if (showNotifications) {
        showNotification('Dark mode enabled', 'success');
    }
}

function disableDarkMode(showNotifications = true) {
    document.body.classList.remove('dark-mode');
    isDarkMode = false;
    localStorage.setItem('bup-theme-preference', 'light');
    updateDarkModeToggle();
    if (showNotifications) {
        showNotification('Light mode enabled', 'success');
    }
}

function updateDarkModeToggle() {
    const toggle = document.getElementById('darkModeToggle');
    const icon = toggle.querySelector('i');
    
    if (isDarkMode) {
        icon.className = 'fas fa-sun';
        toggle.title = 'Switch to Light Mode';
        toggle.setAttribute('aria-label', 'Switch to Light Mode');
    } else {
        icon.className = 'fas fa-moon';
        toggle.title = 'Switch to Dark Mode';
        toggle.setAttribute('aria-label', 'Switch to Dark Mode');
    }
}

// Make functions available globally
window.initializeDarkMode = initializeDarkMode;
window.toggleDarkMode = toggleDarkMode;
window.enableDarkMode = enableDarkMode;
window.disableDarkMode = disableDarkMode;
window.updateDarkModeToggle = updateDarkModeToggle;
