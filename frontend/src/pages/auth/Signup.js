import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
    street: '',
    city: '',
    country: '',
    zipCode: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
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
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
      if (!validTypes.includes(file.type)) {
        setError('Veuillez sélectionner une image valide (JPG, PNG, GIF)');
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      // Créer un FormData pour envoyer le fichier
      const formDataToSend = new FormData();
      
      // Ajouter les données utilisateur
      const userPayload = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: formData.role,
        profile: {
          bio: formData.bio,
          phone: formData.phone,
          dateOfBirth: formData.dateOfBirth,
          address: {
            street: formData.street,
            city: formData.city,
            country: formData.country,
            zipCode: formData.zipCode,
          },
        },
      };

      // Ajouter les données JSON
      formDataToSend.append('userData', JSON.stringify(userPayload));
      
      // Ajouter le fichier avatar s'il existe
      if (formData.avatar) {
        formDataToSend.append('avatar', formData.avatar);
      }
      
      const response = await authAPI.register(formDataToSend);
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.message || 'Inscription échouée. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="main-content">
      <div style={{ maxWidth: '400px', margin: '0 auto', paddingTop: '2rem' }}>
        <div className="card">
          <div className="card-header">
            <h2 className="card-title text-center">Créer un compte</h2>
            <p className="text-center" style={{ color: '#6c757d' }}>
              Inscrivez-vous pour accéder à la plateforme
            </p>
          </div>
          
          <form onSubmit={handleSubmit}>
            {error && (
              <div style={{ 
                backgroundColor: '#f8d7da', 
                color: '#721c24', 
                padding: '0.75rem', 
                borderRadius: '4px', 
                marginBottom: '1rem' 
              }}>
                {error}
              </div>
            )}
            
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
              <label htmlFor="email" className="form-label">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                className="form-control"
                value={formData.email}
                onChange={handleChange}
                required
                placeholder="Votre email"
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="password" className="form-label">Mot de passe</label>
              <input
                type="password"
                id="password"
                name="password"
                className="form-control"
                value={formData.password}
                onChange={handleChange}
                required
                placeholder="Mot de passe"
              />
            </div>

            <div className="form-group">
              <label htmlFor="role" className="form-label">Rôle</label>
              <select
                id="role"
                name="role"
                className="form-control"
                value={formData.role}
                onChange={handleChange}
              >
                <option value="apprenti">Apprenti</option>
                <option value="tuteur">Tuteur</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            
            <div className="form-group">
              <label htmlFor="avatar" className="form-label">Photo de profil</label>
              
              {/* Aperçu de l'image */}
              {avatarPreview && (
                <div style={{ marginBottom: '10px', textAlign: 'center' }}>
                  <img 
                    src={avatarPreview} 
                    alt="Aperçu avatar" 
                    style={{ 
                      width: '100px', 
                      height: '100px', 
                      borderRadius: '50%', 
                      objectFit: 'cover',
                      border: '2px solid #dee2e6'
                    }} 
                  />
                  <div style={{ marginTop: '5px' }}>
                    <button 
                      type="button" 
                      onClick={removeAvatar}
                      style={{
                        background: '#dc3545',
                        color: 'white',
                        border: 'none',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        cursor: 'pointer'
                      }}
                    >
                      Supprimer
                    </button>
                  </div>
                </div>
              )}
              
              <input
                type="file"
                id="avatar"
                name="avatar"
                className="form-control"
                accept="image/*"
                onChange={handleFileChange}
              />
              <small style={{ color: '#6c757d', fontSize: '0.8rem' }}>
                Formats acceptés : JPG, PNG, GIF (max 5MB)
              </small>
            </div>

            <div className="form-group">
              <label htmlFor="bio" className="form-label">Bio</label>
              <textarea
                id="bio"
                name="bio"
                className="form-control"
                value={formData.bio}
                onChange={handleChange}
                placeholder="Décrivez-vous en quelques mots"
                rows="3"
              />
            </div>

            <div className="form-group">
              <label htmlFor="phone" className="form-label">Téléphone</label>
              <input
                type="text"
                id="phone"
                name="phone"
                className="form-control"
                value={formData.phone}
                onChange={handleChange}
                placeholder="Votre numéro de téléphone"
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

            
            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%' }}
              disabled={loading}
            >
              {loading ? 'Inscription en cours...' : 'S\'inscrire'}
            </button>
          </form>
          
          <div className="text-center mt-3">
            <p style={{ color: '#6c757d', fontSize: '0.9rem' }}>
              Déjà un compte?{' '}
              <a href="/login" style={{ color: '#dc3545', textDecoration: 'none' }}>
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