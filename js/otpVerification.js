/**
 * OTP Verification System
 */

/**
 * Initialize OTP verification form
 * @param {string} email - The email address to verify
 */
function initializeOtpVerification(email) {
    window.pendingVerificationEmail = email;

    // Set the email in the form
    const userEmailInput = document.getElementById('userEmail');
    if (userEmailInput) {
        userEmailInput.value = email;
    }

    // Hide all forms first
    if (typeof hideAllForms === 'function') {
        hideAllForms();
    } else {
        // Fallback if hideAllForms is not available
        document.querySelectorAll('.auth-form').forEach(form => {
            form.classList.remove('active');
        });
    }

    // Show the verification form
    document.getElementById('verificationForm').classList.add('active');

    // Focus on the OTP input
    const otpInput = document.getElementById('otpCode');
    if (otpInput) {
        otpInput.focus();
    }

    // Set up the resend OTP link
    const resendLink = document.getElementById('resendOtp');
    if (resendLink) {
        resendLink.onclick = handleResendOtp;
    }
}

/**
 * Handle OTP form submission
 * @param {Event} e - The form submission event
 */
async function handleOtpVerification(e) {
    e.preventDefault();

    // Get OTP from input field
    const otp = document.getElementById('otpCode').value;

    // Get email from the hidden input field
    const email = document.getElementById('userEmail').value;

    // Make sure we have a valid email, either from input field or global variable
    const verificationEmail = email || window.pendingVerificationEmail;

    if (!verificationEmail) {
        showNotification('Email address not found. Please try again or contact support.', 'error');
        return;
    }

    if (!otp || otp.length !== 6 || !/^\d+$/.test(otp)) {
        showNotification('Please enter a valid 6-digit verification code', 'error');
        return;
    }

    showLoading();

    try {
        console.log('Sending verification request:', { email: verificationEmail, otp });

        const res = await fetch('/api/users/verify-otp', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: verificationEmail,
                otp: otp
            })
        });

        const data = await res.json();
        hideLoading();

        // Log response for debugging
        console.log('Verification response:', data, 'Status:', res.status);

        if (!res.ok) {
            showNotification(data.message || 'Verification failed', 'error');
            return;
        }

        // Store user data and token
        localStorage.setItem('bup-token', data.token);
        localStorage.setItem('bup-current-user', JSON.stringify(data.user));

        showNotification('Email verified successfully! Redirecting to dashboard...', 'success');

        // Reset pending verification
        window.pendingVerificationEmail = null;

        // Redirect to main page after a short delay
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 2000);

    } catch (err) {
        hideLoading();
        console.error('OTP verification error:', err);
        showNotification('Verification error. Please try again.', 'error');
    }
}

/**
 * Handle resending OTP
 */
async function handleResendOtp(e) {
    e.preventDefault();

    if (!pendingVerificationEmail) {
        showNotification('No email address found for verification', 'error');
        return;
    }

    showLoading();

    try {
        const res = await fetch('/api/users/resend-otp', {
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

// Export functions for global use
window.initializeOtpVerification = initializeOtpVerification;
window.handleOtpVerification = handleOtpVerification;
window.handleResendOtp = handleResendOtp;
