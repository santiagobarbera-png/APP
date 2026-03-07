'use strict';

require('dotenv').config();
const nodemailer = require('nodemailer');
const Notification = require('../models/Notification');

// Configure email transporter
let transporter = null;

function getTransporter() {
    if (transporter) return transporter;
    if (!process.env.SMTP_HOST || !process.env.SMTP_USER) {
        console.warn('Email not configured - notifications will be stored but not emailed');
        return null;
    }
    transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587', 10),
        secure: process.env.SMTP_PORT === '465',
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        },
    });
    return transporter;
}

/**
 * Create a notification in the database
 */
async function createNotification({ userId, type, title, body, data = {} }) {
    return Notification.create({ userId, type, title, body, data });
}

/**
 * Send a new match notification
 */
async function notifyNewMatch(userId, matchedUserName, matchId) {
    return createNotification({
        userId,
        type: 'new_match',
        title: '🎉 New Match!',
        body: `You and ${matchedUserName} liked each other!`,
        data: { matchId, matchedUserName },
    });
}

/**
 * Send a new message notification
 */
async function notifyNewMessage(userId, senderName, matchId, preview) {
    return createNotification({
        userId,
        type: 'new_message',
        title: `💬 New message from ${senderName}`,
        body: preview ? preview.substring(0, 80) : 'You have a new message',
        data: { matchId, senderName },
    });
}

/**
 * Send a perfect match notification
 */
async function notifyPerfectMatch(userId, matchedUserName, score, matchedUserId) {
    return createNotification({
        userId,
        type: 'perfect_match',
        title: '⭐ Perfect Match Found!',
        body: `AI found you a ${Math.round(score)}% compatibility match with ${matchedUserName}!`,
        data: { matchedUserId, matchedUserName, score },
    });
}

/**
 * Send pending email notifications
 */
async function sendPendingEmails() {
    const transport = getTransporter();
    if (!transport) return { sent: 0, failed: 0 };

    const pending = await Notification.getPendingEmails(100);
    if (pending.length === 0) return { sent: 0, failed: 0 };

    const appName = process.env.APP_NAME || 'DatingApp';
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const emailFrom = process.env.EMAIL_FROM || process.env.SMTP_USER;

    let sent = 0;
    let failed = 0;
    const sentIds = [];

    for (const notification of pending) {
        try {
            await transport.sendMail({
                from: `"${appName}" <${emailFrom}>`,
                to: notification.email,
                subject: notification.title,
                html: buildEmailHtml(notification, frontendUrl, appName),
            });
            sentIds.push(notification.id);
            sent++;
        } catch (err) {
            console.error(`Failed to send email to ${notification.email}:`, err.message);
            failed++;
        }
    }

    if (sentIds.length > 0) {
        await Notification.markEmailSent(sentIds);
    }

    return { sent, failed };
}

function buildEmailHtml(notification, frontendUrl, appName) {
    return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>${notification.title}</title></head>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #ff6b6b, #ee5a24); padding: 30px; border-radius: 10px; text-align: center; color: white;">
    <h1 style="margin:0;">${appName}</h1>
  </div>
  <div style="padding: 30px; background: #f9f9f9; border-radius: 0 0 10px 10px;">
    <h2>${notification.title}</h2>
    <p style="font-size: 16px; color: #333;">${notification.body}</p>
    <a href="${frontendUrl}" style="display:inline-block; background:#ee5a24; color:white; padding:12px 24px; border-radius:6px; text-decoration:none; margin-top:10px;">
      Open ${appName}
    </a>
    <p style="color: #999; font-size: 12px; margin-top: 20px;">
      You received this email because you have an account on ${appName}.
    </p>
  </div>
</body>
</html>`;
}

module.exports = {
    createNotification,
    notifyNewMatch,
    notifyNewMessage,
    notifyPerfectMatch,
    sendPendingEmails,
};
