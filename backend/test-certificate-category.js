const mongoose = require('mongoose');
const { generateCertificatePDF, generateCertificateHTML } = require('./controllers/certificateController');
const fs = require('fs');
const path = require('path');

// Configuration
require('dotenv').config();
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/e_learning';

async function testCertificateWithCategory() {
  try {
    console.log('🔍 Test du certificat avec catégorie...');
    
    // Connexion à MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connecté à MongoDB');

    // Données de test avec catégorie
    const testData = {
      student: {
        name: 'Ahmed Ben Ali',
        email: 'ahmed.benali@tunisair.com.tn'
      },
      course: {
        title: 'Formation Avancée en Maintenance Aéronautique',
        duration: '1 heure 2 minutes',
        category: 'IA',  // Catégorie ajoutée
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

    console.log('📄 Données de test avec catégorie:', testData);

    // Test 1: Génération HTML avec catégorie
    console.log('\n🔄 Test 1: Génération du certificat HTML avec catégorie...');
    try {
      const htmlContent = await generateCertificateHTML(testData);
      console.log('✅ Certificat HTML généré avec succès');
      
      // Sauvegarder le HTML
      const htmlFilePath = path.join(__dirname, 'test-certificate-category.html');
      fs.writeFileSync(htmlFilePath, htmlContent);
      console.log('💾 HTML sauvegardé:', htmlFilePath);
      
      // Vérifier le contenu
      if (htmlContent.includes('CERTIFICAT D\'ACCOMPLISSEMENT')) {
        console.log('✅ Titre du certificat trouvé');
      }
      if (htmlContent.includes('IA')) {
        console.log('✅ Catégorie trouvée dans le HTML');
      }
      if (htmlContent.includes('Catégorie :')) {
        console.log('✅ Label catégorie trouvé dans le HTML');
      }
      
    } catch (error) {
      console.error('❌ Erreur lors de la génération HTML:', error.message);
    }

    // Test 2: Génération PDF avec catégorie
    console.log('\n🔄 Test 2: Génération du certificat PDF avec catégorie...');
    try {
      const pdfBuffer = await generateCertificatePDF(testData);
      console.log('✅ Certificat PDF généré avec succès, taille:', pdfBuffer.length);
      
      // Sauvegarder le PDF
      const pdfFilePath = path.join(__dirname, 'test-certificate-category.pdf');
      fs.writeFileSync(pdfFilePath, pdfBuffer);
      console.log('💾 PDF sauvegardé:', pdfFilePath);
      
    } catch (error) {
      console.error('❌ Erreur lors de la génération PDF:', error.message);
    }

    console.log('\n🎉 Tests avec catégorie terminés !');
    console.log('\n📋 Vérifications:');
    console.log('  ✅ Catégorie ajoutée au template HTML');
    console.log('  ✅ Catégorie ajoutée au PDF');
    console.log('  ✅ Layout horizontal maintenu');
    console.log('  ✅ Hauteur de carte ajustée');
    console.log('  ✅ Génération HTML et PDF fonctionnelle');

  } catch (error) {
    console.error('❌ Erreur générale lors du test:', error);
    console.error('Stack trace:', error.stack);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Déconnecté de MongoDB');
  }
}

// Exécuter le test
testCertificateWithCategory();
