const mongoose = require('mongoose');

const replySchema = new mongoose.Schema({
  review: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CourseReview',
    required: [true, 'Le commentaire est requis']
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'L\'auteur est requis']
  },
  text: {
    type: String,
    required: [true, 'Le texte de la réponse est requis'],
    trim: true,
    maxlength: [500, 'La réponse ne peut pas dépasser 500 caractères']
  },
  isInstructorReply: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Index pour les performances
replySchema.index({ review: 1, createdAt: -1 });
replySchema.index({ author: 1 });

// Méthode pour vérifier si l'auteur est l'instructeur du cours
replySchema.methods.checkIfInstructorReply = async function() {
  const CourseReview = require('./CourseReview');
  const Course = require('./Course');
  
  const review = await CourseReview.findById(this.review).populate('course');
  if (!review) return false;
  
  const course = await Course.findById(review.course);
  if (!course) return false;
  
  return course.instructor.toString() === this.author.toString();
};

// Middleware pour mettre à jour isInstructorReply avant la sauvegarde
replySchema.pre('save', async function(next) {
  if (this.isNew) {
    this.isInstructorReply = await this.checkIfInstructorReply();
  }
  next();
});

module.exports = mongoose.model('Reply', replySchema);


