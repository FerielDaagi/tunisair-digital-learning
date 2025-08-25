const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  createCategory,
  getAllCategories,
  getCategoryById,
  updateCategory,
  deactivateCategory
} = require('../controllers/categoryController');

// Routes publiques
router.get('/', getAllCategories);
router.get('/:id', getCategoryById);

// Routes protégées (tuteurs et admins)
router.post('/', protect, authorize('tuteur', 'admin'), createCategory);

// Mettre à jour une catégorie (admin seulement)
router.put('/:id', protect, authorize('admin'), updateCategory);

// Désactiver une catégorie (admin seulement)
router.delete('/:id', protect, authorize('admin'), deactivateCategory);

module.exports = router;
