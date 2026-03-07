'use strict';

const Message = require('../models/Message');
const Match = require('../models/Match');
const socketService = require('../services/socketService');
const notificationService = require('../services/notificationService');
const pool = require('../config/database');

/**
 * POST /api/messages
 * Send a message in a match
 * Body: { matchId, content, messageType? }
 */
exports.sendMessage = async (req, res) => {
    try {
        const { matchId, content, messageType = 'text' } = req.body;
        if (!matchId || !content) {
            return res.status(400).json({ success: false, message: 'matchId and content are required' });
        }
        if (content.trim().length === 0) {
            return res.status(400).json({ success: false, message: 'Message cannot be empty' });
        }

        // Verify this user is part of the match
        const isValid = await Match.verifyUserInMatch(matchId, req.userId);
        if (!isValid) {
            return res.status(403).json({ success: false, message: 'You are not part of this match' });
        }

        // Verify match is actually 'matched' (mutual)
        const match = await Match.findById(matchId);
        if (!match || match.status !== 'matched') {
            return res.status(403).json({ success: false, message: 'Cannot send message - not a mutual match' });
        }

        const message = await Message.create({
            matchId,
            senderId: req.userId,
            content: content.trim(),
            messageType,
        });

        // Real-time emit
        socketService.emitMessage(matchId, message);

        // Notify the OTHER user
        const recipientId = match.user1_id === req.userId ? match.user2_id : match.user1_id;
        const { rows } = await pool.query('SELECT name FROM users WHERE id = $1', [req.userId]);
        const senderName = rows[0]?.name || 'Someone';

        await notificationService.notifyNewMessage(recipientId, senderName, matchId, content.trim());

        return res.status(201).json({ success: true, data: { message } });
    } catch (err) {
        console.error('SendMessage error:', err);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

/**
 * GET /api/messages/:matchId
 * Get conversation history for a match
 */
exports.getConversation = async (req, res) => {
    try {
        const { matchId } = req.params;
        const limit = parseInt(req.query.limit, 10) || 50;
        const offset = parseInt(req.query.offset, 10) || 0;

        // Verify user is in match
        const isValid = await Match.verifyUserInMatch(matchId, req.userId);
        if (!isValid) {
            return res.status(403).json({ success: false, message: 'You are not part of this match' });
        }

        const messages = await Message.findByMatchId(matchId, limit, offset);

        // Mark messages as read
        await Message.markAsRead(matchId, req.userId);

        return res.json({ success: true, data: { messages } });
    } catch (err) {
        console.error('GetConversation error:', err);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

/**
 * PUT /api/messages/:matchId/read
 * Mark all messages in a match as read
 */
exports.markAsRead = async (req, res) => {
    try {
        const { matchId } = req.params;
        const isValid = await Match.verifyUserInMatch(matchId, req.userId);
        if (!isValid) {
            return res.status(403).json({ success: false, message: 'You are not part of this match' });
        }
        const count = await Message.markAsRead(matchId, req.userId);
        return res.json({ success: true, message: `Marked ${count} messages as read` });
    } catch (err) {
        console.error('MarkAsRead error:', err);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

/**
 * DELETE /api/messages/:messageId
 * Delete a message (only sender can delete)
 */
exports.deleteMessage = async (req, res) => {
    try {
        const { messageId } = req.params;
        const deleted = await Message.deleteById(messageId, req.userId);
        if (!deleted) {
            return res.status(404).json({ success: false, message: 'Message not found or not authorized' });
        }
        return res.json({ success: true, message: 'Message deleted' });
    } catch (err) {
        console.error('DeleteMessage error:', err);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};
