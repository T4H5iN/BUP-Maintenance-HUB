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

function finalizeCompletion(taskId) {
    showNotification(`Task ${taskId} marked as complete`, 'success');
    closeCompletionModal();
}

function startTask(taskId) {
    updateTaskStatus(taskId, 'in-progress');
    showNotification(`Task ${taskId} started`, 'success');
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

function submitReschedule(taskId) {
    const newDate = document.getElementById('newDate').value;
    showNotification(`Task ${taskId} rescheduled to ${newDate}`, 'success');
    closeRescheduleModal();
}

// Add this stub to avoid ReferenceError if not implemented elsewhere
function showScheduleView() {
    showNotification('Technician schedule view is not implemented yet.', 'info');
}

// Add this stub to avoid ReferenceError if not implemented elsewhere
function markAvailability() {
    showNotification('Mark availability functionality is not implemented yet.', 'info');
}

// Add this stub to avoid ReferenceError if not implemented elsewhere
function createAvailabilityModal() {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.id = 'availabilityModal';
    modal.innerHTML = `
        <div class="modal-content">
            <span class="close" onclick="closeAvailabilityModal()">&times;</span>
            <h2>Update Availability</h2>
            <form id="availabilityForm">
                <div class="form-group">
                    <label>Status:</label>
                    <select id="availabilityStatus" required>
                        <option value="available">Available</option>
                        <option value="busy">Busy (On Task)</option>
                        <option value="unavailable">Unavailable</option>
                        <option value="leave">On Leave</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Available From:</label>
                    <input type="date" id="availableFrom" required>
                </div>
                <div class="form-group">
                    <label>Available To:</label>
                    <input type="date" id="availableTo" required>
                </div>
                <div class="form-group">
                    <label>Working Hours:</label>
                    <div class="time-range">
                        <input type="time" id="workStart" value="08:00" required>
                        <span>to</span>
                        <input type="time" id="workEnd" value="17:00" required>
                    </div>
                </div>
                <div class="form-group">
                    <label>Notes:</label>
                    <textarea id="availabilityNotes" rows="3" placeholder="Additional notes about your availability..."></textarea>
                </div>
                <button type="button" class="btn-primary" onclick="saveAvailability()">Update Availability</button>
            </form>
        </div>
    `;
    return modal;
}

// Add this stub to avoid ReferenceError if not implemented elsewhere
function saveAvailability() {
    showNotification('Availability updated (stub function).', 'success');
    closeAvailabilityModal();
}

// Add this stub to avoid ReferenceError if not implemented elsewhere
function updateTaskStatus(taskId, status) {
    showNotification(`Task ${taskId} status updated to: ${status}`, 'success');
    // Would typically update the task in the database
}

// Add this stub to avoid ReferenceError if not implemented elsewhere
function updateTaskProgress(taskId) {
    showNotification(`Update progress for task ${taskId} (stub function).`, 'info');
}

// Add this stub to avoid ReferenceError if not implemented elsewhere
function createProgressModal(taskId) {
    showNotification(`Progress modal for task ${taskId} (stub function).`, 'info');
    // You can implement the actual modal as needed
    return document.createElement('div');
}

// Add this stub to avoid ReferenceError if not implemented elsewhere
function saveProgress(taskId) {
    showNotification(`Progress for task ${taskId} saved (stub function).`, 'success');
    closeProgressModal && closeProgressModal();
}

// Add this stub to avoid ReferenceError if not implemented elsewhere
function requestParts(taskId) {
    showNotification(`Request parts for task ${taskId} (stub function).`, 'info');
    // You can implement the actual modal as needed
}

// Make functions available globally
window.showScheduleView = showScheduleView;
window.markAvailability = markAvailability;
window.createAvailabilityModal = createAvailabilityModal;
window.saveAvailability = saveAvailability;
window.updateTaskStatus = updateTaskStatus;
window.updateTaskProgress = updateTaskProgress;
window.createProgressModal = createProgressModal;
window.saveProgress = saveProgress;
window.requestParts = requestParts;
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
