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
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [deleteConfirm, setDeleteConfirm] = useState({ show: false, courseId: null, courseTitle: '' });
  const [publishConfirm, setPublishConfirm] = useState({ show: false, courseId: null, courseTitle: '' });
  const [actionLoading, setActionLoading] = useState({ publish: null, delete: null });
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [styledError, setStyledError] = useState({ show: false, message: '', details: '', type: '' });

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
      setError(''); // Réinitialiser les erreurs
      
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
      

      

      
      setCourses(coursesData);
    } catch (error) {
      console.error('Erreur lors de la récupération des cours:', error);
      
      // Gestion des erreurs de validation
      if (error.response?.data?.errors) {
        const validationErrors = error.response.data.errors.join(', ');
        setError(`Erreurs de validation: ${validationErrors}`);
      } else if (error.response?.data?.message) {
        setError(error.response.data.message);
      } else {
        setError('Erreur lors de la récupération des cours. Veuillez réessayer.');
      }
      
      setCourses([]); // S'assurer que courses est un tableau vide en cas d'erreur
    } finally {
      setLoading(false);
    }
  };

  const handlePublish = async (courseId) => {
    try {
      setActionLoading(prev => ({ ...prev, publish: courseId }));
      
      console.log('🚀 Tentative de publication du cours:', courseId);
      const response = await coursesAPI.publish(courseId);
      
      if (response.data.success) {
        console.log('✅ Cours publié avec succès:', response.data.message);
        
        // Afficher un message de succès temporaire
        setSuccess(response.data.message);
        setTimeout(() => setSuccess(''), 5000);
        
        // Fermer le modal de confirmation
        hidePublishConfirm();
        
        // Recharger la liste des cours
        fetchCourses();
      } else {
        console.error('❌ Erreur lors de la publication:', response.data.message);
        setError(response.data.message || 'Erreur lors de la publication');
        setTimeout(() => setError(''), 5000);
      }
    } catch (error) {
      console.error('❌ Erreur lors de la publication:', error);
      
      // Gestion des erreurs spécifiques avec messages stylés
      if (error.response?.data?.requiresModules) {
        setStyledError({
          show: true,
          message: 'Publication du cours impossible',
          details: 'Ce cours ne contient aucun module. Vous devez ajouter du contenu avant de pouvoir le publier.',
          type: 'modules'
        });
        // Fermer le modal de confirmation
        hidePublishConfirm();
      } else if (error.response?.data?.requiresContent) {
        setStyledError({
          show: true,
          message: 'Publication du cours impossible',
          details: 'Vos modules sont vides. Ajoutez des leçons à vos modules avant la publication.',
          type: 'content'
        });
        // Fermer le modal de confirmation
        hidePublishConfirm();
      } else if (error.response?.data?.errors) {
        const validationErrors = error.response.data.errors.join(', ');
        setStyledError({
          show: true,
          message: 'Erreurs de validation',
          details: validationErrors,
          type: 'validation'
        });
        // Fermer le modal de confirmation
        hidePublishConfirm();
      } else if (error.response?.data?.message) {
        setStyledError({
          show: true,
          message: 'Erreur lors de la publication',
          details: error.response.data.message,
          type: 'general'
        });
        // Fermer le modal de confirmation
        hidePublishConfirm();
      } else {
        setStyledError({
          show: true,
          message: 'Erreur lors de la publication',
          details: 'Une erreur inattendue s\'est produite. Veuillez réessayer.',
          type: 'general'
        });
        // Fermer le modal de confirmation
        hidePublishConfirm();
      }
    } finally {
      setActionLoading(prev => ({ ...prev, publish: null }));
    }
  };

  const confirmPublish = async () => {
    if (publishConfirm.courseId) {
      await handlePublish(publishConfirm.courseId);
    }
  };

  const showDeleteConfirm = (courseId, courseTitle) => {
    setDeleteConfirm({ show: true, courseId, courseTitle });
  };

  const hideDeleteConfirm = () => {
    setDeleteConfirm({ show: false, courseId: null, courseTitle: '' });
  };

  const showPublishConfirm = (courseId, courseTitle) => {
    setPublishConfirm({ show: true, courseId, courseTitle });
  };

  const hidePublishConfirm = () => {
    setPublishConfirm({ show: false, courseId: null, courseTitle: '' });
  };

  const hideStyledError = () => {
    setStyledError({ show: false, message: '', details: '', type: '' });
  };

  const confirmDelete = async () => {
    try {
      setActionLoading(prev => ({ ...prev, delete: deleteConfirm.courseId }));
      
      const response = await coursesAPI.delete(deleteConfirm.courseId);
      
      if (response.data.success) {
        setSuccess('Cours supprimé avec succès');
        setTimeout(() => setSuccess(''), 5000);
        hideDeleteConfirm();
        fetchCourses(); // Recharger la liste
      } else {
        setError(response.data.message || 'Erreur lors de la suppression');
        setTimeout(() => setError(''), 5000);
      }
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      
      // Gestion des erreurs de validation
      if (error.response?.data?.errors) {
        const validationErrors = error.response.data.errors.join(', ');
        setError(`Erreurs de validation: ${validationErrors}`);
      } else if (error.response?.data?.message) {
        setError(error.response.data.message);
      } else {
        setError('Erreur lors de la suppression du cours. Veuillez réessayer.');
      }
      
      setTimeout(() => setError(''), 5000);
    } finally {
      setActionLoading(prev => ({ ...prev, delete: null }));
    }
  };

  const handleEdit = (courseId) => {
    console.log('🔍 handleEdit appelé avec courseId:', courseId);
    console.log('🔍 Navigation vers:', `/tutor/edit-course/${courseId}`);
    navigate(`/tutor/edit-course/${courseId}`);
  };

  const handleAddModules = (courseId) => {
    console.log('🚀 Navigation vers la gestion des modules du cours:', courseId);
    navigate(`/tutor/manage-modules/${courseId}`);
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

        {/* Messages de succès et d'erreur */}
        {success && (
          <div className="alert alert-success">
            <Icon name="checkCircle" size={IconSizes.sm} color={IconColors.white} />
            {success}
          </div>
        )}

        {error && (
          <div className="alert alert-error">
            <Icon name="error" size={IconSizes.sm} color={IconColors.white} />
            {error}
          </div>
        )}

        {/* Contenu principal */}
        {loading ? (
          <div className="loading-state">
            <Icon name="loader" size={IconSizes.xl} color={IconColors.primary} className="spin" />
            <p>Chargement de vos cours...</p>
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
                    
                    {/* Indicateur pour les cours vides */}
                    {course.status === 'draft' && (!course.modules || course.modules.length === 0) && (
                      <span className="status-badge status-warning" title="Ce cours ne peut pas être publié sans modules">
                        <Icon name="AlertTriangle" size={IconSizes.xs} color={IconColors.white} />
                        Contenu requis
                      </span>
                    )}
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
                    {course.moduleCount > 0 && (
                      <div className="meta-item">
                        <Icon name="fileText" size={IconSizes.xs} color={IconColors.muted} />
                        <span>{course.moduleCount} modules</span>
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
                    <>
                      {/* Bouton de publication */}
                      <button
                        onClick={() => showPublishConfirm(course._id, course.title)}
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
                      

                    </>
                  )}
                  
                  {/* Bouton Modules - TOUJOURS visible */}
                  <button
                    onClick={() => handleAddModules(course._id)}
                    className="btn btn-primary"
                    title="Gérer les modules du cours"
                  >
                    <Icon name="layers" size={IconSizes.xs} color={IconColors.white} />
                    Modules {course.moduleCount > 0 && `(${course.moduleCount})`}
                  </button>
                  

                  
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleEdit(course._id);
                    }}
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
              <Icon name="AlertTriangle" size={IconSizes.lg} color={IconColors.error} />
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

      {/* Modal de confirmation de publication */}
      {publishConfirm.show && (
        <div className="modal-overlay" onClick={hidePublishConfirm}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <Icon name="checkCircle" size={IconSizes.lg} color={IconColors.success} />
              <h3>Confirmation de publication</h3>
            </div>
            <div className="modal-body">
              <p>
                Publier le cours <strong>"{publishConfirm.courseTitle}"</strong> ?
              </p>
              <p className="info-text">
                Après publication, le cours sera visible et accessible à l’inscription.
              </p>
              <div className="publication-checklist">
                <h4>À vérifier :</h4>
                <ul>
                  <li> Le cours contient au moins un module</li>
                  <li> Chaque module contient au moins une leçon</li>
                  <li> Les descriptions sont complètes et adaptées au contexte professionnel</li>
                  <li> Le niveau et la catégorie correspondent aux besoins de l'entreprise</li>
                </ul>
              </div>
            </div>
            <div className="modal-actions">
              <button
                onClick={hidePublishConfirm}
                className="btn btn-secondary"
                disabled={actionLoading.publish === publishConfirm.courseId}
              >
                Annuler
              </button>
              <button
                onClick={confirmPublish}
                className="btn btn-success"
                disabled={actionLoading.publish === publishConfirm.courseId}
              >
                {actionLoading.publish === publishConfirm.courseId ? (
                  <>
                    <Icon name="loader" size={IconSizes.xs} color={IconColors.white} className="spin" />
                    Publication...
                  </>
                ) : (
                  <>
                    <Icon name="checkCircle" size={IconSizes.xs} color={IconColors.white} />
                    Publier le cours
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal d'erreur stylé */}
      {styledError.show && (
        <div className="modal-overlay" onClick={hideStyledError}>
          <div className="modal-content error-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header error-header">
              <Icon name="AlertTriangle" size={IconSizes.lg} color={IconColors.error} />
              <h3>{styledError.message}</h3>
            </div>
            <div className="modal-body">
              <p className="error-details">{styledError.details}</p>
              
              {styledError.type === 'modules' && (
                <div className="error-solution">
                  <h4>🚀 Comment résoudre ce problème :</h4>
                  <div className="solution-steps">
                    <div className="step">
                      <span className="step-number">1</span>
                      <div className="step-content">
                        <h5>Créer des modules</h5>
                        <p>Ajoutez au moins un module à votre cours pour organiser le contenu de formation professionnelle.</p>
                      </div>
                    </div>
                    <div className="step">
                      <span className="step-number">2</span>
                      <div className="step-content">
                        <h5>Ajouter des leçons</h5>
                        <p>Remplissez chaque module avec des leçons et du contenu professionnel adapté au travail en entreprise.</p>
                      </div>
                    </div>
                    <div className="step">
                      <span className="step-number">3</span>
                      <div className="step-content">
                        <h5>Vérifier la qualité</h5>
                        <p>Assurez-vous que le contenu est complet, professionnel et adapté au contexte de l'entreprise avant publication.</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {styledError.type === 'content' && (
                <div className="error-solution">
                  <h4>📚 Comment enrichir votre contenu :</h4>
                  <div className="solution-steps">
                    <div className="step">
                      <span className="step-number">1</span>
                      <div className="step-content">
                        <h5>Remplir les modules</h5>
                        <p>Ajoutez des leçons, vidéos, documents ou quiz professionnels à vos modules existants.</p>
                      </div>
                    </div>
                    <div className="step">
                      <span className="step-number">2</span>
                      <div className="step-content">
                        <h5>Structurer le contenu</h5>
                        <p>Organisez votre contenu de manière logique et progressive, adapté aux besoins de formation en entreprise.</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className="modal-actions">
              <button
                onClick={hideStyledError}
                className="btn btn-primary"
              >
                <Icon name="checkCircle" size={IconSizes.xs} color={IconColors.white} />
                Compris
              </button>
              {styledError.type === 'modules' && (
                <button
                  onClick={() => {
                    hideStyledError();
                    // Ici vous pouvez ajouter la logique pour rediriger vers la page d'ajout de modules
                    console.log('Redirection vers ajout de modules...');
                  }}
                  className="btn btn-success"
                >
                  <Icon name="layers" size={IconSizes.xs} color={IconColors.white} />
                  Modules
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyCourses;
