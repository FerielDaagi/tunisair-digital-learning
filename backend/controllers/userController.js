const multer = require('multer');
const path = require('path');
const fs = require('fs');
const User = require('../models/User');

// Configuration Multer pour l'upload d'avatars
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

// Middleware pour gérer l'upload d'avatar
const uploadAvatar = upload.single('avatar');

// Récupérer le profil utilisateur
const getProfile = async (req, res) => {
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
    console.error('Erreur getProfile:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
};

// Mettre à jour le profil utilisateur
const updateProfile = async (req, res) => {
  try {
    const { name, bio, phone, dateOfBirth, address } = req.body;
    
    const updateData = {};
    
    if (name) updateData.name = name;
    if (bio) updateData['profile.bio'] = bio;
    if (phone) updateData['profile.phone'] = phone;
    if (dateOfBirth) updateData['profile.dateOfBirth'] = dateOfBirth;
    if (address) {
      if (address.street) updateData['profile.address.street'] = address.street;
      if (address.city) updateData['profile.address.city'] = address.city;
      if (address.country) updateData['profile.address.country'] = address.country;
      if (address.zipCode) updateData['profile.address.zipCode'] = address.zipCode;
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur introuvable'
      });
    }

    res.json({
      success: true,
      message: 'Profil mis à jour avec succès',
      user: user.toJSON()
    });

  } catch (error) {
    console.error('Erreur updateProfile:', error);
    
    // Gestion des erreurs de validation
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: messages.join(', ')
      });
    }

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

// Mettre à jour l'avatar utilisateur
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

        // Préparer le nouveau chemin d'avatar
        const avatarPath = `/uploads/avatars/${req.file.filename}`;
        
        // Conserver l'ancien avatar dans l'historique (sans doublons)
        let previousAvatars = Array.isArray(user.profile?.previousAvatars)
          ? user.profile.previousAvatars
          : [];
        
        // Ajouter l'ancien avatar seulement s'il existe et n'est pas déjà dans l'historique
        if (user.profile?.avatar && !previousAvatars.includes(user.profile.avatar)) {
          previousAvatars.unshift(user.profile.avatar);
        }
        
        const updatedUser = await User.findByIdAndUpdate(
          req.user.id,
          {
            $set: {
              'profile.avatar': avatarPath,
              'profile.previousAvatars': previousAvatars
            }
          },
          { new: true }
        );

        res.json({
          success: true,
          message: 'Avatar mis à jour avec succès',
          avatar: avatarPath,
          user: updatedUser.toJSON()
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

// Lister les anciens avatars
const listPreviousAvatars = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Utilisateur introuvable' });
    }
    
    // Filtrer pour exclure l'avatar actuel de l'historique
    const currentAvatar = user.profile?.avatar;
    const previousAvatars = Array.isArray(user.profile?.previousAvatars)
      ? user.profile.previousAvatars.filter(avatar => avatar !== currentAvatar)
      : [];
    
    res.json({
      success: true,
      previousAvatars: previousAvatars
    });
  } catch (error) {
    console.error('Erreur listPreviousAvatars:', error);
    res.status(500).json({ success: false, message: 'Erreur interne du serveur' });
  }
};

// Restaurer un ancien avatar
const restoreAvatar = async (req, res) => {
  try {
    const { avatarPath } = req.body;
    if (!avatarPath) {
      return res.status(400).json({ success: false, message: 'avatarPath requis' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Utilisateur introuvable' });
    }

    const previous = Array.isArray(user.profile?.previousAvatars)
      ? user.profile.previousAvatars
      : [];

    // Si l'avatar courant existe et n'est pas déjà dans l'historique, l'ajouter
    if (user.profile?.avatar && !previous.includes(user.profile.avatar)) {
      previous.unshift(user.profile.avatar);
    }

    // Retirer l'avatar restauré de l'historique pour éviter les doublons
    const filteredPrevious = previous.filter(avatar => avatar !== avatarPath);
    
    // Mettre à jour l'avatar courant avec celui demandé
    const updated = await User.findByIdAndUpdate(
      req.user.id,
      {
        $set: {
          'profile.avatar': avatarPath,
          'profile.previousAvatars': filteredPrevious
        }
      },
      { new: true }
    );

    res.json({ success: true, message: 'Avatar restauré', user: updated.toJSON() });
  } catch (error) {
    console.error('Erreur restoreAvatar:', error);
    res.status(500).json({ success: false, message: 'Erreur interne du serveur' });
  }
};

// Récupérer les progrès utilisateur (à adapter selon vos besoins)
const getProgress = async (req, res) => {
  try {
    // Implémentation selon votre logique métier
    res.json({
      success: true,
      progress: {
        // Vos données de progression
      }
    });
  } catch (error) {
    console.error('Erreur getProgress:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
};

// Mettre à jour la progression d'une leçon (à adapter selon vos besoins)
const updateLessonProgress = async (req, res) => {
  try {
    // Implémentation selon votre logique métier
    res.json({
      success: true,
      message: 'Progression mise à jour'
    });
  } catch (error) {
    console.error('Erreur updateLessonProgress:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
};

// Devenir tuteur
const becomeTutor = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Utilisateur introuvable' });
    }

    // Vérifier que l'utilisateur est actuellement un apprenti
    if (user.role !== 'apprenti') {
      return res.status(400).json({ 
        success: false, 
        message: 'Vous ne pouvez devenir tuteur que si vous êtes actuellement un apprenti' 
      });
    }

    // Mettre à jour le rôle vers tuteur
    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      { role: 'tuteur' },
      { new: true }
    );

    res.json({
      success: true,
      message: 'Félicitations ! Vous êtes maintenant tuteur.',
      user: updatedUser.toJSON()
    });
  } catch (error) {
    console.error('Erreur becomeTutor:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
};

// Supprimer un avatar de l'historique
const deleteAvatarFromHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const { avatarPath } = req.body;
    
    if (!avatarPath) {
      return res.status(400).json({
        success: false,
        message: 'Chemin de l\'avatar requis'
      });
    }
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur introuvable'
      });
    }
    
    // Vérifier que l'avatar existe dans l'historique
    if (!user.profile?.previousAvatars?.includes(avatarPath)) {
      return res.status(404).json({
        success: false,
        message: 'Avatar introuvable dans l\'historique'
      });
    }
    
    // Supprimer l'avatar de l'historique
    user.profile.previousAvatars = user.profile.previousAvatars.filter(
      path => path !== avatarPath
    );
    
    await user.save();
    
    // Supprimer le fichier du serveur
    const fs = require('fs');
    const path = require('path');
    const avatarFilePath = path.join(__dirname, '..', avatarPath);
    
    try {
      if (fs.existsSync(avatarFilePath)) {
        fs.unlinkSync(avatarFilePath);
        console.log('Fichier avatar supprimé:', avatarPath);
      }
    } catch (err) {
      console.error('Erreur suppression fichier avatar:', err);
      // On continue même si la suppression du fichier échoue
    }
    
    res.json({
      success: true,
      message: 'Avatar supprimé de l\'historique avec succès'
    });
    
  } catch (error) {
    console.error('Erreur deleteAvatarFromHistory:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
};

// ===== FONCTIONS ADMIN =====

// Récupérer tous les utilisateurs (admin seulement)
const getAllUsers = async (req, res) => {
  try {
    // Vérifier que l'utilisateur est admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Accès refusé. Rôle administrateur requis.'
      });
    }

    const users = await User.find({}).select('-password');
    
    res.json({
      success: true,
      users: users
    });
  } catch (error) {
    console.error('Erreur getAllUsers:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
};

// Activer/Désactiver un utilisateur (admin seulement)
const toggleUserStatus = async (req, res) => {
  try {
    // Vérifier que l'utilisateur est admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Accès refusé. Rôle administrateur requis.'
      });
    }

    const { userId } = req.params;
    const { isActive } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur introuvable'
      });
    }

    // Empêcher l'admin de se désactiver lui-même
    if (userId === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'Vous ne pouvez pas modifier votre propre statut'
      });
    }

    user.isActive = isActive;
    await user.save();

    res.json({
      success: true,
      message: `Utilisateur ${isActive ? 'activé' : 'désactivé'} avec succès`,
      user: user.toJSON()
    });
  } catch (error) {
    console.error('Erreur toggleUserStatus:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
};

// Promouvoir un utilisateur au rôle de tuteur (admin seulement)
const promoteToTutor = async (req, res) => {
  try {
    // Vérifier que l'utilisateur est admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Accès refusé. Rôle administrateur requis.'
      });
    }

    const { userId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur introuvable'
      });
    }

    // Vérifier que l'utilisateur est un apprenti
    if (user.role !== 'apprenti') {
      return res.status(400).json({
        success: false,
        message: 'Seuls les apprentis peuvent être promus tuteurs'
      });
    }

    user.role = 'tuteur';
    await user.save();

    res.json({
      success: true,
      message: 'Utilisateur promu tuteur avec succès',
      user: user.toJSON()
    });
  } catch (error) {
    console.error('Erreur promoteToTutor:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
};

// Supprimer un utilisateur (admin seulement)
const deleteUser = async (req, res) => {
  try {
    // Vérifier que l'utilisateur est admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Accès refusé. Rôle administrateur requis.'
      });
    }

    const { userId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur introuvable'
      });
    }

    // Empêcher l'admin de se supprimer lui-même
    if (userId === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'Vous ne pouvez pas supprimer votre propre compte'
      });
    }

    // Supprimer l'avatar du serveur s'il existe
    if (user.profile?.avatar) {
      const fs = require('fs');
      const path = require('path');
      const avatarPath = path.join(__dirname, '..', user.profile.avatar);
      try {
        if (fs.existsSync(avatarPath)) {
          fs.unlinkSync(avatarPath);
          console.log('Avatar supprimé:', user.profile.avatar);
        }
      } catch (err) {
        console.error('Erreur suppression avatar:', err);
      }
    }

    // Supprimer tous les avatars de l'historique
    if (user.profile?.previousAvatars && Array.isArray(user.profile.previousAvatars)) {
      const fs = require('fs');
      const path = require('path');
      user.profile.previousAvatars.forEach(avatarPath => {
        const fullPath = path.join(__dirname, '..', avatarPath);
        try {
          if (fs.existsSync(fullPath)) {
            fs.unlinkSync(fullPath);
            console.log('Avatar historique supprimé:', avatarPath);
          }
        } catch (err) {
          console.error('Erreur suppression avatar historique:', err);
        }
      });
    }

    // Supprimer l'utilisateur de la base de données
    await User.findByIdAndDelete(userId);

    res.json({
      success: true,
      message: 'Utilisateur supprimé avec succès'
    });
  } catch (error) {
    console.error('Erreur deleteUser:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
};

module.exports = {
  getProfile,
  updateProfile,
  updateAvatar,
  listPreviousAvatars,
  restoreAvatar,
  getProgress,
  updateLessonProgress,
  becomeTutor,
  deleteAvatarFromHistory,
  // Admin functions
  getAllUsers,
  toggleUserStatus,
  promoteToTutor,
  deleteUser
};