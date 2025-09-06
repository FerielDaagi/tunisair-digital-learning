const mongoose = require('mongoose');

const lessonSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Le titre de la leçon est requis'],
    trim: true,
    maxlength: [100, 'Le titre ne peut pas dépasser 100 caractères']
  },
  description: {
    type: String,
    required: [true, 'La description de la leçon est requise'],
    trim: true
  },
  content: {
    type: String,
    required: function() {
      // Le contenu est requis seulement pour le type 'text'
      return this.type === 'text';
    },
    default: ''
  },
  duration: {
    type: String,
    required: [true, 'La durée de la leçon est requise']
  },
  order: {
    type: Number,
    required: [true, 'L\'ordre de la leçon est requis'],
    min: 1
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: [true, 'Le cours est requis']
  },
  module: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Module',
    required: false, // Made optional to handle existing lessons without module field
    default: null
  },
  type: {
    type: String,
    enum: ['video', 'text', 'link', 'file', 'quiz', 'assignment', 'interactive'],
    default: 'text'
  },
  videoUrl: {
    type: String,
    default: null
  },
  linkUrl: {
    type: String,
    default: null
  },
  attachments: [{
    filename: {
      type: String,
      required: true
    },
    originalName: {
      type: String,
      required: true
    },
    path: {
      type: String,
      required: true
    },
    size: {
      type: Number,
      required: true
    },
    mimeType: {
      type: String,
      required: true
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  isPublished: {
    type: Boolean,
    default: false
  },
  isFree: {
    type: Boolean,
    default: false
  },
  prerequisites: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lesson'
  }],
  tags: [{
    type: String,
    trim: true
  }],
  difficulty: {
    type: String,
    enum: ['facile', 'moyen', 'difficile'],
    default: 'moyen'
  }
}, {
  timestamps: true
});

// Index pour la recherche
lessonSchema.index({ title: 'text', description: 'text', content: 'text' });

// Index pour les performances et la validation d'ordre
lessonSchema.index({ module: 1, order: 1 });

// Middleware pour valider l'ordre unique dans un module
lessonSchema.pre('save', async function(next) {
  if (this.isModified('order') || this.isModified('module')) {
    const existingLesson = await this.constructor.findOne({
      module: this.module,
      order: this.order,
      _id: { $ne: this._id }
    });
    
    if (existingLesson) {
      return next(new Error('Une leçon avec cet ordre existe déjà dans ce module'));
    }
  }
  next();
});

// Index pour les performances
lessonSchema.index({ course: 1, module: 1, order: 1 });
lessonSchema.index({ isPublished: 1, course: 1 });

// Middleware pour valider l'ordre unique dans un module
lessonSchema.pre('save', async function(next) {
  if (this.isModified('order') || this.isModified('module')) {
    const existingLesson = await this.constructor.findOne({
      course: this.course,
      module: this.module,
      order: this.order,
      _id: { $ne: this._id }
    });
    
    if (existingLesson) {
      return next(new Error('Une leçon avec cet ordre existe déjà dans ce module'));
    }
  }
  next();
});

module.exports = mongoose.model('Lesson', lessonSchema);
