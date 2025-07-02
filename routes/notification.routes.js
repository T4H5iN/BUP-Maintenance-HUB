const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notification.controller');
const auth = require('../middleware/auth');

// Get all notifications for the authenticated user
router.get('/', auth, notificationController.getUserNotifications);

// Get unread notification count
router.get('/unread-count', auth, notificationController.getUnreadCount);

// Mark a notification as read
router.patch('/:id/read', auth, notificationController.markAsRead);

// Mark all notifications as read
router.patch('/mark-all-read', auth, notificationController.markAllAsRead);

// Delete a notification
router.delete('/:id', auth, notificationController.deleteNotification);

module.exports = router;
