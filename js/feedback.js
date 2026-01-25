/**
 * Feedback functionality for resolved issues
 * Allows users to rate and provide feedback on resolved maintenance issues
 */

/**
 * Show feedback modal for a resolved issue
 * @param {string} issueId - The ID of the issue to provide feedback for
 */
function provideFeedback(issueId) {
    // Find the issue
    const issue = (window.issues || []).find(i => (i.issueId || i.id) === issueId);
    if (!issue) {
        showNotification('Issue not found', 'error');
        return;
    }

    // Check if issue is resolved
    if (issue.status !== 'resolved') {
        showNotification('Feedback can only be provided for resolved issues', 'warning');
        return;
    }

    // Check if user is logged in
    if (!currentUser) {
        showNotification('Please log in to provide feedback', 'warning');
        return;
    }

    // Check if feedback was already provided
    if (issue.rating) {
        showNotification('You have already provided feedback for this issue', 'info');
        return;
    }

    // Remove any existing feedback modal
    const existingModal = document.getElementById('feedbackModal');
    if (existingModal) existingModal.remove();

    // Create the feedback modal
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.id = 'feedbackModal';

    modal.innerHTML = `
        <div class="modal-content feedback-modal">
            <span class="close" onclick="closeFeedbackModal()">&times;</span>
            <h2>Provide Feedback</h2>
            <p class="feedback-issue-info">Issue #${issueId} - ${formatCategoryName(issue.category)} Issue</p>
            
            <form id="feedbackForm">
                <input type="hidden" id="feedbackIssueId" value="${issueId}">
                
                <div class="form-group">
                    <label>How would you rate the resolution of this issue?</label>
                    <div class="star-rating" id="starRating">
                        <i class="far fa-star" data-rating="1"></i>
                        <i class="far fa-star" data-rating="2"></i>
                        <i class="far fa-star" data-rating="3"></i>
                        <i class="far fa-star" data-rating="4"></i>
                        <i class="far fa-star" data-rating="5"></i>
                    </div>
                    <input type="hidden" id="ratingValue" value="0" required>
                    <p class="rating-text" id="ratingText">Click to rate</p>
                    <div id="ratingError" class="error-message" style="display:none; color: #dc2626; font-size: 0.9rem; margin-top: 5px;">
                        <i class="fas fa-exclamation-circle"></i> Please select a rating
                    </div>
                </div>
                
                <div class="form-group">
                    <label for="feedbackComment">Additional Comments (Optional):</label>
                    <textarea id="feedbackComment" rows="4" placeholder="Share your experience with the maintenance service..." maxlength="500"></textarea>
                </div>
                
                <div class="form-group checkbox-group">
                    <input type="checkbox" id="issueFullyResolved" checked>
                    <label for="issueFullyResolved">The issue was fully resolved</label>
                </div>
                
                <div class="feedback-actions">
                    <button type="submit" class="btn-primary" id="submitFeedbackBtn">
                        <i class="fas fa-paper-plane"></i> Submit Feedback
                    </button>
                    <button type="button" class="btn-secondary" onclick="closeFeedbackModal()">
                        Cancel
                    </button>
                </div>
            </form>
        </div>
    `;

    document.body.appendChild(modal);
    modal.style.display = 'block';

    // Setup star rating functionality
    setupStarRating();

    // Setup form submission
    document.getElementById('feedbackForm').addEventListener('submit', handleFeedbackSubmit);

    // Close modal when clicking outside
    modal.addEventListener('click', function (e) {
        if (e.target === modal) {
            closeFeedbackModal();
        }
    });
}

/**
 * Setup interactive star rating
 */
function setupStarRating() {
    const starContainer = document.getElementById('starRating');
    const stars = starContainer.querySelectorAll('i');
    const ratingInput = document.getElementById('ratingValue');
    const ratingText = document.getElementById('ratingText');
    const submitBtn = document.getElementById('submitFeedbackBtn');
    const ratingError = document.getElementById('ratingError');

    const ratingLabels = [
        'Click to rate',
        'Poor - Not satisfied',
        'Fair - Could be better',
        'Good - Satisfied',
        'Very Good - Happy with service',
        'Excellent - Outstanding service!'
    ];

    stars.forEach(star => {
        // Hover effect
        star.addEventListener('mouseenter', function () {
            const rating = parseInt(this.dataset.rating);
            updateStarsDisplay(rating);
            ratingText.textContent = ratingLabels[rating];
        });

        // Click to set rating
        star.addEventListener('click', function () {
            const rating = parseInt(this.dataset.rating);
            ratingInput.value = rating;
            updateStarsDisplay(rating, true);
            ratingText.textContent = ratingLabels[rating];
            // Hide error if shown
            if (ratingError) ratingError.style.display = 'none';
        });
    });

    // Reset on mouse leave if not selected
    starContainer.addEventListener('mouseleave', function () {
        const currentRating = parseInt(ratingInput.value);
        updateStarsDisplay(currentRating, true);
        ratingText.textContent = currentRating > 0 ? ratingLabels[currentRating] : ratingLabels[0];
    });
}

/**
 * Update stars display
 * @param {number} rating - Current rating to display
 * @param {boolean} selected - Whether this is a selected state
 */
function updateStarsDisplay(rating, selected = false) {
    const stars = document.querySelectorAll('#starRating i');
    stars.forEach((star, index) => {
        if (index < rating) {
            star.className = 'fas fa-star';
            star.style.color = '#f59e0b';
        } else {
            star.className = selected ? 'far fa-star' : 'far fa-star';
            star.style.color = '#94a3b8';
        }
    });
}

/**
 * Handle feedback form submission
 * @param {Event} e - Form submit event
 */
async function handleFeedbackSubmit(e) {
    e.preventDefault();

    const issueId = document.getElementById('feedbackIssueId').value;
    const rating = parseInt(document.getElementById('ratingValue').value);
    const comment = document.getElementById('feedbackComment').value.trim();
    const fullyResolved = document.getElementById('issueFullyResolved').checked;
    const ratingError = document.getElementById('ratingError');

    if (rating === 0) {
        if (ratingError) {
            ratingError.style.display = 'block';
            // Shake animation hint
            const starRating = document.getElementById('starRating');
            starRating.style.transform = 'translateX(5px)';
            setTimeout(() => starRating.style.transform = 'translateX(-5px)', 50);
            setTimeout(() => starRating.style.transform = 'translateX(5px)', 100);
            setTimeout(() => starRating.style.transform = 'translateX(0)', 150);
        } else {
            showNotification('Please provide a rating', 'warning');
        }
        return;
    }

    // Disable submit button and show loading
    const submitBtn = document.getElementById('submitFeedbackBtn');
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Submitting...';

    try {
        const token = localStorage.getItem('bup-token');
        const response = await fetch(`/api/issues/${issueId}/feedback`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(token ? { 'Authorization': `Bearer ${token}` } : {})
            },
            body: JSON.stringify({
                rating,
                comment,
                fullyResolved,
                submittedBy: currentUser?.email || currentUser?.name
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Failed to submit feedback');
        }

        // Update the local issue data
        const issue = (window.issues || []).find(i => (i.issueId || i.id) === issueId);
        if (issue) {
            issue.rating = rating;
            issue.feedbackComment = comment;
            issue.feedbackDate = new Date().toISOString();
            issue.fullyResolved = fullyResolved;
        }

        showNotification('Thank you for your feedback!', 'success');
        closeFeedbackModal();

        // Refresh the dashboard if on dashboard page
        if (typeof loadUserIssues === 'function') {
            loadUserIssues();
        }

        // Close the issue details modal if open
        if (typeof closeIssueDetailsModal === 'function') {
            closeIssueDetailsModal();
        }

    } catch (error) {
        console.error('Error submitting feedback:', error);
        showNotification(error.message || 'Failed to submit feedback. Please try again.', 'error');

        // Re-enable submit button
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Submit Feedback';
    }
}

/**
 * Close the feedback modal
 */
function closeFeedbackModal() {
    const modal = document.getElementById('feedbackModal');
    if (modal) {
        modal.remove();
    }
}

/**
 * Generate stars HTML for displaying ratings
 * @param {number} rating - Rating value (1-5) or null/undefined for no rating
 * @returns {string} HTML for star display
 */
function generateStarsHtml(rating) {
    if (!rating || rating === 0) {
        // Show empty stars when no rating
        return `
            <div class="stars-display no-rating">
                <i class="far fa-star"></i>
                <i class="far fa-star"></i>
                <i class="far fa-star"></i>
                <i class="far fa-star"></i>
                <i class="far fa-star"></i>
                <span class="no-rating-text">No rating yet</span>
            </div>
        `;
    }

    const filledStars = Math.floor(rating);
    const emptyStars = 5 - filledStars;

    return `
        <div class="stars-display">
            ${Array(filledStars).fill('<i class="fas fa-star"></i>').join('')}
            ${Array(emptyStars).fill('<i class="far fa-star"></i>').join('')}
        </div>
    `;
}

// Make functions available globally
window.provideFeedback = provideFeedback;
window.closeFeedbackModal = closeFeedbackModal;
window.setupStarRating = setupStarRating;
window.handleFeedbackSubmit = handleFeedbackSubmit;
window.generateStarsHtml = generateStarsHtml;
