const Module = require('../models/Module');
const Course = require('../models/Course');

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
    
    // Vérifier que l'utilisateur est le propriétaire du cours
    if (course.instructor.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Vous n\'êtes pas autorisé à modifier ce cours'
      });
    }
    
    // Créer le module
    const newModule = new Module({
      title,
      description,
      order,
      course: courseId,
      estimatedDuration: estimatedDuration || '0 heure',
      objectives: objectives || [],
      resources: resources || []
    });
    
    await newModule.save();
    
    // Ajouter le module au cours
    course.modules.push(newModule._id);
    await course.save();
    
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
    
    // Vérifier que l'utilisateur est le propriétaire du cours
    const course = await Course.findById(module.course);
    if (course.instructor.toString() !== req.user.id) {
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
    
    // Vérifier que l'utilisateur est le propriétaire du cours
    const course = await Course.findById(module.course);
    if (course.instructor.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Vous n\'êtes pas autorisé à supprimer ce module'
      });
    }
    
    // Supprimer le module du cours
    course.modules = course.modules.filter(m => m.toString() !== id);
    await course.save();
    
    // Supprimer le module
    await Module.findByIdAndDelete(id);
    
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
    
    const modules = await Module.find({ course: courseId })
      .populate('lessons', 'title description duration type isPublished')
      .sort('order');
    
    res.json({
      success: true,
      data: modules
    });
  } catch (error) {
    console.error('Erreur getCourseModules:', error);
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
  getCourseModules
};
