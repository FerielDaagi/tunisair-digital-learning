const express = require('express');
const router = express.Router();
const { 
  createModule,
  updateModule,
  deleteModule,
  getCourseModules,
  getModuleById,
  togglePublish
} = require('../controllers/moduleController');
const { auth } = require('../middleware/auth');

// Toutes les routes nécessitent une authentification
router.use(auth);

// Routes pour les modules
router.get('/course/:courseId', getCourseModules);
router.get('/:id', getModuleById);
router.post('/course/:courseId', createModule);
router.put('/:id', updateModule);
router.delete('/:id', deleteModule);

// Toggle publication d'un module
router.put('/:id/toggle-publish', togglePublish);

module.exports = router;
