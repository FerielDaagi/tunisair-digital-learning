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
const lessonUpload = require('../middleware/lessonUpload');

// Toutes les routes nécessitent une authentification
router.use(auth);

// Routes pour les leçons
router.get('/module/:moduleId', getModuleLessons);
router.get('/:id', getLessonById);
// Accept multipart form-data for attachments and video file
router.post(
  '/module/:moduleId',
  lessonUpload.fields([
    { name: 'attachments', maxCount: 10 },
    { name: 'videoFile', maxCount: 1 }
  ]),
  createLesson
);
// Accept multipart form-data for attachments and video file on update
router.put(
  '/:id',
  lessonUpload.fields([
    { name: 'attachments', maxCount: 10 },
    { name: 'videoFile', maxCount: 1 }
  ]),
  updateLesson
);
router.delete('/:id', deleteLesson);
router.put('/reorder/:moduleId', reorderLessons);

module.exports = router;

