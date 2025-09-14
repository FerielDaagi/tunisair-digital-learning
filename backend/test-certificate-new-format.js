const mongoose = require('mongoose');
const { generateCertificatePDF } = require('./controllers/certificateController');
const fs = require('fs');
const path = require('path');

// Configuration de la base de données
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/e_learning';

async function testCertificateNewFormat() {
  try {
    console.log('🔄 Connexion à la base de données...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connecté à MongoDB');

    // Données de test basées sur le modèle HTML fourni
    const testCertificateData = {
      certificateNumber: 'CERT-MFJYBQWZ-ANNTW',
      student: {
        name: 'd',
        email: 'dd@gmail.com'
      },
      course: {
        title: 'X X',
        duration: 1.03 // 1 heure 2 minutes en format décimal
      },
      completion: {
        percentage: 100,
        grade: 'A+'
      }
    };

    console.log('🔄 Génération du certificat PDF avec le nouveau format...');
    console.log('📄 Données de test:', testCertificateData);

    // Générer le PDF
    const pdfBuffer = await generateCertificatePDF(testCertificateData);
    console.log('✅ PDF généré avec succès, taille:', pdfBuffer.length, 'bytes');

    // Sauvegarder le PDF pour inspection
    const outputPath = path.join(__dirname, 'test-certificate-new-format.pdf');
    fs.writeFileSync(outputPath, pdfBuffer);
    console.log('💾 PDF sauvegardé:', outputPath);

    console.log('✅ Test terminé avec succès !');
    console.log('📋 Le certificat généré devrait correspondre exactement au modèle HTML fourni');

  } catch (error) {
    console.error('❌ Erreur lors du test:', error);
    console.error('Stack trace:', error.stack);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Déconnecté de MongoDB');
  }
}

// Exécuter le test
testCertificateNewFormat();
