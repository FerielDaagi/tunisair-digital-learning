import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import api, { progressAPI } from '../../services/api';
import './CourseProgress.css';

const CourseProgress = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { user, addNotification } = useAuth();
  const [courseData, setCourseData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeModule, setActiveModule] = useState(null);

  useEffect(() => {
    if (!user || user.role !== 'apprenti') {
      navigate('/dashboard');
      return;
    }
    fetchCourseProgress();
  }, [courseId, user, navigate]);

  const fetchCourseProgress = async () => {
    try {
      setLoading(true);
      const response = await progressAPI.getCourseProgress(courseId);
      setCourseData(response.data.data);
      if (response.data.data.modules.length > 0) {
        setActiveModule(response.data.data.modules[0]._id);
      }
    } catch (error) {
      console.error('Erreur lors de la récupération de la progression:', error);
      setError('Erreur lors du chargement de la progression du cours');
    } finally {
      setLoading(false);
    }
  };

  const handleLessonClick = (lesson) => {
    if (lesson.progress.status === 'not_started') {
      // Marquer comme commencée
      markLessonStarted(lesson._id);
    }
    navigate(`/lesson/${lesson._id}`);
  };

  const markLessonStarted = async (lessonId) => {
    try {
      await progressAPI.markLessonStarted(lessonId);
      // Rafraîchir les données
      fetchCourseProgress();
    } catch (error) {
      console.error('Erreur lors du marquage de la leçon:', error);
    }
  };

  const getLessonStatusIcon = (status) => {
    switch (status) {
      case 'completed': return 'fas fa-check-circle';
      case 'in_progress': return 'fas fa-play-circle';
      case 'not_started': return 'fas fa-circle';
      default: return 'fas fa-circle';
    }
  };

  const getLessonStatusColor = (status) => {
    switch (status) {
      case 'completed': return '#28a745';
      case 'in_progress': return '#ffc107';
      case 'not_started': return '#6c757d';
      default: return '#6c757d';
    }
  };

  const getLessonStatusText = (status) => {
    switch (status) {
      case 'completed': return 'Terminée';
      case 'in_progress': return 'En cours';
      case 'not_started': return 'Non commencée';
      default: return 'Inconnue';
    }
  };

  const formatDuration = (duration) => {
    if (!duration) return 'Durée non spécifiée';
    return duration;
  };

  const getModuleProgress = (module) => {
    const completedLessons = module.lessons.filter(l => l.progress.status === 'completed').length;
    const totalLessons = module.lessons.length;
    return totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
  };

  if (loading) {
    return (
      <div className="course-progress-container">
        <div className="loading-container">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Chargement...</span>
          </div>
          <p>Chargement de la progression du cours...</p>
        </div>
      </div>
    );
  }

  if (error || !courseData) {
    return (
      <div className="course-progress-container">
        <div className="error-container">
          <div className="alert alert-danger" role="alert">
            <i className="fas fa-exclamation-triangle me-2"></i>
            {error || 'Cours non trouvé'}
          </div>
          <button className="btn btn-primary" onClick={() => navigate('/my-courses')}>
            <i className="fas fa-arrow-left me-2"></i>
            Retour à mes cours
          </button>
        </div>
      </div>
    );
  }

  const selectedModule = courseData.modules.find(m => m._id === activeModule);

  return (
    <div className="course-progress-container">
      {/* Header */}
      <div className="course-header">
        <div className="header-navigation">
          <button 
            className="btn btn-outline btn-sm"
            onClick={() => navigate('/my-courses')}
          >
            <i className="fas fa-arrow-left me-2"></i>
            Retour
          </button>
        </div>
        
        <div className="course-info">
          <h1 className="progress-course-title">{courseData.course.title}</h1>
          <p className="course-description">{courseData.course.description}</p>
          
          <div className="course-stats">
            <div className="stat-item">
              <div className="stat-value">{courseData.course.totalProgress}%</div>
              <div className="stat-label">Progression globale</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">{courseData.modules.length}</div>
              <div className="stat-label">Module{courseData.modules.length > 1 ? 's' : ''}</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">
                {courseData.modules.reduce((total, module) => total + module.lessons.length, 0)}
              </div>
              <div className="stat-label">Leçon{courseData.modules.reduce((total, module) => total + module.lessons.length, 0) > 1 ? 's' : ''}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="course-content">
        {/* Sidebar - Modules */}
        <div className="modules-sidebar">
          <h3 className="sidebar-title">
            <i className="fas fa-list me-2"></i>
            Modules du cours
          </h3>
          
          <div className="modules-list">
            {courseData.modules.map((module) => (
              <div 
                key={module._id}
                className={`module-item ${activeModule === module._id ? 'active' : ''}`}
                onClick={() => setActiveModule(module._id)}
              >
                <div className="module-header">
                  <div className="module-title">
                    <i className="fas fa-folder me-2"></i>
                    {module.title}
                  </div>
                  <div className="module-progress">
                    {getModuleProgress(module)}%
                  </div>
                </div>
                
                <div className="module-progress-bar">
                  <div 
                    className="module-progress-fill"
                    style={{ width: `${getModuleProgress(module)}%` }}
                  ></div>
                </div>
                
                <div className="module-lessons-count">
                  {module.lessons.filter(l => l.progress.status === 'completed').length} / {module.lessons.length} leçons terminées
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Main Content - Lessons */}
        <div className="lessons-content">
          {selectedModule ? (
            <>
              <div className="module-header">
                <h2 className="module-title">
                  <i className="fas fa-folder me-2"></i>
                  {selectedModule.title}
                </h2>
                <p className="module-description">{selectedModule.description}</p>
                
                <div className="module-progress-overview">
                  <div className="progress-info">
                    <span className="progress-text">
                      {selectedModule.lessons.filter(l => l.progress.status === 'completed').length} / {selectedModule.lessons.length} leçons terminées
                    </span>
                    <span className="progress-percentage">{getModuleProgress(selectedModule)}%</span>
                  </div>
                  <div className="progress-bar">
                    <div 
                      className="progress-fill"
                      style={{ width: `${getModuleProgress(selectedModule)}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              <div className="lessons-list">
                {selectedModule.lessons.map((lesson, index) => (
                  <div 
                    key={lesson._id}
                    className={`lesson-item ${lesson.progress.status}`}
                    onClick={() => handleLessonClick(lesson)}
                  >
                    <div className="lesson-number">
                      {index + 1}
                    </div>
                    
                    <div className="lesson-content">
                      <div className="lesson-header">
                        <h4 className="lesson-title">{lesson.title}</h4>
                        <div className="lesson-status">
                          <i 
                            className={getLessonStatusIcon(lesson.progress.status)}
                            style={{ color: getLessonStatusColor(lesson.progress.status) }}
                          ></i>
                          <span style={{ color: getLessonStatusColor(lesson.progress.status) }}>
                            {getLessonStatusText(lesson.progress.status)}
                          </span>
                        </div>
                      </div>
                      
                      <p className="lesson-description">{lesson.description}</p>
                      
                      <div className="lesson-meta">
                        <div className="meta-item">
                          <i className="fas fa-clock me-1"></i>
                          <span>{formatDuration(lesson.duration)}</span>
                        </div>
                        <div className="meta-item">
                          <i className="fas fa-file me-1"></i>
                          <span className="lesson-type-badge">{lesson.type}</span>
                        </div>
                        {lesson.progress.status === 'completed' && lesson.progress.completedAt && (
                          <div className="meta-item">
                            <i className="fas fa-check me-1"></i>
                            <span>Terminée le {new Date(lesson.progress.completedAt).toLocaleDateString('fr-FR')}</span>
                          </div>
                        )}
                      </div>
                      
                      {lesson.progress.status === 'in_progress' && lesson.progress.videoProgress && (
                        <div className="video-progress">
                          <div className="video-progress-label">
                            Progression vidéo: {lesson.progress.videoProgress?.watchedPercentage || 0}%
                          </div>
                          <div className="video-progress-bar">
                            <div 
                              className="video-progress-fill"
                              style={{ width: `${lesson.progress.videoProgress?.watchedPercentage || 0}%` }}
                            ></div>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="lesson-action">
                      <i className="fas fa-chevron-right"></i>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="no-module-selected">
              <i className="fas fa-folder-open"></i>
              <h3>Sélectionnez un module</h3>
              <p>Choisissez un module dans la sidebar pour voir ses leçons</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CourseProgress;
