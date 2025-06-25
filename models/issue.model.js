const mongoose = require('mongoose');

const issueSchema = new mongoose.Schema({
    issueId: { type: String, required: true },
    id: { type: String }, // Always duplicate issueId for frontend compatibility
    category: { type: String, required: true },
    priority: { type: String, required: true },
    location: { type: String, required: true },
    specificLocation: String,
    description: { type: String, required: true },
    submittedBy: String, // (legacy, can be removed later)
    submitterName: String, // Add this field
    submitterEmail: String, // Add this field
    submittedDate: { type: Date, default: Date.now },
    status: { type: String, default: 'pending-review' },
    images: [String]
}, {
    timestamps: true
});

// Ensure id is always set to issueId before saving
issueSchema.pre('save', function(next) {
    this.id = this.issueId;
    next();
});

module.exports = mongoose.model('Issue', issueSchema);
