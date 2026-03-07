'use strict';

const pool = require('../config/database');

class Message {
    static async save(messageData) {
        const { sender_id, receiver_id, content } = messageData;
        const query = `
            INSERT INTO messages (sender_id, receiver_id, content)
            VALUES ($1, $2, $3)
            RETURNING *
        `;
        const res = await pool.query(query, [sender_id, receiver_id, content]);
        return res.rows[0];
    }

    static async findById(id) {
        const res = await pool.query('SELECT * FROM messages WHERE id = $1', [id]);
        return res.rows[0] || null;
    }

    static async findConversation(userId1, userId2, limit = 50, offset = 0) {
        const query = `
            SELECT m.*, u.name AS sender_name
            FROM messages m
            JOIN users u ON u.id = m.sender_id
            WHERE (m.sender_id = $1 AND m.receiver_id = $2)
               OR (m.sender_id = $2 AND m.receiver_id = $1)
            ORDER BY m.created_at ASC
            LIMIT $3 OFFSET $4
        `;
        const res = await pool.query(query, [userId1, userId2, limit, offset]);
        return res.rows;
    }

    static async markAsRead(messageIds, receiverId) {
        const query = `
            UPDATE messages
            SET is_read = TRUE
            WHERE id = ANY($1) AND receiver_id = $2
            RETURNING *
        `;
        const res = await pool.query(query, [messageIds, receiverId]);
        return res.rows;
    }

    static async delete(id, userId) {
        const query = `
            DELETE FROM messages
            WHERE id = $1 AND (sender_id = $2 OR receiver_id = $2)
            RETURNING *
        `;
        const res = await pool.query(query, [id, userId]);
        return res.rows[0] || null;
    }

    static async getUnreadCount(userId) {
        const res = await pool.query(
            'SELECT COUNT(*) FROM messages WHERE receiver_id = $1 AND is_read = FALSE',
            [userId]
        );
        return parseInt(res.rows[0].count);
    }
}

module.exports = Message;
