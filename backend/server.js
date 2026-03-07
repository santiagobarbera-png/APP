'use strict';

require('dotenv').config();
const http = require('http');
const app = require('./app');
const socketService = require('./services/socketService');
const pool = require('./config/database');

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);

// Initialize Socket.io
socketService.init(server);

// Test database connection, then start server
pool.query('SELECT 1')
    .then(() => {
        console.log('✅ Database connected');
        server.listen(PORT, () => {
            console.log(`🚀 Server running on port ${PORT}`);
            console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
            console.log(`🔗 Health check: http://localhost:${PORT}/health`);
        });
    })
    .catch(err => {
        console.error('❌ Failed to connect to database:', err.message);
        console.error('   Make sure DATABASE_URL is set in your .env file');
        process.exit(1);
    });

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully...');
    server.close(() => {
        pool.end();
        process.exit(0);
    });
});

module.exports = server;
