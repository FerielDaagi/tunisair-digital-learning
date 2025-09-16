import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { authAPI } from '../../services/api';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const stateEmail = location.state?.email;
    if (stateEmail) {
      setEmail(stateEmail);
    }
  }, [location.state]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      await authAPI.forgotPassword(email);
      setSuccess('Si un compte existe, un email a été envoyé.');
    } catch (err) {
      console.error('Erreur forgotPassword:', err);
      setError("Impossible d'envoyer l'email. Réessayez plus tard.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="card-header">
          <h2 className="card-title">Mot de passe oublié</h2>
          <p style={{ color: '#6c757d', margin: 0, fontSize: '1.1rem' }}>
            Entrez votre email pour recevoir un lien de réinitialisation
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          {error && (
            <div style={{ backgroundColor: '#f8d7da', color: '#721c24', padding: '0.75rem', borderRadius: '8px', marginBottom: '1.5rem', border: '1px solid #f5c6cb', fontSize: '0.9rem' }}>
              {error}
            </div>
          )}
          {success && (
            <div style={{ backgroundColor: '#d4edda', color: '#155724', padding: '0.75rem', borderRadius: '8px', marginBottom: '1.5rem', border: '1px solid #c3e6cb', fontSize: '0.9rem' }}>
              {success}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="email" className="form-label">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              className="form-control"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="Entrez votre email"
            />
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Envoi en cours...' : 'Envoyer'}
          </button>

          <button type="button" className="btn btn-secondary" style={{ marginLeft: '10px' }} onClick={() => navigate('/login')}>
            Retour à la connexion
          </button>
        </form>
      </div>
    </div>
  );
};

export default ForgotPassword;


