'use strict';

const Match = require('../models/Match');
const Profile = require('../models/Profile');
const Notification = require('../models/Notification');
const { calculateCompatibilityScore } = require('../services/aiMatchingService');
const socketService = require('../services/socketService');
const notificationService = require('../services/notificationService');
const pool = require('../config/database');

/**
 * GET /api/matches/discover
 * Get potential matches for the current user
 */
exports.discover = async (req, res) => {
    try {
        const { rows: prefRows } = await pool.query(
            'SELECT * FROM preferences WHERE user_id = $1',
            [req.userId]
        );
        const preferences = prefRows[0] || {};

        const candidates = await Profile.findPotentialMatches(req.userId, preferences);

        // Get current user profile for score calculation
        const { rows: myRows } = await pool.query(
            `SELECT u.id, u.name, p.age, p.mbti, p.latitude, p.longitude, p.interests
             FROM users u JOIN profiles p ON p.user_id = u.id
             WHERE u.id = $1`,
            [req.userId]
        );
        const me = myRows[0];

        const scored = candidates.map(candidate => {
            const result = calculateCompatibilityScore(me, candidate, preferences);
            return { ...candidate, compatibility: result };
        }).sort((a, b) => b.compatibility.totalScore - a.compatibility.totalScore);

        return res.json({ success: true, data: { candidates: scored } });
    } catch (err) {
        console.error('Discover error:', err);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

/**
 * POST /api/matches/action
 * Like or pass on a user
 * Body: { targetUserId, action: 'like' | 'pass' }
 */
exports.action = async (req, res) => {
    try {
        const { targetUserId, action } = req.body;
        if (!targetUserId || !['like', 'pass'].includes(action)) {
            return res.status(400).json({ success: false, message: 'targetUserId and action (like/pass) are required' });
        }
        if (targetUserId === req.userId) {
            return res.status(400).json({ success: false, message: 'Cannot match with yourself' });
        }

        // Get compatibility score
        const { rows: meRows } = await pool.query(
            `SELECT u.id, u.name, p.age, p.mbti, p.latitude, p.longitude, p.interests
             FROM users u JOIN profiles p ON p.user_id = u.id
             WHERE u.id = $1`,
            [req.userId]
        );
        const { rows: themRows } = await pool.query(
            `SELECT u.id, u.name, p.age, p.mbti, p.latitude, p.longitude, p.interests
             FROM users u JOIN profiles p ON p.user_id = u.id
             WHERE u.id = $1`,
            [targetUserId]
        );

        const me = meRows[0];
        const them = themRows[0];
        if (!them) return res.status(404).json({ success: false, message: 'User not found' });

        const scoreResult = calculateCompatibilityScore(me, them);

        // Ensure match record exists
        await Match.findOrCreate(req.userId, targetUserId, scoreResult.totalScore, scoreResult.breakdown);

        const result = await Match.updateAction(req.userId, targetUserId, req.userId, action);
        if (!result) return res.status(404).json({ success: false, message: 'Match not found' });

        // If it's a new mutual match, notify both users
        if (result.isNewMatch) {
            const matchId = result.match.id;

            // Notify via Socket.io
            socketService.emitNewMatch(req.userId, targetUserId, { matchId, score: scoreResult.totalScore });

            // Create database notifications
            await notificationService.notifyNewMatch(req.userId, them.name, matchId);
            await notificationService.notifyNewMatch(targetUserId, me.name, matchId);
        }

        return res.json({
            success: true,
            message: result.isNewMatch ? "It's a match! 🎉" : `Action '${action}' recorded`,
            data: { isNewMatch: result.isNewMatch, match: result.match },
        });
    } catch (err) {
        console.error('Action error:', err);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

/**
 * GET /api/matches
 * Get all mutual matches for current user
 */
exports.getMatches = async (req, res) => {
    try {
        const matches = await Match.findByUserId(req.userId);
        return res.json({ success: true, data: { matches } });
    } catch (err) {
        console.error('GetMatches error:', err);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

/**
 * GET /api/matches/pending
 * Get pending matches (users who liked current user)
 */
exports.getPendingMatches = async (req, res) => {
    try {
        const pending = await Match.getPendingForUser(req.userId);
        return res.json({ success: true, data: { pending } });
    } catch (err) {
        console.error('GetPendingMatches error:', err);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};
