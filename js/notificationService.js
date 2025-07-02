/**
 * Notification Service
 * Handles API calls for notification operations
 */

const NotificationService = {
    /**
     * Fetch notifications for the current user
     * @param {string} filter - Filter type: 'all', 'read', 'unread'
     * @param {number} page - Page number for pagination
     * @param {number} limit - Number of notifications per page
     * @returns {Promise} - Resolves to notifications data
     */
    fetchNotifications: async (filter = 'all', page = 1, limit = 10) => {
        try {
            const token = localStorage.getItem('bup-token');
            if (!token) {
                throw new Error('Authentication token not found');
            }
            
            const response = await fetch(`http://localhost:3000/api/notifications?filter=${filter}&page=${page}&limit=${limit}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to fetch notifications');
            }
            
            return await response.json();
        } catch (error) {
            console.error('Error fetching notifications:', error);
            throw error;
        }
    },
    
    /**
     * Mark a notification as read
     * @param {string} notificationId - ID of the notification to mark as read
     * @returns {Promise} - Resolves to success message
     */
    markAsRead: async (notificationId) => {
        try {
            const token = localStorage.getItem('bup-token');
            if (!token) {
                throw new Error('Authentication token not found');
            }
            
            const response = await fetch(`http://localhost:3000/api/notifications/${notificationId}/read`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to mark notification as read');
            }
            
            return await response.json();
        } catch (error) {
            console.error('Error marking notification as read:', error);
            throw error;
        }
    },
    
    /**
     * Mark all notifications as read
     * @returns {Promise} - Resolves to success message
     */
    markAllAsRead: async () => {
        try {
            const token = localStorage.getItem('bup-token');
            if (!token) {
                throw new Error('Authentication token not found');
            }
            
            const response = await fetch('http://localhost:3000/api/notifications/read-all', {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to mark all notifications as read');
            }
            
            return await response.json();
        } catch (error) {
            console.error('Error marking all notifications as read:', error);
            throw error;
        }
    },
    
    /**
     * Delete a notification
     * @param {string} notificationId - ID of the notification to delete
     * @returns {Promise} - Resolves to success message
     */
    deleteNotification: async (notificationId) => {
        try {
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
        } catch (error) {
            console.error('Error deleting notification:', error);
            throw error;
        }
    },
    
    /**
     * Get unread notification count
     * @returns {Promise<number>} - Number of unread notifications
     */
    getUnreadCount: async () => {
        try {
            const data = await NotificationService.fetchNotifications('unread', 1, 1);
            return data.totalNotifications || 0;
        } catch (error) {
            console.error('Error getting unread count:', error);
            return 0;
        }
    }
};

// Make available globally
window.NotificationService = NotificationService;
