const mongoose = require('mongoose');

const moduleSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Le titre du module est requis'],
    trim: true,
    maxlength: [100, 'Le titre ne peut pas dépasser 100 caractères']
  },
  description: {
    type: String,
    required: [true, 'La description du module est requise'],
    trim: true
  },
  order: {
    type: Number,
    required: [true, 'L\'ordre du module est requis'],
    min: 1
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: [true, 'Le cours est requis']
  },
  lessons: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lesson'
  }],
  isPublished: {
    type: Boolean,
    default: false
  },
  estimatedDuration: {
    type: String,
    default: '0 heure'
  },
  objectives: [{
    type: String,
    trim: true
  }],
  resources: [{
    title: {
      type: String,
      required: true,
      trim: true
    },
    type: {
      type: String,
      enum: ['pdf', 'video', 'link', 'document'],
      required: true
    },
    url: {
      type: String,
      required: true
    },
    description: {
      type: String,
      trim: true
    }
  }]
}, {
  timestamps: true
});

// Index pour les performances
moduleSchema.index({ course: 1, order: 1 });
moduleSchema.index({ isPublished: 1, course: 1 });

// Middleware pour valider l'ordre unique dans un cours
moduleSchema.pre('save', async function(next) {
  if (this.isModified('order') || this.isModified('course')) {
    const existingModule = await this.constructor.findOne({
      course: this.course,
      order: this.order,
      _id: { $ne: this._id }
    });
    
    if (existingModule) {
      return next(new Error('Un module avec cet ordre existe déjà dans ce cours'));
    }
  }
  next();
});

module.exports = mongoose.model('Module', moduleSchema);
