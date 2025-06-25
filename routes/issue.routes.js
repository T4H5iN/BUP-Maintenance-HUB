const express = require('express');
const router = express.Router();
const Issue = require('../models/issue.model');

// Create a new issue
router.post('/', async (req, res) => {
    try {
        const data = req.body;
        // Extract submitter info from email
        let submitterName = '';
        let submitterEmail = '';
        if (data.submittedBy && typeof data.submittedBy === 'string' && data.submittedBy.includes('@')) {
            submitterEmail = data.submittedBy;
            // Faculty/staff: name@bup.edu.bd
            if (submitterEmail.endsWith('@bup.edu.bd')) {
                submitterName = submitterEmail.split('@')[0].replace(/\./g, ' ').replace(/\b\w/g, l => l.toUpperCase());
            }
        } else if (data.submittedBy && typeof data.submittedBy === 'string' && data.submittedBy.includes('@student.bup.edu.bd')) {
            // Student: mdtahsinul2254901057@student.bup.edu.bd
            submitterEmail = data.submittedBy;
            const username = submitterEmail.split('@')[0];
            // Try to extract name and id
            const match = username.match(/^([a-zA-Z]+)([a-zA-Z]+)(\d+)$/);
            if (match) {
                // e.g. mdtahsinul2254901057
                const firstName = match[1];
                const lastName = match[2];
                const studentId = match[3];
                submitterName = `${capitalize(firstName)} ${capitalize(lastName)} (${studentId})`;
            } else {
                submitterName = username;
            }
        } else if (data.submittedBy) {
            submitterName = data.submittedBy;
        }

        // Helper to capitalize
        function capitalize(str) {
            if (!str) return '';
            return str.charAt(0).toUpperCase() + str.slice(1);
        }

        // Always set id = issueId for frontend compatibility
        const issue = new Issue({
            ...data,
            id: data.issueId,
            submitterName,
            submitterEmail
        });

        await issue.save();
        res.status(201).json(issue);
    } catch (err) {
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

module.exports = router;
