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
      console.log('Tentative de connexion avec:', { email: formData.email });
      const response = await authAPI.login(formData);
      console.log('Réponse de connexion:', response);
      
      const { user, token } = response.data;
      
      if (!user || !token) {
        throw new Error('Réponse invalide du serveur');
      }
      
      login(user, token);
      navigate('/');
    } catch (err) {
      console.error('Erreur de connexion:', err);
      console.error('Détails de l\'erreur:', {
        message: err.message,
        response: err.response,
        status: err.response?.status,
        data: err.response?.data
      });
      
      let errorMessage = 'Échec de la connexion. Veuillez réessayer.';
      
      if (err.response?.status === 401) {
        errorMessage = 'Email ou mot de passe incorrect.';
      } else if (err.response?.status === 404) {
        errorMessage = 'Utilisateur non trouvé.';
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
          <h2 className="card-title">Bienvenue</h2>
          <p className="card-subtitle">
            Connectez-vous à votre compte Tunisair Academy
          </p>
        </div>
        
        <form onSubmit={handleSubmit}>
          {error && (
            <div className="alert alert-error">
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
          
          <div className="form-group">
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
              style={{ width: '100%' }}
            >
              {loading ? 'Connexion en cours...' : 'Se connecter'}
            </button>
          </div>
          
          <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
            <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
              Vous n'avez pas de compte ?{' '}
              <Link to="/signup" style={{ color: 'var(--primary-blue)', textDecoration: 'none', fontWeight: '600' }}>
                Inscrivez-vous ici
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login; 