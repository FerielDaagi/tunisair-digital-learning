const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const Notification = require('../models/Notification');
const NotificationService = require('../services/notificationService');

// Middleware pour injecter le service de notification
const injectNotificationService = (req, res, next) => {
  req.notificationService = req.app.get('notificationService');
  next();
};

// Récupérer les notifications de l'utilisateur connecté
router.get('/user', auth, injectNotificationService, async (req, res) => {
  try {
    const notifications = await req.notificationService.getUserNotifications(req.user.id);
    res.json({ success: true, notifications });
  } catch (error) {
    console.error('❌ Erreur récupération notifications utilisateur:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// Récupérer les notifications admin (pour les admins)
router.get('/admin', auth, injectNotificationService, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Accès refusé' });
    }

    const notifications = await req.notificationService.getAdminNotifications();
    res.json({ success: true, notifications });
  } catch (error) {
    console.error('❌ Erreur récupération notifications admin:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// Marquer une notification comme lue
router.put('/:id/read', auth, injectNotificationService, async (req, res) => {
  try {
    const notification = await req.notificationService.markAsRead(req.params.id, req.user.id);
    res.json({ success: true, notification });
  } catch (error) {
    console.error('❌ Erreur marquage notification:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// Supprimer une notification
router.delete('/:id', auth, injectNotificationService, async (req, res) => {
  try {
    const notification = await req.notificationService.deleteNotification(req.params.id, req.user.id);
    res.json({ success: true, message: 'Notification supprimée' });
  } catch (error) {
    console.error('❌ Erreur suppression notification:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// Envoyer une notification admin (pour les utilisateurs)
router.post('/admin', auth, injectNotificationService, async (req, res) => {
  try {
    const { title, message, type = 'info', category = 'general', metadata = {} } = req.body;

    if (!title || !message) {
      return res.status(400).json({ success: false, message: 'Titre et message requis' });
    }

    const notification = await req.notificationService.sendAdminNotification(
      req.user.id,
      title,
      message,
      type,
      category,
      metadata
    );

    res.json({ success: true, notification });
  } catch (error) {
    console.error('❌ Erreur envoi notification admin:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// Envoyer une notification à un utilisateur spécifique (pour les admins)
router.post('/user/:userId', auth, injectNotificationService, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Accès refusé' });
    }

    const { title, message, type = 'info', category = 'general', metadata = {} } = req.body;

    if (!title || !message) {
      return res.status(400).json({ success: false, message: 'Titre et message requis' });
    }

    const notification = await req.notificationService.sendUserNotification(
      req.user.id,
      req.params.userId,
      title,
      message,
      type,
      category,
      metadata
    );

    res.json({ success: true, notification });
  } catch (error) {
    console.error('❌ Erreur envoi notification utilisateur:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// Obtenir les statistiques des notifications (pour les admins)
router.get('/stats', auth, injectNotificationService, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Accès refusé' });
    }

    const stats = await req.notificationService.getNotificationStats();
    res.json({ success: true, stats });
  } catch (error) {
    console.error('❌ Erreur récupération stats:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// Marquer toutes les notifications comme lues
router.put('/read-all', auth, injectNotificationService, async (req, res) => {
  try {
    await Notification.updateMany(
      { 
        $or: [
          { recipientId: req.user.id },
          { recipient: 'all' }
        ]
      },
      { isRead: true }
    );

    res.json({ success: true, message: 'Toutes les notifications marquées comme lues' });
  } catch (error) {
    console.error('❌ Erreur marquage toutes notifications:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

module.exports = router;
