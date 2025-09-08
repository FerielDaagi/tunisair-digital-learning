const Course = require('../models/Course');
const User = require('../models/User');
const Category = require('../models/Category');

// Obtenir tous les cours publiés
const getAllCourses = async (req, res) => {
  try {
    const { category, level, search, sort = 'createdAt', order = 'desc' } = req.query;
    
    let query = { status: 'published', isPublished: true };
    
    // Filtre par catégorie
    if (category) {
      query.category = category;
    }
    
    // Filtre par niveau
    if (level) {
      query.level = level;
    }
    
    // Recherche textuelle
    if (search) {
      query.$text = { $search: search };
    }
    
    // Tri
    const sortOptions = {};
    sortOptions[sort] = order === 'desc' ? -1 : 1;
    
    const courses = await Course.find(query)
      .populate('instructor', 'name profile.avatar')
      .sort(sortOptions)
      .select('-modules -enrolledStudents -rating.reviews');
    
    res.json({
      success: true,
      data: courses
    });
  } catch (error) {
    console.error('Erreur getAllCourses:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
};

// Obtenir un cours par ID
const getCourseById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const course = await Course.findById(id)
      .populate('instructor', 'name profile.avatar profile.bio')
      .populate({
        path: 'modules',
        populate: {
          path: 'lessons',
          select: 'title description duration type isPublished isFree'
        }
      });
    
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Cours introuvable'
      });
    }
    
    // Vérifier si l'utilisateur est inscrit
    let isEnrolled = false;
    let userProgress = null;
    
    if (req.user) {
      const enrollment = course.enrolledStudents.find(
        e => e.student.toString() === req.user.id
      );
      if (enrollment) {
        isEnrolled = true;
        userProgress = enrollment;
      }
    }
    
    res.json({
      success: true,
      data: {
        ...course.toObject(),
        isEnrolled,
        userProgress
      }
    });
  } catch (error) {
    console.error('Erreur getCourseById:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
};

// Créer un nouveau cours (tuteurs seulement)
const createCourse = async (req, res) => {
  try {
    const { title, description, longDescription, category, level, duration, price, requirements, outcomes, tags, language } = req.body;
    
    console.log('📝 Tentative de création de cours:', {
      title,
      category,
      level,
      duration,
      requirements: requirements?.length || 0,
      outcomes: outcomes?.length || 0,
      tags: tags?.length || 0
    });
    
    // Vérifier que l'utilisateur est un tuteur
    if (req.user.role !== 'tuteur') {
      console.log('🚫 Tentative de création par un non-tuteur:', req.user.role);
      return res.status(403).json({
        success: false,
        message: 'Seuls les tuteurs peuvent créer des cours'
      });
    }
    
    // Validation des champs requis
    if (!title || !title.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Le titre du cours est requis'
      });
    }
    
    if (!description || !description.trim()) {
      return res.status(400).json({
        success: false,
        message: 'La description du cours est requise'
      });
    }
    
    if (!longDescription || !longDescription.trim()) {
      return res.status(400).json({
        success: false,
        message: 'La description détaillée du cours est requise'
      });
    }
    
    // Validation de la catégorie
    if (!category) {
      return res.status(400).json({
        success: false,
        message: 'La catégorie est requise'
      });
    }

    // Vérifier si la catégorie existe, sinon la créer
    let categoryDoc = await Category.findOne({ 
      name: { $regex: new RegExp(`^${category}$`, 'i') } 
    });

    if (!categoryDoc) {
      // Créer une nouvelle catégorie
      try {
        categoryDoc = new Category({
          name: category,
          description: `Catégorie créée automatiquement lors de la création du cours "${title}"`,
          createdBy: req.user._id
        });
        await categoryDoc.save();
        console.log('✅ Nouvelle catégorie créée:', categoryDoc.name);
      } catch (categoryError) {
        console.error('❌ Erreur création catégorie:', categoryError);
        return res.status(500).json({
          success: false,
          message: 'Erreur lors de la création de la catégorie'
        });
      }
    }

    // Parser les champs JSON reçus via FormData
    let parsedRequirements = [];
    let parsedOutcomes = [];
    let parsedTags = [];
    
    try {
      if (requirements) {
        parsedRequirements = JSON.parse(requirements).filter(req => req && req.trim() !== '');
      }
    } catch (e) {
      console.log('⚠️ Erreur parsing requirements:', e.message);
      parsedRequirements = [];
    }
    
    try {
      if (outcomes) {
        parsedOutcomes = JSON.parse(outcomes).filter(out => out && out.trim() !== '');
      }
    } catch (e) {
      console.log('⚠️ Erreur parsing outcomes:', e.message);
      parsedOutcomes = [];
    }
    
    try {
      if (tags) {
        parsedTags = JSON.parse(tags).filter(tag => tag && tag.trim() !== '');
      }
    } catch (e) {
      console.log('⚠️ Erreur parsing tags:', e.message);
      parsedTags = [];
    }

    // Utiliser le nom de la catégorie (pas l'ID)
    const courseData = {
      title: title.trim(),
      description: description.trim(),
      longDescription: longDescription.trim(),
      instructor: req.user.id,
      category: category.trim(), // Sauvegarder le nom de la catégorie
      level,
      duration: duration.trim(),
      price: price || 0,
      requirements: parsedRequirements,
      outcomes: parsedOutcomes,
      tags: parsedTags,
      language: language || 'français',
      status: 'draft'
    };

    // Ajouter l'image de couverture si elle existe
    console.log('🔍 Debug - req.file:', req.file);
    console.log('🔍 Debug - req.body:', req.body);
    console.log('🔍 Debug - req.files:', req.files);
    
    if (req.file) {
      courseData.thumbnail = `/uploads/thumbnails/${req.file.filename}`;
      console.log('✅ Image ajoutée au cours:', courseData.thumbnail);
    } else {
      console.log('❌ Aucune image reçue (req.file est undefined)');
    }
    
    console.log('💾 Sauvegarde du cours...');
    const newCourse = new Course(courseData);
    await newCourse.save();
    console.log('✅ Cours créé avec succès:', newCourse._id);
    
    // Populate les références
    await newCourse.populate('instructor', 'name profile.avatar');
    
    res.status(201).json({
      success: true,
      message: 'Cours créé avec succès',
      data: newCourse
    });
  } catch (error) {
    console.error('❌ Erreur createCourse:', error);
    
    // Gestion des erreurs de validation Mongoose
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Erreurs de validation',
        errors: validationErrors
      });
    }
    
    // Gestion des erreurs de duplication
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Un cours avec ce titre existe déjà'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
};

// Mettre à jour un cours (propriétaire seulement)
const updateCourse = async (req, res) => {
  try {
    const { id } = req.params;
    let updateData = { ...req.body };
    
    // Traiter les champs JSON
    if (updateData.tags) {
      try {
        updateData.tags = JSON.parse(updateData.tags);
      } catch (e) {
        updateData.tags = [];
      }
    }
    
    if (updateData.requirements) {
      try {
        updateData.requirements = JSON.parse(updateData.requirements);
      } catch (e) {
        updateData.requirements = [];
      }
    }
    
    if (updateData.outcomes) {
      try {
        updateData.outcomes = JSON.parse(updateData.outcomes);
      } catch (e) {
        updateData.outcomes = [];
      }
    }
    
    const course = await Course.findById(id);
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
    
    // Ajouter l'image de couverture si elle existe
    if (req.file) {
      updateData.thumbnail = `/uploads/thumbnails/${req.file.filename}`;
    }
    
    // Mettre à jour le cours
    const updatedCourse = await Course.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate('instructor', 'name profile.avatar');
    
    res.json({
      success: true,
      message: 'Cours mis à jour avec succès',
      data: updatedCourse
    });
  } catch (error) {
    console.error('Erreur updateCourse:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
};

// Supprimer un cours (propriétaire seulement)
const deleteCourse = async (req, res) => {
  try {
    const { id } = req.params;
    
    const course = await Course.findById(id);
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
        message: 'Vous n\'êtes pas autorisé à supprimer ce cours'
      });
    }
    
    // Vérifier qu'aucun étudiant n'est inscrit
    if (course.enrolledStudents.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Impossible de supprimer un cours avec des apprentis inscrits'
      });
    }
    
    await Course.findByIdAndDelete(id);
    
    res.json({
      success: true,
      message: 'Cours supprimé avec succès'
    });
  } catch (error) {
    console.error('Erreur deleteCourse:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
};

// Publier un cours (propriétaire seulement)
const publishCourse = async (req, res) => {
  try {
    const { id } = req.params;
    console.log('🔍 Tentative de publication du cours:', id);
    console.log('👤 Utilisateur connecté:', req.user.id);
    
    // Validation de l'ID
    if (!id || !id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: 'ID de cours invalide'
      });
    }
    
    const course = await Course.findById(id).populate({
      path: 'modules',
      populate: {
        path: 'lessons',
        model: 'Lesson'
      }
    });
    if (!course) {
      console.log('❌ Cours introuvable:', id);
      return res.status(404).json({
        success: false,
        message: 'Cours introuvable'
      });
    }
    
    console.log('📚 Cours trouvé:', {
      id: course._id,
      title: course.title,
      instructor: course.instructor,
      status: course.status,
      modules: course.modules?.length || 0
    });
    
    // Debug: Afficher les détails des modules
    if (course.modules && course.modules.length > 0) {
      console.log('📋 Détails des modules:');
      course.modules.forEach((module, index) => {
        console.log(`  Module ${index + 1}:`, {
          id: module._id,
          title: module.title,
          lessonsCount: module.lessons?.length || 0,
          lessons: module.lessons?.map(lesson => ({
            id: lesson._id,
            title: lesson.title,
            type: lesson.type
          })) || []
        });
      });
    } else {
      console.log('❌ Aucun module trouvé dans le cours');
    }
    
    // Vérifier que l'utilisateur est le propriétaire du cours
    if (course.instructor.toString() !== req.user.id) {
      console.log('🚫 Utilisateur non autorisé:', {
        courseInstructor: course.instructor.toString(),
        currentUser: req.user.id
      });
      return res.status(403).json({
        success: false,
        message: 'Vous n\'êtes pas autorisé à publier ce cours'
      });
    }
    
    // Vérifier que le cours n'est pas déjà publié
    if (course.status === 'published' && course.isPublished) {
      return res.status(400).json({
        success: false,
        message: 'Ce cours est déjà publié'
      });
    }
    
    // Vérifier que le cours a au moins un module
    if (!course.modules || course.modules.length === 0) {
      console.log(`❌ Cours ${course.title} ne peut pas être publié - aucun module`);
      return res.status(400).json({
        success: false,
        message: 'Impossible de publier un cours vide',
        details: 'Vous devez ajouter au moins un module avant de pouvoir publier ce cours',
        requiresModules: true,
        courseId: course._id
      });
    }
    
    // Vérifier que chaque module a au moins une leçon
    let hasValidContent = false;
    for (const module of course.modules) {
      if (module.lessons && module.lessons.length > 0) {
        hasValidContent = true;
        break;
      }
    }
    
    if (!hasValidContent) {
      console.log(`❌ Cours ${course.title} ne peut pas être publié - modules vides`);
      return res.status(400).json({
        success: false,
        message: 'Impossible de publier un cours sans contenu',
        details: 'Vos modules doivent contenir au moins une leçon avant publication',
        requiresContent: true,
        courseId: course._id
      });
    }
    
    // Publier le cours
    course.status = 'published';
    course.isPublished = true;
    course.publishedAt = new Date();
    
    console.log('💾 Sauvegarde du cours avec statut publié...');
    await course.save();
    console.log('✅ Cours publié avec succès!');
    
    res.json({
      success: true,
              message: 'Cours publié avec succès ! Vos apprentis peuvent maintenant s\'inscrire.',
      data: course,
      hasModules: true,
      hasContent: true
    });
  } catch (error) {
    console.error('❌ Erreur publishCourse:', error);
    console.error('📋 Détails de l\'erreur:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    
    // Gestion des erreurs de validation Mongoose
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Erreurs de validation',
        errors: validationErrors
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
};

// Obtenir les cours d'un tuteur
const getTutorCourses = async (req, res) => {
  try {
    const { status, sort = 'createdAt', order = 'desc' } = req.query;
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 8));
    const skip = (page - 1) * limit;
    const q = (req.query.q || '').toString().trim();
    
    let query = { instructor: req.user.id };
    
    // Filtre par statut
    if (status) {
      query.status = status;
    }
    
    // Recherche texte (title, description, tags)
    if (q) {
      const safe = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(safe, 'i');
      query.$or = [
        { title: regex },
        { description: regex },
        { longDescription: regex },
        { tags: regex }
      ];
    }
    
    // Tri
    const sortOptions = {};
    sortOptions[sort] = order === 'desc' ? -1 : 1;
    
    const total = await Course.countDocuments(query);
    const courses = await Course.find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(limit);
    
    // Calculer le nombre correct de modules pour chaque cours
    const coursesWithModuleCount = courses.map(course => {
      const courseObj = course.toObject();
      courseObj.moduleCount = Array.isArray(courseObj.modules) ? courseObj.modules.length : 0;
      return courseObj;
    });
    
    res.json({
      success: true,
      data: coursesWithModuleCount,
      total,
      page,
      pages: Math.max(1, Math.ceil(total / limit)),
      limit
    });
  } catch (error) {
    console.error('Erreur getTutorCourses:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
};

// S'inscrire à un cours
const enrollInCourse = async (req, res) => {
  try {
    const { id } = req.params;
    
    const course = await Course.findById(id);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Cours introuvable'
      });
    }
    
    // Vérifier que le cours est publié
    if (!course.isPublished || course.status !== 'published') {
      return res.status(400).json({
        success: false,
        message: 'Ce cours n\'est pas encore disponible'
      });
    }
    
    // Vérifier que l'utilisateur n'est pas déjà inscrit
    const alreadyEnrolled = course.enrolledStudents.find(
      e => e.student.toString() === req.user.id
    );
    
    if (alreadyEnrolled) {
      return res.status(400).json({
        success: false,
        message: 'Vous êtes déjà inscrit à ce cours'
      });
    }
    
    // Ajouter l'étudiant au cours
    course.enrolledStudents.push({
      student: req.user.id,
      enrolledAt: new Date()
    });
    
    await course.save();
    
    res.json({
      success: true,
      message: `Inscription réussie au cours ${course.title}`,
      data: {
        courseId: course._id,
        courseTitle: course.title,
        enrolledAt: new Date()
      }
    });
  } catch (error) {
    console.error('Erreur enrollInCourse:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
};

// Obtenir les cours inscrits
const getEnrolledCourses = async (req, res) => {
  try {
    const courses = await Course.find({
      'enrolledStudents.student': req.user.id
    })
    .populate('instructor', 'name profile.avatar')
    .select('title description thumbnail instructor category level duration');
    
    res.json({
      success: true,
      data: courses
    });
  } catch (error) {
    console.error('Erreur getEnrolledCourses:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
};

module.exports = {
  getAllCourses,
  getCourseById,
  createCourse,
  updateCourse,
  deleteCourse,
  publishCourse,
  getTutorCourses,
  enrollInCourse,
  getEnrolledCourses
}; 