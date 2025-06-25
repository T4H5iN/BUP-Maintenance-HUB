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

async function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    const role = document.getElementById('loginRole').value;

    showLoading();

    try {
        // Change the URL to your backend server's address and port
        const res = await fetch('http://localhost:3000/api/users/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        const data = await res.json();
        hideLoading();
        if (!res.ok) {
            showNotification(data.message || 'Login failed', 'error');
            return;
        }
        localStorage.setItem('bup-token', data.token);
        localStorage.setItem('bup-current-user', JSON.stringify(data.user));
        currentUser = data.user;
        showNotification(`Welcome back, ${currentUser.email}!`, 'success');
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1000);
    } catch (err) {
        hideLoading();
        showNotification('Login error', 'error');
    }
}

async function handleRegistration(e) {
    e.preventDefault();
    const email = document.getElementById('regEmail').value;
    const password = document.getElementById('regPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const role = document.getElementById('regRole').value;
    const dept = document.getElementById('regDepartment').value;

    if (password !== confirmPassword) {
        showNotification('Passwords do not match', 'error');
        return;
    }

    showLoading();

    try {
        // Change the URL to your backend server's address and port
        const res = await fetch('http://localhost:3000/api/users', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password, role, dept })
        });
        const data = await res.json();
        hideLoading();
        if (!res.ok) {
            showNotification(data.message || 'Registration failed', 'error');
            return;
        }
        showNotification('Registration successful! Please login.', 'success');
        showLoginForm();
    } catch (err) {
        hideLoading();
        showNotification('Registration error', 'error');
    }
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