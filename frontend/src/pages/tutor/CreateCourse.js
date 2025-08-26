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
    requirements: [''],
    outcomes: [''],
    tags: [''],
    language: 'français'
  });
  
  const [thumbnail, setThumbnail] = useState(null);
  const [thumbnailPreview, setThumbnailPreview] = useState('');
  
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showNewCategoryInput, setShowNewCategoryInput] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  useEffect(() => {
    // Vérifier que l'utilisateur est un tuteur
    if (user && user.role !== 'tuteur') {
      navigate('/dashboard');
      return;
    }
    
    // Charger les catégories depuis l'API
    const fetchCategories = async () => {
      try {
        const response = await fetch('/api/categories');
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setCategories(data.data);
          }
        }
      } catch (error) {
        console.error('Erreur chargement catégories:', error);
        // Fallback vers les catégories statiques en cas d'erreur
        setCategories([
          { _id: 'frontend', name: 'Frontend' },
          { _id: 'backend', name: 'Backend' },
          { _id: 'database', name: 'Base de données' },
          { _id: 'mobile', name: 'Développement mobile' },
          { _id: 'devops', name: 'DevOps' },
          { _id: 'ai-ml', name: 'IA & Machine Learning' },
          { _id: 'cybersecurity', name: 'Cybersécurité' }
        ]);
      }
    };
    
    fetchCategories();
  }, [user, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Gérer l'affichage du champ de nouvelle catégorie
    if (name === 'category') {
      if (value === 'other') {
        setShowNewCategoryInput(true);
        setNewCategoryName('');
      } else {
        setShowNewCategoryInput(false);
        setNewCategoryName('');
      }
    }
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
    if (formData[field].length > 1) {
      setFormData(prev => ({
        ...prev,
        [field]: prev[field].filter((_, i) => i !== index)
      }));
    }
  };

  const handleThumbnailChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validation du type de fichier
      if (!file.type.startsWith('image/')) {
        setError('Veuillez sélectionner une image valide (JPG, PNG, GIF)');
        return;
      }
      
      // Validation de la taille (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('L\'image ne doit pas dépasser 5MB');
        return;
      }
      
      setThumbnail(file);
      setError(''); // Effacer les erreurs précédentes
      
      // Créer un aperçu
      const reader = new FileReader();
      reader.onload = (e) => {
        setThumbnailPreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeThumbnail = () => {
    setThumbnail(null);
    setThumbnailPreview('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Validation des champs requis
      if (!formData.title.trim()) {
        setError('Le titre du cours est requis');
        setLoading(false);
        return;
      }

      if (!formData.description.trim()) {
        setError('La description du cours est requise');
        setLoading(false);
        return;
      }

      if (!formData.longDescription.trim()) {
        setError('La description détaillée du cours est requise');
        setLoading(false);
        return;
      }

      if (!formData.category) {
        setError('Veuillez sélectionner une catégorie');
        setLoading(false);
        return;
      }
      
      // Validation spéciale pour la nouvelle catégorie
      if (formData.category === 'other' && !newCategoryName.trim()) {
        setError('Veuillez saisir le nom de la nouvelle catégorie');
        setLoading(false);
        return;
      }

      if (!formData.level) {
        setError('Veuillez sélectionner un niveau');
        setLoading(false);
        return;
      }

      // Validation de la durée
      if (!formData.hours && !formData.minutes) {
        setError('Veuillez spécifier au moins la durée en heures ou en minutes');
        setLoading(false);
        return;
      }

      // Formater la durée en combinant heures et minutes
      let duration = '';
      if (formData.hours && formData.minutes) {
        const hours = parseInt(formData.hours);
        const minutes = parseInt(formData.minutes);
        if (hours > 0 && minutes > 0) {
          duration = `${hours} heure${hours > 1 ? 's' : ''} ${minutes} minute${minutes > 1 ? 's' : ''}`;
        } else if (hours > 0) {
          duration = `${hours} heure${hours > 1 ? 's' : ''}`;
        } else if (minutes > 0) {
          duration = `${minutes} minute${minutes > 1 ? 's' : ''}`;
        }
      } else if (formData.hours) {
        const hours = parseInt(formData.hours);
        if (hours > 0) {
          duration = `${hours} heure${hours > 1 ? 's' : ''}`;
        }
      } else if (formData.minutes) {
        const minutes = parseInt(formData.minutes);
        if (minutes > 0) {
          duration = `${minutes} minute${minutes > 1 ? 's' : ''}`;
        }
      }

      if (!duration) {
        setError('Veuillez spécifier une durée valide');
        setLoading(false);
        return;
      }

      // Traiter les tags et requirements/outcomes - filtrer les chaînes vides
      const tags = formData.tags.filter(tag => tag.trim() !== '');
      const requirements = formData.requirements.filter(req => req.trim() !== '');
      const outcomes = formData.outcomes.filter(out => out.trim() !== '');

      // Créer un FormData pour inclure l'image
      const courseData = new FormData();
      courseData.append('title', formData.title.trim());
      courseData.append('description', formData.description.trim());
      courseData.append('longDescription', formData.longDescription.trim());
      courseData.append('category', formData.category === 'other' ? newCategoryName.trim() : formData.category);
      courseData.append('level', formData.level);
      courseData.append('duration', duration);
      courseData.append('tags', JSON.stringify(tags));
      courseData.append('requirements', JSON.stringify(requirements));
      courseData.append('outcomes', JSON.stringify(outcomes));
      courseData.append('language', formData.language);
      
      // Ajouter l'image si elle existe
      if (thumbnail) {
        courseData.append('thumbnail', thumbnail);
      }

      console.log('Données du cours à envoyer:', courseData);

      const response = await coursesAPI.create(courseData);
      
      if (response.data.success) {
        setSuccess('Cours créé avec succès !');
        setFormData({
          title: '',
          description: '',
          longDescription: '',
          category: '',
          level: '',
          hours: '',
          minutes: '',
          requirements: [''],
          outcomes: [''],
          tags: [''],
          language: 'français'
        });
        
        // Réinitialiser l'image
        setThumbnail(null);
        setThumbnailPreview('');
        
        // Réinitialiser les champs de nouvelle catégorie
        setShowNewCategoryInput(false);
        setNewCategoryName('');

        // Rediriger vers la liste des cours après 2 secondes
        setTimeout(() => {
          navigate('/tutor/my-courses');
        }, 2000);
      } else {
        setError(response.data.message || 'Erreur lors de la création du cours');
      }
    } catch (error) {
      console.error('Erreur création cours:', error);
      
      // Gestion des erreurs de validation
      if (error.response?.data?.errors) {
        const validationErrors = error.response.data.errors.map(err => err.message).join(', ');
        setError(`Erreurs de validation: ${validationErrors}`);
      } else if (error.response?.data?.message) {
        setError(error.response.data.message);
      } else {
        setError('Erreur lors de la création du cours. Veuillez réessayer.');
      }
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
          {/* Section 1: Informations de base */}
          <div className="form-section">
            <div className="section-header">
              <Icon name="info" size={IconSizes.md} color={IconColors.primary} />
              <h3>Informations de base</h3>
            </div>
            
            <div className="form-group">
              <label htmlFor="title">
                <Icon name="edit" size={IconSizes.xs} color={IconColors.primary} />
                Titre du cours *
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
                maxLength={100}
                placeholder="Ex: Maîtrisez React en 30 jours"
                className="form-input"
              />
              <div className="char-counter">
                <Icon name="hash" size={IconSizes.xs} color={IconColors.muted} />
                <span className={formData.title.length > 80 ? 'warning' : ''}>
                  {formData.title.length}/100 caractères
                </span>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="description">
                <Icon name="fileText" size={IconSizes.xs} color={IconColors.primary} />
                Description courte *
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                required
                maxLength={500}
                rows={3}
                placeholder="Une description concise de votre cours"
                className="form-textarea"
              />
              <div className="char-counter">
                <Icon name="hash" size={IconSizes.xs} color={IconColors.muted} />
                <span className={formData.description.length > 400 ? 'warning' : ''}>
                  {formData.description.length}/500 caractères
                </span>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="longDescription">
                <Icon name="bookOpen" size={IconSizes.xs} color={IconColors.primary} />
                Description détaillée *
              </label>
              <textarea
                id="longDescription"
                name="longDescription"
                value={formData.longDescription}
                onChange={handleChange}
                required
                rows={6}
                placeholder="Décrivez en détail ce que les apprentis apprendront dans votre cours"
                className="form-textarea"
              />
            </div>

            <div className="form-group">
              <label htmlFor="thumbnail">
                <Icon name="image" size={IconSizes.xs} color={IconColors.primary} />
                Image de couverture
              </label>
              <div className="thumbnail-upload">
                <input
                  type="file"
                  id="thumbnail"
                  name="thumbnail"
                  accept="image/*"
                  onChange={handleThumbnailChange}
                  className="thumbnail-input"
                />
                <div className="thumbnail-preview">
                  {thumbnailPreview ? (
                    <div className="preview-container">
                      <img src={thumbnailPreview} alt="Aperçu de l'image" className="preview-image" />
                      <button
                        type="button"
                        onClick={removeThumbnail}
                        className="remove-thumbnail"
                        title="Supprimer l'image"
                      >
                        <Icon name="x" size={IconSizes.sm} color={IconColors.white} />
                      </button>
                    </div>
                  ) : (
                    <div className="upload-placeholder">
                      <Icon name="upload" size={IconSizes.lg} color={IconColors.muted} />
                      <p>Cliquez pour sélectionner une image</p>
                      <span className="upload-hint">JPG, PNG, GIF - Max 5MB</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Configuration du cours */}
          <div className="form-section">
            <div className="section-header">
              <Icon name="settings" size={IconSizes.md} color={IconColors.primary} />
              <h3>Configuration du cours</h3>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="category">
                  <Icon name="folder" size={IconSizes.xs} color={IconColors.primary} />
                  Catégorie *
                </label>
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  required
                  className="form-select"
                >
                  <option value="">Sélectionnez une catégorie</option>
                  {categories.map(cat => (
                    <option key={cat._id} value={cat.name}>
                      {cat.name}
                    </option>
                  ))}
                  <option value="other">Autre (nouvelle catégorie)</option>
                </select>
                
                {/* Champ de saisie pour la nouvelle catégorie */}
                {showNewCategoryInput && (
                  <div className="form-group" style={{ marginTop: '12px' }}>
                    <label htmlFor="newCategoryName">
                      <Icon name="plus" size={IconSizes.xs} color={IconColors.primary} />
                      Nom de la nouvelle catégorie *
                    </label>
                    <input
                      type="text"
                      id="newCategoryName"
                      name="newCategoryName"
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      required
                      maxLength={50}
                      placeholder="Ex: Intelligence Artificielle, Blockchain, Cloud Computing..."
                      className="form-input"
                    />
                    <div className="char-counter">
                      <Icon name="hash" size={IconSizes.xs} color={IconColors.muted} />
                      <span className={newCategoryName.length > 40 ? 'warning' : ''}>
                        {newCategoryName.length}/50 caractères
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="level">
                  <Icon name="trendingUp" size={IconSizes.xs} color={IconColors.primary} />
                  Niveau *
                </label>
                <select
                  id="level"
                  name="level"
                  value={formData.level}
                  onChange={handleChange}
                  required
                  className="form-select"
                >
                  <option value="">Sélectionner un niveau</option>
                  <option value="débutant">Débutant</option>
                  <option value="intermédiaire">Intermédiaire</option>
                  <option value="avancé">Avancé</option>
                </select>
              </div>
            </div>

            {/* Durée - Heures et Minutes */}
            <div className="duration-section">
              <label className="duration-label">
                <Icon name="clock" size={IconSizes.xs} color={IconColors.primary} />
                Durée estimée
              </label>
              <div className="duration-inputs">
                <div className="form-group">
                  <label htmlFor="hours">Heures</label>
                  <div className="number-input-wrapper">
                    <input
                      type="number"
                      id="hours"
                      name="hours"
                      value={formData.hours}
                      onChange={handleChange}
                      min="0"
                      max="999"
                      placeholder="0"
                      className="form-input number-input"
                    />
                    <span className="unit">h</span>
                  </div>
                </div>
                <div className="form-group">
                  <label htmlFor="minutes">Minutes</label>
                  <div className="number-input-wrapper">
                    <input
                      type="number"
                      id="minutes"
                      name="minutes"
                      value={formData.minutes}
                      onChange={handleChange}
                      min="0"
                      max="59"
                      placeholder="0"
                      className="form-input number-input"
                    />
                    <span className="unit">min</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="language">
                <Icon name="globe" size={IconSizes.xs} color={IconColors.primary} />
                Langue du cours
              </label>
              <select
                id="language"
                name="language"
                value={formData.language}
                onChange={handleChange}
                className="form-select"
              >
                <option value="français">Français</option>
                <option value="english">English</option>
              </select>
            </div>
          </div>

          {/* Section 3: Prérequis et objectifs */}
          <div className="form-section">
            <div className="section-header">
              <Icon name="target" size={IconSizes.md} color={IconColors.primary} />
              <h3>Prérequis et objectifs</h3>
            </div>
            
            <div className="form-group">
              <label htmlFor="requirements">
                <Icon name="checkCircle" size={IconSizes.xs} color={IconColors.primary} />
                Prérequis
              </label>
              {formData.requirements.map((req, index) => (
                <div key={index} className="array-input-group">
                  <input
                    type="text"
                    value={req}
                    onChange={(e) => handleArrayChange(index, 'requirements', e.target.value)}
                    placeholder={`Prérequis ${index + 1} (ex: Connaissance de base en HTML et CSS)`}
                    className="form-input"
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
              <label htmlFor="outcomes">
                <Icon name="star" size={IconSizes.xs} color={IconColors.primary} />
                Objectifs d'apprentissage
              </label>
              {formData.outcomes.map((out, index) => (
                <div key={index} className="array-input-group">
                  <input
                    type="text"
                    value={out}
                    onChange={(e) => handleArrayChange(index, 'outcomes', e.target.value)}
                    placeholder={`Objectif ${index + 1} (ex: Créer des composants React réutilisables)`}
                    className="form-input"
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

          {/* Section 4: Mots-clés */}
          <div className="form-section">
            <div className="section-header">
              <Icon name="tag" size={IconSizes.md} color={IconColors.primary} />
              <h3>Mots-clés</h3>
            </div>
            
            <div className="form-group">
              <label htmlFor="tags">
                <Icon name="hash" size={IconSizes.xs} color={IconColors.primary} />
                Tags
              </label>
              {formData.tags.map((tag, index) => (
                <div key={index} className="array-input-group">
                  <input
                    type="text"
                    value={tag}
                    onChange={(e) => handleArrayChange(index, 'tags', e.target.value)}
                    placeholder={`Tag ${index + 1} (ex: React, JavaScript, Frontend)`}
                    className="form-input"
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

          {/* Actions du formulaire */}
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
