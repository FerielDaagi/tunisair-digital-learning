import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { userAPI } from '../../services/api';

const Profile = () => {
  const { user, login } = useAuth();
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
  const [avatarHistory, setAvatarHistory] = useState([]);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        bio: user.profile?.bio || '',
        phone: user.profile?.phone || '',
        dateOfBirth: user.profile?.dateOfBirth ? user.profile.dateOfBirth.split('T')[0] : '',
      });
      if (user.profile?.avatar) {
        const url = `http://localhost:5000${user.profile.avatar}`;
        // Bust cache by appending timestamp
        setAvatarPreview(`${url}?t=${Date.now()}`);
      }
      // Charger l'historique des avatars
      userAPI.getAvatarHistory()
        .then(res => setAvatarHistory(res.data.previousAvatars || []))
        .catch(() => {});
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

      // Recharger le profil à jour (inclut le nouvel avatar)
      const refreshed = await userAPI.getProfile();
      const updatedUser = refreshed.data.user;
      login(updatedUser, localStorage.getItem('token'));

      // Mettre à jour l'aperçu avec l'avatar courant (serveur)
      if (updatedUser?.profile?.avatar) {
        const url = `http://localhost:5000${updatedUser.profile.avatar}`;
        setAvatarPreview(`${url}?t=${Date.now()}`);
      }

      // Rafraîchir l'historique des avatars
      try {
        const hist = await userAPI.getAvatarHistory();
        setAvatarHistory(hist.data.previousAvatars || []);
      } catch {}
      
      setSuccess('Profil mis à jour avec succès !');
      setAvatarFile(null);
      
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de la mise à jour du profil');
    } finally {
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
                      <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📸</div>
                      <div style={{ fontSize: '0.9rem', fontWeight: '500' }}>
                        Cliquez pour choisir une photo
                      </div>
                    </div>
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

            {/* Historique des avatars */}
            {avatarHistory.length > 0 && (
              <div style={{ marginBottom: '2rem' }}>
                <h3 style={{ 
                  marginBottom: '1.5rem', 
                  color: '#495057',
                  fontSize: '1.25rem',
                  fontWeight: '600',
                  borderBottom: '2px solid #e9ecef',
                  paddingBottom: '0.5rem'
                }}>
                  📸 Anciennes photos
                </h3>
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
                  gap: '16px',
                  padding: '1rem',
                  backgroundColor: '#f8f9fa',
                  borderRadius: '8px',
                  border: '1px solid #e9ecef'
                }}>
                  {avatarHistory.map((p, idx) => (
                    <div key={idx} style={{ 
                      textAlign: 'center',
                      padding: '8px',
                      backgroundColor: 'white',
                      borderRadius: '8px',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                      transition: 'all 0.3s ease',
                      border: '1px solid #dee2e6'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.15)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
                    }}
                    >
                      <div style={{ position: 'relative', marginBottom: '8px' }}>
                        <img
                          src={`http://localhost:5000${p}?t=${Date.now()}`}
                          alt={`Ancien avatar ${idx+1}`}
                          style={{
                            width: '80px',
                            height: '80px',
                            borderRadius: '50%',
                            objectFit: 'cover',
                            border: '3px solid #fff',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                            display: 'block',
                            margin: '0 auto'
                          }}
                        />
                        <div style={{
                          position: 'absolute',
                          top: '-4px',
                          right: '-4px',
                          background: '#6c757d',
                          color: 'white',
                          borderRadius: '50%',
                          width: '24px',
                          height: '24px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.7rem',
                          fontWeight: 'bold'
                        }}>
                          {idx + 1}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            setLoading(true);
                            setError('');
                            await userAPI.restoreAvatar(p);
                            // Mettre à jour l'aperçu courant
                            setAvatarPreview(`http://localhost:5000${p}?t=${Date.now()}`);
                            // Recharger le profil
                            const refreshed = await userAPI.getProfile();
                            login(refreshed.data.user, localStorage.getItem('token'));
                            // Rafraîchir l'historique
                            const hist = await userAPI.getAvatarHistory();
                            setAvatarHistory(hist.data.previousAvatars || []);
                            setSuccess('Avatar restauré avec succès !');
                          } catch (e) {
                            setError('Impossible de restaurer cet avatar');
                          } finally {
                            setLoading(false);
                          }
                        }}
                        style={{
                          background: 'linear-gradient(135deg, #007bff, #0056b3)',
                          color: 'white',
                          border: 'none',
                          borderRadius: '20px',
                          padding: '6px 12px',
                          fontSize: '0.75rem',
                          fontWeight: '500',
                          cursor: 'pointer',
                          transition: 'all 0.3s ease',
                          boxShadow: '0 2px 4px rgba(0,123,255,0.3)',
                          width: '100%'
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.background = 'linear-gradient(135deg, #0056b3, #004085)';
                          e.target.style.transform = 'scale(1.05)';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.background = 'linear-gradient(135deg, #007bff, #0056b3)';
                          e.target.style.transform = 'scale(1)';
                        }}
                      >
                        🔄 Restaurer
                      </button>
                    </div>
                  ))}
                </div>
                <div style={{ 
                  marginTop: '0.5rem',
                  textAlign: 'center',
                  fontSize: '0.85rem',
                  color: '#6c757d',
                  fontStyle: 'italic'
                }}>
                  Cliquez sur "Restaurer" pour remettre une ancienne photo comme photo de profil actuelle
                </div>
              </div>
            )}

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
                  <span style={{ marginRight: '8px' }}>⏳</span>
                  Mise à jour en cours...
                </span>
              ) : (
                'Mettre à jour le profil'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Profile;