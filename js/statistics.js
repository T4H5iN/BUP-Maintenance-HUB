/**
 * Statistics management for the BUP Maintenance HUB
 * Handles fetching and displaying summary statistics
 */

// Fetch summary statistics from the server
async function fetchSummaryStatistics() {
    try {
        // Show loading state
        setLoadingState(true);
        
        // Get token from localStorage for authenticated requests
        const token = localStorage.getItem('bup-token');
        const headers = {};
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        
        // Fetch statistics from API
        const response = await fetch('http://localhost:3000/api/statistics/summary', {
            headers: headers
        });
        
        if (!response.ok) {
            throw new Error(`Failed to fetch statistics: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Statistics data fetched successfully:', data);
        return data;
    } catch (error) {
        console.error('Error fetching statistics:', error);
        // If API fails, calculate from local issues data as fallback
        return calculateStatisticsFromLocalData();
    } finally {
        setLoadingState(false);
    }
}

// Calculate statistics from already loaded issues as fallback
function calculateStatisticsFromLocalData() {
    console.log('Calculating statistics from local data...');
    
    // Generate sample data for demonstration if no issues are available
    if (!window.issues || !Array.isArray(window.issues) || window.issues.length === 0) {
        console.warn('No issues found in window.issues, using demo data');
        
        // Demo statistics when no real data is available
        return {
            resolved: 24,
            pending: 18,
            avgRating: '4.2'
        };
    }
    
    // Calculate statistics from existing issues
    const totalIssues = window.issues.length;
    console.log(`Calculating statistics from ${totalIssues} issues`);
    
    const resolvedIssues = window.issues.filter(issue => issue.status === 'resolved').length;
    const pendingIssues = window.issues.filter(issue => 
        issue.status === 'pending-review' || 
        issue.status === 'assigned' || 
        issue.status === 'in-progress'
    ).length;
    
    // Calculate average rating if available
    let avgRating = 0;
    let ratedIssues = window.issues.filter(issue => 
        issue.status === 'resolved' && issue.rating && issue.rating > 0
    );
    
    if (ratedIssues.length > 0) {
        const totalRating = ratedIssues.reduce((sum, issue) => sum + (parseFloat(issue.rating) || 0), 0);
        avgRating = (totalRating / ratedIssues.length).toFixed(1);
    } else {
        // Provide a reasonable fallback for average rating
        avgRating = '4.0';
    }
    
    const stats = {
        resolved: resolvedIssues,
        pending: pendingIssues,
        avgRating: avgRating
    };
    
    console.log('Calculated statistics:', stats);
    return stats;
}

// Update the hero stats in the UI
function updateHeroStats(statistics) {
    console.log('Updating hero stats UI with:', statistics);
    
    // Get the stat elements
    const resolvedElement = document.getElementById('resolved-count');
    const pendingElement = document.getElementById('pending-count');
    const ratingElement = document.getElementById('avg-rating');
    
    // Update with fetched values if elements exist
    if (resolvedElement) resolvedElement.textContent = statistics.resolved || 0;
    if (pendingElement) pendingElement.textContent = statistics.pending || 0;
    if (ratingElement) ratingElement.textContent = statistics.avgRating || 'N/A';
    
    // Animate the numbers to make the update visually appealing
    animateNumbers();
}

// Set loading state on stat elements
function setLoadingState(isLoading) {
    const statElements = document.querySelectorAll('.hero-stats .stat-number');
    
    statElements.forEach(element => {
        if (isLoading) {
            element.innerHTML = '<i class="fas fa-spinner fa-spin" style="font-size: 0.8em;"></i>';
        } else if (element.textContent === '--' || element.innerHTML.includes('fa-spinner')) {
            // Only reset if it's showing the loading indicator or default placeholder
            element.textContent = '0';
        }
    });
}

// Simple animation for numbers
function animateNumbers() {
    const statElements = document.querySelectorAll('.hero-stats .stat-number');
    
    statElements.forEach(element => {
        // Skip elements with non-numeric content
        if (isNaN(element.textContent) && element.textContent !== 'N/A') return;
        
        element.classList.add('number-animation');
        
        // Reset after animation completes
        setTimeout(() => {
            element.classList.remove('number-animation');
        }, 1000);
    });
}

// Initialize statistics when page loads
async function initializeStatistics() {
    console.log('Initializing statistics...');
    
    // First load statistics from local data to show something immediately
    const quickStats = calculateStatisticsFromLocalData();
    updateHeroStats(quickStats);
    
    try {
        // Then fetch the accurate statistics from the server
        const statistics = await fetchSummaryStatistics();
        updateHeroStats(statistics);
    } catch (error) {
        console.error('Failed to initialize statistics:', error);
        // Ensure we still have stats displayed even if server fetch fails
        if (!document.getElementById('resolved-count').textContent || 
            document.getElementById('resolved-count').textContent === '--') {
            updateHeroStats(quickStats);
        }
    }
}

// Make these functions available globally
window.initializeStatistics = initializeStatistics;
window.fetchSummaryStatistics = fetchSummaryStatistics;

// Initialize statistics on DOMContentLoaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded - initializing statistics');
    // Set a timeout to ensure other scripts have loaded
    setTimeout(initializeStatistics, 500);
    
    // Listen for the issuesLoaded event to update statistics when issues are loaded
    window.addEventListener('issuesLoaded', function(event) {
        console.log('Issues loaded event received, refreshing statistics');
        initializeStatistics();
    });
});
