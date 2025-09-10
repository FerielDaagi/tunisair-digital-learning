import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import api, { enrollmentAPI } from '../../services/api';
import './CourseStats.css';

const CourseStats = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { user, addNotification } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user || user.role !== 'tuteur') {
      navigate('/dashboard');
      return;
    }
    fetchCourseStats();
  }, [courseId, user, navigate]);

  const fetchCourseStats = async () => {
    try {
      setLoading(true);
      const response = await enrollmentAPI.getCourseStats(courseId);
      setStats(response.data.data);
    } catch (error) {
      console.error('Erreur lors de la récupération des statistiques:', error);
      setError('Erreur lors du chargement des statistiques du cours');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return '#28a745';
      case 'completed': return '#007bff';
      case 'paused': return '#ffc107';
      case 'dropped': return '#dc3545';
      default: return '#6c757d';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'active': return 'Actif';
      case 'completed': return 'Terminé';
      case 'paused': return 'En pause';
      case 'dropped': return 'Abandonné';
      default: return 'Inconnu';
    }
  };

  if (loading) {
    return (
      <div className="course-stats-container">
        <div className="loading-container">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Chargement...</span>
          </div>
          <p>Chargement des statistiques...</p>
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="course-stats-container">
        <div className="error-container">
          <div className="alert alert-danger" role="alert">
            <i className="fas fa-exclamation-triangle me-2"></i>
            {error || 'Statistiques non trouvées'}
          </div>
          <button className="btn btn-primary" onClick={() => navigate('/tutor/published-courses')}>
            <i className="fas fa-arrow-left me-2"></i>
            Retour aux cours
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="course-stats-container">
      {/* Header */}
      <div className="stats-header">
        <div className="header-navigation">
          <button 
            className="btn btn-outline btn-sm"
            onClick={() => navigate('/tutor/published-courses')}
          >
            <i className="fas fa-arrow-left me-2"></i>
            Retour
          </button>
        </div>
        
        <div className="course-info">
          <h1 className="stats-course-title">{stats.course.title}</h1>
          <p className="course-subtitle">Statistiques et performances du cours</p>
          
          <div className="course-overview">
            <div className="overview-item">
              <div className="overview-value">{stats.course.totalStudents}</div>
              <div className="overview-label">Étudiants inscrits</div>
            </div>
            <div className="overview-item">
              <div className="overview-value">{formatDate(stats.course.publishedAt)}</div>
              <div className="overview-label">Date de publication</div>
            </div>
          </div>
        </div>
      </div>

      <div className="stats-content">
        {/* Statistiques d'enrollment */}
        <div className="stats-section">
          <h2 className="section-title">
            <i className="fas fa-users me-2"></i>
            Statistiques d'inscription
          </h2>
          
          <div className="stats-grid">
            {stats.enrollmentStats.map((stat, index) => (
              <div key={index} className="stat-card">
                <div className="stat-icon" style={{ backgroundColor: getStatusColor(stat._id) }}>
                  <i className="fas fa-user"></i>
                </div>
                <div className="stat-content">
                  <div className="stat-value">{stat.count}</div>
                  <div className="stat-label">{getStatusText(stat._id)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Statistiques de progression */}
        <div className="stats-section">
          <h2 className="section-title">
            <i className="fas fa-chart-line me-2"></i>
            Statistiques de progression
          </h2>
          
          <div className="stats-grid">
            {stats.progressStats.map((stat, index) => (
              <div key={index} className="stat-card">
                <div className="stat-icon" style={{ backgroundColor: getStatusColor(stat._id) }}>
                  <i className="fas fa-tasks"></i>
                </div>
                <div className="stat-content">
                  <div className="stat-value">{stat.count}</div>
                  <div className="stat-label">{getStatusText(stat._id)}</div>
                  {stat.avgTimeSpent && (
                    <div className="stat-detail">
                      Temps moyen: {Math.round(stat.avgTimeSpent / 60)} min
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Étudiants récents */}
        <div className="stats-section">
          <h2 className="section-title">
            <i className="fas fa-clock me-2"></i>
            Inscriptions récentes
          </h2>
          
          <div className="recent-students">
            {stats.recentStudents.length === 0 ? (
              <div className="no-data">
                <i className="fas fa-user-slash"></i>
                <p>Aucun étudiant inscrit pour le moment</p>
              </div>
            ) : (
              <div className="students-list">
                {stats.recentStudents.map((enrollment, index) => (
                  <div key={index} className="student-item">
                    <div className="student-avatar">
                      {enrollment.student.avatar ? (
                        <img 
                          src={`http://localhost:5000${enrollment.student.avatar}`} 
                          alt={`${enrollment.student.firstName} ${enrollment.student.lastName}`}
                        />
                      ) : (
                        <div className="avatar-placeholder">
                          {enrollment.student.firstName.charAt(0)}{enrollment.student.lastName.charAt(0)}
                        </div>
                      )}
                    </div>
                    
                    <div className="student-info">
                      <div className="student-name">
                        {enrollment.student.firstName} {enrollment.student.lastName}
                      </div>
                      <div className="student-email">{enrollment.student.email}</div>
                    </div>
                    
                    <div className="student-meta">
                      <div className="enrollment-date">
                        Inscrit le {formatDate(enrollment.enrolledAt)}
                      </div>
                      <div className="enrollment-status">
                        <span 
                          className="status-badge"
                          style={{ backgroundColor: getStatusColor(enrollment.status) }}
                        >
                          {getStatusText(enrollment.status)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseStats;
