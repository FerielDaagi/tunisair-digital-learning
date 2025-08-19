import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { coursesAPI } from '../../services/api';
import { Icon, IconSizes, IconColors } from '../../components/common/IconTheme';
import './MyCourses.css';

const MyCourses = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    // Vérifier que l'utilisateur est un tuteur
    if (user && user.role !== 'tuteur') {
      navigate('/dashboard');
      return;
    }
    
    loadCourses();
  }, [user, navigate]);

  const loadCourses = async () => {
    try {
      setLoading(true);
      const response = await coursesAPI.getTutorCourses();
      if (response.data.success) {
        setCourses(response.data.data);
      }
    } catch (err) {
      console.error('Erreur chargement cours:', err);
      setError('Erreur lors du chargement des cours');
    } finally {
      setLoading(false);
    }
  };

  const handlePublish = async (courseId) => {
    try {
      const response = await coursesAPI.publish(courseId);
      if (response.data.success) {
        // Mettre à jour la liste des cours
        setCourses(prev => prev.map(course => 
          course._id === courseId 
            ? { ...course, status: 'published', isPublished: true }
            : course
        ));
      }
    } catch (err) {
      console.error('Erreur publication:', err);
      setError('Erreur lors de la publication du cours');
    }
  };

  const handleDelete = async (courseId) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce cours ? Cette action est irréversible.')) {
      try {
        await coursesAPI.delete(courseId);
        // Retirer le cours de la liste
        setCourses(prev => prev.filter(course => course._id !== courseId));
      } catch (err) {
        console.error('Erreur suppression:', err);
        setError('Erreur lors de la suppression du cours');
      }
    }
  };

  const getFilteredCourses = () => {
    switch (filter) {
      case 'draft':
        return courses.filter(course => course.status === 'draft');
      case 'published':
        return courses.filter(course => course.status === 'published');
      case 'archived':
        return courses.filter(course => course.status === 'archived');
      default:
        return courses;
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      draft: { color: 'warning', text: 'Brouillon', icon: 'edit' },
      published: { color: 'success', text: 'Publié', icon: 'check' },
      archived: { color: 'secondary', text: 'Archivé', icon: 'archive' }
    };
    
    const config = statusConfig[status] || statusConfig.draft;
    
    return (
      <span className={`status-badge status-${config.color}`}>
        <Icon name={config.icon} size={IconSizes.xs} color={IconColors.white} />
        {config.text}
      </span>
    );
  };

  const getLevelBadge = (level) => {
    const levelConfig = {
      'débutant': { color: 'success', text: 'Débutant' },
      'intermédiaire': { color: 'warning', text: 'Intermédiaire' },
      'avancé': { color: 'error', text: 'Avancé' }
    };
    
    const config = levelConfig[level] || levelConfig.débutant;
    
    return (
      <span className={`level-badge level-${config.color}`}>
        {config.text}
      </span>
    );
  };

  if (!user || user.role !== 'tuteur') {
    return (
      <div className="my-courses-page">
        <div className="access-denied">
          <Icon name="lock" size={IconSizes.xl} color={IconColors.error} />
          <h2>Accès refusé</h2>
          <p>Seuls les tuteurs peuvent accéder à cette page.</p>
        </div>
      </div>
    );
  }

  const filteredCourses = getFilteredCourses();

  return (
    <div className="my-courses-page">
      <div className="my-courses-container">
        <div className="my-courses-header">
          <div className="header-content">
            <h1>
              <Icon name="bookOpen" size={IconSizes.lg} color={IconColors.primary} />
              Mes Cours
            </h1>
            <p>Gérez et suivez vos cours créés</p>
          </div>
          <Link to="/tutor/create-course" className="create-course-btn">
            <Icon name="plus" size={IconSizes.sm} color={IconColors.white} />
            Créer un nouveau cours
          </Link>
        </div>

        {error && (
          <div className="alert alert-error">
            <Icon name="error" size={IconSizes.sm} color={IconColors.white} />
            {error}
          </div>
        )}

        <div className="courses-controls">
          <div className="filter-controls">
            <button
              className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
              onClick={() => setFilter('all')}
            >
              Tous ({courses.length})
            </button>
            <button
              className={`filter-btn ${filter === 'draft' ? 'active' : ''}`}
              onClick={() => setFilter('draft')}
            >
              Brouillons ({courses.filter(c => c.status === 'draft').length})
            </button>
            <button
              className={`filter-btn ${filter === 'published' ? 'active' : ''}`}
              onClick={() => setFilter('published')}
            >
              Publiés ({courses.filter(c => c.status === 'published').length})
            </button>
            <button
              className={`filter-btn ${filter === 'archived' ? 'active' : ''}`}
              onClick={() => setFilter('archived')}
            >
              Archivés ({courses.filter(c => c.status === 'archived').length})
            </button>
          </div>
        </div>

        {loading ? (
          <div className="loading-container">
            <Icon name="loader" size={IconSizes.xl} color={IconColors.primary} />
            <p>Chargement de vos cours...</p>
          </div>
        ) : filteredCourses.length === 0 ? (
          <div className="empty-state">
            <Icon name="bookOpen" size={IconSizes.xl} color={IconColors.secondary} />
            <h3>Aucun cours trouvé</h3>
            <p>
              {filter === 'all' 
                ? "Vous n'avez pas encore créé de cours. Commencez par en créer un !"
                : `Aucun cours avec le statut "${filter}" trouvé.`
              }
            </p>
            {filter === 'all' && (
              <Link to="/tutor/create-course" className="btn btn-primary">
                <Icon name="plus" size={IconSizes.sm} color={IconColors.white} />
                Créer votre premier cours
              </Link>
            )}
          </div>
        ) : (
          <div className="courses-grid">
            {filteredCourses.map(course => (
              <div key={course._id} className="course-card">
                <div className="course-header">
                  <div className="course-status">
                    {getStatusBadge(course.status)}
                    {getLevelBadge(course.level)}
                  </div>
                  <div className="course-actions">
                    <button
                      onClick={() => navigate(`/tutor/edit-course/${course._id}`)}
                      className="action-btn edit-btn"
                      title="Modifier le cours"
                    >
                      <Icon name="edit" size={IconSizes.xs} color={IconColors.white} />
                    </button>
                    {course.status === 'draft' && (
                      <button
                        onClick={() => handlePublish(course._id)}
                        className="action-btn publish-btn"
                        title="Publier le cours"
                      >
                        <Icon name="check" size={IconSizes.xs} color={IconColors.white} />
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(course._id)}
                      className="action-btn delete-btn"
                      title="Supprimer le cours"
                    >
                      <Icon name="trash" size={IconSizes.xs} color={IconColors.white} />
                    </button>
                  </div>
                </div>

                <div className="course-content">
                  <h3 className="course-title">{course.title}</h3>
                  <p className="course-description">{course.description}</p>
                  
                  <div className="course-meta">
                    <div className="meta-item">
                      <Icon name="clock" size={IconSizes.xs} color={IconColors.secondary} />
                      <span>{course.duration}</span>
                    </div>
                    <div className="meta-item">
                      <Icon name="users" size={IconSizes.xs} color={IconColors.secondary} />
                      <span>{course.enrolledStudents?.length || 0} étudiants</span>
                    </div>
                    <div className="meta-item">
                      <Icon name="tag" size={IconSizes.xs} color={IconColors.secondary} />
                      <span>{course.category?.name || 'Non catégorisé'}</span>
                    </div>
                  </div>

                  {course.tags && course.tags.length > 0 && (
                    <div className="course-tags">
                      {course.tags.slice(0, 3).map((tag, index) => (
                        <span key={index} className="tag">
                          {tag}
                        </span>
                      ))}
                      {course.tags.length > 3 && (
                        <span className="tag more-tags">
                          +{course.tags.length - 3}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <div className="course-footer">
                  <div className="course-stats">
                    <span className="stat">
                      <Icon name="star" size={IconSizes.xs} color={IconColors.warning} />
                      {course.rating?.average?.toFixed(1) || '0.0'}
                    </span>
                    <span className="stat">
                      <Icon name="messageSquare" size={IconSizes.xs} color={IconColors.secondary} />
                      {course.rating?.count || 0} avis
                    </span>
                  </div>
                  
                  <div className="course-actions-footer">
                    <button
                      onClick={() => navigate(`/tutor/course/${course._id}/modules`)}
                      className="btn btn-outline"
                    >
                      <Icon name="folder" size={IconSizes.xs} color={IconColors.primary} />
                      Gérer les modules
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyCourses;
