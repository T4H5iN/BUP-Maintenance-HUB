const express = require('express');
const router = express.Router();
const User = require('../models/user.model');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const SECRET_KEY = process.env.JWT_SECRET || 'your_jwt_secret';

// Helper to capitalize
function capitalize(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
}

// Get all users
router.get('/', async (req, res) => {
    try {
        const users = await User.find().select('-password');
        res.json(users);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get user by ID
router.get('/:id', async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('-password');
        if (!user) return res.status(404).json({ message: 'User not found' });
        res.json(user);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Create a new user (Register)
router.post('/', async (req, res) => {
    const { role, email, dept, password } = req.body;
    try {
        if (!role || !email || !dept || !password) {
            return res.status(400).json({ message: 'All fields are required' });
        }
        const exists = await User.findOne({ email });
        if (exists) return res.status(400).json({ message: 'Email already exists' });
        
        // Extract name from email
        let name = '';
        if (email.includes('@')) {
            // Faculty/staff: name@bup.edu.bd
            if (email.endsWith('@bup.edu.bd')) {
                name = email.split('@')[0].replace(/\./g, ' ').replace(/\b\w/g, l => l.toUpperCase());
            }
            // Student: mdtahsinul2254901057@student.bup.edu.bd
            else if (email.includes('@student.bup.edu.bd')) {
                const username = email.split('@')[0];
                // Try to extract name and id
                const match = username.match(/^([a-zA-Z]+)([a-zA-Z]+)(\d+)$/);
                if (match) {
                    // e.g. mdtahsinul2254901057
                    const firstName = match[1];
                    const lastName = match[2];
                    const studentId = match[3];
                    name = `${capitalize(firstName)} ${capitalize(lastName)} (${studentId})`;
                } else {
                    name = username;
                }
            } else {
                name = email.split('@')[0];
            }
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new User({ role, email, dept, password: hashedPassword, name });
        await user.save();
        res.status(201).json({ 
            message: 'User created successfully', 
            user: { ...user.toObject(), password: undefined } 
        });  
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Login endpoint
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ message: 'User not found' });
        const match = await bcrypt.compare(password, user.password);
        if (!match) return res.status(400).json({ message: 'Incorrect password' });
        const token = jwt.sign({ id: user._id }, SECRET_KEY, { expiresIn: "1h" });
        res.json({
            token,
            user: { 
                id: user._id, 
                role: user.role, 
                email: user.email, 
                dept: user.dept,
                name: user.name // Include name in response
            }
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update user by ID
router.put('/:id', async (req, res) => {
    const { role, email, dept, password } = req.body;
    try {
        const user = await User.findByIdAndUpdate(req.params.id, { role, email, dept, password }, { new: true }).select('-password');
        if (!user) return res.status(404).json({ message: 'User not found' });
        res.json({ message: 'User updated successfully', user });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Delete user by ID
router.delete('/:id', async (req, res) => {
    try {
        const user = await User.findByIdAndDelete(req.params.id);
        if (!user) return res.status(404).json({ message: 'User not found' });
        res.json({ message: 'User deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;