'use strict';

const pool = require('../config/database');
const { calculateCompatibilityScore } = require('../services/aiMatchingService');

const getMatches = async (req, res) => {
    try {
        const query = `
            SELECT m.*,
                   u1.name AS user1_name, u1.profile_photo_url AS user1_photo,
                   u2.name AS user2_name, u2.profile_photo_url AS user2_photo
            FROM matches m
            JOIN users u1 ON u1.id = m.user_id_1
            JOIN users u2 ON u2.id = m.user_id_2
            WHERE m.user_id_1 = $1 OR m.user_id_2 = $1
            ORDER BY m.created_at DESC
        `;
        const result = await pool.query(query, [req.userId]);
        return res.json({ matches: result.rows });
    } catch (error) {
        console.error('Error getting matches:', error.message);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

const createMatch = async (req, res) => {
    try {
        const { targetUserId } = req.body;
        if (!targetUserId) {
            return res.status(400).json({ error: 'targetUserId is required' });
        }
        if (parseInt(targetUserId) === req.userId) {
            return res.status(400).json({ error: 'Cannot match with yourself' });
        }

        const uid1 = Math.min(req.userId, parseInt(targetUserId));
        const uid2 = Math.max(req.userId, parseInt(targetUserId));

        const existingMatch = await pool.query(
            'SELECT id FROM matches WHERE user_id_1 = $1 AND user_id_2 = $2',
            [uid1, uid2]
        );
        if (existingMatch.rows.length > 0) {
            return res.status(409).json({ error: 'Match already exists' });
        }

        const usersResult = await pool.query(
            'SELECT * FROM users WHERE id = ANY($1) AND is_active = TRUE',
            [[req.userId, parseInt(targetUserId)]]
        );
        if (usersResult.rows.length < 2) {
            return res.status(404).json({ error: 'One or both users not found' });
        }

        const user1 = usersResult.rows.find(u => u.id === uid1);
        const user2 = usersResult.rows.find(u => u.id === uid2);
        const scores = calculateCompatibilityScore(user1, user2);

        const insertQuery = `
            INSERT INTO matches (
                user_id_1, user_id_2, compatibility_score,
                mbti_score, age_score, distance_score, interests_score,
                status, is_perfect_match
            ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
            RETURNING *
        `;
        const result = await pool.query(insertQuery, [
            uid1, uid2,
            scores.totalScore,
            scores.mbtiScore,
            scores.ageScore,
            scores.distanceScore,
            scores.interestsScore,
            'pending',
            scores.totalScore >= 80,
        ]);

        return res.status(201).json({ match: result.rows[0] });
    } catch (error) {
        console.error('Error creating match:', error.message);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

const updateMatchStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const validStatuses = ['pending', 'accepted', 'rejected', 'blocked'];
        if (!status || !validStatuses.includes(status)) {
            return res.status(400).json({ error: `Status must be one of: ${validStatuses.join(', ')}` });
        }

        const matchResult = await pool.query('SELECT * FROM matches WHERE id = $1', [id]);
        if (matchResult.rows.length === 0) {
            return res.status(404).json({ error: 'Match not found' });
        }
        const match = matchResult.rows[0];
        if (match.user_id_1 !== req.userId && match.user_id_2 !== req.userId) {
            return res.status(403).json({ error: 'Forbidden' });
        }

        const result = await pool.query(
            'UPDATE matches SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
            [status, id]
        );
        return res.json({ match: result.rows[0] });
    } catch (error) {
        console.error('Error updating match status:', error.message);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

const deleteMatch = async (req, res) => {
    try {
        const { id } = req.params;
        const matchResult = await pool.query('SELECT * FROM matches WHERE id = $1', [id]);
        if (matchResult.rows.length === 0) {
            return res.status(404).json({ error: 'Match not found' });
        }
        const match = matchResult.rows[0];
        if (match.user_id_1 !== req.userId && match.user_id_2 !== req.userId) {
            return res.status(403).json({ error: 'Forbidden' });
        }

        await pool.query('DELETE FROM matches WHERE id = $1', [id]);
        return res.json({ message: 'Match deleted successfully' });
    } catch (error) {
        console.error('Error deleting match:', error.message);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

const getPerfectMatches = async (req, res) => {
    try {
        const query = `
            SELECT pmq.*, u.name AS match_user_name,
                   u.profile_photo_url, u.mbti_type, u.bio
            FROM perfect_matches_queue pmq
            JOIN users u ON u.id = pmq.match_user_id
            WHERE pmq.user_id = $1
            ORDER BY pmq.compatibility_score DESC
        `;
        const result = await pool.query(query, [req.userId]);
        return res.json({ perfectMatches: result.rows });
    } catch (error) {
        console.error('Error getting perfect matches:', error.message);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

module.exports = { getMatches, createMatch, updateMatchStatus, deleteMatch, getPerfectMatches };
