const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Le titre du cours est requis'],
    trim: true,
    maxlength: [100, 'Le titre ne peut pas dépasser 100 caractères']
  },
  description: {
    type: String,
    required: [true, 'La description du cours est requise'],
    trim: true,
    maxlength: [500, 'La description ne peut pas dépasser 500 caractères']
  },
  longDescription: {
    type: String,
    required: [true, 'La description détaillée du cours est requise'],
    trim: true
  },
  instructor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'L\'instructeur est requis']
  },
  category: {
    type: mongoose.Schema.Types.Mixed, // Peut être String ou ObjectId
    required: [true, 'La catégorie est requise'],
    validate: {
      validator: function(v) {
        // Accepter soit une String soit un ObjectId
        return typeof v === 'string' || mongoose.Types.ObjectId.isValid(v);
      },
      message: 'La catégorie doit être une chaîne de caractères ou un ID valide'
    }
  },
  level: {
    type: String,
    enum: ['débutant', 'intermédiaire', 'avancé'],
    required: [true, 'Le niveau est requis']
  },
  duration: {
    type: String,
    required: [true, 'La durée est requise']
  },
  price: {
    type: Number,
    default: 0,
    min: [0, 'Le prix ne peut pas être négatif']
  },
  thumbnail: {
    type: String,
    default: null
  },
  status: {
    type: String,
    enum: ['draft', 'published', 'archived'],
    default: 'draft'
  },
  isPublished: {
    type: Boolean,
    default: false
  },
  publishedAt: {
    type: Date
  },
  requirements: [{
    type: String,
    trim: true
  }],
  outcomes: [{
    type: String,
    trim: true
  }],
  modules: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Module'
  }],
  enrolledStudents: [{
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    enrolledAt: {
      type: Date,
      default: Date.now
    },
    progress: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    completedLessons: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Lesson'
    }],
    lastAccessed: {
      type: Date,
      default: Date.now
    }
  }],
  rating: {
    average: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    count: {
      type: Number,
      default: 0
    },
    reviews: [{
      student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5
      },
      comment: {
        type: String,
        trim: true
      },
      createdAt: {
        type: Date,
        default: Date.now
      }
    }]
  },
  tags: [{
    type: String,
    trim: true
  }],
  language: {
    type: String,
    default: 'français',
    enum: ['français', 'english']
  }
}, {
  timestamps: true
});

// Index pour les performances
courseSchema.index({ instructor: 1, status: 1 });
courseSchema.index({ category: 1, level: 1 });
courseSchema.index({ isPublished: 1, status: 1 });

// Fonction pour nettoyer les index textuels problématiques
courseSchema.statics.cleanupTextIndexes = async function() {
  try {
    const indexes = await this.collection.listIndexes().toArray();
    
    for (const index of indexes) {
      if (index.key && Object.values(index.key).some(val => val === 'text')) {
        console.log(`🗑️ Suppression de l'index textuel: ${index.name}`);
        await this.collection.dropIndex(index.name);
      }
    }
    
    console.log('✅ Tous les index textuels ont été supprimés');
  } catch (error) {
    console.log('ℹ️ Aucun index textuel à supprimer ou erreur:', error.message);
  }
};

// Méthode pour calculer le nombre d'étudiants inscrits
courseSchema.virtual('studentCount').get(function() {
  return this.enrolledStudents.length;
});

// Méthode pour calculer la durée totale en heures
courseSchema.virtual('totalDuration').get(function() {
  if (!this.modules || this.modules.length === 0) return '0 heure';
  
  let totalMinutes = 0;
  this.modules.forEach(module => {
    const duration = module.duration;
    if (duration.includes('heure')) {
      totalMinutes += parseInt(duration) * 60;
    } else if (duration.includes('minute')) {
      totalMinutes += parseInt(duration);
    }
  });
  
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  
  if (hours === 0) return `${minutes} minute${minutes > 1 ? 's' : ''}`;
  if (minutes === 0) return `${hours} heure${hours > 1 ? 's' : ''}`;
  return `${hours} heure${hours > 1 ? 's' : ''} ${minutes} minute${minutes > 1 ? 's' : ''}`;
});

// Middleware pour mettre à jour publishedAt
courseSchema.pre('save', function(next) {
  if (this.isModified('status') && this.status === 'published' && !this.publishedAt) {
    this.publishedAt = new Date();
    this.isPublished = true;
  }
  next();
});

module.exports = mongoose.model('Course', courseSchema);
