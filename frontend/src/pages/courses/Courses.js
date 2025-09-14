import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { coursesAPI, enrollmentAPI } from '../../services/api';
import './Courses.css';

const Courses = () => {
  const { user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  const [enrolledCourses, setEnrolledCourses] = useState([]);

  // Fonction utilitaire pour obtenir le nom de l'instructeur
  const getInstructorName = (instructor) => {
    if (!instructor) return 'Instructeur';
    
    if (typeof instructor === 'string') {
      return instructor;
    }
    
    if (typeof instructor === 'object') {
      // Essayer différentes propriétés possibles
      if (instructor.name) return instructor.name;
      if (instructor.firstName && instructor.lastName) {
        return `${instructor.firstName} ${instructor.lastName}`;
      }
      if (instructor.firstName) return instructor.firstName;
      if (instructor.lastName) return instructor.lastName;
      
      // Essayer d'autres propriétés possibles
      if (instructor.username) return instructor.username;
      if (instructor.displayName) return instructor.displayName;
      
      // Si on a un email, créer un nom plus lisible
      if (instructor.email) {
        const emailPart = instructor.email.split('@')[0];
        // Capitaliser la première lettre et remplacer les points par des espaces
        return emailPart
          .split('.')
          .map(part => part.charAt(0).toUpperCase() + part.slice(1))
          .join(' ');
      }
    }
    
    return 'Instructeur';
  };

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        // Pour les apprentis : récupérer seulement les cours où ils sont inscrits
        if (user?.role === 'apprenti') {
          try {
            const enrollmentResponse = await enrollmentAPI.getStudentCourses();
            console.log('📚 Réponse API cours inscrits:', enrollmentResponse.data);
            if (enrollmentResponse.data.success) {
              // Extraire les cours depuis les enrollments
              const enrolledCoursesData = enrollmentResponse.data.data.enrollments.map(
                enrollment => enrollment.course
              );
              
              // Récupérer les cours complets pour avoir toutes les infos de l'instructeur
              const courseIds = enrolledCoursesData.map(course => course._id || course.id);
              const fullCoursesResponse = await coursesAPI.getAll();
              
              if (fullCoursesResponse.data.success) {
                // Filtrer seulement les cours où l'utilisateur est inscrit
                const fullCourses = fullCoursesResponse.data.data.filter(course => 
                  courseIds.includes(course._id || course.id)
                );
                setCourses(fullCourses);
                setEnrolledCourses(courseIds);
              } else {
                setCourses(enrolledCoursesData);
                setEnrolledCourses(courseIds);
              }
            } else {
              setCourses([]);
              setEnrolledCourses([]);
            }
          } catch (enrollmentError) {
            console.error('❌ Erreur lors de la récupération des inscriptions:', enrollmentError);
            setCourses([]);
            setEnrolledCourses([]);
          }
        } else {
          // Pour les tuteurs : récupérer tous les cours (comme avant)
          const response = await coursesAPI.getAll();
          console.log('📚 Réponse API cours:', response.data);
          if (response.data.success) {
            setCourses(response.data.data);
          } else {
            console.error('Erreur API:', response.data.message);
            setCourses([]);
          }
        }
      } catch (error) {
        console.error('❌ Erreur lors de la récupération des cours:', error);
        setCourses([]);
        setError('Erreur lors du chargement des cours. Veuillez réessayer plus tard.');
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, [user]);

  const filteredCourses = filter === 'all' 
    ? courses 
    : courses.filter(course => course.category.toLowerCase() === filter.toLowerCase());

  const categories = ['all', ...new Set(courses.map(course => course.category))];

  if (loading) {
    return (
      <div className="main-content">
        <div className="text-center">
          <p>Chargement des cours...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="main-content">
        <div className="card">
          <div className="card-header">
            <h1 className="card-title">Erreur</h1>
          </div>
          <div className="card-body">
            <p style={{ color: '#dc3545' }}>{error}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="btn btn-primary"
            >
              Réessayer
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="courses-container">
      <div className="courses-header">
        <h1 className="courses-title">
          {user?.role === 'apprenti' ? 'Mes cours inscrits' : 'Tous les cours'}
        </h1>
        <p className="courses-subtitle">
          {user?.role === 'apprenti' 
            ? 'Continuez votre apprentissage avec vos cours inscrits' 
            : 'Explorez notre collection complète de cours'
          }
        </p>
      </div>

      <div className="filter-tabs">
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => setFilter(category)}
            className={`filter-tab ${filter === category ? 'active' : ''}`}
            style={{ textTransform: 'capitalize' }}
          >
            {category === 'all' ? 'Tous' : category}
          </button>
        ))}
      </div>

      {filteredCourses.length === 0 ? (
        <div className="no-courses">
          <div className="no-courses-icon">📚</div>
          <h3>
            {user?.role === 'apprenti' ? 'Aucun cours inscrit' : 'Aucun cours disponible'}
          </h3>
          <p>
            {user?.role === 'apprenti' 
              ? 'Vous n\'êtes inscrit à aucun cours pour le moment. Explorez les cours disponibles et inscrivez-vous pour commencer votre apprentissage.'
              : courses.length === 0 
                ? 'Aucun cours n\'a encore été publié par les tuteurs.' 
                : 'Aucun cours ne correspond à votre filtre.'
            }
          </p>
          {user?.role === 'apprenti' && (
            <div style={{ marginTop: '1rem' }}>
              <Link to="/" className="btn btn-primary">
                Découvrir les cours disponibles
              </Link>
            </div>
          )}
          {courses.length === 0 && (
            <p>
              {user?.role === 'apprenti' 
                ? 'Aucun cours disponible pour le moment.' 
                : 'Les tuteurs peuvent publier leurs cours depuis leur tableau de bord.'}
            </p>
          )}
        </div>
      ) : (
        <div className="courses-grid">
          {filteredCourses.map((course) => {
            const hasThumbnail = !!course.thumbnail;
            const courseId = course._id || course.id;
            // Pour les apprentis, tous les cours affichés sont inscrits
            // Pour les tuteurs, aucun cours n'est considéré comme inscrit
            const isEnrolled = user?.role === 'apprenti';
            
            return (
              <div key={course._id || course.id} className="course-card">
                <div className="course-thumbnail">
                  {hasThumbnail ? (
                    <img src={course.thumbnail} alt={course.title} onError={(e) => { e.target.style.display = 'none'; }} />
                  ) : (
                    <div className="course-thumbnail-placeholder">
                      {course.title?.charAt(0) || 'C'}
                    </div>
                  )}
                  {isEnrolled && (
                    <div className="enrollment-badge-overlay">
                      <i className="fas fa-check-circle"></i>
                      <span>Inscrit</span>
                    </div>
                  )}
                </div>
                <div className="course-content">
                  <div className="course-header">
                    <h3 className="course-list-title">{course.title}</h3>
                    <div className="course-instructor">
                      {getInstructorName(course.instructor)}
                    </div>
                  </div>
                  <p className="course-description">{course.description}</p>
                  <div className="course-meta">
                    <div className="meta-item">
                      <i className="fas fa-clock" /> {course.duration}
                    </div>
                    <div className="meta-item">
                      <i className="fas fa-signal" /> {course.level}
                    </div>
                    {course.category && (
                      <div className="meta-item">
                        <i className="fas fa-tag" /> {course.category}
                      </div>
                    )}
                  </div>
                  <div className="course-actions">
                    <Link 
                      to={`/courses/${course._id || course.id}`}
                      className={`btn ${isEnrolled ? 'btn-success' : 'btn-primary'}`}
                    >
                      {isEnrolled ? 'Continuer le cours' : 'Voir le cours'}
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Courses; 