/**
 * Voting System for BUP Maintenance HUB
 * Allows users to upvote/downvote issues and see vote counts
 */

// Track local voting state to prevent multiple API calls
const userVotes = {};

/**
 * Initialize the voting system by adding vote UI to issue cards
 * @param {HTMLElement} container - The container element to initialize (optional)
 */
function initializeVoteSystem(container = document) {
    // Find all issue cards that don't have voting UI yet
    const issueCards = container.querySelectorAll('.issue-card:not(.votes-initialized)');

    issueCards.forEach(card => {
        // Get the issue ID from the card
        const issueIdElement = card.querySelector('.issue-id');
        if (!issueIdElement) return;

        const issueId = issueIdElement.textContent.replace('#', '');

        // Find the actions element where we'll append the voting UI
        const actionsElement = card.querySelector('.issue-actions');
        if (!actionsElement) return;

        // Create voting UI element
        const votingElement = document.createElement('div');
        votingElement.className = 'voting-container card-voting';

        // Get current votes from the issue data
        const issue = window.issues.find(i => (i.issueId || i.id) === issueId);
        const upvotes = issue?.upvotes || 0;
        const downvotes = issue?.downvotes || 0;
        const totalVotes = upvotes - downvotes;

        // Get current user's vote if it exists
        const userVote = getUserVoteForIssue(issueId);

        // Create HTML for voting UI
        votingElement.innerHTML = `
            <div class="vote-buttons">
                <button class="vote-btn upvote ${userVote === 'up' ? 'voted' : ''}" 
                        onclick="voteForIssue('${issueId}', 'up')" 
                        aria-label="Upvote this issue">
                    <i class="fas fa-arrow-up"></i>
                </button>
                <span class="vote-count ${totalVotes > 0 ? 'positive' : totalVotes < 0 ? 'negative' : ''}">${totalVotes}</span>
                <button class="vote-btn downvote ${userVote === 'down' ? 'voted' : ''}"
                        onclick="voteForIssue('${issueId}', 'down')"
                        aria-label="Downvote this issue">
                    <i class="fas fa-arrow-down"></i>
                </button>
            </div>
        `;

        // Append to the actions element instead of inserting before it
        actionsElement.appendChild(votingElement);

        // Mark card as initialized
        card.classList.add('votes-initialized');
    });

    // Initialize voting UI in issue details modals
    initializeVoteSystemForModal();
}

/**
 * Initialize voting UI in issue details modal
 */
function initializeVoteSystemForModal() {
    const modal = document.getElementById('issueDetailsModal');
    if (!modal) return;

    const issueHeader = modal.querySelector('.issue-details-header');
    if (!issueHeader) return;

    // Get issue ID from the modal
    const issueIdElement = issueHeader.querySelector('h2');
    if (!issueIdElement) return;

    const issueId = issueIdElement.textContent.replace(/Issue #/, '');

    // Check if voting UI already exists
    if (modal.querySelector('.voting-container')) return;

    // Create voting UI
    const votingElement = document.createElement('div');
    votingElement.className = 'voting-container modal-voting';

    // Get current votes from the issue data
    const issue = window.issues.find(i => (i.issueId || i.id) === issueId);
    const upvotes = issue?.upvotes || 0;
    const downvotes = issue?.downvotes || 0;
    const totalVotes = upvotes - downvotes;

    // Get current user's vote if it exists
    const userVote = getUserVoteForIssue(issueId);

    // Create HTML for voting UI
    votingElement.innerHTML = `
        <div class="vote-buttons">
            <button class="vote-btn upvote ${userVote === 'up' ? 'voted' : ''}" 
                    onclick="voteForIssue('${issueId}', 'up', true)" 
                    aria-label="Upvote this issue">
                <i class="fas fa-arrow-up"></i>
            </button>
            <span class="vote-count ${totalVotes > 0 ? 'positive' : totalVotes < 0 ? 'negative' : ''}">${totalVotes}</span>
            <button class="vote-btn downvote ${userVote === 'down' ? 'voted' : ''}"
                    onclick="voteForIssue('${issueId}', 'down', true)"
                    aria-label="Downvote this issue">
                <i class="fas fa-arrow-down"></i>
            </button>
        </div>
        <div class="vote-details">
            <span class="upvote-count">${upvotes} upvotes</span>
            <span class="downvote-count">${downvotes} downvotes</span>
        </div>
    `;

    // Add the voting UI to the header
    issueHeader.appendChild(votingElement);
}

/**
 * Vote for an issue (upvote or downvote)
 * @param {string} issueId - The ID of the issue to vote for
 * @param {string} voteType - The type of vote ('up' or 'down')
 * @param {boolean} isModal - Whether this vote is from a modal view
 */
async function voteForIssue(issueId, voteType, isModal = false) {
    if (!currentUser) {
        showNotification('Please login to vote', 'warning');
        showLoginModal();
        return;
    }

    try {
        // Check if user has already voted the same way
        const existingVote = getUserVoteForIssue(issueId);

        // If user already voted this way, remove their vote (toggle)
        if (existingVote === voteType) {
            const response = await removeVote(issueId);
            userVotes[issueId] = null;

            // Update the local issue data with the response data
            if (response && response.issue) {
                updateLocalIssueVotes(issueId, response.issue.upvotes, response.issue.downvotes);
            }
        } else {
            // Cast new vote (changes from downvote to upvote or vice versa, or adds new vote)
            const response = await castVote(issueId, voteType);
            userVotes[issueId] = voteType;

            // Update the local issue data with the response data
            if (response && response.issue) {
                updateLocalIssueVotes(issueId, response.issue.upvotes, response.issue.downvotes);
            }
        }

        // Update UI to reflect new vote state
        updateVoteUI(issueId, isModal);

        // Show success notification
        showNotification('Vote registered successfully', 'success');
    } catch (error) {
        console.error('Error voting for issue:', error);
        showNotification('Failed to register vote', 'error');
    }
}

/**
 * Update local issue data with new vote counts
 * @param {string} issueId - The ID of the issue
 * @param {number} upvotes - New upvote count
 * @param {number} downvotes - New downvote count
 */
function updateLocalIssueVotes(issueId, upvotes, downvotes) {
    if (window.issues && Array.isArray(window.issues)) {
        const issue = window.issues.find(i => (i.issueId || i.id) === issueId);
        if (issue) {
            issue.upvotes = upvotes;
            issue.downvotes = downvotes;
        }
    }
}

/**
 * Cast a vote for an issue
 * @param {string} issueId - The ID of the issue to vote for
 * @param {string} voteType - The type of vote ('up' or 'down')
 */
async function castVote(issueId, voteType) {
    const token = localStorage.getItem('bup-token');
    if (!token) {
        throw new Error('No authentication token found');
    }

    const res = await fetch(`/api/issues/${issueId}/vote`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ voteType })
    });

    if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to cast vote');
    }

    return await res.json();
}

/**
 * Remove a vote from an issue
 * @param {string} issueId - The ID of the issue to remove vote from
 */
async function removeVote(issueId) {
    const token = localStorage.getItem('bup-token');
    if (!token) {
        throw new Error('No authentication token found');
    }

    const res = await fetch(`/api/issues/${issueId}/vote`, {
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });

    if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to remove vote');
    }

    return await res.json();
}

/**
 * Get user's current vote for an issue
 * @param {string} issueId - The ID of the issue
 * @returns {string|null} - 'up', 'down', or null if no vote
 */
function getUserVoteForIssue(issueId) {
    // First check local state
    if (userVotes[issueId]) {
        return userVotes[issueId];
    }

    // If not in local state, check database if user is logged in
    if (!currentUser || !currentUser.email) {
        return null;
    }

    const issue = window.issues.find(i => (i.issueId || i.id) === issueId);
    if (!issue) return null;

    // Check if user's ID is in upvotes or downvotes arrays
    if (issue.upvoters && Array.isArray(issue.upvoters) &&
        issue.upvoters.includes(currentUser.email)) {
        userVotes[issueId] = 'up';
        return 'up';
    }

    if (issue.downvoters && Array.isArray(issue.downvoters) &&
        issue.downvoters.includes(currentUser.email)) {
        userVotes[issueId] = 'down';
        return 'down';
    }

    return null;
}

/**
 * Update vote UI for an issue
 * @param {string} issueId - The ID of the issue
 * @param {boolean} isModal - Whether this is for a modal view
 */
function updateVoteUI(issueId, isModal = false) {
    // Fix: Replace invalid :contains selector with standard DOM methods
    const issueCards = document.querySelectorAll('.issue-card');
    const matchingCards = [];

    // Find all issue cards with the matching ID
    issueCards.forEach(card => {
        const idElement = card.querySelector('.issue-id');
        if (idElement && idElement.textContent.includes(issueId)) {
            matchingCards.push(card);
        }
    });

    // Get the issue with updated vote counts
    const issue = window.issues.find(i => (i.issueId || i.id) === issueId);
    if (!issue) return;

    const upvotes = issue.upvotes || 0;
    const downvotes = issue.downvotes || 0;
    const totalVotes = upvotes - downvotes;

    // Get user's current vote
    const userVote = getUserVoteForIssue(issueId);

    // Update all instances of this issue's vote UI
    matchingCards.forEach(card => {
        const voteContainer = card.querySelector('.voting-container');
        if (!voteContainer) return;

        // Update vote count
        const voteCount = voteContainer.querySelector('.vote-count');
        if (voteCount) {
            voteCount.textContent = totalVotes;
            voteCount.className = `vote-count ${totalVotes > 0 ? 'positive' : totalVotes < 0 ? 'negative' : ''}`;
        }

        // Update upvote button
        const upvoteBtn = voteContainer.querySelector('.upvote');
        if (upvoteBtn) {
            if (userVote === 'up') {
                upvoteBtn.classList.add('voted');
            } else {
                upvoteBtn.classList.remove('voted');
            }
        }

        // Update downvote button
        const downvoteBtn = voteContainer.querySelector('.downvote');
        if (downvoteBtn) {
            if (userVote === 'down') {
                downvoteBtn.classList.add('voted');
            } else {
                downvoteBtn.classList.remove('voted');
            }
        }
    });

    // If this is for a modal, update the modal UI as well
    if (isModal) {
        const modalVoteContainer = document.querySelector('#issueDetailsModal .voting-container');
        if (modalVoteContainer) {
            // Update vote count
            const voteCount = modalVoteContainer.querySelector('.vote-count');
            if (voteCount) {
                voteCount.textContent = totalVotes;
                voteCount.className = `vote-count ${totalVotes > 0 ? 'positive' : totalVotes < 0 ? 'negative' : ''}`;
            }

            // Update upvote button
            const upvoteBtn = modalVoteContainer.querySelector('.upvote');
            if (upvoteBtn) {
                if (userVote === 'up') {
                    upvoteBtn.classList.add('voted');
                } else {
                    upvoteBtn.classList.remove('voted');
                }
            }

            // Update downvote button
            const downvoteBtn = modalVoteContainer.querySelector('.downvote');
            if (downvoteBtn) {
                if (userVote === 'down') {
                    downvoteBtn.classList.add('voted');
                } else {
                    downvoteBtn.classList.remove('voted');
                }
            }

            // Update vote details
            const upvoteCount = modalVoteContainer.querySelector('.upvote-count');
            if (upvoteCount) {
                upvoteCount.textContent = `${upvotes} upvotes`;
            }

            const downvoteCount = modalVoteContainer.querySelector('.downvote-count');
            if (downvoteCount) {
                downvoteCount.textContent = `${downvotes} downvotes`;
            }
        }
    }
}

/**
 * Load vote information from backend when issues are loaded
 */
function loadVotesFromIssues() {
    if (!window.issues || !Array.isArray(window.issues)) return;

    // Initialize local vote tracking from loaded issues
    window.issues.forEach(issue => {
        const issueId = issue.issueId || issue.id;

        // If user is logged in, check if they've voted
        if (currentUser && currentUser.email) {
            if (issue.upvoters && Array.isArray(issue.upvoters) &&
                issue.upvoters.includes(currentUser.email)) {
                userVotes[issueId] = 'up';
            } else if (issue.downvoters && Array.isArray(issue.downvoters) &&
                issue.downvoters.includes(currentUser.email)) {
                userVotes[issueId] = 'down';
            }
        }
    });

    // Initialize vote UI for all issues
    initializeVoteSystem();
}

// Initialize vote system when DOM is loaded
document.addEventListener('DOMContentLoaded', function () {
    // Register a listener for when issues are loaded
    window.addEventListener('issuesLoaded', loadVotesFromIssues);

    // Also listen for issue detail modal being displayed
    document.addEventListener('issueDetailModalOpened', function (e) {
        // Initialize voting UI in the modal
        setTimeout(initializeVoteSystemForModal, 100);
    });
});

// Make functions available globally
window.initializeVoteSystem = initializeVoteSystem;
window.voteForIssue = voteForIssue;
window.getUserVoteForIssue = getUserVoteForIssue;
window.updateVoteUI = updateVoteUI;
