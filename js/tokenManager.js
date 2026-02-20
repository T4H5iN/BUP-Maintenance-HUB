/**
 * Token Manager - Handles silent JWT refresh and token storage
 * 
 * This script overrides window.fetch to intercept 401 "Token expired" responses,
 * silently refresh the access token using the stored refresh token, and retry
 * the failed request. If the refresh token is also expired, the user is
 * automatically logged out with a friendly message.
 * 
 * MUST be loaded before any other scripts that make API calls.
 */
(function () {
    'use strict';

    const ACCESS_TOKEN_KEY = 'bup-token';
    const REFRESH_TOKEN_KEY = 'bup-refresh-token';
    const REMEMBER_ME_KEY = 'bup-remember-me';

    // --- Token Storage Helpers ---

    /**
     * Get the current access token
     */
    function getAccessToken() {
        return localStorage.getItem(ACCESS_TOKEN_KEY);
    }

    /**
     * Get the current refresh token (checks both localStorage and sessionStorage)
     */
    function getRefreshToken() {
        return localStorage.getItem(REFRESH_TOKEN_KEY) ||
            sessionStorage.getItem(REFRESH_TOKEN_KEY);
    }

    /**
     * Store tokens after login or refresh
     * @param {string} accessToken
     * @param {string} refreshToken
     * @param {boolean} rememberMe - If true, refresh token goes to localStorage; otherwise sessionStorage
     */
    function setTokens(accessToken, refreshToken, rememberMe) {
        // Access token always goes to localStorage (short-lived, fine to persist)
        if (accessToken) {
            localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
        }

        if (refreshToken) {
            if (rememberMe) {
                // Persist across browser close
                localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
                sessionStorage.removeItem(REFRESH_TOKEN_KEY);
            } else {
                // Clear on browser close
                sessionStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
                localStorage.removeItem(REFRESH_TOKEN_KEY);
            }
        }

        if (rememberMe !== undefined) {
            localStorage.setItem(REMEMBER_ME_KEY, JSON.stringify(rememberMe));
        }
    }

    /**
     * Clear all tokens (on logout)
     */
    function clearTokens() {
        localStorage.removeItem(ACCESS_TOKEN_KEY);
        localStorage.removeItem(REFRESH_TOKEN_KEY);
        localStorage.removeItem(REMEMBER_ME_KEY);
        sessionStorage.removeItem(REFRESH_TOKEN_KEY);
    }

    /**
     * Check if "Remember Me" was selected
     */
    function isRememberMe() {
        try {
            return JSON.parse(localStorage.getItem(REMEMBER_ME_KEY)) === true;
        } catch {
            return false;
        }
    }

    // --- Silent Refresh Logic ---

    let isRefreshing = false;
    let refreshPromise = null;

    /**
     * Attempt to refresh the access token using the refresh token
     * Returns the new access token, or null if refresh failed
     */
    async function refreshAccessToken() {
        const refreshToken = getRefreshToken();
        if (!refreshToken) {
            return null;
        }

        try {
            // Use the original fetch to avoid infinite loop
            const response = await originalFetch('/api/users/refresh-token', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ refreshToken })
            });

            if (!response.ok) {
                return null;
            }

            const data = await response.json();

            // Store new tokens
            setTokens(data.token, data.refreshToken, isRememberMe());

            return data.token;
        } catch (error) {
            console.error('Token refresh failed:', error);
            return null;
        }
    }

    /**
     * Handle session expiry — log the user out gracefully
     */
    function handleSessionExpired() {
        clearTokens();
        localStorage.removeItem('bup-current-user');

        // Only redirect if not already on auth page
        if (!window.location.pathname.includes('auth.html')) {
            // Show a notification if possible
            if (typeof window.showNotification === 'function') {
                window.showNotification('Session expired. Please log in again.', 'warning');
            }

            setTimeout(() => {
                window.location.href = 'auth.html';
            }, 1500);
        }
    }

    // --- Fetch Interceptor ---

    const originalFetch = window.fetch;

    window.fetch = async function (url, options = {}) {
        const response = await originalFetch(url, options);

        // Only intercept 401s for API calls (not the refresh endpoint itself)
        if (
            response.status === 401 &&
            typeof url === 'string' &&
            url.includes('/api/') &&
            !url.includes('/api/users/refresh-token') &&
            !url.includes('/api/users/login')
        ) {
            // Check if this is a token expiry issue
            const clonedResponse = response.clone();
            let body;
            try {
                body = await clonedResponse.json();
            } catch {
                return response; // Not JSON, return original
            }

            if (body.message === 'Token expired') {
                // Attempt silent refresh
                // Use a shared promise so concurrent requests don't all refresh at once
                if (!isRefreshing) {
                    isRefreshing = true;
                    refreshPromise = refreshAccessToken().finally(() => {
                        isRefreshing = false;
                    });
                }

                const newToken = await refreshPromise;

                if (newToken) {
                    // Retry the original request with the new token
                    const newOptions = { ...options };
                    newOptions.headers = { ...(options.headers || {}) };

                    // Update the authorization header
                    if (newOptions.headers['Authorization'] || newOptions.headers['authorization']) {
                        newOptions.headers['Authorization'] = `Bearer ${newToken}`;
                    } else if (newOptions.headers.Authorization) {
                        newOptions.headers.Authorization = `Bearer ${newToken}`;
                    } else {
                        // Check if any header key matches case-insensitively
                        const authKey = Object.keys(newOptions.headers).find(
                            k => k.toLowerCase() === 'authorization'
                        );
                        if (authKey) {
                            newOptions.headers[authKey] = `Bearer ${newToken}`;
                        }
                    }

                    return originalFetch(url, newOptions);
                } else {
                    // Refresh failed — session is truly expired
                    handleSessionExpired();
                    return response;
                }
            }
        }

        return response;
    };

    // --- Expose helpers globally ---

    window.TokenManager = {
        getAccessToken,
        getRefreshToken,
        setTokens,
        clearTokens,
        isRememberMe
    };
})();
