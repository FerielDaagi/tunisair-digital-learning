const mongoose = require('mongoose');
const { generateCertificatePDF } = require('./controllers/certificateController');

// Configuration
require('dotenv').config();
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/e_learning';

async function testFinalCertificate() {
  try {
    console.log('🔍 Test du certificat final (sans note/progression, signature à droite)...');
    
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
        title: 'Formation Avancée en Maintenance Aéronautique',
        duration: '80 heures',
        category: 'Aéronautique',
        level: 'Expert'
      },
      completion: {
        percentage: 100,
        grade: 'A+',
        totalLessons: 25,
        completedLessons: 25,
        timeSpent: 80
      },
      certificate: {
        issuedAt: new Date(),
        isValid: true
      },
      certificateNumber: 'CERT-TUNISAIR-2024-001'
    };

    console.log('📄 Données de test:', testData);

    // Générer le PDF avec le design final
    console.log('🔄 Génération du PDF final...');
    const pdfBuffer = await generateCertificatePDF(testData);
    console.log('✅ PDF généré avec succès, taille:', pdfBuffer.length);

    // Sauvegarder le PDF pour test
    const fs = require('fs');
    const path = require('path');
    const testFilePath = path.join(__dirname, 'test-certificate-final.pdf');
    fs.writeFileSync(testFilePath, pdfBuffer);
    console.log('💾 PDF sauvegardé:', testFilePath);

    console.log('🎉 Test terminé avec succès !');
    console.log('📁 Ouvrez le fichier test-certificate-final.pdf pour voir le certificat final');
    console.log('');
    console.log('✅ Corrections apportées :');
    console.log('  - Suppression de la note et de la progression');
    console.log('  - Signature et cachet repositionnés à droite');
    console.log('  - Date à gauche, signature à droite (côte à côte)');
    console.log('  - Bordures ajustées pour éviter le débordement');
    console.log('  - Tailles de police réduites pour un meilleur ajustement');

  } catch (error) {
    console.error('❌ Erreur lors du test:', error);
    console.error('Stack trace:', error.stack);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Déconnecté de MongoDB');
  }
}

// Exécuter le test
testFinalCertificate();
