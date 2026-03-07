'use strict';

const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const authMiddleware = require('../middleware/authMiddleware');

router.get('/', authMiddleware, notificationController.getNotifications);
router.put('/mark-read', authMiddleware, notificationController.markAsRead);
router.put('/mark-all-read', authMiddleware, notificationController.markAllAsRead);
router.delete('/:id', authMiddleware, notificationController.deleteNotification);

module.exports = router;
