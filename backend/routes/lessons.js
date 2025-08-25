const express = require('express');
const router = express.Router();
const { 
  createLesson,
  updateLesson,
  deleteLesson,
  getModuleLessons,
  getLessonById,
  reorderLessons
} = require('../controllers/lessonController');
const { auth } = require('../middleware/auth');

// Toutes les routes nécessitent une authentification
router.use(auth);

// Routes pour les leçons
router.get('/module/:moduleId', getModuleLessons);
router.get('/:id', getLessonById);
router.post('/module/:moduleId', createLesson);
router.put('/:id', updateLesson);
router.delete('/:id', deleteLesson);
router.put('/reorder/:moduleId', reorderLessons);

module.exports = router;

