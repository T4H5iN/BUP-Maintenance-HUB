const mongoose = require('mongoose');
const userSchema = new mongoose.Schema({
    role: { type: String, index: true },
    email: { type: String, unique: true },
    dept: String,
    password: String,
    name: String, // Add name field
    studentId: { type: String, index: true }, // Add studentId field to store IDs separately
    verified: { type: Boolean, default: false }, // Add verified field
    refreshTokens: [{
        token: String,
        expiresAt: Date
    }]
}, {
    timestamps: true
});
module.exports = mongoose.model('User', userSchema);
