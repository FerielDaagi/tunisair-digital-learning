const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    console.log('🔍 Tentative de connexion MongoDB avec URI:', process.env.MONGODB_URI);
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB connecté avec succès !');
    
    // Nettoyer les index textuels problématiques au démarrage
    try {
      const Course = require('../models/Course');
      await Course.cleanupTextIndexes();
    } catch (error) {
      console.log('ℹ️ Nettoyage des index déjà effectué ou non nécessaire');
    }
  } catch (error) {
    console.error('❌ Erreur de connexion MongoDB:', error.message);
    console.error('❌ URI utilisée:', process.env.MONGODB_URI);
    console.log('🔄 Tentative de reconnexion dans 5 secondes...');
    // Ne pas faire crasher immédiatement, essayer de se reconnecter
    setTimeout(() => {
      connectDB();
    }, 5000);
  }
};
module.exports = connectDB;
