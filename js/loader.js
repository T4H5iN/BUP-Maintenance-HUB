// Script loader and dependency manager

// Keep track of loaded modules
const loadedModules = {
    utils: false,
    core: false,
    ui: false,
    darkMode: false,
    issues: false,
    map: false,
    auth: false,
    notifications: false,
    technician: false,
    analytics: false  // Add analytics module tracking
};

// Function to check if all required modules are loaded
function checkAllModulesLoaded() {
    const allLoaded = Object.values(loadedModules).every(loaded => loaded);

    if (allLoaded) {

        // Initialize the application
        if (typeof initializeApp === 'function') {

            // Remove loading screen if present
            const loadingScreen = document.getElementById('loading-screen');
            if (loadingScreen) {
                loadingScreen.classList.add('fade-out');
                setTimeout(() => {
                    loadingScreen.remove();
                }, 500);
            }

            // Call main initialization
            initializeApp();
        } else {
            console.error('initializeApp function not found');
        }
    }
}

// Register a module as loaded
function registerModuleLoaded(moduleName) {
    if (moduleName in loadedModules) {

        loadedModules[moduleName] = true;
        checkAllModulesLoaded();
    } else {
        console.warn(`Unknown module: ${moduleName}`);
    }
}

// Handle script loading errors
function handleScriptError(moduleName, error) {
    console.error(`Error loading module ${moduleName}:`, error);
    showNotification(`Failed to load ${moduleName} module. Please refresh the page.`, 'error');
}

// Make functions available globally
window.registerModuleLoaded = registerModuleLoaded;
window.handleScriptError = handleScriptError;
