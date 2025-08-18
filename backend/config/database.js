const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    console.log('🔍 Tentative de connexion MongoDB avec URI:', process.env.MONGODB_URI);
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB connecté avec succès !');
  } catch (error) {
    console.error('❌ Erreur de connexion MongoDB:', error.message);
    console.error('❌ URI utilisée:', process.env.MONGODB_URI);
    process.exit(1);
  }
};
module.exports = connectDB;
