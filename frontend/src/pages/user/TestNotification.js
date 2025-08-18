import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';

const TestNotification = () => {
  const { user, notifyAdmins, addNotification } = useAuth();
  const [notificationForm, setNotificationForm] = useState({
    title: '',
    message: '',
    type: 'info',
    category: 'general'
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!notificationForm.title || !notificationForm.message) {
      addNotification('Veuillez remplir tous les champs', 'error');
      return;
    }

    setLoading(true);
    
    try {
      await notifyAdmins(
        notificationForm.title,
        notificationForm.message,
        notificationForm.type,
        notificationForm.category
      );
      
      addNotification('Notification admin envoyée avec succès !', 'success');
      setNotificationForm({ title: '', message: '', type: 'info', category: 'general' });
    } catch (error) {
      console.error('❌ Erreur envoi notification:', error);
      addNotification('Erreur lors de l\'envoi de la notification', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickTest = async () => {
    setLoading(true);
    
    try {
      await notifyAdmins(
        'Test de notification',
        `Ceci est un test de notification envoyé par ${user?.name} (${user?.email})`,
        'info',
        'system'
      );
      
      addNotification('Test de notification envoyé !', 'success');
    } catch (error) {
      console.error('❌ Erreur test notification:', error);
      addNotification('Erreur lors du test', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <h1 style={{ marginBottom: '2rem', color: '#2c3e50' }}>
        🔔 Test de Notifications Admin
      </h1>

      <div style={{ 
        background: '#fff', 
        padding: '2rem', 
        borderRadius: '8px', 
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        marginBottom: '2rem'
      }}>
        <h2 style={{ marginBottom: '1rem', color: '#2c3e50' }}>Informations</h2>
        <p style={{ color: '#6c757d', lineHeight: '1.6' }}>
          Cette page vous permet de tester l'envoi de notifications aux administrateurs.
          Les notifications seront reçues en temps réel par tous les admins connectés.
        </p>
        
        <div style={{ 
          background: '#f8f9fa', 
          padding: '1rem', 
          borderRadius: '4px', 
          marginTop: '1rem' 
        }}>
          <strong>Utilisateur actuel:</strong> {user?.name} ({user?.email}) - {user?.role}
        </div>
      </div>

      {/* Test rapide */}
      <div style={{ 
        background: '#fff', 
        padding: '2rem', 
        borderRadius: '8px', 
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        marginBottom: '2rem'
      }}>
        <h2 style={{ marginBottom: '1rem', color: '#2c3e50' }}>🧪 Test Rapide</h2>
        <p style={{ color: '#6c757d', marginBottom: '1rem' }}>
          Envoyer une notification de test automatique
        </p>
        <button 
          onClick={handleQuickTest}
          disabled={loading}
          style={{
            background: '#3498db',
            color: 'white',
            border: 'none',
            padding: '0.75rem 1.5rem',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontSize: '1rem',
            opacity: loading ? 0.6 : 1
          }}
        >
          {loading ? 'Envoi...' : 'Envoyer un test rapide'}
        </button>
      </div>

      {/* Formulaire personnalisé */}
      <div style={{ 
        background: '#fff', 
        padding: '2rem', 
        borderRadius: '8px', 
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)' 
      }}>
        <h2 style={{ marginBottom: '1rem', color: '#2c3e50' }}>📝 Notification Personnalisée</h2>
        <form onSubmit={handleSubmit}>
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
              placeholder="Titre de la notification"
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
              placeholder="Message de la notification"
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
            disabled={loading}
            style={{
              background: '#27ae60',
              color: 'white',
              border: 'none',
              padding: '0.75rem 1.5rem',
              borderRadius: '4px',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: '1rem',
              opacity: loading ? 0.6 : 1
            }}
          >
            {loading ? 'Envoi...' : 'Envoyer la notification'}
          </button>
        </form>
      </div>

      {/* Instructions */}
      <div style={{ 
        background: '#e8f4fd', 
        padding: '1.5rem', 
        borderRadius: '8px', 
        marginTop: '2rem',
        border: '1px solid #bee5eb'
      }}>
        <h3 style={{ marginBottom: '1rem', color: '#0c5460' }}>💡 Instructions</h3>
        <ul style={{ color: '#0c5460', lineHeight: '1.6', margin: 0, paddingLeft: '1.5rem' }}>
          <li>Les notifications sont envoyées en temps réel aux administrateurs connectés</li>
          <li>Vous pouvez tester avec différents types et catégories</li>
          <li>Les admins recevront les notifications dans leur centre de notifications</li>
          <li>Assurez-vous qu'au moins un admin soit connecté pour voir les notifications</li>
        </ul>
      </div>
    </div>
  );
};

export default TestNotification;
