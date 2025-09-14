const mongoose = require('mongoose');
const Certificate = require('./models/Certificate');
const User = require('./models/User');
const Course = require('./models/Course');
const Enrollment = require('./models/Enrollment');
const Progress = require('./models/Progress');
const { forceCreateCertificate } = require('./controllers/certificateController');

// Configuration
require('dotenv').config();
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/e_learning';

async function testCertificateCreation() {
  try {
    console.log('🔍 Test de création de certificat...');
    
    // Connexion à MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connecté à MongoDB');

    // Trouver un utilisateur et un cours
    const user = await User.findOne({ role: 'apprenti' });
    const course = await Course.findOne({ status: 'published' });

    if (!user || !course) {
      console.log('❌ Utilisateur ou cours non trouvé');
      return;
    }

    console.log('👤 Utilisateur:', user.name);
    console.log('📚 Cours:', course.title);

    // Vérifier l'enrollment
    const enrollment = await Enrollment.findOne({
      student: user._id,
      course: course._id
    });

    if (!enrollment) {
      console.log('❌ L\'utilisateur n\'est pas inscrit au cours');
      return;
    }

    console.log('📊 Progression actuelle:', enrollment.progress);

    // Vérifier les enregistrements de progression
    const progressRecords = await Progress.find({
      student: user._id,
      course: course._id
    });

    console.log('📋 Enregistrements de progression:', progressRecords.length);
    console.log('✅ Leçons complétées:', progressRecords.filter(p => p.status === 'completed').length);

    // Simuler une requête pour créer un certificat
    const mockReq = {
      params: { courseId: course._id },
      user: { id: user._id }
    };

    const mockRes = {
      status: (code) => ({
        json: (data) => {
          console.log(`📤 Réponse ${code}:`, data);
        }
      }),
      json: (data) => {
        console.log('📤 Réponse:', data);
      }
    };

    console.log('🔄 Tentative de création de certificat...');
    await forceCreateCertificate(mockReq, mockRes);

  } catch (error) {
    console.error('❌ Erreur lors du test:', error);
    console.error('Stack trace:', error.stack);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Déconnecté de MongoDB');
  }
}

// Exécuter le test
testCertificateCreation();
