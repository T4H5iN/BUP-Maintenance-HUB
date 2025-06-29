// Functionality for displaying and filtering issues

// Add a variable to track current display limit
let currentDisplayLimit = 10;

// Function to update the Home page issues list
function updateHomeIssuesList() {
    // Reset the display limit
    currentDisplayLimit = 10;
    
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
    const displayLimit = currentDisplayLimit;
    const displayedIssues = issuesToDisplay.slice(0, displayLimit);

    displayedIssues.forEach(issue => {
        const issueCard = document.createElement('div');
        issueCard.className = 'issue-card';
        const locationName = getLocationName(issue.location);

        // Prefer submitterName, fallback to submittedBy or submitterEmail
        let submitter = issue.submitterName || issue.submittedBy || issue.submitterEmail || '';

        // Get status icon based on status
        const statusIcon = getStatusIcon(issue.status);

        // Show only a portion of the description (first 120 chars)
        const shortDescription = issue.description && issue.description.length > 120
            ? issue.description.slice(0, 120) + '...'
            : issue.description || '';

        issueCard.innerHTML = `
            <div class="issue-header">
            <span class="issue-id">#${issue.issueId || issue.id}</span>
            <span class="issue-status ${issue.status}">
                <i class="${statusIcon}"></i>
                ${formatStatus(issue.status)}
            </span>
            <span class="issue-priority ${issue.priority}">${issue.priority}</span>
            </div>
            <h4>${formatCategoryName(issue.category)} Issue - ${issue.specificLocation}</h4>
            <div class="issue-details">
            <span><i class="fas fa-map-marker-alt"></i> ${locationName}, ${issue.specificLocation}</span>
            <span><i class="fas fa-calendar"></i> Submitted: ${issue.submittedDate ? (issue.submittedDate.split ? issue.submittedDate.split('T')[0] : issue.submittedDate) : ''}</span>
            <span><i class="fas fa-user"></i> ${submitter}</span>
            </div>
            <p>${shortDescription}</p>
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
            // Call the loadMoreIssues function instead of redirecting to dashboard
            loadMoreIssues(issuesToDisplay);
        };
        issuesList.appendChild(seeMoreButton);
    }
    
    // Initialize vote system after issues are displayed
    if (typeof initializeVoteSystem === 'function') {
        initializeVoteSystem(issuesList);
    }
    
    // Dispatch event for other components that need to know issues were loaded
    window.dispatchEvent(new CustomEvent('issuesLoaded'));
}

/**
 * Load more issues by increasing the display limit
 * @param {Array} issues - The full array of issues to display
 */
function loadMoreIssues(issues) {
    // Increase the display limit by 10 (or another reasonable number)
    currentDisplayLimit += 10;
    
    // Re-display the issues with the new limit
    displayHomeIssues(issues);
    
    // Scroll to where the new issues start
    const issueCards = document.querySelectorAll('.issue-card');
    if (issueCards.length > 10) {
        // Scroll to the 10th previous element (where new content starts)
        const scrollTarget = issueCards[Math.max(0, issueCards.length - 10)];
        if (scrollTarget) {
            scrollTarget.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
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

/**
 * Get an appropriate icon for each status type
 * @param {string} status - The status string
 * @returns {string} - FontAwesome icon class
 */
function getStatusIcon(status) {
    switch (status) {
        case 'pending-review':
            return 'fas fa-hourglass-half';
        case 'assigned':
            return 'fas fa-user-check';
        case 'in-progress':
            return 'fas fa-tools';
        case 'resolved':
            return 'fas fa-check-circle';
        case 'rejected':
            return 'fas fa-times-circle';
        default:
            return 'fas fa-info-circle';
    }
}

// Make functions available globally
window.updateHomeIssuesList = updateHomeIssuesList;
window.filterHomeIssues = filterHomeIssues;
window.displayHomeIssues = displayHomeIssues;
window.getLocationName = getLocationName;
window.formatStatus = formatStatus;
window.formatCategoryName = formatCategoryName;
window.generateStarRating = generateStarRating;
window.getRandomRating = getRandomRating;
window.loadMoreIssues = loadMoreIssues;
