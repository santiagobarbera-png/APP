'use strict';

const pool = require('../config/database');

class Notification {
    static async save(data) {
        const { userId, type, title, body, notificationData } = data;
        const query = `
            INSERT INTO notifications (user_id, type, title, body, data)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *
        `;
        const values = [userId, type, title, body, notificationData ? JSON.stringify(notificationData) : null];
        const res = await pool.query(query, values);
        return res.rows[0];
    }

    static async findByUserId(userId, limit = 20, offset = 0) {
        const query = `
            SELECT * FROM notifications
            WHERE user_id = $1
            ORDER BY created_at DESC
            LIMIT $2 OFFSET $3
        `;
        const res = await pool.query(query, [userId, limit, offset]);
        return res.rows;
    }

    static async markAsRead(notificationIds, userId) {
        const query = `
            UPDATE notifications
            SET is_read = TRUE
            WHERE id = ANY($1) AND user_id = $2
            RETURNING *
        `;
        const res = await pool.query(query, [notificationIds, userId]);
        return res.rows;
    }

    static async markAllAsRead(userId) {
        const query = `
            UPDATE notifications
            SET is_read = TRUE
            WHERE user_id = $1
            RETURNING *
        `;
        const res = await pool.query(query, [userId]);
        return res.rows;
    }

    static async getUnreadCount(userId) {
        const query = `SELECT COUNT(*) FROM notifications WHERE user_id = $1 AND is_read = FALSE`;
        const res = await pool.query(query, [userId]);
        return parseInt(res.rows[0].count);
    }

    static async markEmailSent(notificationId) {
        const query = `UPDATE notifications SET email_sent = TRUE WHERE id = $1`;
        await pool.query(query, [notificationId]);
    }

    static async delete(id, userId) {
        const query = `DELETE FROM notifications WHERE id = $1 AND user_id = $2 RETURNING *`;
        const res = await pool.query(query, [id, userId]);
        return res.rows[0];
    }
}

module.exports = Notification;
