'use strict';

const validateRegistration = (req, res, next) => {
    const { name, email, password } = req.body;
    const errors = [];
    if (!name || name.trim().length < 2) errors.push('Name must be at least 2 characters');
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.push('Valid email is required');
    if (!password || password.length < 8) errors.push('Password must be at least 8 characters');
    if (errors.length > 0) return res.status(400).json({ errors });
    next();
};

const validateLogin = (req, res, next) => {
    const { email, password } = req.body;
    const errors = [];
    if (!email) errors.push('Email is required');
    if (!password) errors.push('Password is required');
    if (errors.length > 0) return res.status(400).json({ errors });
    next();
};

const validateMessage = (req, res, next) => {
    const { content } = req.body;
    if (!content || content.trim().length === 0) {
        return res.status(400).json({ error: 'Message content is required' });
    }
    if (content.length > 2000) {
        return res.status(400).json({ error: 'Message too long (max 2000 chars)' });
    }
    next();
};

module.exports = { validateRegistration, validateLogin, validateMessage };
