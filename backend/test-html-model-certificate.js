const mongoose = require('mongoose');
const { generateCertificatePDF } = require('./controllers/certificateController');

// Configuration
require('dotenv').config();
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/e_learning';

async function testHtmlModelCertificate() {
  try {
    console.log('🔍 Test du certificat basé sur le modèle HTML...');
    
    // Connexion à MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connecté à MongoDB');

    // Créer des données de test identiques au modèle HTML
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

    console.log('📄 Données de test (basées sur le modèle HTML):', testData);

    // Générer le PDF avec le design basé sur le modèle HTML
    console.log('🔄 Génération du PDF basé sur le modèle HTML...');
    const pdfBuffer = await generateCertificatePDF(testData);
    console.log('✅ PDF généré avec succès, taille:', pdfBuffer.length);

    // Sauvegarder le PDF pour test
    const fs = require('fs');
    const path = require('path');
    const testFilePath = path.join(__dirname, 'test-certificate-html-model.pdf');
    fs.writeFileSync(testFilePath, pdfBuffer);
    console.log('💾 PDF sauvegardé:', testFilePath);

    console.log('🎉 Test terminé avec succès !');
    console.log('📁 Ouvrez le fichier test-certificate-html-model.pdf pour voir le certificat');
    console.log('');
    console.log('✅ Caractéristiques du nouveau design (basé sur le modèle HTML):');
    console.log('  - Format vertical (portrait)');
    console.log('  - Bordure double bleue');
    console.log('  - Mise en page verticale comme le HTML');
    console.log('  - Labels en gras bleu, valeurs en bleu');
    console.log('  - Titre de formation en bleu');
    console.log('  - Numéro de certificat en bas à droite');
    console.log('  - Structure identique au modèle HTML fourni');

  } catch (error) {
    console.error('❌ Erreur lors du test:', error);
    console.error('Stack trace:', error.stack);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Déconnecté de MongoDB');
  }
}

// Exécuter le test
testHtmlModelCertificate();
