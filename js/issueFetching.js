// Functionality for fetching issues from the backend

/**
 * Fetch all issues from backend
 */
async function loadAllIssuesFromBackend() {
    try {
        const res = await fetch('http://localhost:3000/api/issues');
        if (!res.ok) {
            showNotification(`Failed to load issues: ${res.status} ${res.statusText}`, 'error');
            return;
        }
        const data = await res.json();
        if (!Array.isArray(data)) {
            showNotification('Failed to load issues from server - invalid data format', 'error');
            return;
        }
        window.issues = data;
        
        // Update UI with fetched issues
        updateHomeIssuesList();
        
        // Update campus map with all issues
        if (typeof initializeCampusMap === 'function') {
            initializeCampusMap();
        } else if (typeof updateCampusMap === 'function') {
            updateCampusMap(window.issues);
        }
        
        // Dispatch event to notify other components that issues were loaded
        window.dispatchEvent(new CustomEvent('issuesLoaded'));
    } catch (err) {
        showNotification('Failed to load issues from server - network error', 'error');
        console.error('Error loading issues:', err);
    }
}

// Initialize issue fetching when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    loadAllIssuesFromBackend();
    
    // Set up event listeners for issue filtering
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
