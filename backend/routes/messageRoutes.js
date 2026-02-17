const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');
const authMiddleware = require('../middleware/authMiddleware');

// Message routes
router.post('/send', authMiddleware, messageController.sendMessage);
router.get('/conversation/:userId1/:userId2', authMiddleware, messageController.getConversationHistory);
router.put('/mark-read', authMiddleware, messageController.markMessagesAsRead);
router.delete('/:messageId', authMiddleware, messageController.deleteMessage);

module.exports = router;