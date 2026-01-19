// Common utility functions for BUP Maintenance HUB

/**
 * Show a notification to the user
 * @param {string} message - The message to display
 * @param {string} type - The type of notification (success, error, warning, info)
 */
function showNotification(message, type = 'info') {
    const notification = document.getElementById('notification');
    if (!notification) {
        console.error('Notification element not found');
        return;
    }
    
    const messageElement = notification.querySelector('.notification-message');
    
    // Set the message and notification type
    messageElement.textContent = message;
    notification.className = `notification ${type}`;
    
    // Add appropriate icon if the element exists
    const iconElement = notification.querySelector('.notification-icon');
    if (iconElement) {
        iconElement.className = 'notification-icon';
        switch(type) {
            case 'success':
                iconElement.classList.add('fas', 'fa-check-circle');
                break;
            case 'error':
                iconElement.classList.add('fas', 'fa-times-circle');
                break;
            case 'warning':
                iconElement.classList.add('fas', 'fa-exclamation-circle');
                break;
            default:
                iconElement.classList.add('fas', 'fa-info-circle');
                break;
        }
    }
    
    // Show the notification
    notification.style.display = 'block';
    
    // Auto-hide after 3 seconds
    setTimeout(() => {
        closeNotification();
    }, 3000);
}

/**
 * Close the notification
 */
function closeNotification() {
    const notification = document.getElementById('notification');
    if (notification) {
        notification.style.display = 'none';
    }
}

/**
 * Generate a unique issue ID
 * @returns {string} A unique ID for an issue
 */
function generateIssueId() {
    const prefix = 'BUP';
    const timestamp = new Date().getTime();
    const random = Math.floor(Math.random() * 1000);
    return `${prefix}${timestamp.toString().slice(-6)}${random}`;
}

/**
 * Format a date string to a more readable format
 * @param {string} dateString - ISO date string
 * @returns {string} Formatted date string
 */
function formatDate(dateString) {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

/**
 * Format a date for display in the UI
 * @param {string} dateString - ISO date string
 * @returns {string} Formatted date
 */
function formatDateForDisplay(dateString) {
    if (!dateString) return 'N/A';
    
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
        return 'Today';
    } else if (diffDays === 1) {
        return 'Yesterday';
    } else if (diffDays < 7) {
        return `${diffDays} days ago`;
    } else {
        return formatDate(dateString);
    }
}

/**
 * Format time elapsed since a date
 * @param {string} dateString - ISO date string
 * @returns {string} Formatted time elapsed
 */
function getTimeElapsed(dateString) {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffMinutes = Math.floor(diffTime / (1000 * 60));
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffMinutes < 60) {
        return `${diffMinutes} minutes ago`;
    } else if (diffHours < 24) {
        return `${diffHours} hours ago`;
    } else {
        return `${diffDays} days ago`;
    }
}

/**
 * Truncate text to a specified length
 * @param {string} text - The text to truncate
 * @param {number} maxLength - Maximum length before truncation
 * @returns {string} Truncated text
 */
function truncateText(text, maxLength = 100) {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
}

/**
 * Sanitize HTML to prevent XSS attacks
 * @param {string} html - The HTML string to sanitize
 * @returns {string} Sanitized HTML
 */
function sanitizeHTML(html) {
    const temp = document.createElement('div');
    temp.textContent = html;
    return temp.innerHTML;
}

/**
 * Update the image preview with uploaded files
 * @param {FileList} files - The uploaded files
 */
function updateImagePreview(files) {
    const preview = document.getElementById('imagePreview');
    if (!preview) return;
    preview.innerHTML = '';

    files.forEach((file, idx) => {
        if (file.type && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = function(e) {
                const imgWrapper = document.createElement('div');
                imgWrapper.style.position = 'relative';
                imgWrapper.style.display = 'inline-block';
                imgWrapper.style.margin = '5px';

                const img = document.createElement('img');
                img.src = e.target.result;
                img.style.width = '80px';
                img.style.height = '80px';
                img.style.objectFit = 'cover';
                img.style.borderRadius = '8px';
                img.style.border = '2px solid #e2e8f0';

                const removeBtn = document.createElement('span');
                removeBtn.innerHTML = '&times;';
                removeBtn.title = 'Remove image';
                removeBtn.style.position = 'absolute';
                removeBtn.style.top = '2px';
                removeBtn.style.right = '6px';
                removeBtn.style.background = 'rgba(0,0,0,0.6)';
                removeBtn.style.color = '#fff';
                removeBtn.style.borderRadius = '50%';
                removeBtn.style.width = '20px';
                removeBtn.style.height = '20px';
                removeBtn.style.display = 'flex';
                removeBtn.style.alignItems = 'center';
                removeBtn.style.justifyContent = 'center';
                removeBtn.style.cursor = 'pointer';
                removeBtn.style.fontSize = '16px';
                removeBtn.style.zIndex = '2';

                removeBtn.onclick = function() {
                    removeUploadedImage(idx);
                };

                imgWrapper.appendChild(img);
                imgWrapper.appendChild(removeBtn);
                preview.appendChild(imgWrapper);
            };
            reader.readAsDataURL(file);
        }
    });

    // Add "Add more" button if less than 5 images
    if (files.length < 5) {
        const addMoreBtn = document.createElement('div');
        addMoreBtn.className = 'add-more-images';
        addMoreBtn.innerHTML = '<i class="fas fa-plus"></i>';
        addMoreBtn.style.width = '80px';
        addMoreBtn.style.height = '80px';
        addMoreBtn.style.backgroundColor = 'var(--gray-100)';
        addMoreBtn.style.border = '2px dashed var(--gray-300)';
        addMoreBtn.style.borderRadius = '8px';
        addMoreBtn.style.display = 'flex';
        addMoreBtn.style.justifyContent = 'center';
        addMoreBtn.style.alignItems = 'center';
        addMoreBtn.style.cursor = 'pointer';
        addMoreBtn.style.margin = '5px';
        addMoreBtn.style.transition = 'all 0.2s';

        addMoreBtn.onclick = function() {
            document.getElementById('imageUpload').click();
        };

        addMoreBtn.onmouseover = function() {
            this.style.backgroundColor = 'var(--gray-200)';
        };

        addMoreBtn.onmouseout = function() {
            this.style.backgroundColor = 'var(--gray-100)';
        };

        preview.appendChild(addMoreBtn);
    }
}

// Make utility functions available globally (fix duplicated exports)
window.generateIssueId = generateIssueId;
window.showNotification = showNotification;
window.closeNotification = closeNotification;
window.updateImagePreview = updateImagePreview;

// Let the loader know this module is loaded
if (typeof registerModuleLoaded === 'function') {
    registerModuleLoaded('utils');
}
