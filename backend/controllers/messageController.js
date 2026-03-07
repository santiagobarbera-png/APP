'use strict';

const pool = require('../config/database');

const sendMessage = async (req, res) => {
    try {
        const { receiverId, content } = req.body;
        if (!receiverId || !content) {
            return res.status(400).json({ error: 'receiverId and content are required' });
        }
        if (content.trim().length === 0) {
            return res.status(400).json({ error: 'Message content cannot be empty' });
        }
        if (content.length > 2000) {
            return res.status(400).json({ error: 'Message too long (max 2000 chars)' });
        }
        if (parseInt(receiverId) === req.userId) {
            return res.status(400).json({ error: 'Cannot send message to yourself' });
        }

        const receiverCheck = await pool.query(
            'SELECT id FROM users WHERE id = $1 AND is_active = TRUE',
            [receiverId]
        );
        if (receiverCheck.rows.length === 0) {
            return res.status(404).json({ error: 'Receiver not found' });
        }

        const result = await pool.query(
            'INSERT INTO messages (sender_id, receiver_id, content) VALUES ($1, $2, $3) RETURNING *',
            [req.userId, receiverId, content.trim()]
        );
        return res.status(201).json({ message: result.rows[0] });
    } catch (error) {
        console.error('Error sending message:', error.message);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

const getConversationHistory = async (req, res) => {
    try {
        const { userId1, userId2 } = req.params;
        if (parseInt(userId1) !== req.userId && parseInt(userId2) !== req.userId) {
            return res.status(403).json({ error: 'Forbidden: not part of this conversation' });
        }

        const limit = parseInt(req.query.limit) || 50;
        const offset = parseInt(req.query.offset) || 0;

        const query = `
            SELECT m.*, u.name AS sender_name
            FROM messages m
            JOIN users u ON u.id = m.sender_id
            WHERE (m.sender_id = $1 AND m.receiver_id = $2)
               OR (m.sender_id = $2 AND m.receiver_id = $1)
            ORDER BY m.created_at ASC
            LIMIT $3 OFFSET $4
        `;
        const result = await pool.query(query, [userId1, userId2, limit, offset]);
        return res.json({ messages: result.rows });
    } catch (error) {
        console.error('Error getting conversation:', error.message);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

const markMessagesAsRead = async (req, res) => {
    try {
        const { messageIds } = req.body;
        if (!messageIds || !Array.isArray(messageIds) || messageIds.length === 0) {
            return res.status(400).json({ error: 'messageIds array is required' });
        }

        const result = await pool.query(
            'UPDATE messages SET is_read = TRUE WHERE id = ANY($1) AND receiver_id = $2 RETURNING *',
            [messageIds, req.userId]
        );
        return res.json({ updated: result.rows, message: 'Messages marked as read' });
    } catch (error) {
        console.error('Error marking messages as read:', error.message);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

const deleteMessage = async (req, res) => {
    try {
        const { messageId } = req.params;
        const result = await pool.query(
            'DELETE FROM messages WHERE id = $1 AND (sender_id = $2 OR receiver_id = $2) RETURNING *',
            [messageId, req.userId]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Message not found' });
        }
        return res.json({ message: 'Message deleted successfully' });
    } catch (error) {
        console.error('Error deleting message:', error.message);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

module.exports = { sendMessage, getConversationHistory, markMessagesAsRead, deleteMessage };
