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
    <div className="main-content">
      <div className="card">
        <div className="card-header">
          <h1 className="card-title">Tous les cours</h1>
          <p style={{ color: '#6c757d', margin: 0 }}>
            Explorez notre collection complète de cours
          </p>
        </div>
      </div>

      {/* Filter */}
      <div className="card mb-3">
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setFilter(category)}
              className={`btn ${filter === category ? 'btn-primary' : 'btn-outline'}`}
              style={{ textTransform: 'capitalize' }}
            >
              {category === 'all' ? 'Tous' : category}
            </button>
          ))}
        </div>
      </div>

      {/* Courses Grid */}
      {filteredCourses.length === 0 ? (
        <div className="card">
          <div className="card-body text-center">
            <h3>Aucun cours disponible</h3>
            <p style={{ color: '#6c757d' }}>
              {courses.length === 0 
                ? 'Aucun cours n\'a encore été publié par les tuteurs.' 
                : 'Aucun cours ne correspond à votre filtre.'}
            </p>
            {courses.length === 0 && (
              <p style={{ color: '#6c757d', fontSize: '0.9rem' }}>
                Les tuteurs peuvent publier leurs cours depuis leur tableau de bord.
              </p>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-3">
          {filteredCourses.map((course, index) => {
          const colors = ['red', 'blue', 'green', 'orange', 'purple', 'red'];
          const badgeColors = ['badge-primary', 'badge-blue', 'badge-green', 'badge-orange', 'badge-purple', 'badge-primary'];
          const buttonColors = ['btn-outline', 'btn-blue', 'btn-green', 'btn-orange', 'btn-purple', 'btn-primary'];
          const colorClass = colors[index % colors.length];
          const badgeClass = badgeColors[index % badgeColors.length];
          const buttonClass = buttonColors[index % buttonColors.length];
          
          return (
            <div key={course._id || course.id} className="course-card">
              <div className={`course-image ${colorClass}`}>
                {course.title.charAt(0)}
              </div>
              <div className="course-content">
                <h3 className="course-title">{course.title}</h3>
                <p className="course-description">{course.description}</p>
                <div className="course-meta">
                  <span>{course.duration}</span>
                  <span className={`badge ${badgeClass}`}>{course.level}</span>
                </div>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  marginTop: '1rem',
                  fontSize: '0.85rem',
                  color: 'var(--text-secondary)'
                }}>
                  <span>⭐ {course.rating?.average || course.rating || 'N/A'}</span>
                  <span>{course.enrolledStudents?.length || course.students || 0} apprentis</span>
                </div>
                <div style={{ 
                  marginTop: '0.5rem',
                  fontSize: '0.8rem',
                  color: 'var(--primary-red)',
                  fontWeight: '500'
                }}>
                  {course.instructor?.name || course.instructor}
                </div>
                <Link 
                  to={`/courses/${course._id || course.id}`} 
                  className={`btn ${buttonClass}`}
                  style={{ marginTop: '1rem', display: 'block', textAlign: 'center' }}
                >
                  Voir le cours
                </Link>
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