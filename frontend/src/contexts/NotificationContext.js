import React, { createContext, useContext, useEffect, useState } from 'react';
import { useSocket } from './SocketContext';
import { useAuth } from './AuthContext';
import { userAPI } from '../services/api';

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

    const handle = async (payload) => {
      // Debug: log raw payload and normalized item
      try { console.log('[Notifications] incoming payload:', payload); } catch (_) {}
      const item = normalize(payload);
      try { console.log('[Notifications] normalized item:', item); } catch (_) {}
      setItems((prev) => {
        // Move existing item to top or insert unique
        const without = prev.filter((n) => n.id !== item.id);
        return [item, ...without].slice(0, 50);
      });

      // Si admin et notification liée aux demandes de tutorat, recalculer le nombre en attente
      if (user?.role === 'admin' && item.category === 'tutor_request') {
        try {
          const resp = await userAPI.getAllUsers();
          const list = resp.data?.users || [];
          const count = list.filter(u => u.role === 'apprenti' && u.tutorRequestStatus === 'pending').length;
          if (count > 0) addTutorRequestNotification(count); else removeTutorRequestNotification();
        } catch (e) {
          // fallback: au moins afficher 1 si on ne peut pas recalculer
          addTutorRequestNotification(1);
        }
      }
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

  // Au montage pour les admins: calculer les demandes en attente même sans ouvrir la page admin
  useEffect(() => {
    const bootstrapPending = async () => {
      if (!user || user.role !== 'admin') return;
      try {
        const resp = await userAPI.getAllUsers();
        const list = resp.data?.users || [];
        const count = list.filter(u => u.role === 'apprenti' && u.tutorRequestStatus === 'pending').length;
        if (count > 0) addTutorRequestNotification(count); else removeTutorRequestNotification();
      } catch (e) {
        // Ignorer en silence
      }
    };
    bootstrapPending();
  }, [user]);

  const remove = (id) => setItems((prev) => prev.filter((n) => n.id !== id));
  const clear = () => setItems([]);

  // Fonction pour créer une notification de demandes de tutorat
  const addTutorRequestNotification = (pendingCount) => {
    const notification = {
      id: 'tutor-requests-pending',
      title: 'Demandes de tutorat en attente',
      message: pendingCount === 1 
        ? 'Un apprenti attend une réponse pour sa demande de tutorat'
        : `${pendingCount} apprentis attendent une réponse pour leur demande de tutorat`,
      type: 'warning',
      category: 'tutor_request',
      image: null,
      timestamp: new Date(),
      count: pendingCount
    };

    setItems((prev) => {
      const without = prev.filter((n) => n.id !== notification.id);
      return [notification, ...without].slice(0, 50);
    });
  };

  // Fonction pour supprimer la notification de demandes de tutorat
  const removeTutorRequestNotification = () => {
    remove('tutor-requests-pending');
  };

  return (
    <NotificationContext.Provider value={{ 
      items, 
      remove, 
      clear, 
      addTutorRequestNotification, 
      removeTutorRequestNotification 
    }}>
      {children}
    </NotificationContext.Provider>
  );
};


