// Issue management functionality

async function handleIssueSubmission(e) {
    e.preventDefault();
    
    if (!currentUser) {
        showNotification('Please login to submit an issue', 'warning');
        showLoginModal();
        return;
    }

    const issueData = {
        issueId: generateIssueId(), // <-- Use issueId instead of id
        category: document.getElementById('category').value,
        priority: document.getElementById('priority').value,
        location: document.getElementById('location').value,
        specificLocation: document.getElementById('specificLocation').value,
        description: document.getElementById('description').value,
        submittedBy: currentUser.name || currentUser.email,
        // Use current date as ISO string
        submittedDate: new Date().toISOString(),
        status: 'pending-review',
        images: [] // You can handle image upload separately if needed
    };

    try {
        // Get token from localStorage
        const token = localStorage.getItem('bup-token');
        const headers = { 'Content-Type': 'application/json' };
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        // Use full backend URL if frontend and backend are on different ports
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
        // Optionally, reload issues from backend here
        // await loadIssuesFromBackend();
        updateHomeIssuesList();
    } catch (err) {
        showNotification('Failed to submit issue', 'error');
    }
}

function handleImageUpload(e) {
    const files = e.target.files;
    const preview = document.getElementById('imagePreview');
    preview.innerHTML = '';

    Array.from(files).forEach(file => {
        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = function(e) {
                const img = document.createElement('img');
                img.src = e.target.result;
                img.style.width = '80px';
                img.style.height = '80px';
                img.style.objectFit = 'cover';
                img.style.borderRadius = '8px';
                img.style.border = '2px solid #e2e8f0';
                preview.appendChild(img);
            };
            reader.readAsDataURL(file);
        }
    });
}

// Fetch all issues from backend and update the home issues list
async function loadAllIssuesFromBackend() {
    try {
        const res = await fetch('http://localhost:3000/api/issues');
        if (!res.ok) {
            showNotification(`Failed to load issues: ${res.status} ${res.statusText}`, 'error');
            return;
        }
        const data = await res.json();
        if (!Array.isArray(data)) {
            showNotification('Failed to load issues from server - invalid data format', 'error');
            return;
        }
        window.issues = data;
        updateHomeIssuesList();
        if (typeof updateCampusMap === 'function') {
            updateCampusMap(window.issues);
        }
    } catch (err) {
        showNotification('Failed to load issues from server - network error', 'error');
    }
}

// On page load, fetch all issues from backend and update UI
document.addEventListener('DOMContentLoaded', function() {
    loadAllIssuesFromBackend();
    
    // Add event listener for search input to filter in real-time
    const searchInput = document.getElementById('homeSearchInput');
    if (searchInput) {
        searchInput.addEventListener('input', filterHomeIssues);
    }
    
    // Add event listener for search button if it exists
    const searchButton = document.getElementById('homeSearchBtn');
    if (searchButton) {
        searchButton.addEventListener('click', filterHomeIssues);
    }
    
    // Add event listener for Enter key in search input
    if (searchInput) {
        searchInput.addEventListener('keypress', function(event) {
            if (event.key === 'Enter') {
                filterHomeIssues();
            }
        });
    }
});

// Function to update the Home page issues list
function updateHomeIssuesList() {
    // Show ALL issues instead of filtering out pending-review
    displayHomeIssues(window.issues || []);
}

// Function to filter home issues based on selected filters
function filterHomeIssues() {
    const statusFilter = document.getElementById('homeStatusFilter').value;
    const categoryFilter = document.getElementById('homeCategoryFilter').value;
    const locationFilter = document.getElementById('homeLocationFilter').value;
    const searchQuery = document.getElementById('homeSearchInput').value.toLowerCase().trim();

    // Map database location values to filter values
    const locationMap = {
        'academic-building': 'academic',
        'fbs-building': 'fbs',
        'admin-building': 'admin',
        'library': 'library',
        'annex': 'annex',
        'vista-cafeteria': 'vista',
        'amitte-cafeteria': 'amitte',
        'third-place-cafeteria': 'third-place',
        'day-care-center': 'daycare',
        'staff-canteen': 'staff-canteen'
    };

    let filteredIssues = (window.issues || []).filter(issue => {
        // Filter by status if not "all"
        if (statusFilter !== 'all' && issue.status !== statusFilter) return false;
        
        // Filter by category if not "all"
        if (categoryFilter !== 'all' && issue.category !== categoryFilter) return false;
        
        // Filter by location if not "all"
        const mappedLocation = locationMap[issue.location] || issue.location;
        if (locationFilter !== 'all' && mappedLocation !== locationFilter) return false;
        
        // Filter by search query if not empty
        if (searchQuery) {
            const issueId = (issue.issueId || issue.id || '').toString().toLowerCase();
            const description = (issue.description || '').toLowerCase();
            const specificLocation = (issue.specificLocation || '').toLowerCase();
            const submitter = (issue.submitterName || issue.submittedBy || issue.submitterEmail || '').toLowerCase();
            
            return issueId.includes(searchQuery) || 
                   description.includes(searchQuery) || 
                   specificLocation.includes(searchQuery) || 
                   submitter.includes(searchQuery);
        }
        
        return true;
    });

    displayHomeIssues(filteredIssues);
}

// Function to display home issues
function displayHomeIssues(issuesToDisplay) {
    const issuesList = document.getElementById('home-issues-list');
    if (!issuesList) {
        console.error("Element 'home-issues-list' not found!");
        return;
    }
    issuesList.innerHTML = '';

    if (issuesToDisplay.length === 0) {
        issuesList.innerHTML = '<p class="no-issues">No issues match your filter criteria.</p>';
        return;
    }

    issuesToDisplay.sort((a, b) => new Date(b.submittedDate) - new Date(a.submittedDate));
    const displayLimit = 10;
    const displayedIssues = issuesToDisplay.slice(0, displayLimit);

    displayedIssues.forEach(issue => {
        const issueCard = document.createElement('div');
        issueCard.className = 'issue-card';
        const locationName = getLocationName(issue.location);

        // Prefer submitterName, fallback to submittedBy or submitterEmail
        let submitter = issue.submitterName || issue.submittedBy || issue.submitterEmail || '';

        issueCard.innerHTML = `
            <div class="issue-header">
                <span class="issue-id">#${issue.issueId || issue.id}</span>
                <span class="issue-status ${issue.status}">${formatStatus(issue.status)}</span>
                <span class="issue-priority ${issue.priority}">${issue.priority}</span>
            </div>
            <h4>${formatCategoryName(issue.category)} Issue - ${issue.specificLocation}</h4>
            <div class="issue-details">
                <span><i class="fas fa-map-marker-alt"></i> ${locationName}, ${issue.specificLocation}</span>
                <span><i class="fas fa-calendar"></i> Submitted: ${issue.submittedDate ? (issue.submittedDate.split ? issue.submittedDate.split('T')[0] : issue.submittedDate) : ''}</span>
                <span><i class="fas fa-user"></i> ${submitter}</span>
            </div>
            <p>${issue.description}</p>
            <div class="issue-actions">
                <button class="btn-secondary" onclick="viewIssueDetails('${issue.issueId || issue.id}')">View Details</button>
                ${issue.status === 'resolved' ?
                    `<div class="rating">
                        <span>Avg Rating:</span>
                        <div class="stars">
                            ${generateStarRating(getRandomRating())}
                        </div>
                    </div>` : ''}
            </div>
        `;

        issuesList.appendChild(issueCard);
    });

    if (issuesToDisplay.length > displayLimit) {
        const seeMoreButton = document.createElement('button');
        seeMoreButton.className = 'btn-primary see-more-btn';
        seeMoreButton.textContent = `See ${issuesToDisplay.length - displayLimit} More Issues`;
        seeMoreButton.onclick = function() {
            showSection('dashboard');
        };
        issuesList.appendChild(seeMoreButton);
    }
}

// Helper functions needed for displaying issues
function getLocationName(locationId) {
    const locationMap = {
        'academic': 'Academic Building',
        'fbs': 'FBS Building',
        'admin': 'Admin Building',
        'library': 'Library',
        'annex': 'Annex',
        'vista': 'Vista Cafeteria',
        'amitte': 'Amitte Cafeteria',
        'third-place': 'Third Place Cafeteria',
        'daycare': 'Day Care Center',
        'staff-canteen': 'Staff Canteen'
    };
    return locationMap[locationId] || locationId;
}

function formatStatus(status) {
    return status.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

function formatCategoryName(category) {
    return category.charAt(0).toUpperCase() + category.slice(1);
}

function generateStarRating(rating) {
    let stars = '';
    for (let i = 1; i <= 5; i++) {
        if (i <= rating) {
            stars += '<i class="fas fa-star"></i>';
        } else if (i - 0.5 <= rating) {
            stars += '<i class="fas fa-star-half-alt"></i>';
        } else {
            stars += '<i class="far fa-star"></i>';
        }
    }
    return stars;
}

function getRandomRating() {
    return Math.floor(Math.random() * 5) + 3.5; // Random rating between 3.5 and 5
}

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
        issue.images.forEach(img => {
            imageHtml += `<img src="${img}" alt="Issue image" class="issue-detail-image">`;
        });
        imageGallery = `
            <div class="issue-images">
                <h4>Attached Images</h4>
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
                        <div class="detail-value">${issue.submitterName || 'Anonymous'}</div>
                    </div>
                    
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
                    ${progressHistory}
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
}

function closeIssueDetailsModal() {
    const modal = document.getElementById('issueDetailsModal');
    if (modal) {
        modal.remove();
    }
}

// Make sure to add the new function to the window object
window.closeIssueDetailsModal = closeIssueDetailsModal;

// Make functions available globally
window.handleIssueSubmission = handleIssueSubmission;
window.handleImageUpload = handleImageUpload;
window.loadAllIssuesFromBackend = loadAllIssuesFromBackend;
window.updateHomeIssuesList = updateHomeIssuesList;
window.filterHomeIssues = filterHomeIssues;
window.viewIssueDetails = viewIssueDetails;

