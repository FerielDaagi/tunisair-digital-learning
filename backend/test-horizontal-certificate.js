const mongoose = require('mongoose');
const { generateCertificatePDF } = require('./controllers/certificateController');

// Configuration
require('dotenv').config();
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/e_learning';

async function testHorizontalCertificate() {
  try {
    console.log('🔍 Test du certificat horizontal...');
    
    // Connexion à MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connecté à MongoDB');

    // Créer des données de test avec plus de détails
    const testData = {
      student: {
        name: 'Ahmed Ben Ali',
        email: 'ahmed.benali@tunisair.com.tn'
      },
      course: {
        title: 'Formation Avancée en Maintenance Aéronautique et Gestion de la Sécurité',
        duration: '80 heures',
        category: 'Aéronautique',
        level: 'Expert'
      },
      completion: {
        percentage: 98,
        grade: 'A+',
        totalLessons: 25,
        completedLessons: 24,
        timeSpent: 78
      },
      certificate: {
        issuedAt: new Date(),
        isValid: true
      },
      certificateNumber: 'CERT-TUNISAIR-2024-001'
    };

    console.log('📄 Données de test:', testData);

    // Générer le PDF avec le nouveau design horizontal
    console.log('🔄 Génération du PDF horizontal...');
    const pdfBuffer = await generateCertificatePDF(testData);
    console.log('✅ PDF généré avec succès, taille:', pdfBuffer.length);

    // Sauvegarder le PDF pour test
    const fs = require('fs');
    const path = require('path');
    const testFilePath = path.join(__dirname, 'test-certificate-horizontal.pdf');
    fs.writeFileSync(testFilePath, pdfBuffer);
    console.log('💾 PDF sauvegardé:', testFilePath);

    console.log('🎉 Test terminé avec succès !');
    console.log('📁 Ouvrez le fichier test-certificate-horizontal.pdf pour voir le nouveau design horizontal');

  } catch (error) {
    console.error('❌ Erreur lors du test:', error);
    console.error('Stack trace:', error.stack);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Déconnecté de MongoDB');
  }
}

// Exécuter le test
testHorizontalCertificate();
