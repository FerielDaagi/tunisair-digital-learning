const express = require('express');
const router = express.Router();
const { login, register, logout, getCurrentUser, updateAvatar, deleteAccount } = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');

// Public routes
router.post('/login', login);
router.post('/register', register);
router.post('/logout', logout);
 
// Protected routes
router.get('/me', authenticateToken, getCurrentUser);
router.put('/avatar', authenticateToken, updateAvatar); // Nouvelle route pour mettre à jour l'avatar

// Route pour supprimer le compte utilisateur
router.delete('/delete', authenticateToken, deleteAccount);

module.exports = router; 