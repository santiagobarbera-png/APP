const express = require('express');
const router = express.Router();
const matchController = require('../controllers/matchController');
const authMiddleware = require('../middleware/authMiddleware');

// Match routes
router.get('/matches', authMiddleware, matchController.getMatches);
router.post('/matches', authMiddleware, matchController.createMatch);
router.put('/matches/:id/status', authMiddleware, matchController.updateMatchStatus);
router.delete('/matches/:id', authMiddleware, matchController.deleteMatch);

module.exports = router;