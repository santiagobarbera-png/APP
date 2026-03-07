'use strict';

const Notification = require('../models/Notification');

/**
 * GET /api/notifications
 * Get user notifications
 */
exports.getNotifications = async (req, res) => {
    try {
        const limit = parseInt(req.query.limit, 10) || 20;
        const offset = parseInt(req.query.offset, 10) || 0;
        const notifications = await Notification.findByUserId(req.userId, limit, offset);
        const unreadCount = await Notification.getUnreadCount(req.userId);
        return res.json({ success: true, data: { notifications, unreadCount } });
    } catch (err) {
        console.error('GetNotifications error:', err);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

/**
 * PUT /api/notifications/:id/read
 * Mark a notification as read
 */
exports.markAsRead = async (req, res) => {
    try {
        const { id } = req.params;
        const notification = await Notification.markAsRead(id, req.userId);
        if (!notification) {
            return res.status(404).json({ success: false, message: 'Notification not found' });
        }
        return res.json({ success: true, message: 'Notification marked as read' });
    } catch (err) {
        console.error('MarkAsRead error:', err);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

/**
 * PUT /api/notifications/read-all
 * Mark all notifications as read
 */
exports.markAllAsRead = async (req, res) => {
    try {
        const count = await Notification.markAllAsRead(req.userId);
        return res.json({ success: true, message: `Marked ${count} notifications as read` });
    } catch (err) {
        console.error('MarkAllAsRead error:', err);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

/**
 * DELETE /api/notifications/:id
 * Delete a notification
 */
exports.deleteNotification = async (req, res) => {
    try {
        const { id } = req.params;
        const deleted = await Notification.deleteById(id, req.userId);
        if (!deleted) {
            return res.status(404).json({ success: false, message: 'Notification not found' });
        }
        return res.json({ success: true, message: 'Notification deleted' });
    } catch (err) {
        console.error('DeleteNotification error:', err);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};
