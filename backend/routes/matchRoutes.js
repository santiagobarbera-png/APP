'use strict';

const express = require('express');
const router = express.Router();
const matchController = require('../controllers/matchController');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware);

router.get('/discover', matchController.discover);
router.get('/pending', matchController.getPendingMatches);
router.get('/', matchController.getMatches);
router.post('/action', matchController.action);

module.exports = router;
