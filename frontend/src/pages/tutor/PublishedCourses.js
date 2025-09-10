import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import api, { coursesAPI } from '../../services/api';
import './PublishedCourses.css';

const PublishedCourses = () => {
  const { user, addNotification } = useAuth();
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [publishing, setPublishing] = useState({});

  useEffect(() => {
    if (!user || user.role !== 'tuteur') {
      navigate('/dashboard');
      return;
    }
    fetchMyCourses();
    // Ajouter une classe au body pour ajuster l'espacement sur cette page uniquement
    document.body.classList.add('route-published-courses');
    return () => {
      document.body.classList.remove('route-published-courses');
    };
  }, [user, navigate]);

  const fetchMyCourses = async () => {
    try {
      setLoading(true);
      const response = await coursesAPI.getTutorCourses();
      console.log('🔍 Réponse getTutorCourses:', response.data);
      
      // La réponse contient directement les cours dans data
      const coursesData = response.data.data || [];
      // Filtrer pour ne garder que les cours publiés
      const publishedCourses = coursesData.filter(course => 
        course.status === 'published' && course.isPublished === true
      );
      setCourses(Array.isArray(publishedCourses) ? publishedCourses : []);
    } catch (error) {
      console.error('Erreur lors de la récupération des cours:', error);
      setError('Erreur lors du chargement des cours');
      setCourses([]); // S'assurer que courses est un tableau
    } finally {
      setLoading(false);
    }
  };

  const handlePublishCourse = async (courseId) => {
    try {
      setPublishing(prev => ({ ...prev, [courseId]: true }));
      
      console.log('🔍 Tentative de publication du cours:', courseId);
      const response = await coursesAPI.publish(courseId);
      console.log('📋 Réponse de publication:', response.data);
      
      if (response.data.success) {
        addNotification('success', 'Cours publié avec succès !');
        // Mettre à jour le statut du cours localement
        setCourses(prev => prev.map(course => 
          course._id === courseId 
            ? { ...course, status: 'published', isPublished: true, publishedAt: new Date() }
            : course
        ));
      }
    } catch (error) {
      console.error('❌ Erreur lors de la publication:', error);
      console.error('📋 Détails de l\'erreur:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      addNotification('error', error.response?.data?.message || 'Erreur lors de la publication du cours');
    } finally {
      setPublishing(prev => ({ ...prev, [courseId]: false }));
    }
  };

  const handleViewStats = (courseId) => {
    navigate(`/tutor/course-stats/${courseId}`);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'published': return '#28a745';
      case 'draft': return '#ffc107';
      case 'archived': return '#6c757d';
      default: return '#6c757d';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'published': return 'Publié';
      case 'draft': return 'Brouillon';
      case 'archived': return 'Archivé';
      default: return 'Inconnu';
    }
  };

  const formatDate = (date) => {
    if (!date) return 'Non publié';
    return new Date(date).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const canPublish = (course) => {
    return course.status === 'draft' && 
           Array.isArray(course.modules) && 
           course.modules.length > 0 &&
           course.modules.every(module => Array.isArray(module.lessons) && module.lessons.length > 0);
  };

  if (loading) {
    return (
      <div className="published-courses-container">
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
      <div className="published-courses-container">
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
    <div className="published-courses-container">
      <div className="courses-header">
        <div className="header-content">
          <h1 className="page-title">
            <i className="fas fa-graduation-cap me-3"></i>
            Mes Cours
          </h1>
          <p className="page-subtitle">
            Gérez vos cours et suivez les performances de vos étudiants
          </p>
        </div>
        
        <div className="header-actions">
          <button 
            className="btn btn-primary"
            onClick={() => navigate('/tutor/create-course')}
          >
            <i className="fas fa-plus me-2"></i>
            Créer un nouveau cours
          </button>
        </div>
      </div>

      <div className="courses-grid">
        {courses.length === 0 ? (
          <div className="no-courses">
            <div className="no-courses-icon">
              <i className="fas fa-book-open"></i>
            </div>
            <h3>Aucun cours publié</h3>
            <p>Vous n'avez pas encore de cours publiés. Publiez vos cours depuis "Mes Cours" !</p>
            <button 
              className="btn btn-primary"
              onClick={() => navigate('/tutor/my-courses')}
            >
              <i className="fas fa-arrow-left me-2"></i>
              Retour à Mes Cours
            </button>
          </div>
        ) : (
          courses.map((course) => (
            <div key={course._id} className="course-card">
              <div className="course-thumbnail">
                {course.thumbnail ? (
                  <img 
                    src={`http://localhost:5000${course.thumbnail}`} 
                    alt={course.title}
                    className="thumbnail-image"
                  />
                ) : (
                  <div className="thumbnail-placeholder">
                    <i className="fas fa-graduation-cap"></i>
                  </div>
                )}
                <div className="course-status-badge" style={{ backgroundColor: getStatusColor(course.status) }}>
                  {getStatusText(course.status)}
                </div>
              </div>

              <div className="course-content">
                <div className="course-header">
                  <h3 className="course-title">{course.title}</h3>
                  <div className="course-meta">
                    <div className="meta-item">
                      <i className="fas fa-layer-group me-1"></i>
                      <span>{Array.isArray(course.modules) ? course.modules.length : 0} module{Array.isArray(course.modules) && course.modules.length > 1 ? 's' : ''}</span>
                    </div>
                    <div className="meta-item">
                      <i className="fas fa-users me-1"></i>
                      <span>{Array.isArray(course.enrolledStudents) ? course.enrolledStudents.length : 0} étudiant{Array.isArray(course.enrolledStudents) && course.enrolledStudents.length > 1 ? 's' : ''}</span>
                    </div>
                  </div>
                </div>

                <p className="course-description">
                  {course.description}
                </p>

                <div className="course-stats">
                  <div className="stat-item">
                    <div className="stat-value">{Array.isArray(course.modules) ? course.modules.length : 0}</div>
                    <div className="stat-label">Modules</div>
                  </div>
                  <div className="stat-item">
                    <div className="stat-value">
                      {Array.isArray(course.modules) ? course.modules.reduce((total, module) => total + (Array.isArray(module.lessons) ? module.lessons.length : 0), 0) : 0}
                    </div>
                    <div className="stat-label">Leçons</div>
                  </div>
                  <div className="stat-item">
                    <div className="stat-value">{Array.isArray(course.enrolledStudents) ? course.enrolledStudents.length : 0}</div>
                    <div className="stat-label">Étudiants</div>
                  </div>
                </div>

                <div className="course-footer">
                  <div className="course-dates">
                    <div className="date-item">
                      <i className="fas fa-calendar me-1"></i>
                      <span>Créé le {formatDate(course.createdAt)}</span>
                    </div>
                    {course.publishedAt && (
                      <div className="date-item">
                        <i className="fas fa-globe me-1"></i>
                        <span>Publié le {formatDate(course.publishedAt)}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="course-actions">
                  {course.status === 'published' ? (
                    <>
                      <button 
                        className="btn btn-outline btn-sm"
                        onClick={() => handleViewStats(course._id)}
                      >
                        <i className="fas fa-chart-bar me-1"></i>
                        Statistiques
                      </button>
                      <button 
                        className="btn btn-outline btn-sm"
                        onClick={() => navigate(`/tutor/manage-modules/${course._id}`)}
                      >
                        <i className="fas fa-cog me-1"></i>
                        Gérer
                      </button>
                    </>
                  ) : (
                    <>
                      <button 
                        className="btn btn-primary btn-sm"
                        onClick={() => handlePublishCourse(course._id)}
                        disabled={!canPublish(course) || publishing[course._id]}
                      >
                        {publishing[course._id] ? (
                          <>
                            <div className="spinner-border spinner-border-sm me-1" role="status">
                              <span className="visually-hidden">Publication...</span>
                            </div>
                            Publication...
                          </>
                        ) : (
                          <>
                            <i className="fas fa-globe me-1"></i>
                            Publier
                          </>
                        )}
                      </button>
                      <button 
                        className="btn btn-outline btn-sm"
                        onClick={() => navigate(`/tutor/edit-course/${course._id}`)}
                      >
                        <i className="fas fa-edit me-1"></i>
                        Modifier
                      </button>
                    </>
                  )}
                </div>

                {!canPublish(course) && course.status === 'draft' && (
                  <div className="publish-warning">
                    <i className="fas fa-exclamation-triangle me-1"></i>
                    <span>Ajoutez des modules et des leçons pour publier ce cours</span>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default PublishedCourses;
