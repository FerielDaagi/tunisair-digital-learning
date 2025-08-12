const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB connecté !');
  } catch (error) {
    console.log('❌ Erreur:', error.message);
  }
};
module.exports = connectDB;
