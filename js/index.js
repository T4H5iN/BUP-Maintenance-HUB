document.addEventListener('DOMContentLoaded', function() {
    initializeDarkMode();
    initializeApp();
    setupEventListeners();
    
    // Add event listeners for tab clicks to ensure data is loaded
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', function(e) {
            const targetSection = this.getAttribute('href').substring(1);
            if (targetSection === 'reports') {
                // Ensure reports are initialized when tab is clicked
                setTimeout(() => {
                    if (typeof initializeReports === 'function') {
                        console.log('Initializing reports after tab click');
                        initializeReports();
                    }
                }, 100);
            }
        });
    });
    
    // Initialize reports functionality if available and reports section is active
    if (typeof initializeReports === 'function') {
        // Check if reports section is currently active
        if (document.getElementById('reports').classList.contains('active')) {
            console.log('Reports section is active on load, initializing reports');
            setTimeout(initializeReports, 300);
        }
        
        // Add a listener for the 'issuesLoaded' event
        window.addEventListener('issuesLoaded', function() {
            if (document.getElementById('reports').classList.contains('active')) {
                console.log('Issues loaded event received, initializing reports');
                setTimeout(initializeReports, 300);
            }
        });
    }
});

