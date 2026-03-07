'use strict';

require('dotenv').config();

const config = {
    port: process.env.PORT || 3000,
    nodeEnv: process.env.NODE_ENV || 'development',
    jwtSecret: process.env.JWT_SECRET || 'fallback_jwt_secret_change_in_production',
    jwtExpiry: process.env.JWT_EXPIRY || '7d',
    db: {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT) || 5432,
        database: process.env.DB_NAME || 'dating_app',
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || '',
        connectionString: process.env.DATABASE_URL,
    },
    email: {
        host: process.env.EMAIL_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.EMAIL_PORT) || 587,
        user: process.env.EMAIL_USER || '',
        pass: process.env.EMAIL_PASS || '',
        from: process.env.EMAIL_FROM || 'noreply@datingapp.com',
    },
    app: {
        name: process.env.APP_NAME || 'DatingApp',
        frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3001',
        maxDistanceKm: parseInt(process.env.MAX_DISTANCE_KM) || 100,
        perfectMatchThreshold: parseInt(process.env.PERFECT_MATCH_THRESHOLD) || 80,
    },
};

module.exports = config;
