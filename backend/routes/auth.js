const express = require('express');
const router = express.Router();
const { login, register, logout, getCurrentUser, updateAvatar, deleteAccount } = require('../controllers/authController');
const auth = require('../middleware/auth');

// Public routes
router.post('/login', login);
router.post('/register', register);
router.post('/logout', logout);
 
// Protected routes
router.get('/me', auth, getCurrentUser);
router.put('/avatar', auth, updateAvatar); // Nouvelle route pour mettre à jour l'avatar

// Route pour supprimer le compte utilisateur
router.delete('/delete', auth, deleteAccount);

module.exports = router; 