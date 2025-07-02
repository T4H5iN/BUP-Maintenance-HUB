const jwt = require('jsonwebtoken');
const User = require('../models/user.model');

const SECRET_KEY = process.env.JWT_SECRET || 'your_jwt_secret';

/**
 * Authentication middleware to verify JWT tokens
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const auth = async (req, res, next) => {
    try {
        // Get token from authorization header
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            return res.status(401).json({ message: 'Authentication required' });
        }

        // Check if the authorization header has the right format (Bearer token)
        const token = authHeader.startsWith('Bearer ') 
            ? authHeader.substring(7) 
            : authHeader;

        if (!token) {
            return res.status(401).json({ message: 'Invalid token format' });
        }

        // Verify the token
        const decoded = jwt.verify(token, SECRET_KEY);
        
        // Find the user by ID
        const user = await User.findById(decoded.id).select('-password');
        if (!user) {
            return res.status(401).json({ message: 'User not found' });
        }

        // Add user info to request object - ensure _id is accessible
        req.user = user;
        req.userId = user._id; // Specifically set userId for easy access
        
        // Continue to the next middleware or route handler
        next();
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ message: 'Invalid token' });
        } else if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ message: 'Token expired' });
        }
        
        console.error('Auth middleware error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = auth;
