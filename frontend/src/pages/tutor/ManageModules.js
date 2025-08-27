import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { modulesAPI } from '../../services/api';
import { Icon, IconSizes, IconColors } from '../../components/common/IconTheme';
import ConfirmModal from '../../components/common/ConfirmModal';
import './CreateCourse.css';

const ManageModules = () => {
  const { user, addNotification } = useAuth();
  const navigate = useNavigate();
  const { courseId } = useParams();
  
  const [modules, setModules] = useState([]);
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [confirmState, setConfirmState] = useState({ open: false, moduleId: null });

  // Pagination state (server-side style)
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [q, setQ] = useState('');

  useEffect(() => {
    // Vérifier que l'utilisateur est un tuteur
    if (!user) {
      navigate('/login');
      return;
    }
    
    if (user.role !== 'tuteur') {
      navigate('/dashboard');
      return;
    }
    
    // Charger les données du cours et des modules
    loadCourseAndModules();
  }, [user, navigate, courseId, page, limit, q]);

  useEffect(() => {
    setPage(1);
  }, [courseId, q]);

  const loadCourseAndModules = async () => {
    try {
      setLoading(true);
      
      // Charger le cours (métadonnées)
      const courseResponse = await fetch(`http://localhost:5000/api/courses/${courseId}`);
      if (courseResponse.ok) {
        const courseData = await courseResponse.json();
        if (courseData.success) {
          setCourse(courseData.data);
        }
      }
      
      // Charger les modules (paginés)
      const modulesResponse = await modulesAPI.getByCourse(courseId, { page, limit, q: q || undefined });
      if (modulesResponse.data.success) {
        setModules(modulesResponse.data.data);
        setTotal(modulesResponse.data.total ?? modulesResponse.data.data.length);
        setPages(modulesResponse.data.pages ?? 1);
        setLimit(modulesResponse.data.limit ?? limit);
      }
    } catch (error) {
      console.error('Erreur chargement données:', error);
      setError('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteModule = async (moduleId) => {
    setConfirmState({ open: true, moduleId });
  };

  const confirmDelete = async () => {
    const moduleId = confirmState.moduleId;
    setConfirmState({ open: false, moduleId: null });
    try {
      const response = await modulesAPI.delete(moduleId);
      if (response.data.success) {
        addNotification('Module supprimé avec succès', 'success');
        // Recharger les modules
        await loadCourseAndModules();
      }
    } catch (error) {
      console.error('Erreur suppression module:', error);
      addNotification('La suppression du module a échoué. Veuillez réessayer.', 'error');
    }
  };

  const handleEditModule = (moduleId) => {
    navigate(`/tutor/edit-module/${moduleId}`);
  };

  const handleCreateModule = () => {
    navigate(`/tutor/create-module/${courseId}`);
  };

  const handleManageLessons = (moduleId) => {
    navigate(`/tutor/manage-lessons/${moduleId}`);
  };

  const goToPage = (p) => {
    if (p < 1 || p > pages) return;
    setPage(p);
  };

  if (!user || user.role !== 'tuteur') {
    return (
      <div className="create-course-page">
        <div className="access-denied">
          <Icon name="lock" size={IconSizes.xl} color={IconColors.error} />
          <h2>Accès refusé</h2>
          <p>Seuls les tuteurs peuvent gérer les modules.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="create-course-page">
      <div className="create-course-container">
        <ConfirmModal
          open={confirmState.open}
          title="Supprimer le module"
          message="Confirmez-vous la suppression de ce module ? Cette action est irréversible."
          confirmLabel="Supprimer"
          destructive
          onConfirm={confirmDelete}
          onCancel={() => setConfirmState({ open: false, moduleId: null })}
        />
        
        <div className="create-course-header">
          <h1>
            <Icon name="layers" size={IconSizes.lg} color={IconColors.primary} />
            Gestion des modules {loading && <Icon name="loader" size={IconSizes.sm} color={IconColors.muted} className="spin" />}
          </h1>
          <p>Cours : {course?.title || '...'}</p>
        </div>

        {error && (
          <div className="alert alert-error">
            <Icon name="error" size={IconSizes.sm} color={IconColors.white} />
            {error}
          </div>
        )}

        {/* En-tête avec statistiques */}
        <div className="modules-overview">
          <div className="overview-stats">
            <div className="stat-card">
              <Icon name="layers" size={IconSizes.lg} color={IconColors.primary} />
              <div className="stat-content">
                <span className="stat-number">{total}</span>
                <span className="stat-label">Modules</span>
              </div>
            </div>
            
            <div className="stat-card">
              <Icon name="book" size={IconSizes.lg} color={IconColors.success} />
              <div className="stat-content">
                <span className="stat-number">
                  {modules.reduce((total, module) => total + (module.lessons?.length || 0), 0)}
                </span>
                <span className="stat-label">Leçons totales</span>
              </div>
            </div>
            
            <div className="stat-card">
              <Icon name="globe" size={IconSizes.lg} color={IconColors.warning} />
              <div className="stat-content">
                <span className="stat-number">
                  {modules.filter(m => m.isPublished).length}
                </span>
                <span className="stat-label">Publiés</span>
              </div>
            </div>
          </div>
          
          <div className="overview-actions">
            <button
              onClick={handleCreateModule}
              className="btn btn-primary btn-lg"
            >
              <Icon name="plus" size={IconSizes.md} color={IconColors.white} />
              Nouveau module
            </button>
            
            <button
              onClick={() => navigate(`/tutor/edit-course/${courseId}`)}
              className="btn btn-outline"
            >
              <Icon name="arrowLeft" size={IconSizes.sm} color={IconColors.muted} />
              Retour au cours
            </button>
          </div>
        </div>

        {/* Liste des modules */}
        <div className="modules-list">
          <h3>
            <Icon name="list" size={IconSizes.md} color={IconColors.primary} />
            Modules du cours ({modules.length})
          </h3>
          <div className="search-box" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
            <Icon name="search" size={IconSizes.sm} color={IconColors.muted} />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="search-input"
              placeholder="Rechercher dans les modules..."
              style={{ flex: 1, minWidth: 0 }}
            />
          </div>
          
          {modules.length === 0 ? (
            <div className="empty-state">
              {loading ? (
                <>
                  <Icon name="loader" size={IconSizes.lg} color={IconColors.muted} className="spin" />
                  <p>Chargement...</p>
                </>
              ) : (
                <>
                  <Icon name="layers" size={IconSizes.xl} color={IconColors.muted} />
                  <p>Aucun module créé pour ce cours</p>
                  <small>Commencez par créer votre premier module</small>
                </>
              )}
            </div>
          ) : (
            <div className="modules-grid">
              {modules
                .slice()
                .sort((a, b) => a.order - b.order)
                .map((module) => (
                  <div key={module._id} className="module-card">
                    <div className="module-header">
                      <div className="module-order">
                        <Icon name="hash" size={IconSizes.sm} color={IconColors.primary} />
                        {module.order}
                      </div>
                      <div className="module-status">
                        {module.isPublished ? (
                          <span className="status published">
                            <Icon name="globe" size={IconSizes.xs} color={IconColors.success} />
                            Publié
                          </span>
                        ) : (
                          <span className="status draft">
                            <Icon name="edit" size={IconSizes.xs} color={IconColors.muted} />
                            Brouillon
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="module-content">
                      <h4 className="module-title">{module.title}</h4>
                      <p className="module-description">{module.description}</p>
                      
                      <div className="module-stats">
                        <span className="stat">
                          <Icon name="clock" size={IconSizes.xs} color={IconColors.muted} />
                          {module.estimatedDuration || 'Non définie'}
                        </span>
                        <span className="stat">
                          <Icon name="book" size={IconSizes.xs} color={IconColors.muted} />
                          {module.lessons?.length || 0} leçon(s)
                        </span>
                      </div>
                    </div>
                    
                    <div className="module-actions">
                      <button className="action-card lessons-card" onClick={() => handleManageLessons(module._id)}>
                        <Icon name="book" size={IconSizes.sm} color={IconColors.white} />
                        Leçons
                      </button>
                      
                      <button className="action-card edit-card" onClick={() => handleEditModule(module._id)}>
                        <Icon name="edit" size={IconSizes.sm} color={IconColors.white} />
                        Modifier
                      </button>
                      
                      <button className="action-card delete-card" onClick={() => handleDeleteModule(module._id)}>
                        <Icon name="trash" size={IconSizes.sm} color={IconColors.white} />
                        Supprimer
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>

        {/* Pagination controls */}
        {total > 0 && (
          <div className="pagination-controls compact">
            <button className="pagination-btn outline" onClick={() => goToPage(page - 1)} disabled={page === 1}>‹</button>
            {[...Array(pages)].map((_, idx) => (
              <button
                key={idx}
                className={`pagination-btn ${page === idx + 1 ? 'active' : ''}`}
                onClick={() => goToPage(idx + 1)}
              >
                {idx + 1}
              </button>
            ))}
            <button className="pagination-btn outline" onClick={() => goToPage(page + 1)} disabled={page === pages}>›</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ManageModules;

