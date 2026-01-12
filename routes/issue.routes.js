const express = require('express');
const router = express.Router();
const Issue = require('../models/issue.model');
const auth = require('../middleware/auth'); // Ensure you have the auth middleware
const notificationMiddleware = require('../middleware/notification-middleware');
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

// Create a new issue
router.post('/', auth, async (req, res) => {
    try {
        const data = req.body;

        // Generate a unique issue ID if not provided
        if (!data.issueId) {
            const prefix = 'BUP';
            const timestamp = new Date().getTime();
            const random = Math.floor(Math.random() * 1000);
            data.issueId = `${prefix}${timestamp.toString().slice(-6)}${random}`;
        }

        // If authenticated, use current user's ID and name
        if (req.user) {
            data.submitterId = req.user._id; // Use _id (the MongoDB ObjectId)
            data.submittedBy = req.user.name || req.user.email.split('@')[0]; // Use name or fallback
            data.submitterEmail = req.user.email; // Store email
        }

        // Ensure submittedBy contains the name string, not an ObjectId
        // Always set id = issueId for frontend compatibility
        const issue = new Issue({
            ...data,
            id: data.issueId,
            // Make sure both fields are set correctly
            submittedBy: typeof data.submittedBy === 'string' ? data.submittedBy : 'Anonymous',
            submitterEmail: data.submitterEmail || data.email || null,
            submitterId: isValidObjectId(data.submitterId) ? data.submitterId : undefined,
            // Ensure images are stored as an array of paths
            images: Array.isArray(data.images) ? data.images : []
        });

        await issue.save();
        res.status(201).json(issue);
    } catch (err) {
        console.error('Issue creation error:', err);
        res.status(500).json({ message: 'Error creating issue', error: err.message });
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

// Update issue status
router.patch('/:issueId/status', auth, notificationMiddleware.issueStatusChange, async (req, res) => {
    try {
        const { issueId } = req.params;
        const { status, previousStatus } = req.body;

        if (!status) {
            return res.status(400).json({ message: 'Status is required' });
        }

        // Find and update the issue
        const issue = await Issue.findOne({ $or: [{ id: issueId }, { issueId: issueId }] });

        if (!issue) {
            return res.status(404).json({ message: 'Issue not found' });
        }

        // Store previous status for notification middleware
        req.body.previousStatus = issue.status;

        // Update the status
        issue.status = status;

        // Update other related fields based on status
        if (status === 'resolved') {
            issue.resolvedDate = new Date();
        }

        await issue.save();

        res.json({
            message: 'Issue status updated successfully',
            issue,
            previousStatus: req.body.previousStatus
        });
    } catch (err) {
        console.error('Error updating issue status:', err);
        res.status(500).json({ message: 'Failed to update issue status', error: err.message });
    }
});

// Assign a technician to an issue
router.patch('/:id/assign',
    auth,
    notificationMiddleware.issueAssignment,
    async (req, res) => {
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

            // Find the issue by issueId or id - NEVER try to use the string ID as _id directly
            const issue = await Issue.findOne({
                $or: [
                    { issueId: id },
                    { id: id }
                ]
            });

            if (!issue) {
                return res.status(404).json({ message: 'Issue not found' });
            }

            // Store both technician ID and name
            issue.assignedTo = technician._id; // Store the ObjectId reference
            issue.assignedToName = technician.name || technician.email; // Store name for display
            issue.status = 'assigned';
            await issue.save();

            res.json({
                message: 'Technician assigned successfully',
                issue: issue,
                assignedTo: issue.assignedToName,
                assignedToId: issue.assignedTo,
                issueId: issue.issueId || issue.id
            });
        } catch (err) {
            console.error('Error assigning technician:', err);
            res.status(500).json({ message: 'Failed to assign technician', error: err.message });
        }
    });

// Get issues assigned to the logged-in technician
router.get('/assigned-to-me', auth, async (req, res) => {
    try {
        // Get the authenticated user
        const user = req.user;
        if (!user) {
            return res.status(401).json({ message: 'Authentication required' });
        }

        if (user.role !== 'technician') {
            return res.status(403).json({ message: 'Access denied: not a technician' });
        }



        // First try finding issues where assignedTo is the user's ObjectId
        let assignedIssues = await Issue.find({
            assignedTo: user._id
        }).sort({ createdAt: -1 });

        // If no issues found by ID, try finding by email, name, or stored in assignedToName
        if (assignedIssues.length === 0) {


            // Create an array of possible identifiers
            const possibleIdentifiers = [
                user.email,
                user.name
            ].filter(Boolean); // Remove any undefined/null values

            if (possibleIdentifiers.length > 0) {
                try {
                    // Try to find issues where assignedTo equals any of the identifiers
                    // or where assignedToName equals any of the identifiers
                    assignedIssues = await Issue.find({
                        $or: [
                            { assignedTo: { $in: possibleIdentifiers } },
                            { assignedToName: { $in: possibleIdentifiers } }
                        ]
                    }).sort({ createdAt: -1 });
                } catch (lookupError) {
                    // This might fail if assignedTo is strictly typed as ObjectId
                    console.warn('Error during string lookup:', lookupError.message);

                    // Try one more approach - look for exact matches on assignedToName
                    assignedIssues = await Issue.find({
                        assignedToName: { $in: possibleIdentifiers }
                    }).sort({ createdAt: -1 });
                }
            }
        }


        res.json({ issues: assignedIssues });
    } catch (err) {
        console.error('Error fetching assigned issues:', err);
        res.status(500).json({
            message: 'Failed to fetch assigned issues',
            error: err.message,
            stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
        });
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
