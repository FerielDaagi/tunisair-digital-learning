const mongoose = require('mongoose');
const { generateCertificatePDF } = require('./controllers/certificateController');

// Configuration
require('dotenv').config();
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/e_learning';

async function testExactHtmlModel() {
  try {
    console.log('🔍 Test du certificat exactement comme le modèle HTML...');
    
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

    console.log('📄 Données de test (identiques au modèle HTML):', testData);

    // Générer le PDF avec le design exact du modèle HTML
    console.log('🔄 Génération du PDF basé sur le modèle HTML exact...');
    const pdfBuffer = await generateCertificatePDF(testData);
    console.log('✅ PDF généré avec succès, taille:', pdfBuffer.length);

    // Sauvegarder le PDF pour test
    const fs = require('fs');
    const path = require('path');
    const testFilePath = path.join(__dirname, 'test-certificate-exact-html.pdf');
    fs.writeFileSync(testFilePath, pdfBuffer);
    console.log('💾 PDF sauvegardé:', testFilePath);

    console.log('🎉 Test terminé avec succès !');
    console.log('📁 Ouvrez le fichier test-certificate-exact-html.pdf pour voir le certificat');
    console.log('');
    console.log('✅ Structure du certificat (identique au modèle HTML):');
    console.log('  - En-tête: "CERTIFICAT D\'ACCOMPLISSEMENT" (32px, bleu)');
    console.log('  - Sous-titre: "Centre de Formation Tunisair" (20px, rouge)');
    console.log('  - "Nous certifions que :"');
    console.log('  - "Monsieur / Madame : [Nom]" (label en gras bleu)');
    console.log('  - "E-mail : [Email]" (label en gras bleu)');
    console.log('  - "A suivi avec succès la formation :"');
    console.log('  - "« [Titre] »" (en bleu)');
    console.log('  - "Durée : [Heures]" (label en gras bleu)');
    console.log('  - "Progression : [%]" (label en gras bleu)');
    console.log('  - "Note : [Grade]" (label en gras bleu)');
    console.log('  - Texte de certification');
    console.log('  - "Fait à Tunis, le [Date]" (en gras)');
    console.log('  - "Signature et cachet"');
    console.log('  - "Le Responsable du Centre de Formation" (italique)');
    console.log('  - Numéro de certificat (en bas à droite)');

  } catch (error) {
    console.error('❌ Erreur lors du test:', error);
    console.error('Stack trace:', error.stack);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Déconnecté de MongoDB');
  }
}

// Exécuter le test
testExactHtmlModel();
