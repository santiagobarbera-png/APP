'use strict';

const pool = require('../config/database');

class User {
    static async save(userData) {
        const {
            name, email, password_hash, birth_date, gender,
            location_lat, location_lon, location_name, bio,
            profile_photo_url, mbti_type,
            openness, conscientiousness, extraversion, agreeableness, neuroticism,
            interests,
        } = userData;

        const query = `
            INSERT INTO users (
                name, email, password_hash, birth_date, gender,
                location_lat, location_lon, location_name, bio,
                profile_photo_url, mbti_type,
                openness, conscientiousness, extraversion, agreeableness, neuroticism,
                interests
            ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)
            RETURNING *
        `;
        const values = [
            name, email, password_hash, birth_date || null, gender || null,
            location_lat || null, location_lon || null, location_name || null, bio || null,
            profile_photo_url || null, mbti_type || null,
            openness || null, conscientiousness || null, extraversion || null,
            agreeableness || null, neuroticism || null,
            interests || null,
        ];
        const res = await pool.query(query, values);
        return res.rows[0];
    }

    static async findById(id) {
        const res = await pool.query(
            'SELECT * FROM users WHERE id = $1 AND is_active = TRUE',
            [id]
        );
        return res.rows[0] || null;
    }

    static async findByEmail(email) {
        const res = await pool.query(
            'SELECT * FROM users WHERE email = $1',
            [email.toLowerCase()]
        );
        return res.rows[0] || null;
    }

    static async findAll(filters = {}) {
        const { limit = 20, offset = 0, gender, mbti_type } = filters;
        const conditions = ['is_active = TRUE'];
        const values = [];
        let idx = 1;

        if (gender) {
            conditions.push(`gender = $${idx++}`);
            values.push(gender);
        }
        if (mbti_type) {
            conditions.push(`mbti_type = $${idx++}`);
            values.push(mbti_type);
        }

        values.push(limit, offset);
        const query = `
            SELECT id, name, email, birth_date, gender, location_name,
                   bio, profile_photo_url, mbti_type, interests, created_at
            FROM users
            WHERE ${conditions.join(' AND ')}
            ORDER BY created_at DESC
            LIMIT $${idx++} OFFSET $${idx}
        `;
        const res = await pool.query(query, values);
        return res.rows;
    }

    static async findCompatibleUsers(userId) {
        const query = `
            SELECT u.*, up.min_age, up.max_age, up.preferred_genders, up.max_distance_km
            FROM users u
            LEFT JOIN user_preferences up ON u.id = up.user_id
            WHERE u.id != $1
              AND u.is_active = TRUE
              AND u.mbti_type IS NOT NULL
              AND u.id NOT IN (
                  SELECT CASE WHEN user_id_1 = $1 THEN user_id_2 ELSE user_id_1 END
                  FROM matches
                  WHERE user_id_1 = $1 OR user_id_2 = $1
              )
            ORDER BY u.created_at DESC
            LIMIT 50
        `;
        const res = await pool.query(query, [userId]);
        return res.rows;
    }

    static async update(id, userData) {
        const allowed = [
            'name', 'bio', 'birth_date', 'gender',
            'location_lat', 'location_lon', 'location_name',
            'profile_photo_url', 'mbti_type', 'interests',
            'openness', 'conscientiousness', 'extraversion',
            'agreeableness', 'neuroticism',
        ];
        const setClauses = [];
        const values = [];
        let idx = 1;

        for (const key of allowed) {
            if (userData[key] !== undefined) {
                setClauses.push(`${key} = $${idx++}`);
                values.push(userData[key]);
            }
        }
        if (setClauses.length === 0) return this.findById(id);

        setClauses.push(`updated_at = NOW()`);
        values.push(id);

        const query = `
            UPDATE users SET ${setClauses.join(', ')}
            WHERE id = $${idx} RETURNING *
        `;
        const res = await pool.query(query, values);
        return res.rows[0] || null;
    }

    static async delete(id) {
        const res = await pool.query(
            'DELETE FROM users WHERE id = $1 RETURNING *',
            [id]
        );
        return res.rows[0] || null;
    }

    static async updateLastActive(id) {
        await pool.query(
            'UPDATE users SET updated_at = NOW() WHERE id = $1',
            [id]
        );
    }
}

module.exports = User;
