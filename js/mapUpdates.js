/**
 * Campus Map Dynamic Updates
 * Updates the campus map issue counts based on actual issues data
 */

/**
 * Update campus map building issue counts based on actual issues data
 */
function updateCampusMapCounts() {
    const issues = window.issues || [];

    // Count issues by location
    const locationCounts = {};
    const locationPriorities = {};

    issues.forEach(issue => {
        // Skip resolved issues
        if (issue.status === 'resolved') return;

        const location = normalizeLocationForMap(issue.location);
        if (!location) return;

        // Increment count
        locationCounts[location] = (locationCounts[location] || 0) + 1;

        // Track highest priority for this location
        const priorityOrder = { 'urgent': 4, 'high': 3, 'medium': 2, 'low': 1 };
        const currentPriority = priorityOrder[issue.priority] || 0;
        const existingPriority = priorityOrder[locationPriorities[location]] || 0;

        if (currentPriority > existingPriority) {
            locationPriorities[location] = issue.priority;
        }
    });

    // Update all building issue count elements
    document.querySelectorAll('.building .issue-count').forEach(countElement => {
        const location = countElement.dataset.location;
        const count = locationCounts[location] || 0;
        const priority = locationPriorities[location] || 'low';

        // Update count
        countElement.textContent = count;

        // Update priority class
        countElement.className = 'issue-count';
        if (count > 0) {
            countElement.classList.add(priority);
        }

        // Hide if no issues
        countElement.style.display = count > 0 ? 'flex' : 'none';
    });
}

/**
 * Normalize location string to match map data attributes
 */
function normalizeLocationForMap(location) {
    if (!location) return null;

    const locationMap = {
        'academic-building': 'academic',
        'academic': 'academic',
        'fbs-building': 'fbs',
        'fbs': 'fbs',
        'admin-building': 'admin',
        'admin': 'admin',
        'library': 'library',
        'annex': 'annex',
        'vista-cafeteria': 'vista',
        'vista': 'vista',
        'amitte-cafeteria': 'amitte',
        'amitte': 'amitte',
        'third-place-cafeteria': 'third-place',
        'third-place': 'third-place',
        'staff-canteen': 'staff-canteen',
        'day-care-center': 'daycare',
        'daycare': 'daycare',
        'fst-building': 'fst-building',
        'fass-building': 'fass-building',
        'library-building': 'library-building',
        'bup-hall': 'bup-hall',
        'male-common-room': 'academic',
        'female-common-room': 'academic'
    };

    return locationMap[location.toLowerCase()] || null;
}

/**
 * Update the admin panel overview statistics
 */
function updateAdminPanelStats() {
    const issues = window.issues || [];

    // Calculate stats
    const totalIssues = issues.length;
    const resolvedIssues = issues.filter(i => i.status === 'resolved').length;
    const resolutionRate = totalIssues > 0 ? Math.round((resolvedIssues / totalIssues) * 100) : 0;

    // Find overdue issues (older than 7 days and not resolved)
    const now = new Date();
    const overdueIssues = issues.filter(issue => {
        if (issue.status === 'resolved') return false;
        const submitted = new Date(issue.submittedDate);
        const daysDiff = Math.floor((now - submitted) / (1000 * 60 * 60 * 24));
        return daysDiff > 7;
    });

    // Calculate average resolution time
    const resolvedWithDates = issues.filter(i =>
        i.status === 'resolved' && i.submittedDate && i.resolvedDate
    );
    let avgResolutionTime = 'N/A';
    if (resolvedWithDates.length > 0) {
        const totalDays = resolvedWithDates.reduce((sum, issue) => {
            const submitted = new Date(issue.submittedDate);
            const resolved = new Date(issue.resolvedDate);
            return sum + Math.max(0, (resolved - submitted) / (1000 * 60 * 60 * 24));
        }, 0);
        avgResolutionTime = (totalDays / resolvedWithDates.length).toFixed(1) + ' days';
    }

    // Update UI elements
    const totalEl = document.getElementById('admin-total-issues');
    const overdueEl = document.getElementById('admin-overdue-issues');
    const rateEl = document.getElementById('admin-resolution-rate');
    const timeEl = document.getElementById('admin-avg-time');

    if (totalEl) totalEl.textContent = totalIssues;
    if (overdueEl) overdueEl.textContent = overdueIssues.length;
    if (rateEl) rateEl.textContent = resolutionRate + '%';
    if (timeEl) timeEl.textContent = avgResolutionTime;

    // Update overdue alerts list
    updateOverdueAlertsList(overdueIssues);
}

/**
 * Update the overdue alerts list in admin panel
 */
function updateOverdueAlertsList(overdueIssues) {
    const alertsList = document.getElementById('overdue-alerts-list');
    if (!alertsList) return;

    if (overdueIssues.length === 0) {
        alertsList.innerHTML = `
            <div class="no-alerts-message">
                <i class="fas fa-check-circle"></i>
                <p>No overdue issues. All issues are being handled on time!</p>
            </div>
        `;
        return;
    }

    // Sort by oldest first
    overdueIssues.sort((a, b) => new Date(a.submittedDate) - new Date(b.submittedDate));

    // Show max 5 alerts
    const displayIssues = overdueIssues.slice(0, 5);

    alertsList.innerHTML = displayIssues.map(issue => {
        const submitted = new Date(issue.submittedDate);
        const daysAgo = Math.floor((new Date() - submitted) / (1000 * 60 * 60 * 24));
        const priorityClass = issue.priority === 'urgent' ? 'urgent' :
            issue.priority === 'high' ? 'high' : '';

        return `
            <div class="alert-item ${priorityClass}">
                <div class="alert-content">
                    <h5>#${issue.issueId || issue.id} - ${formatCategoryName(issue.category)}</h5>
                    <p>Submitted: ${submitted.toLocaleDateString()} (${daysAgo} days ago)</p>
                    <p>Status: ${formatStatus(issue.status)}</p>
                </div>
                <button class="btn-warning" onclick="viewIssueDetails('${issue.issueId || issue.id}')">
                    View Details
                </button>
            </div>
        `;
    }).join('');
}

/**
 * Update technician panel stats
 */
function updateTechnicianStats() {
    if (!currentUser || currentUser.role !== 'technician') return;

    const issues = window.issues || [];

    // Filter issues assigned to this technician
    const techIssues = issues.filter(issue =>
        issue.assignedTo === currentUser.name ||
        issue.assignedTo === currentUser.email
    );

    const assigned = techIssues.filter(i => i.status === 'assigned').length;
    const inProgress = techIssues.filter(i => i.status === 'in-progress').length;

    // Count completed this week
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const completedThisWeek = techIssues.filter(i => {
        if (i.status !== 'resolved') return false;
        const resolved = new Date(i.resolvedDate);
        return resolved >= oneWeekAgo;
    }).length;

    // Update UI
    const assignedEl = document.getElementById('tech-assigned-count');
    const progressEl = document.getElementById('tech-progress-count');
    const completedEl = document.getElementById('tech-completed-count');

    if (assignedEl) assignedEl.textContent = assigned + inProgress;
    if (progressEl) progressEl.textContent = inProgress;
    if (completedEl) completedEl.textContent = completedThisWeek;
}

// Initialize when issues are loaded
window.addEventListener('issuesLoaded', function () {
    updateCampusMapCounts();
    updateAdminPanelStats();
    updateTechnicianStats();
});

// Also update when DOM is ready if issues already loaded
document.addEventListener('DOMContentLoaded', function () {
    if (window.issues && window.issues.length > 0) {
        setTimeout(() => {
            updateCampusMapCounts();
            updateAdminPanelStats();
            updateTechnicianStats();
        }, 500);
    }
});

// Make functions globally available
window.updateCampusMapCounts = updateCampusMapCounts;
window.updateAdminPanelStats = updateAdminPanelStats;
window.updateTechnicianStats = updateTechnicianStats;
