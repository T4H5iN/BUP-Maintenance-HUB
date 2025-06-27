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
        updateReports();
    }
}

function updateReports() {
    // Initialize analytics and charts if analyticsManager exists
    if (typeof analyticsManager !== 'undefined') {
        // Make sure analytics is initialized
        if (typeof analyticsManager.initializeAnalytics === 'function') {
            analyticsManager.initializeAnalytics();
        }
        
        // Generate charts
        analyticsManager.generateTrendsChart();
        if (!document.getElementById('categoryChart')) {
            analyticsManager.generateCategoryChart();
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
