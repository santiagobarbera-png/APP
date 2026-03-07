'use strict';

const pool = require('../config/database');

class Profile {
    static async findByUserId(userId) {
        const { rows } = await pool.query(
            'SELECT * FROM profiles WHERE user_id = $1',
            [userId]
        );
        return rows[0] || null;
    }

    static async update(userId, data) {
        const {
            bio, age, gender, looking_for, mbti, occupation, education,
            height, latitude, longitude, city, country, photos, interests
        } = data;

        const isComplete = !!(age && gender && bio && (photos && photos.length > 0));

        const { rows } = await pool.query(
            `UPDATE profiles SET
                bio = COALESCE($1, bio),
                age = COALESCE($2, age),
                gender = COALESCE($3, gender),
                looking_for = COALESCE($4, looking_for),
                mbti = COALESCE($5, mbti),
                occupation = COALESCE($6, occupation),
                education = COALESCE($7, education),
                height = COALESCE($8, height),
                latitude = COALESCE($9, latitude),
                longitude = COALESCE($10, longitude),
                city = COALESCE($11, city),
                country = COALESCE($12, country),
                photos = COALESCE($13, photos),
                interests = COALESCE($14, interests),
                is_complete = $15,
                updated_at = NOW()
             WHERE user_id = $16
             RETURNING *`,
            [bio, age, gender, looking_for, mbti, occupation, education,
             height, latitude, longitude, city, country, photos, interests,
             isComplete, userId]
        );
        return rows[0] || null;
    }

    static async findPotentialMatches(userId, preferences) {
        const { min_age, max_age, preferred_gender, max_distance_km } = preferences;

        const userProfile = await pool.query(
            'SELECT latitude, longitude FROM profiles WHERE user_id = $1',
            [userId]
        );
        const userLat = userProfile.rows[0]?.latitude;
        const userLon = userProfile.rows[0]?.longitude;

        if (!userLat || !userLon) {
            const { rows } = await pool.query(
                `SELECT u.id, u.name,
                        p.bio, p.age, p.gender, p.mbti, p.occupation, p.education,
                        p.height, p.latitude, p.longitude, p.city, p.country,
                        p.photos, p.interests, NULL AS distance_km
                 FROM users u
                 JOIN profiles p ON p.user_id = u.id
                 WHERE u.id != $1
                   AND u.is_active = true
                   AND p.is_complete = true
                   AND ($2::int IS NULL OR p.age >= $2)
                   AND ($3::int IS NULL OR p.age <= $3)
                   AND ($4 = 'any' OR p.gender = $4)
                   AND u.id NOT IN (
                       SELECT CASE WHEN user1_id = $1 THEN user2_id ELSE user1_id END
                       FROM matches
                       WHERE (user1_id = $1 OR user2_id = $1)
                         AND status IN ('matched', 'rejected')
                   )
                 LIMIT 50`,
                [userId, min_age || 18, max_age || 99, preferred_gender || 'any']
            );
            return rows;
        }

        const { rows } = await pool.query(
            `SELECT u.id, u.name,
                    p.bio, p.age, p.gender, p.mbti, p.occupation, p.education,
                    p.height, p.latitude, p.longitude, p.city, p.country,
                    p.photos, p.interests,
                    (
                        6371 * acos(
                            LEAST(1.0, cos(radians($5)) * cos(radians(p.latitude)) *
                            cos(radians(p.longitude) - radians($6)) +
                            sin(radians($5)) * sin(radians(p.latitude)))
                        )
                    ) AS distance_km
             FROM users u
             JOIN profiles p ON p.user_id = u.id
             WHERE u.id != $1
               AND u.is_active = true
               AND p.is_complete = true
               AND ($2::int IS NULL OR p.age >= $2)
               AND ($3::int IS NULL OR p.age <= $3)
               AND ($4 = 'any' OR p.gender = $4)
               AND p.latitude IS NOT NULL
               AND p.longitude IS NOT NULL
               AND u.id NOT IN (
                   SELECT CASE WHEN user1_id = $1 THEN user2_id ELSE user1_id END
                   FROM matches
                   WHERE (user1_id = $1 OR user2_id = $1)
                     AND status IN ('matched', 'rejected')
               )
             HAVING ($7::int IS NULL OR
                    6371 * acos(
                        LEAST(1.0, cos(radians($5)) * cos(radians(p.latitude)) *
                        cos(radians(p.longitude) - radians($6)) +
                        sin(radians($5)) * sin(radians(p.latitude)))
                    ) <= $7)
             ORDER BY distance_km ASC
             LIMIT 50`,
            [userId, min_age || 18, max_age || 99, preferred_gender || 'any', userLat, userLon, max_distance_km || 100]
        );
        return rows;
    }
}

module.exports = Profile;
