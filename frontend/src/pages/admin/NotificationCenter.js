import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../contexts/SocketContext';
import axios from 'axios';
import ConfirmModal from '../../components/common/ConfirmModal';

const NotificationCenter = () => {
  const { user, addNotification } = useAuth();
  const { socket } = useSocket();
  const [notifications, setNotifications] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [confirmState, setConfirmState] = useState({ open: false, notificationId: null });

  const [selectedUser, setSelectedUser] = useState('');
  const [users, setUsers] = useState([]);
  const [notificationForm, setNotificationForm] = useState({
    title: '',
    message: '',
    type: 'info',
    category: 'general'
  });

  useEffect(() => {
    if (user?.role !== 'admin') {
      return;
    }

    loadNotifications();
    loadStats();
    loadUsers();

    // Écouter les nouvelles notifications admin
    if (socket) {
      const handleAdminNotification = (data) => {
        console.log('🔔 Nouvelle notification admin reçue:', data);
        if (data?.notification) {
          setNotifications(prev => [data.notification, ...prev]);
          loadStats();
        } else {
          // fallback: recharger depuis l'API
          loadNotifications();
        }
      };

      // Compatibilité avec différents noms d'événements
      socket.on('adminNotification', handleAdminNotification);
      socket.on('notification', handleAdminNotification);
    }

    return () => {
      if (socket) {
        socket.off('adminNotification');
        socket.off('notification');
      }
    };
  }, [user, socket]);

  const loadNotifications = async () => {
    try {
      const response = await axios.get('/api/notifications/admin', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setNotifications(response.data.notifications);
    } catch (error) {
      console.error('❌ Erreur chargement notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await axios.get('/api/notifications/stats', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setStats(response.data.stats);
    } catch (error) {
      console.error('❌ Erreur chargement stats:', error);
    }
  };

  const loadUsers = async () => {
    try {
      const response = await axios.get('/api/user/list', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setUsers(response.data.users.filter(u => u.role !== 'admin'));
    } catch (error) {
      console.error('❌ Erreur chargement utilisateurs:', error);
    }
  };



  const handleSendNotification = async (e) => {
    e.preventDefault();
    
    if (!notificationForm.title || !notificationForm.message) {
      addNotification && addNotification('Veuillez compléter le titre et le message avant d’envoyer.', 'warning');
      return;
    }

    try {
      if (selectedUser) {
        // Envoyer à un utilisateur spécifique
        await axios.post(`/api/notifications/user/${selectedUser}`, notificationForm, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        addNotification && addNotification('La notification a été envoyée à l’utilisateur.', 'success');
      } else {
        // Envoyer une notification admin
        await axios.post('/api/notifications/admin', notificationForm, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        addNotification && addNotification('La notification administrateur a été envoyée.', 'success');
      }
      
      setNotificationForm({ title: '', message: '', type: 'info', category: 'general' });
      setSelectedUser('');
    } catch (error) {
      console.error('❌ Erreur envoi notification:', error);
      addNotification && addNotification('L’envoi de la notification a échoué. Veuillez réessayer.', 'error');
    }
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      await axios.put(`/api/notifications/${notificationId}/read`, {}, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      
      setNotifications(prev => 
        prev.map(notif => 
          notif._id === notificationId ? { ...notif, isRead: true } : notif
        )
      );
    } catch (error) {
      console.error('❌ Erreur marquage comme lu:', error);
    }
  };

  const handleDeleteNotification = async (notificationId) => {
    setConfirmState({ open: true, notificationId });
  };

  const confirmDelete = async () => {
    const notificationId = confirmState.notificationId;
    setConfirmState({ open: false, notificationId: null });
    try {
      await axios.delete(`/api/notifications/${notificationId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setNotifications(prev => prev.filter(notif => notif._id !== notificationId));
      loadStats();
    } catch (error) {
      console.error('❌ Erreur suppression notification:', error);
    }
  };

  if (user?.role !== 'admin') {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <h2>Accès refusé</h2>
        <p>Vous devez être administrateur pour accéder à cette page.</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <ConfirmModal
        open={confirmState.open}
        title="Supprimer la notification"
        message="Confirmez-vous la suppression de cette notification ?"
        confirmLabel="Supprimer"
        destructive
        onConfirm={confirmDelete}
        onCancel={() => setConfirmState({ open: false, notificationId: null })}
      />
      <h1 style={{ marginBottom: '2rem', color: '#2c3e50' }}>
        🔔 Centre de Notifications Admin
      </h1>

      {/* Statistiques */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
        gap: '1rem', 
        marginBottom: '2rem' 
      }}>
        <div style={{ 
          background: '#fff', 
          padding: '1.5rem', 
          borderRadius: '8px', 
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          textAlign: 'center'
        }}>
          <h3 style={{ margin: '0 0 0.5rem 0', color: '#3498db' }}>Total</h3>
          <p style={{ fontSize: '2rem', margin: 0, fontWeight: 'bold' }}>{stats.total || 0}</p>
        </div>
        <div style={{ 
          background: '#fff', 
          padding: '1.5rem', 
          borderRadius: '8px', 
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          textAlign: 'center'
        }}>
          <h3 style={{ margin: '0 0 0.5rem 0', color: '#e74c3c' }}>Non lues</h3>
          <p style={{ fontSize: '2rem', margin: 0, fontWeight: 'bold' }}>{stats.unread || 0}</p>
        </div>
        <div style={{ 
          background: '#fff', 
          padding: '1.5rem', 
          borderRadius: '8px', 
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          textAlign: 'center'
        }}>
          <h3 style={{ margin: '0 0 0.5rem 0', color: '#f39c12' }}>Admin</h3>
          <p style={{ fontSize: '2rem', margin: 0, fontWeight: 'bold' }}>{stats.adminNotifications || 0}</p>
        </div>
        <div style={{ 
          background: '#fff', 
          padding: '1.5rem', 
          borderRadius: '8px', 
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          textAlign: 'center'
        }}>
          <h3 style={{ margin: '0 0 0.5rem 0', color: '#27ae60' }}>Utilisateurs</h3>
          <p style={{ fontSize: '2rem', margin: 0, fontWeight: 'bold' }}>{stats.userNotifications || 0}</p>
        </div>
      </div>



      {/* Formulaire d'envoi de notification */}
      <div style={{ 
        background: '#fff', 
        padding: '2rem', 
        borderRadius: '8px', 
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        marginBottom: '2rem'
      }}>
        <h2 style={{ marginBottom: '1rem', color: '#2c3e50' }}>📤 Envoyer une Notification</h2>
        <form onSubmit={handleSendNotification}>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
              Destinataire:
            </label>
            <select 
              value={selectedUser} 
              onChange={(e) => setSelectedUser(e.target.value)}
              style={{ 
                width: '100%', 
                padding: '0.5rem', 
                borderRadius: '4px', 
                border: '1px solid #ddd' 
              }}
            >
              <option value="">Tous les admins</option>
              {users.map(user => (
                <option key={user._id} value={user._id}>
                  {user.name} ({user.email}) - {user.role}
                </option>
              ))}
            </select>
          </div>
          
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
              Titre:
            </label>
            <input 
              type="text" 
              value={notificationForm.title}
              onChange={(e) => setNotificationForm(prev => ({ ...prev, title: e.target.value }))}
              style={{ 
                width: '100%', 
                padding: '0.5rem', 
                borderRadius: '4px', 
                border: '1px solid #ddd' 
              }}
              required
            />
          </div>
          
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
              Message:
            </label>
            <textarea 
              value={notificationForm.message}
              onChange={(e) => setNotificationForm(prev => ({ ...prev, message: e.target.value }))}
              style={{ 
                width: '100%', 
                padding: '0.5rem', 
                borderRadius: '4px', 
                border: '1px solid #ddd',
                minHeight: '100px',
                resize: 'vertical'
              }}
              required
            />
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                Type:
              </label>
              <select 
                value={notificationForm.type}
                onChange={(e) => setNotificationForm(prev => ({ ...prev, type: e.target.value }))}
                style={{ 
                  width: '100%', 
                  padding: '0.5rem', 
                  borderRadius: '4px', 
                  border: '1px solid #ddd' 
                }}
              >
                <option value="info">Info</option>
                <option value="success">Succès</option>
                <option value="warning">Avertissement</option>
                <option value="error">Erreur</option>
              </select>
            </div>
            
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                Catégorie:
              </label>
              <select 
                value={notificationForm.category}
                onChange={(e) => setNotificationForm(prev => ({ ...prev, category: e.target.value }))}
                style={{ 
                  width: '100%', 
                  padding: '0.5rem', 
                  borderRadius: '4px', 
                  border: '1px solid #ddd' 
                }}
              >
                <option value="general">Général</option>
                <option value="user_action">Action utilisateur</option>
                <option value="system">Système</option>
                <option value="course">Cours</option>
                <option value="tutor_request">Demande tuteur</option>
              </select>
            </div>
          </div>
          
          <button 
            type="submit"
            style={{
              background: '#27ae60',
              color: 'white',
              border: 'none',
              padding: '0.75rem 1.5rem',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '1rem'
            }}
          >
            Envoyer la notification
          </button>
        </form>
      </div>

      {/* Liste des notifications */}
      <div style={{ 
        background: '#fff', 
        padding: '2rem', 
        borderRadius: '8px', 
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)' 
      }}>
        <h2 style={{ marginBottom: '1rem', color: '#2c3e50' }}>📋 Notifications Admin</h2>
        
        {loading ? (
          <div style={{ textAlign: 'center', padding: '2rem' }}>Chargement...</div>
        ) : notifications.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#6c757d' }}>
            Aucune notification admin
          </div>
        ) : (
          <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
            {notifications.map(notification => (
              <div 
                key={notification._id}
                style={{
                  padding: '1rem',
                  border: '1px solid #e9ecef',
                  borderRadius: '4px',
                  marginBottom: '1rem',
                  backgroundColor: notification.isRead ? '#f8f9fa' : '#fff',
                  borderLeft: `4px solid ${
                    notification.type === 'success' ? '#28a745' :
                    notification.type === 'error' ? '#dc3545' :
                    notification.type === 'warning' ? '#ffc107' : '#17a2b8'
                  }`
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <h4 style={{ margin: '0 0 0.5rem 0', color: '#2c3e50' }}>
                      {notification.title}
                    </h4>
                    <p style={{ margin: '0 0 0.5rem 0', color: '#6c757d' }}>
                      {notification.message}
                    </p>
                    <div style={{ fontSize: '0.875rem', color: '#6c757d' }}>
                      <strong>De:</strong> {notification.sender?.name} ({notification.sender?.email})
                      <br />
                      <strong>Type:</strong> {notification.type} | <strong>Catégorie:</strong> {notification.category}
                      <br />
                      <strong>Date:</strong> {new Date(notification.createdAt).toLocaleString('fr-FR')}
                      {notification.isRead && <span style={{ color: '#28a745' }}> | ✓ Lu</span>}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {!notification.isRead && (
                      <button 
                        onClick={() => handleMarkAsRead(notification._id)}
                        style={{
                          background: '#17a2b8',
                          color: 'white',
                          border: 'none',
                          padding: '0.25rem 0.5rem',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '0.875rem'
                        }}
                      >
                        Marquer lu
                      </button>
                    )}
                    <button 
                      onClick={() => handleDeleteNotification(notification._id)}
                      style={{
                        background: '#dc3545',
                        color: 'white',
                        border: 'none',
                        padding: '0.25rem 0.5rem',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '0.875rem'
                      }}
                    >
                      Supprimer
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationCenter;
