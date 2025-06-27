// Issue submission functionality

// Generate a unique issue ID
function generateIssueId() {
    const prefix = 'BUP';
    const randomPart = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `${prefix}${randomPart}`;
}

// Handle issue form submission
async function handleIssueSubmission(e) {
    e.preventDefault();
    
    if (!currentUser) {
        showNotification('Please login to submit an issue', 'warning');
        showLoginModal();
        return;
    }

    // Show loading state
    showNotification('Uploading images and submitting issue...', 'info');
    
    try {
        // First, upload any images
        const imagePaths = await uploadImages();
        
        const issueData = {
            issueId: generateIssueId(),
            category: document.getElementById('category').value,
            priority: document.getElementById('priority').value,
            location: document.getElementById('location').value,
            specificLocation: document.getElementById('specificLocation').value,
            description: document.getElementById('description').value,
            submittedBy: currentUser.name || currentUser.email,
            submitterEmail: currentUser.email,
            submittedDate: new Date().toISOString(),
            status: 'pending-review',
            images: imagePaths // Include paths to uploaded images
        };

        // Get token from localStorage
        const token = localStorage.getItem('bup-token');
        const headers = { 'Content-Type': 'application/json' };
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        
        const res = await fetch('http://localhost:3000/api/issues', {
            method: 'POST',
            headers,
            body: JSON.stringify(issueData)
        });
        
        const data = await res.json();
        if (!res.ok) {
            showNotification(data.error || 'Failed to submit issue', 'error');
            return;
        }
        
        showNotification('Issue submitted successfully! You will receive updates via email/SMS.', 'success');
        document.getElementById('issueForm').reset();
        document.getElementById('imagePreview').innerHTML = '';
        
        // Reset uploaded images - access the variable from imageHandler.js
        if (typeof window.uploadedImages !== 'undefined') {
            window.uploadedImages = [];
        } else {
            // If not directly accessible, use empty array for next upload
            uploadedImages = [];
        }
        
        // Refresh the issues list
        updateHomeIssuesList();
    } catch (err) {
        console.error('Submission error:', err);
        showNotification('Failed to submit issue', 'error');
    }
}

// Add event listener to issue form when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    const issueForm = document.getElementById('issueForm');
    if (issueForm) {
        issueForm.addEventListener('submit', handleIssueSubmission);
    }
});

// Make functions available globally
window.handleIssueSubmission = handleIssueSubmission;
window.generateIssueId = generateIssueId;
