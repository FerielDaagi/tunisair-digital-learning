const express = require('express');
const router = express.Router();
const { 
  getStats, 
  getRecentActivity, 
  getLearningProgress, 
  getAchievements 
} = require('../controllers/dashboardController');
const { authenticateToken } = require('../middleware/auth');

// All routes require authentication
router.use(authenticateToken);

// Dashboard routes
router.get('/stats', getStats);
router.get('/recent-activity', getRecentActivity);
router.get('/learning-progress', getLearningProgress);
router.get('/achievements', getAchievements);

module.exports = router; 