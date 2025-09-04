const Course = require('../models/Course');
const { parseDurationToMinutes, formatMinutesToDuration } = require('./durationCalculator');

/**
 * Calcule la durée totale d'un cours basée sur ses modules
 * @param {string} courseId - ID du cours
 * @returns {string} - Durée totale formatée
 */
const calculateCourseDuration = async (courseId) => {
  try {
    // Récupérer le cours avec ses modules
    const course = await Course.findById(courseId).populate('modules');
    
    if (!course || !course.modules || course.modules.length === 0) {
      return '0 heure';
    }
    
    let totalMinutes = 0;
    
    // Parser la durée de chaque module
    course.modules.forEach(module => {
      const duration = module.estimatedDuration || '';
      const minutes = parseDurationToMinutes(duration);
      totalMinutes += minutes;
    });
    
    return formatMinutesToDuration(totalMinutes);
  } catch (error) {
    console.error('Erreur calcul durée cours:', error);
    return '0 heure';
  }
};

/**
 * Met à jour la durée d'un cours
 * @param {string} courseId - ID du cours
 * @returns {Promise<boolean>} - Succès de la mise à jour
 */
const updateCourseDuration = async (courseId) => {
  try {
    const newDuration = await calculateCourseDuration(courseId);
    
    await Course.findByIdAndUpdate(courseId, {
      duration: newDuration
    });
    
    console.log(`Durée du cours ${courseId} mise à jour: ${newDuration}`);
    return true;
  } catch (error) {
    console.error('Erreur mise à jour durée cours:', error);
    return false;
  }
};

module.exports = {
  calculateCourseDuration,
  updateCourseDuration
};


