// Core variables and initialization

let currentUser = null;
let currentSection = 'home';
let issues = [];
let isDarkMode = false;

// Check if running on file protocol
if (window.location.protocol === 'file:') {
    alert('Warning: You are opening this file directly. Features like Login and API calls will NOT work. Please use "npm start" and access via http://localhost:5000');
    console.warn('Running via file protocol - APIs will fail');
}

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
        } else if (input.id === 'dateFilter') {
            // Don't set min date for dashboard filter - allows filtering by past dates

        } else {
            // Only set min date for other inputs (like scheduling future maintenance)
            input.min = today;
        }
    });

    // Remove this line:
    // updateHomeIssuesList();
    // Instead, rely on issues.js to load issues from the backend
}

function setupEventListeners() {
    // Use the dedicated function for nav links
    if (typeof setupNavigationEvents === 'function') {
        setupNavigationEvents();
    } else {
        // Fallback to the original approach
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', function (e) {
                e.preventDefault();
                const section = this.getAttribute('href').substring(1);

                showSection(section);
            });
        });
    }

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
        homeStatusFilter.addEventListener('change', function () {
            if (typeof filterHomeIssues === 'function') {
                filterHomeIssues();
            }
        });
    }

    if (homeCategoryFilter) {
        homeCategoryFilter.addEventListener('change', function () {
            if (typeof filterHomeIssues === 'function') {
                filterHomeIssues();
            }
        });
    }

    if (homeLocationFilter) {
        homeLocationFilter.addEventListener('change', function () {
            if (typeof filterHomeIssues === 'function') {
                filterHomeIssues();
            }
        });
    }

    if (homeSearchInput) {
        homeSearchInput.addEventListener('input', function () {
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

    // Close menu when a link is clicked
    if (navLinks.classList.contains('mobile-active')) {
        const links = navLinks.querySelectorAll('a');
        links.forEach(link => {
            link.addEventListener('click', () => {
                navLinks.classList.remove('mobile-active');
            }, { once: true });
        });
    }
}

// Add this stub to avoid ReferenceError if not implemented elsewhere
function filterUserIssues() {
    // You can implement actual filtering logic here if needed
}

function filterMapIssues() {
    const filter = document.getElementById('mapFilter').value;


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



    // Update the campus map with filtered issues
    if (typeof updateCampusMap === 'function') {
        updateCampusMap(filteredIssues);
    }

    // Show notification about the filter
    showNotification(`Showing ${filter} issues on the campus map`, 'info');
}

// Check authentication from localStorage and update UI
function checkAuthentication() {
    const token = localStorage.getItem('bup-token');
    const savedUser = localStorage.getItem('bup-current-user');

    if (token && savedUser) {
        try {
            // Parse the user data
            currentUser = JSON.parse(savedUser);

            // Update UI based on user's role (which is now determined by the backend)
            updateUIForLoggedInUser();
            return true;
        } catch (e) {
            console.error('Error parsing user data:', e);
            // Clear invalid data
            localStorage.removeItem('bup-token');
            localStorage.removeItem('bup-current-user');
        }
    }

    // Not authenticated
    return false;
}

// Update UI elements based on logged in user
function updateUIForLoggedInUser() {
    if (!currentUser) return;

    // Update login button to show user info
    const loginBtn = document.querySelector('.login-btn');
    if (loginBtn) {
        loginBtn.innerHTML = `<i class="fas fa-user-circle"></i> ${currentUser.name || currentUser.email.split('@')[0]}`;
        loginBtn.onclick = showUserMenu;
    }

    // Show role-specific tabs based on the role determined by the backend
    if (currentUser.role === 'moderator') {
        document.getElementById('moderatorTab').style.display = 'block';
    } else if (currentUser.role === 'administrator') {
        document.getElementById('administratorTab').style.display = 'block';
    } else if (currentUser.role === 'technician') {
        document.getElementById('technicianTab').style.display = 'block';
    }

    // Update filter options based on role
    if (typeof updateFilterOptionsForRole === 'function') {
        updateFilterOptionsForRole();
    }

    // Update navigation options based on role
    updateNavigation();

    // Dispatch auth state changed event
    window.dispatchEvent(new CustomEvent('authStateChanged', {
        detail: { user: currentUser }
    }));
}

// Additional DOM listener for when all scripts are loaded
document.addEventListener('DOMContentLoaded', function () {
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

    // Re-setup navigation event listeners
    if (typeof setupNavigationEvents === 'function') {
        setupNavigationEvents();
    }

    // Explicitly setup the home issues filter event listeners again to ensure they work
    const filters = ['homeStatusFilter', 'homeCategoryFilter', 'homeLocationFilter'];
    filters.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.addEventListener('change', function () {

                if (window.filterHomeIssues) {
                    window.filterHomeIssues();
                }
            });
        }
    });

    // Also setup search input
    const searchInput = document.getElementById('homeSearchInput');
    if (searchInput) {
        searchInput.addEventListener('input', function () {

            if (window.filterHomeIssues) {
                window.filterHomeIssues();
            }
        });
    }
});
