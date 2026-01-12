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
        const res = await fetch(`/api/issues/${issueId}/status`, {
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
        const res = await fetch('/api/users?role=technician', {
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

    loadingModal.querySelector('#assignTechnicianForm').onsubmit = function (e) {
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
        console.log(`Assigning technician ${technicianId} to issue ${issueId}`);

        // Use the issueId or id property - this should match what the backend expects
        const idToUse = issue.issueId || issue.id;

        const res = await fetch(`/api/issues/${idToUse}/assign`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                ...(token ? { 'Authorization': `Bearer ${token}` } : {})
            },
            body: JSON.stringify({ technicianId })
        });

        if (!res.ok) {
            let errorMessage = 'Failed to assign technician';
            try {
                const errorData = await res.json();
                errorMessage = errorData.message || errorMessage;
                console.error('Error response:', errorData);
            } catch (parseError) {
                console.error('Error parsing error response:', parseError);
            }
            showNotification(errorMessage, 'error');
            return;
        }

        const data = await res.json();
        console.log('Assignment response:', data);

        // Update local issue status and assignment data
        if (data.issue) {
            // Use the returned issue data
            Object.assign(issue, data.issue);
        } else {
            // Fallback to basic fields
            issue.status = 'assigned';
            issue.assignedTo = technicianId;
            issue.assignedToName = data.assignedTo || 'Assigned Technician';
        }

        showNotification(`Technician assigned to issue #${issueId}.`, 'success');
        closeAssignTechnicianModal();
        updateModeratorPanel();

        // Reload all issues for UI consistency
        if (typeof loadAllIssuesFromBackend === 'function') {
            loadAllIssuesFromBackend();
        }
    } catch (err) {
        console.error('Error assigning technician:', err);
        showNotification('Failed to assign technician: ' + (err.message || 'Unknown error'), 'error');
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
                <div class="rejection-actions">
                    <button type="submit" class="btn-danger">Reject Issue</button>
                    <button type="button" class="btn-secondary" onclick="closeRejectReasonModal()">Cancel</button>
                </div>
            </form>
        </div>
    `;
    document.body.appendChild(modal);
    modal.style.display = 'block';

    // Make sure the form submission is properly handled
    const form = modal.querySelector('#rejectReasonForm');
    if (form) {
        form.onsubmit = function (e) {
            e.preventDefault();
            const reason = modal.querySelector('#rejectReasonInput').value.trim();
            if (!reason) {
                showNotification('Please provide a rejection reason.', 'warning');
                return;
            }
            rejectIssue(issueId, reason);
        };
    }

    // Add ESC key handler to close modal
    document.addEventListener('keydown', function escHandler(e) {
        if (e.key === 'Escape') {
            closeRejectReasonModal();
            document.removeEventListener('keydown', escHandler);
        }
    });
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
        const res = await fetch(`/api/issues/${issueId}/status`, {
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
document.addEventListener('DOMContentLoaded', function () {
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
window.addEventListener('issuesLoaded', function () {
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

/**
 * Show help and support modal
 */
function showHelp() {
    // Remove any existing modal
    const existingModal = document.getElementById('helpModal');
    if (existingModal) existingModal.remove();

    // Create modal element
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.id = 'helpModal';

    modal.innerHTML = `
        <div class="modal-content help-modal">
            <span class="close" onclick="closeHelpModal()">&times;</span>
            <h2>Help & Support</h2>
            
            <div class="help-tabs">
                <button class="help-tab-btn active" data-tab="faq">FAQs</button>
                <button class="help-tab-btn" data-tab="contact">Contact Support</button>
                <button class="help-tab-btn" data-tab="guide">User Guide</button>
            </div>
            
            <div class="help-content">
                <div id="faq-tab" class="help-tab-content active">
                    <h3>Frequently Asked Questions</h3>
                    
                    <div class="faq-item">
                        <div class="faq-question">
                            <i class="fas fa-question-circle"></i>
                            <h4>How do I report a new maintenance issue?</h4>
                            <i class="fas fa-chevron-down faq-toggle"></i>
                        </div>
                        <div class="faq-answer">
                            <p>To report a new issue, navigate to the Home page and scroll down to the "Report an Issue" form. 
                            Fill in all required fields including category, location, and description. You can also upload images 
                            to help illustrate the problem.</p>
                        </div>
                    </div>
                    
                    <div class="faq-item">
                        <div class="faq-question">
                            <i class="fas fa-question-circle"></i>
                            <h4>How can I check the status of my reported issues?</h4>
                            <i class="fas fa-chevron-down faq-toggle"></i>
                        </div>
                        <div class="faq-answer">
                            <p>Go to the Dashboard page and select the "My Issues" tab. This will display all issues you've 
                            submitted along with their current status. You can filter issues by status, category, or date.</p>
                        </div>
                    </div>
                    
                    <div class="faq-item">
                        <div class="faq-question">
                            <i class="fas fa-question-circle"></i>
                            <h4>What do the different issue statuses mean?</h4>
                            <i class="fas fa-chevron-down faq-toggle"></i>
                        </div>
                        <div class="faq-answer">
                            <ul>
                                <li><strong>Pending Review:</strong> Your issue has been submitted and is awaiting initial review.</li>
                                <li><strong>Approved:</strong> The issue has been reviewed and approved for resolution.</li>
                                <li><strong>Assigned:</strong> A technician has been assigned to address your issue.</li>
                                <li><strong>In Progress:</strong> Work is currently being done to resolve the issue.</li>
                                <li><strong>Resolved:</strong> The issue has been fixed and is now considered closed.</li>
                                <li><strong>Rejected:</strong> The issue was reviewed but not approved for action.</li>
                            </ul>
                        </div>
                    </div>
                    
                    <div class="faq-item">
                        <div class="faq-question">
                            <i class="fas fa-question-circle"></i>
                            <h4>How do I provide feedback on a resolved issue?</h4>
                            <i class="fas fa-chevron-down faq-toggle"></i>
                        </div>
                        <div class="faq-answer">
                            <p>When an issue is marked as "Resolved," you'll see a "Provide Feedback" button on the issue card 
                            in your dashboard. Click this button to rate the resolution and provide any additional comments.</p>
                        </div>
                    </div>
                    
                    <div class="faq-item">
                        <div class="faq-question">
                            <i class="fas fa-question-circle"></i>
                            <h4>I forgot my password. How do I reset it?</h4>
                            <i class="fas fa-chevron-down faq-toggle"></i>
                        </div>
                        <div class="faq-answer">
                            <p>On the login page, click the "Forgot password?" link. Enter your BUP email address, and 
                            you'll receive a verification code. Enter this code to reset your password.</p>
                        </div>
                    </div>
                </div>
                
                <div id="contact-tab" class="help-tab-content">
                    <h3>Contact Support</h3>
                    
                    <div class="contact-info">
                        <div class="contact-item">
                            <i class="fas fa-envelope"></i>
                            <div>
                                <h4>Email Support</h4>
                                <p>maintenance-support@bup.edu.bd</p>
                                <p>Response time: Within 24 hours</p>
                            </div>
                        </div>
                        
                        <div class="contact-item">
                            <i class="fas fa-phone-alt"></i>
                            <div>
                                <h4>Phone Support</h4>
                                <p>+880 2-XXX-XXXX (Ext. 1234)</p>
                                <p>Available: Sun-Thu, 9:00 AM - 4:00 PM</p>
                            </div>
                        </div>
                        
                        <div class="contact-item">
                            <i class="fas fa-map-marker-alt"></i>
                            <div>
                                <h4>In-Person Support</h4>
                                <p>Maintenance Office, Ground Floor, Admin Building</p>
                                <p>Office Hours: 9:00 AM - 5:00 PM</p>
                            </div>
                        </div>
                    </div>
                    
                    <div class="contact-form">
                        <h4>Send a Support Request</h4>
                        <form id="supportRequestForm">
                            <div class="form-group">
                                <label for="supportSubject">Subject:</label>
                                <input type="text" id="supportSubject" required placeholder="Brief description of your issue">
                            </div>
                            
                            <div class="form-group">
                                <label for="supportMessage">Message:</label>
                                <textarea id="supportMessage" rows="5" required placeholder="Please describe your issue in detail..."></textarea>
                            </div>
                            
                            <div class="form-group">
                                <label for="supportPriority">Priority:</label>
                                <select id="supportPriority">
                                    <option value="low">Low - General question</option>
                                    <option value="medium" selected>Medium - Need assistance</option>
                                    <option value="high">High - Urgent issue</option>
                                </select>
                            </div>
                            
                            <button type="submit" class="btn-primary">
                                <i class="fas fa-paper-plane"></i> Send Request
                            </button>
                        </form>
                    </div>
                </div>
                
                <div id="guide-tab" class="help-tab-content">
                    <h3>User Guide</h3>
                    
                    <div class="guide-section">
                        <h4>Getting Started</h4>
                        <p>Welcome to the BUP Maintenance HUB! This platform allows you to report maintenance issues 
                        across campus, track their progress, and get updates when they're resolved.</p>
                        
                        <div class="guide-step">
                            <div class="step-number">1</div>
                            <div class="step-content">
                                <h5>Create an Account</h5>
                                <p>Use your BUP email address to register. Student emails should end with @student.bup.edu.bd, 
                                while faculty and staff emails end with @bup.edu.bd.</p>
                            </div>
                        </div>
                        
                        <div class="guide-step">
                            <div class="step-number">2</div>
                            <div class="step-content">
                                <h5>Report an Issue</h5>
                                <p>From the Home page, fill out the issue report form with as much detail as possible. 
                                Adding images helps the maintenance team understand the problem better.</p>
                            </div>
                        </div>
                        
                        <div class="guide-step">
                            <div class="step-number">3</div>
                            <div class="step-content">
                                <h5>Track Progress</h5>
                                <p>Check your Dashboard to monitor the status of your reported issues. You'll also 
                                receive notifications when there are updates.</p>
                            </div>
                        </div>
                        
                        <div class="guide-step">
                            <div class="step-number">4</div>
                            <div class="step-content">
                                <h5>Provide Feedback</h5>
                                <p>Once an issue is resolved, please take a moment to rate the service and provide 
                                feedback to help us improve.</p>
                            </div>
                        </div>
                    </div>
                    
                    <div class="download-guides">
                        <h4>Downloadable Guides</h4>
                        <div class="guide-downloads">
                            <a href="#" class="guide-download-btn" onclick="alert('User manual downloading will be available soon!')">
                                <i class="fas fa-file-pdf"></i>
                                <span>Complete User Manual</span>
                            </a>
                            <a href="#" class="guide-download-btn" onclick="alert('Quick start guide downloading will be available soon!')">
                                <i class="fas fa-file-alt"></i>
                                <span>Quick Start Guide</span>
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Add to document body
    document.body.appendChild(modal);

    // Show modal
    modal.style.display = 'block';

    // Add event listeners for tabs
    const tabButtons = modal.querySelectorAll('.help-tab-btn');
    tabButtons.forEach(button => {
        button.addEventListener('click', function () {
            // Remove active class from all buttons and contents
            tabButtons.forEach(btn => btn.classList.remove('active'));
            modal.querySelectorAll('.help-tab-content').forEach(content =>
                content.classList.remove('active')
            );

            // Add active class to clicked button and corresponding content
            this.classList.add('active');
            const tabName = this.getAttribute('data-tab');
            document.getElementById(`${tabName}-tab`).classList.add('active');
        });
    });

    // Add event listeners for FAQ toggles
    const faqQuestions = modal.querySelectorAll('.faq-question');
    faqQuestions.forEach(question => {
        question.addEventListener('click', function () {
            const answer = this.nextElementSibling;
            const isOpen = answer.style.display === 'block';

            // Toggle the answer visibility
            answer.style.display = isOpen ? 'none' : 'block';

            // Toggle the icon
            const icon = this.querySelector('.faq-toggle');
            icon.classList.toggle('fa-chevron-down', !isOpen);
            icon.classList.toggle('fa-chevron-up', isOpen);
        });
    });

    // Handle support form submission
    const supportForm = document.getElementById('supportRequestForm');
    if (supportForm) {
        supportForm.addEventListener('submit', function (e) {
            e.preventDefault();
            const subject = document.getElementById('supportSubject').value;
            const message = document.getElementById('supportMessage').value;
            const priority = document.getElementById('supportPriority').value;

            // In a real application, send this data to the server
            console.log('Support request:', { subject, message, priority });

            // Show success message
            showNotification('Your support request has been submitted. We will respond shortly.', 'success');

            // Reset form
            this.reset();
        });
    }
}

/**
 * Close the help modal
 */
function closeHelpModal() {
    const modal = document.getElementById('helpModal');
    if (modal) {
        modal.style.display = 'none';
        setTimeout(() => modal.remove(), 300);
    }
}
