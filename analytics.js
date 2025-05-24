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
        this.generateMockData();
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

    generateCategoryChart() {
        const ctx = document.getElementById('categoryChart');
        if (!ctx) return;

        const categories = Object.keys(this.data.categories);
        const values = Object.values(this.data.categories);
        
        this.drawBarChart(ctx, categories, values, 'Category Distribution');
    }

    generateTrendsChart() {
        const ctx = document.getElementById('trendsChart');
        if (!ctx) return;

        const months = this.data.trends.map(t => t.month);
        const submitted = this.data.trends.map(t => t.submitted);
        const resolved = this.data.trends.map(t => t.resolved);
        
        this.drawLineChart(ctx, months, [submitted, resolved], ['Submitted', 'Resolved']);
    }

    drawBarChart(canvas, labels, data, title) {
        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;
        
        ctx.clearRect(0, 0, width, height);
        
        ctx.fillStyle = '#1e3a8a';
        ctx.font = '14px Inter';
        
        const maxValue = Math.max(...data);
        const barWidth = width / (labels.length * 1.5);
        const barMaxHeight = height - 100;
        
        labels.forEach((label, index) => {
            const barHeight = (data[index] / maxValue) * barMaxHeight;
            const x = index * barWidth * 1.5 + 50;
            const y = height - barHeight - 50;
            
            ctx.fillRect(x, y, barWidth, barHeight);
            
            ctx.fillStyle = '#64748b';
            ctx.fillText(label, x, height - 20);
            ctx.fillText(data[index].toString(), x, y - 10);
            ctx.fillStyle = '#1e3a8a';
        });
        
        ctx.fillStyle = '#1e293b';
        ctx.font = '16px Inter';
        ctx.fillText(title, 20, 30);
    }

    drawLineChart(canvas, labels, datasets, legends) {
        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;
        
        ctx.clearRect(0, 0, width, height);
        
        const colors = ['#1e3a8a', '#10b981'];
        const maxValue = Math.max(...datasets.flat());
        const stepX = (width - 100) / (labels.length - 1);
        const chartHeight = height - 100;
        
        datasets.forEach((dataset, datasetIndex) => {
            ctx.strokeStyle = colors[datasetIndex];
            ctx.lineWidth = 2;
            ctx.beginPath();
            
            dataset.forEach((value, index) => {
                const x = 50 + index * stepX;
                const y = height - 50 - (value / maxValue) * chartHeight;
                
                if (index === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            });
            
            ctx.stroke();
            
            ctx.fillStyle = colors[datasetIndex];
            ctx.fillRect(20, 50 + datasetIndex * 25, 15, 15);
            ctx.fillStyle = '#1e293b';
            ctx.font = '12px Inter';
            ctx.fillText(legends[datasetIndex], 45, 62 + datasetIndex * 25);
        });
        
        ctx.fillStyle = '#64748b';
        labels.forEach((label, index) => {
            const x = 50 + index * stepX;
            ctx.fillText(label, x - 20, height - 20);
        });
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
        console.log(`Generating ${format} report...`);
        
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
}

const analyticsManager = new AnalyticsManager();

document.addEventListener('DOMContentLoaded', function() {
    analyticsManager.initializeAnalytics();
    
    setTimeout(() => {
        analyticsManager.generateTrendsChart();
        analyticsManager.generateCategoryChart();
    }, 1000);
});

if (typeof module !== 'undefined' && module.exports) {
    module.exports = AnalyticsManager;
}
