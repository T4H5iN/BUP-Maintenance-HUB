let currentUser = null;
let pendingVerificationEmail = null;

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
    document.getElementById('otpFormElement').addEventListener('submit', handleOtpVerification);
    document.getElementById('forgotPasswordFormElement').addEventListener('submit', handleForgotPassword);
    document.getElementById('resetPasswordFormElement').addEventListener('submit', handlePasswordReset);
}

async function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

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
            // Check if email verification is required
            if (data.requiresVerification) {
                showNotification(data.message, 'warning');
                initializeOtpVerification(email);
                return;
            }
            
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

    // Validate BUP email domains
    if (!validateBUPEmail(email)) {
        showNotification('Only @bup.edu.bd or @student.bup.edu.bd email addresses are allowed', 'error');
        return;
    }

    // Validate password strength
    if (!validatePassword(password)) {
        showNotification('Password does not meet the strength requirements', 'error');
        return;
    }

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
        
        // Check if verification is required
        if (data.requiresVerification) {
            showNotification('Registration successful! Please check your email (including spam folder) for verification code.', 'success');
            initializeOtpVerification(email);
        } else {
            showNotification('Registration successful! Please login.', 'success');
            showLoginForm();
        }
    } catch (err) {
        hideLoading();
        showNotification('Registration error', 'error');
    }
}

function initializeOtpVerification(email) {
    document.getElementById('otpEmail').textContent = email;
    document.getElementById('otpFormElement').classList.add('active');
    document.getElementById('loginFormElement').classList.remove('active');
    document.getElementById('registerFormElement').classList.remove('active');
}

async function handleOtpVerification(e) {
    e.preventDefault();
    const otpCode = document.getElementById('otpCode').value;
    const email = document.getElementById('otpEmail').textContent;

    showLoading();

    try {
        // Change the URL to your backend server's address and port
        const res = await fetch('http://localhost:3000/api/users/verify-otp', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, otpCode })
        });
        const data = await res.json();
        hideLoading();
        
        if (!res.ok) {
            showNotification(data.message || 'OTP verification failed', 'error');
            return;
        }
        
        // Login the user automatically after successful OTP verification
        localStorage.setItem('bup-token', data.token);
        localStorage.setItem('bup-current-user', JSON.stringify(data.user));
        currentUser = data.user;
        showNotification('OTP verified successfully! Logging you in...', 'success');
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1000);
    } catch (err) {
        hideLoading();
        showNotification('OTP verification error', 'error');
    }
}

function showForgotPassword() {
    // Hide all forms first
    hideAllForms();
    // Then show only the forgot password form
    document.getElementById('forgotPasswordForm').classList.add('active');
}

function showResetPasswordForm(email, resetToken) {
    // Hide all forms first
    hideAllForms();
    // Then show only the reset password form
    document.getElementById('resetPasswordForm').classList.add('active');
    
    // Store email and reset token in hidden fields
    document.getElementById('resetEmail').value = email;
    document.getElementById('resetToken').value = resetToken;
}

/**
 * Helper function to hide all authentication forms
 */
function hideAllForms() {
    // Get all auth forms and remove active class
    const forms = document.querySelectorAll('.auth-form');
    forms.forEach(form => {
        form.classList.remove('active');
    });
}

async function handleForgotPassword(e) {
    e.preventDefault();
    const email = document.getElementById('forgotEmail').value;
    
    // Validate email
    if (!validateBUPEmail(email)) {
        showNotification('Please enter a valid BUP email address', 'error');
        return;
    }
    
    showLoading();
    
    try {
        const res = await fetch('http://localhost:3000/api/users/forgot-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
        });
        
        const data = await res.json();
        hideLoading();
        
        if (!res.ok) {
            showNotification(data.message || 'Failed to process request', 'error');
            return;
        }
        
        showNotification('Verification code sent to your email. Please check your inbox and spam folder.', 'success');
        
        // Initialize OTP verification for password reset
        initializeOtpVerificationForReset(email);
    } catch (err) {
        hideLoading();
        showNotification('Error processing request', 'error');
        console.error('Forgot password error:', err);
    }
}

function initializeOtpVerificationForReset(email) {
    pendingVerificationEmail = email;
    
    // Set the email in the form
    const userEmailInput = document.getElementById('userEmail');
    if (userEmailInput) {
        userEmailInput.value = email;
    }
    
    // Show the verification form
    document.getElementById('loginForm').classList.remove('active');
    document.getElementById('registerForm').classList.remove('active');
    document.getElementById('forgotPasswordForm').classList.remove('active');
    document.getElementById('resetPasswordForm').classList.remove('active');
    document.getElementById('verificationForm').classList.add('active');
    
    // Focus on the OTP input
    const otpInput = document.getElementById('otpCode');
    if (otpInput) {
        otpInput.focus();
    }
    
    // Set up the resend OTP link
    const resendLink = document.getElementById('resendOtp');
    if (resendLink) {
        resendLink.onclick = handleResendOtpForReset;
    }
    
    // Override the form submission handler
    const otpForm = document.getElementById('otpFormElement');
    if (otpForm) {
        otpForm.removeEventListener('submit', handleOtpVerification);
        otpForm.addEventListener('submit', handleResetOtpVerification);
    }
}

async function handleResendOtpForReset(e) {
    e.preventDefault();
    
    if (!pendingVerificationEmail) {
        showNotification('No email address found for verification', 'error');
        return;
    }
    
    showLoading();
    
    try {
        const res = await fetch('http://localhost:3000/api/users/forgot-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: pendingVerificationEmail })
        });
        
        const data = await res.json();
        hideLoading();
        
        if (!res.ok) {
            showNotification(data.message || 'Failed to resend verification code', 'error');
            return;
        }
        
        showNotification('Verification code resent. Please check your email.', 'success');
    } catch (err) {
        hideLoading();
        showNotification('Error resending verification code', 'error');
        console.error('Resend OTP error:', err);
    }
}

async function handleResetOtpVerification(e) {
    e.preventDefault();
    
    const otp = document.getElementById('otpCode').value;
    
    if (!otp || otp.length !== 6 || !/^\d+$/.test(otp)) {
        showNotification('Please enter a valid 6-digit verification code', 'error');
        return;
    }
    
    showLoading();
    
    try {
        const res = await fetch('http://localhost:3000/api/users/verify-reset-otp', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                email: pendingVerificationEmail,
                otp: otp
            })
        });
        
        const data = await res.json();
        hideLoading();
        
        if (!res.ok) {
            showNotification(data.message || 'Verification failed', 'error');
            return;
        }
        
        showNotification('Email verified. You can now reset your password.', 'success');
        
        // Show reset password form
        showResetPasswordForm(data.email, data.resetToken);
        
        // Reset OTP form handler
        const otpForm = document.getElementById('otpFormElement');
        if (otpForm) {
            otpForm.removeEventListener('submit', handleResetOtpVerification);
            otpForm.addEventListener('submit', handleOtpVerification);
        }
    } catch (err) {
        hideLoading();
        showNotification('Verification error. Please try again.', 'error');
        console.error('OTP verification error:', err);
    }
}

async function handlePasswordReset(e) {
    e.preventDefault();
    
    const email = document.getElementById('resetEmail').value;
    const resetToken = document.getElementById('resetToken').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmNewPassword').value;
    
    // Validate passwords
    if (newPassword !== confirmPassword) {
        showNotification('Passwords do not match', 'error');
        return;
    }
    
    // Validate password strength
    if (!validatePassword(newPassword)) {
        showNotification('Password does not meet the strength requirements', 'error');
        return;
    }
    
    showLoading();
    
    try {
        const res = await fetch('http://localhost:3000/api/users/reset-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                email,
                resetToken,
                newPassword
            })
        });
        
        const data = await res.json();
        hideLoading();
        
        if (!res.ok) {
            showNotification(data.message || 'Password reset failed', 'error');
            return;
        }
        
        showNotification('Password reset successful! You can now login with your new password.', 'success');
        
        // Show login form
        showLoginForm();
    } catch (err) {
        hideLoading();
        showNotification('Error resetting password', 'error');
        console.error('Password reset error:', err);
    }
}

/**
 * Check password strength and update UI
 */
function checkPasswordStrength() {
    const password = document.getElementById('regPassword').value;
    const strengthBar = document.getElementById('strengthBar');
    
    // Password requirement checks
    const lengthReq = document.getElementById('length-req');
    const uppercaseReq = document.getElementById('uppercase-req');
    const lowercaseReq = document.getElementById('lowercase-req');
    const numberReq = document.getElementById('number-req');
    const specialReq = document.getElementById('special-req');
    
    // Define password requirement patterns
    const hasLength = password.length >= 8;
    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
    
    // Update requirement indicators
    updateRequirement(lengthReq, hasLength);
    updateRequirement(uppercaseReq, hasUppercase);
    updateRequirement(lowercaseReq, hasLowercase);
    updateRequirement(numberReq, hasNumber);
    updateRequirement(specialReq, hasSpecial);
    
    // Calculate strength percentage
    const criteria = [hasLength, hasUppercase, hasLowercase, hasNumber, hasSpecial];
    const fulfilledCriteria = criteria.filter(Boolean).length;
    const strengthPercentage = (fulfilledCriteria / criteria.length) * 100;
    
    // Update strength bar
    strengthBar.style.width = `${strengthPercentage}%`;
    
    // Update strength bar color
    if (strengthPercentage <= 20) {
        strengthBar.className = 'strength-bar-fill very-weak';
    } else if (strengthPercentage <= 40) {
        strengthBar.className = 'strength-bar-fill weak';
    } else if (strengthPercentage <= 60) {
        strengthBar.className = 'strength-bar-fill medium';
    } else if (strengthPercentage <= 80) {
        strengthBar.className = 'strength-bar-fill strong';
    } else {
        strengthBar.className = 'strength-bar-fill very-strong';
    }
    
    return fulfilledCriteria === criteria.length; // Return true if all criteria are met
}

/**
 * Check password strength for reset password form
 */
function checkResetPasswordStrength() {
    const password = document.getElementById('newPassword').value;
    const strengthBar = document.getElementById('resetStrengthBar');
    
    // Password requirement checks
    const lengthReq = document.getElementById('reset-length-req');
    const uppercaseReq = document.getElementById('reset-uppercase-req');
    const lowercaseReq = document.getElementById('reset-lowercase-req');
    const numberReq = document.getElementById('reset-number-req');
    const specialReq = document.getElementById('reset-special-req');
    
    // Define password requirement patterns
    const hasLength = password.length >= 8;
    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
    
    // Update requirement indicators
    updateRequirement(lengthReq, hasLength);
    updateRequirement(uppercaseReq, hasUppercase);
    updateRequirement(lowercaseReq, hasLowercase);
    updateRequirement(numberReq, hasNumber);
    updateRequirement(specialReq, hasSpecial);
    
    // Calculate strength percentage
    const criteria = [hasLength, hasUppercase, hasLowercase, hasNumber, hasSpecial];
    const fulfilledCriteria = criteria.filter(Boolean).length;
    const strengthPercentage = (fulfilledCriteria / criteria.length) * 100;
    
    // Update strength bar
    strengthBar.style.width = `${strengthPercentage}%`;
    
    // Update strength bar color
    if (strengthPercentage <= 20) {
        strengthBar.className = 'strength-bar-fill very-weak';
    } else if (strengthPercentage <= 40) {
        strengthBar.className = 'strength-bar-fill weak';
    } else if (strengthPercentage <= 60) {
        strengthBar.className = 'strength-bar-fill medium';
    } else if (strengthPercentage <= 80) {
        strengthBar.className = 'strength-bar-fill strong';
    } else {
        strengthBar.className = 'strength-bar-fill very-strong';
    }
    
    return fulfilledCriteria === criteria.length; // Return true if all criteria are met
}

/**
 * Update a single requirement indicator
 * @param {HTMLElement} element - The requirement element
 * @param {boolean} isFulfilled - Whether the requirement is fulfilled
 */
function updateRequirement(element, isFulfilled) {
    if (isFulfilled) {
        element.querySelector('i').className = 'fas fa-check-circle';
        element.classList.add('fulfilled');
    } else {
        element.querySelector('i').className = 'fas fa-times-circle';
        element.classList.remove('fulfilled');
    }
}

/**
 * Validate that the password meets all requirements
 * @param {string} password - The password to validate
 * @returns {boolean} - Whether the password is valid
 */
function validatePassword(password) {
    return password.length >= 8 && 
           /[A-Z]/.test(password) && 
           /[a-z]/.test(password) && 
           /[0-9]/.test(password) && 
           /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
}

/**
 * Validate that the email is from an allowed BUP domain
 * @param {string} email - The email to validate
 * @returns {boolean} - Whether the email is valid
 */
function validateBUPEmail(email) {
    const validDomains = ['@bup.edu.bd', '@student.bup.edu.bd'];
    return validDomains.some(domain => email.toLowerCase().endsWith(domain));
}

function showLoginForm() {
    // Hide all forms first
    hideAllForms();
    // Then show only the login form
    document.getElementById('loginForm').classList.add('active');
}

function showRegisterForm() {
    // Hide all forms first
    hideAllForms();
    // Then show only the register form
    document.getElementById('registerForm').classList.add('active');
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

function showTerms() {
    showNotification('Terms of Service would be displayed here', 'info');
}

function showPrivacy() {
    showNotification('Privacy Policy would be displayed here', 'info');
}

// Check if already logged in, redirect if true
(function checkLoggedIn() {
    const token = localStorage.getItem('bup-token');
    const user = localStorage.getItem('bup-current-user');
    
    if (token && user) {
        window.location.href = 'index.html';
    }
})();