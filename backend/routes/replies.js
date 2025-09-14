const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const {
  createReply,
  getRepliesByReview,
  deleteReply
} = require('../controllers/replyController');

// Routes pour les réponses aux commentaires

// Créer une réponse à un commentaire
router.post('/review/:reviewId', auth, createReply);

// Obtenir les réponses d'un commentaire
router.get('/review/:reviewId', getRepliesByReview);

// Supprimer une réponse
router.delete('/:replyId', auth, deleteReply);

module.exports = router;


