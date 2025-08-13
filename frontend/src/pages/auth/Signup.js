import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authAPI } from '../../services/api';

const Signup = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'apprenti',
    avatar: null,
    bio: '',
    phone: '',
    dateOfBirth: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [avatarPreview, setAvatarPreview] = useState(null);
  
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        setError('Veuillez sélectionner une image valide (JPG, PNG, GIF, WebP)');
        return;
      }

      const maxSize = 5 * 1024 * 1024;
      if (file.size > maxSize) {
        setError('La taille de l\'image ne doit pas dépasser 5MB');
        return;
      }

      setFormData({
        ...formData,
        avatar: file
      });

      const reader = new FileReader();
      reader.onload = (e) => {
        setAvatarPreview(e.target.result);
      };
      reader.readAsDataURL(file);
      
      setError('');
    }
  };

  const removeAvatar = () => {
    setFormData({
      ...formData,
      avatar: null
    });
    setAvatarPreview(null);
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
      const formDataToSend = new FormData();
      
      const userPayload = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: formData.role,
        profile: {
          bio: formData.bio,
          phone: formData.phone,
          dateOfBirth: formData.dateOfBirth,
        }
      };

      formDataToSend.append('userData', JSON.stringify(userPayload));
      
      if (formData.avatar) {
        formDataToSend.append('avatar', formData.avatar);
      }

      console.log('Envoi des données:', { userPayload, hasAvatar: !!formData.avatar });
      const response = await authAPI.signup(formDataToSend);
      console.log('Réponse signup:', response);
      
      if (response.data.success) {
        setSuccess('Compte créé avec succès ! Redirection en cours...');
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      }
    } catch (err) {
      console.error('Erreur signup:', err);
      console.error('Détails de l\'erreur:', {
        message: err.message,
        response: err.response,
        status: err.response?.status,
        data: err.response?.data
      });
      
      let errorMessage = 'Erreur lors de la création du compte. Veuillez réessayer.';
      
      if (err.response?.status === 400) {
        errorMessage = err.response.data.message || 'Données invalides.';
      } else if (err.response?.status === 409) {
        errorMessage = 'Un utilisateur avec cet email existe déjà.';
      } else if (err.response?.status === 500) {
        errorMessage = 'Erreur serveur. Veuillez réessayer plus tard.';
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="card-header">
          <h2 className="card-title">Créer un compte</h2>
          <p style={{ color: '#6c757d', margin: 0, fontSize: '1.1rem' }}>
            Inscrivez-vous pour accéder à Tunisair Academy
          </p>
        </div>
        
        <form onSubmit={handleSubmit}>
          {error && (
            <div style={{ 
              backgroundColor: '#f8d7da', 
              color: '#721c24', 
              padding: '0.75rem', 
              borderRadius: '8px', 
              marginBottom: '1.5rem',
              border: '1px solid #f5c6cb',
              fontSize: '0.9rem'
            }}>
              {error}
            </div>
          )}
          
          {success && (
            <div style={{ 
              backgroundColor: '#d4edda', 
              color: '#155724', 
              padding: '0.75rem', 
              borderRadius: '8px', 
              marginBottom: '1.5rem',
              border: '1px solid #c3e6cb',
              fontSize: '0.9rem'
            }}>
              {success}
            </div>
          )}

          {/* Informations de base */}
          <div style={{ marginBottom: '2rem' }}>
            <h4 style={{ 
              marginBottom: '1rem', 
              color: '#495057', 
              fontSize: '1rem',
              borderBottom: '1px solid #dee2e6',
              paddingBottom: '0.5rem'
            }}>
              Informations de base
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
              <label htmlFor="email" className="form-label">Email *</label>
              <input
                type="email"
                id="email"
                name="email"
                className="form-control"
                value={formData.email}
                onChange={handleChange}
                required
                placeholder="votre.email@exemple.com"
              />
            </div>

            <div className="form-group">
              <label htmlFor="password" className="form-label">Mot de passe *</label>
              <input
                type="password"
                id="password"
                name="password"
                className="form-control"
                value={formData.password}
                onChange={handleChange}
                required
                placeholder="Minimum 6 caractères"
                minLength="6"
              />
            </div>

            <div className="form-group">
              <label htmlFor="role" className="form-label">Rôle *</label>
              <select
                id="role"
                name="role"
                className="form-control"
                value={formData.role}
                onChange={handleChange}
                required
              >
                <option value="apprenti">Apprenti</option>
                <option value="tuteur">Tuteur</option>
              </select>
            </div>
          </div>

          {/* Avatar */}
          <div style={{ marginBottom: '2rem' }}>
            <h4 style={{ 
              marginBottom: '1rem', 
              color: '#495057', 
              fontSize: '1rem',
              borderBottom: '1px solid #dee2e6',
              paddingBottom: '0.5rem'
            }}>
              Photo de profil (optionnel)
            </h4>
            
            <div style={{ textAlign: 'center' }}>
              <div style={{ 
                position: 'relative', 
                display: 'inline-block', 
                marginBottom: '1rem' 
              }}>
                <div 
                  onClick={triggerFileInput}
                  style={{ 
                    width: '120px', 
                    height: '120px', 
                    borderRadius: '50%', 
                    border: avatarPreview ? '3px solid var(--primary-blue)' : '3px dashed #dee2e6',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    position: 'relative',
                    overflow: 'hidden',
                    backgroundColor: '#f8f9fa',
                    transition: 'all 0.3s ease',
                    margin: '0 auto'
                  }}
                  onMouseEnter={(e) => {
                    if (!avatarPreview) {
                      e.target.style.borderColor = 'var(--primary-blue)';
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
                      <div style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>📷</div>
                      <div style={{ fontSize: '0.75rem', fontWeight: '500', lineHeight: '1.2' }}>
                        Ajouter une photo
                      </div>
                    </div>
                  )}
                  
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
                      fontSize: '0.75rem',
                      fontWeight: '500',
                      textAlign: 'center'
                    }}
                    onMouseEnter={(e) => e.target.style.opacity = 1}
                    onMouseLeave={(e) => e.target.style.opacity = 0}
                    >
                      Changer
                    </div>
                  )}
                </div>

                {avatarPreview && (
                  <button 
                    type="button" 
                    onClick={(e) => {
                      e.stopPropagation();
                      removeAvatar();
                    }}
                    style={{
                      position: 'absolute',
                      top: '5px',
                      right: '5px',
                      background: 'var(--danger)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '50%',
                      width: '24px',
                      height: '24px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '14px',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                    }}
                    title="Supprimer la photo"
                  >
                    ×
                  </button>
                )}
              </div>

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

              {avatarPreview && (
                <div style={{ 
                  backgroundColor: '#e9ecef', 
                  padding: '0.5rem', 
                  borderRadius: '8px', 
                  marginBottom: '1rem',
                  fontSize: '0.85rem',
                  color: '#495057'
                }}>
                  <strong>Fichier sélectionné :</strong> {formData.avatar.name} 
                  ({(formData.avatar.size / 1024 / 1024).toFixed(2)} MB)
                </div>
              )}
            </div>
          </div>

          {/* Informations personnelles */}
          <div style={{ marginBottom: '1.5rem' }}>
            <h4 style={{ 
              marginBottom: '1rem', 
              color: '#495057', 
              fontSize: '1rem',
              borderBottom: '1px solid #dee2e6',
              paddingBottom: '0.5rem'
            }}>
              Informations personnelles (optionnel)
            </h4>

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
            disabled={loading}
          >
            {loading ? 'Création du compte...' : 'Créer mon compte'}
          </button>
        </form>
        
        <div className="text-center" style={{ paddingTop: '1rem', borderTop: '1px solid #dee2e6' }}>
          <p style={{ color: '#6c757d', fontSize: '0.9rem', margin: 0 }}>
            Déjà un compte ?{' '}
            <Link 
              to="/login" 
              style={{ 
                color: 'var(--primary-blue)', 
                textDecoration: 'none',
                fontWeight: '500'
              }}
            >
              Connectez-vous ici
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Signup;