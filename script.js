let currentUser = null;
let currentSection = 'home';
let issues = [];
let isDarkMode = false;

document.addEventListener('DOMContentLoaded', function() {
    // Apply dark mode first before other initializations
    initializeDarkMode();
    
    // Then continue with other initializations
    initializeApp();
    setupEventListeners();
    loadMockData();
    loadMapData();
});

function initializeApp() {
    updateNavigation();
    
    showSection('home');
    
    const today = new Date().toISOString().split('T')[0];
    const dateInputs = document.querySelectorAll('input[type="date"]');
    dateInputs.forEach(input => {
        if (input.id === 'reportStartDate') {
            const lastMonth = new Date();
            lastMonth.setMonth(lastMonth.getMonth() - 1);
            input.value = lastMonth.toISOString().split('T')[0];
        } else if (input.id === 'reportEndDate') {
            input.value = today;
        } else {
            input.min = today;
        }
    });
    
    // Add this to the end of the function
    updateHomeIssuesList();
}

function setupEventListeners() {
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const section = link.getAttribute('href').substring(1);
            showSection(section);
        });
    });

    document.getElementById('loginForm').addEventListener('submit', handleLogin);
    document.getElementById('registerForm').addEventListener('submit', handleRegistration);
    document.getElementById('issueForm').addEventListener('submit', handleIssueSubmission);
    document.getElementById('scheduleForm').addEventListener('submit', handleScheduleSubmission);

    document.getElementById('imageUpload').addEventListener('change', handleImageUpload);

    document.querySelectorAll('.building').forEach(building => {
        building.addEventListener('click', handleBuildingClick);
    });

    document.querySelectorAll('.stars i').forEach((star, index) => {
        star.addEventListener('click', () => handleRating(index + 1));
    });

    document.querySelector('.mobile-menu-toggle').addEventListener('click', toggleMobileMenu);

    document.querySelector('.notification-close').addEventListener('click', closeNotification);

    // Fix theme toggle listener - use direct function reference
    const darkModeToggle = document.getElementById('darkModeToggle');
    if (darkModeToggle) {
        darkModeToggle.removeEventListener('click', toggleDarkMode);
        darkModeToggle.addEventListener('click', toggleDarkMode);
    }

    document.getElementById('mapFilter').addEventListener('change', filterMapIssues);
    document.getElementById('statusFilter').addEventListener('change', filterUserIssues);
    document.getElementById('categoryFilter').addEventListener('change', filterUserIssues);
    document.getElementById('dateFilter').addEventListener('change', filterUserIssues);

    // Add event listeners for home page issues filters
    document.getElementById('homeStatusFilter').addEventListener('change', filterHomeIssues);
    document.getElementById('homeCategoryFilter').addEventListener('change', filterHomeIssues);
    document.getElementById('homeLocationFilter').addEventListener('change', filterHomeIssues);
}

function initializeDarkMode() {
    const savedTheme = localStorage.getItem('bup-theme-preference');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (savedTheme === 'dark' || (!savedTheme && systemPrefersDark)) {
        enableDarkMode(false); // Pass false to prevent notification on page load
    } else if (savedTheme === 'light') {
        disableDarkMode(false); // Pass false to prevent notification on page load
    } else {
        // System preference
        if (systemPrefersDark) {
            enableDarkMode(false);
        } else {
            disableDarkMode(false);
        }
    }
    
    // Listen for system preference changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        if (localStorage.getItem('bup-theme-preference') === 'system') {
            if (e.matches) {
                enableDarkMode(true);
            } else {
                disableDarkMode(true);
            }
        }
    });
}

// Make sure toggleDarkMode correctly handles the theme change
function toggleDarkMode() {
    if (isDarkMode) {
        disableDarkMode(true);
    } else {
        enableDarkMode(true);
    }
}

function enableDarkMode(showNotifications = true) {
    document.body.classList.add('dark-mode');
    isDarkMode = true;
    localStorage.setItem('bup-theme-preference', 'dark');
    updateDarkModeToggle();
    if (showNotifications) {
        showNotification('Dark mode enabled', 'success');
    }
}

function disableDarkMode(showNotifications = true) {
    document.body.classList.remove('dark-mode');
    isDarkMode = false;
    localStorage.setItem('bup-theme-preference', 'light');
    updateDarkModeToggle();
    if (showNotifications) {
        showNotification('Light mode enabled', 'success');
    }
}

function updateDarkModeToggle() {
    const toggle = document.getElementById('darkModeToggle');
    const icon = toggle.querySelector('i');
    
    if (isDarkMode) {
        icon.className = 'fas fa-sun';
        toggle.title = 'Switch to Light Mode';
        toggle.setAttribute('aria-label', 'Switch to Light Mode');
    } else {
        icon.className = 'fas fa-moon';
        toggle.title = 'Switch to Dark Mode';
        toggle.setAttribute('aria-label', 'Switch to Dark Mode');
    }
}

function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const role = document.getElementById('userRole').value;

    if (!email.endsWith('bup.edu.bd')) {
        showNotification('Please use a valid @bup.edu.bd email address', 'error');
        return;
    }

    currentUser = {
        email: email,
        role: role,
        name: getNameFromEmail(email)
    };

    showNotification(`Welcome back, ${currentUser.name}!`, 'success');
    closeLoginModal();
    updateUIForLoggedInUser();
}

function handleRegistration(e) {
    e.preventDefault();
    
    const fullName = document.getElementById('fullName').value;
    const email = document.getElementById('regEmail').value;
    const password = document.getElementById('regPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const role = document.getElementById('regRole').value;

    if (!email.endsWith('bup.edu.bd')) {
        showNotification('Please use a valid @bup.edu.bd email address', 'error');
        return;
    }

    if (password !== confirmPassword) {
        showNotification('Passwords do not match', 'error');
        return;
    }

    showNotification('Registration successful! Please login with your credentials.', 'success');
    closeRegisterModal();
    showLoginModal();
}

function updateUIForLoggedInUser() {
    const loginBtn = document.querySelector('.login-btn');
    loginBtn.innerHTML = `<i class="fas fa-user-circle"></i> ${currentUser.name}`;
    loginBtn.onclick = showUserMenu;

    if (currentUser.role === 'admin') {
        document.getElementById('adminTab').style.display = 'block';
    }
    if (currentUser.role === 'authority') {
        document.getElementById('authorityTab').style.display = 'block';
    }
    if (currentUser.role === 'technician' || currentUser.role === 'staff') {
        document.getElementById('technicianTab').style.display = 'block';
    }
}

function handleIssueSubmission(e) {
    e.preventDefault();
    
    if (!currentUser) {
        showNotification('Please login to submit an issue', 'warning');
        showLoginModal();
        return;
    }

    const issueData = {
        id: generateIssueId(),
        category: document.getElementById('category').value,
        priority: document.getElementById('priority').value,
        location: document.getElementById('location').value,
        specificLocation: document.getElementById('specificLocation').value,
        description: document.getElementById('description').value,
        submittedBy: currentUser.name,
        submittedDate: new Date().toISOString().split('T')[0],
        status: 'pending-review',
        images: []
    };

    issues.push(issueData);
    
    showNotification('Issue submitted successfully! You will receive updates via email/SMS.', 'success');
    document.getElementById('issueForm').reset();
    document.getElementById('imagePreview').innerHTML = '';
    
    if (currentSection === 'dashboard') {
        updateDashboard();
    }
    
    // Add this to the end of the function
    updateHomeIssuesList();
}

function handleImageUpload(e) {
    const files = e.target.files;
    const preview = document.getElementById('imagePreview');
    preview.innerHTML = '';

    Array.from(files).forEach(file => {
        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = function(e) {
                const img = document.createElement('img');
                img.src = e.target.result;
                img.style.width = '80px';
                img.style.height = '80px';
                img.style.objectFit = 'cover';
                img.style.borderRadius = '8px';
                img.style.border = '2px solid #e2e8f0';
                preview.appendChild(img);
            };
            reader.readAsDataURL(file);
        }
    });
}

function showSection(sectionName) {
    document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active');
    });
    
    document.getElementById(sectionName).classList.add('active');
    
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });
    
    document.querySelector(`[href="#${sectionName}"]`).classList.add('active');
    
    currentSection = sectionName;
    
    if (sectionName === 'dashboard') {
        updateDashboard();
    } else if (sectionName === 'reports') {
        updateReports();
    }
}

function updateReports() {
    // Initialize analytics and charts if analyticsManager exists
    if (typeof analyticsManager !== 'undefined') {
        analyticsManager.generateTrendsChart();
        if (!document.getElementById('categoryChart')) {
            analyticsManager.generateCategoryChart();
        }
    }
}

function showTab(tabName) {
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    
    document.getElementById(tabName).classList.add('active');
    
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    event.target.classList.add('active');
}

function showLoginModal() {
    closeRegisterModal();
    document.getElementById('loginModal').style.display = 'block';
}

function closeLoginModal() {
    document.getElementById('loginModal').style.display = 'none';
}

function showRegisterModal() {
    closeLoginModal();
    document.getElementById('registerModal').style.display = 'block';
}

function closeRegisterModal() {
    document.getElementById('registerModal').style.display = 'none';
}

function showScheduleModal() {
    document.getElementById('scheduleModal').style.display = 'block';
}

function closeScheduleModal() {
    document.getElementById('scheduleModal').style.display = 'none';
}

function handleBuildingClick(e) {
    e.preventDefault();  // Prevent default action
    const building = e.currentTarget;
    const buildingName = building.querySelector('.building-label').textContent;
    const issueCount = building.querySelector('.issue-count')?.textContent || '0';
    
    console.log(`Building clicked: ${buildingName} with ${issueCount} issues`);  // Debug
    
    showBuildingDetails(buildingName, issueCount);
}

function loadMockData() {
    // Create mock issues for campus buildings with corrected location IDs
    issues = [
        {
            id: 'BUP20240521001',
            category: 'electricity',
            priority: 'urgent',
            location: 'academic', // Matches data-building="academic"
            specificLocation: 'Room 205',
            description: 'Projector not working in classroom 205. Screen remains black even after restart.',
            submittedBy: 'Tahsin Ahmed',
            submittedDate: '2024-05-15',
            status: 'pending-review'
        },
        {
            id: 'BUP20240520002',
            category: 'furniture',
            priority: 'medium',
            location: 'academic',
            specificLocation: 'Room 301',
            description: 'Five chairs have broken backrests and need replacement.',
            submittedBy: 'Nusrat Jahan',
            submittedDate: '2024-05-14',
            status: 'in-progress'
        },
        {
            id: 'BUP20240519003',
            category: 'sanitary',
            priority: 'high',
            location: 'academic',
            specificLocation: '2nd Floor Washroom',
            description: 'Water leakage from sink pipe causing floor flooding.',
            submittedBy: 'Kamrul Hasan',
            submittedDate: '2024-05-13',
            status: 'assigned'
        },
        {
            id: 'BUP20240518004',
            category: 'electricity',
            priority: 'urgent',
            location: 'fbs',
            specificLocation: 'Computer Lab 2',
            description: 'Electrical short circuit in the main power line of Computer Lab 2.',
            submittedBy: 'Dr. Aminul Islam',
            submittedDate: '2024-05-12',
            status: 'in-progress'
        },
        {
            id: 'BUP20240517005',
            category: 'furniture',
            priority: 'low',
            location: 'fbs',
            specificLocation: 'Meeting Room',
            description: 'Conference table has scratches and needs polishing.',
            submittedBy: 'Fatema Begum',
            submittedDate: '2024-05-11',
            status: 'pending-review'
        },
        {
            id: 'BUP20240516006',
            category: 'cafeteria',
            priority: 'high',
            location: 'amitte',
            specificLocation: 'Kitchen Area',
            description: 'One refrigerator not cooling properly, food items getting spoiled.',
            submittedBy: 'Rezaul Karim',
            submittedDate: '2024-05-10',
            status: 'assigned'
        },
        {
            id: 'BUP20240515007',
            category: 'cafeteria',
            priority: 'urgent',
            location: 'vista',
            specificLocation: 'Dining Area',
            description: 'Ventilation system not working, excessive heat in dining area.',
            submittedBy: 'Sadia Afrin',
            submittedDate: '2024-05-09',
            status: 'in-progress'
        },
        {
            id: 'BUP20240514008',
            category: 'sanitary',
            priority: 'medium',
            location: 'admin',
            specificLocation: '1st Floor Washroom',
            description: 'Flushing system broken in two toilet stalls.',
            submittedBy: 'Masud Khan',
            submittedDate: '2024-05-08',
            status: 'resolved'
        },
        {
            id: 'BUP20240513009',
            category: 'transportation',
            priority: 'low',
            location: 'admin',
            specificLocation: 'Parking Area',
            description: 'Parking line markings faded and need repainting.',
            submittedBy: 'Dr. Mahfuzur Rahman',
            submittedDate: '2024-05-07',
            status: 'pending-review'
        },
        {
            id: 'BUP20240512010',
            category: 'lab',
            priority: 'high',
            location: 'academic',
            specificLocation: 'Physics Lab',
            description: 'Gas leakage detected in the physics lab equipment.',
            submittedBy: 'Dr. Tahmina Akter',
            submittedDate: '2024-05-06',
            status: 'urgent'
        },
        {
            id: 'BUP20240511011',
            category: 'electricity',
            priority: 'medium',
            location: 'library',
            specificLocation: 'Reading Area',
            description: 'Three ceiling lights flickering and need replacement.',
            submittedBy: 'Sharmin Sultana',
            submittedDate: '2024-05-05',
            status: 'assigned'
        },
        {
            id: 'BUP20240510012',
            category: 'furniture',
            priority: 'low',
            location: 'library',
            specificLocation: 'Study Carrels',
            description: 'Wooden partitions between study spaces are loose.',
            submittedBy: 'Abdullah Al Mamun',
            submittedDate: '2024-05-04',
            status: 'pending-review'
        },
        {
            id: 'BUP20240509013',
            category: 'sanitary',
            priority: 'urgent',
            location: 'third-place',
            specificLocation: 'Kitchen',
            description: 'Drain blockage causing water backup in kitchen sink.',
            submittedBy: 'Mohammed Karim',
            submittedDate: '2024-05-03',
            status: 'in-progress'
        },
        {
            id: 'BUP20240508014',
            category: 'transportation',
            priority: 'high',
            location: 'annex',
            specificLocation: 'Entrance Ramp',
            description: 'Wheelchair ramp has cracks and needs repair for safety.',
            submittedBy: 'Rabeya Khatun',
            submittedDate: '2024-05-02',
            status: 'assigned'
        },
        {
            id: 'BUP20240507015',
            category: 'furniture',
            priority: 'medium',
            location: 'daycare',
            specificLocation: 'Playroom',
            description: 'Several toys and child-sized chairs damaged.',
            submittedBy: 'Nasrin Akter',
            submittedDate: '2024-05-01',
            status: 'resolved'
        },
        {
            id: 'BUP20240506016',
            category: 'electricity',
            priority: 'urgent',
            location: 'staff-canteen',
            specificLocation: 'Kitchen',
            description: 'Electrical short circuit in microwave, causing power outage.',
            submittedBy: 'Abdul Alim',
            submittedDate: '2024-04-30',
            status: 'resolved'
        }
    ];
    
    // Update the campus map with these issues - this is critical
    updateCampusMap(issues);
    
    // Initialize the home issues list
    updateHomeIssuesList();
    
    // Log for debugging
    console.log('Mock data loaded, home issues list updated');
}

// Function to update the Home page issues list
function updateHomeIssuesList() {
    // Filter out issues that are in pending-review state
    const visibleIssues = issues.filter(issue => issue.status !== 'pending-review');
    
    // Display issues (with current filters applied)
    displayHomeIssues(visibleIssues);
}

// Function to filter home issues based on selected filters
function filterHomeIssues() {
    const statusFilter = document.getElementById('homeStatusFilter').value;
    const categoryFilter = document.getElementById('homeCategoryFilter').value;
    const locationFilter = document.getElementById('homeLocationFilter').value;
    
    // Filter out issues that are in pending-review state
    let filteredIssues = issues.filter(issue => {
        // Always filter out pending-review issues
        if (issue.status === 'pending-review') {
            return false;
        }
        
        // Apply selected filters
        if (statusFilter !== 'all' && issue.status !== statusFilter) return false;
        if (categoryFilter !== 'all' && issue.category !== categoryFilter) return false;
        if (locationFilter !== 'all' && issue.location !== locationFilter) return false;
        
        return true;
    });
    
    // Display filtered issues
    displayHomeIssues(filteredIssues);
}

// Function to display home issues
function displayHomeIssues(issuesToDisplay) {
    const issuesList = document.getElementById('home-issues-list');
    
    // Clear existing content
    if (!issuesList) {
        console.error("Element 'home-issues-list' not found!");
        return; // Exit if element doesn't exist
    }
    
    issuesList.innerHTML = '';
    
    if (issuesToDisplay.length === 0) {
        issuesList.innerHTML = '<p class="no-issues">No issues match your filter criteria.</p>';
        return;
    }
    
    // Sort issues by date (newest first)
    issuesToDisplay.sort((a, b) => new Date(b.submittedDate) - new Date(a.submittedDate));
    
    // Create issue cards - limit to 10 for better performance
    const displayLimit = 10;
    const displayedIssues = issuesToDisplay.slice(0, displayLimit);
    
    displayedIssues.forEach(issue => {
        const issueCard = document.createElement('div');
        issueCard.className = 'issue-card';
        
        // Format location name for display
        const locationName = getLocationName(issue.location);
        
        issueCard.innerHTML = `
            <div class="issue-header">
                <span class="issue-id">#${issue.id}</span>
                <span class="issue-status ${issue.status}">${formatStatus(issue.status)}</span>
                <span class="issue-priority ${issue.priority}">${issue.priority}</span>
            </div>
            <h4>${formatCategoryName(issue.category)} Issue - ${issue.specificLocation}</h4>
            <div class="issue-details">
                <span><i class="fas fa-map-marker-alt"></i> ${locationName}, ${issue.specificLocation}</span>
                <span><i class="fas fa-calendar"></i> Submitted: ${issue.submittedDate}</span>
                <span><i class="fas fa-user"></i> ${issue.submittedBy}</span>
            </div>
            <p>${issue.description}</p>
            <div class="issue-actions">
                <button class="btn-secondary" onclick="viewIssueDetails('${issue.id}')">View Details</button>
                ${issue.status === 'resolved' ? 
                    `<div class="rating">
                        <span>Avg Rating:</span>
                        <div class="stars">
                            ${generateStarRating(getRandomRating())}
                        </div>
                    </div>` : ''}
            </div>
        `;
        
        issuesList.appendChild(issueCard);
    });
    
    // Add a "See More" button if there are more issues
    if (issuesToDisplay.length > displayLimit) {
        const seeMoreButton = document.createElement('button');
        seeMoreButton.className = 'btn-primary see-more-btn';
        seeMoreButton.textContent = `See ${issuesToDisplay.length - displayLimit} More Issues`;
        seeMoreButton.onclick = function() {
            showSection('dashboard');
        };
        issuesList.appendChild(seeMoreButton);
    }
}

// Helper functions needed for displaying issues
function getLocationName(locationId) {
    const locationMap = {
        'academic': 'Academic Building',
        'fbs': 'FBS Building',
        'admin': 'Admin Building',
        'library': 'Library',
        'annex': 'Annex',
        'vista': 'Vista Cafeteria',
        'amitte': 'Amitte Cafeteria',
        'third-place': 'Third Place Cafeteria',
        'daycare': 'Day Care Center',
        'staff-canteen': 'Staff Canteen'
    };
    return locationMap[locationId] || locationId;
}

function formatStatus(status) {
    return status.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

function formatCategoryName(category) {
    return category.charAt(0).toUpperCase() + category.slice(1);
}

function generateStarRating(rating) {
    let stars = '';
    for (let i = 1; i <= 5; i++) {
        if (i <= rating) {
            stars += '<i class="fas fa-star"></i>';
        } else if (i - 0.5 <= rating) {
            stars += '<i class="fas fa-star-half-alt"></i>';
        } else {
            stars += '<i class="far fa-star"></i>';
        }
    }
    return stars;
}

function getRandomRating() {
    return Math.floor(Math.random() * 5) + 3.5; // Random rating between 3.5 and 5
}

function viewIssueDetails(issueId) {
    // Find the issue in the issues array
    const issue = issues.find(i => i.id === issueId);
    if (!issue) {
        showNotification('Issue not found', 'error');
        return;
    }
    
    // Log for debugging
    console.log('Viewing issue details:', issue);
    
    // Show notification for now (this would be replaced with actual detail view)
    showNotification(`Viewing details for issue #${issueId}`, 'info');
}

function showSection(sectionName) {
    document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active');
    });
    
    document.getElementById(sectionName).classList.add('active');
    
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });
    
    document.querySelector(`[href="#${sectionName}"]`).classList.add('active');
    
    currentSection = sectionName;
    
    if (sectionName === 'dashboard') {
        updateDashboard();
    } else if (sectionName === 'reports') {
        updateReports();
    }
}

function updateReports() {
    // Initialize analytics and charts if analyticsManager exists
    if (typeof analyticsManager !== 'undefined') {
        analyticsManager.generateTrendsChart();
        if (!document.getElementById('categoryChart')) {
            analyticsManager.generateCategoryChart();
        }
    }
}

function showTab(tabName) {
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    
    document.getElementById(tabName).classList.add('active');
    
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    event.target.classList.add('active');
}

function showLoginModal() {
    closeRegisterModal();
    document.getElementById('loginModal').style.display = 'block';
}

function closeLoginModal() {
    document.getElementById('loginModal').style.display = 'none';
}

function showRegisterModal() {
    closeLoginModal();
    document.getElementById('registerModal').style.display = 'block';
}

function closeRegisterModal() {
    document.getElementById('registerModal').style.display = 'none';
}

function showScheduleModal() {
    document.getElementById('scheduleModal').style.display = 'block';
}

function closeScheduleModal() {
    document.getElementById('scheduleModal').style.display = 'none';
}

function handleBuildingClick(e) {
    e.preventDefault();  // Prevent default action
    const building = e.currentTarget;
    const buildingName = building.querySelector('.building-label').textContent;
    const issueCount = building.querySelector('.issue-count')?.textContent || '0';
    
    console.log(`Building clicked: ${buildingName} with ${issueCount} issues`);  // Debug
    
    showBuildingDetails(buildingName, issueCount);
}

function loadMockData() {
    // Create mock issues for campus buildings with corrected location IDs
    issues = [
        {
            id: 'BUP20240521001',
            category: 'electricity',
            priority: 'urgent',
            location: 'academic', // Matches data-building="academic"
            specificLocation: 'Room 205',
            description: 'Projector not working in classroom 205. Screen remains black even after restart.',
            submittedBy: 'Tahsin Ahmed',
            submittedDate: '2024-05-15',
            status: 'pending-review'
        },
        {
            id: 'BUP20240520002',
            category: 'furniture',
            priority: 'medium',
            location: 'academic',
            specificLocation: 'Room 301',
            description: 'Five chairs have broken backrests and need replacement.',
            submittedBy: 'Nusrat Jahan',
            submittedDate: '2024-05-14',
            status: 'in-progress'
        },
        {
            id: 'BUP20240519003',
            category: 'sanitary',
            priority: 'high',
            location: 'academic',
            specificLocation: '2nd Floor Washroom',
            description: 'Water leakage from sink pipe causing floor flooding.',
            submittedBy: 'Kamrul Hasan',
            submittedDate: '2024-05-13',
            status: 'assigned'
        },
        {
            id: 'BUP20240518004',
            category: 'electricity',
            priority: 'urgent',
            location: 'fbs',
            specificLocation: 'Computer Lab 2',
            description: 'Electrical short circuit in the main power line of Computer Lab 2.',
            submittedBy: 'Dr. Aminul Islam',
            submittedDate: '2024-05-12',
            status: 'in-progress'
        },
        {
            id: 'BUP20240517005',
            category: 'furniture',
            priority: 'low',
            location: 'fbs',
            specificLocation: 'Meeting Room',
            description: 'Conference table has scratches and needs polishing.',
            submittedBy: 'Fatema Begum',
            submittedDate: '2024-05-11',
            status: 'pending-review'
        },
        {
            id: 'BUP20240516006',
            category: 'cafeteria',
            priority: 'high',
            location: 'amitte',
            specificLocation: 'Kitchen Area',
            description: 'One refrigerator not cooling properly, food items getting spoiled.',
            submittedBy: 'Rezaul Karim',
            submittedDate: '2024-05-10',
            status: 'assigned'
        },
        {
            id: 'BUP20240515007',
            category: 'cafeteria',
            priority: 'urgent',
            location: 'vista',
            specificLocation: 'Dining Area',
            description: 'Ventilation system not working, excessive heat in dining area.',
            submittedBy: 'Sadia Afrin',
            submittedDate: '2024-05-09',
            status: 'in-progress'
        },
        {
            id: 'BUP20240514008',
            category: 'sanitary',
            priority: 'medium',
            location: 'admin',
            specificLocation: '1st Floor Washroom',
            description: 'Flushing system broken in two toilet stalls.',
            submittedBy: 'Masud Khan',
            submittedDate: '2024-05-08',
            status: 'resolved'
        },
        {
            id: 'BUP20240513009',
            category: 'transportation',
            priority: 'low',
            location: 'admin',
            specificLocation: 'Parking Area',
            description: 'Parking line markings faded and need repainting.',
            submittedBy: 'Dr. Mahfuzur Rahman',
            submittedDate: '2024-05-07',
            status: 'pending-review'
        },
        {
            id: 'BUP20240512010',
            category: 'lab',
            priority: 'high',
            location: 'academic',
            specificLocation: 'Physics Lab',
            description: 'Gas leakage detected in the physics lab equipment.',
            submittedBy: 'Dr. Tahmina Akter',
            submittedDate: '2024-05-06',
            status: 'urgent'
        },
        {
            id: 'BUP20240511011',
            category: 'electricity',
            priority: 'medium',
            location: 'library',
            specificLocation: 'Reading Area',
            description: 'Three ceiling lights flickering and need replacement.',
            submittedBy: 'Sharmin Sultana',
            submittedDate: '2024-05-05',
            status: 'assigned'
        },
        {
            id: 'BUP20240510012',
            category: 'furniture',
            priority: 'low',
            location: 'library',
            specificLocation: 'Study Carrels',
            description: 'Wooden partitions between study spaces are loose.',
            submittedBy: 'Abdullah Al Mamun',
            submittedDate: '2024-05-04',
            status: 'pending-review'
        },
        {
            id: 'BUP20240509013',
            category: 'sanitary',
            priority: 'urgent',
            location: 'third-place',
            specificLocation: 'Kitchen',
            description: 'Drain blockage causing water backup in kitchen sink.',
            submittedBy: 'Mohammed Karim',
            submittedDate: '2024-05-03',
            status: 'in-progress'
        },
        {
            id: 'BUP20240508014',
            category: 'transportation',
            priority: 'high',
            location: 'annex',
            specificLocation: 'Entrance Ramp',
            description: 'Wheelchair ramp has cracks and needs repair for safety.',
            submittedBy: 'Rabeya Khatun',
            submittedDate: '2024-05-02',
            status: 'assigned'
        },
        {
            id: 'BUP20240507015',
            category: 'furniture',
            priority: 'medium',
            location: 'daycare',
            specificLocation: 'Playroom',
            description: 'Several toys and child-sized chairs damaged.',
            submittedBy: 'Nasrin Akter',
            submittedDate: '2024-05-01',
            status: 'resolved'
        },
        {
            id: 'BUP20240506016',
            category: 'electricity',
            priority: 'urgent',
            location: 'staff-canteen',
            specificLocation: 'Kitchen',
            description: 'Electrical short circuit in microwave, causing power outage.',
            submittedBy: 'Abdul Alim',
            submittedDate: '2024-04-30',
            status: 'resolved'
        }
    ];
    
    // Update the campus map with these issues - this is critical
    updateCampusMap(issues);
}

function filterMapIssues() {
    const filter = document.getElementById('mapFilter').value;
    console.log("Filter applied:", filter);  // Debug
    
    // Filter issues based on the selected criteria
    let filteredIssues = [];
    
    if (filter === 'all') {
        filteredIssues = issues;
    } else if (filter === 'urgent') {
        filteredIssues = issues.filter(issue => issue.priority === 'urgent');
    } else if (filter === 'high') {
        filteredIssues = issues.filter(issue => issue.priority === 'high');
    } else if (filter === 'pending') {
        filteredIssues = issues.filter(issue => 
            issue.status === 'pending-review' || issue.status === 'assigned'
        );
    } else if (filter === 'resolved') {
        filteredIssues = issues.filter(issue => issue.status === 'resolved');
    }
    
    console.log("Filtered issues:", filteredIssues.length);  // Debug
    
    // Update the campus map with filtered issues
    updateCampusMap(filteredIssues);
    
    // Show notification about the filter
    showNotification(`Showing ${filter} issues on the campus map`, 'info');
}

function updateCampusMap(filteredIssues) {
    // Group issues by location - make sure locations match building data-attributes
    const issuesByLocation = {};
    
    filteredIssues.forEach(issue => {
        const location = issue.location;
        if (!issuesByLocation[location]) {
            issuesByLocation[location] = [];
        }
        issuesByLocation[location].push(issue);
    });
    
    console.log("Issues by location:", issuesByLocation);  // Debug
    
    // Update each building on the map
    document.querySelectorAll('.building').forEach(building => {
        const buildingId = building.dataset.building;
        console.log("Processing building:", buildingId);  // Debug
        
        const issueCountElement = building.querySelector('.issue-count');
        if (!issueCountElement) {
            console.log("No issue count element for:", buildingId);  // Debug
            return;
        }
        
        // If we have issues for this building
        if (issuesByLocation[buildingId] && issuesByLocation[buildingId].length > 0) {
            const buildingIssues = issuesByLocation[buildingId];
            const issueCount = buildingIssues.length;
            
            console.log(`${buildingId} has ${issueCount} issues`);  // Debug
            
            // Find highest priority
            let highestPriority = 'low';
            const priorityRank = { 'urgent': 4, 'high': 3, 'medium': 2, 'low': 1 };
            
            buildingIssues.forEach(issue => {
                if (priorityRank[issue.priority] > priorityRank[highestPriority]) {
                    highestPriority = issue.priority;
                }
            });
            
            // Update count and class
            issueCountElement.textContent = issueCount;
            
            // Remove existing priority classes
            ['low', 'medium', 'high', 'urgent'].forEach(priority => {
                issueCountElement.classList.remove(priority);
            });
            
            // Add appropriate priority class
            issueCountElement.classList.add(highestPriority);
            
            // Make building visible
            building.style.display = 'flex';
        } else {
            // No issues for this building with current filter
            if (document.getElementById('mapFilter').value !== 'all') {
                // Hide building if we're filtering and it has no matching issues
                building.style.display = 'none';
            } else {
                // Show building with zero count if we're showing all
                issueCountElement.textContent = '0';
                
                // Remove priority classes and add low
                ['low', 'medium', 'high', 'urgent'].forEach(priority => {
                    issueCountElement.classList.remove(priority);
                });
                issueCountElement.classList.add('low');
                building.style.display = 'flex';
            }
        }
    });
}

function showBuildingDetails(buildingName, issueCount) {
    // Find building ID from name - important for mapping to issues
    const buildingElement = Array.from(document.querySelectorAll('.building'))
        .find(b => b.querySelector('.building-label').textContent === buildingName);
    
    if (!buildingElement) {
        console.log("Building element not found");  // Debug
        return;
    }
    
    const buildingId = buildingElement.dataset.building;
    console.log("Building ID:", buildingId);  // Debug
    
    // Get issues for this building
    const buildingIssues = issues.filter(issue => issue.location === buildingId);
    console.log("Found issues:", buildingIssues.length);  // Debug
    
    // Create modal for displaying building details
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.id = 'buildingDetailsModal';
    
    // Count issues by priority
    const priorityCounts = {
        urgent: buildingIssues.filter(i => i.priority === 'urgent').length,
        high: buildingIssues.filter(i => i.priority === 'high').length,
        medium: buildingIssues.filter(i => i.priority === 'medium').length,
        low: buildingIssues.filter(i => i.priority === 'low').length
    };
    
    // Create issue breakdown
    let issueBreakdown = '';
    if (priorityCounts.urgent > 0) {
        issueBreakdown += `<div class="priority-count urgent">${priorityCounts.urgent} Urgent</div>`;
    }
    if (priorityCounts.high > 0) {
        issueBreakdown += `<div class="priority-count high">${priorityCounts.high} High</div>`;
    }
    if (priorityCounts.medium > 0) {
        issueBreakdown += `<div class="priority-count medium">${priorityCounts.medium} Medium</div>`;
    }
    if (priorityCounts.low > 0) {
        issueBreakdown += `<div class="priority-count low">${priorityCounts.low} Low</div>`;
    }
    
    // Generate issue cards for this building
    let issueCards = '';
    buildingIssues.forEach(issue => {
        issueCards += `
            <div class="mini-issue-card">
                <div class="mini-issue-header">
                    <span class="issue-id">${issue.id}</span>
                    <span class="issue-priority ${issue.priority}">${issue.priority}</span>
                    <span class="issue-status ${issue.status}">${issue.status.replace('-', ' ')}</span>
                </div>
                <h5>${issue.category.charAt(0).toUpperCase() + issue.category.slice(1)} Issue - ${issue.specificLocation}</h5>
                <p>${issue.description}</p>
                <div class="mini-issue-footer">
                    <span><i class="fas fa-user"></i> ${issue.submittedBy}</span>
                    <span><i class="fas fa-calendar"></i> ${issue.submittedDate}</span>
                </div>
            </div>
        `;
    });
    
    if (buildingIssues.length === 0) {
        issueCards = '<p class="no-issues">No issues reported for this building.</p>';
    }
    
    modal.innerHTML = `
        <div class="modal-content building-details-modal">
            <span class="close" onclick="closeBuildingDetailsModal()">&times;</span>
            <div class="building-details-header">
                <h2>${buildingName}</h2>
                <div class="building-stats">
                    <div class="stat-badge">
                        <i class="fas fa-exclamation-circle"></i>
                        <span>${buildingIssues.length} Issues</span>
                    </div>
                </div>
            </div>
            
            <div class="priority-breakdown">
                ${issueBreakdown || '<p>No active issues</p>'}
            </div>
            
            <div class="building-issues-list">
                ${issueCards}
            </div>
            
            <div class="building-details-actions">
                <button class="btn-primary" onclick="reportIssueForBuilding('${buildingId}')">
                    <i class="fas fa-plus-circle"></i> Report New Issue
                </button>
                <button class="btn-secondary" onclick="closeBuildingDetailsModal()">
                    Close
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    modal.style.display = 'block';
}

function closeBuildingDetailsModal() {
    const modal = document.getElementById('buildingDetailsModal');
    if (modal) {
        modal.remove();
    }
}

function reportIssueForBuilding(buildingId) {
    closeBuildingDetailsModal();
    
    // Scroll to the report form
    document.getElementById('home').classList.add('active');
    document.getElementById('map').classList.remove('active');
    
    // Update nav links
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });
    document.querySelector('[href="#home"]').classList.add('active');
    
    // Set the location dropdown
    document.getElementById('location').value = buildingId;
    
    // Scroll to the form
    document.querySelector('.quick-report').scrollIntoView({ behavior: 'smooth' });
    
    // Update current section
    currentSection = 'home';
}

function updateNavigation() {
    // Update navigation based on user state
}

function toggleMobileMenu() {
    const navLinks = document.querySelector('.nav-links');
    navLinks.classList.toggle('mobile-active');
}

function showUserMenu() {
    // Remove any existing dropdown
    const existingDropdown = document.querySelector('.user-dropdown');
    if (existingDropdown) {
        existingDropdown.remove();
        return;
    }

    // Create dropdown menu
    const dropdown = document.createElement('div');
    dropdown.className = 'user-dropdown';
    dropdown.innerHTML = `
        <div class="user-dropdown-header">
            <div class="user-avatar">
                <i class="fas fa-user-circle"></i>
            </div>
            <div class="user-info">
                <span class="user-name">${currentUser.name}</span>
                <span class="user-role">${currentUser.role}</span>
                <span class="user-email">${currentUser.email}</span>
            </div>
        </div>
        <div class="user-dropdown-divider"></div>
        <div class="user-dropdown-menu">
            <a href="#" onclick="showProfile(); closeUserMenu();">
                <i class="fas fa-user"></i>
                <span>My Profile</span>
            </a>
            <a href="#" onclick="showSettings(); closeUserMenu();">
                <i class="fas fa-cog"></i>
                <span>Settings</span>
            </a>
            <a href="#" onclick="showNotifications(); closeUserMenu();">
                <i class="fas fa-bell"></i>
                <span>Notifications</span>
                <span class="notification-badge">3</span>
            </a>
            <a href="#" onclick="showMyIssues(); closeUserMenu();">
                <i class="fas fa-list"></i>
                <span>My Issues</span>
            </a>
            <div class="user-dropdown-divider"></div>
            <a href="#" onclick="showHelp(); closeUserMenu();">
                <i class="fas fa-question-circle"></i>
                <span>Help & Support</span>
            </a>
            <a href="#" onclick="handleLogout(); return false;" class="logout-link">
    <i class="fas fa-sign-out-alt"></i>
    <span>Logout</span>
</a>
        </div>
    `;

    // Position dropdown relative to user menu button
    const userMenu = document.querySelector('.user-menu');
    userMenu.style.position = 'relative';
    userMenu.appendChild(dropdown);

    // Close dropdown when clicking outside
    setTimeout(() => {
        document.addEventListener('click', handleOutsideClick);
    }, 10);
}

function closeUserMenu() {
    const dropdown = document.querySelector('.user-dropdown');
    if (dropdown) {
        dropdown.remove();
        document.removeEventListener('click', handleOutsideClick);
    }
}

function handleOutsideClick(event) {
    const dropdown = document.querySelector('.user-dropdown');
    const userMenu = document.querySelector('.user-menu');
    
    if (dropdown && !userMenu.contains(event.target)) {
        closeUserMenu();
    }
}

function showProfile() {
    if (!currentUser) return;
    
    const profileModal = createProfileModal();
    document.body.appendChild(profileModal);
    profileModal.style.display = 'block';
}

function createProfileModal() {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.id = 'profileModal';
    modal.innerHTML = `
        <div class="modal-content profile-modal">
            <span class="close" onclick="closeProfileModal()">&times;</span>
            <h2>User Profile</h2>
            <div class="profile-content">
                <div class="profile-avatar">
                    <i class="fas fa-user-circle"></i>
                    <button class="btn-secondary change-avatar-btn">Change Avatar</button>
                </div>
                <div class="profile-info">
                    <div class="form-group">
                        <label>Full Name</label>
                        <input type="text" id="profileName" value="${currentUser.name}" readonly>
                        <button class="edit-btn" onclick="toggleEdit('profileName')">
                            <i class="fas fa-edit"></i>
                        </button>
                    </div>
                    <div class="form-group">
                        <label>Email</label>
                        <input type="email" id="profileEmail" value="${currentUser.email}" readonly>
                    </div>
                    <div class="form-group">
                        <label>Role</label>
                        <input type="text" id="profileRole" value="${currentUser.role}" readonly>
                    </div>
                    <div class="form-group">
                        <label>Department</label>
                        <input type="text" id="profileDepartment" value="${currentUser.department || 'Not specified'}" readonly>
                        <button class="edit-btn" onclick="toggleEdit('profileDepartment')">
                            <i class="fas fa-edit"></i>
                        </button>
                    </div>
                    <div class="form-group">
                        <label>Phone Number</label>
                        <input type="tel" id="profilePhone" value="${currentUser.phone || ''}" placeholder="Add phone number" readonly>
                        <button class="edit-btn" onclick="toggleEdit('profilePhone')">
                            <i class="fas fa-edit"></i>
                        </button>
                    </div>
                </div>
            </div>
            <div class="profile-actions">
                <button class="btn-primary" onclick="saveProfile()">Save Changes</button>
                <button class="btn-secondary" onclick="closeProfileModal()">Cancel</button>
            </div>
        </div>
    `;
    return modal;
}

function closeProfileModal() {
    const modal = document.getElementById('profileModal');
    if (modal) {
        modal.remove();
    }
}

function toggleEdit(fieldId) {
    const field = document.getElementById(fieldId);
    const isReadonly = field.hasAttribute('readonly');
    
    if (isReadonly) {
        field.removeAttribute('readonly');
        field.focus();
        field.style.borderColor = 'var(--primary-color)';
    } else {
        field.setAttribute('readonly', true);
        field.style.borderColor = 'var(--gray-200)';
    }
}

function saveProfile() {
    const updatedData = {
        name: document.getElementById('profileName').value,
        department: document.getElementById('profileDepartment').value,
        phone: document.getElementById('profilePhone').value
    };
    
    // Update current user object
    Object.assign(currentUser, updatedData);
    
    // Update localStorage
    localStorage.setItem('bup-current-user', JSON.stringify(currentUser));
    
    // Update UI
    updateUIForLoggedInUser();
    
    showNotification('Profile updated successfully!', 'success');
    closeProfileModal();
}

function showSettings() {
    const settingsModal = createSettingsModal();
    document.body.appendChild(settingsModal);
    settingsModal.style.display = 'block';
}

function createSettingsModal() {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.id = 'settingsModal';
    modal.innerHTML = `
        <div class="modal-content settings-modal">
            <span class="close" onclick="closeSettingsModal()">&times;</span>
            <h2>Settings</h2>
            <div class="settings-content">
                <div class="settings-section">
                    <h3>Theme Preferences</h3>
                    <div class="setting-item">
                        <label>Theme Mode</label>
                        <div class="theme-options">
                            <label class="radio-option">
                                <input type="radio" name="theme" value="light" ${!isDarkMode ? 'checked' : ''}>
                                <span>Light Mode</span>
                            </label>
                            <label class="radio-option">
                                <input type="radio" name="theme" value="dark" ${isDarkMode ? 'checked' : ''}>
                                <span>Dark Mode</span>
                            </label>
                            <label class="radio-option">
                                <input type="radio" name="theme" value="system">
                                <span>System Default</span>
                            </label>
                        </div>
                    </div>
                </div>
                
                <div class="settings-section">
                    <h3>Notification Preferences</h3>
                    <div class="setting-item">
                        <label class="checkbox-setting">
                            <input type="checkbox" checked>
                            <span>Email notifications for issue updates</span>
                        </label>
                    </div>
                    <div class="setting-item">
                        <label class="checkbox-setting">
                            <input type="checkbox" checked>
                            <span>SMS notifications for urgent issues</span>
                        </label>
                    </div>
                    <div class="setting-item">
                        <label class="checkbox-setting">
                            <input type="checkbox">
                            <span>Weekly summary reports</span>
                        </label>
                    </div>
                </div>
                
                <div class="settings-section">
                    <h3>Privacy & Security</h3>
                    <div class="setting-item">
                        <button class="btn-secondary" onclick="changePassword()">Change Password</button>
                    </div>
                    <div class="setting-item">
                        <button class="btn-secondary" onclick="downloadData()">Download My Data</button>
                    </div>
                </div>
            </div>
            <div class="settings-actions">
                <button class="btn-primary" onclick="saveSettings()">Save Settings</button>
                <button class="btn-secondary" onclick="closeSettingsModal()">Cancel</button>
            </div>
        </div>
    `;
    return modal;
}

function closeSettingsModal() {
    const modal = document.getElementById('settingsModal');
    if (modal) {
        modal.remove();
    }
}

function saveSettings() {
    const selectedTheme = document.querySelector('input[name="theme"]:checked').value;
    
    if (selectedTheme === 'dark') {
        enableDarkMode();
    } else if (selectedTheme === 'light') {
        disableDarkMode();
    }
    
    showNotification('Settings saved successfully!', 'success');
    closeSettingsModal();
}

function showNotifications() {
    // Close any open user menu dropdown first
    closeUserMenu();
    
    // Check if all notifications panel already exists
    if (document.getElementById('allNotificationsPanel')) {
        // If the panel exists, toggle its visibility
        const panel = document.getElementById('allNotificationsPanel');
        if (panel.classList.contains('show')) {
            panel.classList.remove('show');
        } else {
            panel.classList.add('show');
        }
    } else {
        // If the panel doesn't exist, create it
        createAllNotificationsPanel();
        // Then show it
        document.getElementById('allNotificationsPanel').classList.add('show');
    }
}

function createAllNotificationsPanel() {
    const panel = document.createElement('div');
    panel.id = 'allNotificationsPanel';
    panel.className = 'all-notifications-panel';
    
    panel.innerHTML = `
        <div class="all-notifications-header">
            <h2>All Notifications</h2>
            <button class="close-all-notifications" onclick="closeAllNotificationsPanel()">
                <i class="fas fa-times"></i>
            </button>
        </div>
        <div class="all-notifications-filters">
            <button class="notification-filter-btn active" onclick="filterNotifications('all')">All</button>
            <button class="notification-filter-btn" onclick="filterNotifications('unread')">Unread</button>
            <button class="notification-filter-btn" onclick="filterNotifications('read')">Read</button>
        </div>
        <div class="all-notifications-list">
            <!-- Notification items -->
            <div class="notification-item unread">
                <div class="notification-icon warning">
                    <i class="fas fa-exclamation-circle"></i>
                </div>
                <div class="notification-content">
                    <p class="notification-text">Your issue #BUP012 has been assigned to a technician.</p>
                    <span class="notification-time">2 hours ago</span>
                    <div class="notification-actions">
                        <button class="notification-action-btn primary" onclick="viewIssueDetails('BUP012')">View Issue</button>
                        <button class="notification-action-btn" onclick="dismissNotification(this)">Dismiss</button>
                    </div>
                </div>
                <button class="notification-mark-read" onclick="markNotificationAsRead(this)">
                    <i class="fas fa-circle"></i>
                </button>
            </div>
            <div class="notification-item unread">
                <div class="notification-icon success">
                    <i class="fas fa-check-circle"></i>
                </div>
                <div class="notification-content">
                    <p class="notification-text">Issue #BUP008 has been resolved. Please provide feedback.</p>
                    <span class="notification-time">Yesterday</span>
                    <div class="notification-actions">
                        <button class="notification-action-btn primary" onclick="provideFeedback('BUP008')">Provide Feedback</button>
                        <button class="notification-action-btn" onclick="dismissNotification(this)">Dismiss</button>
                    </div>
                </div>
                <button class="notification-mark-read" onclick="markNotificationAsRead(this)">
                    <i class="fas fa-circle"></i>
                </button>
            </div>
            <div class="notification-item">
                <div class="notification-icon info">
                    <i class="fas fa-info-circle"></i>
                </div>
                <div class="notification-content">
                    <p class="notification-text">Maintenance scheduled for Building A on June 15th.</p>
                    <span class="notification-time">3 days ago</span>
                </div>
                <button class="notification-mark-read" onclick="markNotificationAsRead(this)">
                    <i class="fas fa-check-circle"></i>
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(panel);
}

function closeAllNotificationsPanel() {
    const panel = document.getElementById('allNotificationsPanel');
    if (panel) {
        panel.classList.remove('show');
    }
}

function filterNotifications(filter) {
    const filterButtons = document.querySelectorAll('.notification-filter-btn');
    filterButtons.forEach(btn => btn.classList.remove('active'));
    
    const clickedButton = document.querySelector(`.notification-filter-btn[onclick="filterNotifications('${filter}')"]`);
    if (clickedButton) {
        clickedButton.classList.add('active');
    }
    
    const allNotifications = document.querySelectorAll('.all-notifications-list .notification-item');
    
    allNotifications.forEach(notification => {
        if (filter === 'all') {
            notification.style.display = 'flex';
        } else if (filter === 'unread' && notification.classList.contains('unread')) {
            notification.style.display = 'flex';
        } else if (filter === 'read' && !notification.classList.contains('unread')) {
            notification.style.display = 'flex';
        } else {
            notification.style.display = 'none';
        }
    });
}

function dismissNotification(button) {
    const notificationItem = button.closest('.notification-item');
    notificationItem.style.opacity = '0';
    setTimeout(() => {
        notificationItem.remove();
        
        // Check if there are no more notifications
        const notificationsList = document.querySelector('.all-notifications-list');
        if (notificationsList && notificationsList.children.length === 0) {
            notificationsList.innerHTML = '<div class="no-notifications">No notifications to display</div>';
        }
        
        // Update badge count
        updateNotificationBadge();
    }, 300);
}

function markNotificationAsRead(button) {
    const notificationItem = button.closest('.notification-item');
    if (notificationItem.classList.contains('unread')) {
        notificationItem.classList.remove('unread');
        
        // Change the icon
        const icon = button.querySelector('i');
        if (icon) {
            icon.className = 'fas fa-check-circle';
        }
        
        // Update badge count
        updateNotificationBadge();
    }
}

function updateNotificationBadge() {
    const unreadCount = document.querySelectorAll('.notification-item.unread').length;
    const badges = document.querySelectorAll('.notification-badge');
    
    badges.forEach(badge => {
        if (unreadCount === 0) {
            badge.style.display = 'none';
        } else {
            badge.style.display = '';
            badge.textContent = unreadCount;
        }
    });
}

// Add these functions to window object to make them accessible from HTML
window.closeAllNotificationsPanel = closeAllNotificationsPanel;
window.filterNotifications = filterNotifications;
window.dismissNotification = dismissNotification;
window.markNotificationAsRead = markNotificationAsRead;

function initializeDarkMode() {
    const savedTheme = localStorage.getItem('bup-theme-preference');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (savedTheme === 'dark' || (!savedTheme && systemPrefersDark)) {
        enableDarkMode(false); // Pass false to prevent notification on page load
    } else if (savedTheme === 'light') {
        disableDarkMode(false); // Pass false to prevent notification on page load
    } else {
        // System preference
        if (systemPrefersDark) {
            enableDarkMode(false);
        } else {
            disableDarkMode(false);
        }
    }
    
    // Listen for system preference changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        if (localStorage.getItem('bup-theme-preference') === 'system') {
            if (e.matches) {
                enableDarkMode(true);
            } else {
                disableDarkMode(true);
            }
        }
    });
}

// Make sure toggleDarkMode correctly handles the theme change
function toggleDarkMode() {
    if (isDarkMode) {
        disableDarkMode(true);
    } else {
        enableDarkMode(true);
    }
}

function enableDarkMode(showNotifications = true) {
    document.body.classList.add('dark-mode');
    isDarkMode = true;
    localStorage.setItem('bup-theme-preference', 'dark');
    updateDarkModeToggle();
    if (showNotifications) {
        showNotification('Dark mode enabled', 'success');
    }
}

function disableDarkMode(showNotifications = true) {
    document.body.classList.remove('dark-mode');
    isDarkMode = false;
    localStorage.setItem('bup-theme-preference', 'light');
    updateDarkModeToggle();
    if (showNotifications) {
        showNotification('Light mode enabled', 'success');
    }
}

function updateDarkModeToggle() {
    const toggle = document.getElementById('darkModeToggle');
    const icon = toggle.querySelector('i');
    
    if (isDarkMode) {
        icon.className = 'fas fa-sun';
        toggle.title = 'Switch to Light Mode';
        toggle.setAttribute('aria-label', 'Switch to Light Mode');
    } else {
        icon.className = 'fas fa-moon';
        toggle.title = 'Switch to Dark Mode';
        toggle.setAttribute('aria-label', 'Switch to Dark Mode');
    }
}

function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const role = document.getElementById('userRole').value;

    if (!email.endsWith('bup.edu.bd')) {
        showNotification('Please use a valid @bup.edu.bd email address', 'error');
        return;
    }

    currentUser = {
        email: email,
        role: role,
        name: getNameFromEmail(email)
    };

    showNotification(`Welcome back, ${currentUser.name}!`, 'success');
    closeLoginModal();
    updateUIForLoggedInUser();
}

function handleRegistration(e) {
    e.preventDefault();
    
    const fullName = document.getElementById('fullName').value;
    const email = document.getElementById('regEmail').value;
    const password = document.getElementById('regPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const role = document.getElementById('regRole').value;

    if (!email.endsWith('bup.edu.bd')) {
        showNotification('Please use a valid @bup.edu.bd email address', 'error');
        return;
    }

    if (password !== confirmPassword) {
        showNotification('Passwords do not match', 'error');
        return;
    }

    showNotification('Registration successful! Please login with your credentials.', 'success');
    closeRegisterModal();
    showLoginModal();
}

function updateUIForLoggedInUser() {
    const loginBtn = document.querySelector('.login-btn');
    loginBtn.innerHTML = `<i class="fas fa-user-circle"></i> ${currentUser.name}`;
    loginBtn.onclick = showUserMenu;

    if (currentUser.role === 'admin') {
        document.getElementById('adminTab').style.display = 'block';
    }
    if (currentUser.role === 'authority') {
        document.getElementById('authorityTab').style.display = 'block';
    }
    if (currentUser.role === 'technician' || currentUser.role === 'staff') {
        document.getElementById('technicianTab').style.display = 'block';
    }
}

function handleIssueSubmission(e) {
    e.preventDefault();
    
    if (!currentUser) {
        showNotification('Please login to submit an issue', 'warning');
        showLoginModal();
        return;
    }

    const issueData = {
        id: generateIssueId(),
        category: document.getElementById('category').value,
        priority: document.getElementById('priority').value,
        location: document.getElementById('location').value,
        specificLocation: document.getElementById('specificLocation').value,
        description: document.getElementById('description').value,
        submittedBy: currentUser.name,
        submittedDate: new Date().toISOString().split('T')[0],
        status: 'pending-review',
        images: []
    };

    issues.push(issueData);
    
    showNotification('Issue submitted successfully! You will receive updates via email/SMS.', 'success');
    document.getElementById('issueForm').reset();
    document.getElementById('imagePreview').innerHTML = '';
    
    if (currentSection === 'dashboard') {
        updateDashboard();
    }
    
    // Add this to the end of the function
    updateHomeIssuesList();
}

function handleImageUpload(e) {
    const files = e.target.files;
    const preview = document.getElementById('imagePreview');
    preview.innerHTML = '';

    Array.from(files).forEach(file => {
        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = function(e) {
                const img = document.createElement('img');
                img.src = e.target.result;
                img.style.width = '80px';
                img.style.height = '80px';
                img.style.objectFit = 'cover';
                img.style.borderRadius = '8px';
                img.style.border = '2px solid #e2e8f0';
                preview.appendChild(img);
            };
            reader.readAsDataURL(file);
        }
    });
}

function showSection(sectionName) {
    document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active');
    });
    
    document.getElementById(sectionName).classList.add('active');
    
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });
    
    document.querySelector(`[href="#${sectionName}"]`).classList.add('active');
    
    currentSection = sectionName;
    
    if (sectionName === 'dashboard') {
        updateDashboard();
    } else if (sectionName === 'reports') {
        updateReports();
    }
}

function updateReports() {
    // Initialize analytics and charts if analyticsManager exists
    if (typeof analyticsManager !== 'undefined') {
        analyticsManager.generateTrendsChart();
        if (!document.getElementById('categoryChart')) {
            analyticsManager.generateCategoryChart();
        }
    }
}

function showTab(tabName) {
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    
    document.getElementById(tabName).classList.add('active');
    
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    event.target.classList.add('active');
}

function showLoginModal() {
    closeRegisterModal();
    document.getElementById('loginModal').style.display = 'block';
}

function closeLoginModal() {
    document.getElementById('loginModal').style.display = 'none';
}

function showRegisterModal() {
    closeLoginModal();
    document.getElementById('registerModal').style.display = 'block';
}

function closeRegisterModal() {
    document.getElementById('registerModal').style.display = 'none';
}

function showScheduleModal() {
    document.getElementById('scheduleModal').style.display = 'block';
}

function closeScheduleModal() {
    document.getElementById('scheduleModal').style.display = 'none';
}

function handleBuildingClick(e) {
    e.preventDefault();  // Prevent default action
    const building = e.currentTarget;
    const buildingName = building.querySelector('.building-label').textContent;
    const issueCount = building.querySelector('.issue-count')?.textContent || '0';
    
    console.log(`Building clicked: ${buildingName} with ${issueCount} issues`);  // Debug
    
    showBuildingDetails(buildingName, issueCount);
}

function loadMockData() {
    // Create mock issues for campus buildings with corrected location IDs
    issues = [
        {
            id: 'BUP20240521001',
            category: 'electricity',
            priority: 'urgent',
            location: 'academic', // Matches data-building="academic"
            specificLocation: 'Room 205',
            description: 'Projector not working in classroom 205. Screen remains black even after restart.',
            submittedBy: 'Tahsin Ahmed',
            submittedDate: '2024-05-15',
            status: 'pending-review'
        },
        {
            id: 'BUP20240520002',
            category: 'furniture',
            priority: 'medium',
            location: 'academic',
            specificLocation: 'Room 301',
            description: 'Five chairs have broken backrests and need replacement.',
            submittedBy: 'Nusrat Jahan',
            submittedDate: '2024-05-14',
            status: 'in-progress'
        },
        {
            id: 'BUP20240519003',
            category: 'sanitary',
            priority: 'high',
            location: 'academic',
            specificLocation: '2nd Floor Washroom',
            description: 'Water leakage from sink pipe causing floor flooding.',
            submittedBy: 'Kamrul Hasan',
            submittedDate: '2024-05-13',
            status: 'assigned'
        },
        {
            id: 'BUP20240518004',
            category: 'electricity',
            priority: 'urgent',
            location: 'fbs',
            specificLocation: 'Computer Lab 2',
            description: 'Electrical short circuit in the main power line of Computer Lab 2.',
            submittedBy: 'Dr. Aminul Islam',
            submittedDate: '2024-05-12',
            status: 'in-progress'
        },
        {
            id: 'BUP20240517005',
            category: 'furniture',
            priority: 'low',
            location: 'fbs',
            specificLocation: 'Meeting Room',
            description: 'Conference table has scratches and needs polishing.',
            submittedBy: 'Fatema Begum',
            submittedDate: '2024-05-11',
            status: 'pending-review'
        },
        {
            id: 'BUP20240516006',
            category: 'cafeteria',
            priority: 'high',
            location: 'amitte',
            specificLocation: 'Kitchen Area',
            description: 'One refrigerator not cooling properly, food items getting spoiled.',
            submittedBy: 'Rezaul Karim',
            submittedDate: '2024-05-10',
            status: 'assigned'
        },
        {
            id: 'BUP20240515007',
            category: 'cafeteria',
            priority: 'urgent',
            location: 'vista',
            specificLocation: 'Dining Area',
            description: 'Ventilation system not working, excessive heat in dining area.',
            submittedBy: 'Sadia Afrin',
            submittedDate: '2024-05-09',
            status: 'in-progress'
        },
        {
            id: 'BUP20240514008',
            category: 'sanitary',
            priority: 'medium',
            location: 'admin',
            specificLocation: '1st Floor Washroom',
            description: 'Flushing system broken in two toilet stalls.',
            submittedBy: 'Masud Khan',
            submittedDate: '2024-05-08',
            status: 'resolved'
        },
        {
            id: 'BUP20240513009',
            category: 'transportation',
            priority: 'low',
            location: 'admin',
            specificLocation: 'Parking Area',
            description: 'Parking line markings faded and need repainting.',
            submittedBy: 'Dr. Mahfuzur Rahman',
            submittedDate: '2024-05-07',
            status: 'pending-review'
        },
        {
            id: 'BUP20240512010',
            category: 'lab',
            priority: 'high',
            location: 'academic',
            specificLocation: 'Physics Lab',
            description: 'Gas leakage detected in the physics lab equipment.',
            submittedBy: 'Dr. Tahmina Akter',
            submittedDate: '2024-05-06',
            status: 'urgent'
        },
        {
            id: 'BUP20240511011',
            category: 'electricity',
            priority: 'medium',
            location: 'library',
            specificLocation: 'Reading Area',
            description: 'Three ceiling lights flickering and need replacement.',
            submittedBy: 'Sharmin Sultana',
            submittedDate: '2024-05-05',
            status: 'assigned'
        },
        {
            id: 'BUP20240510012',
            category: 'furniture',
            priority: 'low',
            location: 'library',
            specificLocation: 'Study Carrels',
            description: 'Wooden partitions between study spaces are loose.',
            submittedBy: 'Abdullah Al Mamun',
            submittedDate: '2024-05-04',
            status: 'pending-review'
        },
        {
            id: 'BUP20240509013',
            category: 'sanitary',
            priority: 'urgent',
            location: 'third-place',
            specificLocation: 'Kitchen',
            description: 'Drain blockage causing water backup in kitchen sink.',
            submittedBy: 'Mohammed Karim',
            submittedDate: '2024-05-03',
            status: 'in-progress'
        },
        {
            id: 'BUP20240508014',
            category: 'transportation',
            priority: 'high',
            location: 'annex',
            specificLocation: 'Entrance Ramp',
            description: 'Wheelchair ramp has cracks and needs repair for safety.',
            submittedBy: 'Rabeya Khatun',
            submittedDate: '2024-05-02',
            status: 'assigned'
        },
        {
            id: 'BUP20240507015',
            category: 'furniture',
            priority: 'medium',
            location: 'daycare',
            specificLocation: 'Playroom',
            description: 'Several toys and child-sized chairs damaged.',
            submittedBy: 'Nasrin Akter',
            submittedDate: '2024-05-01',
            status: 'resolved'
        },
        {
            id: 'BUP20240506016',
            category: 'electricity',
            priority: 'urgent',
            location: 'staff-canteen',
            specificLocation: 'Kitchen',
            description: 'Electrical short circuit in microwave, causing power outage.',
            submittedBy: 'Abdul Alim',
            submittedDate: '2024-04-30',
            status: 'resolved'
        }
    ];
    
    // Update the campus map with these issues - this is critical
    updateCampusMap(issues);
}

function filterMapIssues() {
    const filter = document.getElementById('mapFilter').value;
    console.log("Filter applied:", filter);  // Debug
    
    // Filter issues based on the selected criteria
    let filteredIssues = [];
    
    if (filter === 'all') {
        filteredIssues = issues;
    } else if (filter === 'urgent') {
        filteredIssues = issues.filter(issue => issue.priority === 'urgent');
    } else if (filter === 'high') {
        filteredIssues = issues.filter(issue => issue.priority === 'high');
    } else if (filter === 'pending') {
        filteredIssues = issues.filter(issue => 
            issue.status === 'pending-review' || issue.status === 'assigned'
        );
    } else if (filter === 'resolved') {
        filteredIssues = issues.filter(issue => issue.status === 'resolved');
    }
    
    console.log("Filtered issues:", filteredIssues.length);  // Debug
    
    // Update the campus map with filtered issues
    updateCampusMap(filteredIssues);
    
    // Show notification about the filter
    showNotification(`Showing ${filter} issues on the campus map`, 'info');
}

function updateCampusMap(filteredIssues) {
    // Group issues by location - make sure locations match building data-attributes
    const issuesByLocation = {};
    
    filteredIssues.forEach(issue => {
        const location = issue.location;
        if (!issuesByLocation[location]) {
            issuesByLocation[location] = [];
        }
        issuesByLocation[location].push(issue);
    });
    
    console.log("Issues by location:", issuesByLocation);  // Debug
    
    // Update each building on the map
    document.querySelectorAll('.building').forEach(building => {
        const buildingId = building.dataset.building;
        console.log("Processing building:", buildingId);  // Debug
        
        const issueCountElement = building.querySelector('.issue-count');
        if (!issueCountElement) {
            console.log("No issue count element for:", buildingId);  // Debug
            return;
        }
        
        // If we have issues for this building
        if (issuesByLocation[buildingId] && issuesByLocation[buildingId].length > 0) {
            const buildingIssues = issuesByLocation[buildingId];
            const issueCount = buildingIssues.length;
            
            console.log(`${buildingId} has ${issueCount} issues`);  // Debug
            
            // Find highest priority
            let highestPriority = 'low';
            const priorityRank = { 'urgent': 4, 'high': 3, 'medium': 2, 'low': 1 };
            
            buildingIssues.forEach(issue => {
                if (priorityRank[issue.priority] > priorityRank[highestPriority]) {
                    highestPriority = issue.priority;
                }
            });
            
            // Update count and class
            issueCountElement.textContent = issueCount;
            
            // Remove existing priority classes
            ['low', 'medium', 'high', 'urgent'].forEach(priority => {
                issueCountElement.classList.remove(priority);
            });
            
            // Add appropriate priority class
            issueCountElement.classList.add(highestPriority);
            
            // Make building visible
            building.style.display = 'flex';
        } else {
            // No issues for this building with current filter
            if (document.getElementById('mapFilter').value !== 'all') {
                // Hide building if we're filtering and it has no matching issues
                building.style.display = 'none';
            } else {
                // Show building with zero count if we're showing all
                issueCountElement.textContent = '0';
                
                // Remove priority classes and add low
                ['low', 'medium', 'high', 'urgent'].forEach(priority => {
                    issueCountElement.classList.remove(priority);
                });
                issueCountElement.classList.add('low');
                building.style.display = 'flex';
            }
        }
    });
}

function showBuildingDetails(buildingName, issueCount) {
    // Find building ID from name - important for mapping to issues
    const buildingElement = Array.from(document.querySelectorAll('.building'))
        .find(b => b.querySelector('.building-label').textContent === buildingName);
    
    if (!buildingElement) {
        console.log("Building element not found");  // Debug
        return;
    }
    
    const buildingId = buildingElement.dataset.building;
    console.log("Building ID:", buildingId);  // Debug
    
    // Get issues for this building
    const buildingIssues = issues.filter(issue => issue.location === buildingId);
    console.log("Found issues:", buildingIssues.length);  // Debug
    
    // Create modal for displaying building details
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.id = 'buildingDetailsModal';
    
    // Count issues by priority
    const priorityCounts = {
        urgent: buildingIssues.filter(i => i.priority === 'urgent').length,
        high: buildingIssues.filter(i => i.priority === 'high').length,
        medium: buildingIssues.filter(i => i.priority === 'medium').length,
        low: buildingIssues.filter(i => i.priority === 'low').length
    };
    
    // Create issue breakdown
    let issueBreakdown = '';
    if (priorityCounts.urgent > 0) {
        issueBreakdown += `<div class="priority-count urgent">${priorityCounts.urgent} Urgent</div>`;
    }
    if (priorityCounts.high > 0) {
        issueBreakdown += `<div class="priority-count high">${priorityCounts.high} High</div>`;
    }
    if (priorityCounts.medium > 0) {
        issueBreakdown += `<div class="priority-count medium">${priorityCounts.medium} Medium</div>`;
    }
    if (priorityCounts.low > 0) {
        issueBreakdown += `<div class="priority-count low">${priorityCounts.low} Low</div>`;
    }
    
    // Generate issue cards for this building
    let issueCards = '';
    buildingIssues.forEach(issue => {
        issueCards += `
            <div class="mini-issue-card">
                <div class="mini-issue-header">
                    <span class="issue-id">${issue.id}</span>
                    <span class="issue-priority ${issue.priority}">${issue.priority}</span>
                    <span class="issue-status ${issue.status}">${issue.status.replace('-', ' ')}</span>
                </div>
                <h5>${issue.category.charAt(0).toUpperCase() + issue.category.slice(1)} Issue - ${issue.specificLocation}</h5>
                <p>${issue.description}</p>
                <div class="mini-issue-footer">
                    <span><i class="fas fa-user"></i> ${issue.submittedBy}</span>
                    <span><i class="fas fa-calendar"></i> ${issue.submittedDate}</span>
                </div>
            </div>
        `;
    });
    
    if (buildingIssues.length === 0) {
        issueCards = '<p class="no-issues">No issues reported for this building.</p>';
    }
    
    modal.innerHTML = `
        <div class="modal-content building-details-modal">
            <span class="close" onclick="closeBuildingDetailsModal()">&times;</span>
            <div class="building-details-header">
                <h2>${buildingName}</h2>
                <div class="building-stats">
                    <div class="stat-badge">
                        <i class="fas fa-exclamation-circle"></i>
                        <span>${buildingIssues.length} Issues</span>
                    </div>
                </div>
            </div>
            
            <div class="priority-breakdown">
                ${issueBreakdown || '<p>No active issues</p>'}
            </div>
            
            <div class="building-issues-list">
                ${issueCards}
            </div>
            
            <div class="building-details-actions">
                <button class="btn-primary" onclick="reportIssueForBuilding('${buildingId}')">
                    <i class="fas fa-plus-circle"></i> Report New Issue
                </button>
                <button class="btn-secondary" onclick="closeBuildingDetailsModal()">
                    Close
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    modal.style.display = 'block';
}

function closeBuildingDetailsModal() {
    const modal = document.getElementById('buildingDetailsModal');
    if (modal) {
        modal.remove();
    }
}

function reportIssueForBuilding(buildingId) {
    closeBuildingDetailsModal();
    
    // Scroll to the report form
    document.getElementById('home').classList.add('active');
    document.getElementById('map').classList.remove('active');
    
    // Update nav links
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });
    document.querySelector('[href="#home"]').classList.add('active');
    
    // Set the location dropdown
    document.getElementById('location').value = buildingId;
    
    // Scroll to the form
    document.querySelector('.quick-report').scrollIntoView({ behavior: 'smooth' });
    
    // Update current section
    currentSection = 'home';
}

function updateNavigation() {
    // Update navigation based on user state
}

function toggleMobileMenu() {
    const navLinks = document.querySelector('.nav-links');
    navLinks.classList.toggle('mobile-active');
}

function showUserMenu() {
    // Remove any existing dropdown
    const existingDropdown = document.querySelector('.user-dropdown');
    if (existingDropdown) {
        existingDropdown.remove();
        return;
    }

    // Create dropdown menu
    const dropdown = document.createElement('div');
    dropdown.className = 'user-dropdown';
    dropdown.innerHTML = `
        <div class="user-dropdown-header">
            <div class="user-avatar">
                <i class="fas fa-user-circle"></i>
            </div>
            <div class="user-info">
                <span class="user-name">${currentUser.name}</span>
                <span class="user-role">${currentUser.role}</span>
                <span class="user-email">${currentUser.email}</span>
            </div>
        </div>
        <div class="user-dropdown-divider"></div>
        <div class="user-dropdown-menu">
            <a href="#" onclick="showProfile(); closeUserMenu();">
                <i class="fas fa-user"></i>
                <span>My Profile</span>
            </a>
            <a href="#" onclick="showSettings(); closeUserMenu();">
                <i class="fas fa-cog"></i>
                <span>Settings</span>
            </a>
            <a href="#" onclick="showNotifications(); closeUserMenu();">
                <i class="fas fa-bell"></i>
                <span>Notifications</span>
                <span class="notification-badge">3</span>
            </a>
            <a href="#" onclick="showMyIssues(); closeUserMenu();">
                <i class="fas fa-list"></i>
                <span>My Issues</span>
            </a>
            <div class="user-dropdown-divider"></div>
            <a href="#" onclick="showHelp(); closeUserMenu();">
                <i class="fas fa-question-circle"></i>
                <span>Help & Support</span>
            </a>
            <a href="#" onclick="logout(); closeUserMenu();" class="logout-link">
                <i class="fas fa-sign-out-alt"></i>
                <span>Logout</span>
            </a>
        </div>
    `;

    // Position dropdown relative to user menu button
    const userMenu = document.querySelector('.user-menu');
    userMenu.style.position = 'relative';
    userMenu.appendChild(dropdown);

    // Close dropdown when clicking outside
    setTimeout(() => {
        document.addEventListener('click', handleOutsideClick);
    }, 10);
}

function closeUserMenu() {
    const dropdown = document.querySelector('.user-dropdown');
    if (dropdown) {
        dropdown.remove();
        document.removeEventListener('click', handleOutsideClick);
    }
}

function handleOutsideClick(event) {
    const dropdown = document.querySelector('.user-dropdown');
    const userMenu = document.querySelector('.user-menu');
    
    if (dropdown && !userMenu.contains(event.target)) {
        closeUserMenu();
    }
}

function showProfile() {
    if (!currentUser) return;
    
    const profileModal = createProfileModal();
    document.body.appendChild(profileModal);
    profileModal.style.display = 'block';
}

function createProfileModal() {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.id = 'profileModal';
    modal.innerHTML = `
        <div class="modal-content profile-modal">
            <span class="close" onclick="closeProfileModal()">&times;</span>
            <h2>User Profile</h2>
            <div class="profile-content">
                <div class="profile-avatar">
                    <i class="fas fa-user-circle"></i>
                    <button class="btn-secondary change-avatar-btn">Change Avatar</button>
                </div>
                <div class="profile-info">
                    <div class="form-group">
                        <label>Full Name</label>
                        <input type="text" id="profileName" value="${currentUser.name}" readonly>
                        <button class="edit-btn" onclick="toggleEdit('profileName')">
                            <i class="fas fa-edit"></i>
                        </button>
                    </div>
                    <div class="form-group">
                        <label>Email</label>
                        <input type="email" id="profileEmail" value="${currentUser.email}" readonly>
                    </div>
                    <div class="form-group">
                        <label>Role</label>
                        <input type="text" id="profileRole" value="${currentUser.role}" readonly>
                    </div>
                    <div class="form-group">
                        <label>Department</label>
                        <input type="text" id="profileDepartment" value="${currentUser.department || 'Not specified'}" readonly>
                        <button class="edit-btn" onclick="toggleEdit('profileDepartment')">
                            <i class="fas fa-edit"></i>
                        </button>
                    </div>
                    <div class="form-group">
                        <label>Phone Number</label>
                        <input type="tel" id="profilePhone" value="${currentUser.phone || ''}" placeholder="Add phone number" readonly>
                        <button class="edit-btn" onclick="toggleEdit('profilePhone')">
                            <i class="fas fa-edit"></i>
                        </button>
                    </div>
                </div>
            </div>
            <div class="profile-actions">
                <button class="btn-primary" onclick="saveProfile()">Save Changes</button>
                <button class="btn-secondary" onclick="closeProfileModal()">Cancel</button>
            </div>
        </div>
    `;
    return modal;
}

function closeProfileModal() {
    const modal = document.getElementById('profileModal');
    if (modal) {
        modal.remove();
    }
}

function toggleEdit(fieldId) {
    const field = document.getElementById(fieldId);
    const isReadonly = field.hasAttribute('readonly');
    
    if (isReadonly) {
        field.removeAttribute('readonly');
        field.focus();
        field.style.borderColor = 'var(--primary-color)';
    } else {
        field.setAttribute('readonly', true);
        field.style.borderColor = 'var(--gray-200)';
    }
}

function saveProfile() {
    const updatedData = {
        name: document.getElementById('profileName').value,
        department: document.getElementById('profileDepartment').value,
        phone: document.getElementById('profilePhone').value
    };
    
    // Update current user object
    Object.assign(currentUser, updatedData);
    
    // Update localStorage
    localStorage.setItem('bup-current-user', JSON.stringify(currentUser));
    
    // Update UI
    updateUIForLoggedInUser();
    
    showNotification('Profile updated successfully!', 'success');
    closeProfileModal();
}

function showSettings() {
    const settingsModal = createSettingsModal();
    document.body.appendChild(settingsModal);
    settingsModal.style.display = 'block';
}

function createSettingsModal() {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.id = 'settingsModal';
    modal.innerHTML = `
        <div class="modal-content settings-modal">
            <span class="close" onclick="closeSettingsModal()">&times;</span>
            <h2>Settings</h2>
            <div class="settings-content">
                <div class="settings-section">
                    <h3>Theme Preferences</h3>
                    <div class="setting-item">
                        <label>Theme Mode</label>
                        <div class="theme-options">
                            <label class="radio-option">
                                <input type="radio" name="theme" value="light" ${!isDarkMode ? 'checked' : ''}>
                                <span>Light Mode</span>
                            </label>
                            <label class="radio-option">
                                <input type="radio" name="theme" value="dark" ${isDarkMode ? 'checked' : ''}>
                                <span>Dark Mode</span>
                            </label>
                            <label class="radio-option">
                                <input type="radio" name="theme" value="system">
                                <span>System Default</span>
                            </label>
                        </div>
                    </div>
                </div>
                
                <div class="settings-section">
                    <h3>Notification Preferences</h3>
                    <div class="setting-item">
                        <label class="checkbox-setting">
                            <input type="checkbox" checked>
                            <span>Email notifications for issue updates</span>
                        </label>
                    </div>
                    <div class="setting-item">
                        <label class="checkbox-setting">
                            <input type="checkbox" checked>
                            <span>SMS notifications for urgent issues</span>
                        </label>
                    </div>
                    <div class="setting-item">
                        <label class="checkbox-setting">
                            <input type="checkbox">
                            <span>Weekly summary reports</span>
                        </label>
                    </div>
                </div>
                
                <div class="settings-section">
                    <h3>Privacy & Security</h3>
                    <div class="setting-item">
                        <button class="btn-secondary" onclick="changePassword()">Change Password</button>
                    </div>
                    <div class="setting-item">
                        <button class="btn-secondary" onclick="downloadData()">Download My Data</button>
                    </div>
                </div>
            </div>
            <div class="settings-actions">
                <button class="btn-primary" onclick="saveSettings()">Save Settings</button>
                <button class="btn-secondary" onclick="closeSettingsModal()">Cancel</button>
            </div>
        </div>
    `;
    return modal;
}

function closeSettingsModal() {
    const modal = document.getElementById('settingsModal');
    if (modal) {
        modal.remove();
    }
}

function saveSettings() {
    const selectedTheme = document.querySelector('input[name="theme"]:checked').value;
    
    if (selectedTheme === 'dark') {
        enableDarkMode();
    } else if (selectedTheme === 'light') {
        disableDarkMode();
    }
    
    showNotification('Settings saved successfully!', 'success');
    closeSettingsModal();
}

function showNotifications() {
    // Close any open user menu dropdown first
    closeUserMenu();
    
    // Check if all notifications panel already exists
    if (document.getElementById('allNotificationsPanel')) {
        // If the panel exists, toggle its visibility
        const panel = document.getElementById('allNotificationsPanel');
        if (panel.classList.contains('show')) {
            panel.classList.remove('show');
        } else {
            panel.classList.add('show');
        }
    } else {
        // If the panel doesn't exist, create it
        createAllNotificationsPanel();
        // Then show it
        document.getElementById('allNotificationsPanel').classList.add('show');
    }
}

function createAllNotificationsPanel() {
    const panel = document.createElement('div');
    panel.id = 'allNotificationsPanel';
    panel.className = 'all-notifications-panel';
    
    panel.innerHTML = `
        <div class="all-notifications-header">
            <h2>All Notifications</h2>
            <button class="close-all-notifications" onclick="closeAllNotificationsPanel()">
                <i class="fas fa-times"></i>
            </button>
        </div>
        <div class="all-notifications-filters">
            <button class="notification-filter-btn active" onclick="filterNotifications('all')">All</button>
            <button class="notification-filter-btn" onclick="filterNotifications('unread')">Unread</button>
            <button class="notification-filter-btn" onclick="filterNotifications('read')">Read</button>
        </div>
        <div class="all-notifications-list">
            <!-- Notification items -->
            <div class="notification-item unread">
                <div class="notification-icon warning">
                    <i class="fas fa-exclamation-circle"></i>
                </div>
                <div class="notification-content">
                    <p class="notification-text">Your issue #BUP012 has been assigned to a technician.</p>
                    <span class="notification-time">2 hours ago</span>
                    <div class="notification-actions">
                        <button class="notification-action-btn primary" onclick="viewIssueDetails('BUP012')">View Issue</button>
                        <button class="notification-action-btn" onclick="dismissNotification(this)">Dismiss</button>
                    </div>
                </div>
                <button class="notification-mark-read" onclick="markNotificationAsRead(this)">
                    <i class="fas fa-circle"></i>
                </button>
            </div>
            <div class="notification-item unread">
                <div class="notification-icon success">
                    <i class="fas fa-check-circle"></i>
                </div>
                <div class="notification-content">
                    <p class="notification-text">Issue #BUP008 has been resolved. Please provide feedback.</p>
                    <span class="notification-time">Yesterday</span>
                    <div class="notification-actions">
                        <button class="notification-action-btn primary" onclick="provideFeedback('BUP008')">Provide Feedback</button>
                        <button class="notification-action-btn" onclick="dismissNotification(this)">Dismiss</button>
                    </div>
                </div>
                <button class="notification-mark-read" onclick="markNotificationAsRead(this)">
                    <i class="fas fa-circle"></i>
                </button>
            </div>
            <div class="notification-item">
                <div class="notification-icon info">
                    <i class="fas fa-info-circle"></i>
                </div>
                <div class="notification-content">
                    <p class="notification-text">Maintenance scheduled for Building A on June 15th.</p>
                    <span class="notification-time">3 days ago</span>
                </div>
                <button class="notification-mark-read" onclick="markNotificationAsRead(this)">
                    <i class="fas fa-check-circle"></i>
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(panel);
}

function closeAllNotificationsPanel() {
    const panel = document.getElementById('allNotificationsPanel');
    if (panel) {
        panel.classList.remove('show');
    }
}

function filterNotifications(filter) {
    const filterButtons = document.querySelectorAll('.notification-filter-btn');
    filterButtons.forEach(btn => btn.classList.remove('active'));
    
    const clickedButton = document.querySelector(`.notification-filter-btn[onclick="filterNotifications('${filter}')"]`);
    if (clickedButton) {
        clickedButton.classList.add('active');
    }
    
    const allNotifications = document.querySelectorAll('.all-notifications-list .notification-item');
    
    allNotifications.forEach(notification => {
        if (filter === 'all') {
            notification.style.display = 'flex';
        } else if (filter === 'unread' && notification.classList.contains('unread')) {
            notification.style.display = 'flex';
        } else if (filter === 'read' && !notification.classList.contains('unread')) {
            notification.style.display = 'flex';
        } else {
            notification.style.display = 'none';
        }
    });
}

function dismissNotification(button) {
    const notificationItem = button.closest('.notification-item');
    notificationItem.style.opacity = '0';
    setTimeout(() => {
        notificationItem.remove();
        
        // Check if there are no more notifications
        const notificationsList = document.querySelector('.all-notifications-list');
        if (notificationsList && notificationsList.children.length === 0) {
            notificationsList.innerHTML = '<div class="no-notifications">No notifications to display</div>';
        }
        
        // Update badge count
        updateNotificationBadge();
    }, 300);
}

function markNotificationAsRead(button) {
    const notificationItem = button.closest('.notification-item');
    if (notificationItem.classList.contains('unread')) {
        notificationItem.classList.remove('unread');
        
        // Change the icon
        const icon = button.querySelector('i');
        if (icon) {
            icon.className = 'fas fa-check-circle';
        }
        
        // Update badge count
        updateNotificationBadge();
    }
}

function updateNotificationBadge() {
    const unreadCount = document.querySelectorAll('.notification-item.unread').length;
    const badges = document.querySelectorAll('.notification-badge');
    
    badges.forEach(badge => {
        if (unreadCount === 0) {
            badge.style.display = 'none';
        } else {
            badge.style.display = '';
            badge.textContent = unreadCount;
        }
    });
}

// Add these functions to window object to make them accessible from HTML
window.closeAllNotificationsPanel = closeAllNotificationsPanel;
window.filterNotifications = filterNotifications;
window.dismissNotification = dismissNotification;
window.markNotificationAsRead = markNotificationAsRead;

// Technician Dashboard Functions
function showScheduleView() {
    showNotification('Loading technician schedule view...', 'info');
    // This would typically load a calendar view of all scheduled tasks
}

function markAvailability() {
    const availabilityModal = createAvailabilityModal();
    document.body.appendChild(availabilityModal);
    availabilityModal.style.display = 'block';
}

function createAvailabilityModal() {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.id = 'availabilityModal';
    modal.innerHTML = `
        <div class="modal-content">
            <span class="close" onclick="closeAvailabilityModal()">&times;</span>
            <h2>Update Availability</h2>
            <form id="availabilityForm">
                <div class="form-group">
                    <label>Status:</label>
                    <select id="availabilityStatus" required>
                        <option value="available">Available</option>
                        <option value="busy">Busy (On Task)</option>
                        <option value="unavailable">Unavailable</option>
                        <option value="leave">On Leave</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Available From:</label>
                    <input type="date" id="availableFrom" required>
                </div>
                <div class="form-group">
                    <label>Available To:</label>
                    <input type="date" id="availableTo" required>
                </div>
                <div class="form-group">
                    <label>Working Hours:</label>
                    <div class="time-range">
                        <input type="time" id="workStart" value="08:00" required>
                        <span>to</span>
                        <input type="time" id="workEnd" value="17:00" required>
                    </div>
                </div>
                <div class="form-group">
                    <label>Notes:</label>
                    <textarea id="availabilityNotes" rows="3" placeholder="Additional notes about your availability..."></textarea>
                </div>
                <button type="button" class="btn-primary" onclick="saveAvailability()">Update Availability</button>
            </form>
        </div>
    `;
    return modal;
}

function closeAvailabilityModal() {
    const modal = document.getElementById('availabilityModal');
    if (modal) {
        modal.remove();
    }
}

function saveAvailability() {
    const status = document.getElementById('availabilityStatus').value;
    showNotification(`Availability updated to: ${status}`, 'success');
    closeAvailabilityModal();
}

function updateTaskStatus(taskId, status) {
    showNotification(`Task ${taskId} status updated to: ${status}`, 'success');
    // Would typically update the task in the database
}

function updateTaskProgress(taskId) {
    const progressModal = createProgressModal(taskId);
    document.body.appendChild(progressModal);
    progressModal.style.display = 'block';
}

function createProgressModal(taskId) {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.id = 'progressModal';
    modal.innerHTML = `
        <div class="modal-content">
            <span class="close" onclick="closeProgressModal()">&times;</span>
            <h2>Update Task Progress</h2>
            <form id="progressForm">
                <div class="form-group">
                    <label>Task ID: ${taskId}</label>
                </div>
                <div class="form-group">
                    <label>Progress Percentage:</label>
                    <input type="range" id="progressPercentage" min="0" max="100" value="60" oninput="this.nextElementSibling.value = this.value + '%'">
                    <output>60%</output>
                </div>
                <div class="form-group">
                    <label>Time Spent (hours):</label>
                    <input type="number" id="timeSpent" min="0" step="0.5" value="1.5">
                </div>
                <div class="form-group">
                    <label>Progress Notes:</label>
                    <textarea id="progressNotes" rows="3" placeholder="Describe the work done and current status..."></textarea>
                </div>
                <div class="form-group">
                    <label>Upload Progress Photos:</label>
                    <div class="file-upload">
                        <input type="file" id="progressPhotos" accept="image/*" multiple>
                        <label for="progressPhotos" class="file-upload-label">
                            <i class="fas fa-camera"></i>
                            Choose Images
                        </label>
                    </div>
                    <div id="photoPreview" class="image-preview"></div>
                </div>
                <button type="button" class="btn-primary" onclick="saveProgress('${taskId}')">Save Progress</button>
            </form>
        </div>
    `;
    return modal;
}

function closeProgressModal() {
    const modal = document.getElementById('progressModal');
    if (modal) {
        modal.remove();
    }
}

function saveProgress(taskId) {
    const progress = document.getElementById('progressPercentage').value;
    showNotification(`Progress for task ${taskId} updated to ${progress}%`, 'success');
    closeProgressModal();
}

function requestParts(taskId) {
    const partsModal = createPartsRequestModal(taskId);
    document.body.appendChild(partsModal);
    partsModal.style.display = 'block';
}

function createPartsRequestModal(taskId) {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.id = 'partsRequestModal';
    modal.innerHTML = `
        <div class="modal-content">
            <span class="close" onclick="closePartsRequestModal()">&times;</span>
            <h2>Request Parts or Materials</h2>
            <form id="partsRequestForm">
                <div class="form-group">
                    <label>Task ID: ${taskId}</label>
                </div>
                <div class="form-group">
                    <label>Parts/Materials Needed:</label>
                    <textarea id="partsNeeded" rows="3" required placeholder="List all parts and materials needed..."></textarea>
                </div>
                <div class="form-group">
                    <label>Quantity:</label>
                    <input type="number" id="partsQuantity" min="1" value="1">
                </div>
                <div class="form-group">
                    <label>Urgency:</label>
                    <select id="partsUrgency" required>
                        <option value="low">Low - Within a week</option>
                        <option value="medium">Medium - Within 2-3 days</option>
                        <option value="high" selected>High - Within 24 hours</option>
                        <option value="urgent">Urgent - Immediately</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Reason for Request:</label>
                    <textarea id="partsReason" rows="3" placeholder="Explain why these parts are needed..."></textarea>
                </div>
                <button type="button" class="btn-primary" onclick="submitPartsRequest('${taskId}')">Submit Request</button>
            </form>
        </div>
    `;
    return modal;
}

function closePartsRequestModal() {
    const modal = document.getElementById('partsRequestModal');
    if (modal) {
        modal.remove();
    }
}

function submitPartsRequest(taskId) {
    const parts = document.getElementById('partsNeeded').value;
    const urgency = document.getElementById('partsUrgency').value;
    showNotification(`Parts request for task ${taskId} submitted with ${urgency} urgency`, 'success');
    closePartsRequestModal();
}

function completeTask(taskId) {
    const completionModal = createCompletionModal(taskId);
    document.body.appendChild(completionModal);
    completionModal.style.display = 'block';
}

function createCompletionModal(taskId) {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.id = 'completionModal';
    modal.innerHTML = `
        <div class="modal-content">
            <span class="close" onclick="closeCompletionModal()">&times;</span>
            <h2>Mark Task as Complete</h2>
            <form id="completionForm">
                <div class="form-group">
                    <label>Task ID: ${taskId}</label>
                </div>
                <div class="form-group">
                    <label>Completion Summary:</label>
                    <textarea id="completionSummary" rows="3" required placeholder="Summarize the work performed..."></textarea>
                </div>
                <div class="form-group">
                    <label>Total Time Spent (hours):</label>
                    <input type="number" id="totalTime" min="0" step="0.5" value="2.5">
                </div>
                <div class="form-group">
                    <label>Upload Completion Photos:</label>
                    <div class="file-upload">
                        <input type="file" id="completionPhotos" accept="image/*" multiple>
                        <label for="completionPhotos" class="file-upload-label">
                            <i class="fas fa-camera"></i>
                            Choose Images
                        </label>
                    </div>
                    <div id="completionPhotoPreview" class="image-preview"></div>
                </div>
                <div class="form-group checkbox-group">
                    <input type="checkbox" id="followupNeeded">
                    <label for="followupNeeded">Follow-up visit needed</label>
                </div>
                <div class="form-group" id="followupSection" style="display: none;">
                    <label>Follow-up Reason:</label>
                    <textarea id="followupReason" rows="2" placeholder="Explain why a follow-up is needed..."></textarea>
                </div>
                <button type="button" class="btn-success" onclick="finalizeCompletion('${taskId}')">Mark as Complete</button>
            </form>
        </div>
    `;
    return modal;
}

function closeCompletionModal() {
    const modal = document.getElementById('completionModal');
    if (modal) {
        modal.remove();
    }
}

function finalizeCompletion(taskId) {
    showNotification(`Task ${taskId} marked as complete`, 'success');
    closeCompletionModal();
}

function startTask(taskId) {
    updateTaskStatus(taskId, 'in-progress');
    showNotification(`Task ${taskId} started`, 'success');
}

function viewTaskDetails(taskId) {
    showNotification(`Viewing details for task ${taskId}`, 'info');
}

function rescheduleTask(taskId) {
    const rescheduleModal = createRescheduleModal(taskId);
    document.body.appendChild(rescheduleModal);
    rescheduleModal.style.display = 'block';
}

function createRescheduleModal(taskId) {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.id = 'rescheduleModal';
    modal.innerHTML = `
        <div class="modal-content">
            <span class="close" onclick="closeRescheduleModal()">&times;</span>
            <h2>Reschedule Task</h2>
            <form id="rescheduleForm">
                <div class="form-group">
                    <label>Task ID: ${taskId}</label>
                </div>
                <div class="form-group">
                    <label>New Date:</label>
                    <input type="date" id="newDate" required>
                </div>
                <div class="form-group">
                    <label>New Time Range:</label>
                    <div class="time-range">
                        <input type="time" id="newStartTime" value="09:00" required>
                        <span>to</span>
                        <input type="time" id="newEndTime" value="11:00" required>
                    </div>
                </div>
                <div class="form-group">
                    <label>Reason for Rescheduling:</label>
                    <textarea id="rescheduleReason" rows="3" placeholder="Explain why this task needs to be rescheduled..."></textarea>
                </div>
                <button type="button" class="btn-primary" onclick="submitReschedule('${taskId}')">Reschedule Task</button>
            </form>
        </div>
    `;
    return modal;
}

function closeRescheduleModal() {
    const modal = document.getElementById('rescheduleModal');
    if (modal) {
        modal.remove();
    }
}

function submitReschedule(taskId) {
    const newDate = document.getElementById('newDate').value;
    showNotification(`Task ${taskId} rescheduled to ${newDate}`, 'success');
    closeRescheduleModal();
}

// Make sure event listeners are added on page load
document.addEventListener('DOMContentLoaded', function() {
    // Re-add building click listeners to ensure they work
    document.querySelectorAll('.building').forEach(building => {
        // Remove any existing listeners first to avoid duplicates
        building.removeEventListener('click', handleBuildingClick);
        // Add the click listener
        building.addEventListener('click', handleBuildingClick);
    });
    
    // Ensure map filter works
    const mapFilter = document.getElementById('mapFilter');
    if (mapFilter) {
        mapFilter.removeEventListener('change', filterMapIssues);
        mapFilter.addEventListener('change', filterMapIssues);
    }
    
    // Load mock data and update map
    loadMockData();
});

// Add this function to fix logout functionality
function logout() {
    try {
        // Clear user data
        currentUser = null;
        localStorage.removeItem('bup-current-user');
        
        // Show notification if available
        if (typeof showNotification === 'function') {
            showNotification('Logged out successfully', 'success');
        } else {
            console.log('Logged out successfully');
        }
        
        // Close user menu
        if (typeof closeUserMenu === 'function') {
            closeUserMenu();
        }
        
        // Reset UI elements that depend on logged-in state
        resetUIAfterLogout();
        
        // Redirect to login page after a short delay
        setTimeout(() => {
            window.location.href = 'auth.html';
        }, 1000);
    } catch (error) {
        console.error('Error during logout:', error);
        // Fallback redirect if there's an error
        window.location.href = 'auth.html';
    }
}

// Helper function to reset UI elements after logout
function resetUIAfterLogout() {
    // Reset login button
    const loginBtn = document.querySelector('.login-btn');
    if (loginBtn) {
        loginBtn.innerHTML = '<i class="fas fa-user"></i> Login';
        loginBtn.onclick = showLoginModal;
    }
    
    // Hide role-specific tabs
    const roleTabs = ['adminTab', 'authorityTab', 'technicianTab'];
    roleTabs.forEach(tabId => {
        const tab = document.getElementById(tabId);
        if (tab) {
            tab.style.display = 'none';
        }
    });
}

// Make logout function available globally
window.logout = logout;
window.resetUIAfterLogout = resetUIAfterLogout;