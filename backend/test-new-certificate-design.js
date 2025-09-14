const mongoose = require('mongoose');
const Certificate = require('./models/Certificate');
const User = require('./models/User');
const Course = require('./models/Course');
const { generateCertificatePDF } = require('./controllers/certificateController');

// Configuration
require('dotenv').config();
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/e_learning';

async function testNewCertificateDesign() {
  try {
    console.log('🔍 Test du nouveau design de certificat...');
    
    // Connexion à MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connecté à MongoDB');

    // Créer des données de test
    const testData = {
      student: {
        name: 'Ahmed Ben Ali',
        email: 'ahmed.benali@tunisair.com.tn'
      },
      course: {
        title: 'Formation en Maintenance Aéronautique',
        duration: '40 heures',
        category: 'Aéronautique',
        level: 'Avancé'
      },
      completion: {
        percentage: 95,
        grade: 'A+',
        totalLessons: 20,
        completedLessons: 19,
        timeSpent: 38
      },
      certificate: {
        issuedAt: new Date(),
        isValid: true
      },
      certificateNumber: 'CERT-TUNISAIR-2024-001'
    };

    console.log('📄 Données de test:', testData);

    // Générer le PDF avec le nouveau design
    console.log('🔄 Génération du PDF avec le nouveau design...');
    const pdfBuffer = await generateCertificatePDF(testData);
    console.log('✅ PDF généré avec succès, taille:', pdfBuffer.length);

    // Sauvegarder le PDF pour test
    const fs = require('fs');
    const path = require('path');
    const testFilePath = path.join(__dirname, 'test-certificate-tunisair.pdf');
    fs.writeFileSync(testFilePath, pdfBuffer);
    console.log('💾 PDF sauvegardé:', testFilePath);

    console.log('🎉 Test terminé avec succès !');
    console.log('📁 Ouvrez le fichier test-certificate-tunisair.pdf pour voir le nouveau design');

  } catch (error) {
    console.error('❌ Erreur lors du test:', error);
    console.error('Stack trace:', error.stack);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Déconnecté de MongoDB');
  }
}

// Exécuter le test
testNewCertificateDesign();
