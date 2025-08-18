const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  recipient: {
    type: String,
    enum: ['admin', 'all', 'specific'],
    default: 'admin'
  },
  recipientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  message: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['info', 'success', 'warning', 'error'],
    default: 'info'
  },
  category: {
    type: String,
    enum: ['user_action', 'system', 'course', 'tutor_request', 'general'],
    default: 'general'
  },
  isRead: {
    type: Boolean,
    default: false
  },
  isAdminNotification: {
    type: Boolean,
    default: false
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

// Index pour les requêtes fréquentes
NotificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });
NotificationSchema.index({ isAdminNotification: 1, createdAt: -1 });
NotificationSchema.index({ sender: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', NotificationSchema);
