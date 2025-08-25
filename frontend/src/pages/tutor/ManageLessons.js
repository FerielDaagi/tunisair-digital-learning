import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { lessonsAPI } from '../../services/api';
import { Icon, IconSizes, IconColors } from '../../components/common/IconTheme';
import ConfirmModal from '../../components/common/ConfirmModal';
import './CreateCourse.css';

const ManageLessons = () => {
  const { user, addNotification } = useAuth();
  const navigate = useNavigate();
  const { moduleId } = useParams();
  
  const [lessons, setLessons] = useState([]);
  const [module, setModule] = useState(null);
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [confirmState, setConfirmState] = useState({ open: false, lessonId: null });

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
    
    // Charger les données
    const fetchData = async () => {
      try {
        // Charger le module et le cours
        const moduleResponse = await fetch(`http://localhost:5000/api/modules/${moduleId}`);
        if (moduleResponse.ok) {
          const moduleData = await moduleResponse.json();
          if (moduleData.success) {
            setModule(moduleData.data);
            
            // Charger le cours
            const courseResponse = await fetch(`http://localhost:5000/api/courses/${moduleData.data.course}`);
            if (courseResponse.ok) {
              const courseData = await courseResponse.json();
              if (courseData.success) {
                setCourse(courseData.data);
              }
            }
          }
        }
        
        // Charger les leçons
        const lessonsResponse = await lessonsAPI.getByModule(moduleId);
        if (lessonsResponse.data.success) {
          setLessons(lessonsResponse.data.data);
        }
      } catch (error) {
        console.error('Erreur chargement données:', error);
        setError('Erreur lors du chargement des données');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [user, navigate, moduleId]);

  const handleDeleteLesson = async (lessonId) => {
    setConfirmState({ open: true, lessonId });
  };

  const confirmDelete = async () => {
    const lessonId = confirmState.lessonId;
    setConfirmState({ open: false, lessonId: null });
    try {
      const response = await lessonsAPI.delete(lessonId);
      if (response.data.success) {
        const lessonsResponse = await lessonsAPI.getByModule(moduleId);
        if (lessonsResponse.data.success) {
          setLessons(lessonsResponse.data.data);
        }
        if (addNotification) {
          addNotification('Leçon supprimée avec succès', 'success');
        }
      }
    } catch (error) {
      console.error('Erreur suppression leçon:', error);
      if (addNotification) {
        addNotification('La suppression de la leçon a échoué. Veuillez réessayer.', 'error');
      }
    }
  };

  const handleEditLesson = (lessonId) => {
    navigate(`/tutor/edit-lesson/${lessonId}`);
  };

  const handleCreateLesson = () => {
    navigate(`/tutor/create-lesson/${moduleId}`);
  };

  const handleReorderLessons = async (lessonIds) => {
    try {
      const response = await lessonsAPI.reorder(moduleId, lessonIds);
      if (response.data.success) {
        const lessonsResponse = await lessonsAPI.getByModule(moduleId);
        if (lessonsResponse.data.success) {
          setLessons(lessonsResponse.data.data);
        }
        if (addNotification) {
          addNotification('Ordre des leçons mis à jour', 'success');
        }
      }
    } catch (error) {
      console.error('Erreur réorganisation leçons:', error);
      if (addNotification) {
        addNotification('La réorganisation des leçons a échoué', 'error');
      }
    }
  };

  const moveLesson = (fromIndex, toIndex) => {
    const newLessons = [...lessons];
    const [movedLesson] = newLessons.splice(fromIndex, 1);
    newLessons.splice(toIndex, 0, movedLesson);
    
    // Mettre à jour l'ordre
    const updatedLessons = newLessons.map((lesson, index) => ({
      ...lesson,
      order: index + 1
    }));
    
    setLessons(updatedLessons);
    
    // Envoyer la mise à jour au serveur
    const lessonIds = updatedLessons.map(lesson => lesson._id);
    handleReorderLessons(lessonIds);
  };

  if (!user || user.role !== 'tuteur') {
    return (
      <div className="create-course-page">
        <div className="access-denied">
          <Icon name="lock" size={IconSizes.xl} color={IconColors.error} />
          <h2>Accès refusé</h2>
          <p>Seuls les tuteurs peuvent gérer les leçons.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="create-course-page">
        <div className="loading">
          <Icon name="loader" size={IconSizes.xl} color={IconColors.primary} />
          <h2>Chargement des leçons...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="create-course-page">
      <div className="create-course-container">
        <ConfirmModal
          open={confirmState.open}
          title="Supprimer la leçon"
          message="Confirmez-vous la suppression de cette leçon ? Cette action est irréversible."
          confirmLabel="Supprimer"
          destructive
          onConfirm={confirmDelete}
          onCancel={() => setConfirmState({ open: false, lessonId: null })}
        />
        <div className="create-course-header">
          <h1>
            <Icon name="bookOpen" size={IconSizes.lg} color={IconColors.primary} />
            Gérer les leçons
          </h1>
          <p>Module : {module?.title || '...'}</p>
          <p>Cours : {course?.title || '...'}</p>
        </div>

        {error && (
          <div className="alert alert-error">
            <Icon name="error" size={IconSizes.sm} color={IconColors.white} />
            {error}
          </div>
        )}

        <div className="lessons-management">
          <div className="lessons-header">
            <div className="lessons-info">
              <h3>Leçons ({lessons.length})</h3>
              <p>Organisez les leçons de votre module</p>
            </div>
            <button
              onClick={handleCreateLesson}
              className="btn btn-primary"
            >
              <Icon name="plus" size={IconSizes.sm} color={IconColors.white} />
              Ajouter une leçon
            </button>
          </div>

          {lessons.length === 0 ? (
            <div className="no-lessons">
              <Icon name="bookOpen" size={IconSizes.xl} color={IconColors.muted} />
              <h3>Aucune leçon créée</h3>
              <p>Commencez par créer votre première leçon</p>
              <button
                onClick={handleCreateLesson}
                className="btn btn-primary"
              >
                <Icon name="plus" size={IconSizes.sm} color={IconColors.white} />
                Créer la première leçon
              </button>
            </div>
          ) : (
            <div className="lessons-list">
              {lessons.map((lesson, index) => (
                <div key={lesson._id} className="lesson-card">
                  <div className="lesson-info">
                    <div className="lesson-header">
                      <div className="lesson-order">
                        <Icon name="hash" size={IconSizes.sm} color={IconColors.primary} />
                        <span>{lesson.order}</span>
                      </div>
                      <div className="lesson-title">
                        <h4>{lesson.title}</h4>
                        <p>{lesson.description}</p>
                      </div>
                      <div className="lesson-status">
                        {lesson.isPublished ? (
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
                    
                    <div className="lesson-stats">
                      <span className="stat">
                        <Icon name="clock" size={IconSizes.xs} color={IconColors.primary} />
                        {lesson.duration}
                      </span>
                      <span className="stat">
                        <Icon name="tag" size={IconSizes.xs} color={IconColors.secondary} />
                        {lesson.type}
                      </span>
                      {lesson.isFree && (
                        <span className="stat free">
                          <Icon name="gift" size={IconSizes.xs} color={IconColors.success} />
                          Gratuit
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="lesson-actions">
                    <div className="reorder-buttons">
                      {index > 0 && (
                        <button
                          onClick={() => moveLesson(index, index - 1)}
                          className="btn btn-sm btn-secondary"
                          title="Déplacer vers le haut"
                        >
                          <Icon name="chevronUp" size={IconSizes.xs} color={IconColors.white} />
                        </button>
                      )}
                      {index < lessons.length - 1 && (
                        <button
                          onClick={() => moveLesson(index, index + 1)}
                          className="btn btn-sm btn-secondary"
                          title="Déplacer vers le bas"
                        >
                          <Icon name="chevronDown" size={IconSizes.xs} color={IconColors.white} />
                        </button>
                      )}
                    </div>
                    
                    <button
                      onClick={() => handleEditLesson(lesson._id)}
                      className="btn btn-sm btn-secondary"
                      title="Modifier la leçon"
                    >
                      <Icon name="edit" size={IconSizes.xs} color={IconColors.white} />
                      Modifier
                    </button>
                    
                    <button
                      onClick={() => handleDeleteLesson(lesson._id)}
                      className="btn btn-sm btn-danger"
                      title="Supprimer la leçon"
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
            onClick={() => navigate(`/tutor/manage-modules/${course?._id}`)}
            className="btn btn-secondary"
          >
            <Icon name="arrowLeft" size={IconSizes.sm} color={IconColors.white} />
            Retour aux modules
          </button>
        </div>
      </div>
    </div>
  );
};

export default ManageLessons;

