/**
 * Dashboard management functionality
 */

// Dashboard stats and metrics
let dashboardStats = {
    totalSubmitted: 0,
    pending: 0,
    inProgress: 0,
    resolved: 0,
    avgRating: 0
};

/**
 * Initialize the dashboard with real data
 */
function initializeDashboard() {
    console.log("Initializing dashboard...");
    
    // Update dashboard stats based on actual issues data
    updateDashboardStats();
    
    // Setup dashboard filters
    setupDashboardFilters();
    
    // Load user's issues if authenticated
    if (currentUser) {
        loadUserIssues();
    } else {
        showLoginPrompt();
    }
}

/**
 * Calculate and update dashboard statistics based on real data
 */
function updateDashboardStats() {
    if (!window.issues || !Array.isArray(window.issues)) {
        console.warn("No issues data available for dashboard stats");
        return;
    }
    
    const allIssues = window.issues;
    console.log(`Total issues in system: ${allIssues.length}`);
    
    // Calculate user-specific stats if user is logged in
    if (currentUser) {
        // Improved user issue detection by checking multiple fields
        const userIssues = allIssues.filter(issue => {
            // Check submitterEmail first (most reliable)
            if (issue.submitterEmail && currentUser.email) {
                const match = issue.submitterEmail.toLowerCase() === currentUser.email.toLowerCase();
                if (match) return true;
            }
            
            // Check submittedBy against email and name
            if (issue.submittedBy) {
                if (currentUser.email && issue.submittedBy.toLowerCase() === currentUser.email.toLowerCase()) {
                    return true;
                }
                if (currentUser.name && issue.submittedBy.toLowerCase() === currentUser.name.toLowerCase()) {
                    return true;
                }
            }
            
            // Check submitterName against name
            if (issue.submitterName && currentUser.name) {
                return issue.submitterName.toLowerCase() === currentUser.name.toLowerCase();
            }
            
            return false;
        });
        
        console.log(`Found ${userIssues.length} issues for user ${currentUser.email || currentUser.name}`);
        
        // Update dashboard stats with counts
        dashboardStats.totalSubmitted = userIssues.length;
        
        // Count pending issues (both pending-review and assigned statuses)
        const pendingIssues = userIssues.filter(issue => 
            issue.status === 'pending-review' || issue.status === 'assigned'
        );
        dashboardStats.pending = pendingIssues.length;
        console.log(`Pending issues: ${dashboardStats.pending}`);
        
        // Count in-progress issues
        const inProgressIssues = userIssues.filter(issue => 
            issue.status === 'in-progress'
        );
        dashboardStats.inProgress = inProgressIssues.length;
        console.log(`In-progress issues: ${dashboardStats.inProgress}`);
        
        // Count resolved issues
        const resolvedIssues = userIssues.filter(issue => 
            issue.status === 'resolved'
        );
        dashboardStats.resolved = resolvedIssues.length;
        console.log(`Resolved issues: ${dashboardStats.resolved}`);
        
        // Calculate average rating if available
        const ratedIssues = userIssues.filter(issue => issue.rating);
        if (ratedIssues.length > 0) {
            const totalRating = ratedIssues.reduce((sum, issue) => sum + issue.rating, 0);
            dashboardStats.avgRating = (totalRating / ratedIssues.length).toFixed(1);
        } else {
            dashboardStats.avgRating = "N/A";
        }
    } else {
        // Reset stats if no user is logged in
        dashboardStats.totalSubmitted = 0;
        dashboardStats.pending = 0;
        dashboardStats.inProgress = 0;
        dashboardStats.resolved = 0;
        dashboardStats.avgRating = "N/A";
    }
    
    // Update the dashboard UI with the calculated stats
    updateDashboardUI();
}

/**
 * Update the dashboard UI elements with calculated stats
 */
function updateDashboardUI() {
    console.log("Updating dashboard UI with stats:", dashboardStats);
    
    // Update stat cards in the user dashboard
    document.querySelectorAll('#user-dashboard .stat-card').forEach(statCard => {
        // Get the label element to determine which stat to show
        const labelElement = statCard.querySelector('.stat-label');
        if (!labelElement) return;
        
        const statType = labelElement.textContent.trim().toLowerCase();
        const numberElement = statCard.querySelector('.stat-number');
        if (!numberElement) return;
        
        // Update the appropriate stat based on the label text
        if (statType.includes('total') || statType.includes('submitted')) {
            numberElement.textContent = dashboardStats.totalSubmitted;
        } else if (statType.includes('pending')) {
            numberElement.textContent = dashboardStats.pending;
        } else if (statType.includes('progress')) {
            numberElement.textContent = dashboardStats.inProgress;
        } else if (statType.includes('resolved') || statType.includes('completed')) {
            numberElement.textContent = dashboardStats.resolved;
        } else if (statType.includes('rating')) {
            numberElement.textContent = dashboardStats.avgRating;
        }
    });
}

/**
 * Load and display user's issues in the dashboard
 */
function loadUserIssues() {
    if (!window.issues || !Array.isArray(window.issues) || !currentUser) {
        console.warn("Cannot load user issues - missing data");
        showNoIssuesMessage("No issues could be loaded. Please try again later.");
        return;
    }
    
    // Filter issues by the current user's email or name
    const userIssues = window.issues.filter(issue => {
        // Match by email first (most reliable)
        if (issue.submitterEmail && currentUser.email) {
            return issue.submitterEmail.toLowerCase() === currentUser.email.toLowerCase();
        }
        
        // If email doesn't match, try matching by name
        if ((issue.submittedBy && currentUser.name) || 
            (issue.submitterName && currentUser.name)) {
            const issueName = (issue.submittedBy || issue.submitterName || '').toLowerCase();
            const userName = currentUser.name.toLowerCase();
            return issueName.includes(userName) || userName.includes(issueName);
        }
        
        return false;
    });
    
    console.log(`Found ${userIssues.length} issues for user ${currentUser.email || currentUser.name}`);
    
    // Sort issues by date (newest first)
    userIssues.sort((a, b) => new Date(b.submittedDate || 0) - new Date(a.submittedDate || 0));
    
    // Get the issues list container
    const issuesListContainer = document.querySelector('#user-dashboard .issues-list');
    if (!issuesListContainer) {
        console.warn("Issues list container not found in dashboard");
        return;
    }
    
    // Clear existing content
    issuesListContainer.innerHTML = '';
    
    // Check if we have any issues
    if (userIssues.length === 0) {
        showNoIssuesMessage("You haven't submitted any issues yet.");
        return;
    }
    
    // Create and append issue cards
    userIssues.forEach(issue => {
        const issueCard = createIssueCard(issue);
        issuesListContainer.appendChild(issueCard);
    });
}

/**
 * Show a "no issues" message with appropriate actions
 * @param {string} message - The message to display
 */
function showNoIssuesMessage(message) {
    const issuesListContainer = document.querySelector('#user-dashboard .issues-list');
    if (!issuesListContainer) return;
    
    issuesListContainer.innerHTML = `
        <div class="no-issues-message">
            <i class="fas fa-clipboard-list"></i>
            <p>${message}</p>
            <button class="btn-primary" onclick="scrollToReportForm()">
                <i class="fas fa-plus-circle"></i> Report an Issue
            </button>
        </div>
    `;
}

/**
 * Show a login prompt if user is not authenticated
 */
function showLoginPrompt() {
    const issuesListContainer = document.querySelector('#user-dashboard .issues-list');
    if (!issuesListContainer) return;
    
    issuesListContainer.innerHTML = `
        <div class="no-issues-message">
            <i class="fas fa-user-lock"></i>
            <p>Please log in to view your submitted issues.</p>
            <button class="btn-primary" onclick="showLoginModal()">
                <i class="fas fa-sign-in-alt"></i> Log In
            </button>
        </div>
    `;
}

/**
 * Create an issue card element for the dashboard
 * @param {Object} issue - The issue data
 * @returns {HTMLElement} - The created issue card
 */
function createIssueCard(issue) {
    // Create a container for the issue card
    const card = document.createElement('div');
    card.className = 'issue-card';
    card.dataset.issueId = issue.issueId || issue.id;
    
    // Format date for display
    const submittedDate = issue.submittedDate ? 
        new Date(issue.submittedDate).toLocaleDateString() : 'Unknown';
    
    // Get status icon
    const statusIcon = typeof getStatusIcon === 'function' ? 
        getStatusIcon(issue.status) : 'fas fa-info-circle';
    
    // Prepare action buttons based on issue status
    let actionButtons = `
        <button class="btn-secondary" onclick="viewIssueDetails('${issue.issueId || issue.id}')">
            View Details
        </button>
    `;
    
    // Add feedback button for resolved issues
    if (issue.status === 'resolved' && !issue.rating) {
        actionButtons += `
            <button class="btn-primary" onclick="provideFeedback('${issue.issueId || issue.id}')">
                Provide Feedback
            </button>
        `;
    }
    
    // Add rating display for issues that have been rated
    let ratingDisplay = '';
    if (issue.status === 'resolved' && issue.rating) {
        const filledStars = issue.rating;
        const emptyStars = 5 - filledStars;
        
        ratingDisplay = `
            <div class="rating">
                <span>Your Rating:</span>
                <div class="stars">
                    ${Array(filledStars).fill('<i class="fas fa-star"></i>').join('')}
                    ${Array(emptyStars).fill('<i class="far fa-star"></i>').join('')}
                </div>
            </div>
        `;
    }
    
    // Build the card HTML
    card.innerHTML = `
        <div class="issue-header">
            <span class="issue-id">#${issue.issueId || issue.id}</span>
            <div class="issue-badges">
                <span class="issue-status ${issue.status}">
                    <i class="${statusIcon}"></i>
                    ${formatStatus(issue.status)}
                </span>
                <span class="issue-priority ${issue.priority}">${issue.priority}</span>
            </div>
        </div>
        <h4>${formatCategoryName(issue.category)} Issue - ${issue.specificLocation}</h4>
        <div class="issue-details">
            <span><i class="fas fa-map-marker-alt"></i> ${formatLocationName(issue.location)}</span>
            <span><i class="fas fa-calendar"></i> Submitted: ${submittedDate}</span>
            <span><i class="fas fa-tag"></i> ${formatCategoryName(issue.category)}</span>
        </div>
        <p>${issue.description}</p>
        <div class="issue-actions">
            ${actionButtons}
            ${ratingDisplay}
        </div>
    `;
    
    return card;
}

/**
 * Set up dashboard filter functionality
 */
function setupDashboardFilters() {
    // Status filter
    const statusFilter = document.getElementById('statusFilter');
    if (statusFilter) {
        statusFilter.addEventListener('change', filterUserIssues);
    }
    
    // Category filter
    const categoryFilter = document.getElementById('categoryFilter');
    if (categoryFilter) {
        categoryFilter.addEventListener('change', filterUserIssues);
    }
    
    // Date filter
    const dateFilter = document.getElementById('dateFilter');
    if (dateFilter) {
        // Remove any existing min attribute to ensure past dates can be selected
        dateFilter.removeAttribute('min');
        dateFilter.addEventListener('change', filterUserIssues);
    }
}

/**
 * Filter user issues based on selected criteria
 */
function filterUserIssues() {
    if (!window.issues || !Array.isArray(window.issues) || !currentUser) {
        console.warn("Cannot filter user issues - missing data");
        return;
    }
    
    // Get filter values
    const statusFilter = document.getElementById('statusFilter').value;
    const categoryFilter = document.getElementById('categoryFilter').value;
    const dateFilter = document.getElementById('dateFilter').value;
    
    // Filter issues by the current user
    let filteredIssues = window.issues.filter(issue => {
        // Match by email first (most reliable)
        if (issue.submitterEmail && currentUser.email) {
            return issue.submitterEmail.toLowerCase() === currentUser.email.toLowerCase();
        }
        
        // If email doesn't match, try matching by name
        if ((issue.submittedBy && currentUser.name) || 
            (issue.submitterName && currentUser.name)) {
            const issueName = (issue.submittedBy || issue.submitterName || '').toLowerCase();
            const userName = currentUser.name.toLowerCase();
            return issueName.includes(userName) || userName.includes(issueName);
        }
        
        return false;
    });
    
    // Apply status filter
    if (statusFilter !== 'all') {
        filteredIssues = filteredIssues.filter(issue => {
            if (statusFilter === 'pending') {
                return issue.status === 'pending-review' || issue.status === 'assigned';
            } else if (statusFilter === 'in-progress') {
                return issue.status === 'in-progress';
            } else if (statusFilter === 'resolved') {
                return issue.status === 'resolved';
            }
            return true;
        });
    }
    
    // Apply category filter
    if (categoryFilter !== 'all') {
        filteredIssues = filteredIssues.filter(issue => issue.category === categoryFilter);
    }
    
    // Apply date filter
    if (dateFilter) {
        const filterDate = new Date(dateFilter);
        filteredIssues = filteredIssues.filter(issue => {
            if (!issue.submittedDate) return false;
            const issueDate = new Date(issue.submittedDate);
            return issueDate.toDateString() === filterDate.toDateString();
        });
    }
    
    // Sort filtered issues by date (newest first)
    filteredIssues.sort((a, b) => new Date(b.submittedDate || 0) - new Date(a.submittedDate || 0));
    
    // Update the issues list
    const issuesListContainer = document.querySelector('#user-dashboard .issues-list');
    if (!issuesListContainer) return;
    
    // Clear existing content
    issuesListContainer.innerHTML = '';
    
    // Check if we have any issues after filtering
    if (filteredIssues.length === 0) {
        issuesListContainer.innerHTML = `
            <div class="no-issues-message">
                <i class="fas fa-filter"></i>
                <p>No issues match your selected filters.</p>
                <button class="btn-secondary" onclick="resetFilters()">
                    Reset Filters
                </button>
            </div>
        `;
        return;
    }
    
    // Create and append filtered issue cards
    filteredIssues.forEach(issue => {
        const issueCard = createIssueCard(issue);
        issuesListContainer.appendChild(issueCard);
    });
}

/**
 * Reset all dashboard filters
 */
function resetFilters() {
    document.getElementById('statusFilter').value = 'all';
    document.getElementById('categoryFilter').value = 'all';
    
    // Clear the date filter value instead of setting min date
    const dateFilter = document.getElementById('dateFilter');
    if (dateFilter) {
        dateFilter.value = '';
    }
    
    // Reload user issues without filters
    loadUserIssues();
}

/**
 * Helper function to scroll to the report form
 */
function scrollToReportForm() {
    // Switch to home section
    showSection('home');
    
    // Scroll to quick-report form
    const reportForm = document.querySelector('.quick-report');
    if (reportForm) {
        reportForm.scrollIntoView({ behavior: 'smooth' });
    }
}

/**
 * Format location name for display
 */
function formatLocationName(location) {
    if (!location) return 'Unknown';
    
    const locationMap = {
        'academic': 'Academic Building',
        'academic-building': 'Academic Building',
        'fbs': 'FBS Building',
        'fbs-building': 'FBS Building',
        'admin': 'Admin Building',
        'admin-building': 'Admin Building',
        'library': 'Library',
        'annex': 'Annex',
        'vista': 'Vista Cafeteria',
        'vista-cafeteria': 'Vista Cafeteria',
        'amitte': 'Amitte Cafeteria',
        'amitte-cafeteria': 'Amitte Cafeteria',
        'third-place': 'Third Place Cafeteria',
        'third-place-cafeteria': 'Third Place Cafeteria',
        'daycare': 'Day Care Center',
        'day-care-center': 'Day Care Center',
        'staff-canteen': 'Staff Canteen'
    };
    
    return locationMap[location] || location.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log("DOM loaded - setting up dashboard listeners");
    
    // Add a listener for the issues loaded event
    window.addEventListener('issuesLoaded', function() {
        console.log('Issues loaded event received - initializing dashboard...');
        initializeDashboard();
    });
    
    // If issues are already loaded, initialize the dashboard now
    if (window.issues && Array.isArray(window.issues) && window.issues.length > 0) {
        console.log(`Issues already available (${window.issues.length}) - initializing dashboard immediately`);
        initializeDashboard();
    }
    
    // Listen for auth changes
    window.addEventListener('authStateChanged', function(e) {
        console.log('Auth state changed - updating dashboard');
        if (e.detail && e.detail.user) {
            // User just logged in, update dashboard
            currentUser = e.detail.user;
            initializeDashboard();
        } else {
            // User logged out, show login prompt
            currentUser = null;
            showLoginPrompt();
        }
    });
    
    // Listen for tab changes to update dashboard
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            if (this.textContent.trim().toLowerCase().includes('issues')) {
                updateDashboardStats();
                loadUserIssues();
            }
        });
    });
});

// Export functions for global use
window.updateDashboardStats = updateDashboardStats;
window.loadUserIssues = loadUserIssues;
window.filterUserIssues = filterUserIssues;
window.resetFilters = resetFilters;
window.scrollToReportForm = scrollToReportForm;
