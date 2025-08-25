const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const User = require('../models/User');

// Middleware pour vérifier que l'utilisateur est admin
const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Accès refusé. Rôle admin requis.' });
  }
  next();
};

// Route pour obtenir les statistiques des utilisateurs
router.get('/user-stats', auth, requireAdmin, async (req, res) => {
  try {
    // Compter le total des utilisateurs
    const totalUsers = await User.countDocuments();
    
    // Compter les utilisateurs actifs/inactifs
    const activeUsers = await User.countDocuments({ isActive: { $ne: false } });
    const inactiveUsers = await User.countDocuments({ isActive: false });
    
    // Distribution des rôles
    const roleDistribution = await User.aggregate([
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 }
        }
      }
    ]);
    
    // Convertir en objet
    const roleStats = {
      admin: 0,
      tuteur: 0,
      apprenti: 0
    };
    
    roleDistribution.forEach(role => {
      if (roleStats.hasOwnProperty(role._id)) {
        roleStats[role._id] = role.count;
      }
    });
    
    // Inscriptions mensuelles (6 derniers mois)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    const monthlyRegistrations = await User.aggregate([
      {
        $match: {
          createdAt: { $gte: sixMonthsAgo }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 }
      }
    ]);
    
    // Formater les mois
    const formattedMonthlyRegistrations = monthlyRegistrations.map(item => {
      const date = new Date(item._id.year, item._id.month - 1);
      const monthNames = [
        'Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin',
        'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'
      ];
      return {
        month: monthNames[date.getMonth()],
        count: item.count
      };
    });
    
    // Statistiques des utilisateurs
    const stats = {
      totalUsers,
      activeUsers,
      inactiveUsers,
      roleDistribution: roleStats,
      monthlyRegistrations: formattedMonthlyRegistrations,
      userActivity: [] // Pour une future implémentation
    };
    
    res.json(stats);
    
  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques:', error);
    res.status(500).json({ message: 'Erreur serveur lors de la récupération des statistiques' });
  }
});

module.exports = router;
