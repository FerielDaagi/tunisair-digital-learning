const mongoose = require('mongoose');

// Variable pour éviter les tentatives multiples de connexion
let isConnecting = false;
let isConnected = false;

const connectDB = async () => {
  // Éviter les tentatives multiples de connexion
  if (isConnecting || isConnected) {
    console.log('🔄 Connexion MongoDB déjà en cours ou établie');
    return;
  }

  isConnecting = true;

  try {
    console.log('🔍 Tentative de connexion MongoDB avec URI:', process.env.MONGODB_URI);
    
    // Configuration MongoDB avec options de stabilité
    const options = {
      maxPoolSize: 10, // Maintenir jusqu'à 10 connexions dans le pool
      serverSelectionTimeoutMS: 5000, // Timeout de 5 secondes pour sélectionner un serveur
      socketTimeoutMS: 45000, // Timeout de 45 secondes pour les opérations socket
      retryWrites: true,
      w: 'majority'
    };
    
    await mongoose.connect(process.env.MONGODB_URI, options);
    console.log('✅ MongoDB connecté avec succès !');
    isConnected = true;
    isConnecting = false;
    
    // Gestion des événements de connexion MongoDB
    mongoose.connection.on('connected', () => {
      console.log('🔗 MongoDB connecté');
      isConnected = true;
    });
    
    mongoose.connection.on('error', (err) => {
      console.error('❌ Erreur MongoDB:', err);
      isConnected = false;
    });
    
    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️ MongoDB déconnecté - Tentative de reconnexion...');
      isConnected = false;
      // Reconnexion automatique après 5 secondes
      setTimeout(() => {
        if (!isConnected && !isConnecting) {
          connectDB().catch(console.error);
        }
      }, 5000);
    });
    
    // Gestion de la fermeture propre
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      console.log('🔌 Connexion MongoDB fermée proprement');
      process.exit(0);
    });
    
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
    isConnecting = false;
    isConnected = false;
    
    // Ne pas faire process.exit(1) immédiatement, laisser le serveur essayer de se reconnecter
    console.log('🔄 Tentative de reconnexion dans 10 secondes...');
    setTimeout(() => {
      if (!isConnected && !isConnecting) {
        connectDB().catch(console.error);
      }
    }, 10000);
  }
};
module.exports = connectDB;
