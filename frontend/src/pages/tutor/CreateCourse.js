import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { coursesAPI } from '../../services/api';
import { Icon, IconSizes, IconColors } from '../../components/common/IconTheme';
import './CreateCourse.css';

const CreateCourse = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    longDescription: '',
    category: '',
    level: '',
    hours: '',
    minutes: '',
    requirements: '',
    outcomes: '',
    tags: '',
    language: 'français'
  });
  
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    // Vérifier que l'utilisateur est un tuteur
    if (user && user.role !== 'tuteur') {
      navigate('/dashboard');
      return;
    }
    
    // Charger les catégories (pour l'instant, catégories statiques)
    setCategories([
      { _id: 'frontend', name: 'Frontend' },
      { _id: 'backend', name: 'Backend' },
      { _id: 'database', name: 'Base de données' },
      { _id: 'mobile', name: 'Développement mobile' },
      { _id: 'devops', name: 'DevOps' },
      { _id: 'ai-ml', name: 'IA & Machine Learning' },
      { _id: 'cybersecurity', name: 'Cybersécurité' },
      { _id: 'other', name: 'Autre' }
    ]);
  }, [user, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Formater la durée en combinant heures et minutes
      let duration = '';
      if (formData.hours && formData.minutes) {
        duration = `${formData.hours} heure${parseInt(formData.hours) > 1 ? 's' : ''} ${formData.minutes} minute${parseInt(formData.minutes) > 1 ? 's' : ''}`;
      } else if (formData.hours) {
        duration = `${formData.hours} heure${parseInt(formData.hours) > 1 ? 's' : ''}`;
      } else if (formData.minutes) {
        duration = `${formData.minutes} minute${parseInt(formData.minutes) > 1 ? 's' : ''}`;
      } else {
        setError('Veuillez spécifier au moins la durée en heures ou en minutes');
        setLoading(false);
        return;
      }

      // Traiter les tags et requirements/outcomes
      const tags = formData.tags ? formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag) : [];
      const requirements = formData.requirements ? formData.requirements.split('\n').map(req => req.trim()).filter(req => req) : [];
      const outcomes = formData.outcomes ? formData.outcomes.split('\n').map(out => out.trim()).filter(out => out) : [];

      const courseData = {
        ...formData,
        duration,
        tags,
        requirements,
        outcomes
      };

      // Supprimer les champs temporaires
      delete courseData.hours;
      delete courseData.minutes;

      const response = await coursesAPI.create(courseData);
      setSuccess('Cours créé avec succès !');
      setFormData({
        title: '',
        description: '',
        longDescription: '',
        category: '',
        level: '',
        hours: '',
        minutes: '',
        requirements: '',
        outcomes: '',
        tags: '',
        language: 'français'
      });
    } catch (error) {
      console.error('Erreur création cours:', error);
      setError('Erreur lors de la création du cours. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  if (!user || user.role !== 'tuteur') {
    return (
      <div className="create-course-page">
        <div className="access-denied">
          <Icon name="lock" size={IconSizes.xl} color={IconColors.error} />
          <h2>Accès refusé</h2>
          <p>Seuls les tuteurs peuvent créer des cours.</p>
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
            Créer un nouveau cours
          </h1>
          <p>Partagez vos connaissances et créez un cours de qualité</p>
        </div>

        {error && (
          <div className="alert alert-error">
            <Icon name="error" size={IconSizes.sm} color={IconColors.white} />
            {error}
          </div>
        )}

        {success && (
          <div className="alert alert-success">
            <Icon name="success" size={IconSizes.sm} color={IconColors.white} />
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="create-course-form">
          <div className="form-section">
            <h3>
              <Icon name="info" size={IconSizes.sm} color={IconColors.primary} />
              Informations de base
            </h3>
            
            <div className="form-group">
              <label htmlFor="title">Titre du cours *</label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
                maxLength={100}
                placeholder="Ex: Maîtrisez React en 30 jours"
              />
              <small>{formData.title.length}/100 caractères</small>
            </div>

            <div className="form-group">
              <label htmlFor="description">Description courte *</label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                required
                maxLength={500}
                rows={3}
                placeholder="Une description concise de votre cours"
              />
              <small>{formData.description.length}/500 caractères</small>
            </div>

            <div className="form-group">
              <label htmlFor="longDescription">Description détaillée *</label>
              <textarea
                id="longDescription"
                name="longDescription"
                value={formData.longDescription}
                onChange={handleChange}
                required
                rows={6}
                placeholder="Décrivez en détail ce que les étudiants apprendront dans votre cours"
              />
            </div>
          </div>

          <div className="form-section">
            <h3>
              <Icon name="settings" size={IconSizes.sm} color={IconColors.primary} />
              Configuration du cours
            </h3>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="category">Catégorie *</label>
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  required
                >
                  <option value="">Sélectionnez une catégorie</option>
                  {categories.map(cat => (
                    <option key={cat._id} value={cat._id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="level">Niveau *</label>
                <select
                  id="level"
                  name="level"
                  value={formData.level}
                  onChange={handleChange}
                  required
                  className="form-input"
                >
                  <option value="">Sélectionner un niveau</option>
                  <option value="débutant">Débutant</option>
                  <option value="intermédiaire">Intermédiaire</option>
                  <option value="avancé">Avancé</option>
                </select>
              </div>
            </div>

            {/* Durée - Heures et Minutes */}
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="hours">Heures</label>
                <input
                  type="number"
                  id="hours"
                  name="hours"
                  value={formData.hours}
                  onChange={handleChange}
                  min="0"
                  max="999"
                  placeholder="0"
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label htmlFor="minutes">Minutes</label>
                <input
                  type="number"
                  id="minutes"
                  name="minutes"
                  value={formData.minutes}
                  onChange={handleChange}
                  min="0"
                  max="59"
                  placeholder="0"
                  className="form-input"
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="language">Langue du cours</label>
              <select
                id="language"
                name="language"
                value={formData.language}
                onChange={handleChange}
              >
                <option value="français">Français</option>
                <option value="english">English</option>
              </select>
            </div>
          </div>

          <div className="form-section">
            <h3>
              <Icon name="target" size={IconSizes.sm} color={IconColors.primary} />
              Prérequis et objectifs
            </h3>
            
            <div className="form-group">
              <label htmlFor="requirements">Prérequis</label>
              <textarea
                id="requirements"
                name="requirements"
                value={formData.requirements}
                onChange={handleChange}
                rows={3}
                placeholder="Ex: Connaissance de base en HTML et CSS&#10;Ex: Notions de JavaScript&#10;Ex: Aucun prérequis nécessaire"
              />
              <small>Séparez chaque prérequis par une nouvelle ligne</small>
            </div>

            <div className="form-group">
              <label htmlFor="outcomes">Objectifs d'apprentissage</label>
              <textarea
                id="outcomes"
                name="outcomes"
                value={formData.outcomes}
                onChange={handleChange}
                rows={3}
                placeholder="Ex: Créer des composants React réutilisables&#10;Ex: Maîtriser les hooks React&#10;Ex: Déployer une application React"
              />
              <small>Séparez chaque objectif par une nouvelle ligne</small>
            </div>
          </div>

          <div className="form-section">
            <h3>
              <Icon name="tag" size={IconSizes.sm} color={IconColors.primary} />
              Mots-clés
            </h3>
            
            <div className="form-group">
              <label htmlFor="tags">Tags</label>
              <input
                type="text"
                id="tags"
                name="tags"
                value={formData.tags}
                onChange={handleChange}
                placeholder="Ex: React, JavaScript, Frontend, Web Development"
              />
              <small>Séparez chaque tag par une virgule</small>
            </div>
          </div>

          <div className="form-actions">
            <button
              type="button"
              onClick={() => navigate('/tutor/my-courses')}
              className="btn btn-secondary"
              disabled={loading}
            >
              <Icon name="arrowLeft" size={IconSizes.sm} color={IconColors.white} />
              Annuler
            </button>
            
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Icon name="loader" size={IconSizes.sm} color={IconColors.white} />
                  Création en cours...
                </>
              ) : (
                <>
                  <Icon name="save" size={IconSizes.sm} color={IconColors.white} />
                  Créer le cours
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateCourse;
