import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { lessonsAPI, modulesAPI, coursesAPI, progressAPI } from '../../services/api';
import { Icon, IconSizes, IconColors } from '../../components/common/IconTheme';
import FileViewer from '../../components/common/FileViewer';
import './LessonView.css';

const LessonView = () => {
  const { lessonId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [lesson, setLesson] = useState(null);
  const [module, setModule] = useState(null);
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notes, setNotes] = useState('');
  const [rating, setRating] = useState(0);
  const [savingNotes, setSavingNotes] = useState(false);
  const [savingRating, setSavingRating] = useState(false);
  const [moduleLessons, setModuleLessons] = useState([]);
  const [currentLessonIndex, setCurrentLessonIndex] = useState(-1);
  const [lessonStartTime, setLessonStartTime] = useState(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const [lessonProgress, setLessonProgress] = useState(null);

  // Fonction pour retourner aux détails du cours
  const handleBackToCourse = () => {
    if (course && course._id) {
      navigate(`/courses/${course._id}`);
    } else {
      // Fallback vers la page précédente si pas de cours
      navigate(-1);
    }
  };

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    
    if (lessonId) {
      fetchLessonData();
      // Marquer automatiquement la leçon comme commencée
      markLessonAsStarted();
    } else {
      setError('ID de la leçon manquant');
      setLoading(false);
    }
  }, [user, navigate, lessonId]);

  // Fonction pour marquer une leçon comme complétée (automatique uniquement)
  const markLessonAsCompleted = useCallback(async () => {
    if (!lessonId || !user || isCompleted) return;
    
    try {
      await progressAPI.markLessonCompleted(lessonId);
      setIsCompleted(true);
      console.log('✅ Leçon marquée comme complétée automatiquement');
    } catch (error) {
      console.error('❌ Erreur lors du marquage automatique de la leçon:', error);
    }
  }, [lessonId, user, isCompleted]);


  // Fonction pour marquer une leçon comme commencée
  const markLessonAsStarted = async () => {
    if (!lessonId || !user) return;
    
    try {
      // Marquer comme commencée (in_progress)
      await progressAPI.markLessonStarted(lessonId);
      setLessonStartTime(Date.now());
      console.log('✅ Leçon marquée comme commencée');
    } catch (error) {
      console.error('❌ Erreur lors du marquage de la leçon comme commencée:', error);
    }
  };

  // Effet pour marquer la leçon comme complétée après un certain temps
  useEffect(() => {
    if (!lessonStartTime) return;

    const minTimeToComplete = 5000; // 5 secondes minimum (réduit de 30s à 5s)
    let timeoutId;

    // Programmer la marque comme complétée après le temps minimum
    timeoutId = setTimeout(() => {
      markLessonAsCompleted();
    }, minTimeToComplete);

    // Nettoyer au démontage du composant
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      // Marquer comme complétée si l'utilisateur quitte avant le timeout
      if (lessonStartTime && (Date.now() - lessonStartTime) >= minTimeToComplete) {
        markLessonAsCompleted();
      }
    };
  }, [lessonStartTime, markLessonAsCompleted]);

  // Marquer automatiquement comme complétée quand l'utilisateur quitte la page
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (lessonStartTime && (Date.now() - lessonStartTime) >= 2000) { // Au moins 2 secondes
        markLessonAsCompleted();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      // Marquer comme complétée au démontage du composant
      if (lessonStartTime && (Date.now() - lessonStartTime) >= 2000) {
        markLessonAsCompleted();
      }
    };
  }, [lessonStartTime, markLessonAsCompleted]);

  // Effet pour récupérer la progression quand le cours est chargé
  useEffect(() => {
    if (course && course._id && lessonId) {
      const fetchProgress = async () => {
        try {
          // Récupérer la progression du cours pour obtenir l'état de cette leçon
          const progressResponse = await progressAPI.getCourseProgress(course._id);
          const courseProgress = progressResponse.data.data;
          
          // Trouver la progression de cette leçon
          for (const module of courseProgress.modules) {
            for (const lesson of module.lessons) {
              if (lesson._id === lessonId) {
                setLessonProgress(lesson.progress);
                setIsCompleted(lesson.progress.status === 'completed');
                console.log('🔍 État de progression récupéré:', lesson.progress);
                return;
              }
            }
          }
        } catch (error) {
          console.error('❌ Erreur lors de la récupération de la progression:', error);
        }
      };
      
      fetchProgress();
    }
  }, [course, lessonId]);

  const fetchLessonData = async () => {
    try {
      setLoading(true);
      
      // Récupérer la leçon
      const lessonResponse = await lessonsAPI.getById(lessonId);
      console.log('🔍 Raw lesson response:', lessonResponse);
      const lessonData = lessonResponse.data.data; // Access the actual lesson data
      console.log('🔍 Lesson data received:', lessonData);
      console.log('🔍 Lesson course ID:', lessonData.course);
      console.log('🔍 Lesson module ID:', lessonData.module);
      setLesson(lessonData);
      
      // Essayer de récupérer le module si l'ID existe
      if (lessonData.module && lessonData.module !== null && lessonData.module !== undefined) {
        try {
          const moduleResponse = await modulesAPI.getById(lessonData.module);
          const moduleData = moduleResponse.data.data || moduleResponse.data; // Handle both response formats
          console.log('🔍 Module data received:', moduleData);
          setModule(moduleData);
          
          // Récupérer toutes les leçons du module pour la navigation
          try {
            const lessonsResponse = await lessonsAPI.getByModule(lessonData.module);
            const lessons = lessonsResponse.data.data || lessonsResponse.data || [];
            console.log('🔍 Module lessons received:', lessons);
            setModuleLessons(lessons);
            
            // Trouver l'index de la leçon actuelle
            const currentIndex = lessons.findIndex(l => l._id === lessonId);
            setCurrentLessonIndex(currentIndex);
            console.log('🔍 Current lesson index:', currentIndex);
          } catch (lessonsError) {
            console.warn('⚠️ Could not fetch module lessons:', lessonsError);
          }
          
          // Essayer de récupérer le cours si l'ID existe
          if (moduleData.course) {
            // Vérifier que le cours du module correspond au cours de la leçon
            if (lessonData.course && moduleData.course !== lessonData.course) {
              console.warn('⚠️ Course ID mismatch: lesson.course =', lessonData.course, 'module.course =', moduleData.course);
              console.warn('⚠️ Using lesson.course as primary source');
            }
            
            // Utiliser le cours de la leçon en priorité, sinon celui du module
            const courseId = lessonData.course || moduleData.course;
            
            try {
              const courseResponse = await coursesAPI.getById(courseId);
              const courseData = courseResponse.data.data || courseResponse.data; // Handle both response formats
              console.log('🔍 Course data received:', courseData);
              console.log('🔍 Course ID used:', courseId);
              console.log('🔍 Course title:', courseData.title);
              console.log('🔍 Course description:', courseData.description);
              setCourse(courseData);
              console.log('✅ Course state updated successfully');
            } catch (courseError) {
              console.warn('⚠️ Could not fetch course data:', courseError);
              // Continue sans les données du cours
            }
          } else {
            console.warn('⚠️ No course ID found in module data');
          }
        } catch (moduleError) {
          console.warn('⚠️ Could not fetch module data:', moduleError);
          // Continue sans les données du module
        }
      } else {
        console.warn('⚠️ No module ID found in lesson data - displaying lesson without module/course info');
        console.log('🔍 Lesson data structure:', Object.keys(lessonData));
        console.log('🔍 Module field value:', lessonData.module);
        
        // Essayer de récupérer le cours directement depuis la leçon si pas de module
        if (lessonData.course) {
          try {
            const courseResponse = await coursesAPI.getById(lessonData.course);
            const courseData = courseResponse.data.data || courseResponse.data; // Handle both response formats
            console.log('🔍 Course data received (direct from lesson):', courseData);
            setCourse(courseData);
          } catch (courseError) {
            console.warn('⚠️ Could not fetch course data directly from lesson:', courseError);
          }
        }
      }
      
    } catch (error) {
      console.error('Erreur lors du chargement de la leçon:', error);
      setError('Erreur lors du chargement de la leçon');
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour sauvegarder les notes
  const handleSaveNotes = async () => {
    if (!lesson || !user) return;
    
    setSavingNotes(true);
    try {
      await progressAPI.addLessonNotes(lessonId, notes);
      console.log('✅ Notes sauvegardées avec succès');
    } catch (error) {
      console.error('❌ Erreur lors de la sauvegarde des notes:', error);
    } finally {
      setSavingNotes(false);
    }
  };

  // Fonction pour sauvegarder l'évaluation
  const handleSaveRating = async (newRating) => {
    if (!lesson || !user) return;
    
    setSavingRating(true);
    try {
      await progressAPI.rateLesson(lessonId, newRating);
      setRating(newRating);
      console.log('✅ Évaluation sauvegardée avec succès');
    } catch (error) {
      console.error('❌ Erreur lors de la sauvegarde de l\'évaluation:', error);
    } finally {
      setSavingRating(false);
    }
  };

  const getLessonTypeIcon = (type) => {
    switch (type) {
      case 'text': return '📝';
      case 'video': return '🎥';
      case 'file': return '📁';
      case 'link': return '🔗';
      case 'quiz': return '❓';
      case 'assignment': return '📋';
      case 'interactive': return '🎮';
      default: return '📄';
    }
  };

  const getLessonTypeLabel = (type) => {
    switch (type) {
      case 'text': return 'Leçon texte';
      case 'video': return 'Vidéo';
      case 'file': return 'Fichiers';
      case 'link': return 'Lien externe';
      case 'quiz': return 'Quiz';
      case 'assignment': return 'Devoir';
      case 'interactive': return 'Contenu interactif';
      default: return 'Leçon';
    }
  };

  const getFileType = (mimeType) => {
    if (mimeType.includes('pdf')) return 'pdf';
    if (mimeType.includes('image')) return 'image';
    if (mimeType.includes('video')) return 'video';
    return 'doc';
  };

  const getFileIcon = (mimeType) => {
    if (mimeType.includes('pdf')) return 'fas fa-file-pdf';
    if (mimeType.includes('image')) return 'fas fa-file-image';
    if (mimeType.includes('video')) return 'fas fa-file-video';
    return 'fas fa-file-alt';
  };

  const handleFileClick = (attachment) => {
    // Vérifier que l'URL existe
    const fileUrl = attachment.url || attachment.path || attachment.filename;
    
    if (!fileUrl) {
      console.error('URL du fichier non trouvée:', attachment);
      alert('Impossible d\'ouvrir le fichier : URL non trouvée');
      return;
    }
    
    // Construire l'URL complète
    const fullUrl = fileUrl.startsWith('http') ? fileUrl : `http://localhost:5000${fileUrl}`;
    
    console.log('Tentative d\'ouverture du fichier:', fullUrl);
    
    // Pour les images et vidéos, ouvrir dans un nouvel onglet
    if (attachment.mimeType?.includes('image') || attachment.mimeType?.includes('video')) {
      window.open(fullUrl, '_blank');
    } 
    // Pour les PDFs, ouvrir dans un nouvel onglet
    else if (attachment.mimeType?.includes('pdf')) {
      window.open(fullUrl, '_blank');
    }
    // Pour les autres fichiers, télécharger
    else {
      const link = document.createElement('a');
      link.href = fullUrl;
      link.download = attachment.originalName;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  // Fonctions de navigation entre les leçons
  const goToNextLesson = () => {
    if (currentLessonIndex < moduleLessons.length - 1) {
      const nextLesson = moduleLessons[currentLessonIndex + 1];
      navigate(`/lesson/${nextLesson._id}`);
    }
  };

  const goToPreviousLesson = () => {
    if (currentLessonIndex > 0) {
      const previousLesson = moduleLessons[currentLessonIndex - 1];
      navigate(`/lesson/${previousLesson._id}`);
    }
  };

  const canGoToNext = currentLessonIndex < moduleLessons.length - 1 && isCompleted;
  const canGoToPrevious = currentLessonIndex > 0;

  if (loading) {
    return (
      <div className="lesson-view-container">
        <div className="loading-container">
          <div className="loading-spinner"></div>
        </div>
      </div>
    );
  }

  if (error || !lesson) {
    return (
      <div className="lesson-view-container">
        <div className="error-container">
          <div className="error-icon">
            <i className="fas fa-exclamation-triangle"></i>
          </div>
          <h2 className="error-title">Leçon non trouvée</h2>
          <p className="error-message">
            {error || 'Cette leçon n\'existe pas ou vous n\'y avez pas accès.'}
          </p>
          <button 
            onClick={handleBackToCourse}
            className="btn btn-primary btn-lg"
          >
            <i className="fas fa-arrow-left me-2"></i>
            Retour au cours
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="lesson-view-container">
      {/* Hero Section - Like Udemy */}
      <div className="lesson-hero">
        <div className="container">
          <nav className="lesson-navigation mb-4">
            <div className="navigation-left">
              <button 
                onClick={handleBackToCourse}
                className="btn btn-outline btn-sm back-btn-flash"
              >
                Retour au cours
                <i className="fas fa-arrow-right ms-2"></i>
              </button>
            </div>
            
            <div className="navigation-center">
              {course && (
                <div className="course-info">
                  <span className="lesson-course-title">
                    {course.title}
                  </span>
                </div>
              )}
              {moduleLessons.length > 1 && (
                <div className="lesson-progress-info">
                  <span className="lesson-counter">
                    Leçon {currentLessonIndex + 1} sur {moduleLessons.length}
                  </span>
                  {module && (
                    <span className="module-name">
                      - {module.title}
                    </span>
                  )}
                </div>
              )}
            </div>
            
            <div className="navigation-right">
              <div className="lesson-nav-buttons">
                <button 
                  onClick={goToPreviousLesson}
                  disabled={!canGoToPrevious}
                  className={`btn btn-outline btn-sm ${!canGoToPrevious ? 'disabled' : ''}`}
                  title={canGoToPrevious ? 'Leçon précédente' : 'Première leçon'}
                >
                  <i className="fas fa-chevron-left me-1"></i>
                  Précédent
                </button>
                
                <button 
                  onClick={goToNextLesson}
                  disabled={!canGoToNext}
                  className={`btn btn-primary btn-sm ${!canGoToNext ? 'disabled' : ''}`}
                  title={!isCompleted ? 'Complétez cette leçon pour débloquer la suivante' : 
                         currentLessonIndex < moduleLessons.length - 1 ? 'Leçon suivante' : 'Dernière leçon'}
                >
                  Suivant
                  <i className="fas fa-chevron-right ms-1"></i>
                </button>
              </div>
            </div>
          </nav>
          
          <div className="lesson-info">
            <h1 className="lesson-title">{lesson.title}</h1>
            <p className="lesson-subtitle">{lesson.description}</p>
            <div className="lesson-details">
              <div className="detail-item">
                <span className="detail-label">Leçon :</span>
                <span className="detail-value">{lesson.title}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Description :</span>
                <span className="detail-value">{lesson.description}</span>
              </div>
            </div>
          </div>
          
          <div className="lesson-meta">
            <div className="meta-item">
              <i className="fas fa-play-circle"></i>
              <span>{getLessonTypeLabel(lesson.type)}</span>
            </div>
            <div className="meta-item">
              <i className="fas fa-clock"></i>
              <span>{lesson.duration} minutes</span>
            </div>
            {lesson.difficulty && (
              <div className="meta-item">
                <i className="fas fa-signal"></i>
                <span>Niveau {lesson.difficulty}</span>
              </div>
            )}
            {lesson.isFree && (
              <div className="meta-item">
                <i className="fas fa-gift"></i>
                <span>Gratuit</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="lesson-content-wrapper">
        <div className="container">
          <div className="row">
            {/* Content Column */}
            <div className="col-lg-8">
              <div className="content-main">
                <div className="content-header">
                  <h2>Contenu de la leçon</h2>
                </div>
                <div className="content-body">
                  {/* Text Content */}
                  {lesson.content && (
                    <div className="lesson-content-text" style={{ whiteSpace: 'pre-wrap' }}>
                      {lesson.content}
                    </div>
                  )}

                  {/* Video Content */}
                  {lesson.type === 'video' && lesson.videoUrl && (
                    <div className="video-player-container">
                      <video 
                        src={`http://localhost:5000${lesson.videoUrl}`}
                        controls
                      >
                        Votre navigateur ne supporte pas la lecture vidéo.
                      </video>
                    </div>
                  )}

                  {/* Link Content */}
                  {lesson.type === 'link' && lesson.linkUrl && (
                    <div className="link-container-modern">
                      <h3 className="link-title">
                        <i className="fas fa-external-link-alt me-2"></i>
                        Lien externe
                      </h3>
                      <a 
                        href={lesson.linkUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="link-url"
                      >
                        {lesson.linkUrl}
                      </a>
                      <div className="link-note">
                        <i className="fas fa-info-circle me-1"></i>
                        Cliquez pour ouvrir dans un nouvel onglet
                      </div>
                    </div>
                  )}

                  {/* File Attachments */}
                  {lesson.attachments && lesson.attachments.length > 0 && (
                    <div className="attachments-section">
                      <h3 className="attachments-title">
                        <i className="fas fa-paperclip me-2"></i>
                        Fichiers de la leçon
                      </h3>
                      {lesson.attachments.map((attachment, index) => {
                        console.log('Attachment data:', attachment);
                        return (
                        <div 
                          key={index} 
                          className="attachment-card"
                          onClick={() => handleFileClick(attachment)}
                          style={{ cursor: 'pointer' }}
                        >
                          <div className="d-flex align-items-center">
                            <div className={`attachment-icon ${getFileType(attachment.mimeType)}`}>
                              <i className={getFileIcon(attachment.mimeType)}></i>
                            </div>
                            <div className="attachment-info">
                              <h4>{attachment.originalName}</h4>
                              <p>{(attachment.size / 1024 / 1024).toFixed(2)} MB</p>
                            </div>
                            <div className="attachment-action">
                              <i className="fas fa-external-link-alt"></i>
                            </div>
                          </div>
                        </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Section Commentaires et Évaluations */}
                <div className="comments-section">
                  <div className="comments-header">
                    <h3>
                      <i className="fas fa-comments me-2"></i>
                      Vos commentaires et notes
                    </h3>
                    <p className="text-muted">Partagez vos impressions sur cette leçon</p>
                  </div>

                  {/* Section Notes personnelles */}
                  <div className="notes-section">
                    <h4>
                      <i className="fas fa-sticky-note me-2"></i>
                      Notes personnelles
                    </h4>
                    <div className="notes-form">
                      <textarea
                        className="form-control notes-textarea"
                        placeholder="Ajoutez vos notes personnelles sur cette leçon..."
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        rows={4}
                      />
                      <div className="notes-actions">
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={handleSaveNotes}
                          disabled={savingNotes}
                        >
                          {savingNotes ? (
                            <>
                              <i className="fas fa-spinner fa-spin me-1"></i>
                              Sauvegarde...
                            </>
                          ) : (
                            <>
                              <i className="fas fa-save me-1"></i>
                              Sauvegarder
                            </>
                          )}
                        </button>
                        <small className="text-muted ms-2">
                          {notes.length}/1000 caractères
                        </small>
                      </div>
                    </div>
                  </div>

                  {/* Section Évaluation */}
                  <div className="rating-section">
                    <h4>
                      <i className="fas fa-star me-2"></i>
                      Évaluez cette leçon
                    </h4>
                    <div className="rating-form">
                      <div className="rating-stars">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            className={`star-btn ${star <= rating ? 'active' : ''}`}
                            onClick={() => handleSaveRating(star)}
                            disabled={savingRating}
                          >
                            <i className="fas fa-star"></i>
                          </button>
                        ))}
                      </div>
                      <div className="rating-labels">
                        <span className="rating-label">
                          {rating === 0 ? 'Pas encore évalué' :
                           rating === 1 ? 'Très mauvais' :
                           rating === 2 ? 'Mauvais' :
                           rating === 3 ? 'Moyen' :
                           rating === 4 ? 'Bon' : 'Excellent'}
                        </span>
                        {savingRating && (
                          <span className="text-muted ms-2">
                            <i className="fas fa-spinner fa-spin me-1"></i>
                            Sauvegarde...
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="col-lg-4">
              <div className="lesson-sidebar">
                {/* Lesson Info */}
                <div className="sidebar-card">
                  <div className="sidebar-header">
                    <h3>Informations de la leçon</h3>
                  </div>
                  <div className="sidebar-body">
                    <div className="info-row">
                      <span className="info-label">Type</span>
                      <span className="badge-modern badge-type">
                        {getLessonTypeLabel(lesson.type)}
                      </span>
                    </div>
                    <div className="info-row">
                      <span className="info-label">Durée</span>
                      <span className="info-value">
                        <i className="fas fa-clock me-1"></i>
                        {lesson.duration} min
                      </span>
                    </div>
                    {lesson.difficulty && (
                      <div className="info-row">
                        <span className="info-label">Niveau</span>
                        <span className="badge-modern badge-difficulty">
                          {lesson.difficulty}
                        </span>
                      </div>
                    )}
                    {lesson.isFree && (
                      <div className="info-row">
                        <span className="info-label">Prix</span>
                        <span className="badge-modern badge-free">
                          <i className="fas fa-gift me-1"></i>
                          Gratuit
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Course Info */}
                {course ? (
                  <div className="course-info-card">
                    <div className="course-header">
                      <h3 className="lesson-course-title">{course.title}</h3>
                      <div className="course-instructor">
                        <i className="fas fa-user me-1"></i>
                        {course.instructor?.name || 'Instructeur'}
                      </div>
                    </div>
                    <div className="course-body">
                      <p className="course-description">
                        {course.description}
                      </p>
                      <div className="course-stats">
                        <span>
                          <i className="fas fa-clock me-1"></i>
                          {course.duration || 'Durée non spécifiée'}
                        </span>
                        <span>
                          <i className="fas fa-graduation-cap me-1"></i>
                          Cours
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="sidebar-card">
                    <div className="sidebar-header">
                      <h3>Informations du cours</h3>
                    </div>
                    <div className="sidebar-body">
                      <div className="alert alert-warning mb-0">
                        <i className="fas fa-exclamation-triangle me-2"></i>
                        <span className="small">Informations du cours non disponibles</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Section Progression */}
                <div className="sidebar-card">
                  <div className="sidebar-header">
                    <h3>Progression</h3>
                  </div>
                  <div className="sidebar-body">
                    {/* État actuel de la leçon */}
                    <div className="lesson-status">
                      <div className="status-indicator">
                        <span className="status-label">État actuel :</span>
                        <span className={`status-badge ${isCompleted ? 'completed' : lessonProgress?.status === 'in_progress' ? 'in-progress' : 'not-started'}`}>
                          {isCompleted ? 'Complétée' : 
                           lessonProgress?.status === 'in_progress' ? 'En cours' : 
                           'Non commencée'}
                        </span>
                      </div>
                    </div>

                  </div>
                </div>

                {/* Message de completion */}
                {isCompleted && (
                  <div className="sidebar-card">
                    <div className="sidebar-header">
                      <h3>Progression</h3>
                    </div>
                    <div className="sidebar-body">
                      <div className="completion-success">
                        <div className="text-center">
                          <i className="fas fa-check-circle text-success mb-2" style={{fontSize: '2rem'}}></i>
                          <p className="text-success mb-0">
                            <strong>Leçon complétée !</strong>
                          </p>
                          <small className="text-muted">
                            Votre progression a été mise à jour.
                          </small>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LessonView;
