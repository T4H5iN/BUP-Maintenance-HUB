const express = require('express');
const router = express.Router();
const User = require('../models/user.model');
const OTP = require('../models/otp.model');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');

const SECRET_KEY = process.env.JWT_SECRET || 'your_jwt_secret';

// Helper to capitalize
function capitalize(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
}

// Configure nodemailer transporter
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// Generate a random 6-digit OTP
function generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

// Clean up the sendOTPEmail function while keeping improved deliverability
async function sendOTPEmail(email, otp, subject = 'Email Verification') {
    const mailOptions = {
        from: {
            name: 'BUP Maintenance HUB',
            address: process.env.EMAIL_USER
        },
        to: email,
        subject: `BUP Maintenance HUB - ${subject}`,
        // Add plain text alternative for better deliverability
        text: `Your verification code for BUP Maintenance HUB is: ${otp}\n\nThis code will expire in 1 hour.\n\nIf you did not request this verification, please ignore this email.\n\nIMPORTANT: If you don't see emails from us, please check your spam/junk folder and mark our emails as 'Not Spam'.`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
                <h2 style="color: #1e3a8a; text-align: center;">BUP Maintenance HUB</h2>
                <h3 style="text-align: center;">${subject}</h3>
                <p>Please use the following verification code to ${subject === 'Email Verification' ? 'complete your registration' : 'reset your password'}:</p>
                <div style="text-align: center; margin: 30px 0;">
                    <div style="font-size: 24px; font-weight: bold; background-color: #f3f4f6; padding: 15px; border-radius: 5px; letter-spacing: 5px;">${otp}</div>
                </div>
                <p>This verification code will expire in 1 hour.</p>
                <p>If you did not request this verification, please ignore this email.</p>
                <div style="margin-top: 20px; padding: 10px; background-color: #f8f9fa; border-left: 4px solid #4a90e2; border-radius: 4px;">
                    <p style="margin: 0; font-weight: bold;">Can't find our emails?</p>
                    <p style="margin-top: 5px;">Please check your spam/junk folder and mark our emails as 'Not Spam' to ensure you receive future communications.</p>
                </div>
                <p style="margin-top: 30px; font-size: 14px; color: #666; text-align: center;">© ${new Date().getFullYear()} BUP Maintenance HUB</p>
            </div>
        `,
        // Add headers to improve deliverability
        headers: {
            'X-Priority': '1',
            'X-MSMail-Priority': 'High',
            'Importance': 'High',
            'X-Entity-Ref-ID': `BUP-${Date.now()}`
        }
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        return info;
    } catch (error) {
        console.error('Error sending email:', error);
        throw error;
    }
}

// Get all users, or filter by role if ?role=technician is provided
router.get('/', async (req, res) => {
    try {
        const filter = {};
        if (req.query.role) {
            filter.role = req.query.role;
        }
        const users = await User.find(filter).select('-password');
        res.json({ users });
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
        
        // Validate that the email is from an allowed BUP domain
        const validDomains = ['@bup.edu.bd', '@student.bup.edu.bd'];
        const isValidEmail = validDomains.some(domain => email.toLowerCase().endsWith(domain));
        
        if (!isValidEmail) {
            return res.status(400).json({ 
                message: 'Only @bup.edu.bd or @student.bup.edu.bd email addresses are allowed' 
            });
        }
        
        const exists = await User.findOne({ email });
        if (exists) return res.status(400).json({ message: 'Email already exists' });
        
        // Extract name from email
        let name = '';
        let studentId = null;
        
        if (email.includes('@')) {
            // Faculty/staff: name@bup.edu.bd
            if (email.endsWith('@bup.edu.bd')) {
                name = email.split('@')[0].replace(/\./g, ' ').replace(/\b\w/g, l => l.toUpperCase());
            }
            // Student: mdtahsinul2254901057@student.bup.edu.bd
            else if (email.includes('@student.bup.edu.bd')) {
                const username = email.split('@')[0];
                // Updated regex to extract name and ID correctly
                const match = username.match(/^([a-zA-Z]+)(\d+)$/);
                if (match) {
                    // e.g. mdtahsinul2254901057
                    const studentName = match[1];
                    studentId = match[2];
                    // Store only the name without the ID
                    name = capitalize(studentName);
                } else {
                    name = username;
                }
            } else {
                name = email.split('@')[0];
            }
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        
        // Create user with verified=false
        const user = new User({ 
            role, 
            email, 
            dept, 
            password: hashedPassword, 
            name,
            studentId, // Add the studentId field
            verified: false 
        });
        await user.save();
        
        // Generate OTP and save it
        const otp = generateOTP();
        const otpDoc = new OTP({ email, otp });
        await otpDoc.save();
        
        // Send verification email
        await sendOTPEmail(email, otp);
        
        res.status(201).json({ 
            message: 'User created successfully. Please check your email for verification code.', 
            user: { ...user.toObject(), password: undefined },
            requiresVerification: true
        });  
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Verify OTP
router.post('/verify-otp', async (req, res) => {
    const { email, otp } = req.body;
    
    try {
        // Find the OTP document
        const otpDoc = await OTP.findOne({ email, otp });
                
        if (!otpDoc) {
            // Log all OTPs for this email to help debugging
            const allOtps = await OTP.find({ email });
            console.log(`Found ${allOtps.length} OTPs for ${email}:`, 
                allOtps.map(doc => ({ otp: doc.otp, createdAt: doc.createdAt })));
                
            return res.status(400).json({ message: 'Invalid or expired verification code' });
        }
        
        // Update user to verified
        const user = await User.findOneAndUpdate(
            { email },
            { verified: true },
            { new: true }
        ).select('-password');
        
        if (!user) {
            console.log('No user found with email:', email);
            return res.status(404).json({ message: 'User not found' });
        }
        
        // Delete the OTP document
        await OTP.deleteOne({ _id: otpDoc._id });
        
        // Generate token
        const token = jwt.sign({ id: user._id }, SECRET_KEY, { expiresIn: "1h" });
        
        res.json({
            message: 'Email verified successfully',
            token,
            user
        });
    } catch (err) {
        console.error('OTP verification error:', err);
        res.status(500).json({ error: err.message });
    }
});

// Resend OTP
router.post('/resend-otp', async (req, res) => {
    const { email } = req.body;
    
    try {
        // Check if user exists
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        // Delete existing OTP if any
        await OTP.deleteMany({ email });
        
        // Generate new OTP and save it
        const otp = generateOTP();
        const otpDoc = new OTP({ email, otp });
        await otpDoc.save();
        
        // Send verification email
        await sendOTPEmail(email, otp);
        
        res.json({ message: 'Verification code resent to your email' });
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
        
        // Check if user is verified
        if (!user.verified) {
            // Generate a new OTP
            const otp = generateOTP();
            
            // Delete any existing OTP for this user
            await OTP.deleteMany({ email });
            
            // Save the new OTP
            const otpDoc = new OTP({ email, otp });
            await otpDoc.save();
            
            // Send verification email
            await sendOTPEmail(email, otp);
            
            return res.status(403).json({ 
                message: 'Email not verified. A new verification code has been sent to your email.',
                requiresVerification: true
            });
        }
        
        // User authenticated successfully - role is determined from the database
        const token = jwt.sign({ id: user._id }, SECRET_KEY, { expiresIn: "1h" });
        
        res.json({
            token,
            user: { 
                id: user._id, 
                role: user.role,
                email: user.email, 
                dept: user.dept,
                name: user.name
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

// Forgot password endpoint
router.post('/forgot-password', async (req, res) => {
    const { email } = req.body;
    
    try {
        // Check if user exists
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        // Delete existing OTP if any
        await OTP.deleteMany({ email });
        
        // Generate new OTP and save it
        const otp = generateOTP();
        const otpDoc = new OTP({ email, otp });
        await otpDoc.save();
        
        // Send verification email
        await sendOTPEmail(email, otp, 'Password Reset');
        
        res.json({ 
            message: 'Password reset verification code sent to your email',
            email
        });
    } catch (err) {
        console.error('Forgot password error:', err);
        res.status(500).json({ error: err.message });
    }
});

// Verify reset OTP
router.post('/verify-reset-otp', async (req, res) => {
    const { email, otp } = req.body;
    
    try {
        // Find the OTP document
        const otpDoc = await OTP.findOne({ email, otp });
        
        if (!otpDoc) {
            return res.status(400).json({ message: 'Invalid or expired verification code' });
        }
        
        // Generate temporary reset token
        const resetToken = jwt.sign({ email }, SECRET_KEY, { expiresIn: "15m" });
        
        // Delete the OTP document
        await OTP.deleteOne({ _id: otpDoc._id });
        
        res.json({
            message: 'Email verified. You can now reset your password.',
            email,
            resetToken
        });
    } catch (err) {
        console.error('Verify reset OTP error:', err);
        res.status(500).json({ error: err.message });
    }
});

// Reset password
router.post('/reset-password', async (req, res) => {
    const { email, resetToken, newPassword } = req.body;
    
    try {
        // Verify reset token
        jwt.verify(resetToken, SECRET_KEY);
        
        // Find user
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        
        // Update user password
        user.password = hashedPassword;
        await user.save();
        
        res.json({ message: 'Password reset successful. You can now login with your new password.' });
    } catch (err) {
        console.error('Reset password error:', err);
        
        if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
            return res.status(401).json({ message: 'Invalid or expired reset token' });
        }
        
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;