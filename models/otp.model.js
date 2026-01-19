const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema({
    email: { 
        type: String, 
        required: true 
    },
    otp: { 
        type: String, 
        required: true 
    },
    createdAt: { 
        type: Date, 
        default: Date.now,
        expires: 3600 // OTP expires after 1 hour
    }
});

module.exports = mongoose.model('OTP', otpSchema);
