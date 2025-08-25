import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { coursesAPI } from '../../services/api';

const Courses = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const response = await coursesAPI.getAll();
        setCourses(response.data);
      } catch (error) {
        console.error('Error fetching courses:', error);
        // Use mock data for demo
        setCourses([
          {
            id: 1,
            title: 'Fondamentaux React',
            description: 'Apprenez les bases du développement React incluant les composants, l\'état et les props',
            duration: '8 heures',
            level: 'Débutant',
            category: 'Frontend',
            instructor: 'Jean Dupont',
            rating: 4.5,
            students: 1250
          },
          {
            id: 2,
            title: 'Développement Backend Node.js',
            description: 'Construisez des APIs robustes avec Node.js et Express',
            duration: '12 heures',
            level: 'Intermédiaire',
            category: 'Backend',
            instructor: 'Marie Martin',
            rating: 4.7,
            students: 890
          },
          {
            id: 3,
            title: 'JavaScript Avancé',
            description: 'Maîtrisez les concepts avancés de JavaScript et les fonctionnalités ES6+',
            duration: '10 heures',
            level: 'Avancé',
            category: 'JavaScript',
            instructor: 'Michel Johnson',
            rating: 4.8,
            students: 2100
          },
          {
            id: 4,
            title: 'Conception de Base de Données MongoDB',
            description: 'Apprenez à concevoir et implémenter des bases de données MongoDB',
            duration: '6 heures',
            level: 'Intermédiaire',
            category: 'Base de données',
            instructor: 'Sarah Wilson',
            rating: 4.6,
            students: 750
          },
          {
            id: 5,
            title: 'CSS Grid et Flexbox',
            description: 'Maîtrisez les techniques modernes de mise en page CSS',
            duration: '5 heures',
            level: 'Débutant',
            category: 'Frontend',
            instructor: 'Alex Brown',
            rating: 4.4,
            students: 1800
          },
          {
            id: 6,
            title: 'Conception d\'API RESTful',
            description: 'Apprenez à concevoir et implémenter des APIs RESTful',
            duration: '9 heures',
            level: 'Intermédiaire',
            category: 'Backend',
            instructor: 'David Lee',
            rating: 4.9,
            students: 1100
          }
        ]);
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
      <div className="grid grid-3">
        {filteredCourses.map((course, index) => {
          const colors = ['red', 'blue', 'green', 'orange', 'purple', 'red'];
          const badgeColors = ['badge-primary', 'badge-blue', 'badge-green', 'badge-orange', 'badge-purple', 'badge-primary'];
          const buttonColors = ['btn-outline', 'btn-blue', 'btn-green', 'btn-orange', 'btn-purple', 'btn-primary'];
          const colorClass = colors[index % colors.length];
          const badgeClass = badgeColors[index % badgeColors.length];
          const buttonClass = buttonColors[index % buttonColors.length];
          
          return (
            <div key={course.id} className="course-card">
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
                  <span>⭐ {course.rating}</span>
                  <span>{course.students} apprentis</span>
                </div>
                <div style={{ 
                  marginTop: '0.5rem',
                  fontSize: '0.8rem',
                  color: 'var(--primary-red)',
                  fontWeight: '500'
                }}>
                  {course.instructor}
                </div>
                <Link 
                  to={`/courses/${course.id}`} 
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

      {filteredCourses.length === 0 && (
        <div className="card text-center">
          <p style={{ color: '#6c757d' }}>Aucun cours trouvé dans cette catégorie.</p>
        </div>
      )}
    </div>
  );
};

export default Courses; 