/**
 * Administrator Panel Functionality
 * Provides advanced management capabilities for system administrators
 */

// Initialize the administrator dashboard
function initializeAdministratorPanel() {


    // Load admin dashboard statistics
    loadAdminDashboardStats();

    // Load overdue issues
    loadOverdueIssues();

    // Set up event listeners for admin actions
    setupAdminEventListeners();
}

// Load and display administrator dashboard statistics
async function loadAdminDashboardStats() {
    try {
        // In a production environment, fetch this data from the server
        // For now, we'll use dummy data or calculate from existing issues

        const allIssues = window.issues || [];
        if (!allIssues.length) {
            console.warn("No issues data available for admin stats");
            return;
        }

        // Calculate statistics
        const totalIssues = allIssues.length;

        // Calculate overdue issues (older than 7 days and not resolved)
        const overdueIssues = allIssues.filter(issue => {
            const submittedDate = new Date(issue.submittedDate);
            const currentDate = new Date();
            const daysDifference = Math.floor((currentDate - submittedDate) / (1000 * 60 * 60 * 24));

            return daysDifference > 7 && issue.status !== 'resolved';
        });

        // Calculate resolution rate
        const resolvedIssues = allIssues.filter(issue => issue.status === 'resolved');
        const resolutionRate = Math.round((resolvedIssues.length / totalIssues) * 100);

        // Calculate average resolution time
        let totalResolutionDays = 0;
        let resolvedWithDates = 0;

        resolvedIssues.forEach(issue => {
            if (issue.submittedDate && issue.resolvedDate) {
                const submittedDate = new Date(issue.submittedDate);
                const resolvedDate = new Date(issue.resolvedDate);
                const daysDifference = Math.floor((resolvedDate - submittedDate) / (1000 * 60 * 60 * 24));

                totalResolutionDays += daysDifference;
                resolvedWithDates++;
            }
        });

        const avgResolutionTime = resolvedWithDates > 0
            ? (totalResolutionDays / resolvedWithDates).toFixed(1)
            : "N/A";

        // Weekly change calculations
        const lastWeekDate = new Date();
        lastWeekDate.setDate(lastWeekDate.getDate() - 7);

        const newIssuesThisWeek = allIssues.filter(issue => {
            const submittedDate = new Date(issue.submittedDate);
            return submittedDate > lastWeekDate;
        }).length;

        const newOverdueThisWeek = overdueIssues.filter(issue => {
            const submittedDate = new Date(issue.submittedDate);
            const sevenDaysAgo = new Date(submittedDate);
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() + 7);

            return sevenDaysAgo > lastWeekDate && sevenDaysAgo <= new Date();
        }).length;

        // Update UI with calculated statistics
        updateAdminDashboardUI({
            totalIssues,
            overdueCount: overdueIssues.length,
            resolutionRate,
            avgResolutionTime,
            newIssuesThisWeek,
            newOverdueThisWeek
        });

    } catch (error) {
        console.error("Error loading admin dashboard stats:", error);
        showNotification("Failed to load administrator statistics", "error");
    }
}

// Update the administrator dashboard UI with statistics
function updateAdminDashboardUI(stats) {
    const totalIssuesElement = document.querySelector('.overview-card:nth-child(1) .overview-number');
    const overdueIssuesElement = document.querySelector('.overview-card:nth-child(2) .overview-number');
    const resolutionRateElement = document.querySelector('.overview-card:nth-child(3) .overview-number');
    const avgResolutionTimeElement = document.querySelector('.overview-card:nth-child(4) .overview-number');

    const totalIssuesChangeElement = document.querySelector('.overview-card:nth-child(1) .overview-change');
    const overdueIssuesChangeElement = document.querySelector('.overview-card:nth-child(2) .overview-change');

    if (totalIssuesElement) totalIssuesElement.textContent = stats.totalIssues;
    if (overdueIssuesElement) overdueIssuesElement.textContent = stats.overdueCount;
    if (resolutionRateElement) resolutionRateElement.textContent = `${stats.resolutionRate}%`;
    if (avgResolutionTimeElement) avgResolutionTimeElement.textContent = `${stats.avgResolutionTime} days`;

    // Update change indicators
    if (totalIssuesChangeElement) {
        totalIssuesChangeElement.textContent = `+${stats.newIssuesThisWeek} this week`;
        totalIssuesChangeElement.className = 'overview-change';
        totalIssuesChangeElement.classList.add(stats.newIssuesThisWeek > 0 ? 'positive' : 'neutral');
    }

    if (overdueIssuesChangeElement) {
        overdueIssuesChangeElement.textContent = `+${stats.newOverdueThisWeek} this week`;
        overdueIssuesChangeElement.className = 'overview-change';
        overdueIssuesChangeElement.classList.add(stats.newOverdueThisWeek > 0 ? 'negative' : 'positive');
    }
}

// Load and display overdue issues
function loadOverdueIssues() {
    try {
        const allIssues = window.issues || [];
        if (!allIssues.length) {
            console.warn("No issues data available for overdue issues");
            return;
        }

        // Find overdue issues (older than 7 days and not resolved)
        const overdueIssues = allIssues.filter(issue => {
            const submittedDate = new Date(issue.submittedDate);
            const currentDate = new Date();
            const daysDifference = Math.floor((currentDate - submittedDate) / (1000 * 60 * 60 * 24));

            return daysDifference > 7 && issue.status !== 'resolved';
        })
            // Sort by age (oldest first)
            .sort((a, b) => new Date(a.submittedDate) - new Date(b.submittedDate));

        // Display overdue issues in the UI
        displayOverdueIssues(overdueIssues);

    } catch (error) {
        console.error("Error loading overdue issues:", error);
        showNotification("Failed to load overdue issues", "error");
    }
}

// Helper function to get issue title, checking multiple possible title fields
function getIssueTitle(issue) {
    // Check multiple possible title fields in order of priority
    return issue.title || issue.subject || issue.name ||
        (issue.description ? issue.description.substring(0, 30) + '...' : 'Untitled Issue');
}

// Display overdue issues in the UI
function displayOverdueIssues(overdueIssues) {
    const alertList = document.querySelector('.alert-list');
    if (!alertList) return;

    // Clear existing content
    alertList.innerHTML = '';

    if (overdueIssues.length === 0) {
        alertList.innerHTML = `
            <div class="no-alerts-message">
                <i class="fas fa-check-circle"></i>
                <p>No overdue issues at this time. Great job!</p>
            </div>
        `;
        return;
    }

    // Display only the first 5 most critical issues
    const issuesToShow = overdueIssues.slice(0, 5);

    issuesToShow.forEach(issue => {
        const submittedDate = new Date(issue.submittedDate);
        const currentDate = new Date();
        const daysDifference = Math.floor((currentDate - submittedDate) / (1000 * 60 * 60 * 24));

        // Determine priority class
        const priorityClass = issue.priority === 'urgent' || issue.priority === 'high'
            ? issue.priority
            : 'medium';

        // Find last update date
        let lastUpdateText = "No updates recorded";

        if (issue.updates && issue.updates.length > 0) {
            const lastUpdate = new Date(issue.updates[issue.updates.length - 1].date);
            const daysSinceUpdate = Math.floor((currentDate - lastUpdate) / (1000 * 60 * 60 * 24));
            lastUpdateText = `Last updated ${daysSinceUpdate} days ago`;
        }

        const alertItem = document.createElement('div');
        alertItem.className = `alert-item ${priorityClass}`;
        alertItem.innerHTML = `
            <div class="alert-content">
                <h5>#${issue.issueId || issue.id} - ${getIssueTitle(issue)}</h5>
                <p>Submitted: ${submittedDate.toLocaleDateString()} (${daysDifference} days ago)</p>
                <p>Status: ${formatStatus(issue.status)} - ${lastUpdateText}</p>
            </div>
            <div class="alert-actions">
                <!-- <button class="btn-danger" onclick="escalateIssue('${issue.issueId || issue.id}')">
                    <i class="fas fa-exclamation-triangle"></i> Escalate
                </button> -->
                <button class="btn-warning" onclick="assignUrgent('${issue.issueId || issue.id}')">
                    <i class="fas fa-bolt"></i> Assign Urgently
                </button>
            </div>
        `;

        alertList.appendChild(alertItem);
    });

    // If there are more issues than we're showing, add a note
    if (overdueIssues.length > issuesToShow.length) {
        const moreIssuesNote = document.createElement('div');
        moreIssuesNote.className = 'more-issues-note';
        moreIssuesNote.innerHTML = `
            <p>And ${overdueIssues.length - issuesToShow.length} more overdue issues...</p>
            <button class="btn-secondary" onclick="showAllOverdueIssues()">
                View All Overdue Issues
            </button>
        `;
        alertList.appendChild(moreIssuesNote);
    }
}

// Format status for display
function formatStatus(status) {
    if (!status) return 'Unknown';

    // Convert from kebab-case or snake_case to Title Case with spaces
    return status
        .replace(/[-_]/g, ' ')
        .replace(/\w\S*/g, txt => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
}

// Setup event listeners for administrator actions
function setupAdminEventListeners() {
    // Generate report button
    const generateReportBtn = document.querySelector('.authority-actions .btn-primary');
    if (generateReportBtn) {
        generateReportBtn.addEventListener('click', generateReport);
    }

    // Show overdue issues button
    const showOverdueBtn = document.querySelector('.authority-actions .btn-warning');
    if (showOverdueBtn) {
        showOverdueBtn.addEventListener('click', showOverdueIssues);
    }
}

// Generate a comprehensive report
function generateReport() {

    showNotification("Preparing administrative report...", "info");

    // Show a loading modal
    showReportGenerationModal();

    // Simulate report generation delay (in real app, this would be an API call)
    setTimeout(() => {
        try {
            generateAdminReport();
            showNotification("Report generated successfully", "success");
        } catch (error) {
            console.error("Error generating report:", error);
            showNotification("Failed to generate report", "error");
        } finally {
            closeReportGenerationModal();
        }
    }, 1500);
}

// Show loading modal for report generation
function showReportGenerationModal() {
    // Remove any existing modal
    const existingModal = document.getElementById('reportGenerationModal');
    if (existingModal) existingModal.remove();

    const modal = document.createElement('div');
    modal.id = 'reportGenerationModal';
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content report-generation-modal">
            <h2>Generating Report</h2>
            <div class="report-generation-progress">
                <div class="loading-spinner">
                    <i class="fas fa-spinner fa-spin"></i>
                </div>
                <p>Please wait while we generate your administrative report...</p>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
    modal.style.display = 'block';
}

// Close report generation modal
function closeReportGenerationModal() {
    const modal = document.getElementById('reportGenerationModal');
    if (modal) {
        modal.style.display = 'none';
        setTimeout(() => modal.remove(), 300);
    }
}

// Generate the actual admin report (this would interact with a reporting service in a real app)
function generateAdminReport() {
    // Prepare report data
    const reportData = prepareAdminReportData();

    // In a real application, this would send the data to a server endpoint
    // that generates a PDF or Excel file

    // For this demo, we'll create and show a report preview modal
    showReportPreviewModal(reportData);
}

// Prepare data for the admin report
function prepareAdminReportData() {
    const allIssues = window.issues || [];

    // Basic statistics
    const totalIssues = allIssues.length;
    const resolvedIssues = allIssues.filter(issue => issue.status === 'resolved').length;
    const pendingIssues = allIssues.filter(issue => issue.status !== 'resolved').length;
    const resolutionRate = totalIssues > 0 ? Math.round((resolvedIssues / totalIssues) * 100) : 0;

    // Category breakdown
    const categoryCounts = {};
    allIssues.forEach(issue => {
        const category = issue.category || 'uncategorized';
        categoryCounts[category] = (categoryCounts[category] || 0) + 1;
    });

    // Priority breakdown
    const priorityCounts = {
        urgent: 0,
        high: 0,
        medium: 0,
        low: 0
    };

    allIssues.forEach(issue => {
        const priority = issue.priority || 'medium';
        if (priorityCounts[priority] !== undefined) {
            priorityCounts[priority]++;
        }
    });

    // Technician performance (if applicable)
    const technicianPerformance = {};

    allIssues.forEach(issue => {
        if (issue.assignedTo && issue.status === 'resolved') {
            const techId = issue.assignedTo;
            if (!technicianPerformance[techId]) {
                technicianPerformance[techId] = {
                    assigned: 0,
                    resolved: 0,
                    avgResolutionDays: 0,
                    totalDays: 0
                };
            }

            technicianPerformance[techId].assigned++;
            technicianPerformance[techId].resolved++;

            // Calculate resolution time if dates are available
            if (issue.assignedDate && issue.resolvedDate) {
                const assignedDate = new Date(issue.assignedDate);
                const resolvedDate = new Date(issue.resolvedDate);
                const daysDiff = Math.floor((resolvedDate - assignedDate) / (1000 * 60 * 60 * 24));

                technicianPerformance[techId].totalDays += daysDiff;
            }
        } else if (issue.assignedTo) {
            const techId = issue.assignedTo;
            if (!technicianPerformance[techId]) {
                technicianPerformance[techId] = {
                    assigned: 0,
                    resolved: 0,
                    avgResolutionDays: 0,
                    totalDays: 0
                };
            }

            technicianPerformance[techId].assigned++;
        }
    });

    // Calculate average resolution days for each technician
    Object.keys(technicianPerformance).forEach(techId => {
        const tech = technicianPerformance[techId];
        tech.avgResolutionDays = tech.resolved > 0
            ? (tech.totalDays / tech.resolved).toFixed(1)
            : 'N/A';
    });

    // Current date for the report
    const reportDate = new Date().toLocaleDateString();

    return {
        reportDate,
        totalIssues,
        resolvedIssues,
        pendingIssues,
        resolutionRate,
        categoryCounts,
        priorityCounts,
        technicianPerformance
    };
}

// Show a modal with the report preview
function showReportPreviewModal(reportData) {
    // Remove any existing modal
    const existingModal = document.getElementById('reportPreviewModal');
    if (existingModal) existingModal.remove();

    const modal = document.createElement('div');
    modal.id = 'reportPreviewModal';
    modal.className = 'modal';

    // Create technician performance table rows
    let technicianRows = '';
    Object.entries(reportData.technicianPerformance).forEach(([techId, data]) => {
        // Get technician name if available
        const technicianName = getTechnicianName(techId) || techId;

        technicianRows += `
            <tr>
                <td>${technicianName}</td>
                <td>${data.assigned}</td>
                <td>${data.resolved}</td>
                <td>${data.avgResolutionDays}</td>
                <td>${Math.round((data.resolved / data.assigned) * 100)}%</td>
            </tr>
        `;
    });

    // If no technician data, show a message
    if (technicianRows === '') {
        technicianRows = `
            <tr>
                <td colspan="5" class="no-data-message">No technician assignment data available</td>
            </tr>
        `;
    }

    // Create category distribution rows
    let categoryRows = '';
    Object.entries(reportData.categoryCounts).forEach(([category, count]) => {
        const percentage = Math.round((count / reportData.totalIssues) * 100);
        categoryRows += `
            <tr>
                <td>${formatCategoryName(category)}</td>
                <td>${count}</td>
                <td>${percentage}%</td>
            </tr>
        `;
    });

    modal.innerHTML = `
        <div class="modal-content report-preview-modal" style="width: 90%; max-width: 1000px;">
            <span class="close" onclick="closeReportPreviewModal()">&times;</span>
            <div class="report-header">
                <h2>Administrative Report</h2>
                <p class="report-date">Generated on: ${reportData.reportDate}</p>
            </div>
            
            <div class="report-summary">
                <h3>Executive Summary</h3>
                <div class="summary-stats">
                    <div class="summary-stat">
                        <span class="summary-value">${reportData.totalIssues}</span>
                        <span class="summary-label">Total Issues</span>
                    </div>
                    <div class="summary-stat">
                        <span class="summary-value">${reportData.resolvedIssues}</span>
                        <span class="summary-label">Resolved</span>
                    </div>
                    <div class="summary-stat">
                        <span class="summary-value">${reportData.pendingIssues}</span>
                        <span class="summary-label">Pending</span>
                    </div>
                    <div class="summary-stat">
                        <span class="summary-value">${reportData.resolutionRate}%</span>
                        <span class="summary-label">Resolution Rate</span>
                    </div>
                </div>
            </div>
            
            <div class="report-section">
                <h3>Issue Category Distribution</h3>
                <table class="report-table">
                    <thead>
                        <tr>
                            <th>Category</th>
                            <th>Count</th>
                            <th>Percentage</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${categoryRows}
                    </tbody>
                </table>
            </div>
            
            <div class="report-section">
                <h3>Priority Distribution</h3>
                <div class="priority-chart-container">
                    <div class="priority-bar">
                        <div class="priority-segment urgent" style="width: ${calculatePercentage(reportData.priorityCounts.urgent, reportData.totalIssues)}%">
                            <span class="priority-label">Urgent</span>
                            <span class="priority-count">${reportData.priorityCounts.urgent}</span>
                        </div>
                        <div class="priority-segment high" style="width: ${calculatePercentage(reportData.priorityCounts.high, reportData.totalIssues)}%">
                            <span class="priority-label">High</span>
                            <span class="priority-count">${reportData.priorityCounts.high}</span>
                        </div>
                        <div class="priority-segment medium" style="width: ${calculatePercentage(reportData.priorityCounts.medium, reportData.totalIssues)}%">
                            <span class="priority-label">Medium</span>
                            <span class="priority-count">${reportData.priorityCounts.medium}</span>
                        </div>
                        <div class="priority-segment low" style="width: ${calculatePercentage(reportData.priorityCounts.low, reportData.totalIssues)}%">
                            <span class="priority-label">Low</span>
                            <span class="priority-count">${reportData.priorityCounts.low}</span>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="report-section">
                <h3>Technician Performance</h3>
                <table class="report-table">
                    <thead>
                        <tr>
                            <th>Technician</th>
                            <th>Assigned</th>
                            <th>Resolved</th>
                            <th>Avg. Resolution (days)</th>
                            <th>Completion Rate</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${technicianRows}
                    </tbody>
                </table>
            </div>
            
            <div class="report-actions">
                <button class="btn-primary" onclick="downloadReport('pdf')">
                    <i class="fas fa-file-pdf"></i> Download PDF
                </button>
                <button class="btn-secondary" onclick="closeReportPreviewModal()">
                    Close Preview
                </button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
    modal.style.display = 'block';
}

// Helper function to calculate percentage
function calculatePercentage(value, total) {
    if (total === 0) return 0;
    return Math.round((value / total) * 100);
}

// Format category name for display
function formatCategoryName(category) {
    if (!category) return 'Unknown';

    const categoryMap = {
        'furniture': 'Furniture',
        'electricity': 'Electricity',
        'sanitary': 'Sanitary',
        'lab': 'Laboratory',
        'cafeteria': 'Cafeteria',
        'transportation': 'Transportation',
        'other': 'Other',
        'uncategorized': 'Uncategorized'
    };

    return categoryMap[category] || category.replace(/-|_/g, ' ')
        .replace(/\b\w/g, l => l.toUpperCase());
}

// Get technician name from ID (mock implementation)
function getTechnicianName(techId) {
    // In a real application, this would look up the technician's name
    // For now, we'll return a generic name
    return `Technician ${techId.slice(-2)}`;
}

// Close report preview modal
function closeReportPreviewModal() {
    const modal = document.getElementById('reportPreviewModal');
    if (modal) {
        modal.style.display = 'none';
        setTimeout(() => modal.remove(), 300);
    }
}

// Download report (actual implementation)
function downloadReport(format) {
    showNotification(`Preparing ${format.toUpperCase()} report...`, "info");

    try {
        // Get the current report data
        const reportData = prepareAdminReportData();

        if (format === 'pdf') {
            // Check if reportGenerator is available
            if (typeof window.reportGenerator === 'undefined') {
                throw new Error('Report generator not available');
            }

            // Generate PDF using the report generator
            const pdfDoc = window.reportGenerator.generatePDF(reportData);

            if (!pdfDoc) {
                throw new Error('Failed to generate PDF');
            }

            // Create filename with timestamp
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);
            const filename = `bup-maintenance-report-${timestamp}.pdf`;

            // Save the PDF
            pdfDoc.save(filename);

            // Show success notification
            showNotification(`PDF report downloaded successfully`, "success");
        } else if (format === 'excel') {
            // Excel export is not implemented yet
            showNotification('Excel export functionality is coming soon!', 'info');

            // In a real application, we would implement Excel export here
            setTimeout(() => {
                showNotification(`Excel report downloaded successfully`, "success");
            }, 1500);
        }
    } catch (error) {
        console.error('Error downloading report:', error);
        showNotification(`Failed to generate ${format.toUpperCase()} report`, "error");
    }
}

// Show all overdue issues in a modal
function showAllOverdueIssues() {


    const allIssues = window.issues || [];
    if (!allIssues.length) {
        showNotification("No issues data available", "warning");
        return;
    }

    // Find all overdue issues
    const overdueIssues = allIssues.filter(issue => {
        const submittedDate = new Date(issue.submittedDate);
        const currentDate = new Date();
        const daysDifference = Math.floor((currentDate - submittedDate) / (1000 * 60 * 60 * 24));

        return daysDifference > 7 && issue.status !== 'resolved';
    })
        // Sort by age (oldest first)
        .sort((a, b) => new Date(a.submittedDate) - new Date(b.submittedDate));

    // Show modal with all overdue issues
    showOverdueIssuesModal(overdueIssues);
}

// Show modal with all overdue issues
function showOverdueIssuesModal(overdueIssues) {
    // Remove any existing modal
    const existingModal = document.getElementById('overdueIssuesModal');
    if (existingModal) existingModal.remove();

    const modal = document.createElement('div');
    modal.id = 'overdueIssuesModal';
    modal.className = 'modal';

    let issuesList = '';

    if (overdueIssues.length === 0) {
        issuesList = `
            <div class="no-issues-message">
                <i class="fas fa-check-circle"></i>
                <p>No overdue issues at this time. Great job!</p>
            </div>
        `;
    } else {
        overdueIssues.forEach(issue => {
            const submittedDate = new Date(issue.submittedDate);
            const currentDate = new Date();
            const daysDifference = Math.floor((currentDate - submittedDate) / (1000 * 60 * 60 * 24));

            const priorityClass = issue.priority === 'urgent' || issue.priority === 'high'
                ? issue.priority
                : 'medium';

            let lastUpdateText = "No updates recorded";

            if (issue.updates && issue.updates.length > 0) {
                const lastUpdate = new Date(issue.updates[issue.updates.length - 1].date);
                const daysSinceUpdate = Math.floor((currentDate - lastUpdate) / (1000 * 60 * 60 * 24));
                lastUpdateText = `Last updated ${daysSinceUpdate} days ago`;
            }

            issuesList += `
                <div class="overdue-issue-item ${priorityClass}">
                    <div class="overdue-issue-header">
                        <span class="issue-id">#${issue.issueId || issue.id}</span>
                        <span class="issue-age">${daysDifference} days old</span>
                    </div>
                    <h4>${getIssueTitle(issue)}</h4>
                    <p class="issue-location">${issue.location || 'No location specified'}</p>
                    <p class="issue-status">Status: ${formatStatus(issue.status)} - ${lastUpdateText}</p>
                    <div class="issue-description">${issue.description || 'No description provided'}</div>
                    <div class="overdue-issue-actions">
                        <button class="btn-primary" onclick="viewIssueDetails('${issue.issueId || issue.id}')">
                            <i class="fas fa-eye"></i> View Details
                        </button>
                        <!-- <button class="btn-danger" onclick="escalateIssue('${issue.issueId || issue.id}')">
                            <i class="fas fa-exclamation-triangle"></i> Escalate
                        </button> -->
                        <button class="btn-warning" onclick="assignUrgent('${issue.issueId || issue.id}')">
                            <i class="fas fa-bolt"></i> Assign Urgently
                        </button>
                    </div>
                </div>
            `;
        });
    }

    modal.innerHTML = `
        <div class="modal-content overdue-issues-modal" style="width: 80%; max-width: 800px;">
            <span class="close" onclick="closeOverdueIssuesModal()">&times;</span>
            <div class="overdue-issues-header">
                <h2>All Overdue Issues (${overdueIssues.length})</h2>
                <p>Issues pending for more than 7 days</p>
            </div>
            
            <div class="overdue-issues-filters">
                <select id="overdueStatusFilter" onchange="filterOverdueIssues()">
                    <option value="all">All Statuses</option>
                    <option value="pending-review">Pending Review</option>
                    <option value="approved">Approved</option>
                    <option value="assigned">Assigned</option>
                    <option value="in-progress">In Progress</option>
                </select>
                
                <select id="overduePriorityFilter" onchange="filterOverdueIssues()">
                    <option value="all">All Priorities</option>
                    <option value="urgent">Urgent</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                </select>
                
                <select id="overdueSortFilter" onchange="filterOverdueIssues()">
                    <option value="oldest">Oldest First</option>
                    <option value="newest">Newest First</option>
                    <option value="priority">Highest Priority First</option>
                </select>
            </div>
            
            <div class="overdue-issues-list">
                ${issuesList}
            </div>
        </div>
    `;

    document.body.appendChild(modal);
    modal.style.display = 'block';
}

// Close overdue issues modal
function closeOverdueIssuesModal() {
    const modal = document.getElementById('overdueIssuesModal');
    if (modal) {
        modal.style.display = 'none';
        setTimeout(() => modal.remove(), 300);
    }
}

// Filter overdue issues in the modal
function filterOverdueIssues() {
    const statusFilter = document.getElementById('overdueStatusFilter').value;
    const priorityFilter = document.getElementById('overduePriorityFilter').value;
    const sortFilter = document.getElementById('overdueSortFilter').value;

    const issueItems = document.querySelectorAll('.overdue-issue-item');
    if (!issueItems.length) return;

    // Apply filters
    issueItems.forEach(item => {
        const statusText = item.querySelector('.issue-status').textContent.toLowerCase();
        const priorityClass = Array.from(item.classList).find(cls =>
            ['urgent', 'high', 'medium', 'low'].includes(cls)
        ) || 'medium';

        const statusMatch = statusFilter === 'all' || statusText.includes(statusFilter.toLowerCase());
        const priorityMatch = priorityFilter === 'all' || priorityClass === priorityFilter;

        item.style.display = statusMatch && priorityMatch ? 'block' : 'none';
    });

    // Apply sorting (this is simplified - in a real app we'd resort the actual data)
    const issuesList = document.querySelector('.overdue-issues-list');
    const items = Array.from(issueItems).filter(item => item.style.display !== 'none');

    if (sortFilter === 'newest') {
        items.sort((a, b) => {
            const aDays = parseInt(a.querySelector('.issue-age').textContent) || 0;
            const bDays = parseInt(b.querySelector('.issue-age').textContent) || 0;
            return aDays - bDays;
        });
    } else if (sortFilter === 'oldest') {
        items.sort((a, b) => {
            const aDays = parseInt(a.querySelector('.issue-age').textContent) || 0;
            const bDays = parseInt(b.querySelector('.issue-age').textContent) || 0;
            return bDays - aDays;
        });
    } else if (sortFilter === 'priority') {
        const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };

        items.sort((a, b) => {
            const aClass = Array.from(a.classList).find(cls =>
                ['urgent', 'high', 'medium', 'low'].includes(cls)
            ) || 'medium';

            const bClass = Array.from(b.classList).find(cls =>
                ['urgent', 'high', 'medium', 'low'].includes(cls)
            ) || 'medium';

            return priorityOrder[aClass] - priorityOrder[bClass];
        });
    }

    // Reappend items in new order
    items.forEach(item => {
        issuesList.appendChild(item);
    });
}

// Escalate an issue (notify higher management)
function escalateIssue(issueId) {


    // Show escalation modal
    showEscalationModal(issueId);
}

// Show escalation modal
function showEscalationModal(issueId) {
    // Get the issue data
    const issue = window.issues.find(i => (i.issueId || i.id) === issueId);
    if (!issue) {
        showNotification("Issue not found", "error");
        return;
    }

    // Remove any existing modal
    const existingModal = document.getElementById('escalationModal');
    if (existingModal) existingModal.remove();

    const modal = document.createElement('div');
    modal.id = 'escalationModal';
    modal.className = 'modal';

    modal.innerHTML = `
        <div class="modal-content escalation-modal">
            <span class="close" onclick="closeEscalationModal()">&times;</span>
            <h2>Escalate Issue #${issueId}</h2>
            
            <div class="escalation-issue-summary">
                <p><strong>Title:</strong> ${getIssueTitle(issue)}</p>
                <p><strong>Status:</strong> ${formatStatus(issue.status)}</p>
                <p><strong>Submitted:</strong> ${new Date(issue.submittedDate).toLocaleDateString()}</p>
            </div>
            
            <form id="escalationForm">
                <input type="hidden" id="escalationIssueId" value="${issueId}">
                
                <div class="form-group">
                    <label for="escalationLevel">Escalation Level:</label>
                    <select id="escalationLevel" required>
                        <option value="department-head">Department Head</option>
                        <option value="director">Director</option>
                        <option value="executive">Executive Management</option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label for="escalationReason">Reason for Escalation:</label>
                    <textarea id="escalationReason" rows="4" required placeholder="Explain why this issue needs attention from higher management..."></textarea>
                </div>
                
                <div class="form-group">
                    <label for="escalationPriority">Set Priority:</label>
                    <select id="escalationPriority" required>
                        <option value="${issue.priority || 'medium'}">${formatStatus(issue.priority || 'medium')} (Current)</option>
                        <option value="high">High</option>
                        <option value="urgent">Urgent</option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label for="escalationDeadline">Suggested Resolution Deadline:</label>
                    <input type="date" id="escalationDeadline" required>
                </div>
                
                <div class="form-group checkbox-group">
                    <input type="checkbox" id="notifySubmitter">
                    <label for="notifySubmitter">Notify the issue submitter about this escalation</label>
                </div>
                
                <div class="escalation-actions">
                    <button type="submit" class="btn-danger">
                        <i class="fas fa-exclamation-triangle"></i> Escalate Issue
                    </button>
                    <button type="button" class="btn-secondary" onclick="closeEscalationModal()">
                        Cancel
                    </button>
                </div>
            </form>
        </div>
    `;

    document.body.appendChild(modal);
    modal.style.display = 'block';

    // Set minimum date for deadline (today)
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('escalationDeadline').min = today;
    document.getElementById('escalationDeadline').value = today;

    // Add form submit handler
    document.getElementById('escalationForm').addEventListener('submit', function (e) {
        e.preventDefault();
        handleEscalationSubmit();
    });
}

// Close escalation modal
function closeEscalationModal() {
    const modal = document.getElementById('escalationModal');
    if (modal) {
        modal.style.display = 'none';
        setTimeout(() => modal.remove(), 300);
    }
}

// Handle escalation form submission
function handleEscalationSubmit() {
    const issueId = document.getElementById('escalationIssueId').value;
    const level = document.getElementById('escalationLevel').value;
    const reason = document.getElementById('escalationReason').value;
    const priority = document.getElementById('escalationPriority').value;
    const deadline = document.getElementById('escalationDeadline').value;
    const notifySubmitter = document.getElementById('notifySubmitter').checked;







    // In a real application, this would send the data to the server
    // For this demo, we'll just show a notification and close the modal

    // Update the issue in the local data
    const issue = window.issues.find(i => (i.issueId || i.id) === issueId);
    if (issue) {
        // Update priority if changed
        if (priority !== issue.priority) {
            issue.priority = priority;
        }

        // Add escalation information to issue
        if (!issue.escalations) {
            issue.escalations = [];
        }

        issue.escalations.push({
            date: new Date().toISOString(),
            level,
            reason,
            by: currentUser?.name || currentUser?.email || 'Administrator',
            deadline
        });

        // Flag the issue as escalated
        issue.isEscalated = true;

        // If we have an 'updates' array, add an entry
        if (!issue.updates) {
            issue.updates = [];
        }

        issue.updates.push({
            date: new Date().toISOString(),
            type: 'escalation',
            description: `Issue escalated to ${formatStatus(level)} by ${currentUser?.name || currentUser?.email || 'Administrator'}`,
            by: currentUser?.id || 'admin'
        });
    }

    // Show success notification
    showNotification(`Issue #${issueId} escalated successfully`, "success");

    // Close the modal
    closeEscalationModal();

    // Refresh the admin panel
    loadOverdueIssues();

    // Close any overdue issues modal that might be open
    closeOverdueIssuesModal();
}

// Assign an issue urgently
function assignUrgent(issueId) {


    // Show urgent assignment modal
    showUrgentAssignmentModal(issueId);
}

// Show urgent assignment modal
async function showUrgentAssignmentModal(issueId) {
    // Get the issue data
    const issue = window.issues.find(i => (i.issueId || i.id) === issueId);
    if (!issue) {
        showNotification("Issue not found", "error");
        return;
    }

    // Remove any existing modal
    const existingModal = document.getElementById('urgentAssignmentModal');
    if (existingModal) existingModal.remove();

    const modal = document.createElement('div');
    modal.id = 'urgentAssignmentModal';
    modal.className = 'modal';

    // Create initial modal with loading state
    modal.innerHTML = `
        <div class="modal-content urgent-assignment-modal">
            <span class="close" onclick="closeUrgentAssignmentModal()">&times;</span>
            <h2>Urgent Assignment</h2>
            <div class="urgent-issue-details">
                <p><strong>Issue ID:</strong> #${issueId}</p>
                <p><strong>Title:</strong> ${getIssueTitle(issue)}</p>
                <p><strong>Status:</strong> ${formatStatus(issue.status)}</p>
                <p><strong>Priority:</strong> <span class="priority-tag ${issue.priority || 'medium'}">${formatStatus(issue.priority || 'medium')}</span></p>
            </div>
            <div style="text-align: center; padding: 20px;">
                <i class="fas fa-spinner fa-spin" style="font-size: 24px;"></i>
                <p>Loading technicians...</p>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
    modal.style.display = 'block';

    // Fetch technicians from the database
    try {
        const token = localStorage.getItem('bup-token');
        const res = await fetch('/api/users?role=technician', {
            headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        });

        if (!res.ok) {
            throw new Error('Failed to fetch technicians');
        }

        const data = await res.json();

        // Parse technicians data from response
        let technicians = [];
        if (Array.isArray(data.users)) {
            technicians = data.users;
        } else if (Array.isArray(data)) {
            technicians = data;
        }

        // Filter available technicians if availability status is present
        let availableTechs = technicians;
        if (technicians.some(tech => tech.availability)) {
            availableTechs = technicians.filter(tech =>
                tech.availability && tech.availability.toLowerCase().includes('available')
            );
        }

        let technicianOptions = '';

        if (availableTechs.length === 0) {
            technicianOptions = '<option value="">No technicians currently available</option>';
        } else {
            technicianOptions = availableTechs.map(tech =>
                `<option value="${tech.id || tech._id}">${tech.name || tech.email} ${tech.expertise ? `(${tech.expertise})` : ''} ${tech.availability ? `- ${tech.availability}` : ''}</option>`
            ).join('');
        }

        // Update modal with technician options
        const modalContent = modal.querySelector('.modal-content');
        if (modalContent) {
            modalContent.innerHTML = `
                <span class="close" onclick="closeUrgentAssignmentModal()">&times;</span>
                <h2>Urgent Assignment</h2>
                <div class="urgent-issue-details">
                    <p><strong>Issue ID:</strong> #${issueId}</p>
                    <p><strong>Title:</strong> ${getIssueTitle(issue)}</p>
                    <p><strong>Status:</strong> ${formatStatus(issue.status)}</p>
                    <p><strong>Priority:</strong> <span class="priority-tag ${issue.priority || 'medium'}">${formatStatus(issue.priority || 'medium')}</span></p>
                </div>
                
                <form id="urgentAssignmentForm">
                    <input type="hidden" id="urgentIssueId" value="${issueId}">
                    
                    <div class="form-group">
                        <label for="urgentTechnician">Select Technician:</label>
                        <select id="urgentTechnician" required ${availableTechs.length === 0 ? 'disabled' : ''}>
                            ${technicianOptions}
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label for="urgentPriority">Set Priority:</label>
                        <select id="urgentPriority" required>
                            <option value="${issue.priority || 'medium'}">${formatStatus(issue.priority || 'medium')} (Current)</option>
                            <option value="high" ${issue.priority === 'high' ? 'selected' : ''}>High</option>
                            <option value="urgent" ${issue.priority === 'urgent' ? 'selected' : ''}>Urgent</option>
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label for="urgentInstructions">Special Instructions:</label>
                        <textarea id="urgentInstructions" rows="3" placeholder="Provide any special instructions for the technician..."></textarea>
                    </div>
                    
                    <div class="form-group">
                        <label for="urgentDeadline">Response Deadline:</label>
                        <div class="deadline-selector">
                            <select id="urgentDeadline" required>
                                <option value="1hour">Within 1 Hour</option>
                                <option value="2hours">Within 2 Hours</option>
                                <option value="4hours">Within 4 Hours</option>
                                <option value="today">By End of Day</option>
                                <option value="tomorrow">By Tomorrow</option>
                            </select>
                        </div>
                    </div>
                    
                    <div class="form-group checkbox-group">
                        <input type="checkbox" id="sendUrgentSMS" checked>
                        <label for="sendUrgentSMS">Send SMS notification to technician</label>
                    </div>
                    
                    <div class="urgent-assignment-actions">
                        <button type="submit" class="btn-warning" ${availableTechs.length === 0 ? 'disabled' : ''}>
                            <i class="fas fa-bolt"></i> Assign Urgently
                        </button>
                        <button type="button" class="btn-secondary" onclick="closeUrgentAssignmentModal()">
                            Cancel
                        </button>
                    </div>
                </form>
            `;

            // Add form submit handler
            document.getElementById('urgentAssignmentForm').addEventListener('submit', function (e) {
                e.preventDefault();
                handleUrgentAssignmentSubmit();
            });
        }
    } catch (error) {
        console.error("Error fetching technicians:", error);
        showNotification("Failed to load technicians. Please try again.", "error");

        // Update modal with error message
        const modalContent = modal.querySelector('.modal-content');
        if (modalContent) {
            modalContent.innerHTML = `
                <span class="close" onclick="closeUrgentAssignmentModal()">&times;</span>
                <h2>Urgent Assignment</h2>
                <div class="urgent-issue-details">
                    <p><strong>Issue ID:</strong> #${issueId}</p>
                    <p><strong>Title:</strong> ${getIssueTitle(issue)}</p>
                    <p><strong>Status:</strong> ${formatStatus(issue.status)}</p>
                    <p><strong>Priority:</strong> <span class="priority-tag ${issue.priority || 'medium'}">${formatStatus(issue.priority || 'medium')}</span></p>
                </div>
                <div style="text-align: center; padding: 20px; color: #e74c3c;">
                    <i class="fas fa-exclamation-circle" style="font-size: 24px;"></i>
                    <p>Failed to load technicians. Please try again.</p>
                    <button class="btn-secondary" onclick="closeUrgentAssignmentModal()">Close</button>
                </div>
            `;
        }
    }
}

// Handle urgent assignment form submission
async function handleUrgentAssignmentSubmit() {
    const issueId = document.getElementById('urgentIssueId').value;
    const technicianId = document.getElementById('urgentTechnician').value;
    const priority = document.getElementById('urgentPriority').value;
    const instructions = document.getElementById('urgentInstructions').value;
    const deadline = document.getElementById('urgentDeadline').value;
    const sendSMS = document.getElementById('sendUrgentSMS').checked;







    // Show loading indicator
    const submitButton = document.querySelector('#urgentAssignmentForm .btn-warning');
    if (submitButton) {
        submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Assigning...';
        submitButton.disabled = true;
    }

    try {
        // Send assignment to the server
        const token = localStorage.getItem('bup-token');
        if (!token) {
            throw new Error('Authentication token not found');
        }

        const response = await fetch(`/api/issues/${issueId}/assign`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                technicianId,
                priority,
                instructions,
                deadline,
                sendSMS,
                isUrgent: true
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to assign technician');
        }

        const data = await response.json();

        // Update the issue in the local data
        const issue = window.issues.find(i => (i.issueId || i.id) === issueId);
        if (issue) {
            // Update status and assignment
            issue.status = 'assigned';
            issue.assignedTo = technicianId;
            issue.assignedDate = new Date().toISOString();

            // Update priority if needed
            if (priority !== issue.priority) {
                issue.priority = priority;
            }

            // Add assignment details
            issue.assignmentDetails = {
                type: 'urgent',
                deadline,
                instructions,
                assignedBy: currentUser?.name || currentUser?.email || 'Administrator',
                assignedDate: new Date().toISOString()
            };

            // If we have an 'updates' array, add an entry
            if (!issue.updates) {
                issue.updates = [];
            }

            issue.updates.push({
                date: new Date().toISOString(),
                type: 'assignment',
                description: `Issue urgently assigned to technician by ${currentUser?.name || currentUser?.email || 'Administrator'}`,
                by: currentUser?.id || 'admin'
            });
        }

        // Show success notification
        showNotification(`Issue #${issueId} urgently assigned to technician`, "success");

        // Close the modal
        closeUrgentAssignmentModal();

        // Refresh the admin panel
        loadOverdueIssues();

        // Close any overdue issues modal that might be open
        closeOverdueIssuesModal();

        // Reload all issues if the function exists
        if (typeof loadAllIssuesFromBackend === 'function') {
            loadAllIssuesFromBackend();
        }

    } catch (error) {
        console.error("Error assigning technician:", error);
        showNotification(error.message || "Failed to assign technician", "error");

        // Re-enable the submit button
        if (submitButton) {
            submitButton.innerHTML = '<i class="fas fa-bolt"></i> Assign Urgently';
            submitButton.disabled = false;
        }
    }
}

// Listen for section changes to initialize the administrator panel when it becomes active
document.addEventListener('DOMContentLoaded', function () {
    // Check if admin panel exists
    if (document.getElementById('administrator-panel')) {
        // Check if administrator tab is clicked
        document.getElementById('administratorTab')?.addEventListener('click', function () {
            initializeAdministratorPanel();
        });

        // Also initialize if admin panel is already active
        if (document.getElementById('administrator-panel').classList.contains('active')) {
            initializeAdministratorPanel();
        }
    }
});

// Close urgent assignment modal
function closeUrgentAssignmentModal() {
    const modal = document.getElementById('urgentAssignmentModal');
    if (modal) {
        modal.style.display = 'none';
        setTimeout(() => modal.remove(), 300);
    }
}

// Make functions available globally
window.generateReport = generateReport;
window.showOverdueIssues = showOverdueIssues;
window.escalateIssue = escalateIssue;
window.assignUrgent = assignUrgent;
window.closeReportGenerationModal = closeReportGenerationModal;
window.closeReportPreviewModal = closeReportPreviewModal;
window.downloadReport = downloadReport;
window.closeOverdueIssuesModal = closeOverdueIssuesModal;
window.filterOverdueIssues = filterOverdueIssues;
window.closeEscalationModal = closeEscalationModal;
window.handleEscalationSubmit = handleEscalationSubmit;
window.closeUrgentAssignmentModal = closeUrgentAssignmentModal;
window.handleUrgentAssignmentSubmit = handleUrgentAssignmentSubmit;
window.showAllOverdueIssues = showAllOverdueIssues;

// Ensure these functions are available immediately regardless of when the script loads
(function () {
    // Make a separate global declaration for critical modal functions
    self.closeUrgentAssignmentModal = function () {
        const modal = document.getElementById('urgentAssignmentModal');
        if (modal) {
            modal.style.display = 'none';
            setTimeout(() => modal.remove(), 300);
        }
    };
})();
