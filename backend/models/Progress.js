const mongoose = require('mongoose');

const progressSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  module: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Module',
    required: true
  },
  lesson: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lesson',
    required: true
  },
  status: {
    type: String,
    enum: ['not_started', 'in_progress', 'completed'],
    default: 'not_started'
  },
  startedAt: {
    type: Date
  },
  completedAt: {
    type: Date
  },
  timeSpent: {
    type: Number, // en secondes
    default: 0
  },
  lastAccessedAt: {
    type: Date,
    default: Date.now
  },
  // Pour les leçons vidéo, on peut suivre le temps de visionnage
  videoProgress: {
    currentTime: {
      type: Number,
      default: 0
    },
    duration: {
      type: Number,
      default: 0
    },
    watchedPercentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    }
  },
  // Pour les leçons de type fichier, on peut suivre les téléchargements
  downloads: [{
    downloadedAt: {
      type: Date,
      default: Date.now
    },
    fileName: String,
    fileSize: Number
  }],
  // Notes ou commentaires de l'étudiant
  notes: {
    type: String,
    maxlength: 1000
  },
  // Évaluation de la leçon par l'étudiant
  rating: {
    type: Number,
    min: 1,
    max: 5
  }
}, {
  timestamps: true
});

// Index pour éviter les doublons
progressSchema.index({ student: 1, course: 1, module: 1, lesson: 1 }, { unique: true });

// Méthode pour marquer une leçon comme commencée
progressSchema.methods.markAsStarted = function() {
  if (this.status === 'not_started') {
    this.status = 'in_progress';
    this.startedAt = new Date();
    this.lastAccessedAt = new Date();
  }
};

// Méthode pour marquer une leçon comme complétée
progressSchema.methods.markAsCompleted = function() {
  this.status = 'completed';
  this.completedAt = new Date();
  this.lastAccessedAt = new Date();
};

// Méthode pour mettre à jour le progrès vidéo
progressSchema.methods.updateVideoProgress = function(currentTime, duration) {
  this.videoProgress.currentTime = currentTime;
  this.videoProgress.duration = duration;
  this.videoProgress.watchedPercentage = duration > 0 ? Math.round((currentTime / duration) * 100) : 0;
  this.lastAccessedAt = new Date();
  
  // Marquer comme complété si 80% ou plus de la vidéo est regardée
  if (this.videoProgress.watchedPercentage >= 80 && this.status !== 'completed') {
    this.markAsCompleted();
  }
};

// Méthode pour ajouter un téléchargement
progressSchema.methods.addDownload = function(fileName, fileSize) {
  this.downloads.push({
    downloadedAt: new Date(),
    fileName: fileName,
    fileSize: fileSize
  });
  this.lastAccessedAt = new Date();
};

// Méthode statique pour obtenir les statistiques d'un cours
progressSchema.statics.getCourseStats = async function(courseId) {
  const stats = await this.aggregate([
    { $match: { course: mongoose.Types.ObjectId(courseId) } },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        avgTimeSpent: { $avg: '$timeSpent' },
        avgRating: { $avg: '$rating' }
      }
    }
  ]);
  
  return stats;
};

// Méthode statique pour obtenir les statistiques d'un étudiant
progressSchema.statics.getStudentStats = async function(studentId, courseId) {
  const stats = await this.aggregate([
    { 
      $match: { 
        student: mongoose.Types.ObjectId(studentId),
        course: courseId ? mongoose.Types.ObjectId(courseId) : { $exists: true }
      } 
    },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalTimeSpent: { $sum: '$timeSpent' },
        avgRating: { $avg: '$rating' }
      }
    }
  ]);
  
  return stats;
};

module.exports = mongoose.model('Progress', progressSchema);
