import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { userAPI, authAPI } from '../../services/api';
import ImageUploader from '../../components/common/ImageUploader';

const Profile = () => {
  const { user, login, logout } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    bio: '',
    phone: '',
    dateOfBirth: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [showAvatarHistory, setShowAvatarHistory] = useState(false);
  const [avatarHistory, setAvatarHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [confirmMessage, setConfirmMessage] = useState('');

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        bio: user.profile?.bio || '',
        phone: user.profile?.phone || '',
        dateOfBirth: user.profile?.dateOfBirth ? user.profile.dateOfBirth.split('T')[0] : '',
      });
      
      // Charger l'avatar existant depuis le serveur
      if (user.profile?.avatar) {
        const avatarUrl = user.profile.avatar.startsWith('http') 
          ? user.profile.avatar 
          : `http://localhost:5000${user.profile.avatar}`;
        setAvatarPreview(avatarUrl);
      } else {
        // S'assurer qu'il n'y a pas d'ancien aperçu si pas d'avatar
        setAvatarPreview(null);
      }
    }
  }, [user]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleAvatarSelect = (file) => {
    setAvatarFile(file);
    if (file) {
      setAvatarPreview(URL.createObjectURL(file));
    } else {
      setAvatarPreview(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Mettre à jour le profil
      const profileData = {
        name: formData.name,
        profile: {
          bio: formData.bio,
          phone: formData.phone,
          dateOfBirth: formData.dateOfBirth,
        }
      };

      const profileResponse = await userAPI.updateProfile(profileData);
      
      // Mettre à jour l'avatar si un nouveau fichier a été sélectionné
      if (avatarFile) {
        const formDataAvatar = new FormData();
        formDataAvatar.append('avatar', avatarFile);
        
        const avatarResponse = await userAPI.updateAvatar(formDataAvatar);
        console.log('Avatar mis à jour:', avatarResponse.data);
        
        // Mettre à jour l'aperçu avec la nouvelle URL
        if (avatarResponse.data.user?.profile?.avatar) {
          const newAvatarUrl = avatarResponse.data.user.profile.avatar.startsWith('http') 
            ? avatarResponse.data.user.profile.avatar 
            : `http://localhost:5000${avatarResponse.data.user.profile.avatar}`;
          setAvatarPreview(newAvatarUrl);
        }
      }

      setSuccess('Profil mis à jour avec succès !');
      
      // Recharger les données utilisateur
      if (profileResponse.data.user) {
        login(profileResponse.data.user, localStorage.getItem('token'));
      }
      
      // Réinitialiser l'avatar
      setAvatarFile(null);
      
    } catch (err) {
      console.error('Erreur mise à jour profil:', err);
      setError(err.response?.data?.message || 'Erreur lors de la mise à jour du profil');
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour charger l'historique des avatars
  const loadAvatarHistory = async () => {
    setLoadingHistory(true);
    try {
      const response = await userAPI.getAvatarHistory();
      setAvatarHistory(response.data.previousAvatars || []);
    } catch (err) {
      console.error('Erreur chargement historique:', err);
      setError('Erreur lors du chargement de l\'historique des avatars');
    } finally {
      setLoadingHistory(false);
    }
  };

  // Fonction pour restaurer un avatar
  const restoreAvatar = async (avatarPath) => {
    try {
      const response = await userAPI.restoreAvatar(avatarPath);
      
      // Mettre à jour le contexte utilisateur
      login(response.data.user, localStorage.getItem('token'));
      
      // Mettre à jour l'aperçu
      const avatarUrl = avatarPath.startsWith('http') 
        ? avatarPath 
        : `http://localhost:5000${avatarPath}`;
      setAvatarPreview(avatarUrl);
      
      setSuccess('Avatar restauré avec succès !');
      setShowAvatarHistory(false);
      
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de la restauration de l\'avatar');
    }
  };

  // Fonction pour supprimer un avatar de l'historique
  const deleteAvatarFromHistory = async (avatarPath, event) => {
    event.stopPropagation(); // Empêcher la restauration
    
    try {
      await userAPI.deleteAvatarFromHistory(avatarPath);
      
      // Mettre à jour la liste locale
      setAvatarHistory(prev => prev.filter(avatar => avatar !== avatarPath));
      setSuccess('Avatar supprimé de l\'historique !');
      
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de la suppression de l\'avatar');
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'SUPPRIMER') {
      setError('Veuillez taper SUPPRIMER pour confirmer la suppression');
      return;
    }

    try {
      await authAPI.deleteAccount();
      setSuccess('Compte supprimé avec succès');
      setTimeout(() => {
        logout();
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de la suppression du compte');
    }
  };

  if (!user) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem' }}>
        <p>Chargement du profil...</p>
      </div>
    );
  }

  return (
    <div className="main-content">
      <div className="grid grid-2">
        {/* Carte principale du profil */}
        <div className="card">
          <div className="card-header">
            <h2 style={{ margin: 0, color: '#495057' }}>Mon Profil</h2>
            <p style={{ margin: '0.5rem 0 0 0', color: '#6c757d' }}>
              Gérez vos informations personnelles et votre avatar
            </p>
          </div>

          {error && (
            <div className="alert alert-error">
              {error}
            </div>
          )}

          {success && (
            <div className="alert alert-success">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Section Avatar */}
            <div style={{ marginBottom: '2rem' }}>
              <h4 style={{ 
                marginBottom: '1rem', 
                color: '#495057', 
                fontSize: '1.1rem',
                borderBottom: '1px solid #dee2e6',
                paddingBottom: '0.5rem'
              }}>
                Photo de profil
              </h4>
              
              <ImageUploader
                onImageSelect={handleAvatarSelect}
                currentImage={avatarFile || avatarPreview}
                placeholder="Sélectionnez votre photo de profil"
                maxSize={5}
                acceptedTypes={['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']}
                style={{ maxWidth: '400px' }}
              />
            </div>

            {/* Informations personnelles */}
            <div style={{ marginBottom: '2rem' }}>
              <h4 style={{ 
                marginBottom: '1rem', 
                color: '#495057', 
                fontSize: '1.1rem',
                borderBottom: '1px solid #dee2e6',
                paddingBottom: '0.5rem'
              }}>
                Informations personnelles
              </h4>

              <div className="form-group">
                <label htmlFor="name" className="form-label">Nom complet *</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  className="form-control"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  placeholder="Votre nom complet"
                />
              </div>

              <div className="form-group">
                <label htmlFor="bio" className="form-label">Bio</label>
                <textarea
                  id="bio"
                  name="bio"
                  className="form-control"
                  value={formData.bio}
                  onChange={handleChange}
                  placeholder="Décrivez-vous en quelques mots..."
                  rows="4"
                  style={{ resize: 'vertical' }}
                />
              </div>

              <div className="form-group">
                <label htmlFor="phone" className="form-label">Téléphone</label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  className="form-control"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+33 1 23 45 67 89"
                />
              </div>

              <div className="form-group">
                <label htmlFor="dateOfBirth" className="form-label">Date de naissance</label>
                <input
                  type="date"
                  id="dateOfBirth"
                  name="dateOfBirth"
                  className="form-control"
                  value={formData.dateOfBirth}
                  onChange={handleChange}
                />
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
              style={{ width: '100%' }}
            >
              {loading ? 'Mise à jour en cours...' : 'Mettre à jour le profil'}
            </button>
          </form>
        </div>

        {/* Carte des informations du compte */}
        <div className="card">
          <div className="card-header">
            <h3 style={{ margin: 0, color: '#495057' }}>Informations du compte</h3>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '1rem',
              marginBottom: '1rem'
            }}>
              <div style={{
                width: '60px',
                height: '60px',
                borderRadius: '50%',
                backgroundColor: 'var(--primary-blue)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.5rem',
                color: 'white',
                fontWeight: 'bold'
              }}>
                {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <div>
                <div style={{
                  fontSize: '1.2rem',
                  fontWeight: '600',
                  color: '#495057'
                }}>
                  {user.name || 'Utilisateur'}
                </div>
                <div style={{
                  color: '#6c757d',
                  fontSize: '0.9rem'
                }}>
                  {user.email}
                </div>
                <div style={{
                  display: 'inline-block',
                  padding: '0.25rem 0.75rem',
                  backgroundColor: user.role === 'admin' ? 'var(--danger)' : 'var(--success)',
                  color: 'white',
                  borderRadius: '20px',
                  fontSize: '0.8rem',
                  fontWeight: '600',
                  textTransform: 'capitalize',
                  marginTop: '0.25rem'
                }}>
                  {user.role || 'apprenti'}
                </div>
              </div>
            </div>
          </div>

          <div style={{ 
            backgroundColor: '#f8f9fa', 
            padding: '1rem', 
            borderRadius: '8px',
            marginBottom: '1.5rem'
          }}>
            <h5 style={{ margin: '0 0 0.5rem 0', color: '#495057' }}>Actions du compte</h5>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <button
                type="button"
                onClick={() => {
                  setShowAvatarHistory(true);
                  loadAvatarHistory();
                }}
                className="btn btn-outline"
                style={{ fontSize: '0.9rem' }}
              >
                📚 Historique des avatars
              </button>
              
              <button
                type="button"
                onClick={() => setShowDeleteModal(true)}
                className="btn btn-outline"
                style={{ 
                  fontSize: '0.9rem',
                  color: 'var(--danger)',
                  borderColor: 'var(--danger)'
                }}
              >
                🗑️ Supprimer mon compte
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de suppression de compte */}
      {showDeleteModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            padding: '2rem',
            borderRadius: '16px',
            maxWidth: '500px',
            width: '90%',
            textAlign: 'center'
          }}>
            <h3 style={{ color: 'var(--danger)', marginBottom: '1rem' }}>
              ⚠️ Suppression définitive du compte
            </h3>
            <p style={{ marginBottom: '1.5rem', color: '#6c757d' }}>
              Cette action est irréversible. Toutes vos données seront définitivement supprimées.
            </p>
            <div style={{ marginBottom: '1.5rem' }}>
              <label htmlFor="deleteConfirm" style={{ display: 'block', marginBottom: '0.5rem' }}>
                Tapez <strong>SUPPRIMER</strong> pour confirmer :
              </label>
              <input
                type="text"
                id="deleteConfirm"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '2px solid #dee2e6',
                  borderRadius: '8px',
                  fontSize: '1rem'
                }}
                placeholder="SUPPRIMER"
              />
            </div>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <button
                onClick={() => setShowDeleteModal(false)}
                className="btn btn-outline"
                style={{ minWidth: '120px' }}
              >
                Annuler
              </button>
              <button
                onClick={handleDeleteAccount}
                className="btn"
                style={{ 
                  minWidth: '120px',
                  background: 'var(--danger)',
                  color: 'white'
                }}
                disabled={deleteConfirmText !== 'SUPPRIMER'}
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Historique des avatars */}
      {showAvatarHistory && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '16px',
            padding: '2rem',
            maxWidth: '700px',
            width: '90%',
            maxHeight: '80vh',
            overflow: 'auto',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)',
            position: 'relative'
          }}>
            {/* En-tête du modal */}
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
              <div style={{ 
                fontSize: '3rem', 
                marginBottom: '1rem',
                color: 'var(--primary-blue)'
              }}>
                📚
              </div>
              <h3 style={{ 
                color: '#495057', 
                marginBottom: '0.5rem',
                fontSize: '1.8rem',
                fontWeight: '700'
              }}>
                Historique des avatars
              </h3>
              <p style={{ color: '#6c757d', fontSize: '1rem' }}>
                Sélectionnez un avatar précédent pour le restaurer
              </p>
            </div>

            {/* Contenu de l'historique */}
            {loadingHistory ? (
              <div style={{ textAlign: 'center', padding: '3rem' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>⏳</div>
                <p style={{ fontSize: '1.1rem' }}>Chargement de l'historique...</p>
              </div>
            ) : avatarHistory.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem' }}>
                <div style={{ fontSize: '4rem', marginBottom: '1rem', color: '#6c757d' }}>📷</div>
                <p style={{ color: '#6c757d', fontSize: '1.1rem' }}>Aucun avatar dans l'historique</p>
                <small style={{ color: '#adb5bd', fontSize: '0.9rem' }}>
                  Les avatars précédents apparaîtront ici après les avoir changés
                </small>
              </div>
            ) : (
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
                gap: '1.5rem',
                marginBottom: '2rem'
              }}>
                {avatarHistory.map((avatarPath, index) => {
                  const avatarUrl = avatarPath.startsWith('http') 
                    ? avatarPath 
                    : `http://localhost:5000${avatarPath}`;
                  
                  return (
                    <div
                      key={index}
                      style={{
                        position: 'relative',
                        cursor: 'pointer',
                        borderRadius: '12px',
                        overflow: 'hidden',
                        border: '2px solid #dee2e6',
                        transition: 'all 0.3s ease',
                        backgroundColor: '#f8f9fa'
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.borderColor = 'var(--primary-blue)';
                        e.target.style.transform = 'scale(1.05)';
                        e.target.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.15)';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.borderColor = '#dee2e6';
                        e.target.style.transform = 'scale(1)';
                        e.target.style.boxShadow = 'none';
                      }}
                      onClick={() => restoreAvatar(avatarPath)}
                    >
                      <img 
                        src={avatarUrl} 
                        alt={`Avatar ${index + 1}`}
                        style={{ 
                          width: '100%', 
                          height: '150px', 
                          objectFit: 'cover',
                          display: 'block'
                        }}
                      />
                      
                      {/* Bouton Restaurer */}
                      <div style={{
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        background: 'linear-gradient(transparent, rgba(0,0,0,0.8))',
                        color: 'white',
                        padding: '0.75rem',
                        fontSize: '0.9rem',
                        textAlign: 'center',
                        fontWeight: '600'
                      }}>
                        Restaurer
                      </div>
                      
                      {/* Bouton Supprimer */}
                      <button
                        onClick={(e) => deleteAvatarFromHistory(avatarPath, e)}
                        style={{
                          position: 'absolute',
                          top: '8px',
                          right: '8px',
                          background: 'rgba(239, 68, 68, 0.9)',
                          color: 'white',
                          border: 'none',
                          borderRadius: '50%',
                          width: '28px',
                          height: '28px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '1rem',
                          fontWeight: 'bold',
                          transition: 'all 0.3s ease',
                          opacity: 0.8
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.opacity = 1;
                          e.target.style.transform = 'scale(1.1)';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.opacity = 0.8;
                          e.target.style.transform = 'scale(1)';
                        }}
                        title="Supprimer de l'historique"
                      >
                        ×
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Boutons d'action */}
            <div style={{ 
              display: 'flex', 
              gap: '1rem',
              justifyContent: 'center'
            }}>
              <button
                type="button"
                onClick={() => setShowAvatarHistory(false)}
                className="btn btn-outline"
                style={{ 
                  minWidth: '140px',
                  padding: '0.75rem 1.5rem',
                  fontSize: '1rem'
                }}
              >
                Fermer
              </button>
            </div>

            {/* Bouton de fermeture */}
            <button
              onClick={() => setShowAvatarHistory(false)}
              style={{
                position: 'absolute',
                top: '15px',
                right: '15px',
                background: 'transparent',
                border: 'none',
                fontSize: '1.8rem',
                cursor: 'pointer',
                color: '#6c757d',
                padding: '8px',
                borderRadius: '50%',
                width: '40px',
                height: '40px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = '#f8f9fa';
                e.target.style.color = '#dc3545';
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = 'transparent';
                e.target.style.color = '#6c757d';
              }}
            >
              ×
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;