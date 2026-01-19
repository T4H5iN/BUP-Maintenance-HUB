const notificationController = require('../controllers/notification.controller');
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
 * Middleware to generate notifications when issues are updated
 */
const notificationMiddleware = {
    /**
     * Generate notifications for issue status changes
     */
    issueStatusChange: async (req, res, next) => {
        // Store the original json method
        const originalJson = res.json;
        
        // Override the json method to intercept the response
        res.json = function(data) {
            // If the response includes updated issue data and status was changed
            if (data.issue && data.message && data.message.includes('status updated')) {
                // Generate notification asynchronously (don't await to prevent blocking)
                // Only try to create notification if we have valid data
                notificationController.notifyIssueStatusChange(
                    data.issue, 
                    data.issue.status || '',
                    req.user && req.user._id ? req.user._id : null // Use _id not id
                ).catch(err => console.error('Notification error:', err));
            }
            
            // Call the original json method
            return originalJson.call(this, data);
        };
        
        // Continue to the next middleware/controller
        next();
    },
    
    /**
     * Generate notifications for issue assignments
     */
    issueAssignment: async (req, res, next) => {
        // Store the original json method
        const originalJson = res.json;
        
        // Override the json method to intercept the response
        res.json = function(data) {
            // If the response includes assigned issue data
            if (data.issue && data.message && data.message.includes('assigned') && req.body.technicianId) {
                // Generate notification for the technician if valid ObjectId
                if (isValidObjectId(req.body.technicianId)) {
                    notificationController.notifyTechnicianAssignment(
                        data.issue, 
                        req.body.technicianId
                    ).catch(err => console.error('Notification error:', err));
                }
                
                // Generate notification for the submitter
                notificationController.notifyIssueStatusChange(
                    data.issue, 
                    data.issue.status === 'assigned' ? 'approved' : data.issue.status,
                    req.user && req.user._id ? req.user._id : null // Use _id not id
                ).catch(err => console.error('Notification error:', err));
            }
            
            // Call the original json method
            return originalJson.call(this, data);
        };
        
        // Continue to the next middleware/controller
        next();
    }
};

module.exports = notificationMiddleware;
