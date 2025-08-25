import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { coursesAPI } from '../../services/api';
import { Icon, IconSizes, IconColors } from '../../components/common/IconTheme';
import './CreateCourse.css';

const EditCourse = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { courseId } = useParams();
  
  console.log('🔍 EditCourse - user:', user);
  console.log('🔍 EditCourse - courseId:', courseId);
  
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
  
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showNewCategoryInput, setShowNewCategoryInput] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [course, setCourse] = useState(null);

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
    
    // Charger les catégories et le cours
    const fetchData = async () => {
      try {
        // Charger les catégories
        const categoriesResponse = await fetch('http://localhost:5000/api/categories');
        if (categoriesResponse.ok) {
          const data = await categoriesResponse.json();
          if (data.success) {
            setCategories(data.data);
          } else {
            console.warn('Réponse catégories non valide:', data);
            // Fallback vers les catégories statiques
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
        } else {
          console.warn('Erreur HTTP catégories:', categoriesResponse.status);
          // Fallback vers les catégories statiques
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
        
        // Charger le cours à modifier
        console.log('Chargement du cours:', courseId);
        const courseResponse = await coursesAPI.getById(courseId);
        console.log('Réponse cours:', courseResponse);
        
        if (courseResponse.data.success) {
          const courseData = courseResponse.data.data;
          
          console.log('🔍 Course data:', courseData);
          console.log('🔍 User data:', user);
          console.log('🔍 Course instructor ID:', courseData.instructor?._id);
          console.log('🔍 User ID:', user.id);
          console.log('🔍 User _id:', user._id);
          
          // Vérifier que le cours appartient au tuteur connecté
          // Utiliser user._id car c'est la propriété qui existe
          if (courseData.instructor._id !== user._id) {
            console.error('Cours ne vous appartient pas');
            console.error('Instructor ID:', courseData.instructor._id);
            console.error('User _id:', user._id);
            navigate('/tutor/my-courses');
            return;
          }
          
          console.log('✅ Cours appartient à l\'utilisateur, affichage du formulaire');
          setCourse(courseData);
          
          // Parser la durée pour extraire heures et minutes
          const duration = courseData.duration;
          let hours = '';
          let minutes = '';
          
          if (duration && duration.includes('heure')) {
            const hoursMatch = duration.match(/(\d+)\s*heure/);
            if (hoursMatch) hours = hoursMatch[1];
          }
          if (duration && duration.includes('minute')) {
            const minutesMatch = duration.match(/(\d+)\s*minute/);
            if (minutesMatch) minutes = minutesMatch[1];
          }
          
          // Remplir le formulaire avec les données du cours
          setFormData({
            title: courseData.title || '',
            description: courseData.description || '',
            longDescription: courseData.longDescription || '',
            category: courseData.category || '',
            level: courseData.level || '',
            hours: hours,
            minutes: minutes,
            requirements: courseData.requirements?.length > 0 ? courseData.requirements : [''],
            outcomes: courseData.outcomes?.length > 0 ? courseData.outcomes : [''],
            tags: courseData.tags?.length > 0 ? courseData.tags : [''],
            language: courseData.language || 'français'
          });
        } else {
          console.error('Cours non trouvé:', courseResponse.data);
          setError('Cours introuvable. Vérifiez que l\'ID du cours est correct.');
        }
      } catch (error) {
        console.error('Erreur chargement données:', error);
        setError('Erreur lors du chargement des données: ' + error.message);
        
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
    
    fetchData();
  }, [user, navigate, courseId]);

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

      const courseData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        longDescription: formData.longDescription.trim(),
        category: formData.category === 'other' ? newCategoryName.trim() : formData.category,
        level: formData.level,
        duration,
        tags,
        requirements,
        outcomes,
        language: formData.language
      };

      console.log('Données du cours à modifier:', courseData);

      const response = await coursesAPI.update(courseId, courseData);
      
      if (response.data.success) {
        setSuccess('Cours modifié avec succès !');
        
        // Rediriger vers la liste des cours après 2 secondes
        setTimeout(() => {
          navigate('/tutor/my-courses');
        }, 2000);
      } else {
        setError(response.data.message || 'Erreur lors de la modification du cours');
      }
    } catch (error) {
      console.error('Erreur modification cours:', error);
      
      // Gestion des erreurs de validation
      if (error.response?.data?.errors) {
        const validationErrors = error.response.data.errors.map(err => err.message).join(', ');
        setError(`Erreurs de validation: ${validationErrors}`);
      } else if (error.response?.data?.message) {
        setError(error.response.data.message);
      } else {
        setError('Erreur lors de la modification du cours. Veuillez réessayer.');
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
          <p>Seuls les tuteurs peuvent modifier des cours.</p>
        </div>
      </div>
    );
  }

  // Afficher le formulaire même si le cours n'est pas encore chargé
  // Les données se rempliront automatiquement quand le cours sera chargé

  // Si erreur, rediriger immédiatement sans afficher d'erreur
  if (error) {
    // Redirection silencieuse
    setTimeout(() => {
      navigate('/tutor/my-courses');
    }, 100);
    return null;
  }

  return (
    <div className="create-course-page">
      <div className="create-course-container">
                 <div className="create-course-header">
           <h1>
             <Icon name="edit" size={IconSizes.lg} color={IconColors.primary} />
             Modifier le cours : {course ? course.title : '...'}
           </h1>
           <p>Modifiez les informations de votre cours</p>
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
              <label>
                <Icon name="list" size={IconSizes.xs} color={IconColors.primary} />
                Prérequis
              </label>
              {formData.requirements.map((req, index) => (
                <div key={index} className="array-input-group">
                  <input
                    type="text"
                    value={req}
                    onChange={(e) => handleArrayChange(index, 'requirements', e.target.value)}
                    placeholder="Ex: Connaissances de base en JavaScript"
                    className="form-input"
                  />
                  {formData.requirements.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeArrayItem('requirements', index)}
                      className="remove-btn"
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
              <label>
                <Icon name="checkCircle" size={IconSizes.xs} color={IconColors.primary} />
                Objectifs d'apprentissage
              </label>
              {formData.outcomes.map((out, index) => (
                <div key={index} className="array-input-group">
                  <input
                    type="text"
                    value={out}
                    onChange={(e) => handleArrayChange(index, 'outcomes', e.target.value)}
                    placeholder="Ex: Créer des composants React réutilisables"
                    className="form-input"
                  />
                  {formData.outcomes.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeArrayItem('outcomes', index)}
                      className="remove-btn"
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

          {/* Section 4: Tags */}
          <div className="form-section">
            <div className="section-header">
              <Icon name="tag" size={IconSizes.md} color={IconColors.primary} />
              <h3>Tags</h3>
            </div>
            
            <div className="form-group">
              <label>
                <Icon name="hash" size={IconSizes.xs} color={IconColors.primary} />
                Mots-clés
              </label>
              {formData.tags.map((tag, index) => (
                <div key={index} className="array-input-group">
                  <input
                    type="text"
                    value={tag}
                    onChange={(e) => handleArrayChange(index, 'tags', e.target.value)}
                    placeholder="Ex: React, JavaScript, Frontend"
                    className="form-input"
                  />
                  {formData.tags.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeArrayItem('tags', index)}
                      className="remove-btn"
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

          {/* Boutons d'action */}
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
                  Modification en cours...
                </>
              ) : (
                <>
                  <Icon name="save" size={IconSizes.sm} color={IconColors.white} />
                  Modifier le cours
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditCourse;
