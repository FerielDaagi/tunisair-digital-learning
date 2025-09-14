const mongoose = require('mongoose');

const enrollmentSchema = new mongoose.Schema({
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
  enrolledAt: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'paused', 'dropped'],
    default: 'active'
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
  lastAccessedAt: {
    type: Date,
    default: Date.now
  },
  completedAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Index pour éviter les doublons
enrollmentSchema.index({ student: 1, course: 1 }, { unique: true });

// Méthode pour calculer le progrès
enrollmentSchema.methods.calculateProgress = async function() {
  const Course = mongoose.model('Course');
  const course = await Course.findById(this.course).populate('modules.lessons');
  
  if (!course) return 0;
  
  let totalLessons = 0;
  let completedLessons = 0;
  
  // Compter toutes les leçons dans tous les modules
  course.modules.forEach(module => {
    if (module.lessons && module.lessons.length > 0) {
      totalLessons += module.lessons.length;
      module.lessons.forEach(lesson => {
        if (this.completedLessons.includes(lesson._id)) {
          completedLessons++;
        }
      });
    }
  });
  
  if (totalLessons === 0) return 0;
  
  const progress = Math.round((completedLessons / totalLessons) * 100);
  this.progress = progress;
  
  // Marquer comme complété si 100%
  if (progress === 100 && this.status === 'active') {
    this.status = 'completed';
    this.completedAt = new Date();
  }
  
  await this.save();
  return progress;
};

// Méthode pour marquer une leçon comme complétée
enrollmentSchema.methods.markLessonCompleted = async function(lessonId) {
  if (!this.completedLessons.includes(lessonId)) {
    this.completedLessons.push(lessonId);
    this.lastAccessedAt = new Date();
    await this.calculateProgress();
  }
};

// Méthode pour marquer une leçon comme non complétée
enrollmentSchema.methods.markLessonIncomplete = async function(lessonId) {
  this.completedLessons = this.completedLessons.filter(id => !id.equals(lessonId));
  this.lastAccessedAt = new Date();
  await this.calculateProgress();
};

module.exports = mongoose.model('Enrollment', enrollmentSchema);
