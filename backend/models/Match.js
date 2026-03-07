'use strict';

const pool = require('../config/database');

class Match {
    static async save(matchData) {
        const {
            user_id_1, user_id_2, compatibility_score,
            mbti_score, age_score, distance_score, interests_score,
            status, is_perfect_match,
        } = matchData;

        // Enforce ordering constraint
        const uid1 = Math.min(user_id_1, user_id_2);
        const uid2 = Math.max(user_id_1, user_id_2);

        const query = `
            INSERT INTO matches (
                user_id_1, user_id_2, compatibility_score,
                mbti_score, age_score, distance_score, interests_score,
                status, is_perfect_match
            ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
            RETURNING *
        `;
        const values = [
            uid1, uid2,
            compatibility_score || null,
            mbti_score || null,
            age_score || null,
            distance_score || null,
            interests_score || null,
            status || 'pending',
            is_perfect_match || false,
        ];
        const res = await pool.query(query, values);
        return res.rows[0];
    }

    static async findById(id) {
        const res = await pool.query('SELECT * FROM matches WHERE id = $1', [id]);
        return res.rows[0] || null;
    }

    static async findByUserId(userId) {
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
        const res = await pool.query(query, [userId]);
        return res.rows;
    }

    static async findPendingMatches(userId) {
        const query = `
            SELECT m.*,
                   u1.name AS user1_name, u1.profile_photo_url AS user1_photo,
                   u2.name AS user2_name, u2.profile_photo_url AS user2_photo
            FROM matches m
            JOIN users u1 ON u1.id = m.user_id_1
            JOIN users u2 ON u2.id = m.user_id_2
            WHERE (m.user_id_1 = $1 OR m.user_id_2 = $1)
              AND m.status = 'pending'
            ORDER BY m.created_at DESC
        `;
        const res = await pool.query(query, [userId]);
        return res.rows;
    }

    static async updateStatus(id, status) {
        const res = await pool.query(
            `UPDATE matches SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
            [status, id]
        );
        return res.rows[0] || null;
    }

    static async delete(id) {
        const res = await pool.query('DELETE FROM matches WHERE id = $1 RETURNING *', [id]);
        return res.rows[0] || null;
    }

    static async exists(userId1, userId2) {
        const uid1 = Math.min(userId1, userId2);
        const uid2 = Math.max(userId1, userId2);
        const res = await pool.query(
            'SELECT id FROM matches WHERE user_id_1 = $1 AND user_id_2 = $2',
            [uid1, uid2]
        );
        return res.rows.length > 0;
    }
}

module.exports = Match;
