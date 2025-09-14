import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useParams, Link } from 'react-router-dom';
import { coursesAPI, enrollmentAPI, lessonsAPI, progressAPI, courseReviewsAPI, repliesAPI, certificatesAPI } from '../../services/api';
import './CourseDetail.css';

const CourseDetail = () => {
  const { id } = useParams();
  const { addNotification, user } = useAuth();

  // Helper function to safely extract name from user object
  const getUserDisplayName = (userObj) => {
    if (!userObj) return 'Utilisateur';
    
    // If it's already a string, return it
    if (typeof userObj === 'string') return userObj;
    
    // If it's an object, try to extract name properties
    if (typeof userObj === 'object') {
      return userObj.name || 
             (userObj.firstName && userObj.lastName ? `${userObj.firstName} ${userObj.lastName}` : '') ||
             userObj.firstName ||
             userObj.lastName ||
             'Utilisateur';
    }
    
    return 'Utilisateur';
  };
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [checkingEnrollment, setCheckingEnrollment] = useState(false);
  const [courseProgress, setCourseProgress] = useState(null);
  const [lessonsData, setLessonsData] = useState({});
  const [expandedModules, setExpandedModules] = useState({});
  
  // États pour les commentaires et évaluations
  const [reviews, setReviews] = useState([]);
  const [userReview, setUserReview] = useState(null);
  const [reviewStats, setReviewStats] = useState(null);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewForm, setReviewForm] = useState({ rating: 0, comment: '' });
  const [submittingReview, setSubmittingReview] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [submittingReply, setSubmittingReply] = useState(false);
  const [replies, setReplies] = useState({});
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [downloadingCertificate, setDownloadingCertificate] = useState(false);

  // Fonction pour vérifier si un module est accessible
  const isModuleAccessible = useCallback((moduleIndex) => {
    // Les tuteurs peuvent accéder à tous les modules
    if (user?.role === 'tuteur') return true;
    
    if (!isEnrolled || !courseProgress) return moduleIndex === 0;
    
    // Le premier module est toujours accessible
    if (moduleIndex === 0) return true;
    
    // Vérifier si le module précédent est complété
    const previousModule = courseProgress.modules[moduleIndex - 1];
    return previousModule && previousModule.progress === 100;
  }, [isEnrolled, courseProgress, user?.role]);

  // Fonction pour vérifier si une leçon est accessible
  const isLessonAccessible = useCallback((moduleIndex, lessonIndex) => {
    // Les tuteurs peuvent accéder à toutes les leçons
    if (user?.role === 'tuteur') return true;
    
    if (!isEnrolled || !courseProgress) return lessonIndex === 0;
    
    // La première leçon du module est accessible si le module est accessible
    if (lessonIndex === 0) return isModuleAccessible(moduleIndex);
    
    // Vérifier si la leçon précédente est commencée ou complétée
    const currentModule = courseProgress.modules[moduleIndex];
    if (!currentModule) return false;
    
    const previousLesson = currentModule.lessons[lessonIndex - 1];
    return previousLesson && (previousLesson.progress.status === 'completed' || previousLesson.progress.status === 'in_progress');
  }, [isEnrolled, courseProgress, isModuleAccessible, user?.role]);

  // Fonction pour vérifier si le cours est terminé à 100%
  const isCourseCompleted = useCallback(() => {
    if (!isEnrolled || !courseProgress || user?.role === 'tuteur') return false;
    
    // Vérifier si tous les modules sont complétés à 100%
    return courseProgress.modules.every(module => module.progress === 100);
  }, [isEnrolled, courseProgress, user?.role]);

  // Fonction pour vérifier si l'utilisateur a commencé le cours
  const hasStartedCourse = useCallback(() => {
    if (!isEnrolled || !courseProgress) return false;
    
    // Vérifier si au moins une leçon a été commencée ou complétée
    return courseProgress.modules.some(module => 
      module.lessons && module.lessons.some(lesson => 
        lesson.progress && (lesson.progress.status === 'in_progress' || lesson.progress.status === 'completed')
      )
    );
  }, [isEnrolled, courseProgress]);

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
  const fetchCourseProgress = useCallback(async () => {
    if (!user || !isEnrolled) return;
    
    try {
      const response = await progressAPI.getCourseProgress(id);
      if (response.data.success) {
        setCourseProgress(response.data.data);
      }
    } catch (error) {
      console.error('Erreur lors de la récupération de la progression:', error);
    }
  }, [user, isEnrolled, id]);

  // Fonction pour télécharger un certificat existant
  const downloadExistingCertificate = async (certificate, courseTitle) => {
    try {
      console.log('🔍 Tentative de téléchargement du certificat:', certificate);
      console.log('🔍 Type de certificate:', typeof certificate);
      console.log('🔍 Certificate._id:', certificate._id);
      console.log('🔍 Certificate.id:', certificate.id);
      
      // Utiliser l'ID du certificat, pas le numéro
      const certificateId = certificate._id || certificate.id;
      console.log('🔍 CertificateId final:', certificateId);
      
      if (!certificateId) {
        throw new Error('ID du certificat non trouvé');
      }
      
      const response = await certificatesAPI.downloadCertificate(certificateId);
      
      console.log('📄 Réponse du téléchargement:', response);
      console.log('📄 Type de données:', typeof response.data);
      console.log('📄 Taille des données:', response.data?.size || response.data?.length);
      
      // Vérifier que nous avons des données
      if (!response.data) {
        throw new Error('Aucune donnée reçue du serveur');
      }
      
      // Créer un blob et télécharger le fichier
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      // Nom du fichier basé sur le titre du cours
      const fileName = `Certificat_${courseTitle.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
      link.download = fileName;
      
      // Ajouter le lien au DOM, cliquer, puis le supprimer
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Nettoyer l'URL après un délai
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
      }, 1000);
      
      addNotification('Certificat téléchargé avec succès !', 'success');
    } catch (error) {
      console.error('❌ Erreur lors du téléchargement:', error);
      console.error('❌ Détails de l\'erreur:', error.response?.data);
      
      if (error.response?.status === 404) {
        addNotification('Certificat non trouvé. Il se peut qu\'il ne soit pas encore généré.', 'warning');
      } else if (error.response?.status === 403) {
        addNotification('Vous n\'avez pas l\'autorisation de télécharger ce certificat.', 'error');
      } else {
        addNotification('Erreur lors du téléchargement du certificat. Veuillez réessayer.', 'error');
      }
    }
  };

  // Fonction pour télécharger le certificat
  const handleDownloadCertificate = async () => {
    if (!course || !user) {
      addNotification('Erreur: informations manquantes pour le téléchargement', 'error');
      return;
    }
    
    console.log('🔍 Début du téléchargement du certificat pour le cours:', course._id || course.id);
    setDownloadingCertificate(true);
    
    try {
      // D'abord, essayer de récupérer le certificat existant
      console.log('🔍 Récupération des certificats existants...');
      const response = await certificatesAPI.getStudentCertificates();
      
      if (response.data.success) {
        console.log('✅ Certificats récupérés:', response.data.data.certificates);
        
        const existingCertificate = response.data.data.certificates.find(
          cert => cert.course._id === (course._id || course.id)
        );
        
        if (existingCertificate) {
          console.log('✅ Certificat existant trouvé:', existingCertificate._id);
          // Télécharger le certificat existant
          await downloadExistingCertificate(existingCertificate, course.title);
        } else {
          console.log('❌ Aucun certificat existant trouvé');
          // Si pas de certificat existant, essayer de le créer
          if (isCourseCompleted() || courseProgress?.overallProgress >= 80) {
            addNotification('Création du certificat en cours...', 'info');
            
            try {
              console.log('🔄 Tentative de création du certificat...');
              const createResponse = await certificatesAPI.createCertificate(course._id || course.id);
              
              if (createResponse.data.success) {
                console.log('✅ Certificat créé avec succès:', createResponse.data.data.certificate);
                addNotification('Certificat créé avec succès !', 'success');
                
                // Télécharger le certificat nouvellement créé
                const newCertificate = createResponse.data.data.certificate;
                console.log('📄 Certificat créé:', newCertificate);
                await downloadExistingCertificate(newCertificate, course.title);
              } else {
                addNotification(createResponse.data.message || 'Erreur lors de la création du certificat', 'error');
              }
            } catch (createError) {
              console.error('❌ Erreur lors de la création du certificat:', createError);
              const errorMessage = createError.response?.data?.message || 'Erreur lors de la création du certificat';
              addNotification(errorMessage, 'error');
            }
          } else {
            const progress = courseProgress?.overallProgress || 0;
            addNotification(`Vous devez terminer le cours à au moins 80% pour obtenir un certificat. Progression actuelle: ${progress}%`, 'warning');
          }
        }
      } else {
        console.error('❌ Erreur API lors de la récupération des certificats:', response.data.message);
        addNotification('Erreur lors de la récupération des certificats', 'error');
      }
    } catch (error) {
      console.error('❌ Erreur lors de la récupération du certificat:', error);
      console.error('❌ Détails de l\'erreur:', error.response?.data);
      addNotification('Erreur lors de la récupération du certificat', 'error');
    } finally {
      setDownloadingCertificate(false);
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

  // Charger les commentaires et évaluations
  useEffect(() => {
    if (course) {
      fetchCourseReviews();
      if (user) {
        fetchUserReview();
      }
    }
  }, [course, user]);

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

  const checkEnrollmentStatus = useCallback(async (courseData) => {
    if (!user) {
      setIsEnrolled(false);
      setCheckingEnrollment(false);
      return;
    }

    // Les tuteurs sont considérés comme ayant accès à tous les cours
    if (user.role === 'tuteur') {
      setIsEnrolled(true);
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

    // 3. Vérifier via l'API des cours de l'étudiant
    try {
      console.log('🔍 Vérification via API des cours de l\'étudiant pour le cours:', courseId);
      const response = await enrollmentAPI.getStudentCourses();
      if (response.data.success && response.data.data) {
        const studentCourses = response.data.data.courses || response.data.data;
        const enrolled = studentCourses.some(studentCourse => 
          studentCourse._id === courseId || studentCourse.id === courseId
        );
        console.log('🔍 Vérification dans les cours de l\'étudiant:', enrolled);
        if (enrolled) {
          saveEnrollmentStatus(courseId, true);
        }
        setIsEnrolled(enrolled);
      } else {
        console.log('❌ Aucune information d\'inscription trouvée');
        setIsEnrolled(false);
        saveEnrollmentStatus(courseId, false);
      }
    } catch (error) {
      console.log('🔍 Erreur lors de la vérification des cours de l\'étudiant:', error.response?.status, error.response?.data?.message);
      console.log('❌ Aucune information d\'inscription trouvée');
      setIsEnrolled(false);
      saveEnrollmentStatus(courseId, false);
    }
    
    setCheckingEnrollment(false);
  }, [user, saveEnrollmentStatus]);

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

  // Fonctions pour les commentaires et évaluations
  const fetchCourseReviews = useCallback(async () => {
    if (!course) return;
    
    setLoadingReviews(true);
    try {
      console.log('🔍 Chargement des commentaires pour le cours:', course._id || course.id);
      const response = await courseReviewsAPI.getCourseReviews(course._id || course.id, {
        page: 1,
        limit: 10,
        sortBy: 'createdAt',
        sortOrder: 'desc'
      });
      
      console.log('📋 Réponse API commentaires:', response.data);
      
      if (response.data.success) {
        console.log('✅ Commentaires chargés:', response.data.data.reviews);
        console.log('📊 Statistiques:', response.data.data.stats);
        setReviews(response.data.data.reviews);
        setReviewStats(response.data.data.stats);
        
        // Charger les réponses pour tous les commentaires
        const allReplies = {};
        for (const review of response.data.data.reviews) {
          try {
            const repliesResponse = await repliesAPI.getRepliesByReview(review._id);
            if (repliesResponse.data.success && repliesResponse.data.data.replies.length > 0) {
              allReplies[review._id] = repliesResponse.data.data.replies;
            }
          } catch (error) {
            console.error(`Erreur lors du chargement des réponses pour le commentaire ${review._id}:`, error);
          }
        }
        setReplies(allReplies);
      } else {
        console.log('❌ Erreur API:', response.data.message);
      }
    } catch (error) {
      console.error('❌ Erreur lors du chargement des commentaires:', error);
      console.error('❌ Détails de l\'erreur:', error.response?.data);
    } finally {
      setLoadingReviews(false);
    }
  }, [course]);

  const fetchUserReview = useCallback(async () => {
    if (!course || !user) return;
    
    try {
      const response = await courseReviewsAPI.getUserReview(course._id || course.id);
      if (response.data.success) {
        setUserReview(response.data.data.review);
        if (response.data.data.review) {
          setReviewForm({
            rating: response.data.data.review.rating,
            comment: response.data.data.review.comment || ''
          });
        }
      }
    } catch (error) {
      console.error('Erreur lors du chargement du commentaire utilisateur:', error);
    }
  }, [course, user]);

  const handleSubmitReview = async () => {
    if (!course || !user || reviewForm.rating === 0) {
      addNotification('Veuillez sélectionner une note', 'warning');
      return;
    }

    if (!isEnrolled) {
      addNotification('Vous devez être inscrit au cours pour le commenter', 'warning');
      return;
    }

    setSubmittingReview(true);
    try {
      console.log('🔍 Soumission du commentaire pour le cours:', course._id || course.id);
      console.log('📝 Données du commentaire:', {
        rating: reviewForm.rating,
        comment: reviewForm.comment
      });

      const response = await courseReviewsAPI.createOrUpdateReview(
        course._id || course.id,
        {
          rating: reviewForm.rating,
          comment: reviewForm.comment
        }
      );

      console.log('📋 Réponse de soumission:', response.data);

      if (response.data.success) {
        addNotification(response.data.message, 'success');
        setUserReview(response.data.data.review);
        setShowReviewForm(false);
        // Recharger les commentaires pour mettre à jour les statistiques
        console.log('🔄 Rechargement des commentaires...');
        await fetchCourseReviews();
      }
    } catch (error) {
      console.error('❌ Erreur lors de la soumission du commentaire:', error);
      console.error('❌ Détails de l\'erreur:', error.response?.data);
      addNotification(
        error.response?.data?.message || 'Erreur lors de la soumission du commentaire',
        'error'
      );
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleDeleteReview = async () => {
    if (!course || !user || !userReview) return;

    if (window.confirm('Êtes-vous sûr de vouloir supprimer votre commentaire ?')) {
      try {
        const response = await courseReviewsAPI.deleteReview(course._id || course.id);
        if (response.data.success) {
          addNotification('Commentaire supprimé avec succès', 'success');
          setUserReview(null);
          setReviewForm({ rating: 0, comment: '' });
          // Recharger les commentaires pour mettre à jour les statistiques
          await fetchCourseReviews();
        }
      } catch (error) {
        console.error('Erreur lors de la suppression du commentaire:', error);
        addNotification('Erreur lors de la suppression du commentaire', 'error');
      }
    }
  };

  const handleToggleHelpfulVote = async (reviewId) => {
    if (!user) {
      addNotification('Vous devez être connecté pour voter', 'warning');
      return;
    }

    try {
      const response = await courseReviewsAPI.toggleHelpfulVote(reviewId);
      if (response.data.success) {
        // Mettre à jour le nombre de votes dans la liste des commentaires
        setReviews(prev => prev.map(review => 
          review._id === reviewId 
            ? { ...review, helpfulVotes: response.data.data.helpfulVotes }
            : review
        ));
      }
    } catch (error) {
      console.error('Erreur lors du vote:', error);
      addNotification('Erreur lors du vote', 'error');
    }
  };

  const handleReplyToReview = (reviewId) => {
    setReplyingTo(reviewId);
    setReplyText('');
  };

  const handleCancelReply = () => {
    setReplyingTo(null);
    setReplyText('');
  };

  const handleSubmitReply = async (reviewId) => {
    if (!replyText.trim()) {
      addNotification('Veuillez saisir une réponse', 'warning');
      return;
    }

    setSubmittingReply(true);
    try {
      const response = await repliesAPI.createReply(reviewId, { text: replyText });
      
      if (response.data.success) {
        // Ajouter la réponse à l'état local
        setReplies(prev => ({
          ...prev,
          [reviewId]: [...(prev[reviewId] || []), response.data.data.reply]
        }));

        addNotification('Réponse ajoutée avec succès', 'success');
        setReplyingTo(null);
        setReplyText('');
      } else {
        addNotification(response.data.message || 'Erreur lors de l\'ajout de la réponse', 'error');
      }
    } catch (error) {
      console.error('Erreur lors de l\'ajout de la réponse:', error);
      addNotification(error.response?.data?.message || 'Erreur lors de l\'ajout de la réponse', 'error');
    } finally {
      setSubmittingReply(false);
    }
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
            <div className="course-title-with-rating">
              <h1 className="course-detail-title">{course?.title || 'Chargement...'}</h1>
              <div className="course-rating-display">
                {reviewStats && (reviewStats.totalReviews > 0 || reviewStats.averageRating > 0) ? (
                  <div className="rating-display-enhanced">
                    <div className="rating-number">
                      <span className="rating-value">{reviewStats.averageRating.toFixed(1)}</span>
                      <span className="rating-max">/5</span>
                    </div>
                    <div className="rating-stars">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <span
                          key={star}
                          className={`css-star ${star <= Math.round(reviewStats.averageRating) ? 'active' : ''}`}
                        ></span>
                      ))}
                    </div>
                  </div>
                ) : (
                  <span className="rating-text">
                    <i className="fas fa-star me-1"></i>
                    Pas encore d'évaluations
                  </span>
                )}
              </div>
            </div>
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
                <Link to="/courses" className="btn btn-outline btn-lg">
                  Mes cours
                </Link>
              </div>
            )}
            {isEnrolled && isCourseCompleted() && user?.role === 'apprenti' && (
              <div className="certificate-section">
                <div className="certificate-badge">
                  <i className="fas fa-certificate"></i>
                  <span>Félicitations ! Cours terminé</span>
                </div>
                <button
                  onClick={handleDownloadCertificate}
                  disabled={downloadingCertificate}
                  className="btn btn-success btn-lg certificate-btn"
                >
                  {downloadingCertificate ? (
                    <>
                      <i className="fas fa-spinner fa-spin"></i>
                      Téléchargement...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-download"></i>
                      Obtenir certificat
                    </>
                  )}
                </button>
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
                alt={getUserDisplayName(course.instructor)}
                className="instructor-avatar-img"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'flex';
                }}
              />
            ) : null}
            <div className="instructor-avatar-fallback" style={{ display: course.instructor?.profile?.avatar ? 'none' : 'flex' }}>
              {getUserDisplayName(course.instructor).charAt(0)}
            </div>
          </div>
          <div>
            <h3 className="instructor-name">
              {getUserDisplayName(course.instructor) || 'Instructeur'}
            </h3>
            <p className="instructor-bio">
              {course.instructor?.profile?.bio || 'Aucune biographie disponible.'}
            </p>
          </div>
        </div>
      </div>

      {/* Section Commentaires et Évaluations */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">
            <i className="fas fa-star me-2"></i>
            Commentaires et Évaluations
          </h2>
        </div>
        <div className="card-body">
          

          {/* Formulaire d'évaluation utilisateur */}
          {user && isEnrolled && (
            <div className="user-review-section mb-4">
              {userReview ? (
                <div className="user-review-display">
                  <h4>Votre évaluation</h4>
                  <div className="user-review-content">
                    <div className="rating-display mb-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <span
                          key={star}
                          className={`css-star ${star <= userReview.rating ? 'active' : ''}`}
                        ></span>
                      ))}
                      <span className="ms-2">{userReview.rating}/5</span>
                    </div>
                    {userReview.comment && (
                      <p className="user-review-comment">{userReview.comment}</p>
                    )}
                    <div className="user-review-actions">
                      <button
                        className="btn btn-sm btn-outline-primary me-2"
                        onClick={() => setShowReviewForm(true)}
                      >
                        <i className="fas fa-edit me-1"></i>
                        Modifier
                      </button>
                      <button
                        className="btn btn-sm btn-outline-danger"
                        onClick={handleDeleteReview}
                      >
                        <i className="fas fa-trash me-1"></i>
                        Supprimer
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="no-user-review">
                  <h4>Évaluez ce cours</h4>
                  <p className="text-muted">Partagez votre avis avec la communauté</p>
                  <button
                    className="btn btn-primary"
                    onClick={() => setShowReviewForm(true)}
                  >
                    <i className="fas fa-star me-1"></i>
                    Évaluer le cours
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Formulaire d'évaluation */}
          {showReviewForm && (
            <div className="review-form-section mb-4">
              <div className="card">
                <div className="card-header">
                  <h4>
                    {userReview ? 'Modifier votre évaluation' : 'Évaluer ce cours'}
                  </h4>
                </div>
                <div className="card-body">
                  <div className="mb-3">
                    <label className="form-label">Note *</label>
                    <div className="rating-input">
                      {[1, 2, 3, 4, 5].map((rating) => (
                        <button
                          key={rating}
                          type="button"
                          className={`star-btn ${rating <= reviewForm.rating ? 'active' : ''}`}
                          onClick={() => setReviewForm(prev => ({ ...prev, rating: rating }))}
                          title={`Noter ${rating} sur 5`}
                        >
                          <span className="css-star"></span>
                        </button>
                      ))}
                      <span className="ms-2">
                        {reviewForm.rating === 0 ? 'Sélectionnez une note' :
                         reviewForm.rating === 1 ? 'Très mauvais' :
                         reviewForm.rating === 2 ? 'Mauvais' :
                         reviewForm.rating === 3 ? 'Moyen' :
                         reviewForm.rating === 4 ? 'Bon' : 'Excellent'}
                      </span>
                    </div>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Commentaire (optionnel)</label>
                    <textarea
                      className="form-control"
                      rows={4}
                      placeholder="Partagez votre expérience avec ce cours..."
                      value={reviewForm.comment}
                      onChange={(e) => setReviewForm(prev => ({ ...prev, comment: e.target.value }))}
                      maxLength={1000}
                    />
                    <small className="text-muted">
                      {reviewForm.comment.length}/1000 caractères
                    </small>
                  </div>
                  <div className="review-form-actions">
                    <button
                      className="btn btn-primary me-2"
                      onClick={handleSubmitReview}
                      disabled={submittingReview || reviewForm.rating === 0}
                    >
                      {submittingReview ? (
                        <>
                          <i className="fas fa-spinner fa-spin me-1"></i>
                          Envoi...
                        </>
                      ) : (
                        <>
                          <i className="fas fa-star me-1"></i>
                          {userReview ? 'Mettre à jour' : 'Publier l\'évaluation'}
                        </>
                      )}
                    </button>
                    <button
                      className="btn btn-outline-secondary"
                      onClick={() => setShowReviewForm(false)}
                    >
                      Annuler
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Liste des commentaires */}
          <div className="reviews-list">
            <div className="mb-3">
              <h4>Commentaires des étudiants</h4>
            </div>
            {loadingReviews ? (
              <div className="text-center py-4">
                <i className="fas fa-spinner fa-spin me-2"></i>
                Chargement des commentaires...
              </div>
            ) : reviews.length > 0 ? (
              <div className="reviews-container">
                {reviews.map((review) => (
                  <div key={review._id} className="review-item">
                    <div className="review-header">
                      <div className="reviewer-info">
                        <div className="reviewer-avatar">
                          {review.student.profile?.avatar ? (
                            <img
                              src={review.student.profile.avatar}
                              alt={getUserDisplayName(review.student)}
                              className="avatar-img"
                            />
                          ) : (
                            <div className="avatar-fallback">
                              {getUserDisplayName(review.student).charAt(0)}
                            </div>
                          )}
                        </div>
                        <div className="reviewer-details">
                          <div className="reviewer-name">{getUserDisplayName(review.student)}</div>
                          <div className="review-date">
                            {new Date(review.createdAt).toLocaleDateString('fr-FR')}
                          </div>
                        </div>
                      </div>
                      <div className="review-rating">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <span
                            key={star}
                            className={`css-star ${star <= review.rating ? 'active' : ''}`}
                          ></span>
                        ))}
                      </div>
                    </div>
                    {review.comment && (
                      <div className="review-comment">
                        {review.comment}
                      </div>
                    )}
                    <div className="review-actions">
                      <button
                        className="btn btn-sm btn-outline-primary me-2"
                        onClick={() => handleToggleHelpfulVote(review._id)}
                        disabled={!user || review.student._id === user.id}
                      >
                        <i className="fas fa-thumbs-up me-1"></i>
                        Utile ({review.helpfulVotes || 0})
                      </button>
                      {user && (
                        <button
                          className="btn btn-sm btn-outline-secondary"
                          onClick={() => handleReplyToReview(review._id)}
                        >
                          <i className="fas fa-reply me-1"></i>
                          Répondre
                        </button>
                      )}
                    </div>

                    {/* Formulaire de réponse */}
                    {replyingTo === review._id && (
                      <div className="reply-form mt-3">
                        <div className="card">
                          <div className="card-body">
                            <h6 className="card-title">
                              <i className="fas fa-reply me-2"></i>
                              Répondre à {getUserDisplayName(review.student)}
                            </h6>
                            <textarea
                              className="form-control mb-3"
                              rows={3}
                              placeholder="Écrivez votre réponse..."
                              value={replyText}
                              onChange={(e) => setReplyText(e.target.value)}
                              maxLength={500}
                            />
                            <small className="text-muted d-block mb-3">
                              {replyText.length}/500 caractères
                            </small>
                            <div className="reply-form-actions">
                              <button
                                className="btn btn-primary btn-sm me-2"
                                onClick={() => handleSubmitReply(review._id)}
                                disabled={submittingReply || !replyText.trim()}
                              >
                                {submittingReply ? (
                                  <>
                                    <i className="fas fa-spinner fa-spin me-1"></i>
                                    Envoi...
                                  </>
                                ) : (
                                  <>
                                    <i className="fas fa-paper-plane me-1"></i>
                                    Envoyer
                                  </>
                                )}
                              </button>
                              <button
                                className="btn btn-outline-secondary btn-sm"
                                onClick={handleCancelReply}
                              >
                                Annuler
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Affichage des réponses */}
                    {replies[review._id] && replies[review._id].length > 0 && (
                      <div className="replies-section mt-3">
                        <div className="replies-header">
                          <h6 className="replies-title">
                            <i className="fas fa-comments me-2"></i>
                            Réponses ({replies[review._id].length})
                          </h6>
                        </div>
                        <div className="replies-list">
                          {replies[review._id].map((reply) => (
                            <div key={reply.id || reply._id} className="reply-item">
                              <div className="reply-header">
                                <div className="reply-author">
                                  <strong>
                                    {getUserDisplayName(reply.author)}
                                  </strong>
                                  {reply.isInstructorReply && (
                                    <span className="instructor-badge">
                                      <i className="fas fa-graduation-cap me-1"></i>
                                      Instructeur
                                    </span>
                                  )}
                                  <span className="reply-date">
                                    {new Date(reply.createdAt).toLocaleDateString('fr-FR')}
                                  </span>
                                </div>
                              </div>
                              <div className="reply-content">
                                {reply.text}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 text-muted">
                <i className="fas fa-comments me-2"></i>
                Aucun commentaire pour le moment
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseDetail; 