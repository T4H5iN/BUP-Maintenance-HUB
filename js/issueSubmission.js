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
        console.log('Uploaded image paths:', imagePaths); // Debug log
        
        const issueData = {
            issueId: generateIssueId(),
            category: document.getElementById('category').value,
            priority: document.getElementById('priority').value,
            location: document.getElementById('location').value,
            specificLocation: document.getElementById('specificLocation').value,
            description: document.getElementById('description').value,
            // Store submitter name in submittedBy
            submittedBy: currentUser.name || currentUser.email.split('@')[0],
            // Store submitter email
            submitterEmail: currentUser.email,
            // Store actual user ID reference separately
            submitterId: currentUser._id,
            submittedDate: new Date().toISOString(),
            status: 'pending-review',
            images: imagePaths // Include paths to uploaded images
        };

        console.log('Submitting issue data:', issueData); // Debug log

        // Get token from localStorage
        const token = localStorage.getItem('bup-token');
        const headers = { 'Content-Type': 'application/json' };
        
        // Add authorization header if token exists
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        // Send the issue to the server
        const response = await fetch('http://localhost:3000/api/issues', {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(issueData)
        });

        // Parse the response
        const data = await response.json();
        console.log('Server response:', data); // Debug log

        // Handle success
        if (response.ok) {
            // Clear form
            document.getElementById('issueForm').reset();
            
            // Clear image preview
            const imagePreview = document.getElementById('imagePreview');
            if (imagePreview) {
                imagePreview.innerHTML = '';
            }
            
            // Reset uploaded images array
            uploadedImages = [];
            
            // Show success notification
            showNotification('Issue reported successfully! You can track its status in your dashboard.', 'success');
            
            // Reload issues list if we're on the home page
            if (currentSection === 'home' && typeof loadAllIssuesFromBackend === 'function') {
                loadAllIssuesFromBackend();
            }
        } else {
            throw new Error(data.message || 'Failed to submit issue');
        }
    } catch (err) {
        console.error('Error submitting issue:', err);
        showNotification(err.message || 'Error submitting issue. Please try again.', 'error');
    }
}

// Add event listener to issue form when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    const issueForm = document.getElementById('issueForm');
    if (issueForm) {
        // Remove any existing event listeners
        issueForm.removeEventListener('submit', handleIssueSubmission);
        // Add fresh event listener
        issueForm.addEventListener('submit', handleIssueSubmission);
        console.log('Issue form submission listener attached');
    } else {
        console.warn('Issue form not found in DOM');
    }
});

// Make functions available globally
window.handleIssueSubmission = handleIssueSubmission;
window.generateIssueId = generateIssueId;
