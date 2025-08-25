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
    
    // Redirection directe vers la création de module
    console.log('🚀 Redirection directe vers la création de module pour le cours:', courseId);
    navigate(`/tutor/create-module/${courseId}`);
  }, [user, navigate, courseId]);

  const handleDeleteModule = async (moduleId) => {
    setConfirmState({ open: true, moduleId });
  };

  const confirmDelete = async () => {
    const moduleId = confirmState.moduleId;
    setConfirmState({ open: false, moduleId: null });
    try {
      const response = await modulesAPI.delete(moduleId);
      if (response.data.success) {
        const modulesResponse = await modulesAPI.getByCourse(courseId);
        if (modulesResponse.data.success) {
          setModules(modulesResponse.data.data);
        }
      }
    } catch (error) {
      console.error('Erreur suppression module:', error);
      if (addNotification) {
        addNotification('La suppression du module a échoué. Veuillez réessayer.', 'error');
      }
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
            Gérer les modules
          </h1>
          <p>Cours : {course?.title || '...'}</p>
        </div>

        {error && (
          <div className="alert alert-error">
            <Icon name="error" size={IconSizes.sm} color={IconColors.white} />
            {error}
          </div>
        )}

        <div className="modules-management">
          <div className="modules-header">
            <div className="modules-info">
              <h3>Modules ({modules.length})</h3>
              <p>Organisez les modules de votre cours</p>
            </div>
            <button
              onClick={handleCreateModule}
              className="btn btn-primary"
            >
              <Icon name="plus" size={IconSizes.sm} color={IconColors.white} />
              Ajouter un module
            </button>
          </div>

          {modules.length === 0 ? (
            <div className="no-modules">
              <Icon name="folderOpen" size={IconSizes.xl} color={IconColors.muted} />
              <h3>Aucun module créé</h3>
              <p>Commencez par créer votre premier module</p>
              <button
                onClick={handleCreateModule}
                className="btn btn-primary"
              >
                <Icon name="plus" size={IconSizes.sm} color={IconColors.white} />
                Créer le premier module
              </button>
            </div>
          ) : (
            <div className="modules-list">
              {modules.map((module, index) => (
                <div key={module._id} className="module-card">
                  <div className="module-info">
                    <div className="module-header">
                      <div className="module-order">
                        <Icon name="hash" size={IconSizes.sm} color={IconColors.primary} />
                        <span>{module.order}</span>
                      </div>
                      <div className="module-title">
                        <h4>{module.title}</h4>
                        <p>{module.description}</p>
                      </div>
                      <div className="module-status">
                        {module.isPublished ? (
                          <span className="status published">
                            <Icon name="globe" size={IconSizes.xs} color={IconColors.success} />
                            Publié
                          </span>
                        ) : (
                          <span className="status draft">
                            <Icon name="eyeOff" size={IconSizes.xs} color={IconColors.muted} />
                            Brouillon
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="module-stats">
                      <span className="stat">
                        <Icon name="play" size={IconSizes.xs} color={IconColors.primary} />
                        {module.lessons?.length || 0} leçon{module.lessons?.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>
                  
                  <div className="module-actions">
                    <button
                      onClick={() => handleManageLessons(module._id)}
                      className="btn btn-sm btn-primary"
                      title="Gérer les leçons"
                    >
                      <Icon name="list" size={IconSizes.xs} color={IconColors.white} />
                      Leçons
                    </button>
                    
                    <button
                      onClick={() => handleEditModule(module._id)}
                      className="btn btn-sm btn-secondary"
                      title="Modifier le module"
                    >
                      <Icon name="edit" size={IconSizes.xs} color={IconColors.white} />
                      Modifier
                    </button>
                    
                    <button
                      onClick={() => handleDeleteModule(module._id)}
                      className="btn btn-sm btn-danger"
                      title="Supprimer le module"
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

        <div className="form-actions">
          <button
            onClick={() => navigate(`/tutor/edit-course/${courseId}`)}
            className="btn btn-secondary"
          >
            <Icon name="arrowLeft" size={IconSizes.sm} color={IconColors.white} />
            Retour au cours
          </button>
        </div>
      </div>
    </div>
  );
};

export default ManageModules;

