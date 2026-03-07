'use strict';

const express = require('express');
const router = express.Router();
const matchController = require('../controllers/matchController');
const authMiddleware = require('../middleware/authMiddleware');

router.get('/', authMiddleware, matchController.getMatches);
router.post('/', authMiddleware, matchController.createMatch);
router.get('/perfect', authMiddleware, matchController.getPerfectMatches);
router.put('/:id/status', authMiddleware, matchController.updateMatchStatus);
router.delete('/:id', authMiddleware, matchController.deleteMatch);

module.exports = router;
