class AnalyticsManager {
    constructor() {
        this.data = {
            issues: [],
            resolutionTimes: [],
            categories: {},
            priorities: {},
            locations: {},
            trends: []
        };
    }

    initializeAnalytics() {
        // Use real data if available, otherwise generate mock data
        if (window.issues && Array.isArray(window.issues) && window.issues.length > 0) {
            this.data.issues = window.issues;
        } else {
            this.generateMockData();
        }
        this.calculateMetrics();
    }

    generateMockData() {
        const categories = ['furniture', 'electricity', 'sanitary', 'lab', 'cafeteria', 'transportation'];
        const priorities = ['low', 'medium', 'high', 'urgent'];
        const locations = ['academic-block-1', 'academic-block-2', 'library', 'cafeteria', 'admin-building'];
        const statuses = ['pending', 'in-progress', 'resolved', 'rejected'];

        for (let i = 0; i < 100; i++) {
            const date = new Date();
            date.setDate(date.getDate() - Math.floor(Math.random() * 180));

            const issue = {
                id: `BUP${String(i + 1).padStart(3, '0')}`,
                category: categories[Math.floor(Math.random() * categories.length)],
                priority: priorities[Math.floor(Math.random() * priorities.length)],
                location: locations[Math.floor(Math.random() * locations.length)],
                submittedDate: date.toISOString().split('T')[0],
                status: statuses[Math.floor(Math.random() * statuses.length)],
                resolutionTime: Math.floor(Math.random() * 14) + 1
            };

            this.data.issues.push(issue);
        }
    }

    calculateMetrics() {
        this.data.categories = this.data.issues.reduce((acc, issue) => {
            acc[issue.category] = (acc[issue.category] || 0) + 1;
            return acc;
        }, {});

        this.data.priorities = this.data.issues.reduce((acc, issue) => {
            acc[issue.priority] = (acc[issue.priority] || 0) + 1;
            return acc;
        }, {});

        this.data.locations = this.data.issues.reduce((acc, issue) => {
            acc[issue.location] = (acc[issue.location] || 0) + 1;
            return acc;
        }, {});

        this.calculateMonthlyTrends();
    }

    calculateMonthlyTrends() {
        const monthlyData = {};

        this.data.issues.forEach(issue => {
            const month = issue.submittedDate.substring(0, 7);
            if (!monthlyData[month]) {
                monthlyData[month] = { submitted: 0, resolved: 0 };
            }
            monthlyData[month].submitted++;
            if (issue.status === 'resolved') {
                monthlyData[month].resolved++;
            }
        });

        this.data.trends = Object.keys(monthlyData)
            .sort()
            .map(month => ({
                month,
                submitted: monthlyData[month].submitted,
                resolved: monthlyData[month].resolved,
                resolutionRate: (monthlyData[month].resolved / monthlyData[month].submitted * 100).toFixed(1)
            }));
    }

    getOverallStats() {
        const totalIssues = this.data.issues.length;
        const resolvedIssues = this.data.issues.filter(i => i.status === 'resolved').length;
        const pendingIssues = this.data.issues.filter(i => i.status === 'pending').length;
        const inProgressIssues = this.data.issues.filter(i => i.status === 'in-progress').length;

        const avgResolutionTime = this.data.issues
            .filter(i => i.status === 'resolved')
            .reduce((sum, issue) => sum + issue.resolutionTime, 0) / resolvedIssues;

        return {
            total: totalIssues,
            resolved: resolvedIssues,
            pending: pendingIssues,
            inProgress: inProgressIssues,
            resolutionRate: ((resolvedIssues / totalIssues) * 100).toFixed(1),
            avgResolutionTime: avgResolutionTime.toFixed(1)
        };
    }

    getOverdueIssues() {
        const today = new Date();
        return this.data.issues.filter(issue => {
            const submittedDate = new Date(issue.submittedDate);
            const daysDiff = Math.floor((today - submittedDate) / (1000 * 60 * 60 * 24));
            return daysDiff > 7 && issue.status !== 'resolved';
        });
    }

    initializeCharts() {
        document.querySelector('[href="#reports"]').addEventListener('click', () => {
            setTimeout(() => {
                this.generateTrendsChart();
                this.generateCategoryChart();
            }, 300);
        });

        if (currentSection === 'reports') {
            setTimeout(() => {
                this.generateTrendsChart();
                this.generateCategoryChart();
            }, 300);
        }
    }

    generateTrendsChart() {
        const ctx = document.getElementById('trendsChart');
        if (!ctx) return;

        // Check if Chart is defined
        if (typeof Chart === 'undefined') {
            console.error('Chart.js library is not loaded. Unable to generate trend chart.');
            this.renderFallbackChart(ctx, 'trends');
            return;
        }

        if (this.trendsChartInstance) {
            this.trendsChartInstance.destroy();
        }

        // Use actual data if available
        let chartData;
        if (window.reportData && Array.isArray(window.reportData.filteredIssues) && window.reportData.filteredIssues.length > 0) {
            // Use report data for chart
            chartData = this.calculateTrendsFromData(window.reportData.filteredIssues);
        } else {
            // Fall back to stored trends
            chartData = this.data.trends;
        }

        const months = chartData.map(t => {
            const [year, month] = t.month.split('-');
            const date = new Date(year, month - 1);
            return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        });

        const submitted = chartData.map(t => t.submitted);
        const resolved = chartData.map(t => t.resolved);

        this.trendsChartInstance = new Chart(ctx, {
            type: 'line',
            data: {
                labels: months,
                datasets: [
                    {
                        label: 'Issues Submitted',
                        data: submitted,
                        borderColor: '#1e3a8a',
                        backgroundColor: 'rgba(30, 58, 138, 0.1)',
                        tension: 0.3,
                        fill: true
                    },
                    {
                        label: 'Issues Resolved',
                        data: resolved,
                        borderColor: '#10b981',
                        backgroundColor: 'rgba(16, 185, 129, 0.1)',
                        tension: 0.3,
                        fill: true
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                    },
                    title: {
                        display: true,
                        text: 'Issue Resolution Trends',
                        font: {
                            size: 16
                        }
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Number of Issues'
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Month'
                        }
                    }
                }
            }
        });

        if (typeof isDarkMode !== 'undefined' && isDarkMode) {
            this.applyDarkModeToChart(this.trendsChartInstance);
        }

        window.addEventListener('themeChanged', (event) => {
            if (event.detail.isDark) {
                this.applyDarkModeToChart(this.trendsChartInstance);
            } else {
                this.applyLightModeToChart(this.trendsChartInstance);
            }
        });
    }

    calculateTrendsFromData(issues) {
        const monthlyData = {};

        issues.forEach(issue => {
            if (!issue.submittedDate) return;

            const month = issue.submittedDate.substring(0, 7);
            if (!monthlyData[month]) {
                monthlyData[month] = { submitted: 0, resolved: 0 };
            }
            monthlyData[month].submitted++;
            if (issue.status === 'resolved') {
                monthlyData[month].resolved++;
            }
        });

        return Object.keys(monthlyData)
            .sort()
            .map(month => ({
                month,
                submitted: monthlyData[month].submitted,
                resolved: monthlyData[month].resolved,
                resolutionRate: (monthlyData[month].resolved / monthlyData[month].submitted * 100).toFixed(1)
            }));
    }

    generateCategoryChart() {
        const canvas = document.createElement('canvas');
        canvas.id = 'categoryChart';
        canvas.width = 400;
        canvas.height = 300;

        const chartContainer = document.querySelector('.chart-container');
        if (chartContainer && !document.getElementById('categoryChart')) {
            const categoryChartDiv = document.createElement('div');
            categoryChartDiv.className = 'chart-placeholder';
            categoryChartDiv.appendChild(canvas);
            chartContainer.appendChild(categoryChartDiv);
        }

        const ctx = document.getElementById('categoryChart');
        if (!ctx) return;

        // Check if Chart is defined
        if (typeof Chart === 'undefined') {
            console.error('Chart.js library is not loaded. Unable to generate category chart.');
            this.renderFallbackChart(ctx, 'categories');
            return;
        }

        if (this.categoryChartInstance) {
            this.categoryChartInstance.destroy();
        }

        // Use actual data if available
        let categories, values;
        if (window.reportData && Array.isArray(window.reportData.filteredIssues) && window.reportData.filteredIssues.length > 0) {
            // Calculate categories from filtered issues
            const categoryCount = this.calculateCategoriesFromData(window.reportData.filteredIssues);
            categories = Object.keys(categoryCount);
            values = Object.values(categoryCount);
        } else {
            // Fall back to stored categories
            categories = Object.keys(this.data.categories);
            values = Object.values(this.data.categories);
        }

        const backgroundColors = [
            'rgba(30, 58, 138, 0.8)',
            'rgba(59, 130, 246, 0.8)',
            'rgba(16, 185, 129, 0.8)',
            'rgba(245, 158, 11, 0.8)',
            'rgba(239, 68, 68, 0.8)',
            'rgba(139, 92, 246, 0.8)'
        ];

        this.categoryChartInstance = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: categories.map(cat => cat.charAt(0).toUpperCase() + cat.slice(1)),
                datasets: [{
                    label: 'Number of Issues',
                    data: values,
                    backgroundColor: backgroundColors,
                    borderColor: backgroundColors.map(color => color.replace('0.8', '1')),
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    title: {
                        display: true,
                        text: 'Issues by Category',
                        font: {
                            size: 16
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Number of Issues'
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Category'
                        }
                    }
                }
            }
        });

        if (typeof isDarkMode !== 'undefined' && isDarkMode) {
            this.applyDarkModeToChart(this.categoryChartInstance);
        }
    }

    calculateCategoriesFromData(issues) {
        return issues.reduce((acc, issue) => {
            const category = issue.category || 'other';
            acc[category] = (acc[category] || 0) + 1;
            return acc;
        }, {});
    }

    applyDarkModeToChart(chart) {
        if (!chart) return;

        chart.options.scales.x.ticks.color = '#cbd5e1';
        chart.options.scales.y.ticks.color = '#cbd5e1';
        chart.options.scales.x.title.color = '#cbd5e1';
        chart.options.scales.y.title.color = '#cbd5e1';
        chart.options.plugins.title.color = '#e2e8f0';
        chart.options.plugins.legend.labels = { color: '#cbd5e1' };

        chart.update();
    }

    applyLightModeToChart(chart) {
        if (!chart) return;

        chart.options.scales.x.ticks.color = '#475569';
        chart.options.scales.y.ticks.color = '#475569';
        chart.options.scales.x.title.color = '#475569';
        chart.options.scales.y.title.color = '#475569';
        chart.options.plugins.title.color = '#1e293b';
        chart.options.plugins.legend.labels = { color: '#475569' };

        chart.update();
    }

    exportReportData(type, startDate, endDate) {
        const filteredIssues = this.data.issues.filter(issue => {
            const issueDate = new Date(issue.submittedDate);
            const start = new Date(startDate);
            const end = new Date(endDate);
            return issueDate >= start && issueDate <= end;
        });

        const reportData = {
            summary: this.getOverallStats(),
            issues: filteredIssues,
            categoryBreakdown: this.data.categories,
            priorityBreakdown: this.data.priorities,
            locationBreakdown: this.data.locations,
            trends: this.data.trends,
            overdueIssues: this.getOverdueIssues(),
            generatedAt: new Date().toISOString(),
            dateRange: { startDate, endDate }
        };

        return reportData;
    }

    simulateReportGeneration(format, data) {


        if (format === 'pdf') {
            this.generatePDFReport(data);
        } else if (format === 'excel') {
            this.generateExcelReport(data);
        }
    }

    generatePDFReport(data) {
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = `bup-maintenance-report-${Date.now()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    generateExcelReport(data) {
        let csv = 'Issue ID,Category,Priority,Location,Status,Submitted Date,Resolution Time\n';

        data.issues.forEach(issue => {
            csv += `${issue.id},${issue.category},${issue.priority},${issue.location},${issue.status},${issue.submittedDate},${issue.resolutionTime}\n`;
        });

        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = `bup-maintenance-report-${Date.now()}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    /**
     * Render a fallback visualization when Chart.js is not available
     */
    renderFallbackChart(container, type) {
        if (!container) return;

        // Clear any existing content
        container.innerHTML = '';
        container.style.height = 'auto';

        // Create fallback message
        const fallbackMessage = document.createElement('div');
        fallbackMessage.className = 'chart-fallback';
        fallbackMessage.innerHTML = `
            <div class="fallback-message">
                <i class="fas fa-chart-bar"></i>
                <p>Chart visualization could not be loaded</p>
                <button class="btn-secondary" onclick="location.reload()">
                    Reload Page
                </button>
            </div>
        `;

        // Create a simple text-based visualization
        const dataDisplay = document.createElement('div');
        dataDisplay.className = 'fallback-data';

        if (type === 'trends') {
            const trends = this.data.trends.slice(-5); // Show last 5 months
            let trendsHtml = '<h4>Recent Trends (Last 5 Months)</h4><table class="fallback-table">';
            trendsHtml += '<tr><th>Month</th><th>Submitted</th><th>Resolved</th><th>Rate</th></tr>';

            trends.forEach(t => {
                const [year, month] = t.month.split('-');
                const date = new Date(year, month - 1);
                const monthName = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });

                trendsHtml += `<tr>
                    <td>${monthName}</td>
                    <td>${t.submitted}</td>
                    <td>${t.resolved}</td>
                    <td>${t.resolutionRate}%</td>
                </tr>`;
            });

            trendsHtml += '</table>';
            dataDisplay.innerHTML = trendsHtml;
        } else if (type === 'categories') {
            let categoriesHtml = '<h4>Issues by Category</h4><table class="fallback-table">';
            categoriesHtml += '<tr><th>Category</th><th>Issues</th></tr>';

            Object.entries(this.data.categories).forEach(([category, count]) => {
                categoriesHtml += `<tr>
                    <td>${category.charAt(0).toUpperCase() + category.slice(1)}</td>
                    <td>${count}</td>
                </tr>`;
            });

            categoriesHtml += '</table>';
            dataDisplay.innerHTML = categoriesHtml;
        }

        // Append elements
        container.appendChild(fallbackMessage);
        container.appendChild(dataDisplay);
    }
}

const analyticsManager = new AnalyticsManager();

document.addEventListener('DOMContentLoaded', function () {
    analyticsManager.initializeAnalytics();

    // Add this line to register that the analytics module is loaded
    if (typeof registerModuleLoaded === 'function') {
        registerModuleLoaded('analytics');
    }
});

if (typeof module !== 'undefined' && module.exports) {
    module.exports = AnalyticsManager;
}
