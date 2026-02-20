/**
 * D1: SMS Notification Service via sms.net.bd API
 * Sends SMS notifications when issues are assigned to technicians
 */

const fetch = require('node-fetch');

const SMS_API_URL = 'https://api.sms.net.bd/sendsms';

/**
 * Send an SMS to a phone number via sms.net.bd
 * @param {string} to - Recipient phone number (880XXXXXXXXXX or 01XXXXXXXXX)
 * @param {string} message - SMS body
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
async function sendSMS(to, message) {
    const apiKey = process.env.SMS_API_KEY;
    if (!apiKey) {
        console.warn('SMS_API_KEY not set — skipping SMS notification');
        return { success: false, error: 'SMS_API_KEY not configured' };
    }

    try {
        const res = await fetch(SMS_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                api_key: apiKey,
                msg: message,
                to: to
            })
        });

        const data = await res.json();

        if (data.error === 0) {
            console.log(`SMS sent to ${to}: request_id=${data.data?.request_id}`);
            return { success: true, data: data.data };
        } else {
            console.error(`SMS API error ${data.error}: ${data.msg}`);
            return { success: false, error: `API error ${data.error}: ${data.msg}` };
        }
    } catch (err) {
        console.error('SMS send failed:', err.message);
        return { success: false, error: err.message };
    }
}

/**
 * Send issue assignment notification to a technician
 * @param {object} technician - Technician user object (needs .phone and .name)
 * @param {object} issue - Issue object (needs .issueId, .category, .specificLocation)
 */
async function notifyTechnicianAssignment(technician, issue) {
    if (!technician.phone) {
        console.warn(`Technician ${technician.name} has no phone number — skipping SMS`);
        return { success: false, error: 'No phone number' };
    }

    const message = `BUP Maintenance: Issue #${issue.issueId || issue.id} (${issue.category}) at ${issue.specificLocation || issue.location} has been assigned to you. Please check the system for details.`;

    return sendSMS(technician.phone, message);
}

module.exports = { sendSMS, notifyTechnicianAssignment };
