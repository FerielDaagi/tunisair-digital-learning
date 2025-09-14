const mongoose = require('mongoose');
const Certificate = require('./models/Certificate');
const User = require('./models/User');
const Course = require('./models/Course');
const { generateCertificatePDF } = require('./controllers/certificateController');

// Configuration
require('dotenv').config();
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/e_learning';

async function testCertificateDownloadNew() {
  try {
    console.log('🔍 Test de téléchargement avec le nouveau design...');
    
    // Connexion à MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connecté à MongoDB');

    // Trouver un certificat existant ou en créer un de test
    let certificate = await Certificate.findOne({ isValid: true })
      .populate('student')
      .populate('course');

    if (!certificate) {
      console.log('📝 Création d\'un certificat de test...');
      
      // Trouver un utilisateur et un cours
      const user = await User.findOne({ role: 'apprenti' });
      const course = await Course.findOne({ status: 'published' });

      if (!user || !course) {
        console.log('❌ Utilisateur ou cours non trouvé');
        return;
      }

      // Créer un certificat de test
      certificate = new Certificate({
        student: user._id,
        course: course._id,
        enrollment: new mongoose.Types.ObjectId(),
        certificateNumber: Certificate.generateCertificateNumber(),
        completedAt: new Date(),
        completionPercentage: 95,
        totalLessons: 20,
        completedLessons: 19,
        timeSpent: 40
      });

      certificate.grade = certificate.calculateGrade();
      await certificate.save();
      
      // Populate les données
      await certificate.populate('student');
      await certificate.populate('course');
    }

    console.log('📄 Certificat trouvé:', certificate.certificateNumber);
    console.log('👤 Étudiant:', certificate.student.name);
    console.log('📚 Cours:', certificate.course.title);

    // Obtenir les détails complets
    const certificateData = await certificate.getFullDetails();
    console.log('📋 Données du certificat:', JSON.stringify(certificateData, null, 2));

    // Tester la génération PDF avec le nouveau design
    console.log('🔄 Test de génération PDF avec le nouveau design Tunisair...');
    const pdfBuffer = await generateCertificatePDF(certificateData);
    console.log('✅ PDF généré avec succès, taille:', pdfBuffer.length);

    // Sauvegarder le PDF pour test
    const fs = require('fs');
    const path = require('path');
    const testFilePath = path.join(__dirname, 'test-certificate-tunisair-final.pdf');
    fs.writeFileSync(testFilePath, pdfBuffer);
    console.log('💾 PDF sauvegardé:', testFilePath);

    console.log('🎉 Test terminé avec succès !');
    console.log('📁 Ouvrez le fichier test-certificate-tunisair-final.pdf pour voir le nouveau design');

  } catch (error) {
    console.error('❌ Erreur lors du test:', error);
    console.error('Stack trace:', error.stack);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Déconnecté de MongoDB');
  }
}

// Exécuter le test
testCertificateDownloadNew();
