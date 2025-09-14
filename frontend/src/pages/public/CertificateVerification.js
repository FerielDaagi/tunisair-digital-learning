import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { certificatesAPI } from '../../services/api';
import { Icon, IconSizes, IconColors } from '../../components/common/IconTheme';
import './CertificateVerification.css';

const CertificateVerification = () => {
  const navigate = useNavigate();
  const [certificateNumber, setCertificateNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [certificate, setCertificate] = useState(null);

  const handleVerify = async (e) => {
    e.preventDefault();
    
    if (!certificateNumber.trim()) {
      setError('Veuillez entrer un numéro de certificat');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      // Ouvrir le certificat HTML dans un nouvel onglet
      const url = `/api/certificates/public/${certificateNumber}`;
      window.open(url, '_blank');
      
    } catch (error) {
      console.error('Erreur lors de la vérification:', error);
      setError('Certificat non trouvé ou invalide');
    } finally {
      setLoading(false);
    }
  };

  const handleBackToHome = () => {
    navigate('/');
  };

  return (
    <div className="verification-container">
      <div className="verification-card">
        <div className="verification-header">
          <div className="verification-icon">
            <Icon name="shield-check" size={IconSizes.xl} color={IconColors.primary} />
          </div>
          <h1 className="verification-title">Vérification de Certificat</h1>
          <p className="verification-subtitle">
            Entrez le numéro de certificat pour vérifier son authenticité
          </p>
        </div>

        <form onSubmit={handleVerify} className="verification-form">
          <div className="form-group">
            <label htmlFor="certificateNumber" className="form-label">
              Numéro de Certificat
            </label>
            <div className="input-group">
              <Icon name="certificate" size={IconSizes.sm} color={IconColors.gray} />
              <input
                type="text"
                id="certificateNumber"
                value={certificateNumber}
                onChange={(e) => setCertificateNumber(e.target.value)}
                placeholder="Ex: CERT-TUNISAIR-2024-001"
                className="form-input"
                disabled={loading}
              />
            </div>
          </div>

          {error && (
            <div className="error-message">
              <Icon name="exclamation-triangle" size={IconSizes.xs} color={IconColors.danger} />
              {error}
            </div>
          )}

          <div className="form-actions">
            <button
              type="submit"
              className="btn btn-primary verify-btn"
              disabled={loading || !certificateNumber.trim()}
            >
              {loading ? (
                <>
                  <Icon name="spinner" size={IconSizes.xs} color={IconColors.white} />
                  Vérification...
                </>
              ) : (
                <>
                  <Icon name="search" size={IconSizes.xs} color={IconColors.white} />
                  Vérifier le Certificat
                </>
              )}
            </button>
            
            <button
              type="button"
              className="btn btn-outline-secondary back-btn"
              onClick={handleBackToHome}
            >
              <Icon name="arrow-left" size={IconSizes.xs} color={IconColors.gray} />
              Retour à l'accueil
            </button>
          </div>
        </form>

        <div className="verification-info">
          <h3>Comment vérifier un certificat ?</h3>
          <ul>
            <li>
              <Icon name="check" size={IconSizes.xs} color={IconColors.success} />
              Entrez le numéro de certificat complet
            </li>
            <li>
              <Icon name="check" size={IconSizes.xs} color={IconColors.success} />
              Cliquez sur "Vérifier le Certificat"
            </li>
            <li>
              <Icon name="check" size={IconSizes.xs} color={IconColors.success} />
              Le certificat s'ouvrira dans un nouvel onglet
            </li>
          </ul>
        </div>

        <div className="verification-footer">
          <p>
            <Icon name="info-circle" size={IconSizes.xs} color={IconColors.info} />
            Cette page permet de vérifier l'authenticité des certificats délivrés par Tunisair Academy
          </p>
        </div>
      </div>
    </div>
  );
};

export default CertificateVerification;
