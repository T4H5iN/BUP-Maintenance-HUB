const Notification = require('../models/notification.model');
const User = require('../models/user.model');
const mongoose = require('mongoose');

// Helper function to check if a string is a valid ObjectId
function isValidObjectId(id) {
    if (!id) return false;
    try {
        return mongoose.Types.ObjectId.isValid(id);
    } catch (err) {
        return false;
    }
}

/**
 * Get all notifications for a user
 */
exports.getUserNotifications = async (req, res) => {
    try {
        const userId = req.user._id;
        const { page = 1, limit = 10, filter = 'all' } = req.query;
        
        // Convert page and limit to numbers
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;
        
        // Build query based on filter
        let query = { userId };
        
        if (filter === 'unread') {
            query.isRead = false;
        } else if (['info', 'success', 'warning', 'error', 'issue', 'assignment', 'comment'].includes(filter)) {
            query.type = filter;
        }
        
        // Execute query with pagination
        const notifications = await Notification.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limitNum);
        
        // Get total count for pagination
        const totalCount = await Notification.countDocuments(query);
        const totalPages = Math.ceil(totalCount / limitNum);
        
        // Get unread count for badge
        const unreadCount = await Notification.countDocuments({ userId, isRead: false });
        
        res.json({
            notifications,
            totalCount,
            unreadCount,
            currentPage: pageNum,
            totalPages,
            hasNextPage: pageNum < totalPages,
            hasPrevPage: pageNum > 1
        });
    } catch (err) {
        console.error('Error getting notifications:', err);
        res.status(500).json({ message: 'Failed to get notifications', error: err.message });
    }
};

/**
 * Get unread notification count
 */
exports.getUnreadCount = async (req, res) => {
    try {
        const userId = req.user._id;
        
        // Get unread count
        const unreadCount = await Notification.countDocuments({ userId, isRead: false });
        
        res.json({ unreadCount });
    } catch (err) {
        console.error('Error getting unread count:', err);
        res.status(500).json({ message: 'Failed to get unread count', error: err.message });
    }
};

/**
 * Mark a notification as read
 */
exports.markAsRead = async (req, res) => {
    try {
        const userId = req.user._id;
        const { id } = req.params;
        
        // Find and update notification
        const notification = await Notification.findOneAndUpdate(
            { _id: id, userId },
            { isRead: true },
            { new: true }
        );
        
        if (!notification) {
            return res.status(404).json({ message: 'Notification not found' });
        }
        
        res.json({ message: 'Notification marked as read', notification });
    } catch (err) {
        console.error('Error marking notification as read:', err);
        res.status(500).json({ message: 'Failed to mark notification as read', error: err.message });
    }
};

/**
 * Mark all notifications as read
 */
exports.markAllAsRead = async (req, res) => {
    try {
        const userId = req.user._id;
        
        // Update all unread notifications
        const result = await Notification.updateMany(
            { userId, isRead: false },
            { isRead: true }
        );
        
        res.json({ 
            message: 'All notifications marked as read',
            count: result.modifiedCount
        });
    } catch (err) {
        console.error('Error marking all notifications as read:', err);
        res.status(500).json({ message: 'Failed to mark all notifications as read', error: err.message });
    }
};

/**
 * Delete a notification
 */
exports.deleteNotification = async (req, res) => {
    try {
        const userId = req.user._id;
        const { id } = req.params;
        
        // Find and delete notification
        const notification = await Notification.findOneAndDelete({ _id: id, userId });
        
        if (!notification) {
            return res.status(404).json({ message: 'Notification not found' });
        }
        
        res.json({ message: 'Notification deleted', notification });
    } catch (err) {
        console.error('Error deleting notification:', err);
        res.status(500).json({ message: 'Failed to delete notification', error: err.message });
    }
};

/**
 * Create issue notification for different stakeholders
 */
exports.createIssueNotification = async (issue, action) => {
    try {
        const notifications = [];
        
        // Get issue details
        const issueDetails = typeof issue.toObject === 'function' ? issue.toObject() : issue;
        const issueId = issue._id || issue.id;
        
        // Determine notification type and message based on action
        let type, message;
        
        switch (action) {
            case 'created':
                type = 'info';
                message = `New issue reported: ${getIssueTitle(issue)}`;
                break;
            case 'approved':
                type = 'success';
                message = `Your issue #${issue.issueId || issueId} has been approved and is pending assignment.`;
                break;
            case 'rejected':
                type = 'error';
                message = `Your issue #${issue.issueId || issueId} has been rejected. Please check for comments.`;
                break;
            case 'assigned':
                type = 'info';
                message = `Your issue #${issue.issueId || issueId} has been assigned to a technician.`;
                break;
            case 'in-progress':
                type = 'info';
                message = `Work has started on your issue #${issue.issueId || issueId}.`;
                break;
            case 'resolved':
                type = 'success';
                message = `Your issue #${issue.issueId || issueId} has been resolved!`;
                break;
            case 'comment':
                type = 'comment';
                message = `New comment on your issue #${issue.issueId || issueId}.`;
                break;
            default:
                type = 'info';
                message = `Update on your issue #${issue.issueId || issueId}.`;
        }
        
        // We need to handle various ways the submitter ID might be stored
        let submitterId = null;
        
        // First try submitterId (ObjectId reference)
        if (issue.submitterId && isValidObjectId(issue.submitterId)) {
            submitterId = issue.submitterId;
        } 
        // If not found, try to look up user by email
        else if (issue.submitterEmail) {
            try {
                const user = await User.findOne({ email: issue.submitterEmail });
                if (user && user._id) {
                    submitterId = user._id;
                }
            } catch (err) {
                console.error('Error finding user by email:', err);
            }
        }
        
        // Create notification for issue submitter if we found a valid ID
        if (submitterId && isValidObjectId(submitterId)) {
            const submitterNotification = new Notification({
                userId: submitterId,
                message,
                type,
                relatedIssueId: issueId,
                action,
                actionLink: `/dashboard?issue=${issueId}`
            });
            
            await submitterNotification.save();
            notifications.push(submitterNotification);
        } else {
            console.warn(`Cannot create notification: No valid user ID found for issue ${issueId}`);
        }
        
        // For specific actions, notify other stakeholders
        if (action === 'created') {
            // Notify moderators about new issues
            const moderators = await User.find({ role: 'moderator' }).select('_id');
            
            for (const moderator of moderators) {
                if (isValidObjectId(moderator._id)) {
                    const moderatorNotification = new Notification({
                        userId: moderator._id,
                        message: `New issue reported: ${getIssueTitle(issue)}`,
                        type: 'issue',
                        relatedIssueId: issueId,
                        action: 'review',
                        actionLink: `/dashboard?issue=${issueId}`
                    });
                    
                    await moderatorNotification.save();
                    notifications.push(moderatorNotification);
                }
            }
        } else if (action === 'assigned' && issue.assignedTo && isValidObjectId(issue.assignedTo)) {
            // Notify assigned technician
            const technicianNotification = new Notification({
                userId: issue.assignedTo,
                message: `You have been assigned to issue #${issue.issueId || issueId}: ${getIssueTitle(issue)}`,
                type: 'assignment',
                relatedIssueId: issueId,
                action: 'view',
                actionLink: `/dashboard?issue=${issueId}`
            });
            
            await technicianNotification.save();
            notifications.push(technicianNotification);
        }
        
        return notifications;
    } catch (err) {
        console.error('Error creating issue notifications:', err);
        return [];
    }
};

/**
 * Create system notification for a user
 */
exports.createUserNotification = async (userId, message, type = 'info', relatedData = {}) => {
    try {
        // Validate userId is a valid ObjectId
        if (!isValidObjectId(userId)) {
            console.warn(`Invalid ObjectId for userId: ${userId}. Notification not created.`);
            return null;
        }
        
        const notification = new Notification({
            userId,
            message,
            type,
            ...relatedData
        });
        
        await notification.save();
        return notification;
    } catch (err) {
        console.error('Error creating user notification:', err);
        return null;
    }
};

/**
 * Utility: Notify technician about assignment
 */
exports.notifyTechnicianAssignment = async (issue, technicianId) => {
    try {
        if (!issue || !technicianId) return null;
        
        // Validate technician ID is a valid ObjectId
        if (!isValidObjectId(technicianId)) {
            console.warn(`Invalid ObjectId for technicianId: ${technicianId}. Notification not created.`);
            return null;
        }
        
        const issueId = issue._id || issue.id;
        
        const notification = new Notification({
            userId: technicianId,
            message: `You have been assigned to issue #${issue.issueId || issueId}: ${getIssueTitle(issue)}`,
            type: 'assignment',
            relatedIssueId: issueId,
            action: 'view',
            actionLink: `/dashboard?issue=${issueId}`
        });
        
        await notification.save();
        return notification;
    } catch (err) {
        console.error('Error notifying technician:', err);
        return null;
    }
};

/**
 * Utility: Notify about issue status change
 */
exports.notifyIssueStatusChange = async (issue, status, actorId) => {
    try {
        if (!issue) return null;
        
        const issueId = issue._id || issue.id;
        
        // First try to use submitterId (which should be an ObjectId)
        let submitterId = null;
        
        // First try submitterId (ObjectId reference)
        if (issue.submitterId && isValidObjectId(issue.submitterId)) {
            submitterId = issue.submitterId;
        } 
        // If not found, try to look up user by email
        else if (issue.submitterEmail) {
            try {
                const user = await User.findOne({ email: issue.submitterEmail });
                if (user && user._id) {
                    submitterId = user._id;
                }
            } catch (err) {
                console.error('Error finding user by email:', err);
            }
        }
        
        // If we still don't have a valid ObjectId, we can't create a notification
        if (!submitterId || !isValidObjectId(submitterId)) {
            console.warn(`No valid user ID for issue ${issueId}. Notification not created.`);
            return null;
        }
        
        // Skip self-notifications (if actor is the submitter)
        if (actorId && actorId.toString() === submitterId.toString()) {
            return null;
        }
        
        // Determine message based on status
        let message, type;
        
        switch (status) {
            case 'approved':
                type = 'success';
                message = `Your issue #${issue.issueId || issueId} has been approved.`;
                break;
            case 'rejected':
                type = 'error';
                message = `Your issue #${issue.issueId || issueId} has been rejected.`;
                break;
            case 'assigned':
                type = 'info';
                message = `A technician has been assigned to your issue #${issue.issueId || issueId}.`;
                break;
            case 'in-progress':
                type = 'info';
                message = `Work has started on your issue #${issue.issueId || issueId}.`;
                break;
            case 'resolved':
                type = 'success';
                message = `Your issue #${issue.issueId || issueId} has been resolved!`;
                break;
            default:
                type = 'info';
                message = `Your issue #${issue.issueId || issueId} status has been updated to ${status}.`;
        }
        
        const notification = new Notification({
            userId: submitterId,
            message,
            type,
            relatedIssueId: issueId,
            action: 'view',
            actionLink: `/dashboard?issue=${issueId}`
        });
        
        await notification.save();
        return notification;
    } catch (err) {
        console.error('Error notifying about status change:', err);
        return null;
    }
};

/**
 * Helper to get a title for an issue
 */
function getIssueTitle(issue) {
    // Try to get a meaningful title from different fields
    return issue.title || issue.subject || 
           (issue.description ? 
               (issue.description.length > 30 ? 
                   issue.description.substring(0, 30) + '...' : 
                   issue.description) : 
               'Untitled Issue');
}
