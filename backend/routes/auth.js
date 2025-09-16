const express = require('express');
const router = express.Router();
const { login, register, logout, getCurrentUser, updateAvatar, deleteAccount, verifyEmail, resendVerificationCode, requestPasswordReset, resetPassword } = require('../controllers/authController');
const { auth } = require('../middleware/auth');

// Public routes
router.post('/login', login);
router.post('/register', register);
router.post('/logout', logout);
router.post('/verify-email', verifyEmail);
router.post('/resend-verification', resendVerificationCode);
// Password reset
router.post('/forgot-password', requestPasswordReset);
router.post('/reset-password', resetPassword);
 
// Protected routes
router.get('/me', auth, getCurrentUser);
router.put('/avatar', auth, updateAvatar); // Nouvelle route pour mettre à jour l'avatar

// Route pour supprimer le compte utilisateur
router.delete('/delete', auth, deleteAccount);

module.exports = router; 