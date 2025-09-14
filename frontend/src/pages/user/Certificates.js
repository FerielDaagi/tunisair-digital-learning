import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { certificatesAPI } from '../../services/api';
import { Icon, IconSizes, IconColors } from '../../components/common/IconTheme';
import './Certificates.css';

const Certificates = () => {
  const { addNotification } = useAuth();
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(null);

  useEffect(() => {
    fetchCertificates();
  }, []);

  const fetchCertificates = async () => {
    try {
      setLoading(true);
      const response = await certificatesAPI.getStudentCertificates();
      if (response.data.success) {
        setCertificates(response.data.data.certificates);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des certificats:', error);
      addNotification('Erreur lors du chargement des certificats', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (certificate, courseTitle) => {
    try {
      setDownloading(certificate.certificateNumber);
      console.log('🔍 Téléchargement du certificat:', certificate);
      
      // Utiliser l'ID du certificat, pas le numéro
      const response = await certificatesAPI.downloadCertificate(certificate._id || certificate.id);
      
      // Créer un blob et télécharger le fichier
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      // Nom du fichier basé sur le titre du cours
      const fileName = `Certificat_${courseTitle.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
      link.download = fileName;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      addNotification('Certificat téléchargé avec succès !', 'success');
    } catch (error) {
      console.error('Erreur lors du téléchargement:', error);
      console.error('Détails de l\'erreur:', error.response?.data);
      
      let errorMessage = 'Erreur lors du téléchargement du certificat';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      addNotification(errorMessage, 'error');
    } finally {
      setDownloading(null);
    }
  };

  const handleViewHTML = async (certificate) => {
    try {
      console.log('🔍 Affichage du certificat HTML:', certificate);
      
      // Ouvrir le certificat HTML dans un nouvel onglet
      const certificateId = certificate._id || certificate.id;
      const url = `/api/certificates/${certificateId}/html`;
      window.open(url, '_blank');
      
    } catch (error) {
      console.error('Erreur lors de l\'affichage du certificat HTML:', error);
      addNotification('Erreur lors de l\'affichage du certificat', 'error');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getGradeColor = (grade) => {
    switch (grade) {
      case 'A+':
      case 'A':
        return 'success';
      case 'B+':
      case 'B':
        return 'info';
      case 'C+':
      case 'C':
        return 'warning';
      default:
        return 'secondary';
    }
  };

  if (loading) {
    return (
      <div className="main-content">
        <div className="text-center">
          <p>Chargement de vos certificats...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="main-content">
      <div className="card">
        <div className="card-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Icon name="trophy" size={IconSizes.md} color={IconColors.success} />
            <h1 className="card-title">Mes Certificats</h1>
          </div>
          <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
            Vos certificats de completion de cours
          </p>
        </div>
      </div>

      {certificates.length === 0 ? (
        <div className="card">
          <div className="text-center py-5">
            <Icon name="trophy" size={IconSizes.xl} color={IconColors.gray} />
            <h3 className="mt-3">Aucun certificat</h3>
            <p className="text-muted">
              Vous n'avez pas encore de certificats. Complétez des cours pour obtenir vos premiers certificats !
            </p>
          </div>
        </div>
      ) : (
        <div className="certificates-list">
          {certificates.map((cert) => (
            <div key={cert.certificateNumber} className="certificate-item">
              <div className="certificate-info">
                <h3 className="course-title">{cert.course.title}</h3>
                <div className="certificate-meta">
                  <span className="completion-badge">
                    <Icon name="check-circle" size={IconSizes.xs} color={IconColors.white} />
                    {cert.completion.percentage}% complété
                  </span>
                  <span className="date-badge">
                    <Icon name="calendar" size={IconSizes.xs} color={IconColors.gray} />
                    {formatDate(cert.certificate.issuedAt)}
                  </span>
                </div>
              </div>
              
              <div className="certificate-actions">
                <button
                  className="btn btn-primary"
                  onClick={() => handleDownload(cert, cert.course.title)}
                  disabled={downloading === cert.certificateNumber}
                  title="Télécharger le certificat en PDF"
                >
                  {downloading === cert.certificateNumber ? (
                    <>
                      <Icon name="spinner" size={IconSizes.xs} color={IconColors.white} />
                      Téléchargement...
                    </>
                  ) : (
                    <>
                      <Icon name="download" size={IconSizes.xs} color={IconColors.white} />
                      Télécharger PDF
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Certificates;
