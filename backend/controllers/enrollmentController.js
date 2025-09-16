const Course = require('../models/Course');
const User = require('../models/User');
const Enrollment = require('../models/Enrollment');
const Progress = require('../models/Progress');
const Module = require('../models/Module');
const Lesson = require('../models/Lesson');
const Notification = require('../models/Notification');

// Publier un cours (pour les tuteurs)
const publishCourse = async (req, res) => {
  try {
    const { courseId } = req.params;
    const instructorId = req.user.id;

    // Vérifier que le cours existe et appartient à l'instructeur
    const course = await Course.findById(courseId)
      .populate('modules')
      .populate('instructor');

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Cours non trouvé'
      });
    }

    // Autoriser l'admin à publier n'importe quel cours
    if (course.instructor._id.toString() !== instructorId && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Vous n\'êtes pas autorisé à publier ce cours'
      });
    }

    // Vérifier que le cours a du contenu
    if (!course.modules || course.modules.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Le cours doit contenir au moins un module pour être publié'
      });
    }

    // Vérifier que chaque module a des leçons
    for (const module of course.modules) {
      const moduleWithLessons = await Module.findById(module._id).populate('lessons');
      if (!moduleWithLessons.lessons || moduleWithLessons.lessons.length === 0) {
        return res.status(400).json({
          success: false,
          message: `Le module "${moduleWithLessons.title}" doit contenir au moins une leçon`
        });
      }
    }

    // Publier le cours
    course.status = 'published';
    course.isPublished = true;
    course.publishedAt = new Date();
    await course.save();

    // Notifier tous les étudiants de la plateforme
    const students = await User.find({ role: 'apprenti' });
    
    for (const student of students) {
      const notification = new Notification({
        sender: course.instructor._id,
        recipient: 'specific',
        recipientId: student._id,
        title: 'Nouveau cours disponible !',
        message: `Le cours "${course.title}" a été publié par ${course.instructor.firstName} ${course.instructor.lastName}`,
        type: 'info',
        category: 'course',
        metadata: {
          courseId: course._id,
          courseTitle: course.title,
          instructorName: `${course.instructor.firstName} ${course.instructor.lastName}`
        }
      });
      await notification.save();
    }

    res.json({
      success: true,
      message: 'Cours publié avec succès',
      data: {
        course: {
          id: course._id,
          title: course.title,
          status: course.status,
          publishedAt: course.publishedAt,
          studentCount: course.enrolledStudents.length
        }
      }
    });

  } catch (error) {
    console.error('Erreur lors de la publication du cours:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la publication du cours',
      error: error.message
    });
  }
};

// S'inscrire à un cours (pour les apprentis)
const enrollInCourse = async (req, res) => {
  try {
    const { courseId } = req.params;
    const studentId = req.user.id;

    // Vérifier que le cours existe et est publié
    const course = await Course.findById(courseId).populate('modules');
    
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Cours non trouvé'
      });
    }

    if (course.status !== 'published') {
      return res.status(400).json({
        success: false,
        message: 'Ce cours n\'est pas encore publié'
      });
    }

    // Vérifier si l'étudiant est déjà inscrit
    const existingEnrollment = await Enrollment.findOne({
      student: studentId,
      course: courseId
    });

    if (existingEnrollment) {
      console.log('ℹ️ Utilisateur déjà inscrit, retour succès idempotent');
      return res.json({
        success: true,
        message: 'Vous êtes déjà inscrit à ce cours',
        data: {
          enrollment: {
            id: existingEnrollment._id,
            courseId: course._id,
            courseTitle: course.title,
            enrolledAt: existingEnrollment.enrolledAt,
            progress: existingEnrollment.progress
          }
        }
      });
    }

    // Créer l'inscription
    const enrollment = new Enrollment({
      student: studentId,
      course: courseId,
      enrolledAt: new Date(),
      status: 'active'
    });

    await enrollment.save();

    // Ajouter l'étudiant à la liste des inscrits du cours (éviter les doublons)
    const alreadyInCourseList = Array.isArray(course.enrolledStudents) && course.enrolledStudents.some((entry) => {
      if (!entry) return false;
      const entryStudentId = (entry.student && (entry.student._id || entry.student.id || entry.student.toString?.())) || entry._id || entry.id || entry;
      return entryStudentId?.toString() === studentId;
    });
    if (!alreadyInCourseList) {
      course.enrolledStudents.push({
        student: studentId,
        enrolledAt: new Date(),
        progress: 0,
        completedLessons: [],
        lastAccessed: new Date()
      });
    }

    await course.save();

    // Créer les enregistrements de progression pour toutes les leçons (avec garde)
    const allLessons = [];
    if (Array.isArray(course.modules)) {
      for (const courseModule of course.modules) {
        const moduleId = courseModule?._id || courseModule;
        if (!moduleId) continue;
        const moduleWithLessons = await Module.findById(moduleId).populate('lessons');
        const lessons = moduleWithLessons?.lessons || [];
        if (Array.isArray(lessons) && lessons.length > 0) {
          for (const lesson of lessons) {
            if (!lesson?._id) continue;
            allLessons.push({
              student: studentId,
              course: courseId,
              module: moduleId,
              lesson: lesson._id,
              status: 'not_started'
            });
          }
        }
      }
    }

    if (allLessons.length > 0) {
      await Progress.insertMany(allLessons);
    }

    // Notifier l'instructeur
    const instructor = course?.instructor ? await User.findById(course.instructor) : null;
    if (instructor && studentId) {
      const notification = new Notification({
        sender: studentId, // L'étudiant qui s'inscrit
        recipient: 'specific',
        recipientId: instructor._id,
        title: 'Nouvel étudiant inscrit',
        message: `${req.user.firstName} ${req.user.lastName} s'est inscrit à votre cours "${course.title}"`,
        type: 'info',
        category: 'course',
        metadata: {
          courseId: course._id,
          courseTitle: course.title,
          studentId: studentId,
          studentName: `${req.user.firstName} ${req.user.lastName}`
        }
      });
      await notification.save();
    }

    res.json({
      success: true,
      message: 'Inscription réussie',
      data: {
        enrollment: {
          id: enrollment._id,
          courseId: course._id,
          courseTitle: course.title,
          enrolledAt: enrollment.enrolledAt,
          progress: enrollment.progress
        }
      }
    });

  } catch (error) {
    // Gérer proprement l'unicité (duplicate key)
    if (error && error.code === 11000) {
      return res.json({
        success: true,
        message: 'Vous êtes déjà inscrit à ce cours',
      });
    }
    console.error('Erreur lors de l\'inscription au cours:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de l\'inscription',
      error: error.message
    });
  }
};

// Obtenir les cours publiés (pour les apprentis)
const getPublishedCourses = async (req, res) => {
  try {
    const { page = 1, limit = 10, category, level, search } = req.query;
    const skip = (page - 1) * limit;

    // Construire le filtre
    const filter = {
      status: 'published',
      isPublished: true
    };

    if (category) {
      filter.category = category;
    }

    if (level) {
      filter.level = level;
    }

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const courses = await Course.find(filter)
      .populate('instructor', 'firstName lastName email')
      .populate('category')
      .populate('modules')
      .sort({ publishedAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Course.countDocuments(filter);

    res.json({
      success: true,
      data: {
        courses,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / limit),
          total
        }
      }
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des cours publiés:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur',
      error: error.message
    });
  }
};

// Obtenir les cours d'un étudiant
const getStudentCourses = async (req, res) => {
  try {
    const studentId = req.user.id;
    const { status } = req.query;

    const filter = { student: studentId };
    if (status) {
      filter.status = status;
    }

    const enrollments = await Enrollment.find(filter)
      .populate({
        path: 'course',
        populate: [
          { path: 'instructor', select: 'firstName lastName email' },
          { path: 'modules' }
        ]
      })
      .sort({ lastAccessedAt: -1 });

    res.json({
      success: true,
      data: {
        enrollments,
        total: enrollments.length
      }
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des cours de l\'étudiant:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur',
      error: error.message
    });
  }
};

// Obtenir les statistiques d'un cours (pour les tuteurs)
const getCourseStats = async (req, res) => {
  try {
    const { courseId } = req.params;
    const instructorId = req.user.id;

    // Vérifier que le cours appartient à l'instructeur
    const course = await Course.findById(courseId);
    // Autoriser l'admin à voir les stats de n'importe quel cours
    if (!course || (course.instructor.toString() !== instructorId && req.user.role !== 'admin')) {
      return res.status(403).json({
        success: false,
        message: 'Accès non autorisé'
      });
    }

    // Obtenir les statistiques d'enrollment
    const enrollmentStats = await Enrollment.aggregate([
      { $match: { course: course._id } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Obtenir les statistiques de progression
    const progressStats = await Progress.aggregate([
      { $match: { course: course._id } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          avgTimeSpent: { $avg: '$timeSpent' }
        }
      }
    ]);

    // Obtenir les étudiants récents
    const recentStudents = await Enrollment.find({ course: course._id })
      .populate('student', 'firstName lastName email')
      .sort({ enrolledAt: -1 })
      .limit(5);

    res.json({
      success: true,
      data: {
        course: {
          id: course._id,
          title: course.title,
          totalStudents: course.enrolledStudents.length,
          publishedAt: course.publishedAt
        },
        enrollmentStats,
        progressStats,
        recentStudents
      }
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur',
      error: error.message
    });
  }
};

module.exports = {
  publishCourse,
  enrollInCourse,
  getPublishedCourses,
  getStudentCourses,
  getCourseStats
};
