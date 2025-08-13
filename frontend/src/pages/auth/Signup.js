import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../../services/api';

const Signup = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'apprenti', // Rôle par défaut
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

      setFormData({
        ...formData,
        avatar: file
      });

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
    setFormData({
      ...formData,
      avatar: null
    });
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
      // Créer un FormData pour envoyer le fichier
      const formDataToSend = new FormData();
      
      // Ajouter les données utilisateur
      const userPayload = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: formData.role, // Rôle sélectionné par l'utilisateur
        profile: {
          bio: formData.bio,
          phone: formData.phone,
          dateOfBirth: formData.dateOfBirth,
        },
      };

      // Ajouter les données JSON
      formDataToSend.append('userData', JSON.stringify(userPayload));
      
      // Ajouter le fichier avatar s'il existe
      if (formData.avatar) {
        formDataToSend.append('avatar', formData.avatar);
      }
      
      const response = await authAPI.register(formDataToSend);
      setSuccess('Compte créé avec succès ! Redirection vers la connexion...');
      
      // Rediriger après un délai pour montrer le message de succès
      setTimeout(() => {
        navigate('/login');
      }, 2000);
      
    } catch (err) {
      setError(err.response?.data?.message || 'Inscription échouée. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="main-content">
      <div style={{ maxWidth: '500px', margin: '0 auto', paddingTop: '2rem' }}>
        <div className="card">
          <div className="card-header">
            <h2 className="card-title text-center" style={{ color: '#495057', marginBottom: '0.5rem' }}>
              Créer un compte
            </h2>
            <p className="text-center" style={{ color: '#6c757d', margin: 0 }}>
              Inscrivez-vous pour accéder à la plateforme d'apprentissage
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
            <div style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
              <label className="form-label" style={{ 
                display: 'block', 
                marginBottom: '1rem',
                fontWeight: '500',
                color: '#495057'
              }}>
                Photo de profil (optionnel)
              </label>
              
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
                    border: avatarPreview ? '3px solid #007bff' : '3px dashed #dee2e6',
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
                      <div style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>📸</div>
                      <div style={{ fontSize: '0.75rem', fontWeight: '500', lineHeight: '1.2' }}>
                        Ajouter une photo
                      </div>
                    </div>
                  )}
                  
                  {/* Image */}
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
                      top: '5px',
                      right: '5px',
                      background: '#dc3545',
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
                <small style={{ color: '#6c757d', fontSize: '0.8rem' }}>
                  Formats acceptés : JPG, PNG, GIF, WebP (max 5MB)
                </small>
              </div>

              {/* Informations sur le fichier sélectionné */}
              {formData.avatar && (
                <div style={{ 
                  backgroundColor: '#e9ecef', 
                  padding: '0.5rem', 
                  borderRadius: '4px', 
                  marginBottom: '1rem',
                  fontSize: '0.8rem',
                  color: '#495057'
                }}>
                  <strong>Fichier :</strong> {formData.avatar.name} 
                  ({(formData.avatar.size / 1024 / 1024).toFixed(2)} MB)
                </div>
              )}
            </div>

            {/* Informations de base */}
            <div style={{ marginBottom: '1.5rem' }}>
              <h4 style={{ 
                marginBottom: '1rem', 
                color: '#495057', 
                fontSize: '1rem',
                borderBottom: '1px solid #dee2e6',
                paddingBottom: '0.5rem'
              }}>
                Informations de connexion
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
                  placeholder="Minimum 8 caractères"
                  minLength="8"
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
                  style={{
                    padding: '0.75rem',
                    border: '1px solid #ced4da',
                    borderRadius: '4px',
                    fontSize: '1rem',
                    backgroundColor: 'white'
                  }}
                >
                  <option value="apprenti">👨‍🎓 Apprenti</option>
                  <option value="tuteur">👨‍🏫 Tuteur</option>
                  <option value="admin">👑 Administrateur</option>
                </select>
                <small style={{ color: '#6c757d', fontSize: '0.8rem', marginTop: '0.25rem', display: 'block' }}>
                  💡 Pour les tests uniquement - choisissez le rôle souhaité
                </small>
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
              style={{ 
                width: '100%',
                padding: '12px',
                fontSize: '1rem',
                fontWeight: '500',
                marginBottom: '1rem'
              }}
              disabled={loading}
            >
              {loading ? (
                <span>
                  <span style={{ marginRight: '8px' }}>⏳</span>
                  Création du compte...
                </span>
              ) : (
                <span>
                  <span style={{ marginRight: '8px' }}>🚀</span>
                  Créer mon compte
                </span>
              )}
            </button>
          </form>
          
          <div className="text-center" style={{ paddingTop: '1rem', borderTop: '1px solid #dee2e6' }}>
            <p style={{ color: '#6c757d', fontSize: '0.9rem', margin: 0 }}>
              Déjà un compte ?{' '}
              <a 
                href="/login" 
                style={{ 
                  color: '#007bff', 
                  textDecoration: 'none',
                  fontWeight: '500'
                }}
                onMouseEnter={(e) => e.target.style.textDecoration = 'underline'}
                onMouseLeave={(e) => e.target.style.textDecoration = 'none'}
              >
                Connectez-vous ici
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;