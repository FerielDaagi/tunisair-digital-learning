const Lesson = require('../models/Lesson');
const Module = require('../models/Module');
const Course = require('../models/Course');
const { updateModuleDuration } = require('../utils/durationCalculator');
const { updateCourseDuration } = require('../utils/courseDurationCalculator');

// Créer une nouvelle leçon
const createLesson = async (req, res) => {
  try {
    console.log('🔍 createLesson - req.body:', req.body);
    console.log('🔍 createLesson - req.files:', req.files);
    console.log('🔍 createLesson - req.params:', req.params);
    
    const { title, description, content, duration, order, type, videoUrl, linkUrl, isFree, difficulty, tags } = req.body;
    const { moduleId } = req.params;
    
    // Vérifier que le module existe
    const module = await Module.findById(moduleId);
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
    
    // Calculer l'ordre automatiquement si non fourni ou en conflit
    let finalOrder = order;
    if (!finalOrder || finalOrder < 1) {
      const existingLessons = await Lesson.find({ module: moduleId }).sort({ order: -1 }).limit(1);
      finalOrder = existingLessons.length > 0 ? existingLessons[0].order + 1 : 1;
    }
    
    // Vérifier qu'il n'y a pas de conflit d'ordre
    const conflictingLesson = await Lesson.findOne({ 
      module: moduleId, 
      order: finalOrder 
    });
    
    if (conflictingLesson) {
      // Réorganiser les leçons existantes
      await Lesson.updateMany(
        { module: moduleId, order: { $gte: finalOrder } },
        { $inc: { order: 1 } }
      );
    }
    
    // Préparer les pièces jointes si fournies
    let attachments = [];
    if (req.files && req.files.attachments) {
      console.log('🔍 Processing attachments:', req.files.attachments);
      const attachmentFiles = Array.isArray(req.files.attachments) ? req.files.attachments : [req.files.attachments];
      attachments = attachmentFiles.map((file) => ({
        filename: file.filename,
        originalName: file.originalname,
        path: `/uploads/lessons/attachments/${file.filename}`,
        size: file.size,
        mimeType: file.mimetype
      }));
    }

    // Gérer la vidéo uploadée
    let finalVideoUrl = videoUrl || null;
    if (req.files && req.files.videoFile) {
      console.log('🔍 Processing video file:', req.files.videoFile);
      const videoFiles = Array.isArray(req.files.videoFile) ? req.files.videoFile : [req.files.videoFile];
      if (videoFiles.length > 0) {
        const file = videoFiles[0];
        finalVideoUrl = `/uploads/lessons/videos/${file.filename}`;
      }
    }

    // Déterminer un contenu final obligatoire selon le type
    let finalContent = content;
    
    // Si content est undefined, null ou vide, on génère un contenu seulement pour le type texte
    if (!finalContent || finalContent === undefined || finalContent === null || (typeof finalContent === 'string' && finalContent.trim() === '')) {
      if (type === 'text') {
        // Pour le type texte, on exige un contenu
        finalContent = 'Contenu de la leçon';
      } else {
        // Pour tous les autres types (link, file, video), on laisse vide
        finalContent = '';
      }
    }
    
    console.log('🔍 Final data:', {
      type,
      finalContent: finalContent ? finalContent.substring(0, 100) + '...' : null,
      finalVideoUrl,
      attachmentsCount: attachments.length
    });

    // Créer la leçon
    const newLesson = new Lesson({
      title,
      description,
      content: finalContent,
      duration,
      order: finalOrder,
      course: module.course,
      module: moduleId,
      type: type || 'text',
      videoUrl: finalVideoUrl,
      linkUrl: linkUrl || null,
      attachments,
      isFree: isFree || false,
      difficulty: difficulty || 'moyen',
      tags: tags || []
    });
    
    await newLesson.save();
    
    // Ajouter la leçon au module
    await Module.findByIdAndUpdate(moduleId, {
      $push: { lessons: newLesson._id }
    });
    
    // Mettre à jour la durée du module
    await updateModuleDuration(moduleId);
    
    // Mettre à jour la durée du cours
    await updateCourseDuration(module.course);
    
    res.status(201).json({
      success: true,
      message: 'Leçon créée avec succès',
      data: newLesson
    });
  } catch (error) {
    console.error('Erreur createLesson:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
};

// Mettre à jour une leçon
const updateLesson = async (req, res) => {
  try {
    console.log('🔍 updateLesson - req.body:', req.body);
    console.log('🔍 updateLesson - req.files:', req.files);
    console.log('🔍 updateLesson - req.params:', req.params);
    
    const { id } = req.params;
    const { title, description, content, duration, order, type, videoUrl, linkUrl, isFree, difficulty, tags } = req.body;
    
    const lesson = await Lesson.findById(id);
    
    console.log('🔍 Extracted type from req.body:', type);
    console.log('🔍 Current lesson type:', lesson.type);
    if (!lesson) {
      return res.status(404).json({
        success: false,
        message: 'Leçon introuvable'
      });
    }
    
    // Vérifier que l'utilisateur est le propriétaire du cours
    const course = await Course.findById(lesson.course);
    if (course.instructor.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Vous n\'êtes pas autorisé à modifier cette leçon'
      });
    }
    
    // Préparer les pièces jointes si fournies
    let attachments = lesson.attachments || [];
    if (req.files && req.files.attachments) {
      console.log('🔍 Processing new attachments:', req.files.attachments);
      const attachmentFiles = Array.isArray(req.files.attachments) ? req.files.attachments : [req.files.attachments];
      const newAttachments = attachmentFiles.map((file) => ({
        filename: file.filename,
        originalName: file.originalname,
        path: `/uploads/lessons/attachments/${file.filename}`,
        size: file.size,
        mimeType: file.mimetype
      }));
      attachments = [...attachments, ...newAttachments];
    }

    // Gérer la vidéo uploadée
    let finalVideoUrl = videoUrl || lesson.videoUrl || null;
    if (req.files && req.files.videoFile) {
      console.log('🔍 Processing new video file:', req.files.videoFile);
      const videoFiles = Array.isArray(req.files.videoFile) ? req.files.videoFile : [req.files.videoFile];
      if (videoFiles.length > 0) {
        const file = videoFiles[0];
        finalVideoUrl = `/uploads/lessons/videos/${file.filename}`;
      }
    }

    // Déterminer un contenu final obligatoire selon le type
    let finalContent = content;
    
    // Pour la mise à jour, on garde le contenu existant seulement s'il n'est pas un message généré automatiquement
    if (!finalContent || finalContent === undefined || finalContent === null || (typeof finalContent === 'string' && finalContent.trim() === '')) {
      // Si c'est une mise à jour et qu'il y a déjà un contenu, on le garde seulement s'il n'est pas généré automatiquement
      if (lesson.content && lesson.content.trim() !== '' && !lesson.content.includes('Leçon de type')) {
        finalContent = lesson.content;
      } else {
        // Pour les mises à jour, on ne génère pas de contenu automatique
        // L'utilisateur peut laisser le contenu vide pour les types file/video
        finalContent = '';
      }
    }
    
    console.log('🔍 Final update data:', {
      type,
      finalContent: finalContent ? finalContent.substring(0, 100) + '...' : null,
      finalVideoUrl,
      attachmentsCount: attachments.length,
      originalContent: lesson.content ? lesson.content.substring(0, 50) + '...' : null
    });
    
    // Mettre à jour la leçon
    const updateData = {
      title,
      description,
      content: finalContent,
      duration,
      order,
      type: (type && type.trim() !== '') ? type : lesson.type,
      videoUrl: finalVideoUrl,
      linkUrl: linkUrl || lesson.linkUrl,
      attachments,
      isFree: isFree !== undefined ? isFree : lesson.isFree,
      difficulty: difficulty || lesson.difficulty,
      tags: tags || lesson.tags
    };
    
    const updatedLesson = await Lesson.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );
    
    // Mettre à jour la durée du module si la durée de la leçon a changé
    if (updateData.duration) {
      await updateModuleDuration(updatedLesson.module);
      // Mettre à jour la durée du cours
      await updateCourseDuration(updatedLesson.course);
    }
    
    res.json({
      success: true,
      message: 'Leçon mise à jour avec succès',
      data: updatedLesson
    });
  } catch (error) {
    console.error('Erreur updateLesson:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
};

// Supprimer une leçon
const deleteLesson = async (req, res) => {
  try {
    const { id } = req.params;
    
    const lesson = await Lesson.findById(id);
    if (!lesson) {
      return res.status(404).json({
        success: false,
        message: 'Leçon introuvable'
      });
    }
    
    // Vérifier que l'utilisateur est le propriétaire du cours
    const course = await Course.findById(lesson.course);
    if (course.instructor.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Vous n\'êtes pas autorisé à supprimer cette leçon'
      });
    }
    
    // Supprimer la leçon du module
    await Module.findByIdAndUpdate(lesson.module, {
      $pull: { lessons: lesson._id }
    });
    
    // Supprimer la leçon
    await Lesson.findByIdAndDelete(id);
    
    // Réorganiser les ordres des leçons restantes du module (1..N sans trous)
    const remainingLessons = await Lesson.find({ module: lesson.module })
      .sort({ order: 1, createdAt: 1 });
    for (let index = 0; index < remainingLessons.length; index++) {
      const desiredOrder = index + 1;
      if (remainingLessons[index].order !== desiredOrder) {
        await Lesson.findByIdAndUpdate(remainingLessons[index]._id, { order: desiredOrder });
      }
    }
    
    // Mettre à jour la durée du module
    await updateModuleDuration(lesson.module);
    
    // Mettre à jour la durée du cours
    await updateCourseDuration(lesson.course);
    
    res.json({
      success: true,
      message: 'Leçon supprimée avec succès'
    });
  } catch (error) {
    console.error('Erreur deleteLesson:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
};

// Obtenir toutes les leçons d'un module
const getModuleLessons = async (req, res) => {
  try {
    const { moduleId } = req.params;
    
    const lessons = await Lesson.find({ module: moduleId })
      .sort('order');
    
    res.json({
      success: true,
      data: lessons
    });
  } catch (error) {
    console.error('Erreur getModuleLessons:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
};

// Obtenir une leçon par ID
const getLessonById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const lesson = await Lesson.findById(id);
    if (!lesson) {
      return res.status(404).json({
        success: false,
        message: 'Leçon introuvable'
      });
    }
    
    res.json({
      success: true,
      data: lesson
    });
  } catch (error) {
    console.error('Erreur getLessonById:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
};

// Réorganiser les leçons
const reorderLessons = async (req, res) => {
  try {
    const { moduleId } = req.params;
    const { lessonIds } = req.body;
    
    if (!Array.isArray(lessonIds)) {
      return res.status(400).json({
        success: false,
        message: 'La liste des IDs de leçons est requise'
      });
    }
    
    // Vérifier que le module existe
    const module = await Module.findById(moduleId);
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
    
    // Mettre à jour l'ordre des leçons
    for (let i = 0; i < lessonIds.length; i++) {
      await Lesson.findByIdAndUpdate(lessonIds[i], { order: i + 1 });
    }
    
    // Mettre à jour la durée du module
    await updateModuleDuration(moduleId);
    
    // Mettre à jour la durée du cours
    await updateCourseDuration(module.course);
    
    res.json({
      success: true,
      message: 'Ordre des leçons mis à jour avec succès'
    });
  } catch (error) {
    console.error('Erreur reorderLessons:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
};

module.exports = {
  createLesson,
  updateLesson,
  deleteLesson,
  getModuleLessons,
  getLessonById,
  reorderLessons
};
