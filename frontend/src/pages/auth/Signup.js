import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../../services/api';

const Signup = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'apprenti',
    avatar: '',
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
  
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const userPayload = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: formData.role,
        profile: {
          avatar: formData.avatar,
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
      
      const response = await authAPI.register(userPayload);
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
              <label htmlFor="avatar" className="form-label">Avatar (URL)</label>
              <input
                type="text"
                id="avatar"
                name="avatar"
                className="form-control"
                value={formData.avatar}
                onChange={handleChange}
                placeholder="Lien vers votre avatar"
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
                placeholder="Décrivez-vous en quelques mots"
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