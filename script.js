let currentUser = null;
let currentSection = 'home';
let issues = [];
let isDarkMode = false;

document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    setupEventListeners();
    loadMockData();
    initializeDarkMode();
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

    document.getElementById('darkModeToggle').addEventListener('click', toggleDarkMode);

    document.getElementById('mapFilter').addEventListener('change', filterMapIssues);
    document.getElementById('statusFilter').addEventListener('change', filterUserIssues);
    document.getElementById('categoryFilter').addEventListener('change', filterUserIssues);
    document.getElementById('dateFilter').addEventListener('change', filterUserIssues);
}

function initializeDarkMode() {
    const savedTheme = localStorage.getItem('bup-theme');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (savedTheme === 'dark' || (!savedTheme && systemPrefersDark)) {
        enableDarkMode();
    } else {
        disableDarkMode();
    }
    
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        if (!localStorage.getItem('bup-theme')) {
            if (e.matches) {
                enableDarkMode();
            } else {
                disableDarkMode();
            }
        }
    });
}

function toggleDarkMode() {
    if (isDarkMode) {
        disableDarkMode();
    } else {
        enableDarkMode();
    }
}

function enableDarkMode() {
    document.body.classList.add('dark-mode');
    isDarkMode = true;
    localStorage.setItem('bup-theme', 'dark');
    updateDarkModeToggle();
    showNotification('Dark mode enabled', 'success');
}

function disableDarkMode() {
    document.body.classList.remove('dark-mode');
    isDarkMode = false;
    localStorage.setItem('bup-theme', 'light');
    updateDarkModeToggle();
    showNotification('Light mode enabled', 'success');
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
    const building = e.currentTarget;
    const buildingName = building.querySelector('.building-label').textContent;
    const issueCount = building.querySelector('.issue-count')?.textContent || '0';
    
    showBuildingDetails(buildingName, issueCount);
}

function showBuildingDetails(buildingName, issueCount) {
    const details = `
        <div class="building-details">
            <h3>${buildingName}</h3>
            <p>Active Issues: ${issueCount}</p>
            <div class="building-issues">
                <!-- Mock issues for this building -->
                <div class="mini-issue">
                    <span class="priority urgent">Urgent</span>
                    <span>AC not working</span>
                </div>
                <div class="mini-issue">
                    <span class="priority medium">Medium</span>
                    <span>Broken chairs</span>
                </div>
            </div>
        </div>
    `;
    
    showNotification(`${buildingName} - ${issueCount} active issues`, 'info');
}

function filterMapIssues() {
    const filter = document.getElementById('mapFilter').value;
    const buildings = document.querySelectorAll('.building');
    
    buildings.forEach(building => {
        const issueCount = building.querySelector('.issue-count');
        if (filter === 'all' || !issueCount) {
            building.style.display = 'block';
        } else {
            const shouldShow = Math.random() > 0.5;
            building.style.display = shouldShow ? 'block' : 'none';
        }
    });
}

function approveIssue(issueId) {
    showNotification(`Issue ${issueId} approved and forwarded to maintenance team`, 'success');
    updateIssueStatus(issueId, 'approved');
}

function rejectIssue(issueId) {
    const reason = prompt('Please provide rejection reason:');
    if (reason) {
        showNotification(`Issue ${issueId} rejected: ${reason}`, 'warning');
        updateIssueStatus(issueId, 'rejected');
    }
}

function assignTechnician(issueId) {
    showScheduleModal();
}

function addNote(issueId) {
    const note = prompt('Add a note for this issue:');
    if (note) {
        showNotification('Note added successfully', 'success');
    }
}

function updateSchedule(issueId) {
    showScheduleModal();
}

function changeStatus(issueId) {
    const newStatus = prompt('Enter new status (pending, in-progress, resolved):');
    if (newStatus) {
        updateIssueStatus(issueId, newStatus);
        showNotification(`Issue ${issueId} status updated to ${newStatus}`, 'success');
    }
}

function viewHistory(issueId) {
    showNotification('Issue history would be displayed here', 'info');
}

function generateReport() {
    showNotification('Generating comprehensive report...', 'info');
    setTimeout(() => {
        showNotification('Report generated successfully! Check your downloads.', 'success');
    }, 2000);
}

function showOverdueIssues() {
    showNotification('Displaying overdue issues requiring immediate attention', 'warning');
}

function escalateIssue(issueId) {
    showNotification(`Issue ${issueId} escalated to higher management`, 'warning');
}

function assignUrgent(issueId) {
    showNotification(`Issue ${issueId} marked as urgent and assigned`, 'success');
}

function exportReport(format) {
    showNotification(`Exporting report in ${format.toUpperCase()} format...`, 'info');
    setTimeout(() => {
        showNotification(`${format.toUpperCase()} report downloaded successfully!`, 'success');
    }, 1500);
}

function generateCustomReport() {
    const reportType = document.getElementById('reportType').value;
    const startDate = document.getElementById('reportStartDate').value;
    const endDate = document.getElementById('reportEndDate').value;
    
    showNotification(`Generating ${reportType} report from ${startDate} to ${endDate}...`, 'info');
    setTimeout(() => {
        showNotification('Custom report generated successfully!', 'success');
    }, 2000);
}

function viewIssueDetails(issueId) {
    showNotification(`Displaying details for issue ${issueId}`, 'info');
}

function provideFeedback(issueId) {
    const feedback = prompt('Please provide your feedback:');
    if (feedback) {
        showNotification('Thank you for your feedback!', 'success');
    }
}

function handleRating(rating) {
    showNotification(`You rated this resolution ${rating} stars`, 'success');
}

function showAnalytics() {
    showNotification('Loading analytics dashboard...', 'info');
}

function generateIssueId() {
    const date = new Date();
    const year = date.getFullYear().toString().substr(-2);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `BUP${year}${month}${day}${random}`;
}

function getNameFromEmail(email) {
    const name = email.split('@')[0];
    return name.charAt(0).toUpperCase() + name.slice(1).replace(/[._]/g, ' ');
}

function updateIssueStatus(issueId, newStatus) {
    const issue = issues.find(i => i.id === issueId);
    if (issue) {
        issue.status = newStatus;
    }
}

function showNotification(message, type = 'info') {
    const notification = document.getElementById('notification');
    const messageElement = notification.querySelector('.notification-message');
    const iconElement = notification.querySelector('.notification-icon');
    
    messageElement.textContent = message;
    
    const icons = {
        success: 'fas fa-check-circle',
        error: 'fas fa-exclamation-triangle',
        warning: 'fas fa-exclamation-circle',
        info: 'fas fa-info-circle'
    };
    
    iconElement.className = `notification-icon ${icons[type]}`;
    notification.className = `notification ${type}`;
    notification.style.display = 'block';
    
    setTimeout(() => {
        closeNotification();
    }, 3000);
}

function closeNotification() {
    document.getElementById('notification').style.display = 'none';
}

function updateNavigation() {
    // Update navigation based on user state
}

function toggleMobileMenu() {
    const navLinks = document.querySelector('.nav-links');
    navLinks.classList.toggle('mobile-active');
}

function showUserMenu() {
    const menu = `
        <div class="user-dropdown">
            <a href="#" onclick="showProfile()">Profile</a>
            <a href="#" onclick="showSettings()">Settings</a>
            <a href="#" onclick="logout()">Logout</a>
        </div>
    `;
    
    showNotification('User menu clicked', 'info');
}

function logout() {
    currentUser = null;
    document.querySelector('.login-btn').innerHTML = '<i class="fas fa-user"></i> Login';
    document.querySelector('.login-btn').onclick = showLoginModal;
    document.getElementById('adminTab').style.display = 'none';
    document.getElementById('authorityTab').style.display = 'none';
    showNotification('Logged out successfully', 'success');
}

function showProfile() {
    showNotification('Profile page would be displayed here', 'info');
}

function showSettings() {
    showNotification('Settings page would be displayed here', 'info');
}

function filterUserIssues() {
    const status = document.getElementById('statusFilter').value;
    const category = document.getElementById('categoryFilter').value;
    const date = document.getElementById('dateFilter').value;
    
    showNotification('Issues filtered successfully', 'info');
}

function updateDashboard() {
    if (!currentUser) return;
    
    console.log('Dashboard updated for user:', currentUser.name);
}

function updateReports() {
    console.log('Reports updated');
}

function loadMockData() {
    issues = [
        {
            id: 'BUP001',
            category: 'electricity',
            priority: 'urgent',
            location: 'academic-block-1',
            specificLocation: 'Room 205',
            description: 'Projector not working',
            submittedBy: 'John Doe',
            submittedDate: '2024-01-15',
            status: 'pending'
        },
        {
            id: 'BUP002',
            category: 'sanitary',
            priority: 'medium',
            location: 'academic-block-2',
            specificLocation: '2nd Floor Washroom',
            description: 'Washroom needs cleaning',
            submittedBy: 'Jane Smith',
            submittedDate: '2024-01-10',
            status: 'resolved'
        }
    ];
}

function handleScheduleSubmission(e) {
    e.preventDefault();
    
    const scheduleData = {
        team: document.getElementById('maintenanceTeam').value,
        date: document.getElementById('scheduleDate').value,
        startTime: document.getElementById('startTime').value,
        endTime: document.getElementById('endTime').value,
        duration: document.getElementById('duration').value,
        notes: document.getElementById('scheduleNotes').value
    };
    
    showNotification('Maintenance scheduled successfully!', 'success');
    closeScheduleModal();
    document.getElementById('scheduleForm').reset();
}

function sendNotification(type, message, userEmail) {
    console.log(`${type.toUpperCase()} notification sent to ${userEmail}: ${message}`);
    
    console.log(`SMS notification sent: ${message}`);
}

function simulateLiveUpdates() {
    setInterval(() => {
        if (currentUser && Math.random() > 0.95) {
            const updates = [
                'Your issue #BUP001 status updated to "In Progress"',
                'New urgent issue reported in Academic Block 1',
                'Maintenance completed for issue #BUP002',
                'Higher authority notification: Issue overdue'
            ];
            
            const randomUpdate = updates[Math.floor(Math.random() * updates.length)];
            showNotification(randomUpdate, 'info');
        }
    }, 30000);
}

setTimeout(simulateLiveUpdates, 5000);

function getDepartmentFromStudentId(studentId) {
    const departmentCodes = {
        '01': 'Department of Economics',
        '02': 'Department of International Relations',
        '03': 'Department of Information and Communication Technology',
        '04': 'Department of Business Administration - General',
        '05': 'Department of Environmental Science',
        '06': 'Department of English',
        '07': 'Department of Business Administration in Accounting & Information Systems',
        '08': 'Department of Computer Science and Engineering',
        '09': 'Department of Public Administration',
        '10': 'Department of Business Administration in Management Studies',
        '11': 'Department of Development Studies',
        '12': 'Department of Sociology',
        '13': 'Department of Mass Communication and Journalism',
        '14': 'Department of Business Administration in Finance & Banking',
        '15': 'Department of Business Administration in Marketing',
        '16': 'Department of Law',
        '17': 'Department of Disaster Management & Resilience',
        '18': 'Department of Peace, Conflict and Human Rights',
        '19': 'Department of BA/BSS',
        '20': 'Department of Public Health & Informatics',
        '21': 'Centre for Higher Studies & Research (CHSR)'
    };
    
    const deptCode = studentId.substring(2, 4);
    return departmentCodes[deptCode] || 'General Studies';
}
