const express = require('express');
const router = express.Router();
const { 
  getProfile, 
  updateProfile, 
  getProgress, 
  updateLessonProgress,
  updateAvatar,
  listPreviousAvatars,
  restoreAvatar,
  requestTutor,
  deleteAvatarFromHistory,
  // Admin functions
  getAllUsers,
  toggleUserStatus,
  promoteToTutor,
  rejectTutorRequest,
  demoteToApprentice,
  deleteUser
} = require('../controllers/userController');
const auth = require('../middleware/auth');

// All routes require authentication
router.use(auth);

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

// Tutor routes
router.post('/request-tutor', requestTutor);

// Avatar history routes
router.delete('/avatar/history', deleteAvatarFromHistory);

// ===== ROUTES ADMIN =====
// Toutes les routes admin nécessitent le rôle admin
router.get('/admin/all', getAllUsers);
router.put('/admin/:userId/status', toggleUserStatus);
router.put('/admin/:userId/promote', promoteToTutor);
router.put('/admin/:userId/reject-tutor', rejectTutorRequest);
router.put('/admin/:userId/demote', demoteToApprentice);
router.delete('/admin/:userId', deleteUser);

module.exports = router; 