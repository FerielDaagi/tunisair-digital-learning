import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { authAPI } from '../../services/api';
import { Link } from 'react-router-dom';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { login } = useAuth();
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
      const response = await authAPI.login(formData);
      const { user, token } = response.data;
      
      login(user, token);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Échec de la connexion. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Bienvenue</h2>
          <p className="text-center" style={{ color: '#6c757d' }}>
            Connectez-vous à votre compte Tunisair Academy
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
            <label htmlFor="email" className="form-label">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              className="form-control"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder="Entrez votre email"
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
              placeholder="Entrez votre mot de passe"
            />
          </div>
          
          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
          >
            {loading ? 'Connexion en cours...' : 'Se connecter'}
          </button>
        </form>
        
        <div className="text-center mt-3">
          <p style={{ color: '#6c757d', fontSize: '0.9rem' }}>
            Vous n'avez pas de compte ?{' '}
            <Link to="/signup" style={{ color: 'var(--primary-blue)', textDecoration: 'none' }}>
              Inscrivez-vous ici
            </Link>
          </p>
        </div>
      </div>
      
      <div className="text-center mt-3">
        <p style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '0.85rem' }}>
          Identifiants de démonstration : admin@example.com / password123
        </p>
      </div>
    </div>
  );
};

export default Login; 