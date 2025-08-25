import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isAuthenticated || !user) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
        setIsConnected(false);
      }
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      return;
    }

    // Créer la connexion WebSocket (mode robuste)
    const newSocket = io(process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000', {
      auth: { token },
      // Forcer WebSocket (évite les soucis de polling/CORS/timeouts)
      transports: ['websocket'],
      // Reconnexion agressive et illimitée
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 2000,
      reconnectionDelayMax: 10000,
      // Timeout de connexion initiale
      timeout: 20000,
      // Empêcher la création d’une nouvelle instance inutile
      forceNew: false,
      autoConnect: true
    });

    // Gestion des événements de connexion
    newSocket.on('connect', () => {
      console.log('🔌 WebSocket connecté');
      setIsConnected(true);
    });

    newSocket.on('disconnect', () => {
      console.log('🔌 WebSocket déconnecté');
      setIsConnected(false);
    });

    newSocket.on('connect_error', (error) => {
      console.error('❌ Erreur connexion WebSocket:', error);
      setIsConnected(false);
    });

    // Gestion des erreurs
    newSocket.on('error', (error) => {
      console.error('❌ Erreur WebSocket:', error);
    });

    setSocket(newSocket);

    // Cleanup lors du démontage
    return () => {
      if (newSocket) {
        newSocket.disconnect();
      }
    };
  }, [isAuthenticated, user]);

  // Reconnexion automatique en cas de déconnexion
  useEffect(() => {
    if (socket && !isConnected) {
      const reconnectTimer = setTimeout(() => {
        if (socket && !socket.connected) {
          console.log('🔄 Tentative de reconnexion WebSocket...');
          socket.connect();
        }
      }, 3000);

      return () => clearTimeout(reconnectTimer);
    }
  }, [socket, isConnected]);

  const value = {
    socket,
    isConnected,
    // Méthodes utilitaires
    emit: (event, data) => {
      if (socket && isConnected) {
        socket.emit(event, data);
      } else {
        console.warn('⚠️ WebSocket non connecté, impossible d\'émettre:', event);
      }
    },
    on: (event, callback) => {
      if (socket) {
        socket.on(event, callback);
      }
    },
    off: (event, callback) => {
      if (socket) {
        socket.off(event, callback);
      }
    }
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};
