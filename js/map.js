// Campus map and building-related functionality

function handleBuildingClick(e) {
    e.preventDefault();  // Prevent default action
    const building = e.currentTarget;
    const buildingName = building.querySelector('.building-label').textContent;
    const issueCount = building.querySelector('.issue-count')?.textContent || '0';
    
    console.log(`Building clicked: ${buildingName} with ${issueCount} issues`);  // Debug
    
    showBuildingDetails(buildingName, issueCount);
}

function filterMapIssues() {
    const filter = document.getElementById('mapFilter').value;
    console.log("Filter applied:", filter);  // Debug
    
    // Filter issues based on the selected criteria
    let filteredIssues = [];
    
    if (filter === 'all') {
        filteredIssues = issues;
    } else if (filter === 'urgent') {
        filteredIssues = issues.filter(issue => issue.priority === 'urgent');
    } else if (filter === 'high') {
        filteredIssues = issues.filter(issue => issue.priority === 'high');
    } else if (filter === 'pending') {
        filteredIssues = issues.filter(issue => 
            issue.status === 'pending-review' || issue.status === 'assigned'
        );
    } else if (filter === 'resolved') {
        filteredIssues = issues.filter(issue => issue.status === 'resolved');
    }
    
    console.log("Filtered issues:", filteredIssues.length);  // Debug
    
    // Update the campus map with filtered issues
    updateCampusMap(filteredIssues);
    
    // Show notification about the filter
    showNotification(`Showing ${filter} issues on the campus map`, 'info');
}

function updateCampusMap(filteredIssues) {
    // Group issues by location - make sure locations match building data-attributes
    const issuesByLocation = {};
    
    filteredIssues.forEach(issue => {
        const location = issue.location;
        if (!issuesByLocation[location]) {
            issuesByLocation[location] = [];
        }
        issuesByLocation[location].push(issue);
    });
    
    console.log("Issues by location:", issuesByLocation);  // Debug
    
    // Update each building on the map
    document.querySelectorAll('.building').forEach(building => {
        const buildingId = building.dataset.building;
        console.log("Processing building:", buildingId);  // Debug
        
        const issueCountElement = building.querySelector('.issue-count');
        if (!issueCountElement) {
            console.log("No issue count element for:", buildingId);  // Debug
            return;
        }
        
        // If we have issues for this building
        if (issuesByLocation[buildingId] && issuesByLocation[buildingId].length > 0) {
            const buildingIssues = issuesByLocation[buildingId];
            const issueCount = buildingIssues.length;
            
            console.log(`${buildingId} has ${issueCount} issues`);  // Debug
            
            // Find highest priority
            let highestPriority = 'low';
            const priorityRank = { 'urgent': 4, 'high': 3, 'medium': 2, 'low': 1 };
            
            buildingIssues.forEach(issue => {
                if (priorityRank[issue.priority] > priorityRank[highestPriority]) {
                    highestPriority = issue.priority;
                }
            });
            
            // Update count and class
            issueCountElement.textContent = issueCount;
            
            // Remove existing priority classes
            ['low', 'medium', 'high', 'urgent'].forEach(priority => {
                issueCountElement.classList.remove(priority);
            });
            
            // Add appropriate priority class
            issueCountElement.classList.add(highestPriority);
            
            // Make building visible
            building.style.display = 'flex';
        } else {
            // No issues for this building with current filter
            if (document.getElementById('mapFilter').value !== 'all') {
                // Hide building if we're filtering and it has no matching issues
                building.style.display = 'none';
            } else {
                // Show building with zero count if we're showing all
                issueCountElement.textContent = '0';
                
                // Remove priority classes and add low
                ['low', 'medium', 'high', 'urgent'].forEach(priority => {
                    issueCountElement.classList.remove(priority);
                });
                issueCountElement.classList.add('low');
                building.style.display = 'flex';
            }
        }
    });
}

function showBuildingDetails(buildingName, issueCount) {
    // Find building ID from name - important for mapping to issues
    const buildingElement = Array.from(document.querySelectorAll('.building'))
        .find(b => b.querySelector('.building-label').textContent === buildingName);
    
    if (!buildingElement) {
        console.log("Building element not found");  // Debug
        return;
    }
    
    const buildingId = buildingElement.dataset.building;
    console.log("Building ID:", buildingId);  // Debug
    
    // Get issues for this building
    const buildingIssues = issues.filter(issue => issue.location === buildingId);
    console.log("Found issues:", buildingIssues.length);  // Debug
    
    // Create modal for displaying building details
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.id = 'buildingDetailsModal';
    
    // Count issues by priority
    const priorityCounts = {
        urgent: buildingIssues.filter(i => i.priority === 'urgent').length,
        high: buildingIssues.filter(i => i.priority === 'high').length,
        medium: buildingIssues.filter(i => i.priority === 'medium').length,
        low: buildingIssues.filter(i => i.priority === 'low').length
    };
    
    // Create issue breakdown
    let issueBreakdown = '';
    if (priorityCounts.urgent > 0) {
        issueBreakdown += `<div class="priority-count urgent">${priorityCounts.urgent} Urgent</div>`;
    }
    if (priorityCounts.high > 0) {
        issueBreakdown += `<div class="priority-count high">${priorityCounts.high} High</div>`;
    }
    if (priorityCounts.medium > 0) {
        issueBreakdown += `<div class="priority-count medium">${priorityCounts.medium} Medium</div>`;
    }
    if (priorityCounts.low > 0) {
        issueBreakdown += `<div class="priority-count low">${priorityCounts.low} Low</div>`;
    }
    
    // Generate issue cards for this building
    let issueCards = '';
    buildingIssues.forEach(issue => {
        issueCards += `
            <div class="mini-issue-card">
                <div class="mini-issue-header">
                    <span class="issue-id">${issue.id}</span>
                    <span class="issue-priority ${issue.priority}">${issue.priority}</span>
                    <span class="issue-status ${issue.status}">${issue.status.replace('-', ' ')}</span>
                </div>
                <h5>${issue.category.charAt(0).toUpperCase() + issue.category.slice(1)} Issue - ${issue.specificLocation}</h5>
                <p>${issue.description}</p>
                <div class="mini-issue-footer">
                    <span><i class="fas fa-user"></i> ${issue.submittedBy}</span>
                    <span><i class="fas fa-calendar"></i> ${issue.submittedDate}</span>
                </div>
            </div>
        `;
    });
    
    if (buildingIssues.length === 0) {
        issueCards = '<p class="no-issues">No issues reported for this building.</p>';
    }
    
    modal.innerHTML = `
        <div class="modal-content building-details-modal">
            <span class="close" onclick="closeBuildingDetailsModal()">&times;</span>
            <div class="building-details-header">
                <h2>${buildingName}</h2>
                <div class="building-stats">
                    <div class="stat-badge">
                        <i class="fas fa-exclamation-circle"></i>
                        <span>${buildingIssues.length} Issues</span>
                    </div>
                </div>
            </div>
            
            <div class="priority-breakdown">
                ${issueBreakdown || '<p>No active issues</p>'}
            </div>
            
            <div class="building-issues-list">
                ${issueCards}
            </div>
            
            <div class="building-details-actions">
                <button class="btn-primary" onclick="reportIssueForBuilding('${buildingId}')">
                    <i class="fas fa-plus-circle"></i> Report New Issue
                </button>
                <button class="btn-secondary" onclick="closeBuildingDetailsModal()">
                    Close
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    modal.style.display = 'block';
}

function reportIssueForBuilding(buildingId) {
    closeBuildingDetailsModal();
    
    // Scroll to the report form
    document.getElementById('home').classList.add('active');
    document.getElementById('map').classList.remove('active');
    
    // Update nav links
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });
    document.querySelector('[href="#home"]').classList.add('active');
    
    // Set the location dropdown
    document.getElementById('location').value = buildingId;
    
    // Scroll to the form
    document.querySelector('.quick-report').scrollIntoView({ behavior: 'smooth' });
    
    // Update current section
    currentSection = 'home';
}

// Make functions available globally
window.handleBuildingClick = handleBuildingClick;
window.filterMapIssues = filterMapIssues;
window.updateCampusMap = updateCampusMap;
window.showBuildingDetails = showBuildingDetails;
window.reportIssueForBuilding = reportIssueForBuilding;
