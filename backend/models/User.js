'use strict';

const pool = require('../config/database');

class User {
    static async create({ email, password, name }) {
        const { rows } = await pool.query(
            `INSERT INTO users (email, password, name)
             VALUES ($1, $2, $3)
             RETURNING id, email, name, is_active, is_verified, created_at`,
            [email.toLowerCase().trim(), password, name.trim()]
        );
        return rows[0];
    }

    static async findById(id) {
        const { rows } = await pool.query(
            `SELECT u.id, u.email, u.name, u.is_active, u.is_verified, u.last_login, u.created_at,
                    p.bio, p.age, p.gender, p.looking_for, p.mbti, p.occupation, p.education,
                    p.height, p.latitude, p.longitude, p.city, p.country, p.photos, p.interests, p.is_complete
             FROM users u
             LEFT JOIN profiles p ON p.user_id = u.id
             WHERE u.id = $1 AND u.is_active = true`,
            [id]
        );
        return rows[0] || null;
    }

    static async findByEmail(email) {
        const { rows } = await pool.query(
            `SELECT u.*, p.mbti, p.latitude, p.longitude
             FROM users u
             LEFT JOIN profiles p ON p.user_id = u.id
             WHERE u.email = $1 AND u.is_active = true`,
            [email.toLowerCase().trim()]
        );
        return rows[0] || null;
    }

    static async updateLastLogin(id) {
        await pool.query(
            'UPDATE users SET last_login = NOW() WHERE id = $1',
            [id]
        );
    }

    static async updatePassword(id, hashedPassword) {
        await pool.query(
            'UPDATE users SET password = $1, updated_at = NOW() WHERE id = $2',
            [hashedPassword, id]
        );
    }

    static async delete(id) {
        const { rows } = await pool.query(
            'UPDATE users SET is_active = false, updated_at = NOW() WHERE id = $1 RETURNING id',
            [id]
        );
        return rows[0] || null;
    }

    static async findAllActive() {
        const { rows } = await pool.query(
            `SELECT u.id, u.email, u.name,
                    p.age, p.gender, p.mbti, p.latitude, p.longitude, p.interests, p.is_complete
             FROM users u
             LEFT JOIN profiles p ON p.user_id = u.id
             WHERE u.is_active = true AND p.is_complete = true`
        );
        return rows;
    }
}

module.exports = User;