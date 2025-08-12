const express = require('express');
const router = express.Router();
const { 
  getProfile, 
  updateProfile, 
  getProgress, 
  updateLessonProgress,
  updateAvatar
} = require('../controllers/userController');
const { authenticateToken } = require('../middleware/auth');

// All routes require authentication
router.use(authenticateToken);

// Profile routes
router.get('/profile', getProfile);
router.put('/profile', updateProfile);
//avatar
router.put('/avatar', updateAvatar);

// Progress routes
router.get('/progress', getProgress);
router.post('/progress', updateLessonProgress);

module.exports = router; 