const express = require('express');
const router = express.Router();
const Issue = require('../models/issue.model');
const auth = require('../middleware/auth'); // Ensure you have the auth middleware

// Create a new issue
router.post('/', async (req, res) => {
    try {
        const data = req.body;
        
        // Ensure submittedBy contains the name string, not an ObjectId
        // Always set id = issueId for frontend compatibility
        const issue = new Issue({
            ...data,
            id: data.issueId,
            // Make sure submittedBy is a string name, not an ObjectId
            submittedBy: typeof data.submittedBy === 'string' ? data.submittedBy : 'Anonymous',
            // Store email if available
            submitterEmail: data.submitterEmail || data.email || null,
            // Ensure images are stored as an array of paths
            images: Array.isArray(data.images) ? data.images : []
        });

        await issue.save();
        res.status(201).json(issue);
    } catch (err) {
        console.error('Issue creation error:', err);
        res.status(500).json({ error: 'Failed to create issue' });
    }
});

// (Optional) Get all issues
router.get('/', async (req, res) => {
    try {
        const issues = await Issue.find().sort({ createdAt: -1 });
        res.json(issues);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Add a vote to an issue
router.post('/:id/vote', auth, async (req, res) => {
    try {
        const { id } = req.params;
        const { voteType } = req.body;
        const userEmail = req.user.email;

        // Validate vote type
        if (voteType !== 'up' && voteType !== 'down') {
            return res.status(400).json({ message: 'Invalid vote type' });
        }

        const issue = await Issue.findOne({ $or: [{ issueId: id }, { id: id }] });
        if (!issue) {
            return res.status(404).json({ message: 'Issue not found' });
        }

        // Initialize arrays if they don't exist
        if (!Array.isArray(issue.upvoters)) issue.upvoters = [];
        if (!Array.isArray(issue.downvoters)) issue.downvoters = [];
        if (typeof issue.upvotes !== 'number') issue.upvotes = 0;
        if (typeof issue.downvotes !== 'number') issue.downvotes = 0;

        // Check if user has already voted
        const hasUpvoted = issue.upvoters.includes(userEmail);
        const hasDownvoted = issue.downvoters.includes(userEmail);

        // Handle upvote
        if (voteType === 'up') {
            // If already upvoted, do nothing (handled by frontend as toggle)
            if (!hasUpvoted) {
                // If previously downvoted, remove downvote
                if (hasDownvoted) {
                    issue.downvoters = issue.downvoters.filter(email => email !== userEmail);
                    issue.downvotes = Math.max(0, issue.downvotes - 1);
                }
                
                // Add upvote
                issue.upvoters.push(userEmail);
                issue.upvotes = issue.upvotes + 1;
            }
        } 
        // Handle downvote
        else if (voteType === 'down') {
            // If already downvoted, do nothing (handled by frontend as toggle)
            if (!hasDownvoted) {
                // If previously upvoted, remove upvote
                if (hasUpvoted) {
                    issue.upvoters = issue.upvoters.filter(email => email !== userEmail);
                    issue.upvotes = Math.max(0, issue.upvotes - 1);
                }
                
                // Add downvote
                issue.downvoters.push(userEmail);
                issue.downvotes = issue.downvotes + 1;
            }
        }

        await issue.save();
        
        // Return more detailed response with issue data
        res.json({ 
            message: 'Vote recorded successfully',
            issue: {
                id: issue.id,
                upvotes: issue.upvotes,
                downvotes: issue.downvotes,
                upvoters: issue.upvoters,
                downvoters: issue.downvoters
            }
        });
    } catch (error) {
        console.error('Error adding vote:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Remove a vote from an issue
router.delete('/:id/vote', auth, async (req, res) => {
    try {
        const { id } = req.params;
        const userEmail = req.user.email;

        const issue = await Issue.findOne({ $or: [{ issueId: id }, { id: id }] });
        if (!issue) {
            return res.status(404).json({ message: 'Issue not found' });
        }

        // Initialize arrays if they don't exist
        if (!Array.isArray(issue.upvoters)) issue.upvoters = [];
        if (!Array.isArray(issue.downvoters)) issue.downvoters = [];
        if (typeof issue.upvotes !== 'number') issue.upvotes = 0;
        if (typeof issue.downvotes !== 'number') issue.downvotes = 0;

        // Check if user has already voted
        const hasUpvoted = issue.upvoters.includes(userEmail);
        const hasDownvoted = issue.downvoters.includes(userEmail);

        // Remove upvote if exists
        if (hasUpvoted) {
            issue.upvoters = issue.upvoters.filter(email => email !== userEmail);
            issue.upvotes = Math.max(0, issue.upvotes - 1);
        }
        
        // Remove downvote if exists
        if (hasDownvoted) {
            issue.downvoters = issue.downvoters.filter(email => email !== userEmail);
            issue.downvotes = Math.max(0, issue.downvotes - 1);
        }

        await issue.save();
        
        // Return more detailed response with issue data
        res.json({ 
            message: 'Vote removed successfully',
            issue: {
                id: issue.id,
                upvotes: issue.upvotes,
                downvotes: issue.downvotes,
                upvoters: issue.upvoters,
                downvoters: issue.downvoters
            }
        });
    } catch (error) {
        console.error('Error removing vote:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Update issue status (including rejection reason and schedule)
router.patch('/:id/status', async (req, res) => {
    try {
        const { id } = req.params;
        const { status, rejectReason, scheduledDate, scheduledTime, rescheduleReason } = req.body;

        const issue = await Issue.findOne({ $or: [{ issueId: id }, { id: id }] });
        if (!issue) {
            return res.status(404).json({ message: 'Issue not found' });
        }

        issue.status = status;
        if (status === 'rejected' && rejectReason) {
            issue.rejectReason = rejectReason;
        } else if (status !== 'rejected') {
            issue.rejectReason = undefined;
        }

        // Update schedule fields if provided
        if (scheduledDate) issue.scheduledDate = scheduledDate;
        if (scheduledTime) issue.scheduledTime = scheduledTime;
        if (rescheduleReason) issue.rescheduleReason = rescheduleReason;

        await issue.save();

        res.json({ message: 'Issue status updated', issue });
    } catch (err) {
        res.status(500).json({ message: 'Failed to update issue status', error: err.message });
    }
});

// Assign a technician to an issue
router.patch('/:id/assign', async (req, res) => {
    try {
        const { id } = req.params;
        const { technicianId } = req.body;
        if (!technicianId) {
            return res.status(400).json({ message: 'Technician ID is required' });
        }

        // Find the technician user
        const User = require('../models/user.model');
        const technician = await User.findById(technicianId);
        if (!technician || technician.role !== 'technician') {
            return res.status(404).json({ message: 'Technician not found' });
        }

        // Find the issue by issueId or id
        const issue = await Issue.findOne({ $or: [{ issueId: id }, { id: id }] });
        if (!issue) {
            return res.status(404).json({ message: 'Issue not found' });
        }

        // Assign the technician and update status
        issue.assignedTo = technician.name || technician.email;
        issue.status = 'assigned';
        await issue.save();

        res.json({
            message: 'Technician assigned successfully',
            assignedTo: issue.assignedTo,
            issueId: issue.issueId || issue.id
        });
    } catch (err) {
        res.status(500).json({ message: 'Failed to assign technician', error: err.message });
    }
});

// Get issues assigned to the logged-in technician
router.get('/assigned-to-me', auth, async (req, res) => {
    try {
        // Find issues where assignedTo matches technician's name or email
        const user = req.user;
        if (!user || user.role !== 'technician') {
            return res.status(403).json({ message: 'Access denied' });
        }
        const assignedIssues = await Issue.find({
            assignedTo: { $in: [user.name, user.email] }
        }).sort({ createdAt: -1 });
        res.json({ issues: assignedIssues });
    } catch (err) {
        res.status(500).json({ message: 'Failed to fetch assigned issues', error: err.message });
    }
});

// PATCH /api/issues/:id
router.patch('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        // Only try to match _id if id is a valid ObjectId (24 hex chars)
        const orQuery = [
            { issueId: id },
            { id: id }
        ];
        // Add _id only if id looks like a valid ObjectId
        if (/^[a-fA-F0-9]{24}$/.test(id)) {
            orQuery.push({ _id: id });
        }
        const issue = await Issue.findOne({ $or: orQuery });
        if (!issue) {
            return res.status(404).json({ message: 'Issue not found' });
        }

        // Only update fields that are present in the request body
        if (typeof req.body.progress !== 'undefined') issue.progress = req.body.progress;
        if (typeof req.body.status !== 'undefined') issue.status = req.body.status;
        if (typeof req.body.assignedTo !== 'undefined') issue.assignedTo = req.body.assignedTo;
        if (typeof req.body.rejectReason !== 'undefined') issue.rejectReason = req.body.rejectReason;
        // ...add any other updatable fields as needed...

        await issue.save();
        res.json(issue);
    } catch (err) {
        console.error('PATCH /api/issues/:id error:', err);
        res.status(500).json({ message: err.message || 'Failed to update issue' });
    }
});

module.exports = router;
