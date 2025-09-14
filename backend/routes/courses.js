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
  getCourseStudents,
  enrollInCourse, 
  getEnrolledCourses 
} = require('../controllers/courseController');
const { auth } = require('../middleware/auth');
const upload = require('../middleware/upload');

// Public routes
router.get('/', getAllCourses);

// Protected routes
router.get('/enrolled', auth, getEnrolledCourses);

// Tutor-only routes
router.post('/', auth, upload.single('thumbnail'), createCourse);
router.get('/tutor/my-courses', auth, getTutorCourses);

// Routes avec paramètres - ordre important (spécifique avant générique)
router.get('/:id/students', auth, getCourseStudents);
router.post('/:id/enroll', auth, enrollInCourse);
router.put('/:id', auth, upload.single('thumbnail'), updateCourse);
router.delete('/:id', auth, deleteCourse);
router.patch('/:id/publish', auth, publishCourse);
router.get('/:id', getCourseById);

module.exports = router; 