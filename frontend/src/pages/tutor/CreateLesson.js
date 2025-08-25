import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { lessonsAPI } from '../../services/api';
import { Icon, IconSizes, IconColors } from '../../components/common/IconTheme';
import './CreateCourse.css';

const CreateLesson = () => {
  const { user, addNotification } = useAuth();
  const navigate = useNavigate();
  const { moduleId } = useParams();
  
  const [module, setModule] = useState(null);
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    content: '',
    duration: '',
    order: 1,
    type: 'text',
    videoUrl: '',
    isFree: false,
    difficulty: 'moyen',
    tags: []
  });

  useEffect(() => {
    // Vérifier que l'utilisateur est un tuteur
    if (!user) {
      navigate('/login');
      return;
    }
    
    if (user.role !== 'tuteur') {
      navigate('/dashboard');
      return;
    }
    
    // Charger les données
    const fetchData = async () => {
      try {
        // Charger le module et le cours
        const moduleResponse = await fetch(`http://localhost:5000/api/modules/${moduleId}`);
        if (moduleResponse.ok) {
          const moduleData = await moduleResponse.json();
          if (moduleData.success) {
            setModule(moduleData.data);
            
            // Charger le cours
            const courseResponse = await fetch(`http://localhost:5000/api/courses/${moduleData.data.course}`);
            if (courseResponse.ok) {
              const courseData = await courseResponse.json();
              if (courseData.success) {
                setCourse(courseData.data);
              }
            }
            
            // Charger les leçons existantes pour déterminer l'ordre
            const lessonsResponse = await lessonsAPI.getByModule(moduleId);
            if (lessonsResponse.data.success) {
              const lessons = lessonsResponse.data.data;
              setFormData(prev => ({
                ...prev,
                order: lessons.length + 1
              }));
            }
          }
        }
      } catch (error) {
        console.error('Erreur chargement données:', error);
        setError('Erreur lors du chargement des données');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [user, navigate, moduleId]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleTagsChange = (e) => {
    const tags = e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag);
    setFormData(prev => ({
      ...prev,
      tags
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const response = await lessonsAPI.create({
        ...formData,
        moduleId,
        tags: formData.tags.filter(tag => tag.trim())
      });

      if (response.data.success) {
        if (addNotification) {
          addNotification('Leçon créée avec succès', 'success');
        }
        navigate(`/tutor/manage-lessons/${moduleId}`);
      } else {
        setError(response.data.message || 'Erreur lors de la création de la leçon');
      }
    } catch (error) {
      console.error('Erreur création leçon:', error);
      setError('Erreur lors de la création de la leçon. Veuillez réessayer.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!user || user.role !== 'tuteur') {
    return (
      <div className="create-course-page">
        <div className="access-denied">
          <Icon name="lock" size={IconSizes.xl} color={IconColors.error} />
          <h2>Accès refusé</h2>
          <p>Seuls les tuteurs peuvent créer des leçons.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="create-course-page">
        <div className="loading">
          <Icon name="loader" size={IconSizes.xl} color={IconColors.primary} />
          <h2>Chargement...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="create-course-page">
      <div className="create-course-container">
        <div className="create-course-header">
          <h1>
            <Icon name="plus" size={IconSizes.lg} color={IconColors.primary} />
            Créer une nouvelle leçon
          </h1>
          <p>Module : {module?.title || '...'}</p>
          <p>Cours : {course?.title || '...'}</p>
        </div>

        {error && (
          <div className="alert alert-error">
            <Icon name="error" size={IconSizes.sm} color={IconColors.white} />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="create-course-form">
          <div className="form-section">
            <h3>Informations de base</h3>
            
            <div className="form-group">
              <label htmlFor="title">Titre de la leçon *</label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                required
                maxLength={100}
                placeholder="Titre de la leçon"
              />
            </div>

            <div className="form-group">
              <label htmlFor="description">Description *</label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                required
                rows={3}
                placeholder="Description courte de la leçon"
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="duration">Durée *</label>
                <input
                  type="text"
                  id="duration"
                  name="duration"
                  value={formData.duration}
                  onChange={handleInputChange}
                  required
                  placeholder="ex: 15 minutes"
                />
              </div>

              <div className="form-group">
                <label htmlFor="order">Ordre</label>
                <input
                  type="number"
                  id="order"
                  name="order"
                  value={formData.order}
                  onChange={handleInputChange}
                  min={1}
                  required
                />
              </div>
            </div>
          </div>

          <div className="form-section">
            <h3>Contenu et type</h3>
            
            <div className="form-group">
              <label htmlFor="type">Type de leçon</label>
              <select
                id="type"
                name="type"
                value={formData.type}
                onChange={handleInputChange}
              >
                <option value="text">Texte</option>
                <option value="video">Vidéo</option>
                <option value="quiz">Quiz</option>
                <option value="assignment">Devoir</option>
                <option value="interactive">Interactif</option>
              </select>
            </div>

            {formData.type === 'video' && (
              <div className="form-group">
                <label htmlFor="videoUrl">URL de la vidéo</label>
                <input
                  type="url"
                  id="videoUrl"
                  name="videoUrl"
                  value={formData.videoUrl}
                  onChange={handleInputChange}
                  placeholder="https://..."
                />
              </div>
            )}

            <div className="form-group">
              <label htmlFor="content">Contenu de la leçon *</label>
              <textarea
                id="content"
                name="content"
                value={formData.content}
                onChange={handleInputChange}
                required
                rows={8}
                placeholder="Contenu détaillé de la leçon..."
              />
            </div>
          </div>

          <div className="form-section">
            <h3>Paramètres avancés</h3>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="difficulty">Niveau de difficulté</label>
                <select
                  id="difficulty"
                  name="difficulty"
                  value={formData.difficulty}
                  onChange={handleInputChange}
                >
                  <option value="facile">Facile</option>
                  <option value="moyen">Moyen</option>
                  <option value="difficile">Difficile</option>
                </select>
              </div>

              <div className="form-group checkbox-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="isFree"
                    checked={formData.isFree}
                    onChange={handleInputChange}
                  />
                  <span className="checkmark"></span>
                  Leçon gratuite
                </label>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="tags">Tags (séparés par des virgules)</label>
              <input
                type="text"
                id="tags"
                name="tags"
                value={formData.tags.join(', ')}
                onChange={handleTagsChange}
                placeholder="tag1, tag2, tag3"
              />
            </div>
          </div>

          <div className="form-actions">
            <button
              type="button"
              onClick={() => navigate(`/tutor/manage-lessons/${moduleId}`)}
              className="btn btn-secondary"
              disabled={submitting}
            >
              <Icon name="x" size={IconSizes.sm} color={IconColors.white} />
              Annuler
            </button>
            
            <button
              type="submit"
              className="btn btn-primary"
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <Icon name="loader" size={IconSizes.sm} color={IconColors.white} />
                  Création...
                </>
              ) : (
                <>
                  <Icon name="check" size={IconSizes.sm} color={IconColors.white} />
                  Créer la leçon
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateLesson;
