/**
 * Reports management functionality
 */

// Global report data
let reportData = {
    startDate: null,
    endDate: null,
    reportType: 'summary',
    filteredIssues: []
};

/**
 * Initialize reports functionality
 */
function initializeReports() {

    // Set default date ranges
    setDefaultDateRange();

    // Set up event listeners
    setupReportEventListeners();

    // Clear the hardcoded table data
    clearInitialTableData();

    // Generate initial report with a slight delay to ensure everything is ready
    setTimeout(() => {
        generateCustomReport(false); // Don't show notification on auto-load

    }, 100);

    // Make window.reportData available globally
    window.reportData = reportData;
}

/**
 * Clear initial hardcoded table data
 */
function clearInitialTableData() {

    const reportTables = document.querySelectorAll('.report-table');
    reportTables.forEach(table => {
        const tbody = table.querySelector('tbody');
        if (tbody) {
            tbody.innerHTML = '';

        } else {
            console.warn('Table body not found for clearing');
        }
    });
}

/**
 * Set default date range (last 30 days)
 */
function setDefaultDateRange() {
    const today = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 30);

    const startDateInput = document.getElementById('reportStartDate');
    const endDateInput = document.getElementById('reportEndDate');

    if (startDateInput) {
        startDateInput.valueAsDate = thirtyDaysAgo;
        reportData.startDate = thirtyDaysAgo.toISOString().split('T')[0];
    }

    if (endDateInput) {
        endDateInput.valueAsDate = today;
        reportData.endDate = today.toISOString().split('T')[0];
    }
}

/**
 * Set up event listeners for report controls
 */
function setupReportEventListeners() {
    // Report type change
    const reportTypeSelect = document.getElementById('reportType');
    if (reportTypeSelect) {
        reportTypeSelect.addEventListener('change', function () {
            reportData.reportType = this.value;
            generateCustomReport(false); // Don't show notification on filter change
        });
    }

    // Date range changes
    const startDateInput = document.getElementById('reportStartDate');
    const endDateInput = document.getElementById('reportEndDate');

    if (startDateInput) {
        startDateInput.addEventListener('change', function () {
            reportData.startDate = this.value;
            validateDateRange();
        });
    }

    if (endDateInput) {
        endDateInput.addEventListener('change', function () {
            reportData.endDate = this.value;
            validateDateRange();
        });
    }

    // Generate button
    const generateBtn = document.querySelector('.reports-filters button.btn-primary');
    if (generateBtn) {
        // Remove any existing event listeners
        generateBtn.replaceWith(generateBtn.cloneNode(true));

        // Add new event listener
        document.querySelector('.reports-filters button.btn-primary').addEventListener('click', function () {
            generateCustomReport(true); // Show notification on explicit generation
        });
    }

    // Export buttons
    const exportPdfBtn = document.querySelector('.report-actions button:nth-child(1)');
    const exportExcelBtn = document.querySelector('.report-actions button:nth-child(2)');

    if (exportPdfBtn) {
        exportPdfBtn.addEventListener('click', function () {
            exportReport('pdf');
        });
    }

    if (exportExcelBtn) {
        exportExcelBtn.addEventListener('click', function () {
            exportReport('excel');
        });
    }
}

/**
 * Validate date range and ensure start date is before end date
 */
function validateDateRange() {
    const startDateInput = document.getElementById('reportStartDate');
    const endDateInput = document.getElementById('reportEndDate');

    if (!startDateInput || !endDateInput) return;

    const startDate = new Date(startDateInput.value);
    const endDate = new Date(endDateInput.value);

    if (startDate > endDate) {
        showNotification('Start date cannot be after end date', 'error');
        // Reset to default
        setDefaultDateRange();
    } else {
        // Valid range, generate report
        generateCustomReport();
    }
}

/**
 * Generate a custom report based on selected filters
 * @param {boolean} showNotification - Whether to show a notification when report is generated
 */
function generateCustomReport(showNotification = false) {
    // Validate inputs
    if (!reportData.startDate || !reportData.endDate) {
        setDefaultDateRange();
    }

    // Filter issues by date range
    filterIssuesByDateRange();

    // Show loading state
    const reportTables = document.querySelector('.report-tables');
    if (reportTables) {
        reportTables.classList.add('loading');
    }

    // Generate report based on type with a slight delay to allow UI update
    setTimeout(() => {
        switch (reportData.reportType) {
            case 'summary':
                generateSummaryReport();
                break;
            case 'detailed':
                generateDetailedReport();
                break;
            case 'performance':
                generatePerformanceReport();
                break;
            case 'trends':
                generateTrendsReport();
                break;
            default:
                generateSummaryReport();
        }

        // Generate charts for visualization
        if (typeof analyticsManager !== 'undefined') {
            try {
                analyticsManager.generateTrendsChart();
                analyticsManager.generateCategoryChart();
            } catch (error) {
                console.error('Error generating charts:', error);
            }
        }

        // Remove loading state
        if (reportTables) {
            reportTables.classList.remove('loading');
        }

        // Only show notification if explicitly requested (like from button click)
        if (showNotification) {
            showNotification('Report generated successfully', 'success');
        }
    }, 200);
}

/**
 * Filter issues by date range
 */
function filterIssuesByDateRange() {
    if (!window.issues || !Array.isArray(window.issues)) {
        reportData.filteredIssues = [];
        return;
    }

    const startDate = new Date(reportData.startDate);
    const endDate = new Date(reportData.endDate);
    // Set end date to end of day
    endDate.setHours(23, 59, 59, 999);

    reportData.filteredIssues = window.issues.filter(issue => {
        if (!issue.submittedDate) return false;
        const issueDate = new Date(issue.submittedDate);
        return issueDate >= startDate && issueDate <= endDate;
    });


}

/**
 * Generate summary report
 */
function generateSummaryReport() {
    // Get summary statistics
    const issues = reportData.filteredIssues;
    const totalIssues = issues.length;
    const resolvedIssues = issues.filter(i => i.status === 'resolved').length;
    const pendingIssues = issues.filter(i => i.status === 'pending-review' || i.status === 'assigned').length;
    const inProgressIssues = issues.filter(i => i.status === 'in-progress').length;
    const resolutionRate = totalIssues > 0 ? ((resolvedIssues / totalIssues) * 100).toFixed(1) : '0';

    // Calculate average resolution time
    let avgResolutionTime = 'N/A';
    const resolvedWithDates = issues.filter(i => i.status === 'resolved' && i.submittedDate && i.resolvedDate);

    if (resolvedWithDates.length > 0) {
        const totalDays = resolvedWithDates.reduce((total, issue) => {
            const submitted = new Date(issue.submittedDate);
            const resolved = new Date(issue.resolvedDate);
            const days = Math.ceil((resolved - submitted) / (1000 * 60 * 60 * 24));
            return total + days;
        }, 0);

        avgResolutionTime = (totalDays / resolvedWithDates.length).toFixed(1) + ' days';
    }

    // Update report tables
    updateCategoryTable(issues);
    updateSummaryStats(totalIssues, resolvedIssues, pendingIssues, inProgressIssues, resolutionRate, avgResolutionTime);
}

/**
 * Generate detailed report
 */
function generateDetailedReport() {
    // Start with summary
    generateSummaryReport();

    // Add detailed data for each issue
    const reportTables = document.querySelector('.report-tables');
    if (!reportTables) return;

    // Add detailed issues table if it doesn't exist
    let detailedTable = document.getElementById('detailed-issues-table');
    if (!detailedTable) {
        const tableContainer = document.createElement('div');
        tableContainer.className = 'table-container';
        tableContainer.innerHTML = `
            <h4>Detailed Issue Log</h4>
            <table class="report-table" id="detailed-issues-table">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Date</th>
                        <th>Location</th>
                        <th>Category</th>
                        <th>Status</th>
                        <th>Priority</th>
                    </tr>
                </thead>
                <tbody>
                    <!-- Rows will be added dynamically -->
                </tbody>
            </table>
        `;
        reportTables.appendChild(tableContainer);
        detailedTable = document.getElementById('detailed-issues-table');
    }

    // Clear and populate the table
    const tbody = detailedTable.querySelector('tbody');
    tbody.innerHTML = '';

    reportData.filteredIssues.forEach(issue => {
        const row = document.createElement('tr');
        const submittedDate = issue.submittedDate ? new Date(issue.submittedDate).toLocaleDateString() : 'Unknown';

        row.innerHTML = `
            <td>${issue.issueId || issue.id || 'N/A'}</td>
            <td>${submittedDate}</td>
            <td>${formatLocationName(issue.location) || 'Unknown'}</td>
            <td>${formatCategoryName(issue.category) || 'Unknown'}</td>
            <td>${formatStatus(issue.status) || 'Unknown'}</td>
            <td>${issue.priority || 'Unknown'}</td>
        `;

        tbody.appendChild(row);
    });
}

/**
 * Generate performance report
 */
function generatePerformanceReport() {
    // Start with summary
    generateSummaryReport();

    // Add technician performance table
    const reportTables = document.querySelector('.report-tables');
    if (!reportTables) return;

    // Get issues with technician assignments
    const techIssues = reportData.filteredIssues.filter(issue => issue.assignedTo);

    // Group by technician
    const techPerformance = {};
    techIssues.forEach(issue => {
        const techId = issue.assignedTo;
        if (!techPerformance[techId]) {
            techPerformance[techId] = {
                name: issue.assignedName || techId,
                total: 0,
                resolved: 0,
                avgTime: 0,
                totalTime: 0,
                avgRating: 0,
                ratings: []
            };
        }

        // Increment counters
        techPerformance[techId].total++;
        if (issue.status === 'resolved') {
            techPerformance[techId].resolved++;

            // Calculate resolution time if available
            if (issue.submittedDate && issue.resolvedDate) {
                const submitted = new Date(issue.submittedDate);
                const resolved = new Date(issue.resolvedDate);
                const days = Math.ceil((resolved - submitted) / (1000 * 60 * 60 * 24));
                techPerformance[techId].totalTime += days;
            }
        }

        // Add rating if available
        if (issue.rating) {
            techPerformance[techId].ratings.push(issue.rating);
        }
    });

    // Calculate averages
    Object.values(techPerformance).forEach(tech => {
        if (tech.resolved > 0) {
            tech.avgTime = (tech.totalTime / tech.resolved).toFixed(1);
        }

        if (tech.ratings.length > 0) {
            const totalRating = tech.ratings.reduce((sum, rating) => sum + rating, 0);
            tech.avgRating = (totalRating / tech.ratings.length).toFixed(1);
        }
    });

    // Create or update performance table
    let performanceTable = document.getElementById('performance-table');
    if (!performanceTable) {
        const tableContainer = document.createElement('div');
        tableContainer.className = 'table-container';
        tableContainer.innerHTML = `
            <h4>Technician Performance</h4>
            <table class="report-table" id="performance-table">
                <thead>
                    <tr>
                        <th>Technician</th>
                        <th>Assigned</th>
                        <th>Resolved</th>
                        <th>Resolution Rate</th>
                        <th>Avg Time (days)</th>
                        <th>Avg Rating</th>
                    </tr>
                </thead>
                <tbody>
                    <!-- Rows will be added dynamically -->
                </tbody>
            </table>
        `;
        reportTables.appendChild(tableContainer);
        performanceTable = document.getElementById('performance-table');
    }

    // Clear and populate the table
    const tbody = performanceTable.querySelector('tbody');
    tbody.innerHTML = '';

    Object.values(techPerformance).forEach(tech => {
        const row = document.createElement('tr');
        const resolutionRate = tech.total > 0 ? ((tech.resolved / tech.total) * 100).toFixed(1) + '%' : 'N/A';

        row.innerHTML = `
            <td>${tech.name}</td>
            <td>${tech.total}</td>
            <td>${tech.resolved}</td>
            <td>${resolutionRate}</td>
            <td>${tech.avgTime || 'N/A'}</td>
            <td>${tech.avgRating || 'N/A'}</td>
        `;

        tbody.appendChild(row);
    });
}

/**
 * Generate trends report
 */
function generateTrendsReport() {
    // Start with summary
    generateSummaryReport();

    // Add monthly trends table
    const reportTables = document.querySelector('.report-tables');
    if (!reportTables) return;

    // Group issues by month
    const monthlyData = {};
    reportData.filteredIssues.forEach(issue => {
        if (!issue.submittedDate) return;

        const date = new Date(issue.submittedDate);
        const monthYear = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;

        if (!monthlyData[monthYear]) {
            monthlyData[monthYear] = {
                submitted: 0,
                resolved: 0,
                inProgress: 0,
                pending: 0
            };
        }

        // Increment counters
        monthlyData[monthYear].submitted++;

        // Update status counters
        if (issue.status === 'resolved') {
            monthlyData[monthYear].resolved++;
        } else if (issue.status === 'in-progress') {
            monthlyData[monthYear].inProgress++;
        } else if (issue.status === 'pending-review' || issue.status === 'assigned') {
            monthlyData[monthYear].pending++;
        }
    });

    // Create or update trends table
    let trendsTable = document.getElementById('trends-table');
    if (!trendsTable) {
        const tableContainer = document.createElement('div');
        tableContainer.className = 'table-container';
        tableContainer.innerHTML = `
            <h4>Monthly Trends</h4>
            <table class="report-table" id="trends-table">
                <thead>
                    <tr>
                        <th>Month</th>
                        <th>Submitted</th>
                        <th>Resolved</th>
                        <th>Resolution Rate</th>
                        <th>In Progress</th>
                        <th>Pending</th>
                    </tr>
                </thead>
                <tbody>
                    <!-- Rows will be added dynamically -->
                </tbody>
            </table>
        `;
        reportTables.appendChild(tableContainer);
        trendsTable = document.getElementById('trends-table');
    }

    // Clear and populate the table
    const tbody = trendsTable.querySelector('tbody');
    tbody.innerHTML = '';

    // Sort months chronologically
    const sortedMonths = Object.keys(monthlyData).sort();

    sortedMonths.forEach(month => {
        const data = monthlyData[month];
        const row = document.createElement('tr');
        const [year, monthNum] = month.split('-');
        const date = new Date(year, monthNum - 1);
        const monthName = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        const resolutionRate = data.submitted > 0 ? ((data.resolved / data.submitted) * 100).toFixed(1) + '%' : 'N/A';

        row.innerHTML = `
            <td>${monthName}</td>
            <td>${data.submitted}</td>
            <td>${data.resolved}</td>
            <td>${resolutionRate}</td>
            <td>${data.inProgress}</td>
            <td>${data.pending}</td>
        `;

        tbody.appendChild(row);
    });
}

/**
 * Update category breakdown table
 * @param {Array} issues - Filtered issues
 */
function updateCategoryTable(issues) {


    // Group issues by category
    const categoryData = {};

    // First, initialize with all known categories to avoid missing any
    const knownCategories = [
        'furniture',
        'electricity',
        'sanitary',
        'lab',
        'cafeteria',
        'transportation',
        'other'
    ];

    knownCategories.forEach(cat => {
        categoryData[cat] = {
            total: 0,
            resolved: 0,
            pending: 0,
            avgResolutionTime: 0,
            totalDays: 0
        };
    });

    // Then populate with actual data
    issues.forEach(issue => {
        const category = issue.category || 'other';

        if (!categoryData[category]) {
            categoryData[category] = {
                total: 0,
                resolved: 0,
                pending: 0,
                avgResolutionTime: 0,
                totalDays: 0
            };
        }

        // Increment counters
        categoryData[category].total++;

        if (issue.status === 'resolved') {
            categoryData[category].resolved++;

            // Calculate resolution time if available
            if (issue.submittedDate && issue.resolvedDate) {
                const submitted = new Date(issue.submittedDate);
                const resolved = new Date(issue.resolvedDate);
                const days = Math.ceil((resolved - submitted) / (1000 * 60 * 60 * 24));
                categoryData[category].totalDays += days;
            }
        } else if (issue.status === 'pending-review' || issue.status === 'assigned') {
            categoryData[category].pending++;
        }
    });

    // Calculate averages
    Object.values(categoryData).forEach(cat => {
        if (cat.resolved > 0) {
            cat.avgResolutionTime = (cat.totalDays / cat.resolved).toFixed(1);
        }
    });

    // Get the table
    const categoryTable = document.querySelector('.report-table');
    if (!categoryTable) {
        console.error('Category table not found');
        return;
    }

    // Update the table
    const tbody = categoryTable.querySelector('tbody');
    if (!tbody) {
        console.error('Table body not found');
        return;
    }

    // Clear existing rows
    tbody.innerHTML = '';

    // Add rows for each category that has data
    let hasData = false;

    Object.entries(categoryData)
        .filter(([_, data]) => data.total > 0)  // Only show categories with issues
        .sort((a, b) => b[1].total - a[1].total) // Sort by total count, descending
        .forEach(([category, data]) => {
            hasData = true;
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${formatCategoryName(category)}</td>
                <td>${data.total}</td>
                <td>${data.resolved}</td>
                <td>${data.pending}</td>
                <td>${data.avgResolutionTime || 'N/A'} days</td>
            `;

            tbody.appendChild(row);
        });

    // Add a "No data available" row if the table is empty
    if (!hasData) {
        const noDataRow = document.createElement('tr');
        noDataRow.innerHTML = `
            <td colspan="5" class="no-data">No category data available for the selected period</td>
        `;
        tbody.appendChild(noDataRow);
    }


}

/**
 * Update summary statistics
 */
function updateSummaryStats(total, resolved, pending, inProgress, resolutionRate, avgResolutionTime) {
    // Add summary stats if they don't exist
    const reportContent = document.querySelector('.reports-content');
    if (!reportContent) return;

    // Check if summary stats exist
    let summaryStats = document.querySelector('.report-summary-stats');
    if (!summaryStats) {
        // Create summary stats
        summaryStats = document.createElement('div');
        summaryStats.className = 'report-summary-stats';
        summaryStats.innerHTML = `
            <h3>Summary Statistics</h3>
            <div class="summary-stats-grid">
                <div class="summary-stat">
                    <h4>Total Issues</h4>
                    <span class="stat-value" id="stat-total-issues">0</span>
                </div>
                <div class="summary-stat">
                    <h4>Resolved</h4>
                    <span class="stat-value" id="stat-resolved-issues">0</span>
                </div>
                <div class="summary-stat">
                    <h4>Pending</h4>
                    <span class="stat-value" id="stat-pending-issues">0</span>
                </div>
                <div class="summary-stat">
                    <h4>In Progress</h4>
                    <span class="stat-value" id="stat-inprogress-issues">0</span>
                </div>
                <div class="summary-stat">
                    <h4>Resolution Rate</h4>
                    <span class="stat-value" id="stat-resolution-rate">0%</span>
                </div>
                <div class="summary-stat">
                    <h4>Avg Resolution Time</h4>
                    <span class="stat-value" id="stat-avg-resolution-time">N/A</span>
                </div>
            </div>
        `;

        // Insert after filters but before charts
        const chartContainer = document.querySelector('.chart-container');
        if (chartContainer) {
            reportContent.insertBefore(summaryStats, chartContainer);
        } else {
            reportContent.appendChild(summaryStats);
        }
    }

    // Update the stats
    document.getElementById('stat-total-issues').textContent = total;
    document.getElementById('stat-resolved-issues').textContent = resolved;
    document.getElementById('stat-pending-issues').textContent = pending;
    document.getElementById('stat-inprogress-issues').textContent = inProgress;
    document.getElementById('stat-resolution-rate').textContent = resolutionRate + '%';
    document.getElementById('stat-avg-resolution-time').textContent = avgResolutionTime;
}

/**
 * Export report based on selected format
 */
function exportReport(format) {
    // Create export data
    const exportData = {
        reportType: reportData.reportType,
        dateRange: {
            startDate: reportData.startDate,
            endDate: reportData.endDate
        },
        issues: reportData.filteredIssues,
        generatedAt: new Date().toISOString()
    };

    if (format === 'pdf') {
        exportAsPDF(exportData);
    } else if (format === 'excel') {
        exportAsExcel(exportData);
    }
}

/**
 * Export report as PDF
 */
function exportAsPDF(data) {
    // In a real app, we would use a PDF library
    // For now, we'll simulate by showing a notification
    showNotification('Exporting report as PDF...', 'info');

    // If analyticsManager is available, use it
    if (typeof analyticsManager !== 'undefined' && analyticsManager.simulateReportGeneration) {
        analyticsManager.simulateReportGeneration('pdf', data);
    } else {
        // Otherwise, just log to console


        // Simulate download with a delayed notification
        setTimeout(() => {
            showNotification('PDF report downloaded successfully', 'success');
        }, 1500);
    }
}

/**
 * Export report as Excel
 */
function exportAsExcel(data) {
    // In a real app, we would use an Excel library
    // For now, we'll simulate by showing a notification
    showNotification('Exporting report as Excel...', 'info');

    // If analyticsManager is available, use it
    if (typeof analyticsManager !== 'undefined' && analyticsManager.simulateReportGeneration) {
        analyticsManager.simulateReportGeneration('excel', data);
    } else {
        // Otherwise, just log to console


        // Simulate download with a delayed notification
        setTimeout(() => {
            showNotification('Excel report downloaded successfully', 'success');
        }, 1500);
    }
}

/**
 * Format category name for display
 */
function formatCategoryName(category) {
    if (!category) return 'Unknown';

    // Map category values to display names
    const categoryMap = {
        'furniture': 'Furniture',
        'electricity': 'Electricity',
        'sanitary': 'Sanitary',
        'lab': 'Laboratory',
        'cafeteria': 'Cafeteria',
        'transportation': 'Transportation',
        'other': 'Other'
    };

    return categoryMap[category] || category.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

/**
 * Format status for display
 */
function formatStatus(status) {
    if (!status) return 'Unknown';

    // Map status values to display names
    const statusMap = {
        'pending-review': 'Pending Review',
        'assigned': 'Assigned',
        'in-progress': 'In Progress',
        'resolved': 'Resolved',
        'rejected': 'Rejected'
    };

    return statusMap[status] || status.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

// Make these functions available globally
window.initializeReports = initializeReports;
window.generateCustomReport = generateCustomReport;
window.exportReport = exportReport;
