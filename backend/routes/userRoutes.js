'use strict';

const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../middleware/authMiddleware');

// All user routes require authentication
router.use(authMiddleware);

router.get('/profile', userController.getMyProfile);
router.put('/profile', userController.updateProfile);
router.get('/preferences', userController.getPreferences);
router.put('/preferences', userController.updatePreferences);
router.delete('/account', userController.deleteAccount);
router.get('/:id', userController.getUserById);

module.exports = router;
