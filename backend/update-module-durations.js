const mongoose = require('mongoose');
const Module = require('./models/Module');
const { updateModuleDuration } = require('./utils/durationCalculator');
require('dotenv').config();

// Configuration MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/e_learning';

async function updateAllModuleDurations() {
  try {
    console.log('🔌 Connexion à MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connecté à MongoDB');

    // Récupérer tous les modules
    console.log('\n🔍 Récupération de tous les modules...');
    const modules = await Module.find({});
    
    if (modules.length === 0) {
      console.log('❌ Aucun module trouvé');
      return;
    }

    console.log(`✅ ${modules.length} modules trouvés`);

    let updatedCount = 0;
    let errorCount = 0;

    // Mettre à jour la durée de chaque module
    for (const module of modules) {
      try {
        console.log(`\n📚 Mise à jour du module: ${module.title}`);
        
        const success = await updateModuleDuration(module._id);
        
        if (success) {
          console.log(`✅ Durée mise à jour pour: ${module.title}`);
          updatedCount++;
        } else {
          console.log(`❌ Erreur lors de la mise à jour: ${module.title}`);
          errorCount++;
        }
      } catch (error) {
        console.error(`❌ Erreur pour le module ${module.title}:`, error.message);
        errorCount++;
      }
    }

    // Afficher le résumé
    console.log('\n📊 Résumé:');
    console.log(`- Modules traités: ${modules.length}`);
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
updateAllModuleDurations();






