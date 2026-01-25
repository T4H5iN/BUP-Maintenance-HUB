const mongoose = require('mongoose');

// Make sure we have separate fields for submitterId (ObjectId) and submittedBy (String)
const issueSchema = new mongoose.Schema({
    issueId: { type: String, required: true },
    id: { type: String }, // Always duplicate issueId for frontend compatibility
    category: { type: String, required: true },
    priority: { type: String, required: true },
    location: { type: String, required: true },
    specificLocation: String,
    description: { type: String, required: true },
    submittedBy: String, // Store submitter's name as string
    submitterEmail: String, // Store email separately
    submitterId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Store reference to user model
    submittedDate: { type: Date, default: Date.now },
    status: { type: String, default: 'pending-review', index: true },
    images: [String], // Store paths to uploaded images
    progress: { type: Number, default: 0 },
    progressUpdates: [{
        date: { type: Date, default: Date.now },
        by: String,
        note: String
    }],
    // Update assignedTo to allow both ObjectId and String types for backward compatibility
    assignedTo: {
        type: mongoose.Schema.Types.Mixed, // Allow both ObjectId and String
        ref: 'User',
        index: true
    },
    assignedToName: String, // Store technician name for display
    scheduledDate: Date,
    scheduledTime: String,
    // Add vote tracking
    upvotes: { type: Number, default: 0 },
    downvotes: { type: Number, default: 0 },
    upvoters: [String], // Store email addresses of users who upvoted
    downvoters: [String], // Store email addresses of users who downvoted
    rejectReason: { type: String },
    // Feedback fields
    rating: { type: Number, min: 1, max: 5 },
    feedbackComment: String,
    feedbackDate: Date,
    feedbackBy: String,
    fullyResolved: { type: Boolean },
    resolvedDate: Date
}, {
    timestamps: true
});

// Ensure id is always set to issueId before saving
issueSchema.pre('save', function (next) {
    this.id = this.issueId;
    next();
});

module.exports = mongoose.model('Issue', issueSchema);
