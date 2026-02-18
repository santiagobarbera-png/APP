const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../middleware/authMiddleware');

router.get('/profile/:id', authMiddleware, userController.getUserProfile);
router.put('/profile/:id', authMiddleware, userController.updateUserProfile);
router.get('/preferences/:id', authMiddleware, userController.getUserPreferences);
router.delete('/account/:id', authMiddleware, userController.deleteUserAccount);

module.exports = router;