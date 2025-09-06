import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import api, { lessonsAPI, modulesAPI, coursesAPI } from '../../services/api';
import { Icon, IconSizes, IconColors } from '../../components/common/IconTheme';
import './CreateCourse.css';

const CreateLesson = () => {
  const { user, addNotification } = useAuth();
  const navigate = useNavigate();
  const { moduleId } = useParams();
  
  const [module, setModule] = useState(null);
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingStep, setLoadingStep] = useState('Initialisation...');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [existingOrders, setExistingOrders] = useState([]);
  const [orderWarning, setOrderWarning] = useState('');
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    content: '',
    duration: '',
    order: 1,
    type: 'text',
    videoUrl: '',
    linkUrl: ''
  });

  const [selectedFiles, setSelectedFiles] = useState([]);
  const [selectedVideoFile, setSelectedVideoFile] = useState(null);

  useEffect(() => {
    console.log('CreateLesson useEffect triggered with:', { user, moduleId });
    
    // Vérifier que l'utilisateur est un tuteur
    if (!user) {
      console.log('No user, redirecting to login');
      navigate('/login');
      return;
    }
    
    if (user.role !== 'tuteur') {
      console.log('User is not a tutor, redirecting to dashboard');
      navigate('/dashboard');
      return;
    }
    
    // Timeout fallback to prevent infinite loading
    const timeoutId = setTimeout(() => {
      console.warn('Data fetch timeout - setting loading to false');
      setLoading(false);
      setError('Délai d\'attente dépassé. Le formulaire sera affiché avec des informations limitées.');
    }, 15000); // 15 seconds timeout
    
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Simple health check - try a basic endpoint
        setLoadingStep('Vérification de la connexion...');
        try {
          // Try to access a basic endpoint to check if backend is running
          await api.get('/courses?limit=1');
        } catch (healthError) {
          console.warn('Backend connection check failed:', healthError);
          // Continue anyway, might be a different endpoint or temporary issue
        }
        
        setLoadingStep('Récupération du module...');
        console.log('Fetching module data for ID:', moduleId);
        const moduleResponse = await modulesAPI.getById(moduleId);
        console.log('Module response:', moduleResponse);
        console.log('Module response.data:', moduleResponse.data);
        console.log('Module response.data.data:', moduleResponse.data?.data);
        console.log('Module response.data.success:', moduleResponse.data?.success);
        
        // Vérifier la structure de la réponse
        let moduleData;
        console.log('Module response structure:', {
          hasData: !!moduleResponse.data,
          hasSuccess: !!moduleResponse.data?.success,
          hasDataData: !!moduleResponse.data?.data,
          hasId: !!moduleResponse.data?._id,
          fullResponse: moduleResponse
        });
        
        if (moduleResponse.data && moduleResponse.data.success && moduleResponse.data.data) {
          // Structure: {success: true, data: {...}}
          moduleData = moduleResponse.data.data;
        } else if (moduleResponse.data && moduleResponse.data._id) {
          // Structure directe: {...}
          moduleData = moduleResponse.data;
        } else {
          throw new Error('Invalid module response structure');
        }
        
        console.log('Final module data:', moduleData);
        
        if (!moduleData.course) {
          throw new Error('Module does not have a course ID');
        }
        
        setModule(moduleData);
        
        setLoadingStep('Récupération du cours...');
        console.log('Fetching course data for ID:', moduleData.course);
        const courseResponse = await coursesAPI.getById(moduleData.course);
        console.log('Course response:', courseResponse);
        
        if (!courseResponse.data) {
          throw new Error('Course data is empty or undefined');
        }
        
        // Handle different course response structures
        let courseData = courseResponse.data;
        if (courseResponse.data.success && courseResponse.data.data) {
          courseData = courseResponse.data.data;
        }
        
        setCourse(courseData);
        
        // Charger les leçons existantes pour déterminer l'ordre
        try {
          setLoadingStep('Récupération des leçons existantes...');
          console.log('Fetching lessons for module:', moduleId);
          const lessonsResponse = await lessonsAPI.getByModule(moduleId);
          console.log('Lessons response:', lessonsResponse);
          console.log('Lessons response.data:', lessonsResponse.data);
          console.log('Lessons response.data.success:', lessonsResponse.data?.success);
          console.log('Lessons response.data.data:', lessonsResponse.data?.data);
          
          if (lessonsResponse.data) {
            // Gérer la structure de réponse de l'API
            let lessons;
            if (lessonsResponse.data.success && lessonsResponse.data.data) {
              // Structure: {success: true, data: [...]}
              lessons = lessonsResponse.data.data;
            } else if (Array.isArray(lessonsResponse.data)) {
              // Structure directe: [...]
              lessons = lessonsResponse.data;
            } else {
              lessons = [];
            }
            
            console.log('Lessons loaded:', lessons);
            
            // Extraire les ordres existants
            const orders = lessons
              .map(l => l?.order)
              .filter(o => typeof o === 'number' && Number.isFinite(o));
            
            console.log('Existing orders extracted:', orders);
            setExistingOrders(orders);
            
            // Calculer le prochain ordre disponible
            const maxOrder = orders.length > 0 ? Math.max(...orders) : 0;
            const nextOrder = maxOrder + 1;
            console.log('Max order:', maxOrder, 'Next order will be:', nextOrder);
            
            setFormData(prev => ({
              ...prev,
              order: nextOrder
            }));
            
            // Vérifier si l'ordre actuel dans formData est en conflit
            if (formData.order && orders.includes(formData.order)) {
              console.log('Current form order conflicts, updating warning');
              setOrderWarning(`⚠️ L'ordre ${formData.order} existe déjà. Les autres leçons seront automatiquement réorganisées.`);
            }
          }
        } catch (lessonsError) {
          console.warn('Failed to fetch lessons, using default order:', lessonsError);
          // Don't fail the entire form if lessons can't be loaded
        }
        
        // Set loading to false after successful data fetch
        console.log('Data fetch completed successfully, setting loading to false');
        setLoading(false);
        clearTimeout(timeoutId); // Clear timeout on success
      } catch (error) {
        console.error('Error in fetchData:', error);
        console.error('Error details:', {
          message: error.message,
          response: error.response,
          status: error.response?.status,
          data: error.response?.data,
          stack: error.stack
        });
        
        let errorMessage = 'Erreur lors du chargement des données';
        
        if (error.response?.status === 401) {
          errorMessage = 'Erreur d\'authentification. Veuillez vous reconnecter.';
        } else if (error.response?.status === 404) {
          errorMessage = 'Module ou cours introuvable.';
        } else if (error.response?.status === 500) {
          errorMessage = 'Erreur serveur interne.';
        } else if (error.message.includes('Module data is empty')) {
          errorMessage = 'Erreur: Données du module vides ou invalides';
        } else if (error.message.includes('Course data is empty')) {
          errorMessage = 'Erreur: Données du cours vides ou invalides';
        } else if (error.message) {
          errorMessage = `Erreur: ${error.message}`;
        }
        
        setError(errorMessage);
        setLoading(false);
        clearTimeout(timeoutId); // Clear timeout on error
      }
    };
    
    if (moduleId) {
      fetchData();
    } else {
      setError('ID du module manquant');
      setLoading(false);
    }
    
    // Cleanup function to clear timeout
    return () => {
      clearTimeout(timeoutId);
    };
  }, [user, navigate, moduleId]);

  // Debug loading state changes
  useEffect(() => {
    console.log('Loading state changed:', { loading, loadingStep, error, orderWarning });
  }, [loading, loadingStep, error, orderWarning]);

  // Debug existing orders changes
  useEffect(() => {
    console.log('Existing orders changed:', existingOrders);
  }, [existingOrders]);

  // Debug order warning changes
  useEffect(() => {
    console.log('Order warning changed:', orderWarning);
  }, [orderWarning]);

  // Vérifier les conflits d'ordre quand formData.order ou existingOrders changent
  useEffect(() => {
    if (existingOrders.length > 0 && formData.order) {
      const orderValue = parseInt(formData.order);
      if (Number.isFinite(orderValue) && existingOrders.includes(orderValue)) {
        console.log('Order conflict detected in useEffect:', orderValue);
        setOrderWarning(`⚠️ L'ordre ${orderValue} existe déjà. Les autres leçons seront automatiquement réorganisées.`);
      } else {
        console.log('No order conflict in useEffect');
        setOrderWarning('');
      }
    }
  }, [formData.order, existingOrders]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name === 'order') {
      // Valider que l'ordre est un nombre positif
      const orderValue = parseInt(value);
      console.log('Order input changed:', { value, orderValue, existingOrders });
      
      if (value === '' || (Number.isFinite(orderValue) && orderValue > 0)) {
        setFormData(prev => ({
          ...prev,
          [name]: value === '' ? '' : orderValue
        }));
        
        // Vérifier si l'ordre existe déjà (seulement si les données sont chargées)
        if (Number.isFinite(orderValue) && existingOrders.length > 0 && existingOrders.includes(orderValue)) {
          console.log('Order conflict detected:', orderValue);
          setOrderWarning(`⚠️ L'ordre ${orderValue} existe déjà. Les autres leçons seront automatiquement réorganisées.`);
        } else {
          console.log('No order conflict or data not loaded yet');
          setOrderWarning('');
        }
      }
    } else if (name === 'duration') {
      // Only allow numeric minutes between 1 and 59
      const numeric = value.replace(/[^0-9]/g, '');
      let minutes = numeric === '' ? '' : parseInt(numeric);
      if (minutes !== '' && Number.isFinite(minutes)) {
        if (minutes < 1) minutes = 1;
        if (minutes > 59) minutes = 59;
      }
      setFormData(prev => ({
        ...prev,
        duration: minutes === '' ? '' : minutes
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));

      if (name === 'type') {
        // Reset fields that are not relevant to the selected type
        setFormData(prev => ({
          ...prev,
          videoUrl: '',
          linkUrl: prev.linkUrl,
          content: prev.type === 'text' ? prev.content : ''
        }));
        setSelectedFiles([]);
        setSelectedVideoFile(null);
      }
    }
  };



  const actuallyCreateLesson = async () => {
    try {
      let lessonData;

      const shouldUseFormData = formData.type === 'file' || (formData.type === 'video' && selectedVideoFile) || (selectedFiles && selectedFiles.length > 0) || formData.type === 'link';

      if (shouldUseFormData) {
        const fd = new FormData();
        fd.append('title', formData.title);
        fd.append('description', formData.description);
        fd.append('duration', formData.duration);
        fd.append('order', formData.order);
        fd.append('type', formData.type);

        // Toujours envoyer un contenu, même vide
        fd.append('content', formData.content || '');
        
        if (formData.type === 'link' && formData.linkUrl) {
          fd.append('linkUrl', formData.linkUrl);
        }
        if (formData.type === 'video') {
          if (formData.videoUrl) {
            fd.append('videoUrl', formData.videoUrl);
          }
          if (selectedVideoFile) {
            fd.append('videoFile', selectedVideoFile);
          }
        }
        if (selectedFiles && selectedFiles.length > 0) {
          selectedFiles.forEach((file) => fd.append('attachments', file));
        }

        // Also include module for API helper to pick moduleId
        fd.append('module', moduleId);
        lessonData = fd;
      } else {
        lessonData = {
        ...formData,
        moduleId
      };
      }

      console.log('Submitting lesson data:', lessonData);
      
      const response = await lessonsAPI.create(lessonData);

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
      let errorMessage = 'Erreur lors de la création de la leçon. Veuillez réessayer.';
      
      if (error.response?.status === 401) {
        errorMessage = 'Erreur d\'authentification. Veuillez vous reconnecter.';
      } else if (error.response?.status === 404) {
        errorMessage = 'Module introuvable. Vérifiez que le module existe.';
      } else if (error.response?.status === 500) {
        errorMessage = 'Erreur serveur interne. Veuillez réessayer plus tard.';
      } else if (error.message) {
        errorMessage = `Erreur: ${error.message}`;
      }
      
      setError(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    // Validation
    if (!formData.title.trim()) {
      setError('Le titre de la leçon est requis');
      setSubmitting(false);
      return;
    }
    if (!formData.description.trim()) {
      setError('La description de la leçon est requise');
      setSubmitting(false);
      return;
    }

    // Type-specific validation
    if (formData.type === 'text') {
    if (!formData.content.trim()) {
        setError('Le contenu de la leçon est requis pour le type Texte');
        setSubmitting(false);
        return;
      }
    }

    if (formData.type === 'link') {
      if (!formData.linkUrl.trim()) {
        setError('Le lien est requis pour le type Lien');
        setSubmitting(false);
        return;
      }
      // Basic URL check
      try { new URL(formData.linkUrl); } catch {
        setError('Veuillez entrer une URL valide');
        setSubmitting(false);
        return;
      }
    }

    if (formData.type === 'file') {
      if (!selectedFiles || selectedFiles.length === 0) {
        setError('Ajoutez au moins un fichier pour le type Fichier');
        setSubmitting(false);
        return;
      }
    }

    if (formData.type === 'video') {
      const hasVideoUrl = !!formData.videoUrl.trim();
      const hasVideoFile = !!selectedVideoFile;
      if (!hasVideoUrl && !hasVideoFile) {
        setError('Fournissez soit une URL YouTube, soit un fichier vidéo');
      setSubmitting(false);
      return;
      }
    }

    // Ensure we have the required data
    if (!moduleId) {
      setError('ID du module manquant. Impossible de créer la leçon.');
      setSubmitting(false);
      return;
    }

    // Créer directement - le backend gérera la réorganisation automatique
    await actuallyCreateLesson();
  };

  if (!user || user.role !== 'tuteur') {
    return (
      <div className="create-lesson-page">
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
      <div className="create-lesson-page">
        <div className="loading-simple">
          <div className="spinner">
            <Icon name="loader" size={IconSizes.xl} color={IconColors.primary} />
          </div>
        </div>
      </div>
    );
  }

  // Show form even if module/course data failed to load
  if (error && !module) {
    return (
      <div className="create-lesson-page">
        <div className="create-lesson-container">


          <div className="create-lesson-header">
            <h1>
              <Icon name="plus" size={IconSizes.lg} color={IconColors.white} />
              Créer une nouvelle leçon
            </h1>
            <p>Module ID: {moduleId}</p>
            <div className="alert alert-warning">
              <Icon name="warning" size={IconSizes.sm} color={IconColors.white} />
              Certaines informations n'ont pas pu être chargées, mais vous pouvez toujours créer la leçon.
            </div>
          </div>

          {error && (
            <div className="alert alert-error">
              <Icon name="error" size={IconSizes.sm} color={IconColors.white} />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="create-lesson-form">
            {/* Form content - simplified version */}
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
  }

  return (
    <div className="create-lesson-page">
      <div className="create-lesson-container">


        <div className="create-lesson-header">
          <h1>
            <Icon name="plus" size={IconSizes.lg} color={IconColors.white} />
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

        <form onSubmit={handleSubmit} className="create-lesson-form">
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
                <label htmlFor="duration">Durée (minutes) *</label>
                <input
                  type="number"
                  id="duration"
                  name="duration"
                  value={formData.duration}
                  onChange={handleInputChange}
                  required
                  inputMode="numeric"
                  min={1}
                  max={59}
                  placeholder="1 - 59"
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
                <small>Position de la leçon dans le module</small>
                {orderWarning && (
                  <div className="order-warning">
                    <Icon name="warning" size={IconSizes.sm} color={IconColors.warning} />
                    <span>{orderWarning}</span>
                  </div>
                )}
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
                <option value="link">Lien</option>
                <option value="file">Fichier</option>
                <option value="video">Vidéo</option>
                <option value="quiz">Quiz</option>
                <option value="assignment">Devoir</option>
                <option value="interactive">Interactif</option>
              </select>
            </div>

            {formData.type === 'text' && (
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
            )}

            {/* Section pour les types non-texte */}
            {(formData.type === 'file' || formData.type === 'video' || formData.type === 'link') && (
              <div className="form-group">
                <label htmlFor="content">Contenu optionnel</label>
                <textarea
                  id="content"
                  name="content"
                  value={formData.content}
                  onChange={handleInputChange}
                  rows={4}
                  placeholder="Contenu optionnel pour accompagner vos fichiers, vidéos ou liens..."
                />
                <small>Vous pouvez ajouter du contenu textuel optionnel pour accompagner vos fichiers, vidéos ou liens.</small>
              </div>
            )}

            {formData.type === 'link' && (
              <div className="form-group">
                <label htmlFor="linkUrl">Lien *</label>
                <input
                  type="url"
                  id="linkUrl"
                  name="linkUrl"
                  value={formData.linkUrl}
                  onChange={handleInputChange}
                  placeholder="https://..."
                />
                <small>Entrez un lien (YouTube, site, document, etc.).</small>
              </div>
            )}

            {formData.type === 'file' && (
              <div className="form-group">
                <label htmlFor="attachments">Fichiers *</label>
                <input
                  type="file"
                  id="attachments"
                  name="attachments"
                  multiple
                  onChange={(e) => setSelectedFiles(Array.from(e.target.files || []))}
                />
                <small>{selectedFiles.length > 0 ? `${selectedFiles.length} fichier(s) sélectionné(s)` : 'Sélectionnez un ou plusieurs fichiers.'}</small>
              </div>
            )}

            {formData.type === 'video' && (
              <>
                <div className="form-group">
                  <label htmlFor="videoUrl">URL de la vidéo (YouTube, etc.)</label>
                  <input
                    type="url"
                    id="videoUrl"
                    name="videoUrl"
                    value={formData.videoUrl}
                    onChange={handleInputChange}
                    placeholder="https://..."
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="videoFile">Ou importer une vidéo</label>
                  <input
                    type="file"
                    id="videoFile"
                    name="videoFile"
                    accept="video/*"
                    onChange={(e) => setSelectedVideoFile((e.target.files && e.target.files[0]) || null)}
                  />
                  <small>Fournissez soit une URL, soit un fichier vidéo.</small>
                </div>
              </>
            )}

            {/* Aperçu global du contenu */}
            {(formData.type === 'file' || formData.type === 'video' || formData.type === 'link') && (
              <div className="form-group">
                <div className="content-preview">
                  <h4>Aperçu complet de la leçon :</h4>
                  <div className="preview-content">
                    {formData.content && (
                      <>
                        {formData.content}
                        <br />
                      </>
                    )}
                    {formData.type === 'link' && formData.linkUrl && (
                      <>
                        <strong>Lien :</strong> <a href={formData.linkUrl} target="_blank" rel="noopener noreferrer">{formData.linkUrl}</a>
                      </>
                    )}
                    {formData.type === 'file' && selectedFiles.length > 0 && (
                      <>
                        <strong>Fichiers :</strong>
                        <ul>
                          {selectedFiles.map((file, index) => (
                            <li key={index}>{file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)</li>
                          ))}
                        </ul>
                      </>
                    )}
                    {formData.type === 'video' && (
                      <>
                        {formData.videoUrl && (
                          <>
                            <strong>Vidéo (URL) :</strong> <a href={formData.videoUrl} target="_blank" rel="noopener noreferrer">{formData.videoUrl}</a>
                          </>
                        )}
                        {selectedVideoFile && (
                          <>
                            <strong>Vidéo (fichier) :</strong> {selectedVideoFile.name} ({(selectedVideoFile.size / 1024 / 1024).toFixed(2)} MB)
                          </>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}
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