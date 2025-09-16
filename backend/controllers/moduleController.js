const Module = require('../models/Module');
const Course = require('../models/Course');
const Lesson = require('../models/Lesson');
const { updateCourseDuration } = require('../utils/courseDurationCalculator');

// Créer un nouveau module
const createModule = async (req, res) => {
  try {
    const { title, description, order, estimatedDuration, objectives, resources } = req.body;
    const { courseId } = req.params;
    
    // Vérifier que le cours existe
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Cours introuvable'
      });
    }
    
    // Vérifier que l'utilisateur est le propriétaire du cours (sauf admin)
    if (course.instructor.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Vous n\'êtes pas autorisé à modifier ce cours'
      });
    }
    
    // Calculer l'ordre automatiquement si non fourni ou en conflit
    let finalOrder = order;
    if (!finalOrder || finalOrder < 1) {
      const existingModules = await Module.find({ course: courseId }).sort({ order: -1 }).limit(1);
      finalOrder = existingModules.length > 0 ? existingModules[0].order + 1 : 1;
    }
    
    // Vérifier qu'il n'y a pas de conflit d'ordre
    const conflictingModule = await Module.findOne({ 
      course: courseId, 
      order: finalOrder 
    });
    
    if (conflictingModule) {
      // Réorganiser les modules existants
      await Module.updateMany(
        { course: courseId, order: { $gte: finalOrder } },
        { $inc: { order: 1 } }
      );
    }
    
    // Créer le module
    const newModule = new Module({
      title,
      description,
      order: finalOrder,
      course: courseId,
      estimatedDuration: estimatedDuration || '0 heure',
      objectives: objectives || [],
      resources: resources || []
    });
    
    await newModule.save();
    
    // Ajouter le module au cours (sans validation pour éviter les conflits)
    course.modules.push(newModule._id);
    await course.save({ validateBeforeSave: false });
    
    // Mettre à jour la durée du cours
    await updateCourseDuration(courseId);
    
    res.status(201).json({
      success: true,
      message: 'Module créé avec succès',
      data: newModule
    });
  } catch (error) {
    console.error('Erreur createModule:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
};

// Mettre à jour un module
const updateModule = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    const module = await Module.findById(id);
    if (!module) {
      return res.status(404).json({
        success: false,
        message: 'Module introuvable'
      });
    }
    
    // Vérifier que l'utilisateur est le propriétaire du cours (sauf admin)
    const course = await Course.findById(module.course);
    if (course.instructor.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Vous n\'êtes pas autorisé à modifier ce module'
      });
    }
    
    // Mettre à jour le module
    const updatedModule = await Module.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );
    
    res.json({
      success: true,
      message: 'Module mis à jour avec succès',
      data: updatedModule
    });
  } catch (error) {
    console.error('Erreur updateModule:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
};

// Supprimer un module
const deleteModule = async (req, res) => {
  try {
    const { id } = req.params;
    
    const module = await Module.findById(id);
    if (!module) {
      return res.status(404).json({
        success: false,
        message: 'Module introuvable'
      });
    }
    
    // Vérifier que l'utilisateur est le propriétaire du cours (sauf admin)
    const course = await Course.findById(module.course);
    if (course.instructor.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Vous n\'êtes pas autorisé à supprimer ce module'
      });
    }
    
    // Supprimer toutes les leçons associées au module
    await Lesson.deleteMany({ module: id });
    
    // Supprimer le module du cours
    course.modules = course.modules.filter(m => m.toString() !== id);
    await course.save();
    
    // Supprimer le module
    await Module.findByIdAndUpdate(id, { lessons: [] });
    await Module.findByIdAndDelete(id);
    
    // Mettre à jour la durée du cours
    await updateCourseDuration(module.course);
    
    res.json({
      success: true,
      message: 'Module supprimé avec succès'
    });
  } catch (error) {
    console.error('Erreur deleteModule:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
};

// Obtenir tous les modules d'un cours
const getCourseModules = async (req, res) => {
  try {
    const { courseId } = req.params;
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 10));
    const skip = (page - 1) * limit;
    const q = (req.query.q || '').toString().trim();
    
    const query = { course: courseId };
    if (q) {
      const safe = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(safe, 'i');
      query.$or = [
        { title: regex },
        { description: regex },
        { objectives: regex },
        { resources: regex }
      ];
    }
    
    const total = await Module.countDocuments(query);
    const modules = await Module.find(query)
      .populate('lessons', 'title description duration type isPublished')
      .sort('order')
      .skip(skip)
      .limit(limit);
    
    res.json({
      success: true,
      data: modules,
      total,
      page,
      pages: Math.max(1, Math.ceil(total / limit)),
      limit
    });
  } catch (error) {
    console.error('Erreur getCourseModules:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
};

// Obtenir un module par ID
const getModuleById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const module = await Module.findById(id)
      .populate('lessons', 'title description duration type isPublished order');
    
    if (!module) {
      return res.status(404).json({
        success: false,
        message: 'Module introuvable'
      });
    }
    
    res.json({
      success: true,
      data: module
    });
  } catch (error) {
    console.error('Erreur getModuleById:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
};

// Toggle le statut de publication d'un module
const togglePublish = async (req, res) => {
  try {
    const { id } = req.params;
    
    const module = await Module.findById(id);
    if (!module) {
      return res.status(404).json({
        success: false,
        message: 'Module introuvable'
      });
    }
    
    // Vérifier que l'utilisateur est le propriétaire du cours (sauf admin)
    const course = await Course.findById(module.course);
    if (course.instructor.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Vous n\'êtes pas autorisé à modifier ce module'
      });
    }
    
    // Toggle le statut de publication
    module.isPublished = !module.isPublished;
    await module.save();
    
    res.json({
      success: true,
      message: `Module ${module.isPublished ? 'publié' : 'mis en brouillon'} avec succès`,
      data: module
    });
  } catch (error) {
    console.error('Erreur togglePublish:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
};

module.exports = {
  createModule,
  updateModule,
  deleteModule,
  getCourseModules,
  getModuleById,
  togglePublish
};
