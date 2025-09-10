import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { coursesAPI } from '../../services/api';
import './Courses.css';

const Courses = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const response = await coursesAPI.getAll();
        console.log('📚 Réponse API cours:', response.data);
        if (response.data.success) {
          setCourses(response.data.data);
        } else {
          console.error('Erreur API:', response.data.message);
          setCourses([]);
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
  }, []);

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
        <h1 className="courses-title">Tous les cours</h1>
        <p className="courses-subtitle">Explorez notre collection complète de cours</p>
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
          <h3>Aucun cours disponible</h3>
          <p>
            {courses.length === 0 
              ? 'Aucun cours n\'a encore été publié par les tuteurs.' 
              : 'Aucun cours ne correspond à votre filtre.'}
          </p>
          {courses.length === 0 && (
            <p>Les tuteurs peuvent publier leurs cours depuis leur tableau de bord.</p>
          )}
        </div>
      ) : (
        <div className="courses-grid">
          {filteredCourses.map((course) => {
            const hasThumbnail = !!course.thumbnail;
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
                </div>
                <div className="course-content">
                  <div className="course-header">
                    <h3 className="course-title">{course.title}</h3>
                    <div className="course-instructor">
                      <i className="fas fa-user" />
                      {course.instructor?.name || course.instructor}
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
                    <div className="meta-item">
                      <i className="fas fa-users" /> {course.enrolledStudents?.length || course.students || 0} apprentis
                    </div>
                  </div>
                  <div className="course-actions">
                    <Link 
                      to={`/courses/${course._id || course.id}`}
                      className="btn btn-primary"
                    >
                      Voir le cours
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