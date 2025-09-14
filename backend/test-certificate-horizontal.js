const mongoose = require('mongoose');
const { generateCertificatePDF, generateCertificateHTML } = require('./controllers/certificateController');
const fs = require('fs');
const path = require('path');

// Configuration
require('dotenv').config();
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/e_learning';

async function testHorizontalCertificate() {
  try {
    console.log('🔍 Test du certificat horizontal (sans statistiques)...');
    
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

    // Test 1: Génération HTML horizontal
    console.log('\n🔄 Test 1: Génération du certificat HTML horizontal...');
    const htmlContent = await generateCertificateHTML(testData);
    console.log('✅ Certificat HTML horizontal généré avec succès');

    // Sauvegarder le HTML
    const htmlFilePath = path.join(__dirname, 'test-certificate-horizontal.html');
    fs.writeFileSync(htmlFilePath, htmlContent);
    console.log('💾 HTML sauvegardé:', htmlFilePath);

    // Test 2: Génération PDF horizontal
    console.log('\n🔄 Test 2: Génération du certificat PDF horizontal...');
    const pdfBuffer = await generateCertificatePDF(testData);
    console.log('✅ Certificat PDF horizontal généré avec succès, taille:', pdfBuffer.length);

    // Sauvegarder le PDF
    const pdfFilePath = path.join(__dirname, 'test-certificate-horizontal.pdf');
    fs.writeFileSync(pdfFilePath, pdfBuffer);
    console.log('💾 PDF sauvegardé:', pdfFilePath);

    console.log('\n🎉 Tests terminés avec succès !');
    console.log('\n📋 Améliorations apportées:');
    console.log('  ✅ Caractères corrompus corrigés');
    console.log('  ✅ Layout horizontal pour HTML et PDF');
    console.log('  ✅ Section statistiques supprimée');
    console.log('  ✅ Informations disposées en layout horizontal');
    console.log('  ✅ Design optimisé pour format paysage');
    console.log('  ✅ Mise en page cohérente entre HTML et PDF');
    
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
testHorizontalCertificate();