const Progress = require('../models/Progress');
const Enrollment = require('../models/Enrollment');
const Course = require('../models/Course');
const Module = require('../models/Module');
const Lesson = require('../models/Lesson');
const { createCertificateOnCompletion } = require('./certificateController');

// Marquer une leçon comme commencée
const markLessonStarted = async (req, res) => {
  try {
    const { lessonId } = req.params;
    const studentId = req.user.id;

    // Vérifier que la leçon existe
    const lesson = await Lesson.findById(lessonId).populate('module');
    if (!lesson) {
      return res.status(404).json({
        success: false,
        message: 'Leçon non trouvée'
      });
    }

    // Vérifier que l'étudiant est inscrit au cours
    const enrollment = await Enrollment.findOne({
      student: studentId,
      course: lesson.module.course
    });

    if (!enrollment) {
      return res.status(403).json({
        success: false,
        message: 'Vous n\'êtes pas inscrit à ce cours'
      });
    }

    // Trouver ou créer l'enregistrement de progression
    let progress = await Progress.findOne({
      student: studentId,
      course: lesson.module.course,
      module: lesson.module._id,
      lesson: lessonId
    });

    if (!progress) {
      progress = new Progress({
        student: studentId,
        course: lesson.module.course,
        module: lesson.module._id,
        lesson: lessonId,
        status: 'in_progress',
        startedAt: new Date()
      });
    } else if (progress.status === 'not_started') {
      progress.status = 'in_progress';
      progress.startedAt = new Date();
    }

    progress.lastAccessedAt = new Date();
    await progress.save();

    res.json({
      success: true,
      message: 'Leçon marquée comme commencée',
      data: {
        progress: {
          lessonId: lessonId,
          status: progress.status,
          startedAt: progress.startedAt,
          lastAccessedAt: progress.lastAccessedAt
        }
      }
    });

  } catch (error) {
    console.error('Erreur lors du marquage de la leçon comme commencée:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur',
      error: error.message
    });
  }
};

// Marquer une leçon comme complétée
const markLessonCompleted = async (req, res) => {
  try {
    const { lessonId } = req.params;
    const studentId = req.user.id;

    // Vérifier que la leçon existe
    const lesson = await Lesson.findById(lessonId).populate('module');
    if (!lesson) {
      return res.status(404).json({
        success: false,
        message: 'Leçon non trouvée'
      });
    }

    // Vérifier que l'étudiant est inscrit au cours
    const enrollment = await Enrollment.findOne({
      student: studentId,
      course: lesson.module.course
    });

    if (!enrollment) {
      return res.status(403).json({
        success: false,
        message: 'Vous n\'êtes pas inscrit à ce cours'
      });
    }

    // Trouver ou créer l'enregistrement de progression
    let progress = await Progress.findOne({
      student: studentId,
      course: lesson.module.course,
      module: lesson.module._id,
      lesson: lessonId
    });

    if (!progress) {
      progress = new Progress({
        student: studentId,
        course: lesson.module.course,
        module: lesson.module._id,
        lesson: lessonId,
        status: 'completed',
        completedAt: new Date()
      });
    } else {
      progress.markAsCompleted();
    }

    await progress.save();

    // Mettre à jour l'enrollment
    await enrollment.markLessonCompleted(lessonId);

    // Vérifier si le cours est maintenant complété (100%)
    let certificateCreated = false;
    if (enrollment.progress === 100 && enrollment.status === 'completed') {
      try {
        await createCertificateOnCompletion(enrollment._id);
        certificateCreated = true;
        console.log(`🎓 Certificat créé automatiquement pour ${req.user.name} - Cours: ${lesson.module.course}`);
      } catch (certError) {
        console.error('Erreur lors de la création automatique du certificat:', certError);
        // Ne pas faire échouer la requête si la création du certificat échoue
      }
    }

    res.json({
      success: true,
      message: 'Leçon marquée comme complétée',
      data: {
        progress: {
          lessonId: lessonId,
          status: progress.status,
          completedAt: progress.completedAt,
          courseProgress: enrollment.progress
        },
        courseCompleted: enrollment.progress === 100,
        certificateCreated: certificateCreated
      }
    });

  } catch (error) {
    console.error('Erreur lors du marquage de la leçon:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur',
      error: error.message
    });
  }
};

// Mettre à jour le progrès vidéo
const updateVideoProgress = async (req, res) => {
  try {
    const { lessonId } = req.params;
    const { currentTime, duration } = req.body;
    const studentId = req.user.id;

    // Vérifier que la leçon existe
    const lesson = await Lesson.findById(lessonId).populate('module');
    if (!lesson) {
      return res.status(404).json({
        success: false,
        message: 'Leçon non trouvée'
      });
    }

    // Vérifier que l'étudiant est inscrit au cours
    const enrollment = await Enrollment.findOne({
      student: studentId,
      course: lesson.module.course
    });

    if (!enrollment) {
      return res.status(403).json({
        success: false,
        message: 'Vous n\'êtes pas inscrit à ce cours'
      });
    }

    // Trouver ou créer l'enregistrement de progression
    let progress = await Progress.findOne({
      student: studentId,
      course: lesson.module.course,
      module: lesson.module._id,
      lesson: lessonId
    });

    if (!progress) {
      progress = new Progress({
        student: studentId,
        course: lesson.module.course,
        module: lesson.module._id,
        lesson: lessonId,
        status: 'in_progress',
        startedAt: new Date()
      });
    }

    // Mettre à jour le progrès vidéo
    progress.updateVideoProgress(currentTime, duration);
    await progress.save();

    // Si la vidéo est complétée (80% ou plus), marquer la leçon comme complétée
    if (progress.videoProgress.watchedPercentage >= 80 && progress.status === 'in_progress') {
      await enrollment.markLessonCompleted(lessonId);
    }

    res.json({
      success: true,
      message: 'Progrès vidéo mis à jour',
      data: {
        progress: {
          lessonId: lessonId,
          currentTime: progress.videoProgress.currentTime,
          duration: progress.videoProgress.duration,
          watchedPercentage: progress.videoProgress.watchedPercentage,
          status: progress.status,
          courseProgress: enrollment.progress
        }
      }
    });

  } catch (error) {
    console.error('Erreur lors de la mise à jour du progrès vidéo:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur',
      error: error.message
    });
  }
};

// Obtenir la progression d'un cours pour un étudiant
const getCourseProgress = async (req, res) => {
  try {
    const { courseId } = req.params;
    const studentId = req.user.id;

    // Vérifier que l'étudiant est inscrit au cours
    const enrollment = await Enrollment.findOne({
      student: studentId,
      course: courseId
    }).populate('course');

    if (!enrollment) {
      return res.status(403).json({
        success: false,
        message: 'Vous n\'êtes pas inscrit à ce cours'
      });
    }

    // Obtenir tous les modules et leçons du cours
    const course = await Course.findById(courseId)
      .populate({
        path: 'modules',
        populate: {
          path: 'lessons',
          model: 'Lesson'
        }
      });

    // Obtenir la progression pour chaque leçon
    const progressData = await Progress.find({
      student: studentId,
      course: courseId
    });

    // Organiser les données par module
    const modulesWithProgress = course.modules.map(module => {
      const moduleProgress = {
        _id: module._id,
        title: module.title,
        description: module.description,
        order: module.order,
        lessons: module.lessons.map(lesson => {
          const lessonProgress = progressData.find(p => p.lesson.toString() === lesson._id.toString());
          return {
            _id: lesson._id,
            title: lesson.title,
            description: lesson.description,
            type: lesson.type,
            duration: lesson.duration,
            order: lesson.order,
            progress: lessonProgress ? {
              status: lessonProgress.status,
              startedAt: lessonProgress.startedAt,
              completedAt: lessonProgress.completedAt,
              timeSpent: lessonProgress.timeSpent,
              videoProgress: lessonProgress.videoProgress,
              notes: lessonProgress.notes,
              rating: lessonProgress.rating
            } : {
              status: 'not_started',
              startedAt: null,
              completedAt: null,
              timeSpent: 0,
              videoProgress: {
                currentTime: 0,
                duration: 0,
                watchedPercentage: 0
              },
              notes: null,
              rating: null
            }
          };
        })
      };

      // Calculer le progrès du module
      const completedLessons = moduleProgress.lessons.filter(l => l.progress.status === 'completed').length;
      const totalLessons = moduleProgress.lessons.length;
      moduleProgress.progress = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

      return moduleProgress;
    });

    res.json({
      success: true,
      data: {
        course: {
          _id: course._id,
          title: course.title,
          description: course.description,
          instructor: course.instructor,
          totalProgress: enrollment.progress,
          enrolledAt: enrollment.enrolledAt,
          lastAccessedAt: enrollment.lastAccessedAt,
          status: enrollment.status
        },
        modules: modulesWithProgress,
        enrollment: {
          _id: enrollment._id,
          progress: enrollment.progress,
          completedLessons: enrollment.completedLessons,
          enrolledAt: enrollment.enrolledAt,
          lastAccessedAt: enrollment.lastAccessedAt,
          status: enrollment.status
        }
      }
    });

  } catch (error) {
    console.error('Erreur lors de la récupération de la progression:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur',
      error: error.message
    });
  }
};


// Évaluer une leçon
const rateLesson = async (req, res) => {
  try {
    const { lessonId } = req.params;
    const { rating } = req.body;
    const studentId = req.user.id;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: 'La note doit être entre 1 et 5'
      });
    }

    // Vérifier que la leçon existe
    const lesson = await Lesson.findById(lessonId).populate('module');
    if (!lesson) {
      return res.status(404).json({
        success: false,
        message: 'Leçon non trouvée'
      });
    }

    // Vérifier que l'étudiant est inscrit au cours
    const enrollment = await Enrollment.findOne({
      student: studentId,
      course: lesson.module.course
    });

    if (!enrollment) {
      return res.status(403).json({
        success: false,
        message: 'Vous n\'êtes pas inscrit à ce cours'
      });
    }

    // Trouver ou créer l'enregistrement de progression
    let progress = await Progress.findOne({
      student: studentId,
      course: lesson.module.course,
      module: lesson.module._id,
      lesson: lessonId
    });

    if (!progress) {
      progress = new Progress({
        student: studentId,
        course: lesson.module.course,
        module: lesson.module._id,
        lesson: lessonId,
        status: 'in_progress',
        startedAt: new Date()
      });
    }

    progress.rating = rating;
    progress.lastAccessedAt = new Date();
    await progress.save();

    res.json({
      success: true,
      message: 'Évaluation enregistrée',
      data: {
        progress: {
          lessonId: lessonId,
          rating: progress.rating,
          lastAccessedAt: progress.lastAccessedAt
        }
      }
    });

  } catch (error) {
    console.error('Erreur lors de l\'évaluation:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur',
      error: error.message
    });
  }
};

module.exports = {
  markLessonStarted,
  markLessonCompleted,
  updateVideoProgress,
  getCourseProgress,
  rateLesson
};
