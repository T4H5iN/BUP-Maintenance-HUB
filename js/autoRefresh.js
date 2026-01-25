/**
 * AutoRefresher - Handles periodic data fetching and manual refresh
 */
class AutoRefresher {
    constructor(intervalSeconds = 60) {
        this.interval = intervalSeconds * 1000;
        this.intervalId = null;
        this.isRefreshing = false;
    }

    start() {
        if (this.intervalId) return;

        // Initial start
        this.intervalId = setInterval(() => {
            // Only refresh if tab is visible to save resources
            if (!document.hidden) {
                this.refresh(false); // false = not manual
            }
        }, this.interval);

        console.log(`Auto-refresh started (${this.interval / 1000}s interval)`);
    }

    stop() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
            console.log('Auto-refresh stopped');
        }
    }

    /**
     * Trigger a refresh of the data
     * @param {boolean} manual - Whether this was triggered by the user
     */
    async refresh(manual = false) {
        if (this.isRefreshing) return;
        this.isRefreshing = true;

        if (manual) {
            // Spin the icon if it exists
            const btn = document.getElementById('manualRefreshBtn');
            if (btn) {
                const icon = btn.querySelector('i');
                if (icon) icon.classList.add('fa-spin');
            }
        }

        try {
            console.log('Refreshing data...');

            // 1. Fetch latest issues
            if (typeof loadAllIssuesFromBackend === 'function') {
                await loadAllIssuesFromBackend();
            }

            // 2. Update current view based on what's active
            const current = window.currentSection || 'home';

            if (current === 'dashboard' && typeof updateDashboardStats === 'function') {
                updateDashboardStats();
            } else if (current === 'reports' && typeof updateReports === 'function') {
                updateReports();
            } else if (current === 'home') {
                // Re-apply filters to update the list
                if (typeof window.filterHomeIssues === 'function') {
                    window.filterHomeIssues();
                } else if (typeof updateHomeIssuesList === 'function') {
                    updateHomeIssuesList();
                }
            } else if (current === 'moderator' && typeof updateModeratorPanel === 'function') {
                updateModeratorPanel();
            }

            if (manual) {
                if (typeof showNotification === 'function') {
                    showNotification('Data refreshed successfully', 'success');
                }
            }
        } catch (error) {
            console.error('Refresh failed:', error);
            if (manual && typeof showNotification === 'function') {
                showNotification('Failed to refresh data', 'error');
            }
        } finally {
            this.isRefreshing = false;
            if (manual) {
                const btn = document.getElementById('manualRefreshBtn');
                if (btn) {
                    const icon = btn.querySelector('i');
                    if (icon) icon.classList.remove('fa-spin');
                }
            }
        }
    }
}

// Initialize global instance
const autoRefresher = new AutoRefresher(60); // 60 seconds

// Start when document is ready
document.addEventListener('DOMContentLoaded', () => {
    autoRefresher.start();

    // Also restart/consistency check on visibility change
    document.addEventListener('visibilitychange', () => {
        if (!document.hidden) {
            // Optional: Immediately refresh if we were hidden for a long time? 
            // For now, just resume the interval cycle (which never stopped, but logic prevented execution)
        }
    });
});
