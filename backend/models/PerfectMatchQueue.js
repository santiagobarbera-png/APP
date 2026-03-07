'use strict';

const pool = require('../config/database');

class PerfectMatchQueue {
    static async upsert({ userId, matchedUserId, score, scoreDetails }) {
        const { rows } = await pool.query(
            `INSERT INTO perfect_matches_queue (user_id, matched_user_id, score, score_details)
             VALUES ($1, $2, $3, $4)
             ON CONFLICT (user_id, matched_user_id) DO UPDATE SET
                score = EXCLUDED.score,
                score_details = EXCLUDED.score_details,
                notification_sent = false,
                processed = false,
                created_at = NOW()
             RETURNING *`,
            [userId, matchedUserId, score, JSON.stringify(scoreDetails || {})]
        );
        return rows[0];
    }

    static async findUnsentForUser(userId) {
        const { rows } = await pool.query(
            `SELECT pmq.*,
                    u.name AS matched_user_name,
                    u.email AS matched_user_email,
                    p.photos AS matched_photos,
                    p.age AS matched_age,
                    p.city AS matched_city,
                    p.mbti AS matched_mbti
             FROM perfect_matches_queue pmq
             JOIN users u ON u.id = pmq.matched_user_id
             JOIN profiles p ON p.user_id = u.id
             WHERE pmq.user_id = $1 AND pmq.notification_sent = false
             ORDER BY pmq.score DESC`,
            [userId]
        );
        return rows;
    }

    static async findAllUnsent(limit = 500) {
        const { rows } = await pool.query(
            `SELECT pmq.*,
                    u.name AS user_name,
                    u.email AS user_email,
                    mu.name AS matched_user_name,
                    mp.photos AS matched_photos,
                    mp.age AS matched_age,
                    mp.city AS matched_city
             FROM perfect_matches_queue pmq
             JOIN users u ON u.id = pmq.user_id
             JOIN users mu ON mu.id = pmq.matched_user_id
             JOIN profiles mp ON mp.user_id = mu.id
             WHERE pmq.notification_sent = false
               AND u.is_active = true
             ORDER BY pmq.score DESC
             LIMIT $1`,
            [limit]
        );
        return rows;
    }

    static async markNotificationSent(ids) {
        if (!ids || ids.length === 0) return;
        await pool.query(
            `UPDATE perfect_matches_queue
             SET notification_sent = true, processed = true, processed_at = NOW()
             WHERE id = ANY($1::uuid[])`,
            [ids]
        );
    }
}

module.exports = PerfectMatchQueue;
