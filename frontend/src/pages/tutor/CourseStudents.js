import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { coursesAPI, courseReviewsAPI, repliesAPI } from '../../services/api';
import './CourseStudents.css';

const CourseStudents = () => {
  const { courseId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [course, setCourse] = useState(null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  // Variables supprimées - version simplifiée
  const [filter, setFilter] = useState('all'); // all, active, completed, struggling
  
  // États pour les commentaires et évaluations
  const [reviews, setReviews] = useState([]);
  const [reviewStats, setReviewStats] = useState(null);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [showReviews, setShowReviews] = useState(false);
  
  // États pour les réponses
  const [replies, setReplies] = useState({});
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [submittingReply, setSubmittingReply] = useState(false);

  useEffect(() => {
    if (!user || user.role !== 'tuteur') {
      navigate('/dashboard');
      return;
    }
    
    if (courseId) {
      fetchCourseStudents();
    }
  }, [user, navigate, courseId]);

  const fetchCourseStudents = async () => {
    try {
      setLoading(true);
      const response = await coursesAPI.getCourseStudents(courseId);
      console.log('🔍 Course students response:', response.data);
      
      setCourse(response.data.data.course);
      setStudents(response.data.data.students);
      
      // Récupérer aussi les commentaires et évaluations
      await fetchCourseReviews();
    } catch (error) {
      console.error('Erreur lors de la récupération des étudiants:', error);
      setError('Erreur lors du chargement des étudiants');
    } finally {
      setLoading(false);
    }
  };

  const fetchCourseReviews = async () => {
    try {
      setReviewsLoading(true);
      const response = await courseReviewsAPI.getCourseReviews(courseId, {
        page: 1,
        limit: 10,
        sortBy: 'createdAt',
        sortOrder: 'desc'
      });
      
      console.log('🔍 Course reviews response:', response.data);
      setReviews(response.data.data.reviews);
      setReviewStats(response.data.data.stats);
      
      // Récupérer les réponses pour chaque commentaire
      await loadRepliesForReviews(response.data.data.reviews);
    } catch (error) {
      console.error('Erreur lors de la récupération des commentaires:', error);
      // Ne pas afficher d'erreur pour les commentaires, juste les laisser vides
    } finally {
      setReviewsLoading(false);
    }
  };

  const loadRepliesForReviews = async (reviews) => {
    const repliesData = {};
    for (const review of reviews) {
      try {
        const response = await repliesAPI.getRepliesByReview(review._id);
        repliesData[review._id] = response.data.data.replies || [];
      } catch (error) {
        console.error(`Erreur lors du chargement des réponses pour le commentaire ${review._id}:`, error);
        repliesData[review._id] = [];
      }
    }
    setReplies(repliesData);
  };

  const getStatusColor = (progress) => {
    if (progress >= 80) return '#28a745'; // Vert pour excellente progression
    if (progress >= 50) return '#ffc107'; // Jaune pour progression moyenne
    if (progress >= 20) return '#fd7e14'; // Orange pour progression faible
    return '#dc3545'; // Rouge pour très faible progression
  };

  const getStatusText = (progress) => {
    if (progress >= 80) return 'Excellent';
    if (progress >= 50) return 'Bon';
    if (progress >= 20) return 'En difficulté';
    return 'Très en difficulté';
  };

  const formatDate = (date) => {
    if (!date) return 'Jamais';
    return new Date(date).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDuration = (minutes) => {
    if (!minutes) return '0 min';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}min`;
    }
    return `${mins}min`;
  };

  const getFilteredStudents = () => {
    switch (filter) {
      case 'active':
        return students.filter(s => s.progress.overallProgress > 0 && s.progress.overallProgress < 100);
      case 'completed':
        return students.filter(s => s.progress.overallProgress === 100);
      case 'struggling':
        return students.filter(s => s.progress.overallProgress < 20);
      default:
        return students;
    }
  };

  const getLessonStatusIcon = (status) => {
    switch (status) {
      case 'completed': return '✅';
      case 'in_progress': return '🔄';
      case 'not_started': return '⏸️';
      default: return '❓';
    }
  };

  const getLessonStatusText = (status) => {
    switch (status) {
      case 'completed': return 'Terminée';
      case 'in_progress': return 'En cours';
      case 'not_started': return 'Non commencée';
      default: return 'Inconnu';
    }
  };

  // Fonctions pour gérer les réponses
  const handleReplyToReview = (reviewId) => {
    setReplyingTo(reviewId);
    setReplyText('');
  };

  const handleCancelReply = () => {
    setReplyingTo(null);
    setReplyText('');
  };

  const handleSubmitReply = async (reviewId) => {
    if (!replyText.trim()) return;

    try {
      setSubmittingReply(true);
      const response = await repliesAPI.createReply(reviewId, {
        text: replyText.trim(),
        isInstructorReply: true
      });

      // Mettre à jour les réponses localement
      setReplies(prev => ({
        ...prev,
        [reviewId]: [...(prev[reviewId] || []), response.data.data.reply]
      }));

      setReplyingTo(null);
      setReplyText('');
    } catch (error) {
      console.error('Erreur lors de l\'envoi de la réponse:', error);
    } finally {
      setSubmittingReply(false);
    }
  };

  if (loading) {
    return (
      <div className="course-students-container">
        <div className="loading-container">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Chargement...</span>
          </div>
          <p>Chargement des étudiants...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="course-students-container">
        <div className="error-container">
          <div className="alert alert-danger" role="alert">
            <i className="fas fa-exclamation-triangle me-2"></i>
            {error}
          </div>
          <button className="btn btn-primary" onClick={fetchCourseStudents}>
            <i className="fas fa-refresh me-2"></i>
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  const filteredStudents = getFilteredStudents();

  return (
    <div className="course-students-container">
      {/* Header */}
      <div className="students-header">
        <div className="header-content">
          <button 
            onClick={() => navigate('/tutor/published-courses')}
            className="btn btn-outline btn-sm back-btn"
          >
            <i className="fas fa-arrow-left me-2"></i>
            Retour aux cours
          </button>
          
          <div className="course-info">
            <h1 className="page-title">
              <i className="fas fa-chart-line me-3"></i>
              Suivi des étudiants
            </h1>
            {course && (
              <div className="course-details">
                <div className="course-title-with-rating">
                  <h2 className="course-title">{course.title}</h2>
                  {reviewStats && (reviewStats.totalReviews > 0 || reviewStats.averageRating > 0) && (
                    <div className="course-rating-display">
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
                    </div>
                  )}
                </div>
                <div className="course-stats">
                  <span className="stat-item">
                    <i className="fas fa-users me-1"></i>
                    {course.totalStudents} étudiant{course.totalStudents > 1 ? 's' : ''}
                  </span>
                  <span className="stat-item">
                    <i className="fas fa-book me-1"></i>
                    {course.totalLessons} leçon{course.totalLessons > 1 ? 's' : ''}
                  </span>
                  <span className="stat-item">
                    <i className="fas fa-layer-group me-1"></i>
                    {course.totalModules} module{course.totalModules > 1 ? 's' : ''}
                  </span>
                  {reviewStats && reviewStats.totalReviews > 0 && (
                    <span className="stat-item">
                      <i className="fas fa-star me-1"></i>
                      {reviewStats.totalReviews} évaluation{reviewStats.totalReviews > 1 ? 's' : ''}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Filters and Reviews Toggle */}
      <div className="filters-section">
        <div className="filters-header">
          <div className="filter-tabs">
            <button 
              className={`filter-tab ${filter === 'all' ? 'active' : ''}`}
              onClick={() => setFilter('all')}
            >
              Tous ({students.length})
            </button>
            <button 
              className={`filter-tab ${filter === 'active' ? 'active' : ''}`}
              onClick={() => setFilter('active')}
            >
              En cours ({students.filter(s => s.progress.overallProgress > 0 && s.progress.overallProgress < 100).length})
            </button>
            <button 
              className={`filter-tab ${filter === 'completed' ? 'active' : ''}`}
              onClick={() => setFilter('completed')}
            >
              Terminés ({students.filter(s => s.progress.overallProgress === 100).length})
            </button>
            <button 
              className={`filter-tab ${filter === 'struggling' ? 'active' : ''}`}
              onClick={() => setFilter('struggling')}
            >
              En difficulté ({students.filter(s => s.progress.overallProgress < 20).length})
            </button>
          </div>
        </div>
        
        {/* Bouton des commentaires à l'extrémité */}
        {reviewStats && reviewStats.totalReviews > 0 && (
          <div className="reviews-toggle-container">
            <button 
              className={`btn btn-outline reviews-toggle ${showReviews ? 'active' : ''}`}
              onClick={() => setShowReviews(!showReviews)}
            >
              <i className={`fas ${showReviews ? 'fa-eye-slash' : 'fa-comments'} me-2`}></i>
              {showReviews ? 'Masquer les commentaires' : 'Voir les commentaires'} 
              <span className="reviews-count">({reviewStats.totalReviews})</span>
            </button>
          </div>
        )}
      </div>

      {/* Reviews Section */}
      {showReviews && (
        <div className="reviews-section">
          <div className="reviews-header">
            <h3 className="reviews-title">
              <i className="fas fa-comments me-2"></i>
              Commentaires et Évaluations
            </h3>
            {reviewStats && (
              <div className="reviews-summary">
                <div className="summary-stats">
                  <div className="stat-item">
                    <span className="stat-number">{reviewStats.averageRating.toFixed(1)}</span>
                    <span className="stat-label">Note moyenne</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-number">{reviewStats.totalReviews}</span>
                    <span className="stat-label">Évaluations</span>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {reviewsLoading ? (
            <div className="reviews-loading">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Chargement...</span>
              </div>
              <p>Chargement des commentaires...</p>
            </div>
          ) : reviews.length === 0 ? (
            <div className="no-reviews">
              <div className="no-reviews-icon">
                <i className="fas fa-comment-slash"></i>
              </div>
              <h4>Aucun commentaire</h4>
              <p>Ce cours n'a pas encore reçu d'évaluations.</p>
            </div>
          ) : (
            <div className="reviews-list">
              {reviews.map((review) => (
                <div key={review._id} className="review-item">
                  <div className="review-header">
                    <div className="reviewer-info">
                      <div className="reviewer-avatar">
                        {review.student?.avatar ? (
                          <img 
                            src={`http://localhost:5000${review.student.avatar}`} 
                            alt={review.student?.name || 'Utilisateur Anonyme'}
                            className="avatar-image"
                          />
                        ) : (
                          <div className="avatar-fallback">
                            <i className="fas fa-user"></i>
                          </div>
                        )}
                      </div>
                      <div className="reviewer-details">
                        <h4 className="reviewer-name">
                          {review.student?.name || 'Utilisateur Anonyme'}
                        </h4>
                        <div className="review-rating">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <span
                              key={star}
                              className={`css-star ${star <= review.rating ? 'active' : ''}`}
                            ></span>
                          ))}
                        </div>
                        <span className="review-date">
                          {new Date(review.createdAt).toLocaleDateString('fr-FR', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {review.comment && (
                    <div className="review-comment">
                      <p>{review.comment}</p>
                    </div>
                  )}

                  {/* Bouton pour répondre */}
                  <div className="review-actions">
                    <button 
                      className="btn btn-sm btn-outline-primary reply-btn"
                      onClick={() => handleReplyToReview(review._id)}
                    >
                      <i className="fas fa-reply me-1"></i>
                      Répondre
                    </button>
                  </div>

                  {/* Formulaire de réponse */}
                  {replyingTo === review._id && (
                    <div className="reply-form">
                      <div className="card">
                        <div className="card-title">
                          <i className="fas fa-reply me-2"></i>
                          Répondre en tant qu'instructeur
                        </div>
                        <textarea
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          placeholder="Tapez votre réponse..."
                          className="form-control"
                          rows="3"
                        />
                        <div className="reply-form-actions">
                          <button 
                            className="btn btn-primary"
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
                            className="btn btn-outline-secondary"
                            onClick={handleCancelReply}
                            disabled={submittingReply}
                          >
                            Annuler
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Affichage des réponses */}
                  {replies[review._id] && replies[review._id].length > 0 && (
                    <div className="replies-section">
                      <div className="replies-header">
                        <h5 className="replies-title">
                          <i className="fas fa-comments me-1"></i>
                          Réponses ({replies[review._id].length})
                        </h5>
                      </div>
                      <div className="replies-list">
                        {replies[review._id].map((reply) => (
                          <div key={reply._id} className="reply-item">
                            <div className="reply-header">
                              <div className="reply-author">
                                <strong>
                                  {reply.isInstructorReply ? 'Instructeur' : reply.author?.name || 'Utilisateur Anonyme'}
                                </strong>
                                {reply.isInstructorReply && (
                                  <span className="instructor-badge">Instructeur</span>
                                )}
                              </div>
                              <div className="reply-date">
                                {new Date(reply.createdAt).toLocaleDateString('fr-FR', {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </div>
                            </div>
                            <div className="reply-content">
                              <p>{reply.text}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Students List */}
      <div className="students-list">
        {filteredStudents.length === 0 ? (
          <div className="no-students">
            <div className="no-students-icon">
              <i className="fas fa-user-graduate"></i>
            </div>
            <h3>Aucun étudiant trouvé</h3>
            <p>
              {filter === 'all' 
                ? "Aucun étudiant n'est encore inscrit à ce cours."
                : `Aucun étudiant trouvé avec le filtre "${filter}".`
              }
            </p>
          </div>
        ) : (
          filteredStudents.map((student) => (
            <div key={student._id} className="student-card">
              <div className="student-header">
                <div className="student-info">
                  <div className="student-avatar">
                    {student.avatar ? (
                      <img 
                        src={`http://localhost:5000${student.avatar}`} 
                        alt={`${student.firstName} ${student.lastName}`}
                        className="avatar-image"
                      />
                    ) : (
                      <div className="avatar-placeholder">
                        <i className="fas fa-user"></i>
                      </div>
                    )}
                  </div>
                  <div className="student-details">
                    <h3 className="student-name">
                      {student.firstName} {student.lastName}
                    </h3>
                    <p className="student-email">{student.email}</p>
                    <div className="student-meta">
                      <span className="meta-item">
                        <i className="fas fa-calendar me-1"></i>
                        Inscrit le {formatDate(student.enrollment.enrolledAt)}
                      </span>
                      {student.progress.lastActivity && (
                        <span className="meta-item">
                          <i className="fas fa-clock me-1"></i>
                          Dernière activité: {formatDate(student.progress.lastActivity)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="student-progress-summary">
                  <div className="progress-circle">
                    <div 
                      className="progress-fill"
                      style={{ 
                        background: `conic-gradient(${getStatusColor(student.progress.overallProgress)} ${student.progress.overallProgress * 3.6}deg, #e9ecef 0deg)`
                      }}
                    >
                      <div className="progress-inner">
                        <span className="progress-percentage">{student.progress.overallProgress}%</span>
                      </div>
                    </div>
                  </div>
                  <div className="progress-details">
                    <div className="progress-stats">
                      <span className="stat">
                        <strong>{student.progress.overallProgress}%</strong> de progression
                      </span>
                      <span className="stat">
                        <i className="fas fa-calendar me-1"></i>
                        Inscrit le {formatDate(student.enrollment.enrolledAt)}
                      </span>
                    </div>
                    <div className={`progress-status ${getStatusText(student.progress.overallProgress).toLowerCase().replace(' ', '-')}`}>
                      {getStatusText(student.progress.overallProgress)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions supprimées - version simplifiée */}
            </div>
          ))
        )}
      </div>

      {/* Modal supprimée - version simplifiée */}
    </div>
  );
};

export default CourseStudents;
