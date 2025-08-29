import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { modulesAPI } from '../../services/api';
import { Icon, IconSizes, IconColors } from '../../components/common/IconTheme';
import ConfirmModal from '../../components/common/ConfirmModal';
import './CreateCourse.css';

const EditModule = () => {
  const { user, addNotification } = useAuth();
  const navigate = useNavigate();
  const { moduleId } = useParams();
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    order: 1,
    isPublished: false
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [module, setModule] = useState(null);
  const [course, setCourse] = useState(null);
  const [existingOrders, setExistingOrders] = useState([]);
  const [confirmConflict, setConfirmConflict] = useState({ open: false, desiredOrder: null });
  
  // Modal states
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDiscardModal, setShowDiscardModal] = useState(false);

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
    
    // Charger les informations du module et du cours
    const fetchModule = async () => {
      try {
        const response = await modulesAPI.getById(moduleId);
        if (response.data.success) {
          const moduleData = response.data.data;
          setModule(moduleData);
          setFormData({
            title: moduleData.title || '',
            description: moduleData.description || '',
            order: moduleData.order || 1,
            isPublished: moduleData.isPublished || false
          });
          
          // Charger les informations du cours
          const courseResponse = await fetch(`http://localhost:5000/api/courses/${moduleData.course}`);
          if (courseResponse.ok) {
            const courseData = await courseResponse.json();
            if (courseData.success) {
              setCourse(courseData.data);
              const existingModules = Array.isArray(courseData.data.modules) ? courseData.data.modules : [];
              const orders = existingModules
                .filter(m => m._id !== moduleId)
                .map(m => m?.order)
                .filter(o => typeof o === 'number' && Number.isFinite(o));
              setExistingOrders(orders);
            }
          }
        } else {
          setError('Module non trouvé');
        }
      } catch (error) {
        console.error('Erreur chargement module:', error);
        setError('Erreur lors du chargement du module');
      } finally {
        setLoading(false);
      }
    };
    
    fetchModule();
  }, [user, navigate, moduleId]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Vérifier les conflits d'ordre
    if (existingOrders.includes(parseInt(formData.order)) && parseInt(formData.order) !== module.order) {
      setConfirmConflict({ open: true, desiredOrder: parseInt(formData.order) });
      return;
    }
    
    await actuallyUpdate();
  };

  const resolveOrderConflict = async () => {
    try {
      setSaving(true);
      setError('');
      
      // Utiliser l'API de réorganisation des modules
      const conflictingOrder = parseInt(formData.order);
      
      // Récupérer la liste complète des modules du cours
      const courseResponse = await fetch(`http://localhost:5000/api/courses/${course._id}`);
      if (courseResponse.ok) {
        const courseData = await courseResponse.json();
        if (courseData.success) {
          const allModules = courseData.data.modules || [];
          
          // Créer un nouvel ordre pour tous les modules
          let newOrder = 1;
          const reorderedModules = [];
          
          // Traiter d'abord les modules avec un ordre < à l'ordre souhaité
          allModules
            .filter(m => m._id !== moduleId && m.order < conflictingOrder)
            .sort((a, b) => a.order - b.order)
            .forEach(m => {
              reorderedModules.push({ ...m, order: newOrder++ });
            });
          
          // Ajouter le module actuel à l'ordre souhaité
          reorderedModules.push({ ...module, order: newOrder++ });
          
          // Traiter les modules avec un ordre >= à l'ordre souhaité
          allModules
            .filter(m => m._id !== moduleId && m.order >= conflictingOrder)
            .sort((a, b) => a.order - b.order)
            .forEach(m => {
              reorderedModules.push({ ...m, order: newOrder++ });
            });
          
          // Mettre à jour l'ordre de tous les modules
          for (const mod of reorderedModules) {
            try {
              await modulesAPI.update(mod._id, { order: mod.order });
            } catch (error) {
              console.error(`Erreur réorganisation module ${mod._id}:`, error);
            }
          }
          
          // Maintenant mettre à jour le module actuel
          await actuallyUpdate();
        }
      }
      
    } catch (error) {
      setError('Erreur lors de la réorganisation des modules');
    } finally {
      setSaving(false);
      setConfirmConflict({ open: false, desiredOrder: null });
    }
  };

  const actuallyUpdate = async () => {
    try {
      setSaving(true);
      setError('');
      
      // Préserver tous les champs existants et mettre à jour seulement ceux modifiés
      const moduleData = {
        ...module, // Garder tous les champs existants
        title: formData.title.trim(),
        description: formData.description.trim(),
        order: parseInt(formData.order),
        isPublished: formData.isPublished
      };

      const response = await modulesAPI.update(moduleId, moduleData);
      if (response.data.success) {
        setSuccess('Module modifié avec succès !');
        addNotification('Module modifié avec succès', 'success');
        setTimeout(() => navigate(`/tutor/manage-modules/${course?._id}`), 1200);
      } else {
        setError(response.data.message || 'Erreur lors de la modification du module');
      }
    } catch (error) {
      if (error.response?.data?.message) {
        setError(error.response.data.message);
      } else {
        setError('Erreur lors de la modification du module. Veuillez réessayer.');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      setSaving(true);
      const response = await modulesAPI.delete(moduleId);
      if (response.data.success) {
        addNotification('Module supprimé avec succès', 'success');
        navigate(`/tutor/manage-modules/${course?._id}`);
      } else {
        setError(response.data.message || 'Erreur lors de la suppression');
      }
    } catch (error) {
      setError('Erreur lors de la suppression du module');
    } finally {
      setSaving(false);
      setShowDeleteModal(false);
    }
  };

  const handleDiscardChanges = () => {
    if (JSON.stringify(formData) !== JSON.stringify({
      title: module?.title || '',
      description: module?.description || '',
      order: module?.order || 1,
      isPublished: module?.isPublished || false
    })) {
      setShowDiscardModal(true);
    } else {
      navigate(`/tutor/manage-modules/${course?._id}`);
    }
  };

  if (loading) {
    return (
      <div className="create-course-page">
        <div className="create-course-container">
          <div style={{ textAlign: 'center', padding: '4rem 2rem' }}>
            <Icon name="loader" size={IconSizes.xl} color={IconColors.gray} className="spin" />
            <p>Chargement du module...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error && !module) {
    return (
      <div className="create-course-page">
        <div className="create-course-container">
          <div className="alert alert-error">
            <Icon name="error" size={IconSizes.sm} color={IconColors.danger} />
            {error}
          </div>
          <button onClick={() => navigate(-1)} className="btn btn-outline">
            Retour
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="create-course-page">
      <div className="create-course-container">
        
        {/* Page header */}
        <div className="page-header">
          <div className="header-content">
            <h1>
              <Icon name="edit" size={IconSizes.lg} color={IconColors.primary} />
              Modifier le module
            </h1>
            <p>{course?.title ? `Cours : ${course.title}` : 'Chargement du cours...'}</p>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={handleDiscardChanges}
              className="btn btn-outline"
            >
              <Icon name="arrowLeft" size={IconSizes.sm} color={IconColors.gray} />
              Annuler
            </button>
            <button
              onClick={handleSubmit}
              disabled={saving}
              className="create-course-btn"
            >
              {saving ? (
                <>
                  <Icon name="loader" size={IconSizes.sm} color={IconColors.white} className="spin" />
                  Enregistrement...
                </>
              ) : (
                <>
                  <Icon name="save" size={IconSizes.sm} color={IconColors.white} />
                  Enregistrer
                </>
              )}
            </button>
          </div>
        </div>

        {error && (
          <div className="alert alert-error">
            <Icon name="error" size={IconSizes.sm} color={IconColors.danger} />
            {error}
          </div>
        )}

        {success && (
          <div className="alert alert-success">
            <Icon name="check" size={IconSizes.sm} color={IconColors.primary} />
            {success}
          </div>
        )}

        {/* Module Form */}
        <div className="course-form-container">
          <form onSubmit={handleSubmit} className="course-form">
            
            {/* Module Title */}
            <div className="form-group">
              <label htmlFor="title" className="form-label">
                <Icon name="hash" size={IconSizes.sm} color={IconColors.primary} />
                Titre du module *
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                className="form-input"
                placeholder="Ex: Introduction au développement web"
                required
                maxLength={100}
              />
              <small className="form-help">
                {formData.title.length}/100 caractères
              </small>
            </div>

            {/* Module Description */}
            <div className="form-group">
              <label htmlFor="description" className="form-label">
                <Icon name="fileText" size={IconSizes.sm} color={IconColors.primary} />
                Description du module *
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                className="form-textarea"
                placeholder="Décrivez le contenu et les objectifs de ce module..."
                required
                rows={4}
                maxLength={500}
              />
              <small className="form-help">
                {formData.description.length}/500 caractères
              </small>
            </div>

            {/* Module Order */}
            <div className="form-group">
              <label htmlFor="order" className="form-label">
                <Icon name="list" size={IconSizes.sm} color={IconColors.primary} />
                Ordre du module *
              </label>
              <input
                type="number"
                id="order"
                name="order"
                value={formData.order}
                onChange={handleChange}
                className="form-input"
                min="1"
                required
              />
              <small className="form-help">
                L'ordre détermine la séquence d'affichage des modules dans le cours
              </small>
            </div>

            

            {/* Danger Zone */}
            <div className="danger-zone">
              <h3>
                <Icon name="alertTriangle" size={IconSizes.md} color={IconColors.danger} />
                Zone de danger
              </h3>
              <p>Ces actions sont irréversibles. Utilisez-les avec précaution.</p>
              
              <button
                type="button"
                onClick={() => setShowDeleteModal(true)}
                className="btn btn-danger"
                disabled={saving}
              >
                <Icon name="trash" size={IconSizes.sm} color={IconColors.white} />
                Supprimer le module
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Confirmation Modal for Order Conflict */}
      <ConfirmModal
        open={confirmConflict.open}
        title="Conflit d'ordre détecté"
        message={`Un module existe déjà à l'ordre ${confirmConflict.desiredOrder}. Voulez-vous continuer ? Cela réorganisera automatiquement l'ordre des autres modules.`}
        confirmLabel="Continuer et réorganiser"
        cancelLabel="Annuler"
        variant="warning"
        onConfirm={resolveOrderConflict}
        onCancel={() => setConfirmConflict({ open: false, desiredOrder: null })}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        open={showDeleteModal}
        title="Supprimer le module"
        message={`Êtes-vous sûr de vouloir supprimer le module "${module?.title}" ?\n\nCette action est irréversible et supprimera également toutes les leçons associées.`}
        confirmLabel="Supprimer définitivement"
        cancelLabel="Annuler"
        destructive={true}
        variant="warning"
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteModal(false)}
      />

      {/* Discard Changes Modal */}
      <ConfirmModal
        open={showDiscardModal}
        title="Modifications non sauvegardées"
        message="Vous avez des modifications non sauvegardées. Voulez-vous vraiment quitter sans sauvegarder ?"
        confirmLabel="Quitter sans sauvegarder"
        cancelLabel="Continuer l'édition"
        variant="warning"
        onConfirm={() => navigate(`/tutor/manage-modules/${course?._id}`)}
        onCancel={() => setShowDiscardModal(false)}
      />
    </div>
  );
};

export default EditModule;
