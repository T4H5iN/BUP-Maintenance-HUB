let isDarkMode = false;

class ThemeManager {
    constructor() {
        this.currentTheme = 'system';
        this.themes = {
            light: 'Light Mode',
            dark: 'Dark Mode',
            system: 'System Preference'
        };
        this.init();
    }

    init() {
        this.loadUserPreference();
        this.setupSystemListener();
        this.createThemeSelector();
    }

    loadUserPreference() {
        const savedTheme = localStorage.getItem('bup-theme-preference');
        if (savedTheme && this.themes[savedTheme]) {
            this.currentTheme = savedTheme;
        }
        this.applyTheme();
    }

    applyTheme() {
        const body = document.body;
        
        switch (this.currentTheme) {
            case 'dark':
                body.classList.add('dark-mode');
                isDarkMode = true;
                break;
            case 'light':
                body.classList.remove('dark-mode');
                isDarkMode = false;
                break;
            case 'system':
                const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                if (prefersDark) {
                    body.classList.add('dark-mode');
                    isDarkMode = true;
                } else {
                    body.classList.remove('dark-mode');
                    isDarkMode = false;
                }
                break;
        }
        
        this.updateToggleButton();
        this.savePreference();
    }

    setTheme(theme) {
        if (this.themes[theme]) {
            this.currentTheme = theme;
            this.applyTheme();
            this.notifyThemeChange();
        }
    }

    setupSystemListener() {
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
            if (this.currentTheme === 'system') {
                this.applyTheme();
            }
        });
    }

    savePreference() {
        localStorage.setItem('bup-theme-preference', this.currentTheme);
    }

    updateToggleButton() {
        const toggle = document.getElementById('darkModeToggle') || 
                       document.getElementById('themeToggle');
        if (!toggle) return;

        const icon = toggle.querySelector('i');
        if (!icon) return;
        
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

    createThemeSelector() {
        const selector = document.createElement('select');
        selector.id = 'themeSelector';
        selector.className = 'theme-selector';
        selector.setAttribute('aria-label', 'Select theme preference');
        
        Object.entries(this.themes).forEach(([key, value]) => {
            const option = document.createElement('option');
            option.value = key;
            option.textContent = value;
            option.selected = key === this.currentTheme;
            selector.appendChild(option);
        });
        
        selector.addEventListener('change', (e) => {
            this.setTheme(e.target.value);
        });
        
        this.themeSelector = selector;
    }

    notifyThemeChange() {
        const themeName = this.themes[this.currentTheme];
        if (typeof showNotification === 'function') {
            showNotification(`Theme changed to ${themeName}`, 'success');
        }
        
        window.dispatchEvent(new CustomEvent('themeChanged', {
            detail: {
                theme: this.currentTheme,
                isDark: isDarkMode
            }
        }));
    }

    getCurrentTheme() {
        return this.currentTheme;
    }

    isDarkMode() {
        return isDarkMode;
    }

    exportThemeSettings() {
        return {
            theme: this.currentTheme,
            isDark: isDarkMode,
            timestamp: new Date().toISOString()
        };
    }

    importThemeSettings(settings) {
        if (settings && settings.theme && this.themes[settings.theme]) {
            this.setTheme(settings.theme);
            return true;
        }
        return false;
    }
}

const themeManager = new ThemeManager();

function toggleDarkMode() {
    const currentTheme = themeManager.getCurrentTheme();
    
    if (currentTheme === 'system') {
        const newTheme = isDarkMode ? 'light' : 'dark';
        themeManager.setTheme(newTheme);
    } else if (currentTheme === 'light') {
        themeManager.setTheme('dark');
    } else {
        themeManager.setTheme('light');
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = ThemeManager;
}
