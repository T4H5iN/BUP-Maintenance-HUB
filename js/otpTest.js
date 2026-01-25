/**
 * OTP Testing Utility
 * This script provides functions to test OTP verification without sending emails
 */

// Store the last generated OTP for each email
const testOtps = {};

// Flag to control whether test mode is active
let testModeActive = false;

/**
 * Generate a test OTP for a given email
 * @param {string} email - The email address
 * @returns {string} - The generated OTP
 */
function generateTestOTP(email) {
    // Generate a random 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Store the OTP
    testOtps[email] = otp;

    // Display the OTP in the console for testing


    // Also show a notification if the function exists
    if (typeof showNotification === 'function') {
        showNotification(`[TEST MODE] OTP for ${email}: ${otp}`, 'info');
    }

    return otp;
}

/**
 * Verify a test OTP
 * @param {string} email - The email address
 * @param {string} otp - The OTP to verify
 * @returns {boolean} - Whether the OTP is valid
 */
function verifyTestOTP(email, otp) {
    const storedOtp = testOtps[email];
    return storedOtp === otp;
}

/**
 * Mock the server's OTP verification API
 * For testing purposes only
 */
async function mockVerifyOTP(email, otp) {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            const isValid = verifyTestOTP(email, otp);

            if (isValid) {
                resolve({
                    ok: true,
                    json: () => ({
                        message: 'Email verified successfully',
                        token: 'test-token-' + Date.now(),
                        user: {
                            id: 'test-user-id',
                            email: email,
                            name: email.split('@')[0],
                            role: email.includes('student') ? 'student' : 'faculty',
                            verified: true
                        }
                    })
                });
            } else {
                resolve({
                    ok: false,
                    json: () => ({
                        message: 'Invalid or expired verification code'
                    })
                });
            }
        }, 1000); // Simulate network delay
    });
}

// Store the original fetch function
const originalFetch = window.fetch;

// Override the fetch function only when test mode is active
window.fetch = function (url, options) {
    // Only intercept if test mode is active
    if (testModeActive) {
        if (url.includes('/api/users/verify-otp')) {
            const body = JSON.parse(options.body);
            return mockVerifyOTP(body.email, body.otp);
        }

        if (url.includes('/api/users/resend-otp')) {
            const body = JSON.parse(options.body);
            generateTestOTP(body.email);
            return Promise.resolve({
                ok: true,
                json: () => ({ message: 'Verification code resent to your email' })
            });
        }

        if (url.includes('/api/users')) {
            const body = JSON.parse(options.body);
            if (body.email) {
                generateTestOTP(body.email);
            }
        }
    }

    // Use the original fetch for all other requests or when test mode is inactive
    return originalFetch(url, options);
};

/**
 * Toggle test mode on/off
 * @param {boolean} active - Whether test mode should be active
 */
function toggleTestMode(active) {
    testModeActive = active;

    if (typeof showNotification === 'function') {
        showNotification(`OTP Test Mode ${active ? 'enabled' : 'disabled'}`, 'info');
    }
}

// Initialize with test mode disabled by default
toggleTestMode(false);

// For testing in the browser console
window.generateTestOTP = generateTestOTP;
window.verifyTestOTP = verifyTestOTP;
window.toggleTestMode = toggleTestMode;