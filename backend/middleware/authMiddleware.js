'use strict';

const jwt = require('jsonwebtoken');
const config = require('../config');

const authMiddleware = (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1];
    if (!token) {
        return res.status(401).send({ message: 'No token provided!' });
    }
    jwt.verify(token, config.jwtSecret, (err, decoded) => {
        if (err) {
            return res.status(403).send({ message: 'Unauthorized!' });
        }
        req.userId = decoded.id;
        next();
    });
};

module.exports = authMiddleware;