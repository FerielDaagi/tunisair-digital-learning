import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { dashboardAPI, coursesAPI } from '../../services/api';
import { Icon, IconSizes, IconColors } from '../../components/common/IconTheme';

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
          <h1 className="card-title">Bon retour, {user?.name || 'Apprenti'} !</h1>
          <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
            Voici votre progression d'apprentissage et votre activité récente
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card primary">
          <div className="stat-icon">
            <Icon name="courses" size={IconSizes.lg} color={IconColors.white} />
          </div>
          <div className="stat-content">
            <div className="stat-number">{stats.totalCourses}</div>
            <div className="stat-label">Total des cours</div>
          </div>
        </div>
        <div className="stat-card secondary">
          <div className="stat-icon">
            <Icon name="graduation" size={IconSizes.lg} color={IconColors.white} />
          </div>
          <div className="stat-content">
            <div className="stat-number">{stats.enrolledCourses}</div>
            <div className="stat-label">Cours inscrits</div>
          </div>
        </div>
        <div className="stat-card success">
          <div className="stat-icon">
            <Icon name="trophy" size={IconSizes.lg} color={IconColors.white} />
          </div>
          <div className="stat-content">
            <div className="stat-number">{stats.completedCourses}</div>
            <div className="stat-label">Cours terminés</div>
          </div>
        </div>
        <div className="stat-card info">
          <div className="stat-icon">
            <Icon name="clock" size={IconSizes.lg} color={IconColors.white} />
          </div>
          <div className="stat-content">
            <div className="stat-number">{stats.totalHours}h</div>
            <div className="stat-label">Heures d'apprentissage</div>
          </div>
        </div>
      </div>

      {/* Recent Courses */}
      <div className="card">
        <div className="card-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Icon name="courses" size={IconSizes.md} color={IconColors.primary} />
            <h2 className="card-title">Cours récents</h2>
          </div>
        </div>
        <div className="grid grid-3">
          {recentCourses.map((course, index) => {
            const courseIcons = ['graduation', 'rocket', 'target', 'star'];
            const iconName = courseIcons[index % courseIcons.length];
            
            return (
              <div key={course.id} className="course-card">
                <div className="course-header">
                  <div className="course-icon">
                    <Icon name={iconName} size={IconSizes.lg} color={IconColors.white} />
                  </div>
                  <div className="course-level">
                    <Icon name="target" size={IconSizes.xs} color={IconColors.white} />
                    <span>{course.level}</span>
                  </div>
                </div>
                <div className="course-content">
                  <h3 className="course-title">{course.title}</h3>
                  <p className="course-description">{course.description}</p>
                  <div className="course-meta">
                    <div className="course-duration">
                      <Icon name="clock" size={IconSizes.xs} color={IconColors.gray} />
                      <span>{course.duration}</span>
                    </div>
                    <div className="course-progress">
                      <div className="progress-bar">
                        <div className="progress-fill" style={{ width: '0%' }}></div>
                      </div>
                      <span>0%</span>
                    </div>
                  </div>
                  <Link 
                    to={`/courses/${course.id}`} 
                    className="btn btn-primary course-btn"
                  >
                    <Icon name="arrowRight" size={IconSizes.xs} color={IconColors.white} />
                    Commencer
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
        <div className="text-center mt-3">
          <Link to="/courses" className="btn btn-secondary">
            <Icon name="courses" size={IconSizes.sm} color={IconColors.white} />
            Voir tous les cours
          </Link>
        </div>
      </div>

      {/* Achievements */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Réalisations</h2>
        </div>
        <div className="achievements-grid">
          {[
            {
              id: 1,
              title: 'First Steps',
              description: 'Complete your first lesson',
              icon: 'target',
              earned: true,
              earnedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
            },
            {
              id: 2,
              title: 'Course Champion',
              description: 'Complete your first course',
              icon: 'trophy',
              earned: true,
              earnedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
            },
            {
              id: 3,
              title: 'Streak Master',
              description: 'Maintain a 7-day learning streak',
              icon: 'flame',
              earned: false,
              progress: 5,
              required: 7
            },
            {
              id: 4,
              title: 'Knowledge Seeker',
              description: 'Enroll in 5 courses',
              icon: 'graduation',
              earned: false,
              progress: 3,
              required: 5
            }
          ].map((achievement) => (
            <div key={achievement.id} className={`achievement-card ${achievement.earned ? 'earned' : 'locked'}`}>
              <div className="achievement-icon">
                <Icon 
                  name={achievement.icon} 
                  size={IconSizes.lg} 
                  color={achievement.earned ? IconColors.success : IconColors.gray} 
                />
              </div>
              <div className="achievement-content">
                <h3 className="achievement-title">{achievement.title}</h3>
                <p className="achievement-description">{achievement.description}</p>
                {achievement.earned ? (
                  <span className="achievement-date">
                    Obtenu le {achievement.earnedAt.toLocaleDateString('fr-FR')}
                  </span>
                ) : (
                  <div className="achievement-progress">
                    <div className="progress-bar">
                      <div 
                        className="progress-fill" 
                        style={{ width: `${(achievement.progress / achievement.required) * 100}%` }}
                      ></div>
                    </div>
                    <span className="progress-text">
                      {achievement.progress}/{achievement.required}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card">
        <div className="card-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Icon name="zap" size={IconSizes.md} color={IconColors.warning} />
            <h2 className="card-title">Actions rapides</h2>
          </div>
        </div>
        <div className="grid grid-2">
          <div className="quick-action-card">
            <div className="quick-action-icon success">
              <Icon name="play" size={IconSizes.lg} color={IconColors.white} />
            </div>
            <div className="quick-action-content">
              <h3>Continuer l'apprentissage</h3>
              <p>Reprenez là où vous vous êtes arrêté dans vos cours inscrits</p>
              <Link to="/courses" className="btn btn-success">
                <Icon name="play" size={IconSizes.xs} color={IconColors.white} />
                Reprendre
              </Link>
            </div>
          </div>
          <div className="quick-action-card">
            <div className="quick-action-icon info">
              <Icon name="search" size={IconSizes.lg} color={IconColors.white} />
            </div>
            <div className="quick-action-content">
              <h3>Explorer de nouveaux cours</h3>
              <p>Découvrez de nouveaux sujets et développez vos compétences</p>
              <Link to="/courses" className="btn btn-info">
                <Icon name="search" size={IconSizes.xs} color={IconColors.white} />
                Explorer
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 