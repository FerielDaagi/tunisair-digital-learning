import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { lessonsAPI, modulesAPI, coursesAPI } from '../../services/api';
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

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    
    if (lessonId) {
      fetchLessonData();
    } else {
      setError('ID de la leçon manquant');
      setLoading(false);
    }
  }, [user, navigate, lessonId]);

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
            onClick={() => navigate(-1)}
            className="btn btn-primary btn-lg"
          >
            <i className="fas fa-arrow-left me-2"></i>
            Retour
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
            <button 
              onClick={() => navigate(-1)}
              className="btn btn-outline btn-sm back-btn-flash"
            >
              Retour
              <i className="fas fa-arrow-right ms-2"></i>
            </button>
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
                      <h3 className="course-title">{course.title}</h3>
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
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LessonView;
