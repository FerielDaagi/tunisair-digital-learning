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
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [deleteConfirm, setDeleteConfirm] = useState({ show: false, courseId: null, courseTitle: '' });
  const [actionLoading, setActionLoading] = useState({ publish: null, delete: null });

  useEffect(() => {
    // Vérifier que l'utilisateur est un tuteur
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
      
      // S'assurer que courses est un tableau
      let coursesData = [];
      if (response && response.data) {
        // Si response.data est un tableau, l'utiliser directement
        if (Array.isArray(response.data)) {
          coursesData = response.data;
        }
        // Si response.data.data est un tableau (structure imbriquée)
        else if (response.data.data && Array.isArray(response.data.data)) {
          coursesData = response.data.data;
        }
        // Si response.data est un objet avec une propriété courses
        else if (response.data.courses && Array.isArray(response.data.courses)) {
          coursesData = response.data.courses;
        }
      }
      
      console.log('Données reçues de l\'API:', response);
      console.log('Cours extraits:', coursesData);
      
      setCourses(coursesData);
    } catch (error) {
      console.error('Erreur lors de la récupération des cours:', error);
      setError('Erreur lors de la récupération de vos cours');
      setCourses([]); // S'assurer que courses est un tableau vide en cas d'erreur
    } finally {
      setLoading(false);
    }
  };

  const handlePublish = async (courseId) => {
    try {
      setActionLoading(prev => ({ ...prev, publish: courseId }));
      setError('');
      setSuccess('');
      
      await coursesAPI.publish(courseId);
      setSuccess('Cours publié avec succès !');
      fetchCourses(); // Recharger la liste
    } catch (error) {
      console.error('Erreur lors de la publication:', error);
      const errorMessage = error.response?.data?.message || 'Erreur lors de la publication du cours';
      setError(errorMessage);
    } finally {
      setActionLoading(prev => ({ ...prev, publish: null }));
    }
  };

  const showDeleteConfirm = (courseId, courseTitle) => {
    setDeleteConfirm({ show: true, courseId, courseTitle });
  };

  const hideDeleteConfirm = () => {
    setDeleteConfirm({ show: false, courseId: null, courseTitle: '' });
  };

  const confirmDelete = async () => {
    try {
      setActionLoading(prev => ({ ...prev, delete: deleteConfirm.courseId }));
      setError('');
      setSuccess('');
      
      await coursesAPI.delete(deleteConfirm.courseId);
      setSuccess('Cours supprimé avec succès !');
      hideDeleteConfirm();
      fetchCourses(); // Recharger la liste
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      const errorMessage = error.response?.data?.message || 'Erreur lors de la suppression du cours';
      setError(errorMessage);
    } finally {
      setActionLoading(prev => ({ ...prev, delete: null }));
    }
  };

  const handleEdit = (courseId) => {
    // TODO: Implémenter la navigation vers la page d'édition
    console.log('Éditer le cours:', courseId);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'published': return 'status-published';
      case 'draft': return 'status-draft';
      case 'archived': return 'status-archived';
      default: return 'status-draft';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'published': return 'checkCircle';
      case 'draft': return 'edit';
      case 'archived': return 'archive';
      default: return 'edit';
    }
  };

  const getLevelColor = (level) => {
    switch (level) {
      case 'débutant': return 'level-beginner';
      case 'intermédiaire': return 'level-intermediate';
      case 'avancé': return 'level-advanced';
      default: return 'level-beginner';
    }
  };

  const getLevelIcon = (level) => {
    switch (level) {
      case 'débutant': return 'trendingUp';
      case 'intermédiaire': return 'target';
      case 'avancé': return 'star';
      default: return 'trendingUp';
    }
  };

  const filteredCourses = () => {
    // S'assurer que courses est un tableau
    if (!Array.isArray(courses)) {
      console.warn('courses n\'est pas un tableau dans filteredCourses:', courses);
      return [];
    }
    
    return courses.filter(course => {
      const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           course.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || course.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  };

  const getStats = () => {
    // S'assurer que courses est un tableau
    if (!Array.isArray(courses)) {
      console.warn('courses n\'est pas un tableau:', courses);
      return { total: 0, published: 0, draft: 0, archived: 0 };
    }
    
    const total = courses.length;
    const published = courses.filter(c => c.status === 'published').length;
    const draft = courses.filter(c => c.status === 'draft').length;
    const archived = courses.filter(c => c.status === 'archived').length;
    
    return { total, published, draft, archived };
  };

  const stats = getStats();

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
        {/* En-tête de la page */}
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
            className="create-course-btn"
          >
            <Icon name="plus" size={IconSizes.sm} color={IconColors.white} />
            Créer un cours
          </button>
        </div>

        {/* Grille de statistiques */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon total">
              <Icon name="bookOpen" size={IconSizes.md} color={IconColors.primary} />
            </div>
            <div className="stat-content">
              <h3>{stats.total}</h3>
              <p>Total des cours</p>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon published">
              <Icon name="checkCircle" size={IconSizes.md} color={IconColors.success} />
            </div>
            <div className="stat-content">
              <h3>{stats.published}</h3>
              <p>Cours publiés</p>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon draft">
              <Icon name="edit" size={IconSizes.md} color={IconColors.warning} />
            </div>
            <div className="stat-content">
              <h3>{stats.draft}</h3>
              <p>Brouillons</p>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon archived">
              <Icon name="archive" size={IconSizes.md} color={IconColors.muted} />
            </div>
            <div className="stat-content">
              <h3>{stats.archived}</h3>
              <p>Archivés</p>
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
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="filter-select"
          >
            <option value="all">Tous les statuts</option>
            <option value="published">Publiés</option>
            <option value="draft">Brouillons</option>
            <option value="archived">Archivés</option>
          </select>
        </div>

        {/* Messages d'état */}
        {error && (
          <div className="alert alert-error">
            <Icon name="error" size={IconSizes.sm} color={IconColors.white} />
            {error}
            <button 
              onClick={() => setError('')} 
              className="alert-close"
              title="Fermer"
            >
              ×
            </button>
          </div>
        )}

        {success && (
          <div className="alert alert-success">
            <Icon name="checkCircle" size={IconSizes.sm} color={IconColors.white} />
            {success}
            <button 
              onClick={() => setSuccess('')} 
              className="alert-close"
              title="Fermer"
            >
              ×
            </button>
          </div>
        )}

        {/* Contenu principal */}
        {loading ? (
          <div className="loading-state">
            <Icon name="loader" size={IconSizes.xl} color={IconColors.primary} className="spin" />
            <p>Chargement de vos cours...</p>
          </div>
        ) : error ? (
          <div className="error-state">
            <Icon name="error" size={IconSizes.xl} color={IconColors.error} />
            <h3>Erreur de chargement</h3>
            <p>{error}</p>
            <button onClick={fetchCourses} className="btn btn-primary">
              <Icon name="refresh" size={IconSizes.sm} color={IconColors.white} />
              Réessayer
            </button>
          </div>
        ) : filteredCourses().length === 0 ? (
          <div className="empty-state">
            <Icon name="bookOpen" size={IconSizes.xl} color={IconColors.muted} />
            <h3>Aucun cours trouvé</h3>
            <p>
              {searchTerm || statusFilter !== 'all' 
                ? 'Aucun cours ne correspond à vos critères de recherche.'
                : 'Vous n\'avez pas encore créé de cours. Commencez par en créer un !'
              }
            </p>
            {!searchTerm && statusFilter === 'all' && (
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
            {filteredCourses().map(course => (
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
                      <Icon name={getLevelIcon(course.level)} size={IconSizes.xs} color={IconColors.white} />
                      {course.level}
                    </span>
                  </div>
                </div>
                
                <div className="course-content">
                  <h3 className="course-title">{course.title}</h3>
                  <p className="course-description">{course.description}</p>
                  
                  <div className="course-meta">
                    <div className="meta-item">
                      <Icon name="folder" size={IconSizes.xs} color={IconColors.muted} />
                      <span>{course.category}</span>
                    </div>
                    <div className="meta-item">
                      <Icon name="globe" size={IconSizes.xs} color={IconColors.muted} />
                      <span>{course.language}</span>
                    </div>
                    {course.duration && (
                      <div className="meta-item">
                        <Icon name="clock" size={IconSizes.xs} color={IconColors.muted} />
                        <span>{course.duration}</span>
                      </div>
                    )}
                  </div>
                  
                  {course.tags && course.tags.length > 0 && (
                    <div className="course-tags">
                      {course.tags.slice(0, 3).map((tag, index) => (
                        <span key={index} className="tag">
                          <Icon name="hash" size={IconSizes.xs} color={IconColors.muted} />
                          {tag}
                        </span>
                      ))}
                      {course.tags.length > 3 && (
                        <span className="tag-more">
                          +{course.tags.length - 3} autres
                        </span>
                      )}
                    </div>
                  )}
                </div>
                
                <div className="course-actions">
                  {course.status === 'draft' && (
                    <button
                      onClick={() => handlePublish(course._id)}
                      className="btn btn-success"
                      title="Publier le cours"
                      disabled={actionLoading.publish === course._id}
                    >
                      {actionLoading.publish === course._id ? (
                        <Icon name="loader" size={IconSizes.xs} color={IconColors.white} className="spin" />
                      ) : (
                        <Icon name="checkCircle" size={IconSizes.xs} color={IconColors.white} />
                      )}
                      {actionLoading.publish === course._id ? 'Publication...' : 'Publier'}
                    </button>
                  )}
                  
                  <button
                    onClick={() => handleEdit(course._id)}
                    className="btn btn-secondary"
                    title="Modifier le cours"
                  >
                    <Icon name="edit" size={IconSizes.xs} color={IconColors.white} />
                    Modifier
                  </button>
                  
                  <button
                    onClick={() => showDeleteConfirm(course._id, course.title)}
                    className="btn btn-danger"
                    title="Supprimer le cours"
                    disabled={actionLoading.delete === course._id}
                  >
                    {actionLoading.delete === course._id ? (
                      <Icon name="loader" size={IconSizes.xs} color={IconColors.white} className="spin" />
                    ) : (
                      <Icon name="trash" size={IconSizes.xs} color={IconColors.white} />
                    )}
                    {actionLoading.delete === course._id ? 'Suppression...' : 'Supprimer'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal de confirmation de suppression */}
      {deleteConfirm.show && (
        <div className="modal-overlay" onClick={hideDeleteConfirm}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <Icon name="alertTriangle" size={IconSizes.lg} color={IconColors.error} />
              <h3>Confirmer la suppression</h3>
            </div>
            <div className="modal-body">
              <p>
                Êtes-vous sûr de vouloir supprimer le cours <strong>"{deleteConfirm.courseTitle}"</strong> ?
              </p>
              <p className="warning-text">
                Cette action est irréversible et supprimera définitivement le cours et tout son contenu.
              </p>
            </div>
            <div className="modal-actions">
              <button
                onClick={hideDeleteConfirm}
                className="btn btn-secondary"
                disabled={actionLoading.delete === deleteConfirm.courseId}
              >
                Annuler
              </button>
              <button
                onClick={confirmDelete}
                className="btn btn-danger"
                disabled={actionLoading.delete === deleteConfirm.courseId}
              >
                {actionLoading.delete === deleteConfirm.courseId ? (
                  <>
                    <Icon name="loader" size={IconSizes.xs} color={IconColors.white} className="spin" />
                    Suppression...
                  </>
                ) : (
                  <>
                    <Icon name="trash" size={IconSizes.xs} color={IconColors.white} />
                    Supprimer définitivement
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyCourses;
