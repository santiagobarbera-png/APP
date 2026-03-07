'use strict';

const pool = require('../config/database');

class Match {
    static async findOrCreate(user1Id, user2Id, score, scoreDetails) {
        // Ensure consistent ordering: user1 < user2 lexicographically
        const [uid1, uid2] = [user1Id, user2Id].sort();
        const { rows } = await pool.query(
            `INSERT INTO matches (user1_id, user2_id, score, score_details)
             VALUES ($1, $2, $3, $4)
             ON CONFLICT (user1_id, user2_id) DO UPDATE SET updated_at = NOW()
             RETURNING *`,
            [uid1, uid2, score, JSON.stringify(scoreDetails || {})]
        );
        return rows[0];
    }

    static async findByUserId(userId) {
        const { rows } = await pool.query(
            `SELECT m.*,
                    u.name AS other_name,
                    p.photos AS other_photos,
                    p.bio AS other_bio,
                    p.age AS other_age,
                    p.city AS other_city
             FROM matches m
             JOIN users u ON u.id = CASE WHEN m.user1_id = $1 THEN m.user2_id ELSE m.user1_id END
             JOIN profiles p ON p.user_id = u.id
             WHERE (m.user1_id = $1 OR m.user2_id = $1)
               AND m.status = 'matched'
             ORDER BY m.matched_at DESC`,
            [userId]
        );
        return rows;
    }

    static async findById(matchId) {
        const { rows } = await pool.query(
            'SELECT * FROM matches WHERE id = $1',
            [matchId]
        );
        return rows[0] || null;
    }

    static async updateAction(user1Id, user2Id, actingUserId, action) {
        const [uid1, uid2] = [user1Id, user2Id].sort();
        const isUser1 = actingUserId === uid1;
        const column = isUser1 ? 'user1_action' : 'user2_action';

        const { rows } = await pool.query(
            `UPDATE matches SET ${column} = $1, updated_at = NOW()
             WHERE user1_id = $2 AND user2_id = $3
             RETURNING *`,
            [action, uid1, uid2]
        );

        if (!rows[0]) return null;
        const match = rows[0];

        // Check if both liked => mark as matched
        if (match.user1_action === 'like' && match.user2_action === 'like') {
            const { rows: updated } = await pool.query(
                `UPDATE matches SET status = 'matched', matched_at = NOW(), updated_at = NOW()
                 WHERE user1_id = $1 AND user2_id = $2
                 RETURNING *`,
                [uid1, uid2]
            );
            return { match: updated[0], isNewMatch: true };
        }

        if (match.user1_action === 'pass' || match.user2_action === 'pass') {
            await pool.query(
                `UPDATE matches SET status = 'rejected', updated_at = NOW()
                 WHERE user1_id = $1 AND user2_id = $2`,
                [uid1, uid2]
            );
        }

        return { match: rows[0], isNewMatch: false };
    }

    static async getPendingForUser(userId) {
        const { rows } = await pool.query(
            `SELECT m.*,
                    u.name AS other_name,
                    p.photos AS other_photos,
                    p.bio AS other_bio,
                    p.age AS other_age,
                    p.gender AS other_gender,
                    p.city AS other_city,
                    p.interests AS other_interests,
                    p.mbti AS other_mbti
             FROM matches m
             JOIN users u ON u.id = CASE WHEN m.user1_id = $1 THEN m.user2_id ELSE m.user1_id END
             JOIN profiles p ON p.user_id = u.id
             WHERE (m.user1_id = $1 OR m.user2_id = $1)
               AND m.status = 'pending'
               AND (
                   (m.user1_id = $1 AND m.user1_action = 'pending') OR
                   (m.user2_id = $1 AND m.user2_action = 'pending')
               )
             ORDER BY m.score DESC`,
            [userId]
        );
        return rows;
    }

    static async verifyUserInMatch(matchId, userId) {
        const { rows } = await pool.query(
            'SELECT id FROM matches WHERE id = $1 AND (user1_id = $2 OR user2_id = $2)',
            [matchId, userId]
        );
        return rows.length > 0;
    }
}

module.exports = Match;
