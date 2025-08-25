const Notification = require('../models/Notification');
const User = require('../models/User');

class NotificationService {
  constructor(io) {
    this.io = io;
    this.adminSockets = new Map(); // Map pour stocker les sockets des admins
    this.userSockets = new Map(); // Map pour stocker les sockets des utilisateurs
  }

  // Enregistrer un socket admin
  registerAdminSocket(adminId, socket) {
    this.adminSockets.set(adminId, socket);
    console.log(`🔔 Admin ${adminId} connecté - Socket enregistré`);
  }

  // Enregistrer un socket utilisateur
  registerUserSocket(userId, socket) {
    this.userSockets.set(userId, socket);
    console.log(`🔔 Utilisateur ${userId} connecté - Socket enregistré`);
  }

  // Supprimer un socket
  removeSocket(userId, isAdmin = false) {
    if (isAdmin) {
      this.adminSockets.delete(userId);
      console.log(`🔔 Admin ${userId} déconnecté - Socket supprimé`);
    } else {
      this.userSockets.delete(userId);
      console.log(`🔔 Utilisateur ${userId} déconnecté - Socket supprimé`);
    }
  }

  // Déplacer un socket d'un map à l'autre (quand le rôle change)
  moveSocket(userId, fromAdmin = false) {
    if (fromAdmin) {
      const socket = this.adminSockets.get(userId);
      if (socket) {
        this.adminSockets.delete(userId);
        this.userSockets.set(userId, socket);
        console.log(`🔔 Socket ${userId} déplacé de adminSockets vers userSockets`);
      }
    } else {
      const socket = this.userSockets.get(userId);
      if (socket) {
        this.userSockets.delete(userId);
        this.adminSockets.set(userId, socket);
        console.log(`🔔 Socket ${userId} déplacé de userSockets vers adminSockets`);
      }
    }
  }

  // Créer et envoyer une notification admin
  async sendAdminNotification(senderId, title, message, type = 'info', category = 'general', metadata = {}) {
    try {
      // Créer la notification en base
      const notification = new Notification({
        sender: senderId,
        recipient: 'admin',
        title,
        message,
        type,
        category,
        isAdminNotification: true,
        metadata
      });

      await notification.save();
      await notification.populate('sender', 'name email role profile.avatar');

      // Envoyer à tous les admins connectés comme notification régulière
      this.adminSockets.forEach((socket, adminId) => {
        const image = notification.sender?.profile?.avatar || null;
        const finalTitle = notification.title || 'Notification';
        const finalMessage = notification.message || finalTitle;
        const payload = {
          notification: {
            id: notification._id,
            title: finalTitle,
            message: `${finalTitle}: ${finalMessage}`,
            type: notification.type,
            category: notification.category,
            sender: notification.sender,
            timestamp: notification.createdAt,
            isRead: notification.isRead,
            isAdminNotification: true,
            image
          }
        };
        // Emit both generic and admin-specific events for compatibility
        socket.emit('notification', payload);
        socket.emit('adminNotification', payload);
      });

      console.log(`🔔 Notification admin envoyée: ${title} - ${this.adminSockets.size} admins connectés`);
      return notification;
    } catch (error) {
      console.error('❌ Erreur lors de l\'envoi de notification admin:', error);
      throw error;
    }
  }

  // Créer et envoyer une notification utilisateur
  async sendUserNotification(senderId, recipientId, title, message, type = 'info', category = 'general', metadata = {}) {
    try {
      const notification = new Notification({
        sender: senderId,
        recipient: 'specific',
        recipientId,
        title,
        message,
        type,
        category,
        metadata
      });

      await notification.save();
      await notification.populate('sender', 'name email role profile.avatar');

      // Envoyer au destinataire s'il est connecté (vérifier dans les deux maps)
      let recipientSocket = this.userSockets.get(recipientId.toString());
      if (!recipientSocket) {
        recipientSocket = this.adminSockets.get(recipientId.toString());
      }
      console.log(`🔔 Debug: Socket pour ${recipientId}: ${recipientSocket ? 'TROUVÉ' : 'NON TROUVÉ'} (userSockets: ${this.userSockets.size}, adminSockets: ${this.adminSockets.size})`);
      if (recipientSocket) {
        const image = notification.sender?.profile?.avatar || null;
        const finalTitle = notification.title || 'Notification';
        const finalMessage = notification.message || finalTitle;
        const payload = {
          notification: {
            id: notification._id,
            title: finalTitle,
            message: finalMessage,
            type: notification.type,
            category: notification.category,
            sender: notification.sender,
            timestamp: notification.createdAt,
            isRead: notification.isRead,
            image
          }
        };
        recipientSocket.emit('userNotification', payload);
        // Also emit as generic notification for compatibility
        recipientSocket.emit('notification', payload);
      }

      console.log(`🔔 Notification utilisateur envoyée: ${title} à ${recipientId}`);
      return notification;
    } catch (error) {
      console.error('❌ Erreur lors de l\'envoi de notification utilisateur:', error);
      throw error;
    }
  }

  // Marquer une notification comme lue
  async markAsRead(notificationId, userId) {
    try {
      const notification = await Notification.findByIdAndUpdate(
        notificationId,
        { isRead: true },
        { new: true }
      ).populate('sender', 'name email role');

      if (!notification) {
        throw new Error('Notification non trouvée');
      }

      // Notifier le client si connecté
      const userSocket = this.userSockets.get(userId.toString());
      if (userSocket) {
        userSocket.emit('notificationRead', { notificationId });
      }

      return notification;
    } catch (error) {
      console.error('❌ Erreur lors du marquage comme lu:', error);
      throw error;
    }
  }

  // Récupérer les notifications d'un utilisateur
  async getUserNotifications(userId, limit = 50) {
    try {
      const notifications = await Notification.find({
        $or: [
          { recipientId: userId },
          { recipient: 'all' }
        ]
      })
      .populate('sender', 'name email role')
      .sort({ createdAt: -1 })
      .limit(limit);

      return notifications;
    } catch (error) {
      console.error('❌ Erreur lors de la récupération des notifications:', error);
      throw error;
    }
  }

  // Récupérer les notifications admin
  async getAdminNotifications(limit = 50) {
    try {
      const notifications = await Notification.find({
        isAdminNotification: true
      })
      .populate('sender', 'name email role')
      .sort({ createdAt: -1 })
      .limit(limit);

      return notifications;
    } catch (error) {
      console.error('❌ Erreur lors de la récupération des notifications admin:', error);
      throw error;
    }
  }

  // Supprimer une notification
  async deleteNotification(notificationId, userId) {
    try {
      const notification = await Notification.findByIdAndDelete(notificationId);
      
      if (!notification) {
        throw new Error('Notification non trouvée');
      }

      // Notifier le client si connecté
      const userSocket = this.userSockets.get(userId.toString());
      if (userSocket) {
        userSocket.emit('notificationDeleted', { notificationId });
      }

      return notification;
    } catch (error) {
      console.error('❌ Erreur lors de la suppression:', error);
      throw error;
    }
  }

  // Obtenir les statistiques des notifications
  async getNotificationStats() {
    try {
      const stats = await Notification.aggregate([
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            unread: { $sum: { $cond: ['$isRead', 0, 1] } },
            adminNotifications: { $sum: { $cond: ['$isAdminNotification', 1, 0] } },
            userNotifications: { $sum: { $cond: ['$isAdminNotification', 0, 1] } }
          }
        }
      ]);

      return stats[0] || { total: 0, unread: 0, adminNotifications: 0, userNotifications: 0 };
    } catch (error) {
      console.error('❌ Erreur lors de la récupération des stats:', error);
      throw error;
    }
  }
}

module.exports = NotificationService;
