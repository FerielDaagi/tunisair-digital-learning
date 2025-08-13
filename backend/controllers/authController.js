// Suppression du compte utilisateur
const deleteAccount = async (req, res) => {
  try {
    const userId = req.user._id;
    
    // Récupérer l'utilisateur avant suppression pour accéder à ses données
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur introuvable.' });
    }

    // Supprimer l'avatar du serveur s'il existe
    if (user.profile?.avatar) {
      const avatarPath = path.join(__dirname, '..', user.profile.avatar);
      fs.unlink(avatarPath, (err) => {
        if (err && err.code !== 'ENOENT') {
          console.error('Erreur suppression avatar:', err);
        }
      });
    }

    // Supprimer tous les avatars de l'historique
    if (user.profile?.previousAvatars && Array.isArray(user.profile.previousAvatars)) {
      user.profile.previousAvatars.forEach(avatarPath => {
        const fullPath = path.join(__dirname, '..', avatarPath);
        fs.unlink(fullPath, (err) => {
          if (err && err.code !== 'ENOENT') {
            console.error('Erreur suppression avatar historique:', err);
          }
        });
      });
    }

    // Supprimer l'utilisateur de la base de données
    await User.findByIdAndDelete(userId);
    
    res.status(200).json({ 
      success: true,
      message: 'Compte supprimé définitivement avec succès.' 
    });
  } catch (error) {
    console.error('Erreur suppression compte:', error);
    res.status(500).json({ 
      success: false,
      message: 'Erreur lors de la suppression du compte.' 
    });
  }
};
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET;

// Configuration Multer pour l'upload d'images
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = 'uploads/avatars/';
    // Créer le dossier s'il n'existe pas
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    // Générer un nom unique pour le fichier
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'avatar-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// Filtrage des fichiers (seulement les images)
const fileFilter = (req, file, cb) => {
  const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
  
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Type de fichier non autorisé. Utilisez JPG, PNG ou GIF.'), false);
  }
};

// Configuration Multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max
  }
});

// Générer JWT token
const generateToken = (user) => {
  return jwt.sign(
    { 
      id: user._id,
      email: user.email, 
      role: user.role 
    },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
};

// Middleware pour gérer l'upload d'avatar
const uploadAvatar = upload.single('avatar');

// Fonction register modifiée pour gérer FormData
const register = async (req, res) => {
  try {
    // Gérer l'upload avec multer
    uploadAvatar(req, res, async (err) => {
      if (err) {
        if (err instanceof multer.MulterError) {
          if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
              success: false,
              message: 'Le fichier est trop volumineux. Taille maximum : 5MB'
            });
          }
        }
        return res.status(400).json({
          success: false,
          message: err.message || 'Erreur lors de l\'upload du fichier'
        });
      }

      try {
        // Récupérer les données utilisateur depuis FormData
        let userData;
        try {
          userData = req.body.userData ? JSON.parse(req.body.userData) : req.body;
        } catch (parseError) {
          return res.status(400).json({
            success: false,
            message: 'Données utilisateur invalides'
          });
        }

        const { name, email, password, role, profile } = userData;

        // Validation
        if (!name || !email || !password) {
          // Supprimer le fichier uploadé en cas d'erreur
          if (req.file) {
            fs.unlink(req.file.path, (unlinkErr) => {
              if (unlinkErr) console.error('Erreur suppression fichier:', unlinkErr);
            });
          }
          
          return res.status(400).json({
            success: false,
            message: 'Nom, email et mot de passe sont obligatoires'
          });
        }

        // Vérifier si l'utilisateur existe déjà
        const existingUser = await User.findOne({ email });
        if (existingUser) {
          // Supprimer le fichier uploadé en cas d'erreur
          if (req.file) {
            fs.unlink(req.file.path, (unlinkErr) => {
              if (unlinkErr) console.error('Erreur suppression fichier:', unlinkErr);
            });
          }
          
          return res.status(400).json({
            success: false,
            message: 'Un utilisateur avec cet email existe déjà'
          });
        }

        // Préparer les données utilisateur
        const newUserData = {
          name,
          email,
          password,
          role: role || 'apprenti'
        };

        // Ajouter le profil s'il existe
        if (profile) {
          newUserData.profile = profile;
          
          // Ajouter l'avatar s'il a été uploadé
          if (req.file) {
            newUserData.profile.avatar = `/uploads/avatars/${req.file.filename}`;
          }
        } else if (req.file) {
          // Si pas de profil mais avatar uploadé
          newUserData.profile = {
            avatar: `/uploads/avatars/${req.file.filename}`
          };
        }

        // Créer nouvel utilisateur
        const newUser = await User.create(newUserData);

        // Générer token
        const token = generateToken(newUser);

        res.status(201).json({
          success: true,
          message: 'Inscription réussie',
          user: newUser.toJSON(),
          token
        });

      } catch (error) {
        console.error('Erreur register:', error);
        
        // Supprimer le fichier uploadé en cas d'erreur
        if (req.file) {
          fs.unlink(req.file.path, (unlinkErr) => {
            if (unlinkErr) console.error('Erreur suppression fichier:', unlinkErr);
          });
        }

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
    });

  } catch (error) {
    console.error('Erreur register externe:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
};

// Fonction login (reste identique)
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
      user: user.toJSON(),
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

// getCurrentUser (reste identique)
const getCurrentUser = async (req, res) => {
  try {
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

// Fonction utilitaire pour supprimer un ancien avatar
const deleteOldAvatar = (avatarPath) => {
  if (avatarPath && avatarPath !== '') {
    const fullPath = path.join(__dirname, '..', avatarPath);
    fs.unlink(fullPath, (err) => {
      if (err && err.code !== 'ENOENT') {
        console.error('Erreur suppression ancien avatar:', err);
      }
    });
  }
};

// Nouvelle fonction pour mettre à jour l'avatar
const updateAvatar = async (req, res) => {
  try {
    uploadAvatar(req, res, async (err) => {
      if (err) {
        if (err instanceof multer.MulterError) {
          if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
              success: false,
              message: 'Le fichier est trop volumineux. Taille maximum : 5MB'
            });
          }
        }
        return res.status(400).json({
          success: false,
          message: err.message || 'Erreur lors de l\'upload du fichier'
        });
      }

      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'Aucun fichier sélectionné'
        });
      }

      try {
        const user = await User.findById(req.user.id);
        if (!user) {
          // Supprimer le fichier uploadé
          fs.unlink(req.file.path, (unlinkErr) => {
            if (unlinkErr) console.error('Erreur suppression fichier:', unlinkErr);
          });
          
          return res.status(404).json({
            success: false,
            message: 'Utilisateur introuvable'
          });
        }

        // Supprimer l'ancien avatar s'il existe
        if (user.profile && user.profile.avatar) {
          deleteOldAvatar(user.profile.avatar);
        }

        // Mettre à jour l'avatar
        const avatarPath = `/uploads/avatars/${req.file.filename}`;
        
        await User.findByIdAndUpdate(
          req.user.id,
          {
            $set: {
              'profile.avatar': avatarPath
            }
          },
          { new: true }
        );

        res.json({
          success: true,
          message: 'Avatar mis à jour avec succès',
          avatar: avatarPath
        });

      } catch (error) {
        console.error('Erreur updateAvatar:', error);
        
        // Supprimer le fichier uploadé en cas d'erreur
        if (req.file) {
          fs.unlink(req.file.path, (unlinkErr) => {
            if (unlinkErr) console.error('Erreur suppression fichier:', unlinkErr);
          });
        }

        res.status(500).json({
          success: false,
          message: 'Erreur interne du serveur'
        });
      }
    });

  } catch (error) {
    console.error('Erreur updateAvatar externe:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
};

module.exports = {
  register,
  login,
  logout,
  getCurrentUser,
  updateAvatar, // Nouvelle fonction exportée
  uploadAvatar,  // Middleware exporté pour utilisation dans les routes
  deleteAccount  // Fonction pour supprimer le compte
};