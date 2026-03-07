'use strict';

require('dotenv').config();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * POST /api/auth/register
 */
exports.register = async (req, res) => {
    try {
        const { email, password, name } = req.body;

        if (!email || !password || !name) {
            return res.status(400).json({ success: false, message: 'Email, password, and name are required' });
        }
        if (password.length < 6) {
            return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return res.status(400).json({ success: false, message: 'Invalid email format' });
        }

        const existing = await User.findByEmail(email);
        if (existing) {
            return res.status(409).json({ success: false, message: 'Email already registered' });
        }

        const hashedPassword = await bcrypt.hash(password, 12);
        const user = await User.create({ email, password: hashedPassword, name });

        const token = jwt.sign(
            { id: user.id, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
        );

        return res.status(201).json({
            success: true,
            message: 'Registration successful',
            data: {
                token,
                user: { id: user.id, email: user.email, name: user.name },
            },
        });
    } catch (err) {
        console.error('Register error:', err);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

/**
 * POST /api/auth/login
 */
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ success: false, message: 'Email and password are required' });
        }

        const user = await User.findByEmail(email);
        if (!user) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        await User.updateLastLogin(user.id);

        const token = jwt.sign(
            { id: user.id, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
        );

        return res.json({
            success: true,
            message: 'Login successful',
            data: {
                token,
                user: { id: user.id, email: user.email, name: user.name },
            },
        });
    } catch (err) {
        console.error('Login error:', err);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

/**
 * GET /api/auth/me
 */
exports.getMe = async (req, res) => {
    try {
        const user = await User.findById(req.userId);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        // Don't send password
        const { password: _pw, ...safeUser } = user;
        return res.json({ success: true, data: { user: safeUser } });
    } catch (err) {
        console.error('GetMe error:', err);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

/**
 * PUT /api/auth/change-password
 */
exports.changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        if (!currentPassword || !newPassword) {
            return res.status(400).json({ success: false, message: 'Current and new passwords are required' });
        }
        if (newPassword.length < 6) {
            return res.status(400).json({ success: false, message: 'New password must be at least 6 characters' });
        }

        const user = await User.findByEmail(req.user.email);
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Current password is incorrect' });
        }

        const hashed = await bcrypt.hash(newPassword, 12);
        await User.updatePassword(req.userId, hashed);

        return res.json({ success: true, message: 'Password updated successfully' });
    } catch (err) {
        console.error('ChangePassword error:', err);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};
