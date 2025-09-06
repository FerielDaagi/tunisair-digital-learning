import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import api, { lessonsAPI, modulesAPI, coursesAPI } from '../../services/api';
import { Icon, IconSizes, IconColors } from '../../components/common/IconTheme';
import FileViewer from '../../components/common/FileViewer';
import './CreateCourse.css';

const EditLesson = () => {
  const { user, addNotification } = useAuth();
  const navigate = useNavigate();
  const { moduleId, lessonId } = useParams();
  
  const [lesson, setLesson] = useState(null);
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
    linkUrl: ''
  });

  const [selectedFiles, setSelectedFiles] = useState([]);
  const [selectedVideoFile, setSelectedVideoFile] = useState(null);
  const [existingAttachments, setExistingAttachments] = useState([]);

  useEffect(() => {
    console.log('EditLesson useEffect triggered with:', { user, moduleId, lessonId });
    
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
    
    if (moduleId && lessonId) {
      fetchData();
    } else {
      setError('ID du module ou de la leçon manquant');
      setLoading(false);
    }
  }, [user, navigate, moduleId, lessonId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Charger la leçon
      console.log('Fetching lesson data for ID:', lessonId);
      const lessonResponse = await lessonsAPI.getById(lessonId);
      console.log('Lesson response:', lessonResponse);
      
      if (!lessonResponse.data || !lessonResponse.data.success) {
        throw new Error('Leçon introuvable');
      }
      
      const lessonData = lessonResponse.data.data;
      setLesson(lessonData);
      setExistingAttachments(lessonData.attachments || []);
      
      // Charger le module
      console.log('Fetching module data for ID:', moduleId);
      const moduleResponse = await modulesAPI.getById(moduleId);
      console.log('Module response:', moduleResponse);
      
      if (!moduleResponse.data || !moduleResponse.data.success) {
        throw new Error('Module introuvable');
      }
      
      const moduleData = moduleResponse.data.data;
      setModule(moduleData);
      
      // Charger le cours
      console.log('Fetching course data for ID:', moduleData.course);
      const courseResponse = await coursesAPI.getById(moduleData.course);
      console.log('Course response:', courseResponse);
      
      if (!courseResponse.data) {
        throw new Error('Cours introuvable');
      }
      
      let courseData = courseResponse.data;
      if (courseResponse.data.success && courseResponse.data.data) {
        courseData = courseResponse.data.data;
      }
      
      setCourse(courseData);
      
      // Remplir le formulaire avec les données de la leçon
      setFormData({
        title: lessonData.title || '',
        description: lessonData.description || '',
        content: lessonData.content || '',
        duration: lessonData.duration || '',
        order: lessonData.order || 1,
        type: lessonData.type || 'text',
        videoUrl: lessonData.videoUrl || '',
        linkUrl: lessonData.linkUrl || ''
      });
      
      console.log('🔍 Lesson data loaded:', {
        type: lessonData.type,
        content: lessonData.content,
        videoUrl: lessonData.videoUrl,
        linkUrl: lessonData.linkUrl,
        attachments: lessonData.attachments
      });
      
      console.log('Data fetch completed successfully');
      setLoading(false);
    } catch (error) {
      console.error('Error in fetchData:', error);
      let errorMessage = 'Erreur lors du chargement des données';
      
      if (error.response?.status === 401) {
        errorMessage = 'Erreur d\'authentification. Veuillez vous reconnecter.';
      } else if (error.response?.status === 404) {
        errorMessage = 'Leçon, module ou cours introuvable.';
      } else if (error.response?.status === 500) {
        errorMessage = 'Erreur serveur interne.';
      } else if (error.message) {
        errorMessage = `Erreur: ${error.message}`;
      }
      
      setError(errorMessage);
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name === 'order') {
      const orderValue = parseInt(value);
      if (value === '' || (Number.isFinite(orderValue) && orderValue > 0)) {
        setFormData(prev => ({
          ...prev,
          [name]: value === '' ? '' : orderValue
        }));
      }
    } else if (name === 'duration') {
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

  const actuallyUpdateLesson = async () => {
    try {
      let lessonData;

      const shouldUseFormData = formData.type === 'file' || (formData.type === 'video' && selectedVideoFile) || (selectedFiles && selectedFiles.length > 0);

      if (shouldUseFormData) {
        const fd = new FormData();
        fd.append('title', formData.title);
        fd.append('description', formData.description);
        fd.append('duration', formData.duration);
        fd.append('order', formData.order);
        fd.append('type', formData.type);
        console.log('🔍 Sending type in FormData:', formData.type);

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

        lessonData = fd;
      } else {
        lessonData = {
          ...formData
        };
      }

      console.log('Updating lesson data:', lessonData);
      
      const response = await lessonsAPI.update(lessonId, lessonData);

      if (response.data.success) {
        if (addNotification) {
          addNotification('Leçon mise à jour avec succès', 'success');
        }
        navigate(`/tutor/manage-lessons/${moduleId}`);
      } else {
        setError(response.data.message || 'Erreur lors de la mise à jour de la leçon');
      }
    } catch (error) {
      console.error('Erreur mise à jour leçon:', error);
      let errorMessage = 'Erreur lors de la mise à jour de la leçon. Veuillez réessayer.';
      
      if (error.response?.status === 401) {
        errorMessage = 'Erreur d\'authentification. Veuillez vous reconnecter.';
      } else if (error.response?.status === 404) {
        errorMessage = 'Leçon introuvable. Vérifiez que la leçon existe.';
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
        if (!existingAttachments || existingAttachments.length === 0) {
          setError('Ajoutez au moins un fichier pour le type Fichier');
          setSubmitting(false);
          return;
        }
      }
    }

    if (formData.type === 'video') {
      const hasVideoUrl = !!formData.videoUrl.trim();
      const hasVideoFile = !!selectedVideoFile;
      const hasExistingVideo = !!(lesson && lesson.videoUrl);
      if (!hasVideoUrl && !hasVideoFile && !hasExistingVideo) {
        setError('Fournissez soit une URL YouTube, soit un fichier vidéo');
        setSubmitting(false);
        return;
      }
    }

    // Mettre à jour la leçon
    await actuallyUpdateLesson();
  };

  if (!user || user.role !== 'tuteur') {
    return (
      <div className="create-lesson-page">
        <div className="access-denied">
          <Icon name="lock" size={IconSizes.xl} color={IconColors.error} />
          <h2>Accès refusé</h2>
          <p>Seuls les tuteurs peuvent modifier des leçons.</p>
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

  if (error && !lesson) {
    return (
      <div className="create-lesson-page">
        <div className="create-lesson-container">
          <div className="create-lesson-header">
            <h1>
              <Icon name="edit" size={IconSizes.lg} color={IconColors.white} />
              Modifier la leçon
            </h1>
            <p>Module ID: {moduleId}</p>
            <div className="alert alert-warning">
              <Icon name="warning" size={IconSizes.sm} color={IconColors.white} />
              Certaines informations n'ont pas pu être chargées.
            </div>
          </div>

          {error && (
            <div className="alert alert-error">
              <Icon name="error" size={IconSizes.sm} color={IconColors.white} />
              {error}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="create-lesson-page">
      <div className="create-lesson-container">
        <div className="create-lesson-header">
          <h1>
            <Icon name="edit" size={IconSizes.lg} color={IconColors.white} />
            Modifier la leçon
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
                {lesson && lesson.content && (
                  <div className="existing-video">
                    <h4>Contenu existant :</h4>
                    <div className="preview-content">
                      {lesson.content}
                    </div>
                  </div>
                )}
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
                  placeholder="Contenu optionnel pour cette leçon..."
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
                <small>{selectedFiles.length > 0 ? `${selectedFiles.length} nouveau(x) fichier(s) sélectionné(s)` : 'Sélectionnez de nouveaux fichiers (optionnel).'}</small>
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
                  <label htmlFor="videoFile">Ou importer une nouvelle vidéo</label>
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

            {/* Aperçu du contenu existant */}
            {(formData.type === 'file' || formData.type === 'video' || formData.type === 'link') && lesson && (
              <div className="form-group">
                <div className="content-preview">
                  <h4>Contenu existant :</h4>
                  <div className="preview-content">
                    {lesson.content && (
                      <>
                        {lesson.content}
                        <br />
                      </>
                    )}
                    {formData.type === 'link' && lesson.linkUrl && (
                      <>
                        <strong>Lien :</strong> <a href={lesson.linkUrl} target="_blank" rel="noopener noreferrer">{lesson.linkUrl}</a>
                      </>
                    )}
                    {formData.type === 'file' && existingAttachments.length > 0 && (
                      <>
                        <strong>Fichiers existants :</strong>
                        <div style={{ marginTop: '1rem' }}>
                          {existingAttachments.map((attachment, index) => (
                            <FileViewer 
                              key={index} 
                              file={attachment}
                              baseUrl="http://localhost:5000"
                            />
                          ))}
                        </div>
                      </>
                    )}
                    {formData.type === 'video' && lesson.videoUrl && (
                      <>
                        <strong>Vidéo :</strong> 
                        {lesson.videoUrl.startsWith('http') ? (
                          <a href={lesson.videoUrl} target="_blank" rel="noopener noreferrer"> {lesson.videoUrl}</a>
                        ) : (
                          <a 
                            href={`/uploads/lessons/videos/${lesson.videoUrl}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            style={{ textDecoration: 'none', color: '#3b82f6' }}
                          > {lesson.videoUrl}</a>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Aperçu du nouveau contenu complet */}
            {(formData.type === 'file' || formData.type === 'video' || formData.type === 'link') && (
              <div className="form-group">
                <div className="content-preview">
                  <h4>Nouveau contenu complet :</h4>
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
                    {formData.type === 'file' && (existingAttachments.length > 0 || selectedFiles.length > 0) && (
                      <>
                        <strong>Fichiers :</strong>
                        <ul>
                          {existingAttachments.map((attachment, index) => (
                            <li key={`existing-${index}`}>
                              <a 
                                href={`/uploads/lessons/attachments/${attachment.filename}`} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                style={{ textDecoration: 'none', color: '#3b82f6' }}
                              >
                                {attachment.originalName}
                              </a> ({(attachment.size / 1024 / 1024).toFixed(2)} MB)
                            </li>
                          ))}
                          {selectedFiles.map((file, index) => (
                            <li key={`new-${index}`}>{file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB) <em>(nouveau)</em></li>
                          ))}
                        </ul>
                      </>
                    )}
                    {formData.type === 'video' && (
                      <>
                        {(lesson && lesson.videoUrl) && (
                          <>
                            <strong>Vidéo existante :</strong> 
                            {lesson.videoUrl.startsWith('http') ? (
                              <a href={lesson.videoUrl} target="_blank" rel="noopener noreferrer"> {lesson.videoUrl}</a>
                            ) : (
                              <a 
                                href={`/uploads/lessons/videos/${lesson.videoUrl}`} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                style={{ textDecoration: 'none', color: '#3b82f6' }}
                              > {lesson.videoUrl}</a>
                            )}
                          </>
                        )}
                        {formData.videoUrl && (
                          <>
                            <strong>Vidéo (URL) :</strong> <a href={formData.videoUrl} target="_blank" rel="noopener noreferrer">{formData.videoUrl}</a>
                          </>
                        )}
                        {selectedVideoFile && (
                          <>
                            <strong>Vidéo (nouveau fichier) :</strong> {selectedVideoFile.name} ({(selectedVideoFile.size / 1024 / 1024).toFixed(2)} MB)
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
                  Mise à jour...
                </>
              ) : (
                <>
                  <Icon name="check" size={IconSizes.sm} color={IconColors.white} />
                  Mettre à jour la leçon
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditLesson;
