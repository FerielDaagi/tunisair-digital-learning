const mongoose = require('mongoose');

const courseReviewSchema = new mongoose.Schema({
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: [true, 'Le cours est requis']
  },
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'L\'étudiant est requis']
  },
  rating: {
    type: Number,
    required: [true, 'La note est requise'],
    min: [1, 'La note doit être au minimum 1'],
    max: [5, 'La note doit être au maximum 5']
  },
  comment: {
    type: String,
    trim: true,
    maxlength: [1000, 'Le commentaire ne peut pas dépasser 1000 caractères']
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  helpfulVotes: {
    type: Number,
    default: 0
  },
  voters: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }]
}, {
  timestamps: true
});

// Index pour éviter les doublons (un étudiant ne peut évaluer un cours qu'une seule fois)
courseReviewSchema.index({ course: 1, student: 1 }, { unique: true });

// Index pour les performances
courseReviewSchema.index({ course: 1, rating: 1 });
courseReviewSchema.index({ course: 1, createdAt: -1 });
courseReviewSchema.index({ student: 1 });

// Méthode pour voter utile/pas utile
courseReviewSchema.methods.toggleHelpfulVote = async function(userId) {
  const voterIndex = this.voters.indexOf(userId);
  
  if (voterIndex > -1) {
    // L'utilisateur a déjà voté, on retire son vote
    this.voters.splice(voterIndex, 1);
    this.helpfulVotes = Math.max(0, this.helpfulVotes - 1);
  } else {
    // L'utilisateur n'a pas encore voté, on ajoute son vote
    this.voters.push(userId);
    this.helpfulVotes += 1;
  }
  
  await this.save();
  return this.helpfulVotes;
};

// Méthode statique pour calculer les statistiques d'un cours
courseReviewSchema.statics.getCourseStats = async function(courseId) {
  console.log('🔍 getCourseStats - courseId:', courseId);
  
  // Vérifier que l'ID est valide
  if (!mongoose.Types.ObjectId.isValid(courseId)) {
    throw new Error('ID de cours invalide');
  }
  
  // Utiliser une approche plus simple avec find() au lieu d'aggregate
  const reviews = await this.find({ course: courseId });
  console.log('🔍 getCourseStats - reviews trouvées:', reviews.length);
  
  if (reviews.length === 0) {
    console.log('🔍 getCourseStats - Aucune review trouvée');
    return {
      totalReviews: 0,
      averageRating: 0,
      ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
    };
  }

  // Calculer les statistiques manuellement
  const totalReviews = reviews.length;
  const sumRatings = reviews.reduce((sum, review) => sum + review.rating, 0);
  const averageRating = sumRatings / totalReviews;
  
  const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  reviews.forEach(review => {
    distribution[review.rating] = (distribution[review.rating] || 0) + 1;
  });

  const result = {
    totalReviews,
    averageRating: Math.round(averageRating * 10) / 10,
    ratingDistribution: distribution
  };
  
  console.log('🔍 getCourseStats - résultat:', result);
  return result;
};

module.exports = mongoose.model('CourseReview', courseReviewSchema);
