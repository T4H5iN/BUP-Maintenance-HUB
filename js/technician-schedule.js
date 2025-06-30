// Technician schedule modal logic

function closeTechnicianScheduleModal() {
    const modal = document.getElementById('technicianScheduleModal');
    if (modal) modal.style.display = 'none';
}

async function loadTechnicianSchedule() {
    const container = document.getElementById('technicianScheduleContainer');
    if (!container) return;
    container.innerHTML = '<div class="loading-indicator"><i class="fas fa-spinner fa-spin"></i> Loading schedule...</div>';

    const token = localStorage.getItem('bup-token');
    if (!token) {
        container.innerHTML = '<div class="error-message">You must be logged in to view your schedule.</div>';
        return;
    }

    try {
        // Fetch all assignments for the logged-in technician
        const res = await fetch('http://localhost:3000/api/issues/assigned-to-me', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (!res.ok || !Array.isArray(data.issues)) {
            container.innerHTML = '<div class="error-message">Failed to load schedule.</div>';
            return;
        }
        const issues = data.issues;
        if (!issues.length) {
            container.innerHTML = '<div class="no-schedule-message"><i class="fas fa-calendar-times"></i> No scheduled tasks found.</div>';
            return;
        }

        // Sort by scheduledDate and scheduledTime
        issues.sort((a, b) => {
            const dateA = a.scheduledDate ? new Date(a.scheduledDate + 'T' + (a.scheduledTime || '00:00')) : new Date(0);
            const dateB = b.scheduledDate ? new Date(b.scheduledDate + 'T' + (b.scheduledTime || '00:00')) : new Date(0);
            return dateA - dateB;
        });

        // Render as a simple schedule list
        let html = '<div class="schedule-list">';
        issues.forEach(issue => {
            const dateStr = issue.scheduledDate
                ? new Date(issue.scheduledDate).toLocaleDateString()
                : 'Not scheduled';
            const timeStr = issue.scheduledTime || '';
            html += `
                <div class="schedule-item ${issue.status}">
                    <div class="schedule-date">
                        <i class="fas fa-calendar-day"></i> ${dateStr} ${timeStr ? ', ' + timeStr : ''}
                    </div>
                    <div class="schedule-title">
                        <strong>#${issue.issueId || issue.id}</strong> - ${issue.description ? issue.description.slice(0, 40) : ''}
                    </div>
                    <div class="schedule-location">
                        <i class="fas fa-map-marker-alt"></i> ${issue.specificLocation || ''}
                    </div>
                    <div class="schedule-status">
                        <span class="status-label ${issue.status}">${issue.status.replace(/-/g, ' ')}</span>
                        <span class="priority-label ${issue.priority}">${issue.priority}</span>
                    </div>
                </div>
            `;
        });
        html += '</div>';
        container.innerHTML = html;
    } catch (err) {
        container.innerHTML = '<div class="error-message">Failed to load schedule.</div>';
    }
}

// Optional: Close modal on outside click
window.addEventListener('click', function(event) {
    const modal = document.getElementById('technicianScheduleModal');
    if (event.target === modal) {
        closeTechnicianScheduleModal();
    }
});
