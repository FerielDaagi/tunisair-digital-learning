const Reply = require('../models/Reply');
const CourseReview = require('../models/CourseReview');
const Course = require('../models/Course');

// Créer une réponse à un commentaire
const createReply = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { text } = req.body;
    const authorId = req.user.id;

    // Vérifier que le commentaire existe
    const review = await CourseReview.findById(reviewId);
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Commentaire non trouvé'
      });
    }

    // Vérifier que l'utilisateur est inscrit au cours
    const course = await Course.findById(review.course);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Cours non trouvé'
      });
    }

    // Vérifier que l'utilisateur est inscrit au cours ou est l'instructeur
    const isEnrolled = course.enrolledStudents.some(
      enrollment => enrollment.student.toString() === authorId
    );
    const isInstructor = course.instructor.toString() === authorId;

    if (!isEnrolled && !isInstructor) {
      return res.status(403).json({
        success: false,
        message: 'Vous devez être inscrit au cours pour répondre aux commentaires'
      });
    }

    // Validation des données
    if (!text || text.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Le texte de la réponse est requis'
      });
    }

    if (text.length > 500) {
      return res.status(400).json({
        success: false,
        message: 'La réponse ne peut pas dépasser 500 caractères'
      });
    }

    // Créer la réponse
    const reply = new Reply({
      review: reviewId,
      author: authorId,
      text: text.trim()
    });

    await reply.save();
    await reply.populate('author', 'name email profile.avatar');

    res.status(201).json({
      success: true,
      message: 'Réponse ajoutée avec succès',
      data: {
        reply: {
          id: reply._id,
          text: reply.text,
          author: {
            id: reply.author._id,
            name: reply.author.name,
            avatar: reply.author.profile?.avatar
          },
          isInstructorReply: reply.isInstructorReply,
          createdAt: reply.createdAt
        }
      }
    });

  } catch (error) {
    console.error('Erreur lors de la création de la réponse:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur',
      error: error.message
    });
  }
};

// Obtenir les réponses d'un commentaire
const getRepliesByReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    // Vérifier que le commentaire existe
    const review = await CourseReview.findById(reviewId);
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Commentaire non trouvé'
      });
    }

    const skip = (page - 1) * limit;

    const replies = await Reply.find({ review: reviewId })
      .populate('author', 'name email profile.avatar')
      .sort({ createdAt: 1 }) // Plus anciennes en premier
      .skip(skip)
      .limit(parseInt(limit));

    const totalReplies = await Reply.countDocuments({ review: reviewId });

    res.json({
      success: true,
      data: {
        replies,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalReplies / limit),
          totalReplies,
          hasNext: page < Math.ceil(totalReplies / limit),
          hasPrev: page > 1
        }
      }
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des réponses:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur',
      error: error.message
    });
  }
};

// Supprimer une réponse
const deleteReply = async (req, res) => {
  try {
    const { replyId } = req.params;
    const userId = req.user.id;

    const reply = await Reply.findById(replyId);
    if (!reply) {
      return res.status(404).json({
        success: false,
        message: 'Réponse non trouvée'
      });
    }

    // Vérifier que l'utilisateur est l'auteur de la réponse ou l'instructeur du cours
    const review = await CourseReview.findById(reply.review).populate('course');
    const course = review.course;
    
    const isAuthor = reply.author.toString() === userId;
    const isInstructor = course.instructor.toString() === userId;

    if (!isAuthor && !isInstructor) {
      return res.status(403).json({
        success: false,
        message: 'Vous n\'êtes pas autorisé à supprimer cette réponse'
      });
    }

    await Reply.findByIdAndDelete(replyId);

    res.json({
      success: true,
      message: 'Réponse supprimée avec succès'
    });

  } catch (error) {
    console.error('Erreur lors de la suppression de la réponse:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur',
      error: error.message
    });
  }
};

module.exports = {
  createReply,
  getRepliesByReview,
  deleteReply
};


