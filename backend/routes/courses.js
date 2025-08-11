const express = require('express');
const router = express.Router();
const { 
  getAllCourses, 
  getCourseById, 
  enrollInCourse, 
  getEnrolledCourses 
} = require('../controllers/courseController');
const { authenticateToken } = require('../middleware/auth');

// Public routes
router.get('/', getAllCourses);
router.get('/:id', getCourseById);

// Protected routes
router.get('/enrolled', authenticateToken, getEnrolledCourses);
router.post('/:id/enroll', authenticateToken, enrollInCourse);

module.exports = router; 