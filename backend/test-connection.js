const mongoose = require('mongoose');

// Configuration MongoDB
const options = {
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  retryWrites: true,
  w: 'majority'
};

async function testConnection() {
  try {
    console.log('🔍 Test de connexion MongoDB...');
    console.log('URI:', process.env.MONGODB_URI);
    
    await mongoose.connect(process.env.MONGODB_URI, options);
    console.log('✅ Connexion MongoDB réussie !');
    
    // Test d'une requête simple
    const User = require('./models/User');
    const userCount = await User.countDocuments();
    console.log(`📊 Nombre d'utilisateurs: ${userCount}`);
    
    // Vérifier l'état de la connexion
    console.log('🔗 État de la connexion:', mongoose.connection.readyState);
    console.log('📡 Host:', mongoose.connection.host);
    console.log('🗄️ Database:', mongoose.connection.name);
    
    await mongoose.connection.close();
    console.log('✅ Connexion fermée proprement');
    
  } catch (error) {
    console.error('❌ Erreur de connexion:', error.message);
    process.exit(1);
  }
}

// Charger les variables d'environnement
require('dotenv').config();

testConnection();
