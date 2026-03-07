'use strict';

const pool = require('../config/database');

const getMe = async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT id, name, email, birth_date, gender, location_lat, location_lon,
                    location_name, bio, profile_photo_url, mbti_type, interests,
                    openness, conscientiousness, extraversion, agreeableness, neuroticism,
                    created_at, updated_at
             FROM users WHERE id = $1 AND is_active = TRUE`,
            [req.userId]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        return res.json({ user: result.rows[0] });
    } catch (error) {
        console.error('Error getting own profile:', error.message);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

const getUserProfile = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query(
            `SELECT id, name, birth_date, gender, location_name, bio,
                    profile_photo_url, mbti_type, interests, created_at
             FROM users WHERE id = $1 AND is_active = TRUE`,
            [id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        return res.json({ user: result.rows[0] });
    } catch (error) {
        console.error('Error getting user profile:', error.message);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

const updateUserProfile = async (req, res) => {
    try {
        const { id } = req.params;
        if (parseInt(id) !== req.userId) {
            return res.status(403).json({ error: 'Forbidden: cannot update another user\'s profile' });
        }

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
            if (req.body[key] !== undefined) {
                setClauses.push(`${key} = $${idx++}`);
                values.push(req.body[key]);
            }
        }

        if (setClauses.length === 0) {
            return res.status(400).json({ error: 'No valid fields provided for update' });
        }

        setClauses.push(`updated_at = NOW()`);
        values.push(id);

        const query = `
            UPDATE users SET ${setClauses.join(', ')}
            WHERE id = $${idx} AND is_active = TRUE
            RETURNING id, name, email, birth_date, gender, location_lat, location_lon,
                      location_name, bio, profile_photo_url, mbti_type, interests, updated_at
        `;
        const result = await pool.query(query, values);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        return res.json({ user: result.rows[0] });
    } catch (error) {
        console.error('Error updating user profile:', error.message);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

const getUserPreferences = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query(
            'SELECT * FROM user_preferences WHERE user_id = $1',
            [id]
        );
        if (result.rows.length === 0) {
            return res.json({ preferences: { user_id: parseInt(id), min_age: 18, max_age: 99, preferred_genders: [], max_distance_km: 100 } });
        }
        return res.json({ preferences: result.rows[0] });
    } catch (error) {
        console.error('Error getting user preferences:', error.message);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

const updateUserPreferences = async (req, res) => {
    try {
        const { id } = req.params;
        if (parseInt(id) !== req.userId) {
            return res.status(403).json({ error: 'Forbidden: cannot update another user\'s preferences' });
        }

        const { min_age, max_age, preferred_genders, max_distance_km } = req.body;

        const query = `
            INSERT INTO user_preferences (user_id, min_age, max_age, preferred_genders, max_distance_km)
            VALUES ($1, $2, $3, $4, $5)
            ON CONFLICT (user_id) DO UPDATE SET
                min_age = EXCLUDED.min_age,
                max_age = EXCLUDED.max_age,
                preferred_genders = EXCLUDED.preferred_genders,
                max_distance_km = EXCLUDED.max_distance_km,
                updated_at = NOW()
            RETURNING *
        `;
        const result = await pool.query(query, [
            id,
            min_age || 18,
            max_age || 99,
            preferred_genders || [],
            max_distance_km || 100,
        ]);
        return res.json({ preferences: result.rows[0] });
    } catch (error) {
        console.error('Error updating user preferences:', error.message);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

const deleteUserAccount = async (req, res) => {
    try {
        const { id } = req.params;
        if (parseInt(id) !== req.userId) {
            return res.status(403).json({ error: 'Forbidden: cannot delete another user\'s account' });
        }

        const result = await pool.query(
            'UPDATE users SET is_active = FALSE, updated_at = NOW() WHERE id = $1 AND is_active = TRUE RETURNING id',
            [id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        return res.json({ message: 'Account deactivated successfully' });
    } catch (error) {
        console.error('Error deleting user account:', error.message);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

module.exports = {
    getMe,
    getUserProfile,
    updateUserProfile,
    getUserPreferences,
    updateUserPreferences,
    deleteUserAccount,
};
