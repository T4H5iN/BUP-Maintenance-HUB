// Core variables and initialization

let currentUser = null;
let currentSection = 'home';
let issues = [];
let isDarkMode = false;

function initializeApp() {
    updateNavigation();
    
    showSection('home');
    
    const today = new Date().toISOString().split('T')[0];
    const dateInputs = document.querySelectorAll('input[type="date"]');
    dateInputs.forEach(input => {
        if (input.id === 'reportStartDate') {
            const lastMonth = new Date();
            lastMonth.setMonth(lastMonth.getMonth() - 1);
            input.value = lastMonth.toISOString().split('T')[0];
        } else if (input.id === 'reportEndDate') {
            input.value = today;
        } else {
            input.min = today;
        }
    });
    
    // Remove this line:
    // updateHomeIssuesList();
    // Instead, rely on issues.js to load issues from the backend
}

function setupEventListeners() {
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const section = link.getAttribute('href').substring(1);
            showSection(section);
        });
    });

    document.getElementById('loginForm').addEventListener('submit', handleLogin);
    document.getElementById('registerForm').addEventListener('submit', handleRegistration);
    document.getElementById('issueForm').addEventListener('submit', handleIssueSubmission);
    document.getElementById('scheduleForm').addEventListener('submit', handleScheduleSubmission);

    document.getElementById('imageUpload').addEventListener('change', handleImageUpload);

    document.querySelectorAll('.building').forEach(building => {
        building.addEventListener('click', handleBuildingClick);
    });

    document.querySelectorAll('.stars i').forEach((star, index) => {
        star.addEventListener('click', () => handleRating(index + 1));
    });

    document.querySelector('.mobile-menu-toggle').addEventListener('click', toggleMobileMenu);

    document.querySelector('.notification-close').addEventListener('click', closeNotification);

    // Fix theme toggle listener - use direct function reference
    const darkModeToggle = document.getElementById('darkModeToggle');
    if (darkModeToggle) {
        darkModeToggle.removeEventListener('click', toggleDarkMode);
        darkModeToggle.addEventListener('click', toggleDarkMode);
    }

    document.getElementById('mapFilter').addEventListener('change', filterMapIssues);
    document.getElementById('statusFilter').addEventListener('change', filterUserIssues);
    document.getElementById('categoryFilter').addEventListener('change', filterUserIssues);
    document.getElementById('dateFilter').addEventListener('change', filterUserIssues);

    // Add event listeners for home page issues filters
    document.getElementById('homeStatusFilter').addEventListener('change', filterHomeIssues);
    document.getElementById('homeCategoryFilter').addEventListener('change', filterHomeIssues);
    document.getElementById('homeLocationFilter').addEventListener('change', filterHomeIssues);

    // Fix filter event listeners by ensuring they're properly attached
    const homeStatusFilter = document.getElementById('homeStatusFilter');
    const homeCategoryFilter = document.getElementById('homeCategoryFilter');
    const homeLocationFilter = document.getElementById('homeLocationFilter');
    const homeSearchInput = document.getElementById('homeSearchInput');
    
    if (homeStatusFilter) {
        homeStatusFilter.addEventListener('change', function() {
            if (typeof filterHomeIssues === 'function') {
                filterHomeIssues();
            }
        });
    }
    
    if (homeCategoryFilter) {
        homeCategoryFilter.addEventListener('change', function() {
            if (typeof filterHomeIssues === 'function') {
                filterHomeIssues();
            }
        });
    }
    
    if (homeLocationFilter) {
        homeLocationFilter.addEventListener('change', function() {
            if (typeof filterHomeIssues === 'function') {
                filterHomeIssues();
            }
        });
    }
    
    if (homeSearchInput) {
        homeSearchInput.addEventListener('input', function() {
            if (typeof filterHomeIssues === 'function') {
                filterHomeIssues();
            }
        });
    }
}

function updateNavigation() {
    // Update navigation based on user state
}

function toggleMobileMenu() {
    const navLinks = document.querySelector('.nav-links');
    navLinks.classList.toggle('mobile-active');
}

// Add this stub to avoid ReferenceError if not implemented elsewhere
function filterUserIssues() {
    // You can implement actual filtering logic here if needed
}

function filterMapIssues() {
    const filter = document.getElementById('mapFilter').value;
    console.log("Filter applied:", filter);  // Debug
    
    // Filter issues based on the selected criteria - use window.issues
    let filteredIssues = [];
    
    if (filter === 'all') {
        filteredIssues = window.issues || [];
    } else if (filter === 'urgent') {
        filteredIssues = (window.issues || []).filter(issue => issue.priority === 'urgent');
    } else if (filter === 'high') {
        filteredIssues = (window.issues || []).filter(issue => issue.priority === 'high');
    } else if (filter === 'pending') {
        filteredIssues = (window.issues || []).filter(issue => 
            issue.status === 'pending-review' || issue.status === 'assigned'
        );
    } else if (filter === 'resolved') {
        filteredIssues = (window.issues || []).filter(issue => issue.status === 'resolved');
    }
    
    console.log("Filtered issues:", filteredIssues.length);  // Debug
    
    // Update the campus map with filtered issues
    if (typeof updateCampusMap === 'function') {
        updateCampusMap(filteredIssues);
    }
    
    // Show notification about the filter
    showNotification(`Showing ${filter} issues on the campus map`, 'info');
}

// Additional DOM listener for when all scripts are loaded
document.addEventListener('DOMContentLoaded', function() {
    // Re-add building click listeners to ensure they work
    document.querySelectorAll('.building').forEach(building => {
        // Remove any existing listeners first to avoid duplicates
        building.removeEventListener('click', handleBuildingClick);
        // Add the click listener
        building.addEventListener('click', handleBuildingClick);
    });
    
    // Ensure map filter works
    const mapFilter = document.getElementById('mapFilter');
    if (mapFilter) {
        mapFilter.removeEventListener('change', filterMapIssues);
        mapFilter.addEventListener('change', filterMapIssues);
    }
    
    // Explicitly setup the home issues filter event listeners again to ensure they work
    const filters = ['homeStatusFilter', 'homeCategoryFilter', 'homeLocationFilter'];
    filters.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.addEventListener('change', function() {
                console.log('Filter changed:', id);
                if (window.filterHomeIssues) {
                    window.filterHomeIssues();
                }
            });
        }
    });
    
    // Also setup search input
    const searchInput = document.getElementById('homeSearchInput');
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            console.log('Search input changed');
            if (window.filterHomeIssues) {
                window.filterHomeIssues();
            }
        });
    }
});
