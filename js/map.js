// Campus map and building-related functionality

/**
 * Initialize the campus map with actual issue data
 * This should be called when the app starts and whenever issues are updated
 */
function initializeCampusMap() {
    // Ensure issues data is available
    if (!window.issues || !Array.isArray(window.issues)) {
        console.error("Issues data not available for map initialization");
        return;
    }



    // Update the map with all issues
    updateCampusMap(window.issues);

    // Add click event listeners to all buildings
    document.querySelectorAll('.building').forEach(building => {
        // Remove any existing click listeners to avoid duplicates
        building.removeEventListener('click', handleBuildingClick);
        // Add fresh click listener
        building.addEventListener('click', handleBuildingClick);
    });

    // Set up map filter
    const mapFilter = document.getElementById('mapFilter');
    if (mapFilter) {
        mapFilter.removeEventListener('change', filterMapIssues);
        mapFilter.addEventListener('change', filterMapIssues);
    }
}

/**
 * Handle building click event
 * @param {Event} e - The click event
 */
function handleBuildingClick(e) {
    e.preventDefault();  // Prevent default action
    const building = e.currentTarget;
    const buildingId = building.dataset.building;
    const buildingName = building.querySelector('.building-label').textContent;
    const issueCount = building.querySelector('.issue-count')?.textContent || '0';



    showBuildingDetails(buildingName, issueCount, buildingId);
}

/**
 * Filter issues on the map based on selected filter
 */
function filterMapIssues() {
    const filter = document.getElementById('mapFilter').value;


    // Filter issues based on the selected criteria
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
    updateCampusMap(filteredIssues);

    // Show notification about the filter
    showNotification(`Showing ${filter} issues on the campus map`, 'info');
}

/**
 * Update the campus map with the filtered issues
 * @param {Array} filteredIssues - Array of issues to display on the map
 */
function updateCampusMap(filteredIssues) {
    // Filter out pending-review issues for non-admin/mod users (students, faculty, technicians)
    if (currentUser &&
        (currentUser.role === 'student' ||
            currentUser.role === 'faculty' ||
            currentUser.role === 'technician')) {
        filteredIssues = filteredIssues.filter(issue => issue.status !== 'pending-review');
    }

    // Filter out rejected issues for all users
    filteredIssues = filteredIssues.filter(issue => issue.status !== 'rejected');

    // The comprehensive mapping between HTML data-building attributes and database location values
    const locationMapping = {
        'academic': ['academic-building', 'academic'],
        'fbs': ['fbs-building', 'fbs'],
        'admin': ['admin-building', 'admin'],
        'library': ['library'],
        'annex': ['annex'],
        'vista': ['vista-cafeteria', 'vista'],
        'amitte': ['amitte-cafeteria', 'amitte'],
        'third-place': ['third-place-cafeteria', 'third-place'],
        'daycare': ['day-care-center', 'daycare'],
        'staff-canteen': ['staff-canteen']
    };

    // Create the reverse mapping from database values to HTML data-building attributes
    const reverseMapping = {};
    Object.entries(locationMapping).forEach(([buildingId, locationValues]) => {
        locationValues.forEach(location => {
            reverseMapping[location] = buildingId;
        });
    });

    // Group issues by location using the reverse mapping
    const issuesByLocation = {};

    filteredIssues.forEach(issue => {
        const location = issue.location;
        const buildingId = reverseMapping[location] || location;

        if (!issuesByLocation[buildingId]) {
            issuesByLocation[buildingId] = [];
        }
        issuesByLocation[buildingId].push(issue);
    });



    // Update each building on the map
    document.querySelectorAll('.building').forEach(building => {
        const buildingId = building.dataset.building;


        const issueCountElement = building.querySelector('.issue-count');
        if (!issueCountElement) {

            return;
        }

        // If we have issues for this building
        if (issuesByLocation[buildingId] && issuesByLocation[buildingId].length > 0) {
            const buildingIssues = issuesByLocation[buildingId];
            const issueCount = buildingIssues.length;



            // Find highest priority
            let highestPriority = 'low';
            const priorityRank = { 'urgent': 4, 'high': 3, 'medium': 2, 'low': 1 };

            buildingIssues.forEach(issue => {
                if (priorityRank[issue.priority] > priorityRank[highestPriority]) {
                    highestPriority = issue.priority;
                }
            });

            // Update count and class
            issueCountElement.textContent = issueCount;

            // Remove existing priority classes
            ['low', 'medium', 'high', 'urgent'].forEach(priority => {
                issueCountElement.classList.remove(priority);
            });

            // Add appropriate priority class
            issueCountElement.classList.add(highestPriority);

            // Make building visible
            building.style.display = 'flex';
        } else {
            // No issues for this building with current filter
            if (document.getElementById('mapFilter').value !== 'all') {
                // Hide building if we're filtering and it has no matching issues
                building.style.display = 'none';
            } else {
                // Show building with zero count if we're showing all
                issueCountElement.textContent = '0';

                // Remove priority classes and add low
                ['low', 'medium', 'high', 'urgent'].forEach(priority => {
                    issueCountElement.classList.remove(priority);
                });
                issueCountElement.classList.add('low');
                building.style.display = 'flex';
            }
        }
    });
}

/**
 * Show building details and related issues in a modal
 * @param {string} buildingName - Display name of the building
 * @param {string} issueCount - Number of issues for this building
 * @param {string} buildingId - Data attribute ID of the building
 */
function showBuildingDetails(buildingName, issueCount, buildingId) {
    // Create a mapping between HTML data-building attributes and database location values
    const locationMapping = {
        'academic': ['academic-building', 'academic'],
        'fbs': ['fbs-building', 'fbs'],
        'admin': ['admin-building', 'admin'],
        'library': ['library'],
        'annex': ['annex'],
        'vista': ['vista-cafeteria', 'vista'],
        'amitte': ['amitte-cafeteria', 'amitte'],
        'third-place': ['third-place-cafeteria', 'third-place'],
        'daycare': ['day-care-center', 'daycare'],
        'staff-canteen': ['staff-canteen']
    };

    // Get all possible location values for this building
    const locationValues = locationMapping[buildingId] || [buildingId];

    // Get issues for this building
    let buildingIssues = (window.issues || []).filter(issue =>
        locationValues.includes(issue.location)
    );

    // Filter out pending-review issues for non-admin/mod users (students, faculty, technicians)
    if (currentUser &&
        (currentUser.role === 'student' ||
            currentUser.role === 'faculty' ||
            currentUser.role === 'technician')) {
        buildingIssues = buildingIssues.filter(issue => issue.status !== 'pending-review');
    }

    // Filter out rejected issues for all users
    buildingIssues = buildingIssues.filter(issue => issue.status !== 'rejected');



    // Sort issues by priority (highest first) and then by submission date (newest first)
    buildingIssues.sort((a, b) => {
        // Priority ranking: urgent > high > medium > low
        const priorityRank = { 'urgent': 4, 'high': 3, 'medium': 2, 'low': 1 };
        const priorityDiff = (priorityRank[b.priority] || 0) - (priorityRank[a.priority] || 0);

        if (priorityDiff !== 0) return priorityDiff;

        // Then sort by date (newest first)
        return new Date(b.submittedDate || 0) - new Date(a.submittedDate || 0);
    });

    // Create modal for displaying building details
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.id = 'buildingDetailsModal';

    // Count issues by priority
    const priorityCounts = {
        urgent: buildingIssues.filter(i => i.priority === 'urgent').length,
        high: buildingIssues.filter(i => i.priority === 'high').length,
        medium: buildingIssues.filter(i => i.priority === 'medium').length,
        low: buildingIssues.filter(i => i.priority === 'low').length
    };

    // Count issues by status
    const statusCounts = {
        'pending-review': buildingIssues.filter(i => i.status === 'pending-review').length,
        'assigned': buildingIssues.filter(i => i.status === 'assigned').length,
        'in-progress': buildingIssues.filter(i => i.status === 'in-progress').length,
        'resolved': buildingIssues.filter(i => i.status === 'resolved').length,
        'rejected': buildingIssues.filter(i => i.status === 'rejected').length
    };

    // Create issue breakdown
    let issueBreakdown = '';
    if (priorityCounts.urgent > 0) {
        issueBreakdown += `<div class="priority-count urgent">${priorityCounts.urgent} Urgent</div>`;
    }
    if (priorityCounts.high > 0) {
        issueBreakdown += `<div class="priority-count high">${priorityCounts.high} High</div>`;
    }
    if (priorityCounts.medium > 0) {
        issueBreakdown += `<div class="priority-count medium">${priorityCounts.medium} Medium</div>`;
    }
    if (priorityCounts.low > 0) {
        issueBreakdown += `<div class="priority-count low">${priorityCounts.low} Low</div>`;
    }

    // Create status breakdown
    let statusBreakdown = '';
    if (statusCounts['pending-review'] > 0) {
        statusBreakdown += `<div class="status-count pending-review">${statusCounts['pending-review']} Pending Review</div>`;
    }
    if (statusCounts['assigned'] > 0) {
        statusBreakdown += `<div class="status-count assigned">${statusCounts['assigned']} Assigned</div>`;
    }
    if (statusCounts['in-progress'] > 0) {
        statusBreakdown += `<div class="status-count in-progress">${statusCounts['in-progress']} In Progress</div>`;
    }
    if (statusCounts['resolved'] > 0) {
        statusBreakdown += `<div class="status-count resolved">${statusCounts['resolved']} Resolved</div>`;
    }
    if (statusCounts['rejected'] > 0) {
        statusBreakdown += `<div class="status-count rejected">${statusCounts['rejected']} Rejected</div>`;
    }

    // Generate issue cards for this building
    let issueCards = '';

    if (buildingIssues.length === 0) {
        issueCards = '<div class="no-issues-container"><p class="no-issues">No issues reported for this building.</p></div>';
    } else {
        issueCards = '<div class="building-issues-grid">';

        buildingIssues.forEach(issue => {
            // Format date for display
            const submittedDate = issue.submittedDate ?
                new Date(issue.submittedDate).toLocaleDateString() : 'Unknown';

            // Get status icon
            const statusIcon = typeof getStatusIcon === 'function' ?
                getStatusIcon(issue.status) : 'fas fa-info-circle';

            issueCards += `
                <div class="building-issue-card ${issue.priority}">
                    <div class="building-issue-header">
                        <div class="issue-id-container">
                            <span class="issue-id">#${issue.issueId || issue.id}</span>
                            <span class="issue-date">${submittedDate}</span>
                        </div>
                        <div class="issue-badges">
                            <span class="issue-priority ${issue.priority}">${issue.priority}</span>
                            <span class="issue-status ${issue.status}">
                                <i class="${statusIcon}"></i>
                                ${formatStatus(issue.status)}
                            </span>
                        </div>
                    </div>
                    
                    <div class="building-issue-content">
                        <h4 class="issue-title">${formatCategoryName(issue.category)} Issue - ${issue.specificLocation}</h4>
                        <p class="issue-description">${issue.description}</p>
                    </div>
                    
                    <div class="building-issue-footer">
                        <div class="issue-meta">
                            <span class="issue-submitter"><i class="fas fa-user"></i> ${issue.submittedBy || issue.submitterName || 'Anonymous'}</span>
                        </div>
                        <button class="btn-primary btn-sm" onclick="viewIssueDetails('${issue.issueId || issue.id}')">
                            View Details
                        </button>
                    </div>
                </div>
            `;
        });

        issueCards += '</div>';
    }

    modal.innerHTML = `
        <div class="modal-content building-details-modal">
            <span class="close" onclick="closeBuildingDetailsModal()">&times;</span>
            <div class="building-details-header">
                <h2>${buildingName}</h2>
                <div class="building-stats">
                    <div class="stat-badge">
                        <i class="fas fa-exclamation-circle"></i>
                        <span>${buildingIssues.length} Issues</span>
                    </div>
                </div>
            </div>
            
            <div class="building-summary">
                <div class="summary-section">
                    <h4>Issues by Priority</h4>
                    <div class="priority-breakdown">
                        ${issueBreakdown || '<p>No active issues</p>'}
                    </div>
                </div>
                
                <div class="summary-section">
                    <h4>Issues by Status</h4>
                    <div class="status-breakdown">
                        ${statusBreakdown || '<p>No active issues</p>'}
                    </div>
                </div>
            </div>
            
            <h3 class="building-issues-title">All Issues</h3>
            <div class="building-issues-list">
                ${issueCards}
            </div>
            
            <div class="building-details-actions">
                <button class="btn-primary" onclick="reportIssueForBuilding('${buildingId}')">
                    <i class="fas fa-plus-circle"></i> Report New Issue
                </button>
                <button class="btn-secondary" onclick="closeBuildingDetailsModal()">
                    Close
                </button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
    modal.style.display = 'block';
}

/**
 * Navigate to report issue form and pre-select the building
 * @param {string} buildingId - Building ID to pre-select
 */
function reportIssueForBuilding(buildingId) {
    closeBuildingDetailsModal();

    // Scroll to the report form
    document.getElementById('home').classList.add('active');
    document.getElementById('map').classList.remove('active');

    // Update nav links
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });
    document.querySelector('[href="#home"]').classList.add('active');

    // Set the location dropdown
    document.getElementById('location').value = buildingId;

    // Scroll to the form
    document.querySelector('.quick-report').scrollIntoView({ behavior: 'smooth' });

    // Update current section
    currentSection = 'home';
}

/**
 * Initialize the map when the DOM is loaded
 */
document.addEventListener('DOMContentLoaded', function () {
    // When issues are loaded, initialize the map
    window.addEventListener('issuesLoaded', function () {

        initializeCampusMap();
    });

    // If issues are already loaded, initialize the map now
    if (window.issues && Array.isArray(window.issues) && window.issues.length > 0) {

        initializeCampusMap();
    }
});

// Make functions available globally
window.handleBuildingClick = handleBuildingClick;
window.filterMapIssues = filterMapIssues;
window.updateCampusMap = updateCampusMap;
window.showBuildingDetails = showBuildingDetails;
window.reportIssueForBuilding = reportIssueForBuilding;
window.initializeCampusMap = initializeCampusMap;
