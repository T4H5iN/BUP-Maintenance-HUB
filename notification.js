class NotificationSystem {
    constructor() {
        this.notifications = [];
        this.emailTemplates = {
            submission: 'Your maintenance issue has been submitted successfully.',
            statusUpdate: 'Your issue status has been updated.',
            completion: 'Your maintenance issue has been resolved.',
            overdue: 'Attention: Issue requires immediate action.'
        };
    }

    sendEmail(userEmail, type, issueId, additionalInfo = '') {
        const notification = {
            id: this.generateNotificationId(),
            type: 'email',
            recipient: userEmail,
            subject: this.getEmailSubject(type, issueId),
            message: this.getEmailMessage(type, issueId, additionalInfo),
            timestamp: new Date().toISOString(),
            status: 'sent'
        };

        this.notifications.push(notification);
        console.log('Email sent:', notification);
        
        this.simulateEmailDelivery(notification);
        
        return notification.id;
    }

    sendSMS(phoneNumber, type, issueId, additionalInfo = '') {
        const notification = {
            id: this.generateNotificationId(),
            type: 'sms',
            recipient: phoneNumber,
            message: this.getSMSMessage(type, issueId, additionalInfo),
            timestamp: new Date().toISOString(),
            status: 'sent'
        };

        this.notifications.push(notification);
        console.log('SMS sent:', notification);
        
        this.simulateSMSDelivery(notification);
        
        return notification.id;
    }

    sendPushNotification(userId, type, issueId, additionalInfo = '') {
        const notification = {
            id: this.generateNotificationId(),
            type: 'push',
            recipient: userId,
            title: this.getPushTitle(type),
            message: this.getPushMessage(type, issueId, additionalInfo),
            timestamp: new Date().toISOString(),
            status: 'sent'
        };

        this.notifications.push(notification);
        console.log('Push notification sent:', notification);
        
        this.showInAppNotification(notification);
        
        return notification.id;
    }

    getEmailSubject(type, issueId) {
        const subjects = {
            submission: `BUP Maintenance - Issue ${issueId} Submitted`,
            statusUpdate: `BUP Maintenance - Issue ${issueId} Status Update`,
            completion: `BUP Maintenance - Issue ${issueId} Resolved`,
            overdue: `BUP Maintenance - URGENT: Issue ${issueId} Overdue`
        };
        return subjects[type] || 'BUP Maintenance Notification';
    }

    getEmailMessage(type, issueId, additionalInfo) {
        const messages = {
            submission: `Dear User,\n\nYour maintenance issue ${issueId} has been submitted successfully. Our team will review it shortly.\n\n${additionalInfo}\n\nBest regards,\nBUP Maintenance Team`,
            statusUpdate: `Dear User,\n\nYour maintenance issue ${issueId} status has been updated.\n\nNew Status: ${additionalInfo}\n\nBest regards,\nBUP Maintenance Team`,
            completion: `Dear User,\n\nWe're pleased to inform you that your maintenance issue ${issueId} has been resolved.\n\n${additionalInfo}\n\nPlease rate your experience.\n\nBest regards,\nBUP Maintenance Team`,
            overdue: `Dear Authority,\n\nIssue ${issueId} has been pending for more than 7 days and requires immediate attention.\n\n${additionalInfo}\n\nPlease take necessary action.\n\nBUP Maintenance System`
        };
        return messages[type] || `Notification regarding issue ${issueId}`;
    }

    getSMSMessage(type, issueId, additionalInfo) {
        const messages = {
            submission: `BUP Maintenance: Issue ${issueId} submitted successfully. You'll receive updates shortly.`,
            statusUpdate: `BUP Maintenance: Issue ${issueId} status updated to ${additionalInfo}`,
            completion: `BUP Maintenance: Issue ${issueId} resolved. Please rate your experience.`,
            overdue: `BUP URGENT: Issue ${issueId} overdue. Immediate action required.`
        };
        return messages[type] || `BUP Maintenance notification for ${issueId}`;
    }

    getPushTitle(type) {
        const titles = {
            submission: 'Issue Submitted',
            statusUpdate: 'Status Update',
            completion: 'Issue Resolved',
            overdue: 'Urgent Action Required'
        };
        return titles[type] || 'BUP Maintenance';
    }

    getPushMessage(type, issueId, additionalInfo) {
        return this.getSMSMessage(type, issueId, additionalInfo);
    }

    simulateEmailDelivery(notification) {
        setTimeout(() => {
            notification.status = 'delivered';
            console.log(`Email delivered to ${notification.recipient}`);
        }, 1000);
    }

    simulateSMSDelivery(notification) {
        setTimeout(() => {
            notification.status = 'delivered';
            console.log(`SMS delivered to ${notification.recipient}`);
        }, 500);
    }

    showInAppNotification(notification) {
        if (typeof showNotification === 'function') {
            showNotification(notification.message, 'info');
        }
    }

    generateNotificationId() {
        return 'NTF' + Date.now() + Math.floor(Math.random() * 1000);
    }

    getNotificationHistory(userId) {
        return this.notifications.filter(n => 
            n.recipient === userId || n.recipient.includes(userId)
        );
    }

    markAsRead(notificationId) {
        const notification = this.notifications.find(n => n.id === notificationId);
        if (notification) {
            notification.read = true;
        }
    }
}

const notificationSystem = new NotificationSystem();

if (typeof module !== 'undefined' && module.exports) {
    module.exports = NotificationSystem;
}
