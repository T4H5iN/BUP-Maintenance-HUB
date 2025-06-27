// UI management functions

function showSection(sectionName) {
    document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active');
    });
    
    document.getElementById(sectionName).classList.add('active');
    
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });
    
    document.querySelector(`[href="#${sectionName}"]`).classList.add('active');
    
    currentSection = sectionName;
    
    if (sectionName === 'dashboard') {
        updateDashboard();
    } else if (sectionName === 'reports') {
        // Check if user has permission to view reports
        if (currentUser) {
            const hasFullAccess = currentUser.role === 'admin' || currentUser.role === 'authority';
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
            // Show reports for admin and authority roles by default
            // For other roles, either hide completely or show limited version
            if (currentUser.role === 'admin' || currentUser.role === 'authority') {
                reportsLink.style.display = 'block';  // Full access for admins
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
            }
        }
    }
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
