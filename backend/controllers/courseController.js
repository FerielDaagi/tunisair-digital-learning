const Course = require('../models/Course');
const Category = require('../models/Category');
const User = require('../models/User');

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
      .populate('category', 'name')
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
      .populate('category', 'name description')
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
    
    // Vérifier que l'utilisateur est un tuteur
    if (req.user.role !== 'tuteur') {
      return res.status(403).json({
        success: false,
        message: 'Seuls les tuteurs peuvent créer des cours'
      });
    }
    
    // Vérifier que la catégorie est valide (catégories statiques)
    const validCategories = ['frontend', 'backend', 'database', 'mobile', 'devops', 'ai-ml', 'cybersecurity', 'other'];
    if (!validCategories.includes(category)) {
      return res.status(400).json({
        success: false,
        message: 'Catégorie invalide'
      });
    }
    
    // Créer le cours
    const newCourse = new Course({
      title,
      description,
      longDescription,
      instructor: req.user.id,
      category: category, // Stocker l'ID de la catégorie comme string
      level,
      duration,
      price: price || 0,
      requirements: requirements || [],
      outcomes: outcomes || [],
      tags: tags || [],
      language: language || 'français',
      status: 'draft'
    });
    
    await newCourse.save();
    
    // Populate les références (sans category car c'est un string)
    await newCourse.populate('instructor', 'name profile.avatar');
    
    res.status(201).json({
      success: true,
      message: 'Cours créé avec succès',
      data: newCourse
    });
  } catch (error) {
    console.error('Erreur createCourse:', error);
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
    const updateData = req.body;
    
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
    
    // Mettre à jour le cours
    const updatedCourse = await Course.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate('instructor', 'name profile.avatar')
     .populate('category', 'name');
    
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
        message: 'Impossible de supprimer un cours avec des étudiants inscrits'
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
        message: 'Vous n\'êtes pas autorisé à publier ce cours'
      });
    }
    
    // Vérifier que le cours a au moins un module et une leçon
    if (!course.modules || course.modules.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Le cours doit avoir au moins un module pour être publié'
      });
    }
    
    // Publier le cours
    course.status = 'published';
    course.isPublished = true;
    course.publishedAt = new Date();
    
    await course.save();
    
    res.json({
      success: true,
      message: 'Cours publié avec succès',
      data: course
    });
  } catch (error) {
    console.error('Erreur publishCourse:', error);
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
    
    let query = { instructor: req.user.id };
    
    // Filtre par statut
    if (status) {
      query.status = status;
    }
    
    // Tri
    const sortOptions = {};
    sortOptions[sort] = order === 'desc' ? -1 : 1;
    
    const courses = await Course.find(query)
      .populate('category', 'name')
      .sort(sortOptions);
    
    res.json({
      success: true,
      data: courses
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
    .populate('category', 'name')
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