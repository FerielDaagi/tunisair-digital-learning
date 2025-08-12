const jwt = require('jsonwebtoken');
const User = require('../models/User'); // 🆕 Import du modèle User

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Générer JWT token
const generateToken = (user) => {
  return jwt.sign(
    { 
      id: user._id, // 🆕 Utilise _id (MongoDB) au lieu de id
      email: user.email, 
      role: user.role 
    },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
};

// 🆕 NOUVELLE fonction Register (avec MongoDB)
const register = async (req, res) => {
  try {
    const { name, email, password, role, profile } = req.body;

    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Nom, email et mot de passe sont obligatoires'
      });
    }

    // Vérifier si l'utilisateur existe déjà
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Un utilisateur avec cet email existe déjà'
      });
    }

    // Créer nouvel utilisateur
    const userData = {
      name,
      email,
      password, // Le mot de passe sera hashé automatiquement (pre-save hook)
      role: role || 'apprenti'
    };

    // Ajouter le profil s'il existe
    if (profile) {
      userData.profile = profile;
    }

    const newUser = await User.create(userData);

    // Générer token
    const token = generateToken(newUser);

    res.status(201).json({
      success: true,
      message: 'Inscription réussie',
      user: newUser.toJSON(), // Utilise la méthode toJSON pour exclure le mot de passe
      token
    });

  } catch (error) {
    console.error('Erreur register:', error);
    
    // Gestion des erreurs de validation MongoDB
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: messages.join(', ')
      });
    }

    // Erreur de duplication (email unique)
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Cet email est déjà utilisé'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
};

// 🆕 NOUVELLE fonction Login (avec MongoDB)
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email et mot de passe sont obligatoires'
      });
    }

    // Trouver l'utilisateur avec le mot de passe
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Identifiants invalides'
      });
    }

    // Vérifier le mot de passe
    const isPasswordValid = await user.matchPassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Identifiants invalides'
      });
    }

    // Vérifier si le compte est actif
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Compte désactivé'
      });
    }

    // Générer token
    const token = generateToken(user);

    res.json({
      success: true,
      message: 'Connexion réussie',
      user: user.toJSON(), // Exclut automatiquement le mot de passe
      token
    });

  } catch (error) {
    console.error('Erreur login:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
};

// Logout (reste pareil)
const logout = (req, res) => {
  res.json({
    success: true,
    message: 'Déconnexion réussie'
  });
};

// 🆕 NOUVELLE fonction getCurrentUser (avec MongoDB)
const getCurrentUser = async (req, res) => {
  try {
    // req.user.id vient du middleware JWT
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur introuvable'
      });
    }

    res.json({
      success: true,
      user: user.toJSON()
    });

  } catch (error) {
    console.error('Erreur getCurrentUser:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
};

module.exports = {
  register, // 🆕 Changé de "register" au lieu de l'ancien nom
  login,
  logout,
  getCurrentUser
};