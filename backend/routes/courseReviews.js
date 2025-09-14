const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const {
  createOrUpdateReview,
  getCourseReviews,
  getUserReview,
  deleteReview,
  toggleHelpfulVote
} = require('../controllers/courseReviewController');

// Routes pour les commentaires et évaluations des cours

// Créer ou mettre à jour un commentaire/évaluation
router.post('/course/:courseId/review', auth, createOrUpdateReview);

// Obtenir les commentaires d'un cours (avec pagination et tri)
router.get('/course/:courseId/reviews', getCourseReviews);

// Obtenir le commentaire d'un utilisateur pour un cours
router.get('/course/:courseId/my-review', auth, getUserReview);

// Supprimer un commentaire
router.delete('/course/:courseId/review', auth, deleteReview);

// Voter utile/pas utile pour un commentaire
router.post('/review/:reviewId/helpful', auth, toggleHelpfulVote);

module.exports = router;
