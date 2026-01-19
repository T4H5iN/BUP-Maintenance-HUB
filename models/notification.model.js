const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    message: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: ['info', 'success', 'warning', 'error', 'issue', 'assignment', 'comment'],
        default: 'info'
    },
    isRead: {
        type: Boolean,
        default: false
    },
    relatedIssueId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Issue',
        required: false
    },
    action: {
        type: String,
        required: false
    },
    actionLink: {
        type: String,
        required: false
    },
    createdAt: {
        type: Date,
        default: Date.now,
        index: true
    }
});

// Add indexes for better query performance
notificationSchema.index({ userId: 1, isRead: 1 });
notificationSchema.index({ createdAt: -1 });

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification;
