/**
 * Enhanced Chart Management for Reports
 * Provides additional chart functionality including:
 * - Multiple chart types
 * - Comparison views
 * - Interactive tooltips
 * - Period-over-period analysis
 */

class EnhancedChartManager {
    constructor() {
        this.charts = {};
        this.chartData = {};
        this.colorPalette = {
            primary: '#1e3a8a',
            secondary: '#3b82f6',
            success: '#10b981',
            warning: '#f59e0b',
            danger: '#ef4444',
            info: '#06b6d4',
            light: '#f3f4f6',
            dark: '#1f2937'
        };
        this.darkModeEnabled = document.body.classList.contains('dark-mode');
        
        // Set up dark mode listener
        window.addEventListener('themeChanged', (event) => {
            this.darkModeEnabled = event.detail.isDark;
            this.updateChartsTheme();
        });
    }

    /**
     * Initialize enhanced charts
     */
    initialize() {
        // Create control panel
        this.createControlPanel();
        
        // Set up event listeners
        this.setupEventListeners();
        
        // Create enhanced summary stats
        this.enhanceSummaryStats();
        
        // Replace standard charts with enhanced versions
        this.createMultiChartLayout();
    }
    
    /**
     * Create chart control panel
     */
    createControlPanel() {
        const chartContainer = document.querySelector('.chart-container');
        if (!chartContainer) return;
        
        const controlPanel = document.createElement('div');
        controlPanel.className = 'chart-controls';
        controlPanel.innerHTML = `
            <div class="chart-control-group">
                <label>Chart Type:</label>
                <div class="chart-type-toggle">
                    <button class="chart-type-btn active" data-chart-type="line">Line</button>
                    <button class="chart-type-btn" data-chart-type="bar">Bar</button>
                    <button class="chart-type-btn" data-chart-type="area">Area</button>
                </div>
            </div>
            
            <div class="chart-control-group">
                <label>Group By:</label>
                <select id="chartGroupBy" class="chart-select">
                    <option value="month">Month</option>
                    <option value="week">Week</option>
                    <option value="day">Day</option>
                    <option value="category">Category</option>
                </select>
            </div>
            
            <div class="chart-control-group comparison-toggle">
                <label>Compare with Previous Period:</label>
                <label class="toggle-switch">
                    <input type="checkbox" id="compareToggle">
                    <span class="toggle-slider"></span>
                </label>
            </div>
        `;
        
        // Insert before the first chart
        const chartElem = chartContainer.querySelector('.chart-placeholder');
        if (chartElem) {
            chartContainer.insertBefore(controlPanel, chartElem);
        } else {
            chartContainer.appendChild(controlPanel);
        }
    }
    
    /**
     * Set up event listeners for chart controls
     */
    setupEventListeners() {
        // Chart type toggle
        document.querySelectorAll('.chart-type-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.chart-type-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.updateChartType(btn.dataset.chartType);
            });
        });
        
        // Group by change
        const groupBySelect = document.getElementById('chartGroupBy');
        if (groupBySelect) {
            groupBySelect.addEventListener('change', () => {
                this.updateGroupBy(groupBySelect.value);
            });
        }
        
        // Comparison toggle
        const compareToggle = document.getElementById('compareToggle');
        if (compareToggle) {
            compareToggle.addEventListener('change', () => {
                this.toggleComparison(compareToggle.checked);
            });
        }
    }
    
    /**
     * Create multi-chart layout
     */
    createMultiChartLayout() {
        const reportsContent = document.querySelector('.reports-content');
        if (!reportsContent) return;
        
        // Create container for multiple charts
        const multiChartContainer = document.createElement('div');
        multiChartContainer.className = 'multi-chart-container';
        
        // Create trend chart
        const trendCard = document.createElement('div');
        trendCard.className = 'chart-card';
        trendCard.innerHTML = `
            <h4><i class="fas fa-chart-line"></i> Issue Resolution Trends</h4>
            <div class="chart-area">
                <canvas id="enhancedTrendsChart"></canvas>
            </div>
        `;
        
        // Create category distribution chart
        const categoryCard = document.createElement('div');
        categoryCard.className = 'chart-card';
        categoryCard.innerHTML = `
            <h4><i class="fas fa-chart-pie"></i> Category Distribution</h4>
            <div class="chart-area">
                <canvas id="enhancedCategoryChart"></canvas>
            </div>
        `;
        
        // Create resolution time chart
        const timeCard = document.createElement('div');
        timeCard.className = 'chart-card';
        timeCard.innerHTML = `
            <h4><i class="fas fa-clock"></i> Avg. Resolution Time by Category</h4>
            <div class="chart-area">
                <canvas id="resolutionTimeChart"></canvas>
            </div>
        `;
        
        // Create priority distribution chart
        const priorityCard = document.createElement('div');
        priorityCard.className = 'chart-card';
        priorityCard.innerHTML = `
            <h4><i class="fas fa-exclamation-triangle"></i> Issues by Priority</h4>
            <div class="chart-area">
                <canvas id="priorityChart"></canvas>
            </div>
        `;
        
        // Append all chart cards
        multiChartContainer.appendChild(trendCard);
        multiChartContainer.appendChild(categoryCard);
        multiChartContainer.appendChild(timeCard);
        multiChartContainer.appendChild(priorityCard);
        
        // Replace existing chart container
        const existingChartContainer = document.querySelector('.chart-container');
        if (existingChartContainer) {
            reportsContent.replaceChild(multiChartContainer, existingChartContainer);
        } else {
            // Insert before report tables
            const reportTables = document.querySelector('.report-tables');
            if (reportTables) {
                reportsContent.insertBefore(multiChartContainer, reportTables);
            } else {
                reportsContent.appendChild(multiChartContainer);
            }
        }
        
        // Initialize all charts
        setTimeout(() => {
            this.initializeCharts();
        }, 100);
    }
    
    /**
     * Initialize all charts
     */
    initializeCharts() {
        // Get data from reportData if available
        let issues = [];
        if (window.reportData && window.reportData.filteredIssues) {
            issues = window.reportData.filteredIssues;
        } else if (window.issues) {
            issues = window.issues;
        } else {
            // Generate mock data if no real data available
            issues = this.generateMockData();
        }
        
        this.chartData.issues = issues;
        
        // Initialize each chart
        this.initializeTrendsChart();
        this.initializeCategoryChart();
        this.initializeResolutionTimeChart();
        this.initializePriorityChart();
        
        // Apply current theme
        this.updateChartsTheme();
    }
    
    /**
     * Initialize trends chart
     */
    initializeTrendsChart() {
        const ctx = document.getElementById('enhancedTrendsChart');
        if (!ctx) return;
        
        // Prepare data
        const monthlyData = this.aggregateDataByMonth(this.chartData.issues);
        
        // Create chart
        this.charts.trends = new Chart(ctx, {
            type: 'line',
            data: {
                labels: monthlyData.map(d => d.month),
                datasets: [
                    {
                        label: 'Issues Submitted',
                        data: monthlyData.map(d => d.submitted),
                        borderColor: this.colorPalette.primary,
                        backgroundColor: 'rgba(30, 58, 138, 0.1)',
                        tension: 0.3,
                        fill: false,
                        borderWidth: 3
                    },
                    {
                        label: 'Issues Resolved',
                        data: monthlyData.map(d => d.resolved),
                        borderColor: this.colorPalette.success,
                        backgroundColor: 'rgba(16, 185, 129, 0.1)',
                        tension: 0.3,
                        fill: false,
                        borderWidth: 3
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                        callbacks: {
                            label: function(context) {
                                return context.dataset.label + ': ' + context.raw;
                            }
                        }
                    },
                    legend: {
                        position: 'top'
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
                },
                interaction: {
                    mode: 'nearest',
                    axis: 'x',
                    intersect: false
                }
            }
        });
    }
    
    /**
     * Initialize category distribution chart
     */
    initializeCategoryChart() {
        const ctx = document.getElementById('enhancedCategoryChart');
        if (!ctx) return;
        
        // Prepare data
        const categoryData = this.aggregateDataByCategory(this.chartData.issues);
        const categories = Object.keys(categoryData);
        const counts = Object.values(categoryData);
        
        // Define colors
        const backgroundColors = [
            'rgba(30, 58, 138, 0.8)', // primary
            'rgba(59, 130, 246, 0.8)', // secondary
            'rgba(16, 185, 129, 0.8)', // success
            'rgba(245, 158, 11, 0.8)', // warning
            'rgba(239, 68, 68, 0.8)', // danger
            'rgba(6, 182, 212, 0.8)', // info
            'rgba(139, 92, 246, 0.8)', // purple
            'rgba(248, 113, 113, 0.8)', // red-400
            'rgba(52, 211, 153, 0.8)'  // green-400
        ];
        
        // Create chart
        this.charts.category = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: categories.map(c => this.formatCategoryName(c)),
                datasets: [{
                    data: counts,
                    backgroundColor: backgroundColors.slice(0, categories.length),
                    borderColor: 'rgba(255, 255, 255, 0.8)',
                    borderWidth: 2,
                    hoverOffset: 10
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right',
                        labels: {
                            boxWidth: 15,
                            padding: 15
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = Math.round((context.raw / total) * 100);
                                return `${context.label}: ${context.raw} (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        }
        );
    }
    
    /**
     * Initialize resolution time chart
     */
    initializeResolutionTimeChart() {
        const ctx = document.getElementById('resolutionTimeChart');
        if (!ctx) return;
        
        // Prepare data
        const resolutionTimeData = this.calculateResolutionTimeByCategory();
        const categories = Object.keys(resolutionTimeData);
        const avgTimes = Object.values(resolutionTimeData);
        
        // Create chart
        this.charts.resolutionTime = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: categories.map(c => this.formatCategoryName(c)),
                datasets: [{
                    label: 'Average Days to Resolve',
                    data: avgTimes,
                    backgroundColor: 'rgba(59, 130, 246, 0.7)',
                    borderColor: 'rgba(59, 130, 246, 1)',
                    borderWidth: 2,
                    borderRadius: 5,
                    hoverBackgroundColor: 'rgba(59, 130, 246, 0.9)'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                indexAxis: 'y',
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return `Avg. Resolution Time: ${context.raw.toFixed(1)} days`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Days'
                        }
                    }
                }
            }
        });
    }
    
    /**
     * Initialize priority distribution chart
     */
    initializePriorityChart() {
        const ctx = document.getElementById('priorityChart');
        if (!ctx) return;
        
        // Prepare data
        const priorityData = this.aggregateDataByPriority();
        const priorities = Object.keys(priorityData);
        const counts = Object.values(priorityData);
        
        // Define colors for priority levels
        const priorityColors = {
            'urgent': 'rgba(239, 68, 68, 0.8)', // danger
            'high': 'rgba(245, 158, 11, 0.8)', // warning
            'medium': 'rgba(59, 130, 246, 0.8)', // secondary
            'low': 'rgba(16, 185, 129, 0.8)', // success
        };
        
        const backgroundColors = priorities.map(p => priorityColors[p] || 'rgba(107, 114, 128, 0.8)');
        
        // Create chart
        this.charts.priority = new Chart(ctx, {
            type: 'polarArea',
            data: {
                labels: priorities.map(p => p.charAt(0).toUpperCase() + p.slice(1)),
                datasets: [{
                    data: counts,
                    backgroundColor: backgroundColors,
                    borderColor: 'rgba(255, 255, 255, 0.8)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right'
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = Math.round((context.raw / total) * 100);
                                return `${context.label}: ${context.raw} (${percentage}%)`;
                            }
                        }
                    }
                },
                scales: {
                    r: {
                        ticks: {
                            display: false
                        }
                    }
                }
            }
        });
    }
    
    /**
     * Update chart type for all applicable charts
     */
    updateChartType(chartType) {
        if (this.charts.trends) {
            // Preserve datasets
            const datasets = this.charts.trends.data.datasets;
            
            // Destroy and recreate with new type
            this.charts.trends.destroy();
            
            const ctx = document.getElementById('enhancedTrendsChart');
            if (!ctx) return;
            
            const newType = chartType === 'area' ? 'line' : chartType;
            
            // If area, set fill to true
            if (chartType === 'area') {
                datasets.forEach(dataset => {
                    dataset.fill = true;
                });
            } else {
                datasets.forEach(dataset => {
                    dataset.fill = false;
                });
            }
            
            // Create new chart with same data but different type
            this.charts.trends = new Chart(ctx, {
                type: newType,
                data: {
                    labels: this.charts.trends.data.labels,
                    datasets: datasets
                },
                options: this.charts.trends.options
            });
            
            // Apply theme
            this.updateChartsTheme();
        }
    }
    
    /**
     * Update grouping for trend chart
     */
    updateGroupBy(groupBy) {
        if (!this.charts.trends) return;
        
        let groupedData;
        let labelText;
        
        switch(groupBy) {
            case 'week':
                groupedData = this.aggregateDataByWeek();
                labelText = 'Week';
                break;
            case 'day':
                groupedData = this.aggregateDataByDay();
                labelText = 'Day';
                break;
            case 'category':
                groupedData = this.aggregateSubmittedResolvedByCategory();
                labelText = 'Category';
                break;
            case 'month':
            default:
                groupedData = this.aggregateDataByMonth(this.chartData.issues);
                labelText = 'Month';
                break;
        }
        
        // Update chart data
        this.charts.trends.data.labels = groupedData.map(d => d.label);
        this.charts.trends.data.datasets[0].data = groupedData.map(d => d.submitted);
        this.charts.trends.data.datasets[1].data = groupedData.map(d => d.resolved);
        
        // Update x-axis label
        this.charts.trends.options.scales.x.title.text = labelText;
        
        // Update chart
        this.charts.trends.update();
    }
    
    /**
     * Toggle comparison with previous period
     */
    toggleComparison(enabled) {
        if (!this.charts.trends) return;
        
        if (enabled) {
            // Add previous period data
            const currentPeriodData = this.charts.trends.data.datasets[0].data;
            const previousPeriodData = this.generatePreviousPeriodData(currentPeriodData);
            
            // Add dataset if it doesn't exist
            if (this.charts.trends.data.datasets.length < 3) {
                this.charts.trends.data.datasets.push({
                    label: 'Previous Period',
                    data: previousPeriodData,
                    borderColor: 'rgba(107, 114, 128, 0.8)', // gray
                    backgroundColor: 'rgba(107, 114, 128, 0.1)',
                    borderDash: [5, 5],
                    tension: 0.3,
                    fill: false,
                    borderWidth: 2
                });
            } else {
                // Update existing dataset
                this.charts.trends.data.datasets[2].data = previousPeriodData;
            }
        } else {
            // Remove previous period dataset if it exists
            if (this.charts.trends.data.datasets.length > 2) {
                this.charts.trends.data.datasets.pop();
            }
        }
        
        // Update chart
        this.charts.trends.update();
    }
    
    /**
     * Update theme for all charts
     */
    updateChartsTheme() {
        const textColor = this.darkModeEnabled ? '#cbd5e1' : '#475569';
        const gridColor = this.darkModeEnabled ? 'rgba(203, 213, 225, 0.1)' : 'rgba(71, 85, 105, 0.1)';
        
        // Update all charts
        Object.values(this.charts).forEach(chart => {
            // Skip if chart doesn't exist
            if (!chart) return;
            
            // Update title and tick colors
            if (chart.options.scales) {
                if (chart.options.scales.x) {
                    chart.options.scales.x.ticks.color = textColor;
                    chart.options.scales.x.title.color = textColor;
                    chart.options.scales.x.grid.color = gridColor;
                }
                
                if (chart.options.scales.y) {
                    chart.options.scales.y.ticks.color = textColor;
                    chart.options.scales.y.title.color = textColor;
                    chart.options.scales.y.grid.color = gridColor;
                }
                
                if (chart.options.scales.r) {
                    chart.options.scales.r.grid.color = gridColor;
                }
            }
            
            // Update legend colors
            if (chart.options.plugins && chart.options.plugins.legend) {
                chart.options.plugins.legend.labels.color = textColor;
            }
            
            // Update chart
            chart.update();
        });
    }
    
    /**
     * Enhance summary statistics with mini sparklines
     */
    enhanceSummaryStats() {
        // Get all summary stat elements
        const summaryStats = document.querySelectorAll('.summary-stat');
        if (!summaryStats.length) return;
        
        // Add trend indicators and sparklines
        summaryStats.forEach(stat => {
            const statType = stat.querySelector('h4').textContent.toLowerCase();
            const currentValue = parseInt(stat.querySelector('.stat-value').textContent) || 0;
            
            // Generate a trend percentage (randomly for now, would be real data in production)
            const trendValue = this.generateTrendValue(statType);
            const trendClass = trendValue >= 0 ? 'positive' : 'negative';
            const trendIcon = trendValue >= 0 ? 'fa-arrow-up' : 'fa-arrow-down';
            
            // Add trend indicator
            const trendSpan = document.createElement('span');
            trendSpan.className = `stat-trend ${trendClass}`;
            trendSpan.innerHTML = `<i class="fas ${trendIcon}"></i> ${Math.abs(trendValue)}% from last period`;
            stat.appendChild(trendSpan);
            
            // Create sparkline
            const sparklineSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
            sparklineSvg.setAttribute('class', 'sparkline');
            sparklineSvg.setAttribute('width', '100%');
            sparklineSvg.setAttribute('height', '30');
            sparklineSvg.setAttribute('preserveAspectRatio', 'none');
            
            // Create path for sparkline
            const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            const sparklineData = this.generateSparklineData(statType);
            const pathData = this.createSparklinePath(sparklineData);
            
            path.setAttribute('d', pathData);
            path.setAttribute('stroke', trendClass === 'positive' ? '#10b981' : '#ef4444');
            path.setAttribute('stroke-width', '2');
            path.setAttribute('fill', 'none');
            
            sparklineSvg.appendChild(path);
            stat.appendChild(sparklineSvg);
        });
    }
    
    /* Data Aggregation Methods */
    
    /**
     * Aggregate data by month
     */
    aggregateDataByMonth(issues) {
        const monthlyData = {};
        
        // Group issues by month
        issues.forEach(issue => {
            if (!issue.submittedDate) return;
            
            const date = new Date(issue.submittedDate);
            const monthYear = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
            
            if (!monthlyData[monthYear]) {
                monthlyData[monthYear] = { 
                    submitted: 0, 
                    resolved: 0,
                    month: new Date(date.getFullYear(), date.getMonth(), 1).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
                };
            }
            
            monthlyData[monthYear].submitted++;
            
            if (issue.status === 'resolved') {
                monthlyData[monthYear].resolved++;
            }
        });
        
        // Convert to array and sort by date
        return Object.keys(monthlyData)
            .sort()
            .map(key => monthlyData[key]);
    }
    
    /**
     * Aggregate data by week
     */
    aggregateDataByWeek() {
        // This is a simplified implementation - in a real app, this would use actual week calculations
        const weeklyData = [];
        
        // Generate 8 weeks of data
        for (let i = 0; i < 8; i++) {
            const weekNum = 8 - i;
            const submitted = Math.floor(Math.random() * 30) + 10;
            const resolved = Math.floor(Math.random() * submitted);
            
            weeklyData.push({
                label: `Week ${weekNum}`,
                submitted,
                resolved
            });
        }
        
        return weeklyData.reverse();
    }
    
    /**
     * Aggregate data by day
     */
    aggregateDataByDay() {
        // This is a simplified implementation - in a real app, this would use actual date calculations
        const dailyData = [];
        
        // Generate 14 days of data
        for (let i = 0; i < 14; i++) {
            const date = new Date();
            date.setDate(date.getDate() - (13 - i));
            
            const dayName = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            const submitted = Math.floor(Math.random() * 10) + 1;
            const resolved = Math.floor(Math.random() * submitted);
            
            dailyData.push({
                label: dayName,
                submitted,
                resolved
            });
        }
        
        return dailyData;
    }
    
    /**
     * Aggregate data by category
     */
    aggregateDataByCategory(issues) {
        const categoryData = {};
        
        issues.forEach(issue => {
            const category = issue.category || 'other';
            
            if (!categoryData[category]) {
                categoryData[category] = 0;
            }
            
            categoryData[category]++;
        });
        
        return categoryData;
    }
    
    /**
     * Aggregate submitted and resolved issues by category
     */
    aggregateSubmittedResolvedByCategory() {
        const categoryData = {};
        
        this.chartData.issues.forEach(issue => {
            const category = issue.category || 'other';
            
            if (!categoryData[category]) {
                categoryData[category] = {
                    submitted: 0,
                    resolved: 0
                };
            }
            
            categoryData[category].submitted++;
            
            if (issue.status === 'resolved') {
                categoryData[category].resolved++;
            }
        });
        
        // Convert to array format
        return Object.keys(categoryData).map(category => ({
            label: this.formatCategoryName(category),
            submitted: categoryData[category].submitted,
            resolved: categoryData[category].resolved
        }));
    }
    
    /**
     * Aggregate data by priority
     */
    aggregateDataByPriority() {
        const priorityData = {
            'urgent': 0,
            'high': 0,
            'medium': 0,
            'low': 0
        };
        
        this.chartData.issues.forEach(issue => {
            const priority = issue.priority || 'medium';
            
            if (priorityData[priority] !== undefined) {
                priorityData[priority]++;
            }
        });
        
        return priorityData;
    }
    
    /**
     * Calculate average resolution time by category
     */
    calculateResolutionTimeByCategory() {
        const categoryData = {};
        
        // Get resolved issues
        const resolvedIssues = this.chartData.issues.filter(issue => 
            issue.status === 'resolved' && issue.submittedDate && issue.resolvedDate);
        
        resolvedIssues.forEach(issue => {
            const category = issue.category || 'other';
            
            if (!categoryData[category]) {
                categoryData[category] = {
                    totalTime: 0,
                    count: 0
                };
            }
            
            // Calculate resolution time in days
            const submittedDate = new Date(issue.submittedDate);
            const resolvedDate = new Date(issue.resolvedDate);
            const timeDiff = resolvedDate.getTime() - submittedDate.getTime();
            const daysDiff = timeDiff / (1000 * 3600 * 24);
            
            categoryData[category].totalTime += daysDiff;
            categoryData[category].count++;
        });
        
        // Calculate averages
        const avgTimes = {};
        Object.keys(categoryData).forEach(category => {
            avgTimes[category] = categoryData[category].totalTime / categoryData[category].count;
        });
        
        return avgTimes;
    }
    
    /* Helper Methods */
    
    /**
     * Format category name for display
     */
    formatCategoryName(category) {
        if (!category) return 'Unknown';
        
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
     * Generate random trend value for demonstration
     */
    generateTrendValue(statType) {
        // In a real application, this would be calculated from actual data
        const trends = {
            'total': Math.floor(Math.random() * 30) - 10,
            'resolved': Math.floor(Math.random() * 40),
            'pending': Math.floor(Math.random() * 30) - 15,
            'progress': Math.floor(Math.random() * 20) - 5,
            'rating': Math.floor(Math.random() * 15) - 5
        };
        
        let type = 'total';
        
        if (statType.includes('resolved')) type = 'resolved';
        if (statType.includes('pending')) type = 'pending';
        if (statType.includes('progress')) type = 'progress';
        if (statType.includes('rating')) type = 'rating';
        
        return trends[type];
    }
    
    /**
     * Generate sparkline data
     */
    generateSparklineData(statType) {
        // In a real application, this would use actual historical data
        const points = [];
        const pointCount = 10;
        
        // Different patterns based on stat type
        if (statType.includes('resolved')) {
            // Upward trend
            for (let i = 0; i < pointCount; i++) {
                points.push(20 + i * 2 + Math.random() * 5);
            }
        } else if (statType.includes('pending')) {
            // Downward trend
            for (let i = 0; i < pointCount; i++) {
                points.push(30 - i * 1.5 + Math.random() * 5);
            }
        } else if (statType.includes('progress')) {
            // Stable with spike
            for (let i = 0; i < pointCount; i++) {
                const base = 15 + Math.random() * 3;
                points.push(i === 7 ? base + 10 : base);
            }
        } else if (statType.includes('rating')) {
            // Gradual improvement
            for (let i = 0; i < pointCount; i++) {
                points.push(10 + i * 0.8 + Math.random() * 2);
            }
        } else {
            // Total issues - generally increasing
            for (let i = 0; i < pointCount; i++) {
                points.push(10 + i * 3 + Math.random() * 5);
            }
        }
        
        return points;
    }
    
    /**
     * Create SVG path for sparkline
     */
    createSparklinePath(data) {
        if (!data.length) return '';
        
        // Normalize data for the available height
        const max = Math.max(...data);
        const min = Math.min(...data);
        const range = max - min || 1;
        
        // Calculate height and width
        const height = 30;
        const width = 100;
        
        // Calculate normalized y values
        const normalizedData = data.map(val => height - ((val - min) / range) * height);
        
        // Calculate x step
        const xStep = width / (data.length - 1);
        
        // Create path
        let path = `M 0,${normalizedData[0]}`;
        
        for (let i = 1; i < data.length; i++) {
            path += ` L ${i * xStep},${normalizedData[i]}`;
        }
        
        return path;
    }
    
    /**
     * Generate previous period data for comparison
     */
    generatePreviousPeriodData(currentData) {
        // In a real application, this would fetch actual previous period data
        return currentData.map(val => {
            // Add some random variance to make it look realistic
            const variance = Math.random() * 0.3 + 0.7; // 70% to 100% of current value
            return Math.floor(val * variance);
        });
    }
    
    /**
     * Generate mock data for demonstration
     */
    generateMockData() {
        const mockIssues = [];
        const categories = ['furniture', 'electricity', 'sanitary', 'lab', 'cafeteria', 'transportation', 'other'];
        const priorities = ['urgent', 'high', 'medium', 'low'];
        const statuses = ['pending-review', 'assigned', 'in-progress', 'resolved'];
        
        // Generate 200 mock issues
        for (let i = 0; i < 200; i++) {
            // Create a random date within the last 6 months
            const submittedDate = new Date();
            submittedDate.setDate(submittedDate.getDate() - Math.floor(Math.random() * 180));
            
            // Randomize if it's resolved
            const isResolved = Math.random() > 0.4;
            
            // If resolved, set a resolution date
            let resolvedDate = null;
            if (isResolved) {
                resolvedDate = new Date(submittedDate);
                resolvedDate.setDate(resolvedDate.getDate() + Math.floor(Math.random() * 14) + 1);
            }
            
            // Create the mock issue
            mockIssues.push({
                id: `MOCK${i.toString().padStart(4, '0')}`,
                category: categories[Math.floor(Math.random() * categories.length)],
                priority: priorities[Math.floor(Math.random() * priorities.length)],
                status: isResolved ? 'resolved' : statuses[Math.floor(Math.random() * (statuses.length - 1))],
                submittedDate: submittedDate.toISOString().split('T')[0],
                resolvedDate: isResolved ? resolvedDate.toISOString().split('T')[0] : null
            });
        }
        
        return mockIssues;
    }
}

// Create and initialize enhanced chart manager
document.addEventListener('DOMContentLoaded', function() {
    // Check if we're on the reports page
    const reportsSection = document.getElementById('reports');
    if (reportsSection && reportsSection.classList.contains('active')) {
        const enhancedCharts = new EnhancedChartManager();
        enhancedCharts.initialize();
        
        // Make it globally available
        window.enhancedCharts = enhancedCharts;
    }
});

// Add event listener for when the reports tab is clicked
document.addEventListener('click', function(event) {
    if (event.target.matches('a[href="#reports"]')) {
        // Initialize the enhanced charts when the reports tab is shown
        setTimeout(() => {
            if (!window.enhancedCharts) {
                const enhancedCharts = new EnhancedChartManager();
                enhancedCharts.initialize();
                window.enhancedCharts = enhancedCharts;
            }
        }, 300);
    }
});
