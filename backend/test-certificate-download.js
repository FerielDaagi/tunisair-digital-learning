const mongoose = require('mongoose');
const Certificate = require('./models/Certificate');
const User = require('./models/User');
const Course = require('./models/Course');
const { generateCertificatePDF } = require('./controllers/certificateController');

// Configuration
require('dotenv').config();
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/e_learning';

async function testCertificateDownload() {
  try {
    console.log('🔍 Test de téléchargement de certificat...');
    
    // Connexion à MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connecté à MongoDB');

    // Trouver un certificat existant
    const certificate = await Certificate.findOne({ isValid: true })
      .populate('student')
      .populate('course');

    if (!certificate) {
      console.log('❌ Aucun certificat trouvé dans la base de données');
      return;
    }

    console.log('📄 Certificat trouvé:', certificate.certificateNumber);
    console.log('👤 Étudiant:', certificate.student.name);
    console.log('📚 Cours:', certificate.course.title);

    // Obtenir les détails complets
    const certificateData = await certificate.getFullDetails();
    console.log('📋 Données du certificat:', JSON.stringify(certificateData, null, 2));

    // Tester la génération PDF
    console.log('🔄 Test de génération PDF...');
    const pdfBuffer = await generateCertificatePDF(certificateData);
    console.log('✅ PDF généré avec succès, taille:', pdfBuffer.length);

    // Sauvegarder le PDF pour test
    const fs = require('fs');
    const path = require('path');
    const testFilePath = path.join(__dirname, 'test-certificate.pdf');
    fs.writeFileSync(testFilePath, pdfBuffer);
    console.log('💾 PDF sauvegardé:', testFilePath);

  } catch (error) {
    console.error('❌ Erreur lors du test:', error);
    console.error('Stack trace:', error.stack);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Déconnecté de MongoDB');
  }
}

// Exécuter le test
testCertificateDownload();
