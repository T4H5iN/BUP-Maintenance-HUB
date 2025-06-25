// Notification system functionality

function showNotifications() {
    // Close any open user menu dropdown first
    closeUserMenu();
    
    // Check if all notifications panel already exists
    if (document.getElementById('allNotificationsPanel')) {
        // If the panel exists, toggle its visibility
        const panel = document.getElementById('allNotificationsPanel');
        if (panel.classList.contains('show')) {
            panel.classList.remove('show');
        } else {
            panel.classList.add('show');
        }
    } else {
        // If the panel doesn't exist, create it
        createAllNotificationsPanel();
        // Then show it
        document.getElementById('allNotificationsPanel').classList.add('show');
    }
}

function createAllNotificationsPanel() {
    const panel = document.createElement('div');
    panel.id = 'allNotificationsPanel';
    panel.className = 'all-notifications-panel';
    
    panel.innerHTML = `
        <div class="all-notifications-header">
            <h2>All Notifications</h2>
            <button class="close-all-notifications" onclick="closeAllNotificationsPanel()">
                <i class="fas fa-times"></i>
            </button>
        </div>
        <div class="all-notifications-filters">
            <button class="notification-filter-btn active" onclick="filterNotifications('all')">All</button>
            <button class="notification-filter-btn" onclick="filterNotifications('unread')">Unread</button>
            <button class="notification-filter-btn" onclick="filterNotifications('read')">Read</button>
        </div>
        <div class="all-notifications-list">
            <!-- Notification items -->
            <div class="notification-item unread">
                <div class="notification-icon warning">
                    <i class="fas fa-exclamation-circle"></i>
                </div>
                <div class="notification-content">
                    <p class="notification-text">Your issue #BUP012 has been assigned to a technician.</p>
                    <span class="notification-time">2 hours ago</span>
                    <div class="notification-actions">
                        <button class="notification-action-btn primary" onclick="viewIssueDetails('BUP012')">View Issue</button>
                        <button class="notification-action-btn" onclick="dismissNotification(this)">Dismiss</button>
                    </div>
                </div>
                <button class="notification-mark-read" onclick="markNotificationAsRead(this)">
                    <i class="fas fa-circle"></i>
                </button>
            </div>
            <div class="notification-item unread">
                <div class="notification-icon success">
                    <i class="fas fa-check-circle"></i>
                </div>
                <div class="notification-content">
                    <p class="notification-text">Issue #BUP008 has been resolved. Please provide feedback.</p>
                    <span class="notification-time">Yesterday</span>
                    <div class="notification-actions">
                        <button class="notification-action-btn primary" onclick="provideFeedback('BUP008')">Provide Feedback</button>
                        <button class="notification-action-btn" onclick="dismissNotification(this)">Dismiss</button>
                    </div>
                </div>
                <button class="notification-mark-read" onclick="markNotificationAsRead(this)">
                    <i class="fas fa-circle"></i>
                </button>
            </div>
            <div class="notification-item">
                <div class="notification-icon info">
                    <i class="fas fa-info-circle"></i>
                </div>
                <div class="notification-content">
                    <p class="notification-text">Maintenance scheduled for Building A on June 15th.</p>
                    <span class="notification-time">3 days ago</span>
                </div>
                <button class="notification-mark-read" onclick="markNotificationAsRead(this)">
                    <i class="fas fa-check-circle"></i>
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(panel);
}

function filterNotifications(filter) {
    const filterButtons = document.querySelectorAll('.notification-filter-btn');
    filterButtons.forEach(btn => btn.classList.remove('active'));
    
    const clickedButton = document.querySelector(`.notification-filter-btn[onclick="filterNotifications('${filter}')"]`);
    if (clickedButton) {
        clickedButton.classList.add('active');
    }
    
    const allNotifications = document.querySelectorAll('.all-notifications-list .notification-item');
    
    allNotifications.forEach(notification => {
        if (filter === 'all') {
            notification.style.display = 'flex';
        } else if (filter === 'unread' && notification.classList.contains('unread')) {
            notification.style.display = 'flex';
        } else if (filter === 'read' && !notification.classList.contains('unread')) {
            notification.style.display = 'flex';
        } else {
            notification.style.display = 'none';
        }
    });
}

function dismissNotification(button) {
    const notificationItem = button.closest('.notification-item');
    notificationItem.style.opacity = '0';
    setTimeout(() => {
        notificationItem.remove();
        
        // Check if there are no more notifications
        const notificationsList = document.querySelector('.all-notifications-list');
        if (notificationsList && notificationsList.children.length === 0) {
            notificationsList.innerHTML = '<div class="no-notifications">No notifications to display</div>';
        }
        
        // Update badge count
        updateNotificationBadge();
    }, 300);
}

function markNotificationAsRead(button) {
    const notificationItem = button.closest('.notification-item');
    if (notificationItem.classList.contains('unread')) {
        notificationItem.classList.remove('unread');
        
        // Change the icon
        const icon = button.querySelector('i');
        if (icon) {
            icon.className = 'fas fa-check-circle';
        }
        
        // Update badge count
        updateNotificationBadge();
    }
}

function updateNotificationBadge() {
    const unreadCount = document.querySelectorAll('.notification-item.unread').length;
    const badges = document.querySelectorAll('.notification-badge');
    
    badges.forEach(badge => {
        if (unreadCount === 0) {
            badge.style.display = 'none';
        } else {
            badge.style.display = '';
            badge.textContent = unreadCount;
        }
    });
}

// Make functions available globally
window.showNotifications = showNotifications;
window.createAllNotificationsPanel = createAllNotificationsPanel;
window.filterNotifications = filterNotifications;
window.dismissNotification = dismissNotification;
window.markNotificationAsRead = markNotificationAsRead;
window.updateNotificationBadge = updateNotificationBadge;
