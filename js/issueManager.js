// Main issue management file that ties everything together

// Initialize issues array globally
window.issues = window.issues || [];

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function () {


    // Make sure all submodules are registered
    const submodules = [
        'imageHandler.js',
        'issueSubmission.js',
        'issueFetching.js',
        'issueDisplay.js',
        'issueDetails.js'
    ];

    // Register this module as loaded once dependencies are ready
    if (typeof registerModuleLoaded === 'function') {
        registerModuleLoaded('issues');
    }
});
