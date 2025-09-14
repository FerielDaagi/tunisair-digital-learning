const mongoose = require('mongoose');
const Course = require('./models/Course');
const { updateCourseDuration } = require('./utils/courseDurationCalculator');
require('dotenv').config();

// Configuration MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/e_learning';

async function updateAllCourseDurations() {
  try {
    console.log('🔌 Connexion à MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connecté à MongoDB');

    // Récupérer tous les cours
    console.log('\n🔍 Récupération de tous les cours...');
    const courses = await Course.find({});
    
    if (courses.length === 0) {
      console.log('❌ Aucun cours trouvé');
      return;
    }

    console.log(`✅ ${courses.length} cours trouvés`);

    let updatedCount = 0;
    let errorCount = 0;

    // Mettre à jour la durée de chaque cours
    for (const course of courses) {
      try {
        console.log(`\n📚 Mise à jour du cours: ${course.title}`);
        
        const success = await updateCourseDuration(course._id);
        
        if (success) {
          console.log(`✅ Durée mise à jour pour: ${course.title}`);
          updatedCount++;
        } else {
          console.log(`❌ Erreur lors de la mise à jour: ${course.title}`);
          errorCount++;
        }
      } catch (error) {
        console.error(`❌ Erreur pour le cours ${course.title}:`, error.message);
        errorCount++;
      }
    }

    // Afficher le résumé
    console.log('\n📊 Résumé:');
    console.log(`- Cours traités: ${courses.length}`);
    console.log(`- Mises à jour réussies: ${updatedCount}`);
    console.log(`- Erreurs: ${errorCount}`);

    console.log('\n🎉 Opération terminée !');

  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Déconnecté de MongoDB');
  }
}

// Exécuter le script
updateAllCourseDurations();











