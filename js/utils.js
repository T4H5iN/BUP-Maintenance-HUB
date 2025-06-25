// Utility functions that can be used across the application

// Function to generate a unique issue ID based on date and a random number
function generateIssueId() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    
    return `BUP${year}${month}${day}${random}`;
}

// Function to extract name from email
function getNameFromEmail(email) {
    if (!email) return '';
    
    // Extract the part before @
    const username = email.split('@')[0];
    
    // Convert dots to spaces and capitalize each word
    return username
        .replace(/\./g, ' ')
        .replace(/\b\w/g, l => l.toUpperCase());
}

// Function to show notification
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    
    notification.innerHTML = `
        <div class="notification-icon">
            <i class="fas ${getNotificationIcon(type)}"></i>
        </div>
        <div class="notification-message">${message}</div>
        <button class="notification-close" onclick="closeNotification(this)">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    // Remove any existing notifications
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(n => n.remove());
    
    // Add to the DOM
    document.body.appendChild(notification);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.classList.add('fade-out');
            setTimeout(() => notification.remove(), 500);
        }
    }, 5000);
}

// Helper function to get the appropriate icon based on notification type
function getNotificationIcon(type) {
    switch (type) {
        case 'success': return 'fa-check-circle';
        case 'error': return 'fa-exclamation-circle';
        case 'warning': return 'fa-exclamation-triangle';
        case 'info':
        default: return 'fa-info-circle';
    }
}

// Function to close notification
function closeNotification(button) {
    const notification = button.closest('.notification');
    if (notification) {
        notification.classList.add('fade-out');
        setTimeout(() => notification.remove(), 500);
    }
}

// Function to handle form submission events
function handleScheduleSubmission(e) {
    e.preventDefault();
    // Implementation for schedule submission
    showNotification('Schedule submitted successfully!', 'success');
    closeScheduleModal();
}

// Make utility functions available globally
window.generateIssueId = generateIssueId;
window.getNameFromEmail = getNameFromEmail;
window.showNotification = showNotification;
window.getNotificationIcon = getNotificationIcon;
window.closeNotification = closeNotification;
window.handleScheduleSubmission = handleScheduleSubmission;
