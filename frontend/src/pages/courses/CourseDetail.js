import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useParams, Link } from 'react-router-dom';
import { coursesAPI, enrollmentAPI } from '../../services/api';
import './CourseDetail.css';

const CourseDetail = () => {
  const { id } = useParams();
  const { addNotification } = useAuth();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        const response = await coursesAPI.getById(id);
        console.log('📚 Réponse API course detail:', response.data);
        if (response.data.success) {
          setCourse(response.data.data);
        } else {
          console.error('Erreur API:', response.data.message);
          setCourse(null);
        }
      } catch (error) {
        console.error('Error fetching course:', error);
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
              duration: '45 minutes',
              lessons: 3
            },
            {
              id: 2,
              title: 'Composants et JSX',
              duration: '1 heure',
              lessons: 4
            },
            {
              id: 3,
              title: 'État et Props',
              duration: '1.5 heures',
              lessons: 5
            },
            {
              id: 4,
              title: 'Gestion des événements',
              duration: '1 heure',
              lessons: 3
            },
            {
              id: 5,
              title: 'Construction d\'une application complète',
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

  const handleEnroll = async () => {
    setEnrolling(true);
    try {
      console.log('🔍 Tentative d\'inscription au cours:', id);
      const response = await enrollmentAPI.enrollInCourse(id);
      console.log('📋 Réponse d\'inscription:', response.data);
      
      if (response.data.success) {
        addNotification('Votre inscription au cours a été effectuée avec succès !', 'success');
        // Rediriger vers la page des cours de l'étudiant
        window.location.href = '/my-courses';
      } else {
        addNotification(response.data.message || 'Erreur lors de l\'inscription', 'error');
      }
    } catch (error) {
      console.error('❌ Erreur lors de l\'inscription:', error);
      const errorMessage = error.response?.data?.message || 'Erreur lors de l\'inscription au cours';
      addNotification(errorMessage, 'error');
    } finally {
      setEnrolling(false);
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

  return (
    <div className="course-detail-container">
      <div className="course-hero card">
        <div className="course-hero-inner">
          <div className="course-hero-main">
            <h1 className="course-title">{course.title}</h1>
            <p className="course-subtitle">{course.description}</p>
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
              disabled={enrolling}
              className="btn btn-primary btn-lg"
            >
              {enrolling ? 'Inscription...' : 'S\'inscrire maintenant'}
            </button>
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
            {course.modules.map((module) => (
              <div key={module._id || module.id} className="module-item">
                <div>
                  <h4 className="module-title">{module.title}</h4>
                  <small className="module-subtitle">
                    {module.lessons?.length || module.lessons || 0} leçons • {module.duration}
                  </small>
                </div>
                <span className="module-arrow">▶</span>
              </div>
            ))}
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
            {(course.instructor?.name || course.instructor || 'I').charAt(0)}
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