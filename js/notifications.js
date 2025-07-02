/**
 * Notifications System
 * Handles user notifications, loading, display, and management
 */

// State variables for notifications
let currentNotificationsPage = 1;
let hasMoreNotifications = true;
let currentNotificationsFilter = 'all';
let notificationsLoaded = false;
let unreadNotificationCount = 0;

/**
 * Service for handling notification API requests
 */
const NotificationService = {
    /**
     * Fetch notifications from the server
     * @param {string} filter - Filter type (all, unread, etc.)
     * @param {number} page - Page number for pagination
     * @returns {Promise} - Promise with notification data
     */
    async fetchNotifications(filter = 'all', page = 1) {
        const token = localStorage.getItem('bup-token');
        if (!token) {
            throw new Error('Authentication token not found');
        }

        const response = await fetch(`http://localhost:3000/api/notifications?filter=${filter}&page=${page}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to fetch notifications');
        }

        return await response.json();
    },

    /**
     * Mark a notification as read
     * @param {string} notificationId - ID of the notification
     * @returns {Promise} - Promise with operation result
     */
    async markAsRead(notificationId) {
        const token = localStorage.getItem('bup-token');
        if (!token) {
            throw new Error('Authentication token not found');
        }

        const response = await fetch(`http://localhost:3000/api/notifications/${notificationId}/read`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to mark notification as read');
        }

        return await response.json();
    },

    /**
     * Mark all notifications as read
     * @returns {Promise} - Promise with operation result
     */
    async markAllAsRead() {
        const token = localStorage.getItem('bup-token');
        if (!token) {
            throw new Error('Authentication token not found');
        }

        const response = await fetch('http://localhost:3000/api/notifications/mark-all-read', {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to mark all notifications as read');
        }

        return await response.json();
    },

    /**
     * Delete a notification
     * @param {string} notificationId - ID of the notification
     * @returns {Promise} - Promise with operation result
     */
    async deleteNotification(notificationId) {
        const token = localStorage.getItem('bup-token');
        if (!token) {
            throw new Error('Authentication token not found');
        }

        const response = await fetch(`http://localhost:3000/api/notifications/${notificationId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to delete notification');
        }

        return await response.json();
    }
};

/**
 * Load notifications from the server
 */
async function loadNotifications() {
    try {
        // Reset pagination
        currentNotificationsPage = 1;
        hasMoreNotifications = true;
        
        const notificationsList = document.querySelector('.all-notifications-list');
        if (!notificationsList) return;
        
        // Show loading indicator
        notificationsList.innerHTML = `
            <div class="notifications-loading">
                <i class="fas fa-spinner fa-spin"></i>
                <p>Loading notifications...</p>
            </div>
        `;
        
        // Check if user is logged in
        if (!currentUser) {
            notificationsList.innerHTML = `
                <div class="no-notifications">
                    <p>Please log in to view your notifications.</p>
                </div>
            `;
            return;
        }
        
        // Fetch notifications using the service
        const data = await NotificationService.fetchNotifications(
            currentNotificationsFilter, 
            currentNotificationsPage
        );
        
        // Update pagination
        hasMoreNotifications = currentNotificationsPage < data.totalPages;
        
        // Update badge count
        updateNotificationBadge(data.unreadCount);
        
        // Render notifications
        renderNotifications(data.notifications, notificationsList);
        
        // Update loaded flag
        notificationsLoaded = true;
        
    } catch (error) {
        console.error('Error loading notifications:', error);
        
        const notificationsList = document.querySelector('.all-notifications-list');
        if (notificationsList) {
            notificationsList.innerHTML = `
                <div class="notifications-error">
                    <i class="fas fa-exclamation-circle"></i>
                    <p>Failed to load notifications. Please try again.</p>
                </div>
            `;
        }
    }
}

/**
 * Render notifications in the UI
 * @param {Array} notifications - Array of notification objects
 * @param {Element} container - Container to render notifications in
 */
function renderNotifications(notifications, container) {
    if (!notifications || notifications.length === 0) {
        container.innerHTML = `
            <div class="no-notifications">
                <i class="fas fa-bell-slash"></i>
                <p>No notifications to display</p>
            </div>
        `;
        return;
    }
    
    let notificationsHTML = '';
    
    notifications.forEach(notification => {
        // Format date as relative time (e.g. "2 hours ago")
        const formattedDate = formatRelativeTime(new Date(notification.createdAt));
        
        // Determine CSS classes based on notification type and read status
        const typeClass = notification.type || 'info';
        const readClass = notification.isRead ? 'read' : 'unread';
        
        // Create notification item HTML
        notificationsHTML += `
            <div class="notification-item ${typeClass} ${readClass}" data-id="${notification._id}">
                <div class="notification-icon">
                    ${getNotificationIcon(notification.type)}
                </div>
                <div class="notification-content">
                    <div class="notification-message">${notification.message}</div>
                    <div class="notification-time">${formattedDate}</div>
                </div>
                <div class="notification-actions">
                    ${!notification.isRead ? 
                      `<button class="mark-read-btn" onclick="markNotificationAsRead('${notification._id}')">
                          <i class="fas fa-check"></i>
                       </button>` : ''}
                    <button class="dismiss-btn" onclick="dismissNotification('${notification._id}')">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            </div>
        `;
    });
    
    // Add "Load More" button if there are more notifications
    if (hasMoreNotifications) {
        notificationsHTML += `
            <div class="load-more-container">
                <button class="load-more-btn" onclick="loadMoreNotifications()">
                    <i class="fas fa-spinner"></i> Load More
                </button>
            </div>
        `;
    }
    
    // Update container with notifications HTML
    container.innerHTML = notificationsHTML;
    
    // Add click event for notification items (mark as read when clicked)
    container.querySelectorAll('.notification-item.unread').forEach(item => {
        item.addEventListener('click', function(e) {
            // Don't trigger if clicking on action buttons
            if (e.target.closest('.notification-actions')) {
                return;
            }
            
            const notificationId = this.dataset.id;
            markNotificationAsRead(notificationId);
        });
    });
}

/**
 * Get appropriate icon based on notification type
 * @param {string} type - Notification type
 * @returns {string} - HTML for the icon
 */
function getNotificationIcon(type) {
    switch (type) {
        case 'success':
            return '<i class="fas fa-check-circle"></i>';
        case 'error':
            return '<i class="fas fa-exclamation-circle"></i>';
        case 'warning':
            return '<i class="fas fa-exclamation-triangle"></i>';
        case 'issue':
            return '<i class="fas fa-clipboard-check"></i>';
        case 'assignment':
            return '<i class="fas fa-tasks"></i>';
        case 'comment':
            return '<i class="fas fa-comment"></i>';
        default:
            return '<i class="fas fa-bell"></i>';
    }
}

/**
 * Format a date as relative time
 * @param {Date} date - Date to format
 * @returns {string} - Formatted relative time
 */
function formatRelativeTime(date) {
    const now = new Date();
    const diffMs = now - date;
    const diffSec = Math.round(diffMs / 1000);
    const diffMin = Math.round(diffSec / 60);
    const diffHour = Math.round(diffMin / 60);
    const diffDay = Math.round(diffHour / 24);
    
    if (diffSec < 60) {
        return 'just now';
    } else if (diffMin < 60) {
        return `${diffMin} minute${diffMin > 1 ? 's' : ''} ago`;
    } else if (diffHour < 24) {
        return `${diffHour} hour${diffHour > 1 ? 's' : ''} ago`;
    } else if (diffDay < 7) {
        return `${diffDay} day${diffDay > 1 ? 's' : ''} ago`;
    } else {
        // For older notifications, show the actual date
        return date.toLocaleDateString();
    }
}

/**
 * Mark a notification as read
 * @param {string} notificationId - ID of the notification
 */
async function markNotificationAsRead(notificationId) {
    try {
        await NotificationService.markAsRead(notificationId);
        
        // Update UI to reflect the change
        const notificationItem = document.querySelector(`.notification-item[data-id="${notificationId}"]`);
        if (notificationItem) {
            notificationItem.classList.remove('unread');
            notificationItem.classList.add('read');
            
            // Remove the mark as read button
            const markReadBtn = notificationItem.querySelector('.mark-read-btn');
            if (markReadBtn) {
                markReadBtn.remove();
            }
        }
        
        // Decrease unread count
        decreaseUnreadCount();
        
    } catch (error) {
        console.error('Error marking notification as read:', error);
        showNotification('Failed to mark notification as read', 'error');
    }
}

/**
 * Mark all notifications as read
 */
async function markAllNotificationsAsRead() {
    try {
        await NotificationService.markAllAsRead();
        
        // Update UI to reflect the change
        document.querySelectorAll('.notification-item.unread').forEach(item => {
            item.classList.remove('unread');
            item.classList.add('read');
            
            // Remove the mark as read button
            const markReadBtn = item.querySelector('.mark-read-btn');
            if (markReadBtn) {
                markReadBtn.remove();
            }
        });
        
        // Reset unread count
        updateNotificationBadge(0);
        
        showNotification('All notifications marked as read', 'success');
        
    } catch (error) {
        console.error('Error marking all notifications as read:', error);
        showNotification('Failed to mark all notifications as read', 'error');
    }
}

/**
 * Dismiss (delete) a notification
 * @param {string} notificationId - ID of the notification
 */
async function dismissNotification(notificationId) {
    try {
        // Check if notification is unread before deletion
        const notificationItem = document.querySelector(`.notification-item[data-id="${notificationId}"]`);
        const isUnread = notificationItem && notificationItem.classList.contains('unread');
        
        await NotificationService.deleteNotification(notificationId);
        
        // Remove notification from UI with animation
        if (notificationItem) {
            notificationItem.style.height = notificationItem.offsetHeight + 'px';
            notificationItem.classList.add('removing');
            
            // After animation completes, remove the element
            setTimeout(() => {
                notificationItem.remove();
                
                // Check if no notifications left
                const notificationsList = document.querySelector('.all-notifications-list');
                if (notificationsList && !notificationsList.querySelector('.notification-item')) {
                    notificationsList.innerHTML = `
                        <div class="no-notifications">
                            <i class="fas fa-bell-slash"></i>
                            <p>No notifications to display</p>
                        </div>
                    `;
                }
            }, 300);
            
            // If the notification was unread, decrease the counter
            if (isUnread) {
                decreaseUnreadCount();
            }
        }
        
    } catch (error) {
        console.error('Error dismissing notification:', error);
        showNotification('Failed to dismiss notification', 'error');
    }
}

/**
 * Load more notifications (pagination)
 */
async function loadMoreNotifications() {
    try {
        // Update loading state
        const loadMoreBtn = document.querySelector('.load-more-btn');
        if (loadMoreBtn) {
            loadMoreBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading...';
            loadMoreBtn.disabled = true;
        }
        
        // Increment page number
        currentNotificationsPage++;
        
        // Fetch next page of notifications
        const data = await NotificationService.fetchNotifications(
            currentNotificationsFilter, 
            currentNotificationsPage
        );
        
        // Update pagination status
        hasMoreNotifications = currentNotificationsPage < data.totalPages;
        
        // Get container
        const notificationsList = document.querySelector('.all-notifications-list');
        if (!notificationsList) return;
        
        // Remove existing load more button
        const loadMoreContainer = notificationsList.querySelector('.load-more-container');
        if (loadMoreContainer) {
            loadMoreContainer.remove();
        }
        
        // Append new notifications
        data.notifications.forEach(notification => {
            // Format date as relative time
            const formattedDate = formatRelativeTime(new Date(notification.createdAt));
            
            // Determine CSS classes based on notification type and read status
            const typeClass = notification.type || 'info';
            const readClass = notification.isRead ? 'read' : 'unread';
            
            // Create notification item element
            const notificationItem = document.createElement('div');
            notificationItem.className = `notification-item ${typeClass} ${readClass}`;
            notificationItem.dataset.id = notification._id;
            
            notificationItem.innerHTML = `
                <div class="notification-icon">
                    ${getNotificationIcon(notification.type)}
                </div>
                <div class="notification-content">
                    <div class="notification-message">${notification.message}</div>
                    <div class="notification-time">${formattedDate}</div>
                </div>
                <div class="notification-actions">
                    ${!notification.isRead ? 
                      `<button class="mark-read-btn" onclick="markNotificationAsRead('${notification._id}')">
                          <i class="fas fa-check"></i>
                       </button>` : ''}
                    <button class="dismiss-btn" onclick="dismissNotification('${notification._id}')">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            `;
            
            // Add click event for notification items (mark as read when clicked)
            if (!notification.isRead) {
                notificationItem.addEventListener('click', function(e) {
                    // Don't trigger if clicking on action buttons
                    if (e.target.closest('.notification-actions')) {
                        return;
                    }
                    
                    const notificationId = this.dataset.id;
                    markNotificationAsRead(notificationId);
                });
            }
            
            // Append to list
            notificationsList.appendChild(notificationItem);
        });
        
        // Add "Load More" button if there are more notifications
        if (hasMoreNotifications) {
            const loadMoreContainer = document.createElement('div');
            loadMoreContainer.className = 'load-more-container';
            loadMoreContainer.innerHTML = `
                <button class="load-more-btn" onclick="loadMoreNotifications()">
                    <i class="fas fa-spinner"></i> Load More
                </button>
            `;
            notificationsList.appendChild(loadMoreContainer);
        }
        
    } catch (error) {
        console.error('Error loading more notifications:', error);
        
        // Reset load more button
        const loadMoreBtn = document.querySelector('.load-more-btn');
        if (loadMoreBtn) {
            loadMoreBtn.innerHTML = '<i class="fas fa-spinner"></i> Load More';
            loadMoreBtn.disabled = false;
        }
        
        showNotification('Failed to load more notifications', 'error');
    }
}

/**
 * Update the notification badge count
 * @param {number} count - Unread notification count
 */
function updateNotificationBadge(count) {
    unreadNotificationCount = count;
    
    // Update all notification badges
    document.querySelectorAll('.notification-badge').forEach(badge => {
        if (count > 0) {
            badge.textContent = count > 99 ? '99+' : count;
            badge.style.display = 'inline-flex';
        } else {
            badge.style.display = 'none';
        }
    });
    
    // Update any notification icons that might have a dot indicator
    document.querySelectorAll('.notification-icon-btn').forEach(icon => {
        if (count > 0) {
            icon.classList.add('has-notifications');
        } else {
            icon.classList.remove('has-notifications');
        }
    });
}

/**
 * Decrease the unread notification count by 1
 */
function decreaseUnreadCount() {
    if (unreadNotificationCount > 0) {
        updateNotificationBadge(unreadNotificationCount - 1);
    }
}

/**
 * Filter notifications by type
 * @param {string} filter - Filter type
 */
function filterNotifications(filter) {
    // Update current filter
    currentNotificationsFilter = filter;
    
    // Update active filter button
    document.querySelectorAll('.notification-filter-btn').forEach(btn => {
        if (btn.dataset.filter === filter) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
    
    // Reload notifications with new filter
    loadNotifications();
}

/**
 * Toggle the notifications panel
 */
function toggleNotificationsPanel() {
    const panel = document.getElementById('notificationsPanel');
    if (!panel) return;
    
    if (panel.classList.contains('show')) {
        hideNotificationsPanel();
    } else {
        showNotificationsPanel();
    }
}

/**
 * Show the notifications panel
 */
function showNotificationsPanel() {
    const panel = document.getElementById('notificationsPanel');
    if (!panel) return;
    
    panel.classList.add('show');
    
    // Load notifications if not already loaded
    if (!notificationsLoaded) {
        loadNotifications();
    }
    
    // Close when clicking outside
    document.addEventListener('click', closeNotificationsPanelOnClickOutside);
}

/**
 * Hide the notifications panel
 */
function hideNotificationsPanel() {
    const panel = document.getElementById('notificationsPanel');
    if (!panel) return;
    
    panel.classList.remove('show');
    
    // Remove outside click handler
    document.removeEventListener('click', closeNotificationsPanelOnClickOutside);
}

/**
 * Close notifications panel when clicking outside
 * @param {Event} event - Click event
 */
function closeNotificationsPanelOnClickOutside(event) {
    const panel = document.getElementById('notificationsPanel');
    const notificationBtn = document.querySelector('.notification-btn');
    
    if (panel && !panel.contains(event.target) && 
        notificationBtn && !notificationBtn.contains(event.target)) {
        hideNotificationsPanel();
    }
}

/**
 * Create the notifications panel if it doesn't exist
 */
function createNotificationsPanel() {
    // Check if panel already exists
    if (document.getElementById('notificationsPanel')) return;
    
    // Create panel element
    const panel = document.createElement('div');
    panel.id = 'notificationsPanel';
    panel.className = 'notifications-panel';
    
    panel.innerHTML = `
        <div class="notifications-header">
            <h3>Notifications</h3>
            <div class="notifications-actions">
                <button class="mark-all-read-btn" onclick="markAllNotificationsAsRead()">
                    Mark All Read
                </button>
                <button class="close-notifications-btn" onclick="hideNotificationsPanel()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        </div>
        <div class="notifications-filters">
            <button class="notification-filter-btn active" data-filter="all" onclick="filterNotifications('all')">
                All
            </button>
            <button class="notification-filter-btn" data-filter="unread" onclick="filterNotifications('unread')">
                Unread
            </button>
            <button class="notification-filter-btn" data-filter="issue" onclick="filterNotifications('issue')">
                Issues
            </button>
            <button class="notification-filter-btn" data-filter="assignment" onclick="filterNotifications('assignment')">
                Assignments
            </button>
        </div>
        <div class="all-notifications-list">
            <div class="notifications-loading">
                <i class="fas fa-spinner fa-spin"></i>
                <p>Loading notifications...</p>
            </div>
        </div>
    `;
    
    // Add to document body
    document.body.appendChild(panel);
}

/**
 * Add notification button to user menu if not already present
 */
function addNotificationButton() {
    // Check if button already exists
    if (document.querySelector('.notification-btn')) return;
    
    // Find user menu where button should be added
    const userMenu = document.querySelector('.user-menu');
    if (!userMenu) return;
    
    // Create button element
    const button = document.createElement('button');
    button.className = 'notification-btn notification-icon-btn';
    button.title = 'Notifications';
    button.setAttribute('aria-label', 'Notifications');
    button.onclick = toggleNotificationsPanel;
    
    button.innerHTML = `
        <i class="fas fa-bell"></i>
        <span class="notification-badge" style="display: none;">0</span>
    `;
    
    // Add button beside the theme icon
    userMenu.insertBefore(button, userMenu.firstChild);
}

/**
 * Initialize the notifications system
 */
function initializeNotifications() {
    // Create notifications panel
    createNotificationsPanel();
    
    // Add notification button
    addNotificationButton();
    
    // Check for notifications if user is logged in
    if (currentUser) {
        // Initial check for unread notifications
        checkForUnreadNotifications();
        
        // Set up polling for new notifications
        setInterval(checkForUnreadNotifications, 60000); // Check every minute
    }
}

/**
 * Check for unread notifications (silent check)
 */
async function checkForUnreadNotifications() {
    try {
        // Quick API call to get unread count only
        const token = localStorage.getItem('bup-token');
        if (!token) return;
        
        const response = await fetch('http://localhost:3000/api/notifications/unread-count', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) return;
        
        const data = await response.json();
        
        // Update badge with unread count
        updateNotificationBadge(data.unreadCount);
        
        // Show notification for new notifications if count increased
        if (data.unreadCount > unreadNotificationCount && unreadNotificationCount > 0) {
            showNotification('You have new notifications', 'info');
        }
    } catch (error) {
        console.error('Error checking for unread notifications:', error);
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    // Initialize notifications system
    initializeNotifications();
    
    // Listen for auth state changes
    window.addEventListener('authStateChanged', function(e) {
        if (e.detail && e.detail.user) {
            // User logged in, initialize notifications
            initializeNotifications();
            checkForUnreadNotifications();
        } else {
            // User logged out, reset notifications
            updateNotificationBadge(0);
            notificationsLoaded = false;
        }
    });
});

// Export functions to global scope
window.loadNotifications = loadNotifications;
window.markNotificationAsRead = markNotificationAsRead;
window.markAllNotificationsAsRead = markAllNotificationsAsRead;
window.dismissNotification = dismissNotification;
window.loadMoreNotifications = loadMoreNotifications;
window.filterNotifications = filterNotifications;
window.toggleNotificationsPanel = toggleNotificationsPanel;
window.showNotificationsPanel = showNotificationsPanel;
window.hideNotificationsPanel = hideNotificationsPanel;
