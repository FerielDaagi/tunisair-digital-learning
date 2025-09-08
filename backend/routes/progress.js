const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const {
  markLessonCompleted,
  updateVideoProgress,
  getCourseProgress,
  addLessonNotes,
  rateLesson
} = require('../controllers/progressController');

// Routes pour les apprentis
router.post('/lesson/:lessonId/complete', auth, markLessonCompleted);
router.put('/lesson/:lessonId/video-progress', auth, updateVideoProgress);
router.get('/course/:courseId', auth, getCourseProgress);
router.put('/lesson/:lessonId/notes', auth, addLessonNotes);
router.put('/lesson/:lessonId/rate', auth, rateLesson);

module.exports = router;
