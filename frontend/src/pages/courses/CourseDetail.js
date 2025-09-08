import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useParams, Link } from 'react-router-dom';
import { coursesAPI, enrollmentAPI } from '../../services/api';

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
    <div className="main-content">
      {/* Course Header */}
      <div className="card">
        <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
          <div style={{ flex: '1', minWidth: '300px' }}>
            <h1 className="card-title">{course.title}</h1>
            <p style={{ color: '#6c757d', marginBottom: '1rem' }}>
              {course.description}
            </p>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
              <span style={{ 
                backgroundColor: 'var(--danger)', 
                color: 'white', 
                padding: '0.25rem 0.75rem', 
                borderRadius: '20px',
                fontSize: '0.85rem'
              }}>
                {course.level}
              </span>
              <span style={{ 
                backgroundColor: '#6c757d', 
                color: 'white', 
                padding: '0.25rem 0.75rem', 
                borderRadius: '20px',
                fontSize: '0.85rem'
              }}>
                {course.category}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
              <span>⭐ {course.rating?.average || course.rating || 'N/A'}</span>
                              <span>{course.enrolledStudents?.length || course.students || 0} apprentis inscrits</span>
              <span>{course.duration}</span>
            </div>
            <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: 'var(--danger)' }}>
              {course.price}€
            </div>
          </div>
          <div style={{ minWidth: '200px' }}>
            <button
              onClick={handleEnroll}
              disabled={enrolling}
              className="btn btn-primary"
              style={{ width: '100%', marginBottom: '1rem' }}
            >
              {enrolling ? 'Inscription...' : 'S\'inscrire maintenant'}
            </button>
            <Link to="/courses" className="btn btn-outline" style={{ width: '100%' }}>
              Retour aux cours
            </Link>
          </div>
        </div>
      </div>

      {/* Course Content */}
      <div className="grid grid-2">
        {/* Course Modules */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Contenu du cours</h2>
          </div>
          <div>
            {course.modules.map((module) => (
              <div key={module._id || module.id} style={{ 
                padding: '1rem', 
                borderBottom: '1px solid #e9ecef',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  <h4 style={{ margin: 0, color: '#495057' }}>{module.title}</h4>
                  <small style={{ color: '#6c757d' }}>
                    {module.lessons?.length || module.lessons || 0} leçons • {module.duration}
                  </small>
                </div>
                <span style={{ color: '#6c757d' }}>▶</span>
              </div>
            ))}
          </div>
        </div>

        {/* Course Info */}
        <div>
          {/* Requirements */}
          <div className="card mb-3">
            <div className="card-header">
              <h3 className="card-title">Prérequis</h3>
            </div>
            <ul style={{ paddingLeft: '1.5rem', margin: 0 }}>
              {course.requirements.map((req, index) => (
                <li key={index} style={{ marginBottom: '0.5rem', color: '#495057' }}>
                  {req}
                </li>
              ))}
            </ul>
          </div>

          {/* Learning Outcomes */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Ce que vous apprendrez</h3>
            </div>
            <ul style={{ paddingLeft: '1.5rem', margin: 0 }}>
              {course.outcomes.map((outcome, index) => (
                <li key={index} style={{ marginBottom: '0.5rem', color: '#495057' }}>
                  {outcome}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Instructor */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Instructeur</h2>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ 
            width: '60px', 
            height: '60px', 
            borderRadius: '50%', 
            backgroundColor: 'var(--danger)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: '1.5rem',
            fontWeight: 'bold'
          }}>
            {(course.instructor?.name || course.instructor || 'I').charAt(0)}
          </div>
          <div>
            <h3 style={{ margin: 0, color: '#495057' }}>{course.instructor?.name || course.instructor}</h3>
            <p style={{ margin: 0, color: '#6c757d' }}>
              Instructeur expérimenté avec expertise en développement {course.category}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseDetail; 