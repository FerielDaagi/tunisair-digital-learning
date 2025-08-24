import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (user && user.role !== 'tuteur') {
      navigate('/dashboard');
      return;
    }
    
    fetchCourses();
  }, [user, navigate]);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const response = await coursesAPI.getTutorCourses();
      setCourses(response.data.data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des cours:', error);
      setError('Erreur lors du chargement des cours');
    } finally {
      setLoading(false);
    }
  };

  const handlePublish = async (courseId) => {
    try {
      await coursesAPI.publish(courseId);
      setSuccess('Cours publié avec succès !');
      fetchCourses(); // Recharger les cours
    } catch (error) {
      console.error('Erreur lors de la publication:', error);
      setError('Erreur lors de la publication du cours');
    }
  };

  const handleDelete = async (courseId) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce cours ?')) {
      try {
        await coursesAPI.delete(courseId);
        setSuccess('Cours supprimé avec succès !');
        fetchCourses(); // Recharger les cours
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
        setError('Erreur lors de la suppression du cours');
      }
    }
  };

  const handleEdit = (courseId) => {
    // TODO: Implémenter l'édition
    alert('Fonctionnalité d\'édition à venir !');
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'published': return 'success';
      case 'draft': return 'warning';
      case 'archived': return 'muted';
      default: return 'muted';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'published': return 'checkCircle';
      case 'draft': return 'edit';
      case 'archived': return 'archive';
      default: return 'circle';
    }
  };

  const getLevelColor = (level) => {
    switch (level) {
      case 'débutant': return 'success';
      case 'intermédiaire': return 'warning';
      case 'avancé': return 'error';
      default: return 'muted';
    }
  };

  const filteredCourses = courses.filter(course => {
    const matchesStatus = filterStatus === 'all' || course.status === filterStatus;
    const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         course.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

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

  return (
    <div className="my-courses-page">
      <div className="my-courses-container">
        {/* En-tête */}
        <div className="page-header">
          <div className="header-content">
            <h1>
              <Icon name="bookOpen" size={IconSizes.lg} color={IconColors.primary} />
              Mes Cours
            </h1>
            <p>Gérez et suivez vos cours créés</p>
          </div>
          <button
            onClick={() => navigate('/tutor/create-course')}
            className="btn btn-primary create-btn"
          >
            <Icon name="plus" size={IconSizes.sm} color={IconColors.white} />
            Créer un cours
          </button>
        </div>

        {/* Statistiques rapides */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">
              <Icon name="bookOpen" size={IconSizes.md} color={IconColors.primary} />
            </div>
            <div className="stat-content">
              <h3>{courses.length}</h3>
              <p>Total des cours</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">
              <Icon name="checkCircle" size={IconSizes.md} color={IconColors.success} />
            </div>
            <div className="stat-content">
              <h3>{courses.filter(c => c.status === 'published').length}</h3>
              <p>Cours publiés</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">
              <Icon name="edit" size={IconSizes.md} color={IconColors.warning} />
            </div>
            <div className="stat-content">
              <h3>{courses.filter(c => c.status === 'draft').length}</h3>
              <p>Brouillons</p>
            </div>
          </div>
        </div>

        {/* Filtres et recherche */}
        <div className="filters-section">
          <div className="search-box">
            <Icon name="search" size={IconSizes.sm} color={IconColors.muted} />
            <input
              type="text"
              placeholder="Rechercher un cours..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
          
          <div className="filter-controls">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="filter-select"
            >
              <option value="all">Tous les cours</option>
              <option value="published">Publiés</option>
              <option value="draft">Brouillons</option>
              <option value="archived">Archivés</option>
            </select>
          </div>
        </div>

        {/* Liste des cours */}
        {loading ? (
          <div className="loading-state">
            <Icon name="loader" size={IconSizes.xl} color={IconColors.primary} className="spin" />
            <p>Chargement de vos cours...</p>
          </div>
        ) : error ? (
          <div className="error-state">
            <Icon name="error" size={IconSizes.xl} color={IconColors.error} />
            <p>{error}</p>
            <button onClick={fetchCourses} className="btn btn-secondary">
              Réessayer
            </button>
          </div>
        ) : filteredCourses.length === 0 ? (
          <div className="empty-state">
            <Icon name="bookOpen" size={IconSizes.xl} color={IconColors.muted} />
            <h3>Aucun cours trouvé</h3>
            <p>
              {searchTerm || filterStatus !== 'all' 
                ? 'Aucun cours ne correspond à vos critères de recherche.'
                : 'Vous n\'avez pas encore créé de cours. Commencez par en créer un !'
              }
            </p>
            {!searchTerm && filterStatus === 'all' && (
              <button
                onClick={() => navigate('/tutor/create-course')}
                className="btn btn-primary"
              >
                <Icon name="plus" size={IconSizes.sm} color={IconColors.white} />
                Créer votre premier cours
              </button>
            )}
          </div>
        ) : (
          <div className="courses-grid">
            {filteredCourses.map(course => (
              <div key={course._id} className="course-card">
                <div className="course-header">
                  <div className="course-status">
                    <span className={`status-badge ${getStatusColor(course.status)}`}>
                      <Icon name={getStatusIcon(course.status)} size={IconSizes.xs} color={IconColors.white} />
                      {course.status === 'published' ? 'Publié' : 
                       course.status === 'draft' ? 'Brouillon' : 'Archivé'}
                    </span>
                  </div>
                  <div className="course-level">
                    <span className={`level-badge ${getLevelColor(course.level)}`}>
                      {course.level}
                    </span>
                  </div>
                </div>

                <div className="course-content">
                  <h3 className="course-title">{course.title}</h3>
                  <p className="course-description">{course.description}</p>
                  
                  <div className="course-meta">
                    <div className="meta-item">
                      <Icon name="clock" size={IconSizes.xs} color={IconColors.muted} />
                      <span>{course.duration}</span>
                    </div>
                    <div className="meta-item">
                      <Icon name="folder" size={IconSizes.xs} color={IconColors.muted} />
                      <span>{course.category}</span>
                    </div>
                    <div className="meta-item">
                      <Icon name="globe" size={IconSizes.xs} color={IconColors.muted} />
                      <span>{course.language}</span>
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
                        <span className="tag-more">+{course.tags.length - 3}</span>
                      )}
                    </div>
                  )}
                </div>

                <div className="course-actions">
                  {course.status === 'draft' && (
                    <button
                      onClick={() => handlePublish(course._id)}
                      className="btn btn-success btn-sm"
                      title="Publier le cours"
                    >
                      <Icon name="checkCircle" size={IconSizes.xs} color={IconColors.white} />
                      Publier
                    </button>
                  )}
                  
                  <button
                    onClick={() => handleEdit(course._id)}
                    className="btn btn-secondary btn-sm"
                    title="Modifier le cours"
                  >
                    <Icon name="edit" size={IconSizes.xs} color={IconColors.white} />
                    Modifier
                  </button>
                  
                  <button
                    onClick={() => handleDelete(course._id)}
                    className="btn btn-danger btn-sm"
                    title="Supprimer le cours"
                  >
                    <Icon name="trash" size={IconSizes.xs} color={IconColors.white} />
                    Supprimer
                  </button>
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
