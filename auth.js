let currentUser = null;

document.addEventListener('DOMContentLoaded', function() {
    initializeAuth();
    setupAuthEventListeners();
});

function initializeAuth() {
    const savedUser = localStorage.getItem('bup-current-user');
    if (savedUser) {
        try {
            currentUser = JSON.parse(savedUser);
            window.location.href = 'index.html';
        } catch (e) {
            localStorage.removeItem('bup-current-user');
        }
    }
}

function setupAuthEventListeners() {
    document.getElementById('loginFormElement').addEventListener('submit', handleLogin);
    document.getElementById('registerFormElement').addEventListener('submit', handleRegistration);
}

function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    const role = document.getElementById('loginRole').value;

    showLoading();

    if (!isValidBUPEmail(email, role)) {
        hideLoading();
        showNotification('Please use a valid BUP email address for your role', 'error');
        return;
    }

    const userInfo = extractUserInfoFromEmail(email);

    setTimeout(() => {
        currentUser = {
            email: email,
            role: role,
            name: userInfo.name,
            id: userInfo.id,
            department: userInfo.department,
            loginTime: new Date().toISOString()
        };

        localStorage.setItem('bup-current-user', JSON.stringify(currentUser));

        hideLoading();
        showNotification(`Welcome back, ${currentUser.name}!`, 'success');
        
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1500);
    }, 2000);
}

function handleRegistration(e) {
    e.preventDefault();
    
    const email = document.getElementById('regEmail').value;
    const password = document.getElementById('regPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const role = document.getElementById('regRole').value;
    const department = document.getElementById('regDepartment').value;

    if (!isValidBUPEmail(email, role)) {
        showNotification('Please use a valid BUP email address for your role', 'error');
        return;
    }

    if (password !== confirmPassword) {
        showNotification('Passwords do not match', 'error');
        return;
    }

    const userInfo = extractUserInfoFromEmail(email);
    
    showLoading();

    setTimeout(() => {
        hideLoading();
        showNotification(`Registration successful for ${userInfo.name}! Please login with your credentials.`, 'success');
        showLoginForm();
    }, 2000);
}

function isValidBUPEmail(email, role) {
    const studentPattern = /^[a-zA-Z]+\d+@student\.bup\.edu\.bd$/;
    const facultyPattern = /^[a-zA-Z]+@bup\.edu\.bd$/;
    
    if (role === 'student') {
        return studentPattern.test(email);
    } else if (role === 'faculty' || role === 'staff' || role === 'admin' || role === 'authority' || role === 'technician') {
        return facultyPattern.test(email);
    }
    
    return false;
}

function extractUserInfoFromEmail(email) {
    const userInfo = {
        name: '',
        id: '',
        department: 'General'
    };

    if (email.includes('@student.bup.edu.bd')) {
        const localPart = email.split('@')[0];
        
        const nameMatch = localPart.match(/^([a-zA-Z]+)/);
        const idMatch = localPart.match(/(\d+)$/);
        
        if (nameMatch && idMatch) {
            userInfo.name = formatName(nameMatch[1]);
            userInfo.id = idMatch[1];
        }
        
        if (userInfo.id) {
            userInfo.department = getDepartmentFromStudentId(userInfo.id);
        }
        
    } else if (email.includes('@bup.edu.bd')) {
        const localPart = email.split('@')[0];
        userInfo.name = formatName(localPart);
        userInfo.id = generateFacultyId(localPart);
        userInfo.department = 'Faculty';
    }

    return userInfo;
}

function formatName(nameString) {
    return nameString.charAt(0).toUpperCase() + nameString.slice(1).toLowerCase();
}

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

function generateFacultyId(nameString) {
    const timestamp = Date.now().toString().slice(-4);
    const nameCode = nameString.substring(0, 3).toUpperCase();
    return `FAC${nameCode}${timestamp}`;
}

function showLoginForm() {
    document.getElementById('loginForm').classList.add('active');
    document.getElementById('registerForm').classList.remove('active');
}

function showRegisterForm() {
    document.getElementById('registerForm').classList.add('active');
    document.getElementById('loginForm').classList.remove('active');
}

function updateEmailPlaceholder() {
    const role = document.getElementById('regRole').value;
    const emailInput = document.getElementById('regEmail');
    
    if (role === 'student') {
        emailInput.placeholder = 'yourname123456789@student.bup.edu.bd';
    } else {
        emailInput.placeholder = 'yourname@bup.edu.bd';
    }
}

function togglePassword(inputId) {
    const input = document.getElementById(inputId);
    const wrapper = input.closest('.input-wrapper');
    const button = wrapper.querySelector('.password-toggle');
    const icon = button.querySelector('i');
    
    if (input.type === 'password') {
        input.type = 'text';
        icon.classList.remove('fa-eye');
        icon.classList.add('fa-eye-slash');
    } else {
        input.type = 'password';
        icon.classList.remove('fa-eye-slash');
        icon.classList.add('fa-eye');
    }
}

function showLoading() {
    document.getElementById('loadingOverlay').style.display = 'flex';
}

function hideLoading() {
    document.getElementById('loadingOverlay').style.display = 'none';
}

function showNotification(message, type = 'info') {
    const notification = document.getElementById('notification');
    const messageElement = notification.querySelector('.notification-message');
    
    messageElement.textContent = message;
    notification.className = `notification ${type}`;
    notification.style.display = 'block';  
    
    setTimeout(() => {
        notification.style.display = 'none';
    }, 3000);
}

function closeNotification() {
    document.getElementById('notification').style.display = 'none';
}

function showForgotPassword() {
    showNotification('Forgot password functionality would be implemented here', 'info');
}

function showTerms() {
    showNotification('Terms of Service would be displayed here', 'info');
}

function showPrivacy() {
    showNotification('Privacy Policy would be displayed here', 'info');
}