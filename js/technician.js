// Technician dashboard functionality (continued)

function createPartsRequestModal(taskId) {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.id = 'partsRequestModal';
    modal.innerHTML = `
        <div class="modal-content">
            <span class="close" onclick="closePartsRequestModal()">&times;</span>
            <h2>Request Parts or Materials</h2>
            <form id="partsRequestForm">
                <div class="form-group">
                    <label>Task ID: ${taskId}</label>
                </div>
                <div class="form-group">
                    <label>Parts/Materials Needed:</label>
                    <textarea id="partsNeeded" rows="3" required placeholder="List all parts and materials needed..."></textarea>
                </div>
                <div class="form-group">
                    <label>Quantity:</label>
                    <input type="number" id="partsQuantity" min="1" value="1">
                </div>
                <div class="form-group">
                    <label>Urgency:</label>
                    <select id="partsUrgency" required>
                        <option value="low">Low - Within a week</option>
                        <option value="medium">Medium - Within 2-3 days</option>
                        <option value="high" selected>High - Within 24 hours</option>
                        <option value="urgent">Urgent - Immediately</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Reason for Request:</label>
                    <textarea id="partsReason" rows="3" placeholder="Explain why these parts are needed..."></textarea>
                </div>
                <button type="button" class="btn-primary" onclick="submitPartsRequest('${taskId}')">Submit Request</button>
            </form>
        </div>
    `;
    return modal;
}

function submitPartsRequest(taskId) {
    const parts = document.getElementById('partsNeeded').value;
    const urgency = document.getElementById('partsUrgency').value;
    showNotification(`Parts request for task ${taskId} submitted with ${urgency} urgency`, 'success');
    closePartsRequestModal();
}

function completeTask(taskId) {
    const completionModal = createCompletionModal(taskId);
    document.body.appendChild(completionModal);
    completionModal.style.display = 'block';
}

function createCompletionModal(taskId) {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.id = 'completionModal';
    modal.innerHTML = `
        <div class="modal-content">
            <span class="close" onclick="closeCompletionModal()">&times;</span>
            <h2>Mark Task as Complete</h2>
            <form id="completionForm">
                <div class="form-group">
                    <label>Task ID: ${taskId}</label>
                </div>
                <div class="form-group">
                    <label>Completion Summary:</label>
                    <textarea id="completionSummary" rows="3" required placeholder="Summarize the work performed..."></textarea>
                </div>
                <div class="form-group">
                    <label>Total Time Spent (hours):</label>
                    <input type="number" id="totalTime" min="0" step="0.5" value="2.5">
                </div>
                <div class="form-group">
                    <label>Upload Completion Photos:</label>
                    <div class="file-upload">
                        <input type="file" id="completionPhotos" accept="image/*" multiple>
                        <label for="completionPhotos" class="file-upload-label">
                            <i class="fas fa-camera"></i>
                            Choose Images
                        </label>
                    </div>
                    <div id="completionPhotoPreview" class="image-preview"></div>
                </div>
                <div class="form-group checkbox-group">
                    <input type="checkbox" id="followupNeeded">
                    <label for="followupNeeded">Follow-up visit needed</label>
                </div>
                <div class="form-group" id="followupSection" style="display: none;">
                    <label>Follow-up Reason:</label>
                    <textarea id="followupReason" rows="2" placeholder="Explain why a follow-up is needed..."></textarea>
                </div>
                <button type="button" class="btn-success" onclick="finalizeCompletion('${taskId}')">Mark as Complete</button>
            </form>
        </div>
    `;
    return modal;
}

async function finalizeCompletion(taskId) {
    // Optionally collect completion summary, time, etc. here
    const token = localStorage.getItem('bup-token');
    if (!token) {
        showNotification('You must be logged in to complete a task.', 'warning');
        return;
    }

    try {
        const res = await fetch(`/api/issues/${taskId}/status`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                status: 'resolved'
                // Optionally add: completionSummary, totalTime, etc.
            })
        });
        const data = await res.json();
        if (!res.ok) {
            showNotification(data.message || 'Failed to mark task as complete', 'error');
            return;
        }
        // Update local issue status
        if (window.issues && Array.isArray(window.issues)) {
            const issue = window.issues.find(i => (i.issueId || i.id) == taskId);
            if (issue) {
                issue.status = 'resolved';
            }
        }
        showNotification(`Task ${taskId} marked as complete`, 'success');
        closeCompletionModal();
        if (typeof loadTechnicianAssignments === 'function') loadTechnicianAssignments();
        if (typeof loadAllIssuesFromBackend === 'function') loadAllIssuesFromBackend();
    } catch (err) {
        showNotification('Failed to mark task as complete', 'error');
    }
}

async function startTask(taskId) {
    // Find the issue in window.issues (optional, for local update)
    const issue = (window.issues || []).find(i => (i.issueId || i.id) === taskId);

    // Get current date and time for scheduling
    const now = new Date();
    const scheduledDate = now.toISOString().split('T')[0];
    const scheduledTime = now.toTimeString().slice(0, 5);

    // Update status and schedule in backend
    const token = localStorage.getItem('bup-token');
    if (!token) {
        showNotification('You must be logged in to start a task.', 'warning');
        return;
    }

    try {
        const res = await fetch(`/api/issues/${taskId}/status`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                status: 'in-progress',
                scheduledDate,
                scheduledTime
            })
        });
        const data = await res.json();
        if (!res.ok) {
            showNotification(data.message || 'Failed to start task', 'error');
            return;
        }
        showNotification(`Task ${taskId} started`, 'success');
        // Update local issue status and schedule if present
        if (issue) {
            issue.status = 'in-progress';
            issue.scheduledDate = scheduledDate;
            issue.scheduledTime = scheduledTime;
        }
        // Optionally reload assignments
        if (typeof loadTechnicianAssignments === 'function') loadTechnicianAssignments();
        // Optionally reload all issues for UI consistency
        if (typeof loadAllIssuesFromBackend === 'function') loadAllIssuesFromBackend();
    } catch (err) {
        showNotification('Failed to start task', 'error');
    }
}

function viewTaskDetails(taskId) {
    showNotification(`Viewing details for task ${taskId}`, 'info');
}

function rescheduleTask(taskId) {
    const rescheduleModal = createRescheduleModal(taskId);
    document.body.appendChild(rescheduleModal);
    rescheduleModal.style.display = 'block';
}

function createRescheduleModal(taskId) {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.id = 'rescheduleModal';
    modal.innerHTML = `
        <div class="modal-content">
            <span class="close" onclick="closeRescheduleModal()">&times;</span>
            <h2>Reschedule Task</h2>
            <form id="rescheduleForm">
                <div class="form-group">
                    <label>Task ID: ${taskId}</label>
                </div>
                <div class="form-group">
                    <label>New Date:</label>
                    <input type="date" id="newDate" required>
                </div>
                <div class="form-group">
                    <label>New Time Range:</label>
                    <div class="time-range">
                        <input type="time" id="newStartTime" value="09:00" required>
                        <span>to</span>
                        <input type="time" id="newEndTime" value="11:00" required>
                    </div>
                </div>
                <div class="form-group">
                    <label>Reason for Rescheduling:</label>
                    <textarea id="rescheduleReason" rows="3" placeholder="Explain why this task needs to be rescheduled..."></textarea>
                </div>
                <button type="button" class="btn-primary" onclick="submitReschedule('${taskId}')">Reschedule Task</button>
            </form>
        </div>
    `;
    return modal;
}

async function submitReschedule(taskId) {
    const newDate = document.getElementById('newDate').value;
    const newStartTime = document.getElementById('newStartTime').value;
    // Optionally, you can use both start and end time, but for now, store start time as scheduledTime
    const scheduledDate = newDate;
    const scheduledTime = newStartTime;
    const reason = document.getElementById('rescheduleReason').value;

    const token = localStorage.getItem('bup-token');
    if (!token) {
        showNotification('You must be logged in to reschedule a task.', 'warning');
        return;
    }

    try {
        const res = await fetch(`/api/issues/${taskId}/status`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                status: 'in-progress',
                scheduledDate,
                scheduledTime,
                rescheduleReason: reason
            })
        });
        const data = await res.json();
        if (!res.ok) {
            showNotification(data.message || 'Failed to reschedule task', 'error');
            return;
        }
        // Update local issue
        if (window.issues && Array.isArray(window.issues)) {
            const issue = window.issues.find(i => (i.issueId || i.id) == taskId);
            if (issue) {
                issue.scheduledDate = scheduledDate;
                issue.scheduledTime = scheduledTime;
            }
        }
        showNotification(`Task ${taskId} rescheduled to ${scheduledDate} ${scheduledTime}`, 'success');
        closeRescheduleModal();
        if (typeof loadTechnicianAssignments === 'function') loadTechnicianAssignments();
        if (typeof loadAllIssuesFromBackend === 'function') loadAllIssuesFromBackend();
    } catch (err) {
        showNotification('Failed to reschedule task', 'error');
    }
}

/**
 * Fetch and render assigned issues for the logged-in technician
 */
async function loadTechnicianAssignments() {
    const token = localStorage.getItem('bup-token');
    if (!token) {
        showNotification('You must be logged in to view assignments', 'warning');
        return;
    }

    // Show loading indicator in the technician tasks container
    const container = document.querySelector('.technician-tasks');
    if (container) {
        container.innerHTML = '<div class="loading-indicator"><i class="fas fa-spinner fa-spin"></i> Loading your assignments...</div>';
    }

    try {
        console.log('Fetching technician assignments...');

        // Fetch all assignments for the logged-in technician
        const res = await fetch('/api/issues/assigned-to-me', {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        // Log response status for debugging
        console.log('Assignment fetch response status:', res.status);

        if (!res.ok) {
            const errorText = await res.text();
            console.error('Error response:', errorText);
            try {
                const data = JSON.parse(errorText);
                showNotification(data.message || 'Failed to load assignments', 'error');
            } catch (e) {
                showNotification('Failed to load assignments: ' + res.status, 'error');
            }

            if (container) {
                container.innerHTML = `<div class="error-message"><i class="fas fa-exclamation-circle"></i> Failed to load assignments</div>`;
            }
            return;
        }

        const data = await res.json();
        console.log('Assignments loaded:', data.issues ? data.issues.length : 0);

        // Save all issues for filtering
        window.technicianAllIssues = data.issues || [];

        // Dynamically update technician stats
        updateTechnicianStats(window.technicianAllIssues);

        // Render with current filters
        renderTechnicianAssignments(filterTechnicianIssues(window.technicianAllIssues));
    } catch (err) {
        console.error('Error loading assignments:', err);
        showNotification('Failed to load assignments: ' + (err.message || 'Network error'), 'error');

        if (container) {
            container.innerHTML = `<div class="error-message"><i class="fas fa-exclamation-circle"></i> Failed to load assignments: ${err.message || 'Network error'}</div>`;
        }
    }
}

/**
 * Filter technician issues based on panel filters
 * @param {Array} issues
 * @returns {Array}
 */
function filterTechnicianIssues(issues) {
    const statusFilter = document.getElementById('techStatusFilter')?.value || 'all';
    const priorityFilter = document.getElementById('techPriorityFilter')?.value || 'all';
    const dateFilter = document.getElementById('techDateFilter')?.value;

    return (issues || []).filter(issue => {
        // Status filter
        if (statusFilter !== 'all') {
            if (statusFilter === 'completed') {
                if (issue.status !== 'resolved') return false;
            } else if (issue.status !== statusFilter) {
                return false;
            }
        }
        // Priority filter
        if (priorityFilter !== 'all' && issue.priority !== priorityFilter) return false;
        // Date filter (scheduledDate)
        if (dateFilter) {
            if (!issue.scheduledDate) return false;
            // Compare only date part
            const issueDate = new Date(issue.scheduledDate).toISOString().split('T')[0];
            if (issueDate !== dateFilter) return false;
        }
        return true;
    });
}

/**
 * Update technician panel stats (assigned, in-progress, completed)
 * @param {Array} issues
 */
function updateTechnicianStats(issues) {
    // Count assigned, in-progress, and completed (resolved) issues
    let assigned = 0, inProgress = 0, completed = 0;
    issues.forEach(issue => {
        if (issue.status === 'assigned') assigned++;
        else if (issue.status === 'in-progress') inProgress++;
        else if (issue.status === 'resolved') completed++;
    });

    // Update the stat cards in the technician panel
    const statCards = document.querySelectorAll('#technician-panel .stat-card');
    statCards.forEach(card => {
        const label = card.querySelector('.stat-label');
        const number = card.querySelector('.stat-number');
        if (!label || !number) return;
        const labelText = label.textContent.trim().toLowerCase();
        if (labelText.includes('assigned')) number.textContent = assigned;
        else if (labelText.includes('in progress')) number.textContent = inProgress;
        else if (labelText.includes('completed')) number.textContent = completed;
    });
}

/**
 * Update progress for a task (slider change)
 */
async function updateTaskProgressSlider(taskId, value) {
    const token = localStorage.getItem('bup-token');
    if (!token) return;

    try {
        // Use PATCH /api/issues/:id (not /status) for partial update
        const res = await fetch(`/api/issues/${taskId}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                progress: Number(value),
                status: value < 100 ? 'in-progress' : 'resolved'
            })
        });
        const data = await res.json();
        if (!res.ok) {
            showNotification(data.message || 'Failed to update progress', 'error');
            return;
        }
        showNotification(`Progress updated to ${value}%`, 'success');
        // Update local issue progress so UI reflects immediately
        if (window.issues && Array.isArray(window.issues)) {
            const issue = window.issues.find(i => (i.issueId || i.id) == taskId);
            if (issue) {
                issue.progress = Number(value);
                if (value >= 100) issue.status = 'resolved';
                else issue.status = 'in-progress';
            }
        }
        window.dispatchEvent(new CustomEvent('progressUpdated', {
            detail: { issueId: taskId, progress: Number(value) }
        }));
        if (typeof loadTechnicianAssignments === 'function') loadTechnicianAssignments();
    } catch (err) {
        showNotification('Failed to update progress', 'error');
    }
}

/**
 * Render technician assignments in the technician panel
 */
function renderTechnicianAssignments(issues) {
    const container = document.querySelector('.technician-tasks');
    if (!container) return;
    container.innerHTML = '';

    if (!issues.length) {
        container.innerHTML = '<div class="no-issues-message"><i class="fas fa-clipboard-list"></i><p>No assigned tasks found.</p></div>';
        return;
    }

    issues.forEach(issue => {
        const progress = typeof issue.progress === 'number' ? issue.progress : 0;
        const status = issue.status || 'pending';
        const scheduled = issue.scheduledDate
            ? `${new Date(issue.scheduledDate).toLocaleDateString()}${issue.scheduledTime ? ', ' + issue.scheduledTime : ''}`
            : 'Not scheduled';

        const card = document.createElement('div');
        card.className = 'tech-task-card';

        // Progress bar slider HTML
        let progressBarHtml = '';
        if (status === 'in-progress' || status === 'assigned') {
            progressBarHtml = `
                <div class="progress-slider-container" style="width:100%;margin-bottom:0;">
                    <input type="range" min="0" max="100" value="${progress}" step="5"
                        class="progress-slider"
                        id="progress-slider-${issue.issueId || issue.id}"
                        onchange="updateTaskProgressSlider('${issue.issueId || issue.id}', this.value)">
                    <span class="progress-slider-label">${progress}%</span>
                </div><br>
            `;
        }

        // Button logic
        let actionButtonHtml = '';
        if (status === 'assigned') {
            actionButtonHtml = `
                <button class="btn-primary" onclick="startTask('${issue.issueId || issue.id}')">
                    <i class="fas fa-play"></i> Start Task
                </button>
            `;
        } else if (status === 'in-progress') {
            actionButtonHtml = `
                <button class="btn-inprogress" disabled>
                    <i class="fas fa-spinner fa-spin"></i> In Progress
                </button>
            `;
        }

        card.innerHTML = `
            <div class="task-header">
                <div class="task-id-container">
                    <span class="issue-id">#${issue.issueId || issue.id}</span>
                    <span class="issue-priority ${issue.priority}">${issue.priority}</span>
                </div>
                <div class="task-status">
                    <span class="status-label">${status.replace(/-/g, ' ')}</span>
                </div>
            </div>
            <div class="task-content">
                <h4>${issue.description ? issue.description.slice(0, 40) + (issue.description.length > 40 ? '...' : '') : 'No Title'}</h4>
                <p class="task-location"><i class="fas fa-map-marker-alt"></i> ${issue.specificLocation || ''}</p>
                <p class="task-schedule"><i class="fas fa-calendar-day"></i> Scheduled: ${scheduled}</p>
                <p class="task-description">${issue.description || ''}</p>
                ${progressBarHtml}
                <div class="task-actions">
                    ${actionButtonHtml}
                    <button class="btn-secondary" onclick="viewIssueDetails('${issue.issueId || issue.id}')">
                        <i class="fas fa-eye"></i> View Details
                    </button>
                    ${status !== 'resolved' ? `
                    <button class="btn-warning" onclick="rescheduleTask('${issue.issueId || issue.id}')">
                        <i class="fas fa-calendar-alt"></i> Reschedule
                    </button>
                    <button class="btn-success" onclick="completeTask('${issue.issueId || issue.id}')">
                        <i class="fas fa-check-circle"></i> Mark Complete
                    </button>
                    ` : ''}
                </div>
            </div>
        `;
        container.appendChild(card);
    });
}

// Setup technician panel filter event listeners
function setupTechnicianPanelFilters() {
    const statusFilter = document.getElementById('techStatusFilter');
    const priorityFilter = document.getElementById('techPriorityFilter');
    const dateFilter = document.getElementById('techDateFilter');
    const handler = function () {
        if (!window.technicianAllIssues) return;
        renderTechnicianAssignments(filterTechnicianIssues(window.technicianAllIssues));
        updateTechnicianStats(filterTechnicianIssues(window.technicianAllIssues));
    };
    if (statusFilter) statusFilter.addEventListener('change', handler);
    if (priorityFilter) priorityFilter.addEventListener('change', handler);
    if (dateFilter) dateFilter.addEventListener('change', handler);
}

// Load assignments when technician panel is shown
document.addEventListener('DOMContentLoaded', function () {
    const techTab = document.getElementById('technicianTab');
    if (techTab) {
        techTab.addEventListener('click', loadTechnicianAssignments);
    }
    // Also load if technician panel is default visible
    if (document.getElementById('technician-panel')?.classList.contains('active')) {
        loadTechnicianAssignments();
    }
    // Setup technician panel filter listeners
    setupTechnicianPanelFilters();
});

/**
 * Show availability modal to update technician availability status
 */
function markAvailability() {
    // Create modal if it doesn't exist
    if (!document.getElementById('availabilityModal')) {
        showNotification('Error loading availability form', 'error');
        return;
    }

    // Show the modal
    const modal = document.getElementById('availabilityModal');
    modal.style.display = 'block';

    // Set current availability if available
    if (currentUser && currentUser.availability) {
        const statusSelect = document.getElementById('availabilityStatus');
        if (statusSelect) {
            // Try to match the status or default to 'available'
            const currentStatus = currentUser.availability.toLowerCase();
            for (let i = 0; i < statusSelect.options.length; i++) {
                if (statusSelect.options[i].value === currentStatus) {
                    statusSelect.selectedIndex = i;
                    break;
                }
            }
        }

        // Set notes if available
        if (currentUser.availabilityNote) {
            document.getElementById('availabilityNote').value = currentUser.availabilityNote;
        }
    }

    // Add event handler for the availability period dropdown
    const availabilityUntil = document.getElementById('availabilityUntil');
    const specificDate = document.getElementById('specificDate');

    if (availabilityUntil && specificDate) {
        availabilityUntil.addEventListener('change', function () {
            if (this.value === 'specific') {
                specificDate.style.display = 'block';
                // Set default date to tomorrow
                const tomorrow = new Date();
                tomorrow.setDate(tomorrow.getDate() + 1);
                specificDate.value = tomorrow.toISOString().split('T')[0];
            } else {
                specificDate.style.display = 'none';
            }
        });
    }

    // Add event handler for form submission
    const form = document.getElementById('availabilityForm');
    if (form) {
        form.removeEventListener('submit', handleAvailabilityUpdate);
        form.addEventListener('submit', handleAvailabilityUpdate);
    }
}

/**
 * Handle availability form submission
 * @param {Event} e - Form submission event
 */
async function handleAvailabilityUpdate(e) {
    e.preventDefault();

    const status = document.getElementById('availabilityStatus').value;
    const note = document.getElementById('availabilityNote').value;
    const untilType = document.getElementById('availabilityUntil').value;

    // Calculate end date based on selection
    let validUntil = null;
    if (untilType === 'specific') {
        validUntil = document.getElementById('specificDate').value;
    } else if (untilType === 'today') {
        const today = new Date();
        today.setHours(23, 59, 59, 999);
        validUntil = today.toISOString();
    } else if (untilType === 'tomorrow') {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(23, 59, 59, 999);
        validUntil = tomorrow.toISOString();
    } else if (untilType === 'week') {
        const endOfWeek = new Date();
        const daysToSunday = 7 - endOfWeek.getDay();
        endOfWeek.setDate(endOfWeek.getDate() + daysToSunday);
        endOfWeek.setHours(23, 59, 59, 999);
        validUntil = endOfWeek.toISOString();
    }

    // Show loading indicator
    const submitButton = document.querySelector('#availabilityForm .btn-success');
    if (submitButton) {
        submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Updating...';
        submitButton.disabled = true;
    }

    try {
        // Get token from localStorage
        const token = localStorage.getItem('bup-token');
        if (!token) {
            throw new Error('Authentication token not found');
        }

        // Send update to server
        const response = await fetch('/api/users/availability', {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                availability: status,
                availabilityNote: note,
                validUntil: validUntil
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to update availability');
        }

        const data = await response.json();

        // Update current user object
        if (currentUser) {
            currentUser.availability = status;
            currentUser.availabilityNote = note;
            currentUser.availabilityValidUntil = validUntil;

            // Update in localStorage
            localStorage.setItem('bup-current-user', JSON.stringify(currentUser));
        }

        // Show success notification
        showNotification('Availability status updated successfully', 'success');

        // Update technician status indicator if exists
        updateTechnicianStatusIndicator();

        // Close the modal
        closeAvailabilityModal();

    } catch (error) {
        console.error('Error updating availability:', error);
        showNotification(error.message || 'Failed to update availability', 'error');

        // Re-enable submit button
        if (submitButton) {
            submitButton.innerHTML = '<i class="fas fa-check-circle"></i> Update Status';
            submitButton.disabled = false;
        }
    }
}

/**
 * Update the technician status indicator in the UI
 */
function updateTechnicianStatusIndicator() {
    if (!currentUser || !currentUser.availability) return;

    const statusIndicator = document.querySelector('.technician-status-indicator');
    if (!statusIndicator) return;

    // Remove all status classes
    statusIndicator.classList.remove('available', 'busy', 'unavailable', 'on-leave', 'sick-leave');

    // Add appropriate class
    statusIndicator.classList.add(currentUser.availability);

    // Update text
    const statusText = statusIndicator.querySelector('.status-text');
    if (statusText) {
        statusText.textContent = currentUser.availability.replace('-', ' ');
    }
}

/**
 * Close the availability modal
 */
function closeAvailabilityModal() {
    const modal = document.getElementById('availabilityModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// Add functions to window
window.markAvailability = markAvailability;
window.handleAvailabilityUpdate = handleAvailabilityUpdate;
window.closeAvailabilityModal = closeAvailabilityModal;
window.createPartsRequestModal = createPartsRequestModal;
window.submitPartsRequest = submitPartsRequest;
window.completeTask = completeTask;
window.createCompletionModal = createCompletionModal;
window.finalizeCompletion = finalizeCompletion;
window.startTask = startTask;
window.viewTaskDetails = viewTaskDetails;
window.rescheduleTask = rescheduleTask;
window.createRescheduleModal = createRescheduleModal;
window.submitReschedule = submitReschedule;
window.loadTechnicianAssignments = loadTechnicianAssignments;
window.renderTechnicianAssignments = renderTechnicianAssignments;
window.updateTaskProgressSlider = updateTaskProgressSlider;
