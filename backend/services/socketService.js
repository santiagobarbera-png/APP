'use strict';

const jwt = require('jsonwebtoken');
let io = null;

// Map of userId -> Set of socket IDs
const userSockets = new Map();

/**
 * Initialize socket.io with the HTTP server
 */
function init(server) {
    const { Server } = require('socket.io');
    io = new Server(server, {
        cors: {
            origin: process.env.FRONTEND_URL || '*',
            methods: ['GET', 'POST'],
        },
    });

    io.use((socket, next) => {
        const token = socket.handshake.auth?.token || socket.handshake.query?.token;
        if (!token) return next(new Error('Authentication required'));
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            socket.userId = decoded.id;
            next();
        } catch {
            next(new Error('Invalid token'));
        }
    });

    io.on('connection', (socket) => {
        const userId = socket.userId;
        if (!userSockets.has(userId)) userSockets.set(userId, new Set());
        userSockets.get(userId).add(socket.id);

        socket.join(`user:${userId}`);
        console.log(`User ${userId} connected via socket`);

        socket.on('join_match', (matchId) => {
            socket.join(`match:${matchId}`);
        });

        socket.on('leave_match', (matchId) => {
            socket.leave(`match:${matchId}`);
        });

        socket.on('disconnect', () => {
            const sockets = userSockets.get(userId);
            if (sockets) {
                sockets.delete(socket.id);
                if (sockets.size === 0) userSockets.delete(userId);
            }
            console.log(`User ${userId} disconnected`);
        });
    });

    return io;
}

/**
 * Send a real-time message event to a match room
 */
function emitMessage(matchId, message) {
    if (!io) return;
    io.to(`match:${matchId}`).emit('new_message', message);
}

/**
 * Send a notification to a specific user
 */
function emitNotification(userId, notification) {
    if (!io) return;
    io.to(`user:${userId}`).emit('notification', notification);
}

/**
 * Send a new match event to both users
 */
function emitNewMatch(userId1, userId2, matchData) {
    if (!io) return;
    io.to(`user:${userId1}`).emit('new_match', matchData);
    io.to(`user:${userId2}`).emit('new_match', matchData);
}

function isUserOnline(userId) {
    return userSockets.has(userId) && userSockets.get(userId).size > 0;
}

module.exports = { init, emitMessage, emitNotification, emitNewMatch, isUserOnline };
