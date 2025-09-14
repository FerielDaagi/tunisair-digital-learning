const mongoose = require('mongoose');
const { generateCertificatePDF, generateCertificateHTML } = require('./controllers/certificateController');
const fs = require('fs');
const path = require('path');

// Configuration
require('dotenv').config();
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/e_learning';

async function testCertificateDebug() {
  try {
    console.log('🔍 Test de débogage des certificats...');
    
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

    // Test 1: Génération HTML avec gestion d'erreur détaillée
    console.log('\n🔄 Test 1: Génération du certificat HTML...');
    try {
      const htmlContent = await generateCertificateHTML(testData);
      console.log('✅ Certificat HTML généré avec succès');
      
      // Sauvegarder le HTML
      const htmlFilePath = path.join(__dirname, 'test-certificate-debug.html');
      fs.writeFileSync(htmlFilePath, htmlContent);
      console.log('💾 HTML sauvegardé:', htmlFilePath);
      
      // Vérifier le contenu HTML
      if (htmlContent.includes('CERTIFICAT D\'ACCOMPLISSEMENT')) {
        console.log('✅ Titre du certificat trouvé dans le HTML');
      } else {
        console.log('❌ Titre du certificat manquant dans le HTML');
      }
      
    } catch (error) {
      console.error('❌ Erreur lors de la génération HTML:', error.message);
      console.error('Stack trace:', error.stack);
    }

    // Test 2: Génération PDF avec gestion d'erreur détaillée
    console.log('\n🔄 Test 2: Génération du certificat PDF...');
    try {
      const pdfBuffer = await generateCertificatePDF(testData);
      console.log('✅ Certificat PDF généré avec succès, taille:', pdfBuffer.length);
      
      // Sauvegarder le PDF
      const pdfFilePath = path.join(__dirname, 'test-certificate-debug.pdf');
      fs.writeFileSync(pdfFilePath, pdfBuffer);
      console.log('💾 PDF sauvegardé:', pdfFilePath);
      
    } catch (error) {
      console.error('❌ Erreur lors de la génération PDF:', error.message);
      console.error('Stack trace:', error.stack);
    }

    console.log('\n🎉 Tests de débogage terminés !');

  } catch (error) {
    console.error('❌ Erreur générale lors du test:', error);
    console.error('Stack trace:', error.stack);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Déconnecté de MongoDB');
  }
}

// Exécuter le test
testCertificateDebug();
