import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    // Check if user is logged in on app start
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (token && userData) {
      setIsAuthenticated(true);
      setUser(JSON.parse(userData));
    }
    

    
    setLoading(false);
    }, []);



  const login = (userData, token) => {
    setIsAuthenticated(true);
    setUser(userData);
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const logout = () => {
    setIsAuthenticated(false);
    setUser(null);
    setNotifications([]);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  const addNotification = (message, type = 'info', extras = {}) => {
    const id = Date.now();
    const newNotification = { 
      id, 
      message, 
      type, 
      timestamp: extras.timestamp ? new Date(extras.timestamp) : new Date(),
      title: extras.title || undefined,
      image: extras.image || undefined,
      category: extras.category || undefined,
    };
    setNotifications(prev => [...prev, newNotification]);
  };

  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(notif => notif.id !== id));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  const notifyAdmins = async (title, message, type = 'info', category = 'general') => {
    try {
      console.log('🔔 notifyAdmins appelé:', title, message, type);
      console.log('🔔 Utilisateur actuel:', user?.name, 'Role:', user?.role);
      
      // Envoyer via API WebSocket
      const response = await axios.post('/api/notifications/admin', {
        title,
        message,
        type,
        category
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      
      console.log('🔔 Notification admin envoyée via API:', response.data);
      
      // Si l'utilisateur actuel est admin, ajouter la notification à ses notifications
      if (user?.role === 'admin') {
        const id = Date.now();
        const newNotification = { 
          id, 
          message: `${title}: ${message}`, 
          type, 
          timestamp: new Date(),
          isAdminNotification: true 
        };
        setNotifications(prev => [...prev, newNotification]);
      }
      
      return response.data.notification;
    } catch (error) {
      console.error('❌ Erreur envoi notification admin:', error);
      
      // Fallback: ajouter directement aux notifications si l'utilisateur est admin
      if (user?.role === 'admin') {
        const id = Date.now();
        const newNotification = { 
          id, 
          message: `${title}: ${message}`, 
          type, 
          timestamp: new Date(),
          isAdminNotification: true 
        };
        setNotifications(prev => [...prev, newNotification]);
        return newNotification;
      }
      
      return null;
    }
  };



  const value = {
    isAuthenticated,
    user,
    login,
    logout,
    loading,
    notifications,
    addNotification,
    removeNotification,
    clearAllNotifications,
    notifyAdmins
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}; 