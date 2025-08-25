const express = require('express');
const router = express.Router();
const { 
  getAllCourses, 
  getCourseById, 
  createCourse,
  updateCourse,
  deleteCourse,
  publishCourse,
  getTutorCourses,
  enrollInCourse, 
  getEnrolledCourses 
} = require('../controllers/courseController');
const { auth } = require('../middleware/auth');

// Public routes
router.get('/', getAllCourses);
router.get('/:id', getCourseById);

// Protected routes
router.get('/enrolled', auth, getEnrolledCourses);
router.post('/:id/enroll', auth, enrollInCourse);

// Tutor-only routes
router.post('/', auth, createCourse);
router.get('/tutor/my-courses', auth, getTutorCourses);
router.put('/:id', auth, updateCourse);
router.delete('/:id', auth, deleteCourse);
router.patch('/:id/publish', auth, publishCourse);

module.exports = router; 