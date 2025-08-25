import React, { useEffect, useState } from 'react';
import { useSocket } from '../contexts/SocketContext';
import { useAuth } from '../contexts/AuthContext';
import { Icon, IconSizes, IconColors } from './common/IconTheme';
import './NotificationHandler.css';

const NotificationHandler = () => {
  const { socket, on, off } = useSocket();
  const { user, addNotification } = useAuth();
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    if (!socket || !user) return;

    const handleNotification = (data) => {
      console.log('🔔 Notification reçue via WebSocket:', data);
      const newNotification = {
        id: data.notification.id || Date.now() + Math.random(),
        message: data.notification.message,
        type: data.notification.type || 'info',
        timestamp: new Date(data.notification.timestamp || Date.now()),
        isAdminNotification: data.notification.isAdminNotification || false,
        title: data.notification.title || getNotificationTitle(data.notification.type),
        actions: data.notification.actions || [],
        image: data.notification.image || null,
        duration: data.notification.duration || 5000
      };
      
      // Ajouter la notification à l'état local
      setNotifications(prev => [...prev, newNotification]);
      
      // Ajouter aussi à l'AuthContext pour compatibilité
      addNotification(newNotification.message, newNotification.type);
      
      // Auto-suppression après la durée spécifiée
      setTimeout(() => {
        removeNotification(newNotification.id);
      }, newNotification.duration);
    };

    on('notification', handleNotification);

    return () => {
      off('notification', handleNotification);
    };
  }, [socket, user, on, off, addNotification]);

  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(notif => notif.id !== id));
  };

  const getNotificationTitle = (type) => {
    switch (type) {
      case 'success': return 'Succès';
      case 'error': return 'Erreur';
      case 'warning': return 'Attention';
      case 'info': return 'Information';
      default: return 'Notification';
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'success': return 'checkCircle';
      case 'error': return 'alertTriangle';
      case 'warning': return 'alertCircle';
      case 'info': return 'info';
      default: return 'bell';
    }
  };

  const formatTime = (timestamp) => {
    const now = new Date();
    const diff = now - timestamp;
    
    if (diff < 60000) return 'À l\'instant';
    if (diff < 3600000) return `Il y a ${Math.floor(diff / 60000)} min`;
    if (diff < 86400000) return `Il y a ${Math.floor(diff / 3600000)}h`;
    return timestamp.toLocaleDateString();
  };

  const handleAction = (notification, action) => {
    if (action.onClick) {
      action.onClick(notification);
    }
    if (action.closeOnClick !== false) {
      removeNotification(notification.id);
    }
  };

  return (
    <div className="notification-container">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={`notification ${notification.type} ${notification.actions.length > 0 ? 'notification-with-actions' : ''}`}
        >
          {/* Barre de progression */}
          <div className="notification-progress">
            <div className="notification-progress-bar" />
          </div>

          {/* En-tête */}
          <div className="notification-header">
            <div className="notification-title">
              <Icon 
                name={getNotificationIcon(notification.type)} 
                size={IconSizes.sm} 
                color={IconColors.white} 
                className="notification-icon"
              />
              {notification.title}
            </div>
            <button
              className="notification-close"
              onClick={() => removeNotification(notification.id)}
              title="Fermer"
            >
              <Icon name="x" size={IconSizes.xs} color={IconColors.white} />
            </button>
          </div>

          {/* Contenu */}
          <div className="notification-content">
            {notification.image && (
              <div className="notification-with-image">
                <img 
                  src={notification.image} 
                  alt="" 
                  className="notification-image"
                />
                <div className="notification-content">
                  <div className="notification-message">
                    {notification.message}
                  </div>
                  <div className="notification-time">
                    {formatTime(notification.timestamp)}
                  </div>
                </div>
              </div>
            )}
            
            {!notification.image && (
              <>
                <div className="notification-message">
                  {notification.message}
                </div>
                <div className="notification-time">
                  {formatTime(notification.timestamp)}
                </div>
              </>
            )}

            {/* Actions */}
            {notification.actions.length > 0 && (
              <div className="notification-actions">
                {notification.actions.map((action, index) => (
                  <button
                    key={index}
                    className={`notification-action-btn ${action.primary ? 'primary' : ''}`}
                    onClick={() => handleAction(notification, action)}
                  >
                    {action.icon && (
                      <Icon 
                        name={action.icon} 
                        size={IconSizes.xs} 
                        color={action.primary ? IconColors.dark : IconColors.white} 
                      />
                    )}
                    {action.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default NotificationHandler;
