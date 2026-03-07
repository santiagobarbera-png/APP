'use strict';

const User = require('../models/User');
const Profile = require('../models/Profile');
const pool = require('../config/database');

/**
 * GET /api/users/profile
 * Get current user's full profile
 */
exports.getMyProfile = async (req, res) => {
    try {
        const user = await User.findById(req.userId);
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });
        const { password: _pw, ...safeUser } = user;
        return res.json({ success: true, data: { user: safeUser } });
    } catch (err) {
        console.error('GetMyProfile error:', err);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

/**
 * PUT /api/users/profile
 * Update current user's profile
 */
exports.updateProfile = async (req, res) => {
    try {
        const {
            bio, age, gender, looking_for, mbti, occupation,
            education, height, latitude, longitude, city, country,
            photos, interests,
        } = req.body;

        // Validate age if provided
        if (age !== undefined && (age < 18 || age > 120)) {
            return res.status(400).json({ success: false, message: 'Age must be between 18 and 120' });
        }

        const validMBTI = ['INTJ','INTP','ENTJ','ENTP','INFJ','INFP','ENFJ','ENFP',
                           'ISTJ','ISFJ','ESTJ','ESFJ','ISTP','ISFP','ESTP','ESFP'];
        if (mbti && !validMBTI.includes(mbti.toUpperCase())) {
            return res.status(400).json({ success: false, message: 'Invalid MBTI type' });
        }

        const profile = await Profile.update(req.userId, {
            bio, age, gender, looking_for,
            mbti: mbti ? mbti.toUpperCase() : undefined,
            occupation, education, height,
            latitude, longitude, city, country, photos, interests,
        });

        return res.json({ success: true, message: 'Profile updated', data: { profile } });
    } catch (err) {
        console.error('UpdateProfile error:', err);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

/**
 * GET /api/users/preferences
 * Get current user's match preferences
 */
exports.getPreferences = async (req, res) => {
    try {
        const { rows } = await pool.query(
            'SELECT * FROM preferences WHERE user_id = $1',
            [req.userId]
        );
        return res.json({ success: true, data: { preferences: rows[0] || {} } });
    } catch (err) {
        console.error('GetPreferences error:', err);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

/**
 * PUT /api/users/preferences
 * Update current user's match preferences
 */
exports.updatePreferences = async (req, res) => {
    try {
        const { min_age, max_age, preferred_gender, max_distance_km, mbti_preferences } = req.body;

        const { rows } = await pool.query(
            `UPDATE preferences SET
                min_age = COALESCE($1, min_age),
                max_age = COALESCE($2, max_age),
                preferred_gender = COALESCE($3, preferred_gender),
                max_distance_km = COALESCE($4, max_distance_km),
                mbti_preferences = COALESCE($5, mbti_preferences),
                updated_at = NOW()
             WHERE user_id = $6
             RETURNING *`,
            [min_age, max_age, preferred_gender, max_distance_km,
             mbti_preferences ? JSON.stringify(mbti_preferences) : null, req.userId]
        );

        return res.json({ success: true, message: 'Preferences updated', data: { preferences: rows[0] } });
    } catch (err) {
        console.error('UpdatePreferences error:', err);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

/**
 * GET /api/users/:id
 * Get public profile of another user
 */
exports.getUserById = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await User.findById(id);
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        // Return only public fields
        const publicProfile = {
            id: user.id, name: user.name,
            bio: user.bio, age: user.age, gender: user.gender,
            mbti: user.mbti, occupation: user.occupation,
            city: user.city, country: user.country,
            photos: user.photos, interests: user.interests,
        };
        return res.json({ success: true, data: { user: publicProfile } });
    } catch (err) {
        console.error('GetUserById error:', err);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

/**
 * DELETE /api/users/account
 * Soft-delete user account
 */
exports.deleteAccount = async (req, res) => {
    try {
        await User.delete(req.userId);
        return res.json({ success: true, message: 'Account deleted successfully' });
    } catch (err) {
        console.error('DeleteAccount error:', err);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};
