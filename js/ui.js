// UI management functions

function showSection(sectionName) {
    console.log(`Showing section: ${sectionName}`);
    
    // Validate section exists before trying to show it
    const targetSection = document.getElementById(sectionName);
    if (!targetSection) {
        console.error(`Section with ID "${sectionName}" does not exist`);
        return;
    }

    document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active');
    });

    targetSection.classList.add('active');

    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });

    // Use try-catch to handle case where the matching link doesn't exist
    try {
        document.querySelector(`[href="#${sectionName}"]`).classList.add('active');
    } catch (e) {
        console.warn(`No navigation link found for section: ${sectionName}`);
    }

    currentSection = sectionName;

    if (sectionName === 'dashboard') {
        // updateDashboard(); // <-- Remove this line
        if (typeof updateDashboardStats === 'function') {
            updateDashboardStats();
        }
    } else if (sectionName === 'reports') {
        // Check if user has permission to view reports
        if (currentUser) {
            const hasFullAccess = currentUser.role === 'administrator' || currentUser.role === 'moderator';
            const hasTechnicianAccess = currentUser.role === 'technician';

            // Adapt reports section based on role
            customizeReportsForRole(hasFullAccess, hasTechnicianAccess);
        } else {
            // No user logged in, redirect to home
            document.getElementById('home').classList.add('active');
            document.getElementById('reports').classList.remove('active');
            document.querySelector('[href="#home"]').classList.add('active');
            document.querySelector('[href="#reports"]').classList.remove('active');
            currentSection = 'home';
            return;
        }

        updateReports();
    }
}

function updateReports() {
    // First trigger reports initialization if function exists
    if (typeof initializeReports === 'function') {
        console.log('Initializing reports from updateReports function');
        initializeReports();
    }

    // Initialize analytics and charts if analyticsManager exists
    if (typeof analyticsManager !== 'undefined') {
        try {
            // Make sure analytics is initialized
            if (typeof analyticsManager.initializeAnalytics === 'function') {
                analyticsManager.initializeAnalytics();
            }

            // Generate charts - wrap in try-catch to handle Chart.js loading errors
            try {
                analyticsManager.generateTrendsChart();
                if (!document.getElementById('categoryChart')) {
                    analyticsManager.generateCategoryChart();
                }
            } catch (error) {
                console.error('Error generating charts:', error);
                showNotification('There was an error loading charts. Some report features may be limited.', 'warning');
            }
        } catch (error) {
            console.error('Analytics manager error:', error);
        }
    } else {
        console.error('Analytics manager not available');
    }
}

function showTab(tabName) {
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });

    document.getElementById(tabName).classList.add('active');

    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });

    event.target.classList.add('active');
}

function showLoginModal() {
    closeRegisterModal();
    document.getElementById('loginModal').style.display = 'block';
}

function closeLoginModal() {
    document.getElementById('loginModal').style.display = 'none';
}

function showRegisterModal() {
    closeLoginModal();
    document.getElementById('registerModal').style.display = 'block';
}

function closeRegisterModal() {
    document.getElementById('registerModal').style.display = 'none';
}

function showScheduleModal() {
    document.getElementById('scheduleModal').style.display = 'block';
}

function closeScheduleModal() {
    document.getElementById('scheduleModal').style.display = 'none';
}

function closeBuildingDetailsModal() {
    const modal = document.getElementById('buildingDetailsModal');
    if (modal) {
        modal.remove();
    }
}

function closeProfileModal() {
    const modal = document.getElementById('profileModal');
    if (modal) {
        modal.remove();
    }
}

function closeSettingsModal() {
    const modal = document.getElementById('settingsModal');
    if (modal) {
        modal.remove();
    }
}

function closeAvailabilityModal() {
    const modal = document.getElementById('availabilityModal');
    if (modal) {
        modal.remove();
    }
}

function closeProgressModal() {
    const modal = document.getElementById('progressModal');
    if (modal) {
        modal.remove();
    }
}

function closePartsRequestModal() {
    const modal = document.getElementById('partsRequestModal');
    if (modal) {
        modal.remove();
    }
}

function closeCompletionModal() {
    const modal = document.getElementById('completionModal');
    if (modal) {
        modal.remove();
    }
}

function closeRescheduleModal() {
    const modal = document.getElementById('rescheduleModal');
    if (modal) {
        modal.remove();
    }
}

function closeIssueDetailsModal() {
    const modal = document.getElementById('issueDetailsModal');
    if (modal) {
        modal.remove();
    }
}

function closeAllNotificationsPanel() {
    const panel = document.getElementById('allNotificationsPanel');
    if (panel) {
        panel.classList.remove('show');
    }
}

function updateNavigation() {
    // Update navigation based on user state
    if (currentUser) {
        // Show appropriate tabs based on user role
        const reportsLink = document.querySelector('[href="#reports"]');
        if (reportsLink) {
            // Show reports for moderator and administrator roles by default
            // For other roles, either hide completely or show limited version
            if (currentUser.role === 'moderator' || currentUser.role === 'administrator') {
                reportsLink.style.display = 'block';  // Full access for moderators/administrators
            } else if (currentUser.role === 'technician') {
                reportsLink.style.display = 'block';  // Show for technicians (limited view)
            } else {
                // Option 1: Hide reports for regular users
                // reportsLink.style.display = 'none';

                // Option 2: Show reports with limited access (recommended)
                reportsLink.style.display = 'block';
                reportsLink.dataset.limitedAccess = 'true';
            }
        }
    } else {
        // If no user is logged in, hide reports
        const reportsLink = document.querySelector('[href="#reports"]');
        if (reportsLink) {
            reportsLink.style.display = 'none';
        }
    }
}

/**
 * Customize the reports section based on user role
 */
function customizeReportsForRole(hasFullAccess, hasTechnicianAccess) {
    const exportButtons = document.querySelectorAll('.report-actions button');
    const reportFilters = document.querySelector('.reports-filters');
    const reportTables = document.querySelector('.report-tables');

    if (hasFullAccess) {
        // Admin/Authority: Show everything
        exportButtons.forEach(btn => btn.style.display = 'block');
        if (reportFilters) reportFilters.style.display = 'block';
        if (reportTables) reportTables.style.display = 'block';
    } else if (hasTechnicianAccess) {
        // Technician: Show performance data but hide export buttons
        exportButtons.forEach(btn => btn.style.display = 'none');
        if (reportFilters) reportFilters.style.display = 'block';
        if (reportTables) reportTables.style.display = 'block';
    } else {
        // Regular user: Limited view
        exportButtons.forEach(btn => btn.style.display = 'none');
        if (reportFilters) reportFilters.style.display = 'none';

        // Add a message for regular users
        const reportsContent = document.querySelector('.reports-content');
        if (reportsContent) {
            // Add a notice about limited access if it doesn't exist
            if (!document.getElementById('reports-limited-access')) {
                const limitedAccessNotice = document.createElement('div');
                limitedAccessNotice.id = 'reports-limited-access';
                limitedAccessNotice.className = 'reports-notice';
                limitedAccessNotice.innerHTML = `
                    <div class="notice-content">
                        <i class="fas fa-info-circle"></i>
                        <p>You are viewing a simplified reports dashboard. For detailed analytics and export options, please contact an administrator.</p>
                    </div>
                `;
                reportsContent.insertBefore(limitedAccessNotice, reportsContent.firstChild);
            } else {
                // Update notice for regular users
                limitedAccessNotice.innerHTML = `
                    <div class="notice-content">
                        <i class="fas fa-info-circle"></i>
                        <p>You are viewing a simplified reports dashboard. For detailed analytics and export options, please contact an administrator.</p>
                    </div>
                `;
            }
        }
    }
}

// --- Moderator Panel Functionality ---

/**
 * Approve an issue (Moderator)
 */
async function approveIssue(issueId) {
    const issue = window.issues.find(i => (i.issueId || i.id) === issueId);
    if (!issue) return;

    try {
        const token = localStorage.getItem('bup-token');
        const res = await fetch(`http://localhost:3000/api/issues/${issueId}/status`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                ...(token ? { 'Authorization': `Bearer ${token}` } : {})
            },
            body: JSON.stringify({ status: 'approved' })
        });
        const data = await res.json();
        if (!res.ok) {
            showNotification(data.message || 'Failed to approve issue', 'error');
            return;
        }
        // Update local issue status
        issue.status = 'approved';
        showNotification(`Issue #${issueId} approved.`, 'success');
        updateModeratorPanel();
        // Optionally, reload all issues from backend for consistency
        if (typeof loadAllIssuesFromBackend === 'function') loadAllIssuesFromBackend();
    } catch (err) {
        showNotification('Failed to approve issue', 'error');
    }
}

/**
 * Show modal to select a technician for assignment (fetches from backend)
 */
async function showTechnicianAssignModal(issueId) {
    // Remove any existing modal
    const existing = document.getElementById('assignTechnicianModal');
    if (existing) existing.remove();

    // Show loading modal first
    const loadingModal = document.createElement('div');
    loadingModal.className = 'modal';
    loadingModal.id = 'assignTechnicianModal';
    loadingModal.innerHTML = `
        <div class="modal-content">
            <span class="close" onclick="closeAssignTechnicianModal()">&times;</span>
            <h2>Assign Technician</h2>
            <div style="padding: 20px; text-align: center;">
                <i class="fas fa-spinner fa-spin"></i> Loading technicians...
            </div>
        </div>
    `;
    document.body.appendChild(loadingModal);
    loadingModal.style.display = 'block';

    let technicians = [];
    try {
        const token = localStorage.getItem('bup-token');
        const res = await fetch('http://localhost:3000/api/users?role=technician', {
            headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        });
        const data = await res.json();
        // Try both possible structures
        if (res.ok && Array.isArray(data.users)) {
            technicians = data.users;
        } else if (res.ok && Array.isArray(data)) {
            technicians = data;
        }
    } catch (e) {
        // ignore, will show no technicians below
    }

    if (!technicians.length) {
        loadingModal.querySelector('.modal-content').innerHTML = `
            <span class="close" onclick="closeAssignTechnicianModal()">&times;</span>
            <h2>Assign Technician</h2>
            <div style="padding: 20px; text-align: center;">
                <i class="fas fa-exclamation-triangle"></i> No technicians available to assign.
            </div>
        `;
        return;
    }

    // Build modal HTML with technician options
    loadingModal.querySelector('.modal-content').innerHTML = `
        <span class="close" onclick="closeAssignTechnicianModal()">&times;</span>
        <h2>Assign Technician</h2>
        <form id="assignTechnicianForm">
            <div class="form-group">
                <label for="technicianSelect">Select Technician:</label>
                <select id="technicianSelect" required>
                    <option value="">-- Select Technician --</option>
                    ${technicians.map(t => `<option value="${t.id || t._id}">${t.name || t.email}</option>`).join('')}
                </select>
            </div>
            <button type="submit" class="btn-primary">Assign</button>
        </form>
    `;

    loadingModal.querySelector('#assignTechnicianForm').onsubmit = function(e) {
        e.preventDefault();
        const techId = loadingModal.querySelector('#technicianSelect').value;
        if (!techId) {
            showNotification('Please select a technician.', 'warning');
            return;
        }
        assignTechnicianToIssue(issueId, techId);
    };
}

function closeAssignTechnicianModal() {
    const modal = document.getElementById('assignTechnicianModal');
    if (modal) modal.remove();
}

/**
 * Assign a technician to an issue (Moderator) - with technician selection
 */
async function assignTechnicianToIssue(issueId, technicianId) {
    const issue = window.issues.find(i => (i.issueId || i.id) === issueId);
    if (!issue) return;

    try {
        const token = localStorage.getItem('bup-token');
        const res = await fetch(`http://localhost:3000/api/issues/${issueId}/assign`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                ...(token ? { 'Authorization': `Bearer ${token}` } : {})
            },
            body: JSON.stringify({ technicianId })
        });
        const data = await res.json();
        if (!res.ok) {
            showNotification(data.message || 'Failed to assign technician', 'error');
            return;
        }
        issue.status = 'assigned';
        issue.assignedTo = data.assignedTo || technicianId;
        showNotification(`Technician assigned to issue #${issueId}.`, 'success');
        closeAssignTechnicianModal();
        updateModeratorPanel();
        if (typeof loadAllIssuesFromBackend === 'function') loadAllIssuesFromBackend();
    } catch (err) {
        showNotification('Failed to assign technician', 'error');
    }
}

/**
 * Assign a technician to an issue (Moderator) - triggers modal
 */
function assignTechnician(issueId) {
    showTechnicianAssignModal(issueId);
}

/**
 * Show modal to enter rejection reason
 */
function showRejectReasonModal(issueId) {
    // Remove any existing modal
    const existing = document.getElementById('rejectReasonModal');
    if (existing) existing.remove();

    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.id = 'rejectReasonModal';
    modal.innerHTML = `
        <div class="modal-content">
            <span class="close" onclick="closeRejectReasonModal()">&times;</span>
            <h2>Reject Issue</h2>
            <form id="rejectReasonForm">
                <div class="form-group">
                    <label for="rejectReasonInput">Reason for rejection:</label>
                    <textarea id="rejectReasonInput" rows="3" required placeholder="Please provide a reason for rejecting this issue..."></textarea>
                </div>
                <button type="submit" class="btn-danger">Reject Issue</button>
            </form>
        </div>
    `;
    document.body.appendChild(modal);
    modal.style.display = 'block';

    modal.querySelector('#rejectReasonForm').onsubmit = function(e) {
        e.preventDefault();
        const reason = modal.querySelector('#rejectReasonInput').value.trim();
        if (!reason) {
            showNotification('Please provide a rejection reason.', 'warning');
            return;
        }
        rejectIssue(issueId, reason);
    };
}

function closeRejectReasonModal() {
    const modal = document.getElementById('rejectReasonModal');
    if (modal) modal.remove();
}

/**
 * Reject an issue (Moderator) with reason
 */
async function rejectIssue(issueId, reason) {
    const issue = window.issues.find(i => (i.issueId || i.id) === issueId);
    if (!issue) return;

    // If no reason provided, show modal
    if (typeof reason === 'undefined') {
        showRejectReasonModal(issueId);
        return;
    }

    try {
        const token = localStorage.getItem('bup-token');
        const res = await fetch(`http://localhost:3000/api/issues/${issueId}/status`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                ...(token ? { 'Authorization': `Bearer ${token}` } : {})
            },
            body: JSON.stringify({ status: 'rejected', rejectReason: reason })
        });
        const data = await res.json();
        if (!res.ok) {
            showNotification(data.message || 'Failed to reject issue', 'error');
            return;
        }
        issue.status = 'rejected';
        issue.rejectReason = reason;
        showNotification(`Issue #${issueId} rejected.`, 'warning');
        closeRejectReasonModal();
        updateModeratorPanel();
        if (typeof loadAllIssuesFromBackend === 'function') loadAllIssuesFromBackend();
    } catch (err) {
        showNotification('Failed to reject issue', 'error');
    }
}

/**
 * Add a note to an issue (Moderator)
 */
function addNote(issueId) {
    // For demo: prompt for note and show notification
    const note = prompt('Enter note for this issue:');
    if (note) {
        // You would save the note to the backend here
        showNotification(`Note added to issue #${issueId}.`, 'info');
    }
}

/**
 * Filter moderator issues by status/priority/search
 */
function filterModeratorIssues() {
    const status = document.getElementById('adminStatusFilter').value;
    const priority = document.getElementById('adminPriorityFilter').value;
    const search = document.getElementById('adminSearch').value.trim().toLowerCase();

    let filtered = window.issues || [];
    // Always show pending-review issues by default if no filter is applied
    if ((!status || status === 'all') && (!priority || priority === 'all') && !search) {
        filtered = filtered.filter(i => i.status === 'pending-review');
    } else {
        if (status && status !== 'all') {
            filtered = filtered.filter(i => i.status === status);
        }
        if (priority && priority !== 'all') {
            filtered = filtered.filter(i => i.priority === priority);
        }
        if (search) {
            filtered = filtered.filter(i =>
                (i.description && i.description.toLowerCase().includes(search)) ||
                (i.specificLocation && i.specificLocation.toLowerCase().includes(search)) ||
                (i.issueId && i.issueId.toLowerCase().includes(search)) ||
                (i.id && i.id.toLowerCase().includes(search))
            );
        }
    }
    renderModeratorIssues(filtered);
}

/**
 * Render moderator issues list using the same UI as All Campus Issues
 */
function renderModeratorIssues(issues) {
    const list = document.querySelector('.admin-issues-list');
    if (!list) return;
    list.innerHTML = '';
    if (!issues || !issues.length) {
        list.innerHTML = '<p class="no-issues">No issues found.</p>';
        return;
    }
    issues.sort((a, b) => new Date(b.submittedDate) - new Date(a.submittedDate));
    issues.forEach(issue => {
        const issueCard = document.createElement('div');
        issueCard.className = 'issue-card';
        issueCard.style.marginBottom = '20px';
        let submitter = issue.submitterName || issue.submittedBy || issue.submitterEmail || '';
        const statusIcon = typeof getStatusIcon === 'function'
            ? getStatusIcon(issue.status)
            : 'fas fa-info-circle';
        const shortDescription = issue.description && issue.description.length > 120
            ? issue.description.slice(0, 120) + '...'
            : issue.description || '';
        const submittedDate = issue.submittedDate
            ? (issue.submittedDate.split ? issue.submittedDate.split('T')[0] : issue.submittedDate)
            : '';

        // Moderator actions: show Approve/Reject for pending-review, Assign Technician for approved
        let moderatorActions = '';
        if (issue.status === 'pending-review') {
            moderatorActions = `
                <button class="btn-success" onclick="approveIssue('${issue.issueId || issue.id}')">Approve</button>
                <button class="btn-danger" onclick="showRejectReasonModal('${issue.issueId || issue.id}')">Reject</button>
            `;
        } else if (issue.status === 'approved') {
            moderatorActions = `
                <button class="btn-warning" onclick="assignTechnician('${issue.issueId || issue.id}')">Assign Technician</button>
            `;
        }

        issueCard.innerHTML = `
            <div class="issue-header">
                <span class="issue-id">#${issue.issueId || issue.id}</span>
                <span class="issue-status ${issue.status}">
                    <i class="${statusIcon}"></i>
                    ${formatStatus(issue.status)}
                </span>
                <span class="issue-priority ${issue.priority}">${issue.priority}</span>
            </div>
            <h4>${formatCategoryName(issue.category)} Issue - ${issue.specificLocation}</h4>
            <div class="issue-details">
                <span><i class="fas fa-map-marker-alt"></i> ${getLocationName(issue.location)}, ${issue.specificLocation}</span>
                <span><i class="fas fa-calendar"></i> Submitted: ${submittedDate}</span>
                <span><i class="fas fa-user"></i> ${submitter}</span>
            </div>
            <p>${shortDescription}</p>
            <div class="issue-actions">
                <button class="btn-secondary" onclick="viewIssueDetails('${issue.issueId || issue.id}')">View Details</button>
                ${moderatorActions}
                <!-- <button class="btn-secondary" onclick="addNote('${issue.issueId || issue.id}')">Add Note</button> -->
            </div>
        `;

        list.appendChild(issueCard);
    });

    if (typeof initializeVoteSystem === 'function') {
        initializeVoteSystem(list);
    }
}

/**
 * Update moderator panel UI after actions
 */
function updateModeratorPanel() {
    filterModeratorIssues();
}

// Attach event listeners for moderator panel filters/search and auto-update on issues load
document.addEventListener('DOMContentLoaded', function() {
    const statusFilter = document.getElementById('adminStatusFilter');
    const priorityFilter = document.getElementById('adminPriorityFilter');
    const searchInput = document.getElementById('adminSearch');
    if (statusFilter) statusFilter.addEventListener('change', filterModeratorIssues);
    if (priorityFilter) priorityFilter.addEventListener('change', filterModeratorIssues);
    if (searchInput) searchInput.addEventListener('input', filterModeratorIssues);

    // Initial render if moderator panel is visible
    if (document.getElementById('moderator-panel')) {
        filterModeratorIssues();
    }

    // Setup navigation events
    setupNavigationEvents();
});

// Update moderator panel when issues are loaded/refreshed
window.addEventListener('issuesLoaded', function() {
    if (document.getElementById('moderator-panel')) {
        filterModeratorIssues();
    }
});

/**
 * Setup navigation event listeners - call this function directly after DOM is loaded
 */
function setupNavigationEvents() {
    console.log('Setting up navigation event listeners');
    
    document.querySelectorAll('.nav-link').forEach(link => {
        // Remove any existing listeners to avoid duplicates
        link.removeEventListener('click', handleNavLinkClick);
        // Add the event listener
        link.addEventListener('click', handleNavLinkClick);
    });
}

/**
 * Handle navigation link click
 */
function handleNavLinkClick(e) {
    e.preventDefault();
    const section = this.getAttribute('href').substring(1);
    console.log(`Navigation link clicked: ${section}`);
    showSection(section);
}

// Make these functions accessible globally
window.showSection = showSection;
window.updateReports = updateReports;
window.showTab = showTab;
window.showLoginModal = showLoginModal;
window.closeLoginModal = closeLoginModal;
window.showRegisterModal = showRegisterModal;
window.closeRegisterModal = closeRegisterModal;
window.showScheduleModal = showScheduleModal;
window.closeScheduleModal = closeScheduleModal;
window.closeBuildingDetailsModal = closeBuildingDetailsModal;
window.closeProfileModal = closeProfileModal;
window.closeSettingsModal = closeSettingsModal;
window.closeAvailabilityModal = closeAvailabilityModal;
window.closeProgressModal = closeProgressModal;
window.closePartsRequestModal = closePartsRequestModal;
window.closeCompletionModal = closeCompletionModal;
window.closeRescheduleModal = closeRescheduleModal;
window.closeIssueDetailsModal = closeIssueDetailsModal;
window.closeAllNotificationsPanel = closeAllNotificationsPanel;
window.updateNavigation = updateNavigation;
window.customizeReportsForRole = customizeReportsForRole;
window.approveIssue = approveIssue;
window.showTechnicianAssignModal = showTechnicianAssignModal;
window.closeAssignTechnicianModal = closeAssignTechnicianModal;
window.assignTechnicianToIssue = assignTechnicianToIssue;
window.showRejectReasonModal = showRejectReasonModal;
window.closeRejectReasonModal = closeRejectReasonModal;
window.rejectIssue = rejectIssue;
window.addNote = addNote;
window.filterModeratorIssues = filterModeratorIssues;
window.updateModeratorPanel = updateModeratorPanel;
window.renderModeratorIssues = renderModeratorIssues;
window.setupNavigationEvents = setupNavigationEvents;
