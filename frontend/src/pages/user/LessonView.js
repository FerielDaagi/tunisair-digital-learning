import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { lessonsAPI, modulesAPI, coursesAPI } from '../../services/api';
import { Icon, IconSizes, IconColors } from '../../components/common/IconTheme';
import FileViewer from '../../components/common/FileViewer';

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

  if (loading) {
    return (
      <div className="main-content">
        <div className="text-center" style={{ padding: '2rem' }}>
          <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⏳</div>
          <p>Chargement de la leçon...</p>
        </div>
      </div>
    );
  }

  if (error || !lesson) {
    return (
      <div className="main-content">
        <div className="card text-center" style={{ padding: '2rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>❌</div>
          <h2>Leçon non trouvée</h2>
          <p style={{ color: '#6c757d', marginBottom: '1.5rem' }}>
            {error || 'Cette leçon n\'existe pas ou vous n\'y avez pas accès.'}
          </p>
          <button 
            onClick={() => navigate(-1)}
            className="btn btn-primary"
          >
            Retour
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="main-content">
      {/* Breadcrumb */}
      <div style={{ 
        marginBottom: '1.5rem',
        fontSize: '0.9rem',
        color: '#6c757d'
      }}>
        <button 
          onClick={() => navigate(-1)}
          style={{
            background: 'none',
            border: 'none',
            color: '#3b82f6',
            cursor: 'pointer',
            textDecoration: 'underline'
          }}
        >
          ← Retour
        </button>
        {course && (
          <span> • {course.title}</span>
        )}
        {module && (
          <span> • {module.title}</span>
        )}
        {!module && lesson && (
          <span> • Leçon</span>
        )}
      </div>

      {/* Lesson Header */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
          <span style={{ fontSize: '2rem', marginRight: '1rem' }}>
            {getLessonTypeIcon(lesson.type)}
          </span>
          <div>
            <h1 className="card-title" style={{ margin: 0 }}>
              {lesson.title}
            </h1>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '1rem',
              marginTop: '0.5rem',
              fontSize: '0.9rem',
              color: '#6c757d'
            }}>
              <span>{getLessonTypeLabel(lesson.type)}</span>
              <span>•</span>
              <span>{lesson.duration} min</span>
              {lesson.difficulty && (
                <>
                  <span>•</span>
                  <span>Niveau: {lesson.difficulty}</span>
                </>
              )}
            </div>
          </div>
        </div>
        
        {lesson.description && (
          <p style={{ 
            color: '#495057', 
            fontSize: '1.1rem',
            lineHeight: '1.6',
            margin: 0
          }}>
            {lesson.description}
          </p>
        )}
      </div>

      {/* Lesson Content */}
      <div className="grid grid-2">
        {/* Main Content */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Contenu de la leçon</h2>
          </div>
          <div style={{ padding: '1.5rem' }}>
            {lesson.content && (
              <div style={{ 
                marginBottom: '2rem',
                lineHeight: '1.7',
                color: '#495057'
              }}>
                <div style={{ 
                  whiteSpace: 'pre-wrap',
                  fontSize: '1rem'
                }}>
                  {lesson.content}
                </div>
              </div>
            )}

            {/* Video Content */}
            {lesson.type === 'video' && lesson.videoUrl && (
              <div style={{ marginBottom: '2rem' }}>
                <h3 style={{ marginBottom: '1rem', color: '#495057' }}>
                  🎥 Vidéo de la leçon
                </h3>
                <div style={{
                  position: 'relative',
                  width: '100%',
                  height: '0',
                  paddingBottom: '56.25%', // 16:9 aspect ratio
                  backgroundColor: '#000',
                  borderRadius: '8px',
                  overflow: 'hidden'
                }}>
                  <video 
                    src={`http://localhost:5000${lesson.videoUrl}`}
                    controls
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%'
                    }}
                  >
                    Votre navigateur ne supporte pas la lecture vidéo.
                  </video>
                </div>
              </div>
            )}

            {/* Link Content */}
            {lesson.type === 'link' && lesson.linkUrl && (
              <div style={{ marginBottom: '2rem' }}>
                <h3 style={{ marginBottom: '1rem', color: '#495057' }}>
                  🔗 Lien externe
                </h3>
                <div style={{
                  padding: '1rem',
                  backgroundColor: '#f8f9fa',
                  border: '1px solid #e9ecef',
                  borderRadius: '8px'
                }}>
                  <a 
                    href={lesson.linkUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      color: '#3b82f6',
                      textDecoration: 'none',
                      fontSize: '1.1rem',
                      fontWeight: '500'
                    }}
                  >
                    {lesson.linkUrl}
                  </a>
                  <div style={{ 
                    marginTop: '0.5rem',
                    fontSize: '0.9rem',
                    color: '#6c757d'
                  }}>
                    Cliquez pour ouvrir dans un nouvel onglet
                  </div>
                </div>
              </div>
            )}

            {/* File Attachments */}
            {lesson.attachments && lesson.attachments.length > 0 && (
              <div>
                <h3 style={{ marginBottom: '1rem', color: '#495057' }}>
                  📁 Fichiers de la leçon
                </h3>
                <div>
                  {lesson.attachments.map((attachment, index) => (
                    <FileViewer 
                      key={index} 
                      file={attachment}
                      baseUrl="http://localhost:5000"
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div>
          {/* Lesson Info */}
          <div className="card" style={{ marginBottom: '1.5rem' }}>
            <div className="card-header">
              <h3 className="card-title">Informations</h3>
            </div>
            <div style={{ padding: '1.5rem' }}>
              <div style={{ marginBottom: '1rem' }}>
                <strong style={{ color: '#495057' }}>Type:</strong>
                <span style={{ marginLeft: '0.5rem', color: '#6c757d' }}>
                  {getLessonTypeLabel(lesson.type)}
                </span>
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <strong style={{ color: '#495057' }}>Durée:</strong>
                <span style={{ marginLeft: '0.5rem', color: '#6c757d' }}>
                  {lesson.duration} minutes
                </span>
              </div>
              {lesson.difficulty && (
                <div style={{ marginBottom: '1rem' }}>
                  <strong style={{ color: '#495057' }}>Niveau:</strong>
                  <span style={{ marginLeft: '0.5rem', color: '#6c757d' }}>
                    {lesson.difficulty}
                  </span>
                </div>
              )}
              {lesson.isFree && (
                <div style={{ 
                  padding: '0.5rem',
                  backgroundColor: '#d4edda',
                  color: '#155724',
                  borderRadius: '4px',
                  fontSize: '0.9rem',
                  textAlign: 'center',
                  fontWeight: '500'
                }}>
                  🆓 Leçon gratuite
                </div>
              )}
            </div>
          </div>

          {/* Course Info */}
          {course ? (
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">Cours</h3>
              </div>
              <div style={{ padding: '1.5rem' }}>
                <h4 style={{ margin: '0 0 0.5rem 0', color: '#495057' }}>
                  {course.title}
                </h4>
                <p style={{ 
                  margin: '0 0 1rem 0', 
                  color: '#6c757d',
                  fontSize: '0.9rem'
                }}>
                  {course.description}
                </p>
                <div style={{ fontSize: '0.85rem', color: '#6c757d' }}>
                  <div>Instructeur: {course.instructor?.name || 'Non spécifié'}</div>
                  <div>Durée totale: {course.duration || 'Non spécifiée'}</div>
                </div>
              </div>
            </div>
          ) : (
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">Informations du cours</h3>
              </div>
              <div style={{ padding: '1.5rem' }}>
                <p style={{ color: '#6c757d', fontStyle: 'italic' }}>
                  Informations du cours non disponibles
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LessonView;
