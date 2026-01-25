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
    let progressSliderHtml = '';

    // Add progress bar/slider for all users if in-progress
    if (issue.status === 'in-progress') {
        const progress = typeof issue.progress === 'number' ? issue.progress : 0;
        progressSliderHtml = `
                <div class="progress-bar-container">
                    <div class="progress-bar-bg">
                        <div class="progress-bar-fill" style="width:${progress}%;"></div>
                    </div>
                    <span class="progress-slider-label">${progress}%</span>
                </div>
            `;
    }

    // Only show technician controls if NOT on the home page (all campus issues section)
    // Assume: if window.location.hash is "#dashboard" and technician panel is active, show controls
    // Otherwise, hide technician controls in modal for all campus issues
    let showTechnicianControls = false;
    if (
        currentUser &&
        currentUser.role === 'technician' &&
        (window.location.hash === '#dashboard' && document.getElementById('technician-panel')?.classList.contains('active'))
    ) {
        showTechnicianControls = true;
    }

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
        } else if (
            showTechnicianControls &&
            (issue.status === 'assigned' || issue.status === 'in-progress')
        ) {
            // Only show technician controls in technician dashboard context
            const progress = typeof issue.progress === 'number' ? issue.progress : 0;
            if (issue.status === 'in-progress') {
                progressSliderHtml = `
                    <div class="progress-slider-container" style="margin-bottom:10px;">
                        <input type="range" min="0" max="100" value="${progress}" step="5"
                            class="progress-slider"
                            id="progress-slider-modal-${issue.issueId || issue.id}"
                            onchange="updateTaskProgressSlider('${issue.issueId || issue.id}', this.value)">
                        <span class="progress-slider-label">${progress}%</span>
                    </div>
                `;
            }
            actionButtons = `
                ${issue.status === 'assigned' ? `
                <button class="btn-primary" onclick="startTask('${issueId}')">
                    <i class="fas fa-play"></i> Start Task
                </button>
                ` : `
                <button class="btn-inprogress" disabled>
                    <i class="fas fa-spinner fa-spin"></i> In Progress
                </button>
                `}
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
            const imgUrl = imgPath.startsWith('http') ? imgPath : `${imgPath}`;
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

    // Add rejection reason if status is rejected
    let rejectionNotice = '';
    if (issue.status === 'rejected' && issue.rejectReason) {
        rejectionNotice = `
            <div class="rejection-notice">
                <i class="fas fa-exclamation-circle"></i>
                <strong>Rejected:</strong> ${issue.rejectReason}
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
            ${rejectionNotice}
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

                    ${(issue.status === 'in-progress' && (issue.scheduledDate || issue.scheduledTime)) ? `
                    <div class="detail-row">
                        <div class="detail-label"><i class="fas fa-clock"></i> Scheduled:</div>
                        <div class="detail-value">
                            ${issue.scheduledDate ? new Date(issue.scheduledDate).toLocaleDateString() : ''}
                            ${issue.scheduledTime ? issue.scheduledTime : ''}
                        </div>
                    </div>
                    ` : ''}

                    ${issue.assignedTo ? `
                    <div class="detail-row">
                        <div class="detail-label"><i class="fas fa-user-cog"></i> Assigned To:</div>
                        <div class="detail-value">${issue.assignedToName || issue.assignedTo}</div>
                    </div>` : ''}
                    
                    ${issue.scheduledDate && issue.status !== 'in-progress' ? `
                    <div class="detail-row">
                        <div class="detail-label"><i class="fas fa-clock"></i> Scheduled:</div>
                        <div class="detail-value">${new Date(issue.scheduledDate).toLocaleDateString()} 
                            ${issue.scheduledTime || ''}</div>
                    </div>` : ''}
                    
                    <div class="issue-description">
                        <h4>Description</h4>
                        <p>${issue.description}</p>
                    </div>
                    
                    ${progressSliderHtml}
                    ${imageGallery}
                    ${progressHistory || ''}
                    
                    ${issue.status === 'resolved' ? `
                    <div class="issue-feedback-section">
                        <h4><i class="fas fa-star"></i> User Feedback</h4>
                        ${issue.rating ? `
                        <div class="feedback-display">
                            <div class="feedback-rating">
                                <div class="stars-display">
                                    ${Array(issue.rating).fill('<i class="fas fa-star" style="color:#f59e0b;"></i>').join('')}
                                    ${Array(5 - issue.rating).fill('<i class="far fa-star" style="color:#94a3b8;"></i>').join('')}
                                </div>
                                <span class="rating-value">${issue.rating}/5</span>
                            </div>
                            ${issue.feedbackComment ? `
                            <div class="feedback-comment">
                                <p>"${issue.feedbackComment}"</p>
                            </div>
                            ` : ''}
                            <div class="feedback-meta">
                                <span><i class="fas fa-user"></i> ${issue.feedbackBy || 'Anonymous'}</span>
                                ${issue.feedbackDate ? `<span><i class="fas fa-calendar"></i> ${new Date(issue.feedbackDate).toLocaleDateString()}</span>` : ''}
                            </div>
                            ${issue.fullyResolved === false ? `<p class="partial-resolution"><i class="fas fa-exclamation-triangle"></i> Issue was partially resolved</p>` : ''}
                        </div>
                        ` : `
                        <div class="no-feedback">
                            <i class="far fa-star"></i>
                            <i class="far fa-star"></i>
                            <i class="far fa-star"></i>
                            <i class="far fa-star"></i>
                            <i class="far fa-star"></i>
                            <p>No feedback provided yet</p>
                        </div>
                        `}
                    </div>
                    ` : ''}
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
    modal.addEventListener('click', function (e) {
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
        ? allImages.map(img => img.startsWith('http') ? img : `${img}`)
        : [imageUrl];

    // Create the modal
    const modal = document.createElement('div');
    modal.className = 'modal fullscreen-image-modal';
    modal.id = 'fullscreenImageModal';

    const hasMultipleImages = processedImages.length > 1;

    modal.innerHTML = `
        <div class="modal-content fullscreen-image-container">
            <span class="close">&times;</span>
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

    // Add event listener to close button
    const closeBtn = modal.querySelector('.close');
    if (closeBtn) {
        closeBtn.addEventListener('click', function (e) {
            e.stopPropagation(); // Prevent event bubbling
            closeFullscreenImage();
        });
    }

    // Save the image data to the modal for navigation
    modal.dataset.currentIndex = currentIndex;
    modal.dataset.allImages = JSON.stringify(processedImages);

    // Close when clicking outside the image
    modal.addEventListener('click', function (e) {
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
