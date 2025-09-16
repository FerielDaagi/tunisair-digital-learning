import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { authAPI } from '../../services/api';

const ResetPassword = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const [token, setToken] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const t = params.get('token');
    if (t) setToken(t);
    else setError('Lien de réinitialisation invalide');
  }, [location.search]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!token) return;
    if (password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }
    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await authAPI.resetPassword({ token, password });
      setSuccess('Mot de passe réinitialisé avec succès. Vous pouvez vous connecter.');
      setTimeout(() => navigate('/login'), 1500);
    } catch (err) {
      console.error('Erreur resetPassword:', err);
      setError('Lien invalide ou expiré. Veuillez refaire une demande.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="card-header">
          <h2 className="card-title">Réinitialiser le mot de passe</h2>
          <p style={{ color: '#6c757d', margin: 0, fontSize: '1.1rem' }}>
            Choisissez un nouveau mot de passe pour votre compte
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
            <label htmlFor="password" className="form-label">Nouveau mot de passe</label>
            <input
              type="password"
              id="password"
              name="password"
              className="form-control"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Entrez votre nouveau mot de passe"
            />
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword" className="form-label">Confirmer le mot de passe</label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              className="form-control"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              placeholder="Confirmez votre mot de passe"
            />
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading || !token}>
            {loading ? 'Réinitialisation...' : 'Réinitialiser'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;



