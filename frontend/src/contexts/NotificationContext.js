import React, { createContext, useContext, useEffect, useState } from 'react';
import { useSocket } from './SocketContext';
import { useAuth } from './AuthContext';

const NotificationContext = createContext();

export const useNotifications = () => {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotifications must be used within NotificationProvider');
  return ctx;
};

export const NotificationProvider = ({ children }) => {
  const { socket, on, off } = useSocket();
  const { user } = useAuth();
  const [items, setItems] = useState([]);

  useEffect(() => {
    if (!socket || !user) return;

    const normalize = (data) => {
      const raw = data && data.notification ? data.notification : data || {};
      const title = raw.title || 'Notification';
      const message = raw.message || title;
      let image = raw.image || null;
      if (image && !image.startsWith('http')) {
        image = `http://localhost:5000${image}`;
      }
      return {
        id: raw.id || `${Date.now()}-${Math.random()}`,
        title,
        message,
        type: raw.type || 'info',
        category: raw.category || 'general',
        image,
        timestamp: new Date(raw.timestamp || Date.now())
      };
    };

    const handle = (payload) => {
      // Debug: log raw payload and normalized item
      try { console.log('[Notifications] incoming payload:', payload); } catch (_) {}
      const item = normalize(payload);
      try { console.log('[Notifications] normalized item:', item); } catch (_) {}
      setItems((prev) => {
        // Move existing item to top or insert unique
        const without = prev.filter((n) => n.id !== item.id);
        return [item, ...without].slice(0, 50);
      });
    };

    try { console.log('[Notifications] Subscribing to socket events'); } catch (_) {}
    on('notification', handle);
    on('adminNotification', handle);
    on('userNotification', handle);

    return () => {
      try { console.log('[Notifications] Unsubscribing from socket events'); } catch (_) {}
      off('notification', handle);
      off('adminNotification', handle);
      off('userNotification', handle);
    };
  }, [socket, user, on, off]);

  const remove = (id) => setItems((prev) => prev.filter((n) => n.id !== id));
  const clear = () => setItems([]);

  return (
    <NotificationContext.Provider value={{ items, remove, clear }}>
      {children}
    </NotificationContext.Provider>
  );
};


