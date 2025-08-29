import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { modulesAPI } from '../../services/api';
import { Icon, IconSizes, IconColors } from '../../components/common/IconTheme';
import ConfirmModal from '../../components/common/ConfirmModal';

import './ManageModules.css';

const ManageModules = () => {
  const { user, addNotification } = useAuth();
  const navigate = useNavigate();
  const { courseId } = useParams();
  
  const [modules, setModules] = useState([]);
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');


  // Pagination state (server-side style)
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [q, setQ] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [moduleToDelete, setModuleToDelete] = useState(null);

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



  const handleCreateModule = () => {
    navigate(`/tutor/create-module/${courseId}`);
  };

  const handleManageLessons = (moduleId) => {
    navigate(`/tutor/manage-lessons/${moduleId}`);
  };

  const handleEditModule = (moduleId) => {
    navigate(`/tutor/edit-module/${moduleId}`);
  };

  const handleDeleteModule = (moduleId) => {
    const module = modules.find(m => m._id === moduleId);
    setModuleToDelete(module);
    setShowDeleteModal(true);
  };

  const confirmDeleteModule = async () => {
    if (!moduleToDelete) return;
    
    try {
      const response = await modulesAPI.delete(moduleToDelete._id);
      if (response.data.success) {
        addNotification('Module supprimé avec succès', 'success');
        
        // Réorganiser automatiquement l'ordre des modules restants
        const remainingModules = modules.filter(m => m._id !== moduleToDelete._id);
        const reorderedModules = remainingModules.map((module, index) => ({
          ...module,
          order: index + 1
        }));
        
        // Mettre à jour l'ordre de tous les modules restants
        for (const module of reorderedModules) {
          try {
            await modulesAPI.update(module._id, { order: module.order });
          } catch (error) {
            console.error(`Erreur mise à jour ordre module ${module._id}:`, error);
          }
        }
        
        await loadCourseAndModules();
      }
    } catch (error) {
      console.error('Erreur suppression module:', error);
      addNotification('La suppression du module a échoué. Veuillez réessayer.', 'error');
    } finally {
      setShowDeleteModal(false);
      setModuleToDelete(null);
    }
  };

  const handleTogglePublish = async (moduleId) => {
    try {
      const response = await modulesAPI.togglePublish(moduleId);
      if (response.data.success) {
        addNotification(response.data.message, 'success');
        await loadCourseAndModules();
      }
    } catch (error) {
      console.error('Erreur toggle publication:', error);
      addNotification('Le changement de statut a échoué. Veuillez réessayer.', 'error');
    }
  };



  const goToPage = (p) => {
    if (p < 1 || p > pages) return;
    setPage(p);
  };

  if (!user || user.role !== 'tuteur') {
    return (
      <div className="create-course-page">
        <div className="access-denied">
                          <Icon name="lock" size={IconSizes.xl} color={IconColors.danger} />
          <h2>Accès refusé</h2>
          <p>Seuls les tuteurs peuvent gérer les modules.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="create-course-page">
      <div className="create-course-container">

        
        {/* Page header - align with Courses header design */}
        <div className="page-header">
          <div className="header-content">
            <h1>
              <Icon name="layers" size={IconSizes.lg} color={IconColors.primary} />
              Modules du cours
              {loading && <Icon name="loader" size={IconSizes.sm} color={IconColors.gray} className="spin" />}
            </h1>
            <p>{course?.title ? `Cours : ${course.title}` : 'Chargement du cours...'}</p>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={() => navigate(`/tutor/edit-course/${courseId}`)}
              className="btn btn-outline"
            >
              <Icon name="arrowLeft" size={IconSizes.sm} color={IconColors.gray} />
              Retour au cours
            </button>
            <button
              onClick={handleCreateModule}
              className="create-course-btn"
            >
              <Icon name="plus" size={IconSizes.sm} color={IconColors.white} />
              Nouveau module
            </button>
          </div>
        </div>

        {error && (
          <div className="alert alert-error">
                            <Icon name="error" size={IconSizes.sm} color={IconColors.danger} />
            {error}
          </div>
        )}

        {/* En-tête avec statistiques */}
        <div className="modules-overview">
          <div className="overview-stats">
            <div className="stat-card">
              <Icon name="layers" size={IconSizes.lg} color={IconColors.primary} />
              <div className="stat-content">
                <span className="stat-number">{modules.length}</span>
                <span className="stat-label">Modules</span>
              </div>
            </div>
            
            <div className="stat-card">
                                          <Icon name="book" size={IconSizes.lg} color={IconColors.white} />
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
          
          <div className="overview-actions" />
        </div>

        {/* Liste des modules */}
        <div className="modules-list">
          <h3>
            <Icon name="list" size={IconSizes.md} color={IconColors.primary} />
            Modules du cours ({modules.length})
          </h3>
          <div className="search-box" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                            <Icon name="search" size={IconSizes.sm} color={IconColors.gray} />
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
                  <Icon name="loader" size={IconSizes.lg} color={IconColors.gray} className="spin" />
                  <p>Chargement...</p>
                </>
              ) : (
                <>
                  <Icon name="layers" size={IconSizes.xl} color={IconColors.gray} />
                  <p>Aucun module créé pour ce cours</p>
                  <small>Commencez par créer votre premier module</small>
                </>
              )}
            </div>
          ) : (
            <div className="unique-modules-container" style={{ 
              display: 'flex !important', 
              flexWrap: 'wrap !important', 
              gap: '1.5rem !important',
              width: '100% !important'
            }}>
              {modules
                .slice()
                .sort((a, b) => a.order - b.order)
                .map((module) => (
                  <div key={module._id} className="unique-module-item" style={{ 
                    width: '400px !important', 
                    flex: '0 0 400px !important',
                    maxWidth: '400px !important',
                    minWidth: '400px !important'
                  }}>
                    <div className="module-accent" />
                    <div className="module-inner">
                      <div className="module-header">
                        <div className="module-order">
                          <Icon name="hash" size={IconSizes.sm} color={IconColors.primary} />
                          {module.order}
                        </div>
                        <div className="module-status">
                          {module.isPublished ? (
                            <span className="status published">
                              <Icon name="globe" size={IconSizes.xs} color={IconColors.primary} />
                              Publié
                            </span>
                          ) : (
                            <span className="status draft" style={{ 
                              background: '#f59e0b !important', 
                              color: 'white !important', 
                              border: 'none !important' 
                            }}>
                              <Icon name="edit" size={IconSizes.xs} color={IconColors.white} />
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
                            <Icon name="clock" size={IconSizes.xs} color={IconColors.gray} />
                            {module.estimatedDuration || 'Non définie'}
                          </span>
                          <span className="stat">
                            <Icon name="book" size={IconSizes.xs} color={IconColors.gray} />
                            {module.lessons?.length || 0} leçon(s)
                          </span>
                        </div>
                      </div>
                      
                      {/* Actions du module - même style que les cours */}
                      <div className="module-actions">
                        <button 
                          onClick={() => handleManageLessons(module._id)}
                          className="btn btn-primary"
                          title="Gérer les leçons"
                        >
                          <Icon name="book" size={IconSizes.xs} color={IconColors.white} />
                          Leçons
                        </button>
                        
                        <button 
                          onClick={() => handleEditModule(module._id)}
                          className="btn btn-secondary"
                          title="Modifier le module"
                        >
                          <Icon name="edit" size={IconSizes.xs} color={IconColors.white} />
                          Modifier
                        </button>
                        
                        <button 
                          onClick={() => handleTogglePublish(module._id)}
                          className={`btn ${module.isPublished ? 'btn-warning' : 'btn-success'}`}
                          title={module.isPublished ? 'Mettre en brouillon' : 'Publier'}
                        >
                          <Icon 
                            name={module.isPublished ? 'eyeOff' : 'globe'} 
                            size={IconSizes.xs} 
                            color={IconColors.white} 
                          />
                          {module.isPublished ? 'Brouillon' : 'Publier'}
                        </button>
                        
                        <button 
                          onClick={() => handleDeleteModule(module._id)}
                          className="btn btn-danger"
                          title="Supprimer le module"
                        >
                          <Icon name="trash" size={IconSizes.xs} color={IconColors.white} />
                          Supprimer
                        </button>
                      </div>
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

        {/* Delete Confirmation Modal */}
        <ConfirmModal
          open={showDeleteModal}
          title="Supprimer le module"
          message={`Êtes-vous sûr de vouloir supprimer le module "${moduleToDelete?.title}" ?\n\nCette action est irréversible et supprimera également toutes les leçons associées.\n\nL'ordre des modules restants sera automatiquement réorganisé.`}
          confirmLabel="Supprimer définitivement"
          cancelLabel="Annuler"
          destructive={true}
          variant="warning"
          onConfirm={confirmDeleteModule}
          onCancel={() => {
            setShowDeleteModal(false);
            setModuleToDelete(null);
          }}
        />
      </div>
    </div>
  );
};

export default ManageModules;

