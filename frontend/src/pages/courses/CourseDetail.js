import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useParams, Link } from 'react-router-dom';
import { coursesAPI, enrollmentAPI, lessonsAPI, progressAPI } from '../../services/api';
import './CourseDetail.css';

const CourseDetail = () => {
  const { id } = useParams();
  const { addNotification, user } = useAuth();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [checkingEnrollment, setCheckingEnrollment] = useState(false);
  const [courseProgress, setCourseProgress] = useState(null);
  const [lessonsData, setLessonsData] = useState({});
  const [expandedModules, setExpandedModules] = useState({});

  // Fonction pour vérifier si un module est accessible
  const isModuleAccessible = useCallback((moduleIndex) => {
    if (!isEnrolled || !courseProgress) return moduleIndex === 0;
    
    // Le premier module est toujours accessible
    if (moduleIndex === 0) return true;
    
    // Vérifier si le module précédent est complété
    const previousModule = courseProgress.modules[moduleIndex - 1];
    return previousModule && previousModule.progress === 100;
  }, [isEnrolled, courseProgress]);

  // Fonction pour vérifier si une leçon est accessible
  const isLessonAccessible = useCallback((moduleIndex, lessonIndex) => {
    if (!isEnrolled || !courseProgress) return lessonIndex === 0;
    
    // La première leçon du module est accessible si le module est accessible
    if (lessonIndex === 0) return isModuleAccessible(moduleIndex);
    
    // Vérifier si la leçon précédente est commencée ou complétée
    const currentModule = courseProgress.modules[moduleIndex];
    if (!currentModule) return false;
    
    const previousLesson = currentModule.lessons[lessonIndex - 1];
    return previousLesson && (previousLesson.progress.status === 'completed' || previousLesson.progress.status === 'in_progress');
  }, [isEnrolled, courseProgress, isModuleAccessible]);

  // Fonction pour sauvegarder l'état d'inscription dans localStorage
  const saveEnrollmentStatus = (courseId, enrolled) => {
    const enrollments = JSON.parse(localStorage.getItem('enrollments') || '{}');
    enrollments[courseId] = enrolled;
    localStorage.setItem('enrollments', JSON.stringify(enrollments));
  };

  // Fonction pour récupérer l'état d'inscription depuis localStorage
  const getEnrollmentStatus = (courseId) => {
    const enrollments = JSON.parse(localStorage.getItem('enrollments') || '{}');
    return enrollments[courseId] || false;
  };

  // Fonction pour récupérer les leçons d'un module
  const fetchModuleLessons = async (moduleId) => {
    try {
      const response = await lessonsAPI.getByModule(moduleId);
      return response.data.data || response.data || [];
    } catch (error) {
      console.error('Erreur lors de la récupération des leçons:', error);
      return [];
    }
  };

  // Fonction pour récupérer la progression du cours
  const fetchCourseProgress = async () => {
    if (!user || !isEnrolled) return;
    
    try {
      const response = await progressAPI.getCourseProgress(id);
      if (response.data.success) {
        setCourseProgress(response.data.data);
      }
    } catch (error) {
      console.error('Erreur lors de la récupération de la progression:', error);
    }
  };

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        console.log('🔍 Fetching course with ID:', id);
        const response = await coursesAPI.getById(id);
        console.log('📚 Réponse API course detail:', response.data);
        console.log('📚 Course data from API:', response.data.data);
        console.log('📚 Course title from API:', response.data.data?.title);
        
        if (response.data.success) {
          setCourse(response.data.data);
          console.log('✅ Course set successfully:', response.data.data);
          // Vérifier si l'utilisateur est inscrit
          await checkEnrollmentStatus(response.data.data);
        } else {
          console.error('❌ Erreur API:', response.data.message);
          setCourse(null);
        }
      } catch (error) {
        console.error('❌ Error fetching course:', error);
        // Use mock data for demo
        setCourse({
          id: parseInt(id),
          title: 'Fondamentaux React',
          description: 'Apprenez les bases du développement React incluant les composants, l\'état et les props. Ce cours complet couvre tout ce que vous devez savoir pour commencer avec React.',
          longDescription: 'Ce cours est conçu pour les débutants qui veulent apprendre React depuis le début. Vous apprendrez JSX, les composants, la gestion d\'état, les props, la gestion des événements, et plus encore. À la fin de ce cours, vous serez capable de construire vos propres applications React.',
          duration: '8 heures',
          level: 'Débutant',
          category: 'Frontend',
          instructor: 'Jean Dupont',
          rating: 4.5,
          students: 1250,
          price: 49.99,
          modules: [
            {
              id: 1,
              title: 'Introduction à React',
              description: 'Découvrez les concepts fondamentaux de React, son histoire et pourquoi il est devenu si populaire dans le développement web moderne.',
              duration: '45 minutes',
              lessons: 3
            },
            {
              id: 2,
              title: 'Composants et JSX',
              description: 'Apprenez à créer vos premiers composants React et maîtrisez la syntaxe JSX pour construire des interfaces utilisateur dynamiques.',
              duration: '1 heure',
              lessons: 4
            },
            {
              id: 3,
              title: 'État et Props',
              description: 'Explorez la gestion d\'état avec useState et comprenez comment passer des données entre composants via les props.',
              duration: '1.5 heures',
              lessons: 5
            },
            {
              id: 4,
              title: 'Gestion des événements',
              description: 'Maîtrisez la gestion des événements utilisateur et apprenez à créer des interactions dynamiques dans vos applications.',
              duration: '1 heure',
              lessons: 3
            },
            {
              id: 5,
              title: 'Construction d\'une application complète',
              description: 'Appliquez toutes vos connaissances en construisant une application React complète de A à Z avec les meilleures pratiques.',
              duration: '2 heures',
              lessons: 6
            }
          ],
          requirements: [
            'Connaissances de base en HTML, CSS et JavaScript',
            'Un ordinateur avec connexion internet',
            'Éditeur de code (VS Code recommandé)'
          ],
          outcomes: [
            'Comprendre les fondamentaux et concepts de React',
            'Construire des composants réutilisables',
            'Gérer efficacement l\'état et les props',
            'Créer des interfaces utilisateur interactives',
            'Déployer des applications React'
          ]
        });
      } finally {
        setLoading(false);
      }
    };

    fetchCourse();
  }, [id]);

  // Vérifier l'inscription quand l'utilisateur change
  useEffect(() => {
    if (user && course) {
      console.log('🔍 Utilisateur changé, vérification de l\'inscription');
      checkEnrollmentStatus(course);
    } else if (!user) {
      // Si l'utilisateur se déconnecte, nettoyer le localStorage
      console.log('🔍 Utilisateur déconnecté, nettoyage du localStorage');
      localStorage.removeItem('enrollments');
      setIsEnrolled(false);
    }
  }, [user, course]);

  // Charger la progression quand l'utilisateur est inscrit
  useEffect(() => {
    if (isEnrolled && user) {
      fetchCourseProgress();
    }
  }, [isEnrolled, user, id]);

  // Charger les leçons pour chaque module
  useEffect(() => {
    if (course && course.modules) {
      const loadLessons = async () => {
        const lessonsPromises = course.modules.map(async (module) => {
          const lessons = await fetchModuleLessons(module._id || module.id);
          return { moduleId: module._id || module.id, lessons };
        });
        
        const results = await Promise.all(lessonsPromises);
        const lessonsMap = {};
        results.forEach(({ moduleId, lessons }) => {
          lessonsMap[moduleId] = lessons;
        });
        setLessonsData(lessonsMap);
      };
      
      loadLessons();
    }
  }, [course]);

  const checkEnrollmentStatus = async (courseData) => {
    if (!user) {
      setIsEnrolled(false);
      setCheckingEnrollment(false);
      return;
    }

    setCheckingEnrollment(true);
    const courseId = courseData._id || courseData.id;

    // 1. Vérifier d'abord dans localStorage (le plus rapide)
    const localEnrollment = getEnrollmentStatus(courseId);
    if (localEnrollment) {
      console.log('✅ Inscription trouvée dans localStorage');
      setIsEnrolled(true);
      setCheckingEnrollment(false);
      return;
    }

    // 2. Vérifier dans la liste des étudiants inscrits du cours
    if (courseData.enrolledStudents && courseData.enrolledStudents.length > 0) {
      const enrolled = courseData.enrolledStudents.some(student => 
        student._id === user.id || student === user.id
      );
      console.log('🔍 Vérification dans enrolledStudents:', enrolled);
      if (enrolled) {
        // Sauvegarder dans localStorage pour la prochaine fois
        saveEnrollmentStatus(courseId, true);
      }
      setIsEnrolled(enrolled);
      setCheckingEnrollment(false);
      return;
    }

    // 3. Si pas de liste d'étudiants, essayer de vérifier via l'API
    try {
      console.log('🔍 Vérification via API pour le cours:', courseId);
      const response = await enrollmentAPI.enrollInCourse(courseId);
      if (response.data.success) {
        console.log('✅ Inscription réussie via API');
        setIsEnrolled(true);
        saveEnrollmentStatus(courseId, true);
      }
    } catch (error) {
      console.log('🔍 Erreur API:', error.response?.status, error.response?.data?.message);
      // Si erreur 400 avec "déjà inscrit", l'utilisateur est inscrit
      if (error.response?.status === 400 && 
          error.response?.data?.message?.includes('déjà inscrit')) {
        console.log('✅ Utilisateur déjà inscrit détecté');
        setIsEnrolled(true);
        saveEnrollmentStatus(courseId, true);
      } else {
        console.log('❌ Utilisateur non inscrit');
        setIsEnrolled(false);
        saveEnrollmentStatus(courseId, false);
      }
    }
    
    setCheckingEnrollment(false);
  };

  const handleEnroll = async () => {
    setEnrolling(true);
    try {
      if (isEnrolled) {
        // Annuler l'inscription
        console.log('🔍 Annulation de l\'inscription au cours:', id);
        // Simuler l'annulation d'inscription
        addNotification('Votre inscription au cours a été annulée !', 'info');
        setIsEnrolled(false);
        // Sauvegarder l'annulation dans localStorage
        saveEnrollmentStatus(id, false);
        // Mettre à jour la liste des étudiants inscrits
        if (course) {
          setCourse(prev => ({
            ...prev,
            enrolledStudents: (prev.enrolledStudents || []).filter(student => 
              student._id !== user.id && student !== user.id
            )
          }));
        }
      } else {
        // S'inscrire au cours
        console.log('🔍 Tentative d\'inscription au cours:', id);
        const response = await enrollmentAPI.enrollInCourse(id);
        console.log('📋 Réponse d\'inscription:', response.data);
        
        if (response.data.success) {
          addNotification('Votre inscription au cours a été effectuée avec succès !', 'success');
          setIsEnrolled(true);
          // Sauvegarder l'inscription dans localStorage
          saveEnrollmentStatus(id, true);
          // Mettre à jour la liste des étudiants inscrits
          if (course) {
            setCourse(prev => ({
              ...prev,
              enrolledStudents: [...(prev.enrolledStudents || []), user.id]
            }));
          }
        } else {
          // Si l'utilisateur est déjà inscrit, on le considère comme inscrit
          if (response.data.message && response.data.message.includes('déjà inscrit')) {
            addNotification('Vous êtes déjà inscrit à ce cours', 'info');
            setIsEnrolled(true);
            saveEnrollmentStatus(id, true);
          } else {
            addNotification(response.data.message || 'Erreur lors de l\'inscription', 'error');
          }
        }
      }
    } catch (error) {
      console.error('❌ Erreur lors de l\'inscription:', error);
      const errorMessage = error.response?.data?.message || 'Erreur lors de l\'inscription au cours';
      
      // Si l'utilisateur est déjà inscrit, on le considère comme inscrit
      if (errorMessage.includes('déjà inscrit')) {
        addNotification('Vous êtes déjà inscrit à ce cours', 'info');
        setIsEnrolled(true);
        saveEnrollmentStatus(id, true);
      } else {
        addNotification(errorMessage, 'error');
      }
    } finally {
      setEnrolling(false);
    }
  };

  const handleModuleAccess = async (moduleId, moduleIndex) => {
    if (!isEnrolled) {
      addNotification('Vous devez être inscrit au cours pour accéder au contenu', 'warning');
      return;
    }

    // Vérifier si le module est accessible
    if (!isModuleAccessible(moduleIndex)) {
      addNotification('Vous devez compléter le module précédent avant d\'accéder à celui-ci', 'warning');
      return;
    }
    
    try {
      // Récupérer les leçons du module
      const lessons = lessonsData[moduleId] || [];
      
      if (lessons && lessons.length > 0) {
        // Trier les leçons par ordre et prendre la première accessible
        const sortedLessons = lessons.sort((a, b) => (a.order || 0) - (b.order || 0));
        const firstAccessibleLesson = sortedLessons.find((lesson, index) => 
          isLessonAccessible(moduleIndex, index)
        );
        
        if (firstAccessibleLesson) {
          // Rediriger vers la première leçon accessible
          window.location.href = `/lesson/${firstAccessibleLesson._id}`;
        } else {
          addNotification('Aucune leçon accessible dans ce module', 'info');
        }
      } else {
        addNotification('Aucune leçon disponible dans ce module', 'info');
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des leçons:', error);
      addNotification('Erreur lors du chargement des leçons', 'error');
    }
  };

  const handleLessonAccess = (lessonId, moduleIndex, lessonIndex) => {
    if (!isEnrolled) {
      addNotification('Vous devez être inscrit au cours pour accéder au contenu', 'warning');
      return;
    }

    // Vérifier si la leçon est accessible
    if (!isLessonAccessible(moduleIndex, lessonIndex)) {
      addNotification('Vous devez compléter la leçon précédente avant d\'accéder à celle-ci', 'warning');
      return;
    }

    // Rediriger vers la leçon
    window.location.href = `/lesson/${lessonId}`;
  };

  const handleModuleClick = (moduleId, moduleIndex) => {
    if (isEnrolled) {
      handleModuleAccess(moduleId, moduleIndex);
    } else {
      addNotification('Inscrivez-vous au cours pour accéder au contenu des modules', 'info');
    }
  };

  const toggleModuleLessons = (moduleId, e) => {
    e.stopPropagation(); // Empêcher le clic sur le module
    setExpandedModules(prev => ({
      ...prev,
      [moduleId]: !prev[moduleId]
    }));
  };

  if (loading) {
    return (
      <div className="main-content">
        <div className="text-center">
          <p>Chargement du cours...</p>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="main-content">
        <div className="card text-center">
          <h2>Cours non trouvé</h2>
          <Link to="/courses" className="btn btn-primary">
            Retour aux cours
          </Link>
        </div>
      </div>
    );
  }

  // Debug: Afficher les données du cours
  console.log('🔍 Course data in render:', course);
  console.log('🔍 Course title:', course?.title);
  console.log('🔍 Course loading:', loading);

  // Si le cours n'est pas encore chargé, afficher un message
  if (!course && !loading) {
    return (
      <div className="course-detail-container">
        <div className="course-hero card">
          <div className="course-hero-inner">
            <div className="course-hero-main">
              <h1 className="course-detail-title">Cours non trouvé</h1>
              <p className="course-subtitle">Ce cours n'existe pas ou a été supprimé.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="course-detail-container">
      <div className="course-hero card">
        <div className="course-hero-inner">
          <div className="course-hero-main">
            <h1 className="course-detail-title">{course?.title || 'Chargement...'}</h1>
            <p className="course-subtitle">{course.description || 'Description du cours'}</p>
            <div className="course-tags">
              <span className="tag tag-level">{course.level}</span>
              <span className="tag tag-category">{course.category}</span>
            </div>
            <div className="course-quick-stats">
              <span className="stat"><i className="fas fa-users" /> {course.enrolledStudents?.length || course.students || 0} apprentis inscrits</span>
              <span className="stat"><i className="fas fa-clock" /> {course.duration}</span>
            </div>
          </div>
          <div className="course-hero-actions">
            <button
              onClick={handleEnroll}
              disabled={enrolling || checkingEnrollment}
              className={`btn btn-lg ${isEnrolled ? 'btn-danger' : 'btn-primary'}`}
            >
              {checkingEnrollment ? (
                'Vérification...'
              ) : enrolling ? (
                isEnrolled ? 'Annulation...' : 'Inscription...'
              ) : (
                isEnrolled ? 'Annuler l\'inscription' : 'S\'inscrire maintenant'
              )}
            </button>
            {isEnrolled && (
              <div className="enrollment-status">
                <div className="enrollment-badge">
                  <i className="fas fa-check-circle"></i>
                  <span>Inscrit</span>
                </div>
                <Link to="/my-courses" className="btn btn-outline btn-lg">
                  Mes cours
                </Link>
              </div>
            )}
            <Link to="/courses" className="btn btn-outline btn-lg">
              Retour aux cours
            </Link>
          </div>
        </div>
      </div>

      <div className="course-content-grid">
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Contenu du cours</h2>
          </div>
          <div className="module-list">
            {course.modules.map((module, moduleIndex) => {
              const moduleId = module._id || module.id;
              const lessons = lessonsData[moduleId] || [];
              const isAccessible = isModuleAccessible(moduleIndex);
              const moduleProgress = courseProgress?.modules?.[moduleIndex];
              const isExpanded = expandedModules[moduleId] || false;
              
              return (
                <div 
                  key={moduleId} 
                  className={`module-item ${!isAccessible ? 'module-locked' : ''}`}
                  onClick={() => handleModuleClick(moduleId, moduleIndex)}
                >
                  <div className="module-content">
                    <div className="module-header">
                      <div className="module-title-container">
                        <h4 className="module-title">
                          {module.title}
                          {!isAccessible && <i className="fas fa-lock module-lock-icon"></i>}
                        </h4>
                        <button 
                          className={`module-toggle-btn ${isExpanded ? 'expanded' : ''}`}
                          onClick={(e) => toggleModuleLessons(moduleId, e)}
                          title={isExpanded ? 'Masquer les leçons' : 'Afficher les leçons'}
                        >
                          <i className="fas fa-chevron-down"></i>
                        </button>
                      </div>
                      <div className="module-meta">
                        <span className="module-lessons">
                          <i className="fas fa-book"></i>
                          {lessons.length} leçons
                        </span>
                        <span className="module-duration">
                          <i className="fas fa-clock"></i>
                          {module.duration}
                        </span>
                        {isEnrolled && moduleProgress && (
                          <span className="module-progress">
                            <i className="fas fa-chart-line"></i>
                            {moduleProgress.progress}% complété
                          </span>
                        )}
                      </div>
                    </div>
                    {module.description && (
                      <p className="module-description">
                        {module.description}
                      </p>
                    )}
                    
                    {/* Affichage des leçons */}
                    {lessons.length > 0 && isExpanded && (
                      <div className="module-lessons-list">
                        <h5 className="lessons-title">Leçons :</h5>
                        <div className="lessons-container">
                          {lessons
                            .sort((a, b) => (a.order || 0) - (b.order || 0))
                            .map((lesson, lessonIndex) => {
                              const isLessonAccessibleValue = isLessonAccessible(moduleIndex, lessonIndex);
                              const lessonProgress = moduleProgress?.lessons?.[lessonIndex];
                              
                              return (
                                <div 
                                  key={lesson._id} 
                                  className={`lesson-item ${!isLessonAccessibleValue ? 'lesson-locked' : ''} ${lessonProgress?.progress?.status === 'completed' ? 'lesson-completed' : ''}`}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleLessonAccess(lesson._id, moduleIndex, lessonIndex);
                                  }}
                                >
                                  <div className="lesson-content">
                                    <div className="lesson-header">
                                      <span className="lesson-number">{lessonIndex + 1}</span>
                                      <h6 className="lesson-title">
                                        {lesson.title}
                                        {!isLessonAccessibleValue && <i className="fas fa-lock lesson-lock-icon"></i>}
                                        {lessonProgress?.progress?.status === 'completed' && <i className="fas fa-check-circle lesson-completed-icon"></i>}
                                      </h6>
                                    </div>
                                    <div className="lesson-meta">
                                      <span className="lesson-duration">
                                        <i className="fas fa-clock"></i>
                                        {lesson.duration}
                                      </span>
                                      <span className="lesson-type">
                                        <i className={`fas fa-${lesson.type === 'video' ? 'play-circle' : lesson.type === 'text' ? 'file-text' : 'link'}`}></i>
                                        {lesson.type}
                                      </span>
                                    </div>
                                  </div>
                                  <div className="lesson-actions">
                                    {isLessonAccessibleValue ? (
                                      <button className="btn-lesson-access">
                                        <i className="fas fa-arrow-right"></i>
                                      </button>
                                    ) : (
                                      <div className="lesson-locked-indicator">
                                        <i className="fas fa-lock"></i>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="module-actions">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleModuleAccess(moduleId, moduleIndex);
                      }}
                      className={`btn-play ${!isEnrolled || !isAccessible ? 'btn-play-disabled' : ''}`}
                      title={!isEnrolled ? "Inscrivez-vous pour accéder" : !isAccessible ? "Module verrouillé" : "Accéder aux leçons"}
                    >
                      <i className="fas fa-play"></i>
                      <span>{lessons.length} leçons</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div>
          <div className="card mb-3">
            <div className="card-header">
              <h3 className="card-title">Prérequis</h3>
            </div>
            <ul className="list">
              {course.requirements.map((req, index) => (
                <li key={index} className="list-item">
                  {req}
                </li>
              ))}
            </ul>
          </div>

          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Ce que vous apprendrez</h3>
            </div>
            <ul className="list">
              {course.outcomes.map((outcome, index) => (
                <li key={index} className="list-item">
                  {outcome}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Instructeur</h2>
        </div>
        <div className="instructor">
          <div className="instructor-avatar">
            {course.instructor?.profile?.avatar ? (
              <img 
                src={course.instructor.profile.avatar} 
                alt={`Photo de ${course.instructor?.name || course.instructor}`}
                className="instructor-avatar-img"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'flex';
                }}
              />
            ) : null}
            <div className="instructor-avatar-fallback" style={{ display: course.instructor?.profile?.avatar ? 'none' : 'flex' }}>
              {(course.instructor?.name || course.instructor || 'I').charAt(0)}
            </div>
          </div>
          <div>
            <h3 className="instructor-name">{course.instructor?.name || course.instructor}</h3>
            <p className="instructor-bio">
              {course.instructor?.profile?.bio || 'Aucune biographie disponible.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseDetail; 