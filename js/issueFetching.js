// Functionality for fetching issues from the backend

/**
 * Fetch all issues from backend
 */
async function loadAllIssuesFromBackend() {
    try {
        // Clear any existing issues first
        window.issues = [];
        
        // Show loading indicators
        showLoadingIndicators();
        
        // Get token from localStorage for authentication
        const token = localStorage.getItem('bup-token');
        const headers = {};
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        
        const res = await fetch('http://localhost:3000/api/issues', {
            headers: headers
        });
        
        if (!res.ok) {
            hideLoadingIndicators();
            showNotification(`Failed to load issues: ${res.status} ${res.statusText}`, 'error');
            return;
        }
        
        const data = await res.json();
        if (!Array.isArray(data)) {
            hideLoadingIndicators();
            showNotification('Failed to load issues from server - invalid data format', 'error');
            return;
        }
        
        console.log(`Loaded ${data.length} issues from database`);
        window.issues = data;
        
        // Update UI with fetched issues
        updateHomeIssuesList();
        
        // Update campus map with all issues
        if (typeof initializeCampusMap === 'function') {
            initializeCampusMap();
        } else if (typeof updateCampusMap === 'function') {
            updateCampusMap(window.issues);
        }
        
        // Update filter options based on user role
        if (typeof updateFilterOptionsForRole === 'function') {
            updateFilterOptionsForRole();
        }
        
        // Hide loading indicators
        hideLoadingIndicators();
        
        // Dispatch event to notify other components that issues were loaded
        window.dispatchEvent(new CustomEvent('issuesLoaded', { detail: { count: data.length } }));
    } catch (err) {
        hideLoadingIndicators();
        showNotification('Failed to load issues from server - network error', 'error');
        console.error('Error loading issues:', err);
    }
}

/**
 * Show loading indicators across the app
 */
function showLoadingIndicators() {
    const loadingIndicators = document.querySelectorAll('.loading-indicator');
    loadingIndicators.forEach(indicator => {
        indicator.style.display = 'flex';
    });
}

/**
 * Hide loading indicators across the app
 */
function hideLoadingIndicators() {
    const loadingIndicators = document.querySelectorAll('.loading-indicator');
    loadingIndicators.forEach(indicator => {
        indicator.style.display = 'none';
    });
}

// Initialize issue fetching when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Load issues from backend
    loadAllIssuesFromBackend();
    
    // Set up auto-refresh every 5 minutes (300000 ms)
    setInterval(loadAllIssuesFromBackend, 300000);
    
    // Set up filter event listeners
    setupFilterEventListeners();
});

// Setup event listeners for filtering
function setupFilterEventListeners() {
    // Add event listener for search input to filter in real-time
    const searchInput = document.getElementById('homeSearchInput');
    if (searchInput) {
        searchInput.addEventListener('input', filterHomeIssues);
    }
    
    // Add event listener for search button if it exists
    const searchButton = document.getElementById('homeSearchBtn');
    if (searchButton) {
        searchButton.addEventListener('click', filterHomeIssues);
    }
    
    // Add event listener for Enter key in search input
    if (searchInput) {
        searchInput.addEventListener('keypress', function(event) {
            if (event.key === 'Enter') {
                filterHomeIssues();
            }
        });
    }
    
    // Set up filter dropdown listeners
    const filters = ['homeStatusFilter', 'homeCategoryFilter', 'homeLocationFilter'];
    filters.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.addEventListener('change', filterHomeIssues);
        }
    });
}

// Make functions available globally
window.loadAllIssuesFromBackend = loadAllIssuesFromBackend;
