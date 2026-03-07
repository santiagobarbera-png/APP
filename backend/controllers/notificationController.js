'use strict';

const Notification = require('../models/Notification');

const getNotifications = async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 20;
        const offset = parseInt(req.query.offset) || 0;
        const notifications = await Notification.findByUserId(req.userId, limit, offset);
        const unreadCount = await Notification.getUnreadCount(req.userId);
        return res.json({ notifications, unreadCount });
    } catch (error) {
        console.error('Error getting notifications:', error.message);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

const markAsRead = async (req, res) => {
    try {
        const { notificationIds } = req.body;
        if (!notificationIds || !Array.isArray(notificationIds)) {
            return res.status(400).json({ error: 'notificationIds array is required' });
        }
        const updated = await Notification.markAsRead(notificationIds, req.userId);
        return res.json({ updated, message: 'Notifications marked as read' });
    } catch (error) {
        console.error('Error marking notifications as read:', error.message);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

const markAllAsRead = async (req, res) => {
    try {
        await Notification.markAllAsRead(req.userId);
        return res.json({ message: 'All notifications marked as read' });
    } catch (error) {
        console.error('Error marking all notifications as read:', error.message);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

const deleteNotification = async (req, res) => {
    try {
        const { id } = req.params;
        const deleted = await Notification.delete(id, req.userId);
        if (!deleted) {
            return res.status(404).json({ error: 'Notification not found' });
        }
        return res.json({ message: 'Notification deleted' });
    } catch (error) {
        console.error('Error deleting notification:', error.message);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

module.exports = { getNotifications, markAsRead, markAllAsRead, deleteNotification };
