import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authAPI } from '../../services/api';
import './Signup.css';

const Signup = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'apprenti',
    avatar: null,
    bio: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [emailExists, setEmailExists] = useState(false);
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
    setEmailExists(false);
    
    // Validation des mots de passe
    if (formData.password !== formData.confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      setLoading(false);
      return;
    }
    
    try {
      const formDataToSend = new FormData();
      
      const userPayload = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: formData.role,
        profile: {
          bio: formData.bio,
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
        if (response.data.requiresVerification) {
          // Rediriger vers la page de vérification email
          navigate('/verify-email', { 
            state: { email: formData.email } 
          });
        } else {
          setSuccess('Compte créé avec succès ! Redirection en cours...');
          setTimeout(() => {
            navigate('/login');
          }, 2000);
        }
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
      if (errorMessage.toLowerCase().includes('existe déjà')) {
        setEmailExists(true);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="signup-page">
      <div className="signup-container">
        {/* Section gauche - Hero minimaliste */}
        <div className="signup-info">
          <h1>Créez votre compte</h1>
          <p className="subtitle">
            Rejoignez notre communauté d'apprentissage et commencez votre parcours 
            vers l'excellence professionnelle.
          </p>
          
          <ul className="signup-features">
            <li>
              <div className="feature-icon">✨</div>
              <span>Apprentissage personnalisé</span>
            </li>
            <li>
              <div className="feature-icon">🏆</div>
              <span>Certifications reconnues</span>
            </li>
            <li>
              <div className="feature-icon">👨‍🏫</div>
              <span>Experts qualifiés</span>
            </li>
            <li>
              <div className="feature-icon">📈</div>
              <span>Progression suivie</span>
            </li>
          </ul>
        </div>

        {/* Section droite - Formulaire */}
        <div className="signup-form-section">
          <div className="form-header">
            <h2>Inscription</h2>
            <p>Remplissez le formulaire ci-dessous pour créer votre compte</p>
          </div>
          
          <form className="signup-form" onSubmit={handleSubmit}>
            {error && (
              <div className="alert alert-error">
                {error}
                {emailExists && (
                  <div style={{ marginTop: '8px' }}>
                    <Link to="/login" style={{ marginRight: 12 }}>Se connecter</Link>
                    <Link to={`/forgot-password`} state={{ email: formData.email }}>Réinitialiser le mot de passe</Link>
                  </div>
                )}
              </div>
            )}
            
            {success && (
              <div className="alert alert-success">
                {success}
              </div>
            )}

            {/* Informations de base */}
            <div className="form-section">
              <h3 className="form-section-title">Informations de base</h3>
              
              <div className="form-grid">
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
              </div>

              <div className="form-grid">
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
                  <label htmlFor="confirmPassword" className="form-label">Confirmer le mot de passe *</label>
                  <input
                    type="password"
                    id="confirmPassword"
                    name="confirmPassword"
                    className="form-control"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                    placeholder="Répétez votre mot de passe"
                    minLength="6"
                  />
                </div>
              </div>

              <div className="form-grid">
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
                    <option value="admin">Admin</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Avatar */}
            <div className="form-section">
              <h3 className="form-section-title">Photo de profil (optionnel)</h3>
              
              <div className="avatar-section">
                <div className="avatar-upload">
                  <div 
                    className={`avatar-preview ${avatarPreview ? 'has-image' : ''}`}
                    onClick={triggerFileInput}
                  >
                    {!avatarPreview ? (
                      <div className="avatar-placeholder">
                        <div className="icon">📷</div>
                        <div className="text">Ajouter une photo</div>
                      </div>
                    ) : (
                      <>
                        <img src={avatarPreview} alt="Avatar" />
                        <div className="avatar-overlay">Changer</div>
                      </>
                    )}
                  </div>
                  
                  {avatarPreview && (
                    <button 
                      type="button" 
                      className="avatar-remove"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeAvatar();
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
                
                <div className="avatar-info">
                  Formats acceptés : JPG, PNG, GIF, WebP (max 5MB)
                </div>

                {avatarPreview && (
                  <div className="avatar-file-info">
                    <strong>Fichier sélectionné :</strong> {formData.avatar.name} 
                    ({(formData.avatar.size / 1024 / 1024).toFixed(2)} MB)
                  </div>
                )}
              </div>
            </div>

            {/* Informations personnelles */}
            <div className="form-section">
              <h3 className="form-section-title">Informations personnelles (optionnel)</h3>

              <div className="form-group full-width">
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
            </div>
            
            <div className="submit-section">
              <button
                type="submit"
                className={`btn-submit ${loading ? 'loading' : ''}`}
                disabled={loading}
              >
                {loading ? 'Création du compte...' : 'Créer mon compte'}
              </button>
            </div>
          </form>
          
          <div className="login-link">
            <p>
              Déjà un compte ?{' '}
              <Link to="/login">
                Connectez-vous ici
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;