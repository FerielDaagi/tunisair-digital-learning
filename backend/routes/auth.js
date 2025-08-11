const express = require('express');
const router = express.Router();
const { login, register, logout, getCurrentUser } = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');

// Public routes
router.post('/login', login);
router.post('/register', register);
router.post('/logout', logout);

// Protected routes
router.get('/me', authenticateToken, getCurrentUser);

module.exports = router; 