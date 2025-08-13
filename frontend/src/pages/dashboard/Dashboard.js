import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { dashboardAPI, coursesAPI } from '../../services/api';

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalCourses: 0,
    enrolledCourses: 0,
    completedCourses: 0,
    totalHours: 0
  });
  const [recentCourses, setRecentCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [statsResponse, coursesResponse] = await Promise.all([
          dashboardAPI.getStats(),
          coursesAPI.getAll()
        ]);
        
        setStats(statsResponse.data);
        setRecentCourses(coursesResponse.data.slice(0, 3)); // Get first 3 courses
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        // Use mock data for demo
        setStats({
          totalCourses: 12,
          enrolledCourses: 3,
          completedCourses: 1,
          totalHours: 24
        });
        setRecentCourses([
          {
            id: 1,
            title: 'Fondamentaux React',
            description: 'Apprenez les bases du développement React',
            duration: '8 heures',
            level: 'Débutant'
          },
          {
            id: 2,
            title: 'Développement Backend Node.js',
            description: 'Construisez des APIs robustes avec Node.js',
            duration: '12 heures',
            level: 'Intermédiaire'
          },
          {
            id: 3,
            title: 'JavaScript Avancé',
            description: 'Maîtrisez les concepts avancés de JavaScript',
            duration: '10 heures',
            level: 'Avancé'
          }
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="main-content">
        <div className="text-center">
          <p>Chargement du tableau de bord...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="main-content">
      <div className="alert alert-info">
        <strong>Nouveau design !</strong> Nous avons amélioré notre plateforme avec une belle palette de couleurs tout en conservant notre thème signature rouge et blanc. Profitez de l'expérience visuelle améliorée !
      </div>
      
      <div className="card">
        <div className="card-header">
          <h1 className="card-title">Bon retour, {user?.name || 'Étudiant'} !</h1>
          <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
            Voici votre progression d'apprentissage et votre activité récente
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card blue">
          <div className="stat-number blue">{stats.totalCourses}</div>
          <div className="stat-label">Total des cours</div>
        </div>
        <div className="stat-card orange">
          <div className="stat-number orange">{stats.enrolledCourses}</div>
          <div className="stat-label">Cours inscrits</div>
        </div>
        <div className="stat-card green">
          <div className="stat-number green">{stats.completedCourses}</div>
          <div className="stat-label">Cours terminés</div>
        </div>
        <div className="stat-card purple">
          <div className="stat-number purple">{stats.totalHours}h</div>
          <div className="stat-label">Heures d'apprentissage</div>
        </div>
      </div>

      {/* Recent Courses */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Cours récents</h2>
        </div>
        <div className="grid grid-3">
          {recentCourses.map((course, index) => {
            const colors = ['red', 'blue', 'green', 'orange', 'purple'];
            const badgeColors = ['badge-primary', 'badge-blue', 'badge-green', 'badge-orange', 'badge-purple'];
            const buttonColors = ['btn-primary', 'btn-blue', 'btn-green', 'btn-orange', 'btn-purple'];
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
        <div className="text-center mt-3">
          <Link to="/courses" className="btn btn-primary">
            Voir tous les cours
          </Link>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card green">
        <div className="card-header">
          <h2 className="card-title">Actions rapides</h2>
        </div>
        <div className="grid grid-2">
          <div className="p-3">
            <h3 style={{ color: 'var(--secondary-green)', marginBottom: '0.5rem' }}>Continuer l'apprentissage</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
              Reprenez là où vous vous êtes arrêté dans vos cours inscrits
            </p>
            <Link to="/courses" className="btn btn-green">
              Reprendre l'apprentissage
            </Link>
          </div>
          <div className="p-3">
            <h3 style={{ color: 'var(--secondary-purple)', marginBottom: '0.5rem' }}>Explorer de nouveaux cours</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
              Découvrez de nouveaux sujets et développez vos compétences
            </p>
            <Link to="/courses" className="btn btn-purple">
              Parcourir les cours
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 