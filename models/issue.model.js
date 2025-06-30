const mongoose = require('mongoose');

const issueSchema = new mongoose.Schema({
    issueId: { type: String, required: true },
    id: { type: String }, // Always duplicate issueId for frontend compatibility
    category: { type: String, required: true },
    priority: { type: String, required: true },
    location: { type: String, required: true },
    specificLocation: String,
    description: { type: String, required: true },
    submittedBy: String, // Store submitter's name
    submitterEmail: String, // Store email separately
    submittedDate: { type: Date, default: Date.now },
    status: { type: String, default: 'pending-review' },
    images: [String], // Store paths to uploaded images
    progressUpdates: [{
        date: { type: Date, default: Date.now },
        by: String,
        note: String
    }],
    assignedTo: String,
    scheduledDate: Date,
    scheduledTime: String,
    // Add vote tracking
    upvotes: { type: Number, default: 0 },
    downvotes: { type: Number, default: 0 },
    upvoters: [String], // Store email addresses of users who upvoted
    downvoters: [String], // Store email addresses of users who downvoted
    rejectReason: { type: String } // Add this line
}, {
    timestamps: true
});

// Ensure id is always set to issueId before saving
issueSchema.pre('save', function(next) {
    this.id = this.issueId;
    next();
});

module.exports = mongoose.model('Issue', issueSchema);
