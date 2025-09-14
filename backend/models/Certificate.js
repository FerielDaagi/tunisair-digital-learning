const mongoose = require('mongoose');

const certificateSchema = new mongoose.Schema({
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
  enrollment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Enrollment',
    required: true
  },
  certificateNumber: {
    type: String,
    required: true,
    unique: true
  },
  issuedAt: {
    type: Date,
    default: Date.now
  },
  completedAt: {
    type: Date,
    required: true
  },
  grade: {
    type: String,
    enum: ['A+', 'A', 'B+', 'B', 'C+', 'C', 'D', 'F'],
    default: 'A'
  },
  completionPercentage: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  totalLessons: {
    type: Number,
    required: true
  },
  completedLessons: {
    type: Number,
    required: true
  },
  timeSpent: {
    type: Number, // en heures
    default: 0
  },
  isValid: {
    type: Boolean,
    default: true
  },
  revokedAt: {
    type: Date
  },
  revokedReason: {
    type: String
  },
  // Métadonnées du certificat
  metadata: {
    platform: {
      type: String,
      default: 'E-Learning Platform'
    },
    version: {
      type: String,
      default: '1.0'
    },
    template: {
      type: String,
      default: 'default'
    }
  }
}, {
  timestamps: true
});

// Index pour les performances
certificateSchema.index({ student: 1, course: 1 }, { unique: true });
certificateSchema.index({ certificateNumber: 1 });
certificateSchema.index({ issuedAt: -1 });
certificateSchema.index({ isValid: 1 });

// Méthode pour générer un numéro de certificat unique
certificateSchema.statics.generateCertificateNumber = function() {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substr(2, 5);
  return `CERT-${timestamp}-${random}`.toUpperCase();
};

// Méthode pour calculer la note basée sur le pourcentage de completion
certificateSchema.methods.calculateGrade = function() {
  const percentage = this.completionPercentage;
  
  if (percentage >= 95) return 'A+';
  if (percentage >= 90) return 'A';
  if (percentage >= 85) return 'B+';
  if (percentage >= 80) return 'B';
  if (percentage >= 75) return 'C+';
  if (percentage >= 70) return 'C';
  if (percentage >= 65) return 'D';
  return 'F';
};

// Méthode pour vérifier si le certificat est valide
certificateSchema.methods.isValidCertificate = function() {
  return this.isValid && !this.revokedAt;
};

// Méthode pour révoquer le certificat
certificateSchema.methods.revoke = function(reason) {
  this.isValid = false;
  this.revokedAt = new Date();
  this.revokedReason = reason;
  return this.save();
};

// Méthode pour obtenir les détails complets du certificat
certificateSchema.methods.getFullDetails = async function() {
  await this.populate([
    { path: 'student', select: 'name firstName lastName email' },
    { path: 'course', select: 'title description instructor category level duration' },
    { path: 'enrollment', select: 'enrolledAt completedAt progress' }
  ]);
  
  return {
    _id: this._id,
    id: this._id,
    certificateNumber: this.certificateNumber,
    student: {
      name: this.student.name || `${this.student.firstName} ${this.student.lastName}`,
      email: this.student.email
    },
    course: {
      _id: this.course._id,
      id: this.course._id,
      title: this.course.title,
      description: this.course.description,
      instructor: this.course.instructor,
      category: this.course.category,
      level: this.course.level,
      duration: this.course.duration
    },
    completion: {
      percentage: this.completionPercentage,
      grade: this.grade,
      totalLessons: this.totalLessons,
      completedLessons: this.completedLessons,
      timeSpent: this.timeSpent,
      completedAt: this.completedAt
    },
    certificate: {
      issuedAt: this.issuedAt,
      isValid: this.isValid,
      revokedAt: this.revokedAt,
      revokedReason: this.revokedReason
    }
  };
};

module.exports = mongoose.model('Certificate', certificateSchema);
