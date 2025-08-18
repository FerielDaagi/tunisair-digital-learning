import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { userAPI, authAPI } from '../../services/api';
import ImageUploader from '../../components/common/ImageUploader';

const Profile = () => {
  const { user, login, logout, addNotification } = useAuth();
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
  const lastRoleRef = useRef(user?.role);
  const lastTutorStatusRef = useRef(user?.tutorRequestStatus || 'none');
  const [tutorRequestNote, setTutorRequestNote] = useState('');
  const [showTutorRequestModal, setShowTutorRequestModal] = useState(false);

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

  // Rafraîchissement périodique du profil pour mettre à jour le statut/role sans déconnexion
  useEffect(() => {
    const intervalId = setInterval(async () => {
      try {
        const response = await userAPI.getProfile();
        const freshUser = response.data?.user;
        if (!freshUser) return;

        const prevRole = lastRoleRef.current;
        const prevStatus = lastTutorStatusRef.current;
        const nextRole = freshUser.role;
        const nextStatus = freshUser.tutorRequestStatus || 'none';

        const roleChanged = prevRole !== nextRole;
        const statusChanged = prevStatus !== nextStatus;

        if (roleChanged || statusChanged) {
          lastRoleRef.current = nextRole;
          lastTutorStatusRef.current = nextStatus;
          login(freshUser, localStorage.getItem('token'));

          // Feedback utilisateur en cas de transition notable
          if (prevStatus === 'pending' && nextStatus === 'approved') {
            addNotification('Votre demande de tuteur a été approuvée. Vous êtes maintenant tuteur.', 'success');
          } else if (prevStatus === 'pending' && nextStatus === 'rejected') {
            addNotification("Votre demande de tuteur a été rejetée.", 'error');
            // Si il y a une raison de refus, l'afficher aussi
            if (freshUser.tutorRequestMessage) {
              setTimeout(() => {
                addNotification(`Raison du refus: ${freshUser.tutorRequestMessage}`, 'error');
              }, 1000);
            }
          }
        }
      } catch (_) {
        // Ignorer les erreurs de polling silencieusement
      }
    }, 5000);

    return () => clearInterval(intervalId);
  }, [login]);

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

  // Fonction pour déclencher l'input file
  const triggerFileInput = () => {
    // Créer un input file temporaire
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (file) {
        handleAvatarSelect(file);
      }
    };
    input.click();
  };

  // Fonction pour supprimer l'avatar
  const removeAvatar = () => {
    setAvatarFile(null);
    setAvatarPreview(null);
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

      console.log('Données à envoyer:', profileData);
      const profileResponse = await userAPI.updateProfile(profileData);
      console.log('Profil mis à jour:', profileResponse.data);
      
      // Mettre à jour l'avatar si un nouveau fichier a été sélectionné
      if (avatarFile) {
        console.log('Mise à jour de l\'avatar...');
        const formDataAvatar = new FormData();
        formDataAvatar.append('avatar', avatarFile);
        
        try {
          const avatarResponse = await userAPI.updateAvatar(formDataAvatar);
          console.log('Avatar mis à jour:', avatarResponse.data);
          
          // Mettre à jour l'aperçu avec la nouvelle URL
          if (avatarResponse.data.user?.profile?.avatar) {
            const newAvatarUrl = avatarResponse.data.user.profile.avatar.startsWith('http') 
              ? avatarResponse.data.user.profile.avatar 
              : `http://localhost:5000${avatarResponse.data.user.profile.avatar}`;
            setAvatarPreview(newAvatarUrl);
            console.log('Nouvelle URL avatar:', newAvatarUrl);
          }
          
          // Mettre à jour le contexte utilisateur avec les nouvelles données
          if (avatarResponse.data.user) {
            login(avatarResponse.data.user, localStorage.getItem('token'));
            console.log('Contexte utilisateur mis à jour avec avatar');
          }
        } catch (avatarError) {
          console.error('Erreur mise à jour avatar:', avatarError);
          setError('Erreur lors de la mise à jour de l\'avatar');
          return;
        }
      } else {
        // Si pas d'avatar, mettre à jour le contexte avec la réponse du profil
        if (profileResponse.data.user) {
          login(profileResponse.data.user, localStorage.getItem('token'));
          console.log('Contexte utilisateur mis à jour sans avatar');
        }
      }

      setSuccess('Profil mis à jour avec succès !');
      
      // Réinitialiser l'avatar
      setAvatarFile(null);
      
    } catch (err) {
      console.error('Erreur mise à jour profil:', err);
      let errorMessage = 'Erreur lors de la mise à jour du profil';
      
      if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
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

  const handleRequestTutor = async () => {
    try {
      const response = await userAPI.requestTutor(tutorRequestNote);
      addNotification('Votre demande de tuteur a été envoyée aux administrateurs !', 'success');
      if (response.data?.user) {
        login(response.data.user, localStorage.getItem('token'));
      }
      setShowTutorRequestModal(false);
      setTutorRequestNote('');
    } catch (err) {
      addNotification(err.response?.data?.message || 'Erreur lors de l\'envoi de la demande de tuteur', 'error');
    }
  };

  const handleConfirmAction = async () => {
    if (confirmAction === 'deleteAccount') {
      await handleDeleteAccount();
    } else if (confirmAction === 'requestTutor') {
      await handleRequestTutor();
    }
    setShowConfirmModal(false);
    setConfirmAction(null);
    setConfirmMessage('');
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
            <h2 className="card-title">Mon Profil</h2>
            <p className="card-subtitle">
              Gérez vos informations personnelles et votre avatar
            </p>
          </div>

          {(error || success) && (
            <div style={{ marginBottom: '1rem' }}>
              {error && (
                <div style={{
                  backgroundColor: '#f8d7da',
                  color: '#721c24',
                  padding: '0.75rem',
                  borderRadius: '6px',
                  border: '1px solid #f5c6cb',
                  marginBottom: success ? '0.5rem' : 0
                }}>
                  {error}
                </div>
              )}
              {success && (
                <div style={{
                  backgroundColor: '#d4edda',
                  color: '#155724',
                  padding: '0.75rem',
                  borderRadius: '6px',
                  border: '1px solid #c3e6cb'
                }}>
                  {success}
                </div>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Section Avatar */}
            <div className="form-group">
              <label className="form-label">Photo de profil</label>
              
              <div className="avatar-preview-container">
                <div 
                  className="avatar-preview clickable"
                  onClick={triggerFileInput}
                  title="Cliquez pour changer votre photo"
                >
                  {avatarPreview ? (
                    <img 
                      src={avatarPreview} 
                      alt="Avatar" 
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <div className="avatar-placeholder">
                      {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                    </div>
                  )}
                  
                  {/* Overlay pour indiquer que c'est cliquable */}
                  <div className="avatar-overlay">
                    <span className="avatar-overlay-text">📷</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Informations personnelles */}
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

            <div className="grid grid-cols-2" style={{ gap: '1rem' }}>
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
            <h3 className="card-title">Informations du compte</h3>
          </div>

          <div className="form-group">
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
                  color: 'var(--text-primary)'
                }}>
                  {user.name || 'Utilisateur'}
                </div>
                <div style={{
                  color: 'var(--text-secondary)',
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
            backgroundColor: 'var(--bg-secondary)', 
            padding: '1.5rem', 
            borderRadius: '12px',
            marginBottom: '1.5rem'
          }}>
            <h5 style={{ margin: '0 0 1rem 0', color: 'var(--text-primary)' }}>Actions du compte</h5>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
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
              
              {user.role === 'apprenti' && (
                <button
                  type="button"
                  onClick={() => {
                    if (user.tutorRequestStatus === 'pending') {
                      setConfirmAction('requestTutor');
                      setConfirmMessage('Votre demande est déjà en cours de traitement.');
                      setShowConfirmModal(true);
                    } else {
                      setShowTutorRequestModal(true);
                    }
                  }}
                  className="btn btn-outline"
                  style={{ 
                    fontSize: '0.9rem',
                    color: 'var(--secondary-teal)',
                    borderColor: 'var(--secondary-teal)'
                  }}
                  disabled={user.tutorRequestStatus === 'pending'}
                >
                  {user.tutorRequestStatus === 'pending' ? '⏳ Traitement de votre demande en cours' : '🎓 Demander à être tuteur'}
                </button>
              )}
              

              
              <button
                type="button"
                onClick={() => {
                  setConfirmAction('deleteAccount');
                  setConfirmMessage('Êtes-vous sûr de vouloir supprimer votre compte ? Cette action est irréversible.');
                  setShowConfirmModal(true);
                }}
                className="btn btn-outline"
                style={{ 
                  fontSize: '0.9rem',
                  color: 'var(--danger)',
                  borderColor: 'var(--danger)'
                }}
              >
                🗑️ Supprimer le compte
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

      {/* Modale de confirmation */}
      {showConfirmModal && (
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
            borderRadius: '16px',
            padding: '2rem',
            maxWidth: '500px',
            width: '90%',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.2)',
            position: 'relative'
          }}>
            <h3 style={{ 
              margin: '0 0 1rem 0', 
              color: 'var(--text-primary)',
              fontSize: '1.5rem'
            }}>
              Confirmation
            </h3>
            
            <p style={{ 
              margin: '0 0 2rem 0', 
              color: 'var(--text-secondary)',
              lineHeight: '1.6'
            }}>
              {confirmMessage}
            </p>

            {confirmAction === 'deleteAccount' && (
              <div style={{ marginBottom: '1.5rem' }}>
                <label htmlFor="deleteConfirm" className="form-label">
                  Tapez SUPPRIMER pour confirmer
                </label>
                <input
                  type="text"
                  id="deleteConfirm"
                  className="form-control"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder="SUPPRIMER"
                />
              </div>
            )}

            <div style={{ 
              display: 'flex', 
              gap: '1rem',
              justifyContent: 'flex-end'
            }}>
              <button
                type="button"
                onClick={() => {
                  setShowConfirmModal(false);
                  setConfirmAction(null);
                  setConfirmMessage('');
                  setDeleteConfirmText('');
                }}
                className="btn btn-outline"
                style={{ minWidth: '100px' }}
              >
                Annuler
              </button>
              
              <button
                type="button"
                onClick={handleConfirmAction}
                className="btn btn-primary"
                style={{ 
                  minWidth: '100px',
                  backgroundColor: confirmAction === 'deleteAccount' ? 'var(--danger)' : 'var(--primary-blue)'
                }}
              >
                {confirmAction === 'deleteAccount' ? 'Supprimer' : 'Confirmer'}
              </button>
            </div>

            {/* Bouton de fermeture */}
            <button
              onClick={() => {
                setShowConfirmModal(false);
                setConfirmAction(null);
                setConfirmMessage('');
                setDeleteConfirmText('');
              }}
              style={{
                position: 'absolute',
                top: '15px',
                right: '15px',
                background: 'transparent',
                border: 'none',
                fontSize: '1.5rem',
                cursor: 'pointer',
                color: 'var(--text-secondary)',
                padding: '8px',
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = 'var(--bg-secondary)';
                e.target.style.color = 'var(--text-primary)';
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = 'transparent';
                e.target.style.color = 'var(--text-secondary)';
              }}
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Modal: Demande de tutorat avec note */}
      {showTutorRequestModal && (
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
            borderRadius: '16px',
            padding: '2rem',
            maxWidth: '500px',
            width: '90%',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.2)',
            position: 'relative'
          }}>
            <h3 style={{ 
              margin: '0 0 1rem 0', 
              color: 'var(--text-primary)',
              fontSize: '1.5rem'
            }}>
              Demande de tutorat
            </h3>
            
            <p style={{ 
              margin: '0 0 1.5rem 0', 
              color: 'var(--text-secondary)',
              lineHeight: '1.6'
            }}>
              Vous pouvez joindre une note à votre demande (optionnel) :
            </p>

            <div style={{ marginBottom: '2rem' }}>
              <label htmlFor="tutorRequestNote" className="form-label">
                Note (optionnel)
              </label>
              <textarea
                id="tutorRequestNote"
                className="form-control"
                value={tutorRequestNote}
                onChange={(e) => setTutorRequestNote(e.target.value)}
                placeholder="Expliquez pourquoi vous souhaitez devenir tuteur..."
                rows="4"
                style={{ resize: 'vertical' }}
              />
            </div>

            <div style={{ 
              display: 'flex', 
              gap: '1rem',
              justifyContent: 'flex-end'
            }}>
              <button
                type="button"
                onClick={() => {
                  setShowTutorRequestModal(false);
                  setTutorRequestNote('');
                }}
                className="btn btn-outline"
                style={{ minWidth: '100px' }}
              >
                Annuler
              </button>
              
              <button
                type="button"
                onClick={handleRequestTutor}
                className="btn btn-primary"
                style={{ minWidth: '100px' }}
              >
                Envoyer la demande
              </button>
            </div>

            {/* Bouton de fermeture */}
            <button
              onClick={() => {
                setShowTutorRequestModal(false);
                setTutorRequestNote('');
              }}
              style={{
                position: 'absolute',
                top: '15px',
                right: '15px',
                background: 'transparent',
                border: 'none',
                fontSize: '1.5rem',
                cursor: 'pointer',
                color: 'var(--text-secondary)',
                padding: '8px',
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = 'var(--bg-secondary)';
                e.target.style.color = 'var(--text-primary)';
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = 'transparent';
                e.target.style.color = 'var(--text-secondary)';
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