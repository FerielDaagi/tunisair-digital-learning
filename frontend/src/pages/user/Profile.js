import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { userAPI, authAPI } from '../../services/api';

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

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Vérifier le type de fichier
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        setError('Veuillez sélectionner une image valide (JPG, PNG, GIF, WebP)');
        return;
      }

      // Vérifier la taille du fichier (max 5MB)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        setError('La taille de l\'image ne doit pas dépasser 5MB');
        return;
      }

      setAvatarFile(file);

      // Créer un aperçu de l'image
      const reader = new FileReader();
      reader.onload = (e) => {
        setAvatarPreview(e.target.result);
      };
      reader.readAsDataURL(file);
      
      // Effacer les erreurs précédentes
      setError('');
    }
  };

  const removeAvatar = () => {
    setAvatarFile(null);
    setAvatarPreview(null);
    // Réinitialiser l'input file
    const fileInput = document.getElementById('avatar');
    if (fileInput) {
      fileInput.value = '';
    }
  };

  const triggerFileInput = () => {
    const fileInput = document.getElementById('avatar');
    if (fileInput) {
      fileInput.click();
    }
  };

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

  const deleteAvatarFromHistory = async (avatarPath, event) => {
    event.stopPropagation(); // Empêcher la restauration
    
    showConfirmation(
      'Êtes-vous sûr de vouloir supprimer cet avatar de l\'historique ? Cette action est irréversible.',
      async () => {
        try {
          await userAPI.deleteAvatarFromHistory(avatarPath);
          
          // Mettre à jour la liste locale
          setAvatarHistory(prev => prev.filter(avatar => avatar !== avatarPath));
          setSuccess('Avatar supprimé de l\'historique !');
          
        } catch (err) {
          setError(err.response?.data?.message || 'Erreur lors de la suppression de l\'avatar');
        }
      }
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      // Mettre à jour le profil
      const updateData = {
        name: formData.name,
        bio: formData.bio,
        phone: formData.phone,
        dateOfBirth: formData.dateOfBirth,
      };

      const response = await userAPI.updateProfile(updateData);
      
      // Mettre à jour l'avatar si un nouveau fichier a été sélectionné
      if (avatarFile) {
        const formDataAvatar = new FormData();
        formDataAvatar.append('avatar', avatarFile);
        
        await userAPI.updateAvatar(formDataAvatar);
      }

      // Mettre à jour le contexte utilisateur
      login(response.data.user, localStorage.getItem('token'));
      
      setSuccess('Profil mis à jour avec succès !');
      setAvatarFile(null);
      
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de la mise à jour du profil');
    } finally {
      setLoading(false);
    }
  };

  const showConfirmation = (message, action) => {
    setConfirmMessage(message);
    setConfirmAction(() => action);
    setShowConfirmModal(true);
  };

  const handleConfirmAction = async () => {
    if (confirmAction) {
      await confirmAction();
    }
    setShowConfirmModal(false);
    setConfirmAction(null);
    setConfirmMessage('');
  };

  const handleBecomeTutor = async () => {
    showConfirmation(
      'Êtes-vous sûr de vouloir devenir tuteur ? Cette action vous donnera accès à des fonctionnalités supplémentaires.',
      async () => {
        setLoading(true);
        setError('');
        
        try {
          const response = await userAPI.becomeTutor();
          
          // Mettre à jour le contexte utilisateur avec le nouveau rôle
          login(response.data.user, localStorage.getItem('token'));
          
          setSuccess('Félicitations ! Vous êtes maintenant tuteur. Vous avez accès à de nouvelles fonctionnalités.');
          
        } catch (err) {
          setError(err.response?.data?.message || 'Erreur lors de la demande pour devenir tuteur');
        } finally {
          setLoading(false);
        }
      }
    );
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'SUPPRIMER MON COMPTE') {
      setError('Veuillez taper exactement "SUPPRIMER MON COMPTE" pour confirmer');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      const response = await authAPI.deleteAccount();
      
      if (response.data.success) {
        // Nettoyer le localStorage
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        
        // Déconnexion après suppression
        logout();
        
        // Afficher un message de succès et rediriger
        setSuccess('Votre compte a été supprimé définitivement. Redirection en cours...');
        
        // Redirection vers la page d'accueil après 2 secondes
        setTimeout(() => {
          window.location.href = '/';
        }, 2000);
      } else {
        setError('Erreur lors de la suppression du compte');
        setLoading(false);
      }
      
    } catch (err) {
      console.error('Erreur suppression compte:', err);
      setError(err.response?.data?.message || 'Erreur lors de la suppression du compte');
      setLoading(false);
    }
  };

  return (
    <div className="main-content">
      <div style={{ maxWidth: '800px', margin: '0 auto', paddingTop: '2rem' }}>
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Mon Profil</h2>
            <p style={{ color: '#6c757d', margin: 0 }}>
              Gérez vos informations personnelles et votre avatar
            </p>
          </div>
          
          <form onSubmit={handleSubmit}>
            {error && (
              <div style={{ 
                backgroundColor: '#f8d7da', 
                color: '#721c24', 
                padding: '0.75rem', 
                borderRadius: '4px', 
                marginBottom: '1rem',
                border: '1px solid #f5c6cb'
              }}>
                {error}
              </div>
            )}
            
            {success && (
              <div style={{ 
                backgroundColor: '#d4edda', 
                color: '#155724', 
                padding: '0.75rem', 
                borderRadius: '4px', 
                marginBottom: '1rem',
                border: '1px solid #c3e6cb'
              }}>
                {success}
              </div>
            )}

            {/* Section Avatar */}
            <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
              <h3 style={{ marginBottom: '1.5rem', color: '#495057' }}>Photo de profil</h3>
              
              {/* Zone d'affichage et de téléchargement de l'avatar */}
              <div style={{ 
                position: 'relative', 
                display: 'inline-block', 
                marginBottom: '1rem' 
              }}>
                <div 
                  onClick={triggerFileInput}
                  style={{ 
                    width: '150px', 
                    height: '150px', 
                    borderRadius: '50%', 
                    border: '3px dashed #dee2e6',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    position: 'relative',
                    overflow: 'hidden',
                    backgroundColor: '#f8f9fa',
                    transition: 'all 0.3s ease',
                    backgroundImage: avatarPreview ? `url(${avatarPreview})` : 'none',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    border: avatarPreview ? '3px solid #007bff' : '3px dashed #dee2e6',
                  }}
                  onMouseEnter={(e) => {
                    if (!avatarPreview) {
                      e.target.style.borderColor = '#007bff';
                      e.target.style.backgroundColor = '#e3f2fd';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!avatarPreview) {
                      e.target.style.borderColor = '#dee2e6';
                      e.target.style.backgroundColor = '#f8f9fa';
                    }
                  }}
                >
                  {!avatarPreview && (
                    <div style={{ textAlign: 'center', color: '#6c757d' }}>
                      <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📷</div>
                      <div style={{ fontSize: '0.9rem', fontWeight: '500' }}>
                        Cliquez pour choisir une photo
                      </div>
                    </div>
                  )}
                  
                  {/* Image existante */}
                  {avatarPreview && (
                    <img 
                      src={avatarPreview} 
                      alt="Avatar" 
                      style={{ 
                        width: '100%', 
                        height: '100%', 
                        borderRadius: '50%', 
                        objectFit: 'cover',
                        position: 'absolute',
                        top: 0,
                        left: 0
                      }} 
                    />
                  )}
                  
                  {/* Overlay pour l'image existante */}
                  {avatarPreview && (
                    <div style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      backgroundColor: 'rgba(0, 0, 0, 0.5)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      opacity: 0,
                      transition: 'opacity 0.3s ease',
                      borderRadius: '50%',
                      color: 'white',
                      fontSize: '0.9rem',
                      fontWeight: '500'
                    }}
                    onMouseEnter={(e) => e.target.style.opacity = 1}
                    onMouseLeave={(e) => e.target.style.opacity = 0}
                    >
                      Changer la photo
                    </div>
                  )}
                </div>

                {/* Bouton de suppression */}
                {avatarPreview && (
                  <button 
                    type="button" 
                    onClick={(e) => {
                      e.stopPropagation();
                      removeAvatar();
                    }}
                    style={{
                      position: 'absolute',
                      top: '10px',
                      right: '10px',
                      background: '#dc3545',
                      color: 'white',
                      border: 'none',
                      borderRadius: '50%',
                      width: '30px',
                      height: '30px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.2rem',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                    }}
                    title="Supprimer la photo"
                  >
                    ×
                  </button>
                )}
              </div>

              {/* Input file caché */}
              <input
                type="file"
                id="avatar"
                name="avatar"
                accept="image/*"
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />
              
                             <div style={{ marginBottom: '1rem' }}>
                 <small style={{ color: '#6c757d', fontSize: '0.85rem' }}>
                   Formats acceptés : JPG, PNG, GIF, WebP (max 5MB)
                 </small>
               </div>

               {/* Bouton Historique des avatars */}
               <button
                 type="button"
                 onClick={() => {
                   setShowAvatarHistory(true);
                   loadAvatarHistory();
                 }}
                 style={{
                   background: 'linear-gradient(135deg, var(--primary-blue), var(--primary-blue-dark))',
                   color: 'white',
                   border: 'none',
                   borderRadius: '6px',
                   padding: '8px 16px',
                   fontSize: '0.85rem',
                   fontWeight: '500',
                   cursor: 'pointer',
                   transition: 'all 0.3s ease',
                   display: 'flex',
                   alignItems: 'center',
                   gap: '6px',
                   margin: '0 auto'
                 }}
                 onMouseEnter={(e) => {
                   e.target.style.transform = 'translateY(-1px)';
                   e.target.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';
                 }}
                 onMouseLeave={(e) => {
                   e.target.style.transform = 'translateY(0)';
                   e.target.style.boxShadow = 'none';
                 }}
               >
                 Voir l'historique des avatars
               </button>

              {/* Informations sur le fichier sélectionné */}
              {avatarFile && (
                <div style={{ 
                  backgroundColor: '#e9ecef', 
                  padding: '0.5rem', 
                  borderRadius: '4px', 
                  marginBottom: '1rem',
                  fontSize: '0.85rem',
                  color: '#495057'
                }}>
                  <strong>Fichier sélectionné :</strong> {avatarFile.name} 
                  ({(avatarFile.size / 1024 / 1024).toFixed(2)} MB)
                </div>
              )}
            </div>

            {/* Informations personnelles */}
            <div style={{ marginBottom: '2rem' }}>
              <h3 style={{ marginBottom: '1.5rem', color: '#495057' }}>Informations personnelles</h3>
              
              <div className="form-group">
                <label htmlFor="name" className="form-label">Nom complet</label>
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
                  rows="3"
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
              style={{ 
                width: '100%',
                padding: '12px',
                fontSize: '1rem',
                fontWeight: '500'
              }}
              disabled={loading}
            >
              {loading ? (
                <span>
                  Mise à jour en cours...
                </span>
              ) : (
                'Mettre à jour le profil'
              )}
            </button>
          </form>

          {/* Section Actions importantes */}
          <div style={{ 
            marginTop: '2rem', 
            paddingTop: '2rem', 
            borderTop: '1px solid #dee2e6' 
          }}>
            <h3 style={{ marginBottom: '1.5rem', color: '#495057' }}>Actions importantes</h3>
            
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              {/* Bouton Devenir tuteur */}
              {user?.role === 'apprenti' && (
                <button
                  type="button"
                  onClick={handleBecomeTutor}
                  disabled={loading}
                  style={{
                    background: 'linear-gradient(135deg, var(--success), var(--secondary-emerald-dark))',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '12px 24px',
                    fontSize: '0.9rem',
                    fontWeight: '500',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    boxShadow: '0 2px 4px rgba(76,175,80,0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.transform = 'translateY(-2px)';
                    e.target.style.boxShadow = '0 4px 8px rgba(76,175,80,0.4)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = '0 2px 4px rgba(76,175,80,0.3)';
                  }}
                >
                  Devenir tuteur
                </button>
              )}

              {/* Bouton Supprimer le compte */}
              <button
                type="button"
                onClick={() => setShowDeleteModal(true)}
                style={{
                  background: 'linear-gradient(135deg, var(--danger), #C10510)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '12px 24px',
                  fontSize: '0.9rem',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 2px 4px rgba(227,6,19,0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
                onMouseEnter={(e) => {
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = '0 4px 8px rgba(227,6,19,0.4)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = '0 2px 4px rgba(227,6,19,0.3)';
                }}
              >
                Supprimer mon compte
              </button>
            </div>

            {/* Message d'information */}
            <div style={{ 
              marginTop: '1rem',
              padding: '1rem',
              backgroundColor: '#f8f9fa',
              borderRadius: '8px',
              border: '1px solid #dee2e6'
            }}>
              <p style={{ 
                margin: 0, 
                fontSize: '0.9rem', 
                color: '#6c757d',
                lineHeight: '1.5'
              }}>
                <strong>Note :</strong> Ces actions sont importantes et peuvent avoir des conséquences permanentes. 
                Prenez le temps de bien réfléchir avant de les effectuer.
              </p>
            </div>
                     </div>

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
                 borderRadius: '12px',
                 padding: '2rem',
                 maxWidth: '600px',
                 width: '90%',
                 maxHeight: '80vh',
                 overflow: 'auto',
                 boxShadow: '0 10px 25px rgba(0, 0, 0, 0.3)',
                 position: 'relative'
               }}>
                 {/* En-tête du modal */}
                 <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                   <div style={{ 
                     fontSize: '2.5rem', 
                     marginBottom: '0.5rem',
                     color: 'var(--primary-blue)'
                   }}>
                     📚
                   </div>
                   <h3 style={{ 
                     color: '#495057', 
                     marginBottom: '0.5rem',
                     fontSize: '1.5rem',
                     fontWeight: '700'
                   }}>
                     Historique des avatars
                   </h3>
                   <p style={{ color: '#6c757d', fontSize: '0.9rem' }}>
                     Sélectionnez un avatar précédent pour le restaurer
                   </p>
                 </div>

                 {/* Contenu de l'historique */}
                 {loadingHistory ? (
                   <div style={{ textAlign: 'center', padding: '2rem' }}>
                     <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⏳</div>
                     <p>Chargement de l'historique...</p>
                   </div>
                 ) : avatarHistory.length === 0 ? (
                   <div style={{ textAlign: 'center', padding: '2rem' }}>
                     <div style={{ fontSize: '3rem', marginBottom: '1rem', color: '#6c757d' }}>📷</div>
                     <p style={{ color: '#6c757d' }}>Aucun avatar dans l'historique</p>
                     <small style={{ color: '#adb5bd' }}>
                       Les avatars précédents apparaîtront ici après les avoir changés
                     </small>
                   </div>
                 ) : (
                   <div style={{ 
                     display: 'grid', 
                     gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
                     gap: '1rem',
                     marginBottom: '1.5rem'
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
                             borderRadius: '8px',
                             overflow: 'hidden',
                             border: '2px solid #dee2e6',
                             transition: 'all 0.3s ease'
                           }}
                           onMouseEnter={(e) => {
                             e.target.style.borderColor = '#007bff';
                             e.target.style.transform = 'scale(1.05)';
                           }}
                           onMouseLeave={(e) => {
                             e.target.style.borderColor = '#dee2e6';
                             e.target.style.transform = 'scale(1)';
                           }}
                           onClick={() => restoreAvatar(avatarPath)}
                         >
                           <img 
                             src={avatarUrl} 
                             alt={`Avatar ${index + 1}`}
                             style={{ 
                               width: '100%', 
                               height: '120px', 
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
                              background: 'linear-gradient(transparent, rgba(0,0,0,0.7))',
                              color: 'white',
                              padding: '0.5rem',
                              fontSize: '0.8rem',
                              textAlign: 'center'
                            }}>
                              Restaurer
                            </div>
                            
                            {/* Bouton Supprimer */}
                            <button
                              onClick={(e) => deleteAvatarFromHistory(avatarPath, e)}
                              style={{
                                position: 'absolute',
                                top: '5px',
                                right: '5px',
                                background: 'rgba(227, 6, 19, 0.9)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '50%',
                                width: '25px',
                                height: '25px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '0.8rem',
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
                   gap: '12px',
                   justifyContent: 'center'
                 }}>
                   <button
                     type="button"
                     onClick={() => setShowAvatarHistory(false)}
                     style={{
                       background: '#6c757d',
                       color: 'white',
                       border: 'none',
                       borderRadius: '6px',
                       padding: '10px 20px',
                       fontSize: '0.9rem',
                       fontWeight: '500',
                       cursor: 'pointer',
                       transition: 'all 0.3s ease'
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
                     top: '10px',
                     right: '10px',
                     background: 'transparent',
                     border: 'none',
                     fontSize: '1.5rem',
                     cursor: 'pointer',
                     color: '#6c757d',
                     padding: '5px',
                     borderRadius: '50%',
                     width: '35px',
                     height: '35px',
                     display: 'flex',
                     alignItems: 'center',
                     justifyContent: 'center'
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

                       {/* Modal de confirmation générale */}
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
                  backgroundColor: 'white',
                  borderRadius: '12px',
                  padding: '2rem',
                  maxWidth: '500px',
                  width: '90%',
                  boxShadow: '0 10px 25px rgba(0, 0, 0, 0.3)',
                  position: 'relative'
                }}>
                  {/* En-tête du modal */}
                  <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                    <div style={{ 
                      fontSize: '2.5rem', 
                      marginBottom: '1rem',
                      color: 'var(--warning)'
                    }}>
                      ⚠️
                    </div>
                    <h3 style={{ 
                      color: '#495057', 
                      marginBottom: '0.5rem',
                      fontSize: '1.3rem',
                      fontWeight: '600'
                    }}>
                      Confirmation requise
                    </h3>
                    <p style={{ color: '#6c757d', fontSize: '1rem', lineHeight: '1.5' }}>
                      {confirmMessage}
                    </p>
                  </div>

                  {/* Boutons d'action */}
                  <div style={{ 
                    display: 'flex', 
                    gap: '12px',
                    justifyContent: 'center'
                  }}>
                    <button
                      type="button"
                      onClick={() => {
                        setShowConfirmModal(false);
                        setConfirmAction(null);
                        setConfirmMessage('');
                      }}
                      style={{
                        background: '#6c757d',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        padding: '10px 20px',
                        fontSize: '0.9rem',
                        fontWeight: '500',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease'
                      }}
                    >
                      Annuler
                    </button>
                    
                    <button
                      type="button"
                      onClick={handleConfirmAction}
                      style={{
                        background: 'linear-gradient(135deg, var(--primary-blue), var(--primary-blue-dark))',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        padding: '10px 20px',
                        fontSize: '0.9rem',
                        fontWeight: '500',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        boxShadow: '0 2px 4px rgba(0,46,93,0.3)'
                      }}
                    >
                      Confirmer
                    </button>
                  </div>

                  {/* Bouton de fermeture */}
                  <button
                    onClick={() => {
                      setShowConfirmModal(false);
                      setConfirmAction(null);
                      setConfirmMessage('');
                    }}
                    style={{
                      position: 'absolute',
                      top: '10px',
                      right: '10px',
                      background: 'transparent',
                      border: 'none',
                      fontSize: '1.5rem',
                      cursor: 'pointer',
                      color: '#6c757d',
                      padding: '5px',
                      borderRadius: '50%',
                      width: '35px',
                      height: '35px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
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
                backgroundColor: 'white',
                borderRadius: '12px',
                padding: '2rem',
                maxWidth: '500px',
                width: '90%',
                boxShadow: '0 10px 25px rgba(0, 0, 0, 0.3)',
                position: 'relative'
              }}>
                {/* En-tête du modal */}
                <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                  <div style={{ 
                    fontSize: '3rem', 
                    marginBottom: '1rem',
                    color: 'var(--danger)'
                  }}>
                    ⚠️
                  </div>
                  <h3 style={{ 
                    color: 'var(--danger)', 
                    marginBottom: '0.5rem',
                    fontSize: '1.5rem',
                    fontWeight: '700'
                  }}>
                    Supprimer définitivement votre compte
                  </h3>
                  <p style={{ color: '#6c757d', fontSize: '1rem' }}>
                    Cette action est <strong>irréversible</strong>
                  </p>
                </div>

                {/* Liste des conséquences */}
                <div style={{ 
                  backgroundColor: '#fff5f5', 
                  border: '1px solid #fed7d7',
                  borderRadius: '8px', 
                  padding: '1rem', 
                  marginBottom: '1.5rem'
                }}>
                  <h4 style={{ 
                    color: 'var(--danger)', 
                    marginBottom: '0.75rem',
                    fontSize: '1rem',
                    fontWeight: '600'
                  }}>
                    Conséquences de la suppression :
                  </h4>
                  <ul style={{ 
                    margin: 0, 
                    paddingLeft: '1.5rem',
                    color: '#721c24',
                    lineHeight: '1.6'
                  }}>
                    <li>Toutes vos données personnelles seront supprimées</li>
                    <li>Votre historique d'apprentissage sera perdu</li>
                    <li>Vous ne pourrez plus accéder à vos cours</li>
                    <li>Cette action ne peut pas être annulée</li>
                  </ul>
                </div>

                {/* Confirmation par saisie */}
                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '0.5rem',
                    fontWeight: '600',
                    color: '#495057'
                  }}>
                    Pour confirmer, tapez exactement : <code style={{
                      backgroundColor: '#e9ecef',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      color: 'var(--danger)',
                      fontWeight: 'bold'
                    }}>SUPPRIMER MON COMPTE</code>
                  </label>
                  <input
                    type="text"
                    value={deleteConfirmText}
                    onChange={(e) => setDeleteConfirmText(e.target.value)}
                    placeholder="Tapez la confirmation ici..."
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: `2px solid ${deleteConfirmText === 'SUPPRIMER MON COMPTE' ? '#28a745' : '#dc3545'}`,
                      borderRadius: '6px',
                      fontSize: '1rem',
                      fontFamily: 'monospace',
                      backgroundColor: deleteConfirmText === 'SUPPRIMER MON COMPTE' ? '#f8fff9' : '#fff5f5'
                    }}
                    autoFocus
                  />
                  {deleteConfirmText && deleteConfirmText !== 'SUPPRIMER MON COMPTE' && (
                    <small style={{ color: 'var(--danger)', fontSize: '0.85rem', marginTop: '0.25rem', display: 'block' }}>
                      Le texte ne correspond pas exactement
                    </small>
                  )}
                  {deleteConfirmText === 'SUPPRIMER MON COMPTE' && (
                    <small style={{ color: 'var(--success)', fontSize: '0.85rem', marginTop: '0.25rem', display: 'block' }}>
                      Confirmation correcte
                    </small>
                  )}
                </div>

                {/* Boutons d'action */}
                <div style={{ 
                  display: 'flex', 
                  gap: '12px',
                  justifyContent: 'flex-end'
                }}>
                  <button
                    type="button"
                    onClick={() => {
                      setShowDeleteModal(false);
                      setDeleteConfirmText('');
                      setError('');
                    }}
                    disabled={loading}
                    style={{
                      background: '#6c757d',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      padding: '10px 20px',
                      fontSize: '0.9rem',
                      fontWeight: '500',
                      cursor: loading ? 'not-allowed' : 'pointer',
                      transition: 'all 0.3s ease',
                      opacity: loading ? 0.6 : 1
                    }}
                  >
                    🔙 Annuler
                  </button>
                  
                  <button
                    type="button"
                    onClick={handleDeleteAccount}
                    disabled={loading || deleteConfirmText !== 'SUPPRIMER MON COMPTE'}
                    style={{
                      background: deleteConfirmText === 'SUPPRIMER MON COMPTE' 
                        ? 'linear-gradient(135deg, var(--danger), #C10510)'
                        : '#6c757d',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      padding: '10px 20px',
                      fontSize: '0.9rem',
                      fontWeight: '500',
                      cursor: (loading || deleteConfirmText !== 'SUPPRIMER MON COMPTE') ? 'not-allowed' : 'pointer',
                      transition: 'all 0.3s ease',
                      opacity: (loading || deleteConfirmText !== 'SUPPRIMER MON COMPTE') ? 0.6 : 1,
                      boxShadow: deleteConfirmText === 'SUPPRIMER MON COMPTE' 
                        ? '0 2px 4px rgba(227,6,19,0.4)' 
                        : 'none'
                    }}
                  >
                    {loading ? (
                      <span>⏳ Suppression...</span>
                    ) : (
                      <span>🗑️ Supprimer définitivement</span>
                    )}
                  </button>
                </div>

                {/* Bouton de fermeture */}
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setDeleteConfirmText('');
                    setError('');
                  }}
                  style={{
                    position: 'absolute',
                    top: '10px',
                    right: '10px',
                    background: 'transparent',
                    border: 'none',
                    fontSize: '1.5rem',
                    cursor: 'pointer',
                    color: '#6c757d',
                    padding: '5px',
                    borderRadius: '50%',
                    width: '35px',
                    height: '35px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
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
      </div>
    </div>
  );
};

export default Profile;