import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { enrollmentAPI } from '../../services/api';
import './MyCourses.css';

const MyCourses = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all'); // all, active, completed

  useEffect(() => {
    if (!user || user.role !== 'apprenti') {
      navigate('/dashboard');
      return;
    }
    fetchMyCourses();
  }, [user, navigate, fetchMyCourses]);

  const fetchMyCourses = useCallback(async () => {
    try {
      setLoading(true);
      const response = await enrollmentAPI.getStudentCourses({ status: filter === 'all' ? '' : filter });
      setCourses(response.data.data.enrollments);
    } catch (error) {
      console.error('Erreur lors de la récupération des cours:', error);
      setError('Erreur lors du chargement des cours');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  const handleCourseClick = (courseId) => {
    navigate(`/course-progress/${courseId}`);
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
      case 'active': return 'En cours';
      case 'completed': return 'Terminé';
      case 'paused': return 'En pause';
      case 'dropped': return 'Abandonné';
      default: return 'Inconnu';
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="my-courses-container">
        <div className="loading-container">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Chargement...</span>
          </div>
          <p>Chargement de vos cours...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="my-courses-container">
        <div className="error-container">
          <div className="alert alert-danger" role="alert">
            <i className="fas fa-exclamation-triangle me-2"></i>
            {error}
          </div>
          <button className="btn btn-primary" onClick={fetchMyCourses}>
            <i className="fas fa-refresh me-2"></i>
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="my-courses-container">
      <div className="my-courses-header">
        <div className="header-content">
          <h1 className="page-title">
            <i className="fas fa-graduation-cap me-3"></i>
            Mes Cours
          </h1>
          <p className="page-subtitle">
            Suivez votre progression dans vos cours d'apprentissage
          </p>
        </div>
        
        <div className="filter-tabs">
          <button 
            className={`filter-tab ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            Tous ({courses.length})
          </button>
          <button 
            className={`filter-tab ${filter === 'active' ? 'active' : ''}`}
            onClick={() => setFilter('active')}
          >
            En cours ({courses.filter(c => c.status === 'active').length})
          </button>
          <button 
            className={`filter-tab ${filter === 'completed' ? 'active' : ''}`}
            onClick={() => setFilter('completed')}
          >
            Terminés ({courses.filter(c => c.status === 'completed').length})
          </button>
        </div>
      </div>

      <div className="courses-grid">
        {courses.length === 0 ? (
          <div className="no-courses">
            <div className="no-courses-icon">
              <i className="fas fa-book-open"></i>
            </div>
            <h3>Aucun cours trouvé</h3>
            <p>
              {filter === 'all' 
                ? "Vous n'êtes inscrit à aucun cours pour le moment."
                : `Aucun cours avec le statut "${getStatusText(filter)}" trouvé.`
              }
            </p>
            <button 
              className="btn btn-primary"
              onClick={() => navigate('/courses')}
            >
              <i className="fas fa-search me-2"></i>
              Découvrir des cours
            </button>
          </div>
        ) : (
          courses.map((enrollment) => (
            <div 
              key={enrollment._id} 
              className="course-card"
              onClick={() => handleCourseClick(enrollment.course._id)}
            >
              <div className="course-thumbnail">
                {enrollment.course.thumbnail ? (
                  <img 
                    src={`http://localhost:5000${enrollment.course.thumbnail}`} 
                    alt={enrollment.course.title}
                    className="thumbnail-image"
                  />
                ) : (
                  <div className="thumbnail-placeholder">
                    <i className="fas fa-graduation-cap"></i>
                  </div>
                )}
                <div className="course-status-badge" style={{ backgroundColor: getStatusColor(enrollment.status) }}>
                  {getStatusText(enrollment.status)}
                </div>
              </div>

              <div className="course-content">
                <div className="course-header">
                  <h3 className="user-course-title">{enrollment.course.title}</h3>
                  <div className="course-instructor">
                    <i className="fas fa-user me-1"></i>
                    {enrollment.course.instructor?.firstName && enrollment.course.instructor?.lastName 
                      ? `${enrollment.course.instructor.firstName} ${enrollment.course.instructor.lastName}`
                      : enrollment.course.instructor?.name || enrollment.course.instructor || 'Instructeur'}
                  </div>
                </div>

                <p className="course-description">
                  {enrollment.course.description}
                </p>

                <div className="course-meta">
                  <div className="meta-item">
                    <i className="fas fa-clock me-1"></i>
                    <span>{enrollment.course.duration}</span>
                  </div>
                  <div className="meta-item">
                    <i className="fas fa-layer-group me-1"></i>
                    <span>{enrollment.course.modules.length} module{enrollment.course.modules.length > 1 ? 's' : ''}</span>
                  </div>
                  <div className="meta-item">
                    <i className="fas fa-signal me-1"></i>
                    <span>{enrollment.course.level}</span>
                  </div>
                </div>

                <div className="progress-section">
                  <div className="progress-header">
                    <span className="progress-label">Progression</span>
                    <span className="progress-percentage">{enrollment.progress}%</span>
                  </div>
                  <div className="progress-bar">
                    <div 
                      className="progress-fill" 
                      style={{ width: `${enrollment.progress}%` }}
                    ></div>
                  </div>
                </div>

                <div className="course-footer">
                  <div className="enrollment-date">
                    <i className="fas fa-calendar me-1"></i>
                    Inscrit le {formatDate(enrollment.enrolledAt)}
                  </div>
                  <div className="last-accessed">
                    <i className="fas fa-clock me-1"></i>
                    Dernière activité: {formatDate(enrollment.lastAccessedAt)}
                  </div>
                </div>

                <div className="course-actions">
                  <button 
                    className="btn btn-primary btn-sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCourseClick(enrollment.course._id);
                    }}
                  >
                    <i className="fas fa-play me-1"></i>
                    Continuer
                  </button>
                  <button 
                    className="btn btn-outline btn-sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/course-progress/${enrollment.course._id}`);
                    }}
                  >
                    <i className="fas fa-chart-line me-1"></i>
                    Progression
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default MyCourses;
