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
    level: 'débutant',
    duration: '',
    requirements: [''],
    outcomes: [''],
    tags: [''],
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

  const handleArrayChange = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].map((item, i) => i === index ? value : item)
    }));
  };

  const addArrayItem = (field) => {
    setFormData(prev => ({
      ...prev,
      [field]: [...prev[field], '']
    }));
  };

  const removeArrayItem = (field, index) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Nettoyer les tableaux vides
      const cleanedData = {
        ...formData,
        requirements: formData.requirements.filter(req => req.trim() !== ''),
        outcomes: formData.outcomes.filter(out => out.trim() !== ''),
        tags: formData.tags.filter(tag => tag.trim() !== '')
      };

      const response = await coursesAPI.create(cleanedData);
      
      if (response.data.success) {
        setSuccess('Cours créé avec succès ! Redirection vers la gestion des cours...');
        setTimeout(() => {
          navigate('/tutor/my-courses');
        }, 2000);
      }
    } catch (err) {
      console.error('Erreur création cours:', err);
      setError(err.response?.data?.message || 'Erreur lors de la création du cours');
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
                >
                  <option value="débutant">Débutant</option>
                  <option value="intermédiaire">Intermédiaire</option>
                  <option value="avancé">Avancé</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="duration">Durée estimée *</label>
                <input
                  type="text"
                  id="duration"
                  name="duration"
                  value={formData.duration}
                  onChange={handleChange}
                  required
                  placeholder="Ex: 8 heures"
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
              <label>Prérequis</label>
              {formData.requirements.map((req, index) => (
                <div key={index} className="array-input-group">
                  <input
                    type="text"
                    value={req}
                    onChange={(e) => handleArrayChange(index, 'requirements', e.target.value)}
                    placeholder="Ex: Connaissance de base en HTML et CSS"
                  />
                  {formData.requirements.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeArrayItem('requirements', index)}
                      className="remove-btn"
                      title="Supprimer ce prérequis"
                    >
                      <Icon name="trash" size={IconSizes.xs} color={IconColors.error} />
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={() => addArrayItem('requirements')}
                className="add-btn"
              >
                <Icon name="plus" size={IconSizes.xs} color={IconColors.primary} />
                Ajouter un prérequis
              </button>
            </div>

            <div className="form-group">
              <label>Objectifs d'apprentissage</label>
              {formData.outcomes.map((out, index) => (
                <div key={index} className="array-input-group">
                  <input
                    type="text"
                    value={out}
                    onChange={(e) => handleArrayChange(index, 'outcomes', e.target.value)}
                    placeholder="Ex: Créer des composants React réutilisables"
                  />
                  {formData.outcomes.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeArrayItem('outcomes', index)}
                      className="remove-btn"
                      title="Supprimer cet objectif"
                    >
                      <Icon name="trash" size={IconSizes.xs} color={IconColors.error} />
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={() => addArrayItem('outcomes')}
                className="add-btn"
              >
                <Icon name="plus" size={IconSizes.xs} color={IconColors.primary} />
                Ajouter un objectif
              </button>
            </div>
          </div>

          <div className="form-section">
            <h3>
              <Icon name="tag" size={IconSizes.sm} color={IconColors.primary} />
              Mots-clés
            </h3>
            
            <div className="form-group">
              <label>Tags</label>
              {formData.tags.map((tag, index) => (
                <div key={index} className="array-input-group">
                  <input
                    type="text"
                    value={tag}
                    onChange={(e) => handleArrayChange(index, 'tags', e.target.value)}
                    placeholder="Ex: React, JavaScript, Frontend"
                  />
                  {formData.tags.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeArrayItem('tags', index)}
                      className="remove-btn"
                      title="Supprimer ce tag"
                    >
                      <Icon name="trash" size={IconSizes.xs} color={IconColors.error} />
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={() => addArrayItem('tags')}
                className="add-btn"
              >
                <Icon name="plus" size={IconSizes.xs} color={IconColors.primary} />
                Ajouter un tag
              </button>
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
