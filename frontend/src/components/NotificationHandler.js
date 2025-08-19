import React, { useEffect } from 'react';
import { useSocket } from '../contexts/SocketContext';
import { useAuth } from '../contexts/AuthContext';
import { Icon, IconSizes, IconColors } from './common/IconTheme';

const NotificationHandler = () => {
  const { socket, on, off } = useSocket();
  const { user, addNotification } = useAuth();

  useEffect(() => {
    if (!socket || !user) return;

    const handleNotification = (data) => {
      console.log('🔔 Notification reçue via WebSocket:', data);
      const newNotification = {
        id: data.notification.id || Date.now(),
        message: data.notification.message,
        type: data.notification.type || 'info',
        timestamp: new Date(data.notification.timestamp || Date.now()),
        isAdminNotification: data.notification.isAdminNotification || false
      };
      
      // Add the notification to the AuthContext
      addNotification(newNotification.message, newNotification.type);
    };

    on('notification', handleNotification);

    return () => {
      off('notification', handleNotification);
    };
  }, [socket, user, on, off, addNotification]);

  return null; // This component doesn't render anything
};

export default NotificationHandler;
