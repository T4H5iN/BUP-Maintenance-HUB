// Functionality for viewing issue details and image gallery

// View issue details modal
function viewIssueDetails(issueId) {
    // Find the issue in the window.issues array
    const issue = (window.issues || []).find(i => (i.issueId || i.id) === issueId);
    if (!issue) {
        showNotification('Issue not found', 'error');
        return;
    }
    
    // Create modal for issue details
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.id = 'issueDetailsModal';
    
    // Format dates for display
    const submittedDate = issue.submittedDate ? 
        new Date(issue.submittedDate).toLocaleDateString('en-US', {
            year: 'numeric', month: 'long', day: 'numeric'
        }) : 'Unknown';
    
    // Format status for display
    const statusDisplay = formatStatus(issue.status);
    
    // Get location name
    const locationName = getLocationName(issue.location);
    
    // Determine if the current user submitted this issue
    const isSubmitter = currentUser && (
        issue.submittedBy === currentUser.name || 
        issue.submittedBy === currentUser.email
    );
    
    // Generate action buttons based on issue status and user role
    let actionButtons = '';
    
    if (currentUser) {
        if (issue.status === 'resolved' && isSubmitter) {
            actionButtons = `
                <button class="btn-primary" onclick="provideFeedback('${issueId}')">
                    <i class="fas fa-star"></i> Provide Feedback
                </button>
            `;
        } else if (currentUser.role === 'admin' || currentUser.role === 'authority') {
            if (issue.status === 'pending-review') {
                actionButtons = `
                    <button class="btn-success" onclick="approveIssue('${issueId}')">
                        <i class="fas fa-check"></i> Approve
                    </button>
                    <button class="btn-warning" onclick="assignTechnician('${issueId}')">
                        <i class="fas fa-user-cog"></i> Assign
                    </button>
                    <button class="btn-danger" onclick="rejectIssue('${issueId}')">
                        <i class="fas fa-times"></i> Reject
                    </button>
                `;
            } else if (issue.status === 'assigned' || issue.status === 'in-progress') {
                actionButtons = `
                    <button class="btn-primary" onclick="updateIssueStatus('${issueId}')">
                        <i class="fas fa-edit"></i> Update Status
                    </button>
                `;
            }
        } else if (currentUser.role === 'technician' && (issue.status === 'assigned' || issue.status === 'in-progress')) {
            actionButtons = `
                <button class="btn-primary" onclick="updateTaskProgress('${issueId}')">
                    <i class="fas fa-tools"></i> Update Progress
                </button>
                <button class="btn-success" onclick="completeTask('${issueId}')">
                    <i class="fas fa-check-circle"></i> Mark Complete
                </button>
            `;
        }
    }
    
    // Build image gallery if there are images
    let imageGallery = '';
    if (issue.images && issue.images.length > 0) {
        let imageHtml = '';
        // Use encodeURIComponent to safely pass JSON in HTML attribute
        const imagesJson = encodeURIComponent(JSON.stringify(issue.images));
        issue.images.forEach((imgPath, index) => {
            const imgUrl = imgPath.startsWith('http') ? imgPath : `http://localhost:3000${imgPath}`;
            imageHtml += `
                <div class="image-container">
                    <img src="${imgUrl}" alt="Issue image" class="issue-detail-image">
                    <div class="image-overlay" onclick="openFullImage('${imgUrl}', ${index}, '${imagesJson}')">
                        <i class="fas fa-search-plus"></i>
                    </div>
                </div>`;
        });
        imageGallery = `
            <div class="issue-images">
                <h4>Attached Images (${issue.images.length})</h4>
                <div class="image-gallery">
                    ${imageHtml}
                </div>
            </div>
        `;
    }
    
    // Build progress history if available
    let progressHistory = '';
    if (issue.progressUpdates && issue.progressUpdates.length > 0) {
        let updatesHtml = '';
        issue.progressUpdates.forEach(update => {
            updatesHtml += `
                <div class="progress-update">
                    <div class="update-header">
                        <span class="update-date">${new Date(update.date).toLocaleDateString()}</span>
                        <span class="update-by">${update.by}</span>
                    </div>
                    <p>${update.note}</p>
                </div>
            `;
        });
        progressHistory = `
            <div class="issue-progress">
                <h4>Progress Updates</h4>
                <div class="progress-history">
                    ${updatesHtml}
                </div>
            </div>
        `;
    }
    
    // HTML for the modal
    modal.innerHTML = `
        <div class="modal-content issue-details-modal">
            <span class="close" onclick="closeIssueDetailsModal()">&times;</span>
            <div class="issue-details-header">
                <h2>Issue #${issue.issueId || issue.id}</h2>
                <div class="issue-badges">
                    <span class="issue-status ${issue.status}">${statusDisplay}</span>
                    <span class="issue-priority ${issue.priority}">${issue.priority}</span>
                </div>
            </div>
            
            <div class="issue-details-content">
                <div class="issue-main-info">
                    <h3>${formatCategoryName(issue.category)} Issue - ${issue.specificLocation}</h3><br>
                    
                    <div class="detail-row">
                        <div class="detail-label"><i class="fas fa-map-marker-alt"></i> Location:</div>
                        <div class="detail-value">${locationName}, ${issue.specificLocation}</div>
                    </div>
                    
                    <div class="detail-row">
                        <div class="detail-label"><i class="fas fa-calendar"></i> Submitted:</div>
                        <div class="detail-value">${submittedDate}</div>
                    </div>
                    
                    <div class="detail-row">
                        <div class="detail-label"><i class="fas fa-user"></i> Submitted By:</div>
                        <div class="detail-value">${issue.submittedBy || 'Anonymous'}</div>
                    </div>
                    
                    ${issue.submitterEmail ? `
                    <div class="detail-row">
                        <div class="detail-label"><i class="fas fa-envelope"></i> Email:</div>
                        <div class="detail-value">${issue.submitterEmail}</div>
                    </div>` : ''}
                    
                    <div class="detail-row">
                        <div class="detail-label"><i class="fas fa-tag"></i> Category:</div>
                        <div class="detail-value">${formatCategoryName(issue.category)}</div>
                    </div>
                    
                    <div class="detail-row">
                        <div class="detail-label"><i class="fas fa-exclamation-circle"></i> Priority:</div>
                        <div class="detail-value priority-${issue.priority}">${issue.priority.toUpperCase()}</div>
                    </div>
                    
                    <div class="detail-row">
                        <div class="detail-label"><i class="fas fa-info-circle"></i> Status:</div>
                        <div class="detail-value status-${issue.status}">${statusDisplay}</div>
                    </div>
                    
                    ${issue.assignedTo ? `
                    <div class="detail-row">
                        <div class="detail-label"><i class="fas fa-user-cog"></i> Assigned To:</div>
                        <div class="detail-value">${issue.assignedTo}</div>
                    </div>` : ''}
                    
                    ${issue.scheduledDate ? `
                    <div class="detail-row">
                        <div class="detail-label"><i class="fas fa-clock"></i> Scheduled:</div>
                        <div class="detail-value">${new Date(issue.scheduledDate).toLocaleDateString()} 
                            ${issue.scheduledTime || ''}</div>
                    </div>` : ''}
                    
                    <div class="issue-description">
                        <h4>Description</h4>
                        <p>${issue.description}</p>
                    </div>
                    
                    ${imageGallery}
                    ${progressHistory || ''}
                </div>
            </div>
            
            <div class="issue-details-actions">
                ${actionButtons}
                <button class="btn-secondary" onclick="closeIssueDetailsModal()">Close</button>
            </div>
        </div>
    `;
    
    // Add modal to document and display it
    document.body.appendChild(modal);
    modal.style.display = 'block';
    
    // Add event listener to the modal background for closing
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            closeIssueDetailsModal();
        }
    });
    
    // Dispatch event that modal was opened
    document.dispatchEvent(new CustomEvent('issueDetailModalOpened', { detail: { issueId } }));
}

// Close issue details modal
function closeIssueDetailsModal() {
    const modal = document.getElementById('issueDetailsModal');
    if (modal) {
        modal.remove();
    }
}

// Function to open a full-size image in a new modal
function openFullImage(imageUrl, currentIndex, allImagesEncoded) {
    // Remove any existing image modal
    const existingModal = document.querySelector('.fullscreen-image-modal');
    if (existingModal) {
        existingModal.remove();
    }

    // Decode and parse images array
    let allImages = [];
    try {
        allImages = JSON.parse(decodeURIComponent(allImagesEncoded));
    } catch (e) {
        allImages = [imageUrl];
    }
    const processedImages = Array.isArray(allImages)
        ? allImages.map(img => img.startsWith('http') ? img : `http://localhost:3000${img}`)
        : [imageUrl];

    // Create the modal
    const modal = document.createElement('div');
    modal.className = 'modal fullscreen-image-modal';
    modal.id = 'fullscreenImageModal';
    
    const hasMultipleImages = processedImages.length > 1;
    
    modal.innerHTML = `
        <div class="modal-content fullscreen-image-container">
            <span class="close" onclick="closeFullscreenImage()">&times;</span>
            <div class="fullscreen-image-wrapper">
                <img src="${imageUrl}" class="fullscreen-image" id="currentFullscreenImage">
                ${hasMultipleImages ? `
                    <div class="image-navigation">
                        <button class="nav-arrow prev-arrow" onclick="navigateImages('prev')">
                            <i class="fas fa-chevron-left"></i>
                        </button>
                        <button class="nav-arrow next-arrow" onclick="navigateImages('next')">
                            <i class="fas fa-chevron-right"></i>
                        </button>
                    </div>
                    <div class="image-counter">${currentIndex + 1} / ${processedImages.length}</div>
                ` : ''}
            </div>
        </div>
    `;
    
    // Store image data for navigation
    document.body.appendChild(modal);
    modal.style.display = 'block';
    
    // Save the image data to the modal for navigation
    modal.dataset.currentIndex = currentIndex;
    modal.dataset.allImages = JSON.stringify(processedImages);
    
    // Close when clicking outside the image
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            closeFullscreenImage();
        }
    });
    
    // Add keyboard navigation
    document.addEventListener('keydown', handleImageKeyboardNavigation);
}

function closeFullscreenImage() {
    const modal = document.getElementById('fullscreenImageModal');
    if (modal) {
        modal.remove();
        // Remove keyboard event listener when closing modal
        document.removeEventListener('keydown', handleImageKeyboardNavigation);
    }
}

function navigateImages(direction) {
    const modal = document.getElementById('fullscreenImageModal');
    if (!modal) return;
    
    const currentIndex = parseInt(modal.dataset.currentIndex);
    const allImages = JSON.parse(modal.dataset.allImages);
    const totalImages = allImages.length;
    
    let newIndex;
    if (direction === 'next') {
        newIndex = (currentIndex + 1) % totalImages;
    } else {
        newIndex = (currentIndex - 1 + totalImages) % totalImages;
    }
    
    // Update the image
    const imageElement = document.getElementById('currentFullscreenImage');
    if (imageElement) {
        imageElement.src = allImages[newIndex];
    }
    
    // Update the counter
    const counter = modal.querySelector('.image-counter');
    if (counter) {
        counter.textContent = `${newIndex + 1} / ${totalImages}`;
    }
    
    // Update the current index
    modal.dataset.currentIndex = newIndex;
}

function handleImageKeyboardNavigation(e) {
    if (e.key === 'ArrowRight') {
        navigateImages('next');
    } else if (e.key === 'ArrowLeft') {
        navigateImages('prev');
    } else if (e.key === 'Escape') {
        closeFullscreenImage();
    }
}

// Make functions available globally
window.viewIssueDetails = viewIssueDetails;
window.closeIssueDetailsModal = closeIssueDetailsModal;
window.openFullImage = openFullImage;
window.closeFullscreenImage = closeFullscreenImage;
window.navigateImages = navigateImages;
window.handleImageKeyboardNavigation = handleImageKeyboardNavigation;
