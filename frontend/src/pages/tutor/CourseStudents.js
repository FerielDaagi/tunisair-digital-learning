import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { coursesAPI } from '../../services/api';
import './CourseStudents.css';

const CourseStudents = () => {
  const { courseId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [course, setCourse] = useState(null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  // Variables supprimées - version simplifiée
  const [filter, setFilter] = useState('all'); // all, active, completed, struggling

  useEffect(() => {
    if (!user || user.role !== 'tuteur') {
      navigate('/dashboard');
      return;
    }
    
    if (courseId) {
      fetchCourseStudents();
    }
  }, [user, navigate, courseId]);

  const fetchCourseStudents = async () => {
    try {
      setLoading(true);
      const response = await coursesAPI.getCourseStudents(courseId);
      console.log('🔍 Course students response:', response.data);
      
      setCourse(response.data.data.course);
      setStudents(response.data.data.students);
    } catch (error) {
      console.error('Erreur lors de la récupération des étudiants:', error);
      setError('Erreur lors du chargement des étudiants');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (progress) => {
    if (progress >= 80) return '#28a745'; // Vert pour excellente progression
    if (progress >= 50) return '#ffc107'; // Jaune pour progression moyenne
    if (progress >= 20) return '#fd7e14'; // Orange pour progression faible
    return '#dc3545'; // Rouge pour très faible progression
  };

  const getStatusText = (progress) => {
    if (progress >= 80) return 'Excellent';
    if (progress >= 50) return 'Bon';
    if (progress >= 20) return 'En difficulté';
    return 'Très en difficulté';
  };

  const formatDate = (date) => {
    if (!date) return 'Jamais';
    return new Date(date).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDuration = (minutes) => {
    if (!minutes) return '0 min';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}min`;
    }
    return `${mins}min`;
  };

  const getFilteredStudents = () => {
    switch (filter) {
      case 'active':
        return students.filter(s => s.progress.overallProgress > 0 && s.progress.overallProgress < 100);
      case 'completed':
        return students.filter(s => s.progress.overallProgress === 100);
      case 'struggling':
        return students.filter(s => s.progress.overallProgress < 20);
      default:
        return students;
    }
  };

  const getLessonStatusIcon = (status) => {
    switch (status) {
      case 'completed': return '✅';
      case 'in_progress': return '🔄';
      case 'not_started': return '⏸️';
      default: return '❓';
    }
  };

  const getLessonStatusText = (status) => {
    switch (status) {
      case 'completed': return 'Terminée';
      case 'in_progress': return 'En cours';
      case 'not_started': return 'Non commencée';
      default: return 'Inconnu';
    }
  };

  if (loading) {
    return (
      <div className="course-students-container">
        <div className="loading-container">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Chargement...</span>
          </div>
          <p>Chargement des étudiants...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="course-students-container">
        <div className="error-container">
          <div className="alert alert-danger" role="alert">
            <i className="fas fa-exclamation-triangle me-2"></i>
            {error}
          </div>
          <button className="btn btn-primary" onClick={fetchCourseStudents}>
            <i className="fas fa-refresh me-2"></i>
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  const filteredStudents = getFilteredStudents();

  return (
    <div className="course-students-container">
      {/* Header */}
      <div className="students-header">
        <div className="header-content">
          <button 
            onClick={() => navigate('/tutor/published-courses')}
            className="btn btn-outline btn-sm back-btn"
          >
            <i className="fas fa-arrow-left me-2"></i>
            Retour aux cours
          </button>
          
          <div className="course-info">
            <h1 className="page-title">
              <i className="fas fa-users me-3"></i>
              Étudiants du cours
            </h1>
            {course && (
              <div className="course-details">
                <h2 className="course-title">{course.title}</h2>
                <div className="course-stats">
                  <span className="stat-item">
                    <i className="fas fa-users me-1"></i>
                    {course.totalStudents} étudiant{course.totalStudents > 1 ? 's' : ''}
                  </span>
                  <span className="stat-item">
                    <i className="fas fa-book me-1"></i>
                    {course.totalLessons} leçon{course.totalLessons > 1 ? 's' : ''}
                  </span>
                  <span className="stat-item">
                    <i className="fas fa-layer-group me-1"></i>
                    {course.totalModules} module{course.totalModules > 1 ? 's' : ''}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-section">
        <div className="filter-tabs">
          <button 
            className={`filter-tab ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            Tous ({students.length})
          </button>
          <button 
            className={`filter-tab ${filter === 'active' ? 'active' : ''}`}
            onClick={() => setFilter('active')}
          >
            En cours ({students.filter(s => s.progress.overallProgress > 0 && s.progress.overallProgress < 100).length})
          </button>
          <button 
            className={`filter-tab ${filter === 'completed' ? 'active' : ''}`}
            onClick={() => setFilter('completed')}
          >
            Terminés ({students.filter(s => s.progress.overallProgress === 100).length})
          </button>
          <button 
            className={`filter-tab ${filter === 'struggling' ? 'active' : ''}`}
            onClick={() => setFilter('struggling')}
          >
            En difficulté ({students.filter(s => s.progress.overallProgress < 20).length})
          </button>
        </div>
      </div>

      {/* Students List */}
      <div className="students-list">
        {filteredStudents.length === 0 ? (
          <div className="no-students">
            <div className="no-students-icon">
              <i className="fas fa-user-graduate"></i>
            </div>
            <h3>Aucun étudiant trouvé</h3>
            <p>
              {filter === 'all' 
                ? "Aucun étudiant n'est encore inscrit à ce cours."
                : `Aucun étudiant trouvé avec le filtre "${filter}".`
              }
            </p>
          </div>
        ) : (
          filteredStudents.map((student) => (
            <div key={student._id} className="student-card">
              <div className="student-header">
                <div className="student-info">
                  <div className="student-avatar">
                    {student.avatar ? (
                      <img 
                        src={`http://localhost:5000${student.avatar}`} 
                        alt={`${student.firstName} ${student.lastName}`}
                        className="avatar-image"
                      />
                    ) : (
                      <div className="avatar-placeholder">
                        <i className="fas fa-user"></i>
                      </div>
                    )}
                  </div>
                  <div className="student-details">
                    <h3 className="student-name">
                      {student.firstName} {student.lastName}
                    </h3>
                    <p className="student-email">{student.email}</p>
                    <div className="student-meta">
                      <span className="meta-item">
                        <i className="fas fa-calendar me-1"></i>
                        Inscrit le {formatDate(student.enrollment.enrolledAt)}
                      </span>
                      {student.progress.lastActivity && (
                        <span className="meta-item">
                          <i className="fas fa-clock me-1"></i>
                          Dernière activité: {formatDate(student.progress.lastActivity)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="student-progress-summary">
                  <div className="progress-circle">
                    <div 
                      className="progress-fill"
                      style={{ 
                        background: `conic-gradient(${getStatusColor(student.progress.overallProgress)} ${student.progress.overallProgress * 3.6}deg, #e9ecef 0deg)`
                      }}
                    >
                      <div className="progress-inner">
                        <span className="progress-percentage">{student.progress.overallProgress}%</span>
                      </div>
                    </div>
                  </div>
                  <div className="progress-details">
                    <div className="progress-stats">
                      <span className="stat">
                        <strong>{student.progress.overallProgress}%</strong> de progression
                      </span>
                      <span className="stat">
                        <i className="fas fa-calendar me-1"></i>
                        Inscrit le {formatDate(student.enrollment.enrolledAt)}
                      </span>
                    </div>
                    <div className={`progress-status ${getStatusText(student.progress.overallProgress).toLowerCase().replace(' ', '-')}`}>
                      {getStatusText(student.progress.overallProgress)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions supprimées - version simplifiée */}
            </div>
          ))
        )}
      </div>

      {/* Modal supprimée - version simplifiée */}
    </div>
  );
};

export default CourseStudents;
