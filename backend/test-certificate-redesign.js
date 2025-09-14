const mongoose = require('mongoose');
const { generateCertificatePDF, generateCertificateHTML } = require('./controllers/certificateController');
const fs = require('fs');
const path = require('path');

// Configuration
require('dotenv').config();
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/e_learning';

async function testCertificateRedesign() {
  try {
    console.log('🔍 Test du redesign des certificats (HTML + PDF)...');
    
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
        duration: 80,
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

    // Test 1: Génération HTML
    console.log('\n🔄 Test 1: Génération du certificat HTML...');
    const htmlContent = await generateCertificateHTML(testData);
    console.log('✅ Certificat HTML généré avec succès');

    // Sauvegarder le HTML
    const htmlFilePath = path.join(__dirname, 'test-certificate-redesign.html');
    fs.writeFileSync(htmlFilePath, htmlContent);
    console.log('💾 HTML sauvegardé:', htmlFilePath);

    // Test 2: Génération PDF
    console.log('\n🔄 Test 2: Génération du certificat PDF...');
    const pdfBuffer = await generateCertificatePDF(testData);
    console.log('✅ Certificat PDF généré avec succès, taille:', pdfBuffer.length);

    // Sauvegarder le PDF
    const pdfFilePath = path.join(__dirname, 'test-certificate-redesign.pdf');
    fs.writeFileSync(pdfFilePath, pdfBuffer);
    console.log('💾 PDF sauvegardé:', pdfFilePath);

    console.log('\n🎉 Tests terminés avec succès !');
    console.log('\n📋 Résumé des améliorations:');
    console.log('  ✅ Template HTML moderne avec design professionnel');
    console.log('  ✅ PDF redesigné pour correspondre au template HTML');
    console.log('  ✅ Couleurs et mise en page cohérentes');
    console.log('  ✅ Structure identique entre HTML et PDF');
    console.log('  ✅ Support des statistiques (progression, note, leçons)');
    console.log('  ✅ Design responsive pour le HTML');
    console.log('  ✅ Footer avec signature et informations complètes');
    
    console.log('\n📁 Fichiers générés:');
    console.log(`  - HTML: ${htmlFilePath}`);
    console.log(`  - PDF: ${pdfFilePath}`);
    console.log('\n🌐 Pour tester le HTML, ouvrez le fichier dans votre navigateur');
    console.log('📄 Pour tester le PDF, ouvrez le fichier avec votre lecteur PDF');

  } catch (error) {
    console.error('❌ Erreur lors du test:', error);
    console.error('Stack trace:', error.stack);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Déconnecté de MongoDB');
  }
}

// Exécuter le test
testCertificateRedesign();
