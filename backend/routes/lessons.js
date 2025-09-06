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
const { upload: lessonUpload, handleMulterError } = require('../middleware/lessonUpload');
const debugMiddleware = require('../middleware/debug');

// Toutes les routes nécessitent une authentification
router.use(auth);

// Routes pour les leçons
router.get('/module/:moduleId', getModuleLessons);
router.get('/:id', getLessonById);

// Middleware pour détecter le type de contenu
const detectContentType = (req, res, next) => {
  const contentType = req.headers['content-type'];
  console.log('🔍 Content-Type détecté:', contentType);
  
  if (contentType && contentType.includes('multipart/form-data')) {
    console.log('📁 Utilisation de multer pour FormData');
    // Utiliser multer pour les uploads de fichiers
    lessonUpload.fields([
      { name: 'attachments', maxCount: 10 },
      { name: 'videoFile', maxCount: 1 }
    ])(req, res, (err) => {
      if (err) {
        console.error('❌ Multer error:', err);
        return handleMulterError(err, req, res, next);
      }
      console.log('✅ Multer processing completed');
      next();
    });
  } else {
    console.log('📄 Utilisation de JSON parsing');
    // Utiliser le parsing JSON standard
    express.json({ limit: '10mb' })(req, res, next);
  }
};

// Route POST avec détection automatique du type de contenu
router.post('/module/:moduleId', debugMiddleware, detectContentType, createLesson);
// Route PUT avec détection automatique du type de contenu
router.put('/:id', detectContentType, updateLesson);
router.delete('/:id', deleteLesson);
router.put('/reorder/:moduleId', reorderLessons);

module.exports = router;

