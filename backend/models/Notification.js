'use strict';

const pool = require('../config/database');

class Notification {
    static async create({ userId, type, title, body, data = {} }) {
        const { rows } = await pool.query(
            `INSERT INTO notifications (user_id, type, title, body, data)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING *`,
            [userId, type, title, body, JSON.stringify(data)]
        );
        return rows[0];
    }

    static async findByUserId(userId, limit = 20, offset = 0) {
        const { rows } = await pool.query(
            `SELECT * FROM notifications
             WHERE user_id = $1
             ORDER BY created_at DESC
             LIMIT $2 OFFSET $3`,
            [userId, limit, offset]
        );
        return rows;
    }

    static async getUnreadCount(userId) {
        const { rows } = await pool.query(
            'SELECT COUNT(*) AS count FROM notifications WHERE user_id = $1 AND is_read = false',
            [userId]
        );
        return parseInt(rows[0].count, 10);
    }

    static async markAsRead(notificationId, userId) {
        const { rows } = await pool.query(
            `UPDATE notifications SET is_read = true
             WHERE id = $1 AND user_id = $2
             RETURNING id`,
            [notificationId, userId]
        );
        return rows[0] || null;
    }

    static async markAllAsRead(userId) {
        const { rows } = await pool.query(
            `UPDATE notifications SET is_read = true
             WHERE user_id = $1 AND is_read = false
             RETURNING id`,
            [userId]
        );
        return rows.length;
    }

    static async deleteById(notificationId, userId) {
        const { rows } = await pool.query(
            'DELETE FROM notifications WHERE id = $1 AND user_id = $2 RETURNING id',
            [notificationId, userId]
        );
        return rows[0] || null;
    }

    static async getPendingEmails(limit = 100) {
        const { rows } = await pool.query(
            `SELECT n.*, u.email, u.name AS user_name
             FROM notifications n
             JOIN users u ON u.id = n.user_id
             WHERE n.email_sent = false
               AND u.is_active = true
             ORDER BY n.created_at ASC
             LIMIT $1`,
            [limit]
        );
        return rows;
    }

    static async markEmailSent(ids) {
        if (!ids || ids.length === 0) return;
        await pool.query(
            `UPDATE notifications SET email_sent = true, email_sent_at = NOW()
             WHERE id = ANY($1::uuid[])`,
            [ids]
        );
    }
}

module.exports = Notification;
