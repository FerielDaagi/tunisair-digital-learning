const express = require('express');
const router = express.Router();
const { 
  getProfile, 
  updateProfile, 
  getProgress, 
  updateLessonProgress,
  updateAvatar,
  listPreviousAvatars,
  restoreAvatar
} = require('../controllers/userController');
const { authenticateToken } = require('../middleware/auth');

// All routes require authentication
router.use(authenticateToken);

// Profile routes
router.get('/profile', getProfile);
router.put('/profile', updateProfile);
//avatar
router.put('/avatar', updateAvatar);
router.get('/avatar/history', listPreviousAvatars);
router.post('/avatar/restore', restoreAvatar);

// Progress routes
router.get('/progress', getProgress);
router.post('/progress', updateLessonProgress);

module.exports = router; 