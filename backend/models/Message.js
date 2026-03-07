'use strict';

const pool = require('../config/database');

class Message {
    static async create({ matchId, senderId, content, messageType = 'text' }) {
        const { rows } = await pool.query(
            `INSERT INTO messages (match_id, sender_id, content, message_type)
             VALUES ($1, $2, $3, $4)
             RETURNING *`,
            [matchId, senderId, content, messageType]
        );
        return rows[0];
    }

    static async findByMatchId(matchId, limit = 50, offset = 0) {
        const { rows } = await pool.query(
            `SELECT m.*, u.name AS sender_name
             FROM messages m
             JOIN users u ON u.id = m.sender_id
             WHERE m.match_id = $1
             ORDER BY m.created_at ASC
             LIMIT $2 OFFSET $3`,
            [matchId, limit, offset]
        );
        return rows;
    }

    static async markAsRead(matchId, userId) {
        const { rows } = await pool.query(
            `UPDATE messages SET is_read = true, read_at = NOW()
             WHERE match_id = $1 AND sender_id != $2 AND is_read = false
             RETURNING id`,
            [matchId, userId]
        );
        return rows.length;
    }

    static async deleteById(messageId, userId) {
        const { rows } = await pool.query(
            'DELETE FROM messages WHERE id = $1 AND sender_id = $2 RETURNING id',
            [messageId, userId]
        );
        return rows[0] || null;
    }

    static async getUnreadCount(userId) {
        const { rows } = await pool.query(
            `SELECT COUNT(*) AS unread_count
             FROM messages msg
             JOIN matches m ON m.id = msg.match_id
             WHERE (m.user1_id = $1 OR m.user2_id = $1)
               AND msg.sender_id != $1
               AND msg.is_read = false`,
            [userId]
        );
        return parseInt(rows[0].unread_count, 10);
    }
}

module.exports = Message;
