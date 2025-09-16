import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { authAPI } from '../../services/api';
import './EmailVerification.css';

const EmailVerification = () => {
  const [verificationCode, setVerificationCode] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [countdown, setCountdown] = useState(0);
  
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Récupérer l'email depuis l'état de navigation ou les paramètres URL
    const stateEmail = location.state?.email;
    const urlParams = new URLSearchParams(location.search);
    const urlEmail = urlParams.get('email');
    
    if (stateEmail) {
      setEmail(stateEmail);
    } else if (urlEmail) {
      setEmail(urlEmail);
    } else {
      // Si pas d'email, rediriger vers l'inscription
      navigate('/signup');
    }

    // Afficher le message d'erreur s'il y en a un
    if (location.state?.message) {
      setError(location.state.message);
    }
  }, [location, navigate]);

  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    if (!verificationCode || verificationCode.length !== 6) {
      setError('Veuillez entrer un code de vérification valide (6 chiffres)');
      setLoading(false);
      return;
    }

    try {
      const response = await authAPI.verifyEmail({
        email,
        verificationCode
      });

      if (response.data.success) {
        setSuccess('Email vérifié avec succès ! Redirection vers la connexion...');
        setTimeout(() => {
          navigate('/login', { 
            state: { 
              message: 'Votre compte a été activé avec succès. Vous pouvez maintenant vous connecter.' 
            }
          });
        }, 2000);
      }
    } catch (err) {
      console.error('Erreur vérification:', err);
      setError(err.response?.data?.message || 'Erreur lors de la vérification du code');
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    setResendLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await authAPI.resendVerification(email);
      
      if (response.data.success) {
        setSuccess('Nouveau code de vérification envoyé !');
        setCountdown(60); // 60 secondes avant de pouvoir renvoyer
      }
    } catch (err) {
      console.error('Erreur renvoi code:', err);
      setError(err.response?.data?.message || 'Erreur lors du renvoi du code');
    } finally {
      setResendLoading(false);
    }
  };

  const handleCodeChange = (e) => {
    const value = e.target.value.replace(/\D/g, ''); // Seulement les chiffres
    if (value.length <= 6) {
      setVerificationCode(value);
      // Effacer les erreurs quand l'utilisateur tape
      if (error) {
        setError('');
      }
    }
  };

  return (
    <div className="verification-page">
      <div className="verification-container">
        {/* Section gauche - Info */}
        <div className="verification-info">
          <h1>Vérification Email</h1>
          <p className="subtitle">
            Nous avons envoyé un code de vérification à votre adresse email. 
            Entrez le code ci-dessous pour activer votre compte.
          </p>
          
          <div className="email-display">
            <div className="email-icon">📧</div>
            <div className="email-text">
              <strong>Code envoyé à :</strong>
              <span className="email-address">{email}</span>
            </div>
          </div>
        </div>

        {/* Section droite - Formulaire */}
        <div className="verification-form-section">
          <div className="form-header">
            <h2>Vérification</h2>
            <p>Entrez le code de vérification reçu par email</p>
          </div>
          
          <form className="verification-form" onSubmit={handleSubmit}>
            {error && <div className="alert alert-error">{error}</div>}
            {success && <div className="alert alert-success">{success}</div>}

            <div className="form-group">
              <label htmlFor="verificationCode" className="form-label">Code de vérification</label>
              <input
                type="text"
                id="verificationCode"
                className="form-control"
                value={verificationCode}
                onChange={handleCodeChange}
                placeholder="000000"
                maxLength="6"
                required
                autoComplete="off"
              />
            </div>

            <div className="submit-section">
              <button
                type="submit"
                className={`btn-submit ${loading ? 'loading' : ''}`}
                disabled={loading || verificationCode.length !== 6}
              >
                {loading ? 'Vérification...' : 'Vérifier mon email'}
              </button>
            </div>
          </form>

          <div className="verification-footer">
            <p>Pas reçu le code ?</p>
            <button
              type="button"
              className="btn-resend"
              onClick={handleResendCode}
              disabled={resendLoading || countdown > 0}
            >
              {resendLoading ? 'Envoi...' : countdown > 0 ? `Renvoyer dans ${countdown}s` : 'Renvoyer le code'}
            </button>
          </div>

          <div className="back-link">
            <p>
              <button type="button" onClick={() => navigate('/signup')}>
                ← Retour à l'inscription
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailVerification;
