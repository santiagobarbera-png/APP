'use strict';

const Notification = require('../models/Notification');

class NotificationService {
    static async createNotification(userId, type, title, body, data = null) {
        try {
            return await Notification.save({ userId, type, title, body, notificationData: data });
        } catch (error) {
            console.error('Error creating notification:', error.message);
            return null;
        }
    }

    static async sendMatchNotification(userId, matchedUserId, compatibilityScore) {
        return this.createNotification(
            userId,
            'new_match',
            'New Match! 💕',
            `You have a new match with ${compatibilityScore}% compatibility!`,
            { matchedUserId, compatibilityScore }
        );
    }

    static async sendPerfectMatchNotification(userId, matchedUserId, compatibilityScore) {
        return this.createNotification(
            userId,
            'perfect_match',
            'Perfect Match Found! ⭐',
            `We found a perfect match for you with ${compatibilityScore}% compatibility!`,
            { matchedUserId, compatibilityScore }
        );
    }

    static async sendMessageNotification(userId, senderName, preview) {
        return this.createNotification(
            userId,
            'new_message',
            `New message from ${senderName}`,
            preview.length > 50 ? preview.substring(0, 50) + '...' : preview,
            { senderName }
        );
    }

    static async sendEmailNotification(userId, subject, _htmlBody) {
        // Email sending logic — requires nodemailer in production
        console.log(`[Email] To user ${userId}: ${subject}`);
        // In production: configure nodemailer with config.email settings
    }
}

module.exports = NotificationService;
