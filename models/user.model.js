const mongoose = require('mongoose');
const userSchema = new mongoose.Schema({
    role: String,
    email: { type: String, unique: true },
    dept: String,
    password: String,
    name: String, // Add name field
    studentId: String, // Add studentId field to store IDs separately
    verified: { type: Boolean, default: false } // Add verified field
}, {
    timestamps: true
});
module.exports = mongoose.model('User', userSchema);
