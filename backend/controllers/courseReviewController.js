const CourseReview = require('../models/CourseReview');
const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');

// Créer ou mettre à jour un commentaire/évaluation
const createOrUpdateReview = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { rating, comment } = req.body;
    const studentId = req.user.id;

    // Vérifier que le cours existe
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Cours non trouvé'
      });
    }

    // Vérifier l'accès: autoriser le tuteur propriétaire à commenter même sans inscription
    let enrollment = await Enrollment.findOne({
      student: studentId,
      course: courseId
    });

    if (!enrollment) {
      if (req.user && req.user.role === 'tuteur' && String(course.instructor) === String(req.user.id)) {
        // Autoriser sans enrollment
      } else {
        return res.status(403).json({
          success: false,
          message: 'Vous devez être inscrit au cours pour le commenter'
        });
      }
    }

    // Vérifier que l'étudiant a au moins commencé le cours (plus souple)
    if (enrollment.progress === 0) {
      console.log('⚠️ Tentative de commentaire sans progression, mais on autorise quand même');
      // On autorise les commentaires même sans progression pour l'instant
    }

    // Validation des données
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: 'La note doit être entre 1 et 5'
      });
    }

    if (comment && comment.length > 1000) {
      return res.status(400).json({
        success: false,
        message: 'Le commentaire ne peut pas dépasser 1000 caractères'
      });
    }

    // Chercher un commentaire existant
    let review = await CourseReview.findOne({
      course: courseId,
      student: studentId
    });

    if (review) {
      // Mettre à jour le commentaire existant
      review.rating = rating;
      review.comment = comment || '';
      // Marquer comme vérifié si inscrit ou si propriétaire
      const isOwner = String(course.instructor) === String(req.user.id);
      review.isVerified = Boolean(enrollment) || isOwner;
    } else {
      // Créer un nouveau commentaire
      review = new CourseReview({
        course: courseId,
        student: studentId,
        rating,
        comment: comment || '',
        isVerified: Boolean(enrollment) || (String(course.instructor) === String(req.user.id))
      });
    }

    await review.save();

    // Mettre à jour les statistiques du cours
    await updateCourseRatingStats(courseId);

    res.json({
      success: true,
      message: review.isNew ? 'Commentaire ajouté avec succès' : 'Commentaire mis à jour avec succès',
      data: {
        review: {
          id: review._id,
          rating: review.rating,
          comment: review.comment,
          createdAt: review.createdAt,
          updatedAt: review.updatedAt
        }
      }
    });

  } catch (error) {
    console.error('Erreur lors de la création/mise à jour du commentaire:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur',
      error: error.message
    });
  }
};

// Obtenir les commentaires d'un cours
const getCourseReviews = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

    console.log('🔍 getCourseReviews - courseId:', courseId);
    console.log('🔍 getCourseReviews - query params:', { page, limit, sortBy, sortOrder });

    // Vérifier que le cours existe
    const course = await Course.findById(courseId);
    if (!course) {
      console.log('❌ Cours non trouvé:', courseId);
      return res.status(404).json({
        success: false,
        message: 'Cours non trouvé'
      });
    }

    console.log('✅ Cours trouvé:', course.title);

    const skip = (page - 1) * limit;
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    console.log('🔍 Recherche des commentaires avec options:', { courseId, sortOptions, skip, limit });

    // Vérifier que l'ID est valide
    const mongoose = require('mongoose');
    if (!mongoose.Types.ObjectId.isValid(courseId)) {
      console.log('❌ ID de cours invalide:', courseId);
      return res.status(400).json({
        success: false,
        message: 'ID de cours invalide'
      });
    }

    const reviews = await CourseReview.find({ course: courseId })
      .populate('student', 'name email profile.avatar')
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit));

    console.log('📋 Commentaires trouvés:', reviews.length);

    // Obtenir les statistiques du cours
    console.log('🔍 Avant getCourseStats - courseId:', courseId);
    const stats = await CourseReview.getCourseStats(courseId);
    console.log('📈 Statistiques calculées:', stats);
    console.log('📈 Type de stats:', typeof stats);
    console.log('📈 Stats.totalReviews:', stats?.totalReviews);
    console.log('📈 Stats.averageRating:', stats?.averageRating);
    
    const totalReviews = stats.totalReviews;
    console.log('📊 Total des commentaires (depuis stats):', totalReviews);

    res.json({
      success: true,
      data: {
        reviews,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalReviews / limit),
          totalReviews,
          hasNext: page < Math.ceil(totalReviews / limit),
          hasPrev: page > 1
        },
        stats
      }
    });

  } catch (error) {
    console.error('❌ Erreur lors de la récupération des commentaires:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur',
      error: error.message
    });
  }
};

// Obtenir le commentaire d'un utilisateur pour un cours
const getUserReview = async (req, res) => {
  try {
    const { courseId } = req.params;
    const studentId = req.user.id;

    const review = await CourseReview.findOne({
      course: courseId,
      student: studentId
    });

    res.json({
      success: true,
      data: {
        review: review || null
      }
    });

  } catch (error) {
    console.error('Erreur lors de la récupération du commentaire utilisateur:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur',
      error: error.message
    });
  }
};

// Supprimer un commentaire
const deleteReview = async (req, res) => {
  try {
    const { courseId } = req.params;
    const studentId = req.user.id;

    const review = await CourseReview.findOneAndDelete({
      course: courseId,
      student: studentId
    });

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Commentaire non trouvé'
      });
    }

    // Mettre à jour les statistiques du cours
    await updateCourseRatingStats(courseId);

    res.json({
      success: true,
      message: 'Commentaire supprimé avec succès'
    });

  } catch (error) {
    console.error('Erreur lors de la suppression du commentaire:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur',
      error: error.message
    });
  }
};

// Voter utile/pas utile pour un commentaire
const toggleHelpfulVote = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const userId = req.user.id;

    const review = await CourseReview.findById(reviewId);
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Commentaire non trouvé'
      });
    }

    // Vérifier que l'utilisateur ne vote pas pour son propre commentaire
    if (review.student.toString() === userId) {
      return res.status(400).json({
        success: false,
        message: 'Vous ne pouvez pas voter pour votre propre commentaire'
      });
    }

    const newVoteCount = await review.toggleHelpfulVote(userId);

    res.json({
      success: true,
      message: 'Vote enregistré avec succès',
      data: {
        helpfulVotes: newVoteCount
      }
    });

  } catch (error) {
    console.error('Erreur lors du vote:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur',
      error: error.message
    });
  }
};

// Fonction utilitaire pour mettre à jour les statistiques de rating du cours
const updateCourseRatingStats = async (courseId) => {
  try {
    const stats = await CourseReview.getCourseStats(courseId);
    
    await Course.findByIdAndUpdate(courseId, {
      'rating.average': stats.averageRating,
      'rating.count': stats.totalReviews
    });

    console.log(`✅ Statistiques de rating mises à jour pour le cours ${courseId}:`, stats);
  } catch (error) {
    console.error('Erreur lors de la mise à jour des statistiques:', error);
  }
};

module.exports = {
  createOrUpdateReview,
  getCourseReviews,
  getUserReview,
  deleteReview,
  toggleHelpfulVote
};
