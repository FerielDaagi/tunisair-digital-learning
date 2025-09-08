const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const {
  publishCourse,
  enrollInCourse,
  getPublishedCourses,
  getStudentCourses,
  getCourseStats
} = require('../controllers/enrollmentController');

// Routes pour les tuteurs
router.post('/publish/:courseId', auth, publishCourse);
router.get('/stats/:courseId', auth, getCourseStats);

// Routes pour les apprentis
router.post('/enroll/:courseId', auth, enrollInCourse);
router.get('/published', getPublishedCourses);
router.get('/my-courses', auth, getStudentCourses);

module.exports = router;
