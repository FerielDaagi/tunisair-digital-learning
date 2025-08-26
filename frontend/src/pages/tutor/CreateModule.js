import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { modulesAPI } from '../../services/api';
import { Icon, IconSizes, IconColors } from '../../components/common/IconTheme';
import './CreateCourse.css';

const CreateModule = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { courseId } = useParams();
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    order: 1,
    isPublished: false
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
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
    
    // Charger les informations du cours
    const fetchCourse = async () => {
      try {
        const response = await fetch(`http://localhost:5000/api/courses/${courseId}`);
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setCourse(data.data);
            
            // Calculer le prochain ordre disponible
            const existingModules = data.data.modules || [];
            const maxOrder = existingModules.length > 0 
              ? Math.max(...existingModules.map(m => m.order || 0))
              : 0;
            
            setFormData(prev => ({
              ...prev,
              order: maxOrder + 1
            }));
            
            console.log('📊 Ordre calculé:', maxOrder + 1, 'pour', existingModules.length, 'modules existants');
          }
        }
      } catch (error) {
        console.error('Erreur chargement cours:', error);
      }
    };
    
    fetchCourse();
  }, [user, navigate, courseId]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Validation
      if (!formData.title.trim()) {
        setError('Le titre du module est requis');
        setLoading(false);
        return;
      }

      if (!formData.description.trim()) {
        setError('La description du module est requise');
        setLoading(false);
        return;
      }

      const moduleData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        order: parseInt(formData.order),
        isPublished: formData.isPublished,
        course: courseId
      };

      console.log('Données du module à créer:', moduleData);

      const response = await modulesAPI.create(moduleData);
      
      if (response.data.success) {
        setSuccess('Module créé avec succès !');
        
        // Rediriger vers la gestion des modules après 2 secondes
        setTimeout(() => {
          navigate(`/tutor/manage-modules/${courseId}`);
        }, 2000);
      } else {
        // Gérer les erreurs spécifiques
        if (response.data.message.includes('ordre existe déjà')) {
          setError('Un module avec cet ordre existe déjà dans ce cours. Veuillez choisir un ordre différent.');
        } else {
          setError(response.data.message || 'Erreur lors de la création du module');
        }
      }
    } catch (error) {
      console.error('Erreur création module:', error);
      
      // Afficher l'erreur spécifique si disponible
      if (error.response) {
        // Erreur de réponse du serveur
        console.error('Détails erreur serveur:', error.response.data);
        setError(error.response.data.message || `Erreur serveur: ${error.response.status}`);
      } else if (error.request) {
        // Erreur de requête (pas de réponse)
        console.error('Pas de réponse du serveur');
        setError('Le serveur ne répond pas. Vérifiez votre connexion.');
      } else {
        // Autre erreur
        console.error('Erreur inconnue:', error.message);
        setError(`Erreur: ${error.message}`);
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
          <p>Seuls les tuteurs peuvent créer des modules.</p>
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
            Créer un nouveau module
          </h1>
          <p>Ajoutez un module au cours : {course?.title || '...'}</p>
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
          {/* Informations du module */}
          <div className="form-section">
            <div className="section-header">
              <Icon name="info" size={IconSizes.md} color={IconColors.primary} />
              <h3>Informations du module</h3>
            </div>
            
            <div className="form-group">
              <label htmlFor="title">
                <Icon name="edit" size={IconSizes.xs} color={IconColors.primary} />
                Titre du module *
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
                maxLength={100}
                placeholder="Ex: Introduction à React"
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
                Description du module *
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                required
                maxLength={500}
                rows={4}
                placeholder="Décrivez ce que ce module va couvrir"
                className="form-textarea"
              />
              <div className="char-counter">
                <Icon name="hash" size={IconSizes.xs} color={IconColors.muted} />
                <span className={formData.description.length > 400 ? 'warning' : ''}>
                  {formData.description.length}/500 caractères
                </span>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="order">
                  <Icon name="list" size={IconSizes.xs} color={IconColors.primary} />
                  Ordre du module
                </label>
                <input
                  type="number"
                  id="order"
                  name="order"
                  value={formData.order}
                  onChange={handleChange}
                  min="1"
                  max="100"
                  className="form-input"
                />
                <small>Position du module dans le cours</small>
              </div>

              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="isPublished"
                    checked={formData.isPublished}
                    onChange={handleChange}
                    className="form-checkbox"
                  />
                  <Icon name="globe" size={IconSizes.xs} color={IconColors.primary} />
                  Publier le module
                </label>
                <small>Le module sera visible pour les étudiants</small>
              </div>
            </div>
          </div>

          {/* Boutons d'action */}
          <div className="form-actions">
            <button
              type="button"
              onClick={() => navigate(`/tutor/manage-modules/${courseId}`)}
              className="btn btn-secondary"
              disabled={loading}
            >
              <Icon name="arrowLeft" size={IconSizes.sm} color={IconColors.white} />
              Retour aux modules
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
                  Créer le module
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateModule;

