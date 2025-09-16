import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { dashboardAPI, coursesAPI, enrollmentAPI } from '../../services/api';
import { Icon, IconSizes, IconColors } from '../../components/common/IconTheme';
import './Dashboard.css';

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalCourses: 0,
    enrolledCourses: 0,
    completedCourses: 0,
    totalHours: 0
  });
  const [recentCourses, setRecentCourses] = useState([]);
  const [allCourses, setAllCourses] = useState([]);
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedLevel, setSelectedLevel] = useState('all');

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [statsResponse, coursesResponse, enrolledResponse] = await Promise.all([
          dashboardAPI.getStats(),
          coursesAPI.getAll(),
          user?.role === 'apprenti' ? enrollmentAPI.getStudentCourses() : Promise.resolve({ data: { success: true, data: [] } })
        ]);
        
        setStats(statsResponse.data);
        setAllCourses(coursesResponse.data.data || []);
        setRecentCourses((coursesResponse.data.data || []).slice(0, 3)); // Get first 3 courses
        
        if (enrolledResponse.data.success) {
          // Extraire les cours depuis les enrollments
          const courses = enrolledResponse.data.data.enrollments.map(enrollment => enrollment.course);
          setEnrolledCourses(courses);
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        console.error('Error details:', error.response?.data);
        
        // Essayer de récupérer au moins les cours même si les stats échouent
        try {
          const coursesResponse = await coursesAPI.getAll();
          if (coursesResponse.data.success) {
            setAllCourses(coursesResponse.data.data || []);
            setRecentCourses((coursesResponse.data.data || []).slice(0, 3));
          }
        } catch (coursesError) {
          console.error('Error fetching courses:', coursesError);
          setAllCourses([]);
          setRecentCourses([]);
        }
        
        // Utiliser des stats par défaut
        setStats({
          totalCourses: 0,
          enrolledCourses: 0,
          completedCourses: 0,
          totalHours: 0
        });
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user]);

  // Fonction utilitaire pour vérifier si un cours est inscrit
  const isCourseEnrolled = (courseId) => {
    return enrolledCourses.some(course => 
      (course._id || course.id) === (courseId._id || courseId.id)
    );
  };

  // Fonction de filtrage des cours
  const getFilteredCourses = () => {
    return allCourses.filter(course => {
      const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           course.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || course.category?.toLowerCase() === selectedCategory.toLowerCase();
      const matchesLevel = selectedLevel === 'all' || course.level?.toLowerCase() === selectedLevel.toLowerCase();
      
      return matchesSearch && matchesCategory && matchesLevel;
    });
  };

  // Obtenir les catégories uniques
  const categories = ['all', ...new Set(allCourses.map(course => course.category).filter(Boolean))];
  
  // Obtenir les niveaux uniques
  const levels = ['all', ...new Set(allCourses.map(course => course.level).filter(Boolean))];

  const filteredCourses = getFilteredCourses();

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
      <div className="card">
        <div className="card-header">
          <h1 className="card-title">Bon retour, {user?.name || 'Apprenti'} !</h1>
          <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
            {user?.role === 'tuteur' 
              ? 'Gérez vos cours et suivez les progrès de vos apprentis'
              : 'Voici votre progression d\'apprentissage et votre activité récente'
            }
          </p>
        </div>
      </div>

      {/* Tutor Actions */}
      {user?.role === 'tuteur' && (
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Actions Tuteur</h2>
            <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
              Gérez vos cours et publiez du contenu pour vos apprentis
            </p>
          </div>
          <div className="card-body">
            <div className="grid grid-2" style={{ gap: '1rem' }}>
              <Link to="/tutor/published-courses" className="btn btn-primary btn-lg" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1rem' }}>
                <Icon name="globe" size={IconSizes.md} color={IconColors.white} />
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontWeight: '600' }}>Cours Publiés</div>
                  <div style={{ fontSize: '0.85rem', opacity: 0.9 }}>Gérer et publier vos cours</div>
                </div>
              </Link>
              
              <Link to="/tutor/my-courses" className="btn btn-secondary btn-lg" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1rem' }}>
                <Icon name="courses" size={IconSizes.md} color={IconColors.white} />
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontWeight: '600' }}>Mes Cours</div>
                  <div style={{ fontSize: '0.85rem', opacity: 0.9 }}>Créer et modifier vos cours</div>
                </div>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Student Actions */}
      {user?.role === 'apprenti' && (
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Actions Apprenti</h2>
            <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
              Explorez les cours disponibles et suivez votre progression
            </p>
          </div>
          <div className="card-body">
            <div className="grid grid-2" style={{ gap: '1rem' }}>
              <Link to="/courses" className="btn btn-primary btn-lg" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1rem' }}>
                <Icon name="courses" size={IconSizes.md} color={IconColors.white} />
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontWeight: '600' }}>Tous les Cours</div>
                  <div style={{ fontSize: '0.85rem', opacity: 0.9 }}>Découvrir les cours publiés</div>
                </div>
              </Link>
              
              <Link to="/certificates" className="btn btn-secondary btn-lg" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1rem' }}>
                <Icon name="trophy" size={IconSizes.md} color={IconColors.white} />
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontWeight: '600' }}>Mes Certificats</div>
                  <div style={{ fontSize: '0.85rem', opacity: 0.9 }}>Voir mes certificats obtenus</div>
                </div>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card primary">
          <div className="stat-icon">
            <Icon name="courses" size={IconSizes.lg} color={IconColors.white} />
          </div>
          <div className="stat-content">
            <div className="stat-number">{allCourses.length}</div>
            <div className="stat-label">Cours disponibles</div>
            <div className="stat-description">Total sur la plateforme</div>
          </div>
        </div>
        {(user?.role === 'apprenti' || user?.role === 'tuteur') && (
          <div className="stat-card secondary">
            <div className="stat-icon">
              <Icon name="graduation" size={IconSizes.lg} color={IconColors.white} />
            </div>
            <div className="stat-content">
              <div className="stat-number">{enrolledCourses.length}</div>
              <div className="stat-label">Cours inscrits</div>
              <div className="stat-description">Mes inscriptions</div>
            </div>
          </div>
        )}
      </div>

      {/* Tous les cours publiés avec recherche et filtrage */}
      <div className="card">
        <div className="card-header">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Icon name="courses" size={IconSizes.md} color={IconColors.primary} />
              <h2 className="card-title">Cours disponibles</h2>
            </div>
            <div className="courses-count">
              <span className="count-badge">{filteredCourses.length} cours</span>
            </div>
          </div>
          <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
            {user?.role === 'apprenti' 
              ? 'Découvrez tous les cours publiés et voyez votre statut d\'inscription'
              : 'Explorez tous les cours disponibles sur la plateforme'
            }
          </p>
        </div>

        {/* Barre de recherche et filtres */}
        <div className="search-filters-section">
          <div className="search-bar">
            <div className="search-input-container">
              <Icon name="search" size={IconSizes.sm} color={IconColors.gray} />
              <input
                type="text"
                placeholder="Rechercher un cours..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="clear-search-btn"
                >
                  <Icon name="x" size={IconSizes.sm} color={IconColors.gray} />
                </button>
              )}
            </div>
          </div>
          
          <div className="filters-row">
            <div className="filter-group">
              <label className="filter-label">Catégorie</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="filter-select"
              >
                {categories.map(category => (
                  <option key={category} value={category}>
                    {category === 'all' ? 'Toutes les catégories' : category}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="filter-group">
              <label className="filter-label">Niveau</label>
              <select
                value={selectedLevel}
                onChange={(e) => setSelectedLevel(e.target.value)}
                className="filter-select"
              >
                {levels.map(level => (
                  <option key={level} value={level}>
                    {level === 'all' ? 'Tous les niveaux' : level}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="filter-actions">
              <button
                onClick={() => {
                  setSearchTerm('');
                  setSelectedCategory('all');
                  setSelectedLevel('all');
                }}
                className="btn btn-outline btn-sm"
              >
                <Icon name="refresh" size={IconSizes.xs} color={IconColors.primary} />
                Réinitialiser
              </button>
            </div>
          </div>
        </div>

        {/* Grille des cours */}
        {filteredCourses.length === 0 ? (
          <div className="no-courses">
            <div className="no-courses-icon">🔍</div>
            <h3>Aucun cours trouvé</h3>
            <p>
              {searchTerm || selectedCategory !== 'all' || selectedLevel !== 'all'
                ? 'Aucun cours ne correspond à vos critères de recherche. Essayez de modifier vos filtres.'
                : 'Aucun cours n\'est disponible pour le moment.'
              }
            </p>
            {(searchTerm || selectedCategory !== 'all' || selectedLevel !== 'all') && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setSelectedCategory('all');
                  setSelectedLevel('all');
                }}
                className="btn btn-primary"
              >
                Voir tous les cours
              </button>
            )}
          </div>
        ) : (
          <div className="courses-grid">
            {filteredCourses.map((course) => {
              const hasThumbnail = !!course.thumbnail;
              const courseId = course._id || course.id;
              const isEnrolled = user?.role === 'apprenti' ? isCourseEnrolled(course) : false;
              
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
        
        <div className="text-center mt-3">
          <Link to="/courses" className="btn btn-secondary">
            <Icon name="courses" size={IconSizes.sm} color={IconColors.white} />
            Mes cours
          </Link>
        </div>
      </div>



    </div>
  );
};

export default Dashboard; 