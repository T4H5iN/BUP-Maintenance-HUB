const mongoose = require('mongoose');
const userSchema = new mongoose.Schema({
    role: String,
    email: { type: String, unique: true },
    dept: String,
    password: String,
    name: String // Add name field
}, {
    timestamps: true
});
module.exports = mongoose.model('User', userSchema);
