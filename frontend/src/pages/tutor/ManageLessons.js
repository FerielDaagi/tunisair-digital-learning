import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { lessonsAPI, modulesAPI, coursesAPI } from '../../services/api';
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
  
  // Modal states
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [lessonToDelete, setLessonToDelete] = useState(null);

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
    
    // Charger les informations du module et des leçons
    loadModuleAndLessons();
  }, [user, navigate, moduleId]);

  const loadModuleAndLessons = async () => {
    try {
      setLoading(true);
      
      // Charger le module (auth via axios)
      const moduleRes = await modulesAPI.getById(moduleId);
      if (moduleRes.data?.success) {
        const moduleData = moduleRes.data.data;
        setModule(moduleData);
        
        // Charger le cours (auth via axios)
        const courseRes = await coursesAPI.getById(moduleData.course);
        if (courseRes.data?.success) {
          setCourse(courseRes.data.data);
        }
        
        // Charger les leçons du module
        const lessonsRes = await lessonsAPI.getByModule(moduleId);
        if (lessonsRes.data?.success) {
          setLessons(lessonsRes.data.data || []);
        }
      }
    } catch (error) {
      console.error('Erreur chargement données:', error);
      setError('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateLesson = () => {
    navigate(`/tutor/create-lesson/${moduleId}`);
  };

  const handleEditLesson = (lesson) => {
    navigate(`/tutor/edit-lesson/${moduleId}/${lesson._id}`);
  };

  const handleDeleteLesson = (lesson) => {
    setLessonToDelete(lesson);
    setShowDeleteModal(true);
  };

  const confirmDeleteLesson = async () => {
    if (!lessonToDelete) return;
    
    try {
      const response = await lessonsAPI.delete(lessonToDelete._id);
      if (response.data.success) {
        addNotification('Leçon supprimée avec succès', 'success');
        await loadModuleAndLessons();
      }
    } catch (error) {
      console.error('Erreur suppression leçon:', error);
      addNotification('La suppression de la leçon a échoué', 'error');
    } finally {
      setShowDeleteModal(false);
      setLessonToDelete(null);
    }
  };

  const getLessonTypeIcon = (type) => {
    switch (type) {
      case 'document':
        return <Icon name="fileText" size={IconSizes.sm} color={IconColors.primary} />;
      case 'url':
        return <Icon name="link" size={IconSizes.sm} color={IconColors.primary} />;
      case 'video':
        return <Icon name="video" size={IconSizes.sm} color={IconColors.primary} />;
      case 'youtube':
        return <Icon name="youtube" size={IconSizes.sm} color={IconColors.danger} />;
      case 'quiz':
        return <Icon name="helpCircle" size={IconSizes.sm} color={IconColors.warning} />;
      default:
        return <Icon name="file" size={IconSizes.sm} color={IconColors.gray} />;
    }
  };

  const getLessonTypeLabel = (type) => {
    switch (type) {
      case 'document':
        return 'Document';
      case 'url':
        return 'Lien web';
      case 'video':
        return 'Vidéo';
      case 'youtube':
        return 'Vidéo YouTube';
      case 'quiz':
        return 'Quiz';
      default:
        return 'Autre';
    }
  };

  const formatDuration = (minutes) => {
    if (!minutes) return 'Non définie';
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
  };

  if (loading) {
    return (
      <div className="create-course-page">
        <div className="create-course-container">
          <div style={{ textAlign: 'center', padding: '4rem 2rem' }}>
            <Icon name="loader" size={IconSizes.xl} color={IconColors.gray} className="spin" />
            <p>Chargement des leçons...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error && !module) {
    return (
      <div className="create-course-page">
        <div className="create-course-container">
          <div className="alert alert-error">
            <Icon name="error" size={IconSizes.sm} color={IconColors.danger} />
            {error}
          </div>
          <button onClick={() => navigate(-1)} className="btn btn-outline">
            Retour
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="create-course-page">
      <div className="create-course-container">
        
        {/* Page header */}
        <div className="page-header">
          <div className="header-content">
            <h1>
              <Icon name="book" size={IconSizes.lg} color={IconColors.primary} />
              Gérer les leçons
            </h1>
            <p>
              {course?.title ? `Cours : ${course.title}` : 'Chargement du cours...'} 
              {module?.title && ` - Module : ${module.title}`}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={() => navigate(`/tutor/manage-modules/${course?._id}`)}
              className="btn btn-outline"
            >
              <Icon name="arrowLeft" size={IconSizes.sm} color={IconColors.gray} />
              Retour aux modules
            </button>
            <button
              onClick={handleCreateLesson}
              className="create-course-btn"
            >
              <Icon name="plus" size={IconSizes.sm} color={IconColors.white} />
              Nouvelle leçon
            </button>
          </div>
        </div>

        {error && (
          <div className="alert alert-error">
            <Icon name="error" size={IconSizes.sm} color={IconColors.danger} />
            {error}
          </div>
        )}

        {/* Overview Statistics */}
        <div className="modules-overview">
          <div className="overview-stats">
            <div className="stat-card">
              <Icon name="book" size={IconSizes.lg} color={IconColors.primary} />
              <div className="stat-content">
                <span className="stat-number">{lessons.length}</span>
                <span className="stat-label">Leçons</span>
              </div>
            </div>
            
            <div className="stat-card">
              <Icon name="clock" size={IconSizes.lg} color={IconColors.warning} />
              <div className="stat-content">
                <span className="stat-number">
                  {formatDuration(lessons.reduce((total, lesson) => total + (lesson.estimatedDuration || 0), 0))}
                </span>
                <span className="stat-label">Temps total</span>
              </div>
            </div>
            
            <div className="stat-card">
              <Icon name="layers" size={IconSizes.lg} color={IconColors.success} />
              <div className="stat-content">
                <span className="stat-number">
                  {lessons.filter(l => l.isPublished).length}
                </span>
                <span className="stat-label">Publiées</span>
              </div>
            </div>
          </div>
        </div>

        {/* Lessons List */}
        <div className="modules-list">
          <h3>
            <Icon name="list" size={IconSizes.md} color={IconColors.primary} />
            Leçons du module ({lessons.length})
          </h3>
          
          {lessons.length === 0 ? (
            <div className="empty-state">
              <Icon name="book" size={IconSizes.xl} color={IconColors.gray} />
              <p>Aucune leçon créée pour ce module</p>
              <small>Commencez par créer votre première leçon</small>
            </div>
          ) : (
            <div className="unique-modules-container" style={{ 
              display: 'flex !important', 
              flexWrap: 'wrap !important', 
              gap: '1.5rem !important',
              width: '100% !important'
            }}>
              {lessons
                .slice()
                .sort((a, b) => a.order - b.order)
                .map((lesson) => (
                  <div key={lesson._id} className="unique-module-item" style={{ 
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
                          {lesson.order}
                        </div>
                        <div className="module-status">
                          {lesson.isPublished ? (
                            <span className="status published">
                              <Icon name="globe" size={IconSizes.xs} color={IconColors.primary} />
                              Publié
                            </span>
                          ) : (
                            <span className="status draft">
                              <Icon name="edit" size={IconSizes.xs} color={IconColors.white} />
                              Brouillon
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div className="module-content">
                        <h4 className="module-title">{lesson.title}</h4>
                        <p className="module-description">{lesson.description}</p>
                        
                        <div className="module-stats">
                          <span className="stat">
                            {getLessonTypeIcon(lesson.type)}
                            {getLessonTypeLabel(lesson.type)}
                          </span>
                          <span className="stat">
                            <Icon name="clock" size={IconSizes.xs} color={IconColors.gray} />
                            {formatDuration(lesson.estimatedDuration)}
                          </span>
                        </div>

                        {lesson.remarks && (
                          <div className="lesson-remarks">
                            <strong>Remarques :</strong> {lesson.remarks}
                          </div>
                        )}
                      </div>
                      
                      {/* Lesson Actions */}
                      <div className="module-actions">
                        <button 
                          onClick={() => handleEditLesson(lesson)}
                          className="btn btn-secondary"
                          title="Modifier la leçon"
                        >
                          <Icon name="edit" size={IconSizes.xs} color={IconColors.white} />
                          Modifier
                        </button>
                        
                        <button 
                          onClick={() => handleDeleteLesson(lesson)}
                          className="btn btn-danger"
                          title="Supprimer la leçon"
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
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        open={showDeleteModal}
        title="Supprimer la leçon"
        message={`Êtes-vous sûr de vouloir supprimer la leçon "${lessonToDelete?.title}" ?\n\nCette action est irréversible.`}
        confirmLabel="Supprimer définitivement"
        cancelLabel="Annuler"
        destructive={true}
        variant="warning"
        onConfirm={confirmDeleteLesson}
        onCancel={() => {
          setShowDeleteModal(false);
          setLessonToDelete(null);
        }}
      />
    </div>
  );
};

export default ManageLessons;

