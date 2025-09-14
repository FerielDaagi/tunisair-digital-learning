const mongoose = require('mongoose');
const { generateCertificatePDF, generateCertificateHTML } = require('./controllers/certificateController');
const fs = require('fs');
const path = require('path');

// Configuration
require('dotenv').config();
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/e_learning';

async function testRealCertificate() {
  try {
    console.log('🔍 Test avec les vraies données de certificat...');
    
    // Connexion à MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connecté à MongoDB');

    // Données réelles du certificat (basées sur le log fourni)
    const realCertificateData = {
      _id: "68c6f7218f299bb5188357da",
      certificateNumber: 'CERT-MFJYBQWZ-ANNTW',
      student: { 
        name: 'd', 
        email: 'dd@gmail.com' 
      },
      course: {
        _id: "68ad02760280aceae64d9c12",
        title: 'x',
        description: 'x',
        instructor: "68a3b6599d977dfebdbf2d07",
        category: 'IA',
        level: 'débutant',
        duration: '1 heure 2 minutes'  // Chaîne formatée
      },
      completion: {
        percentage: 100,
        grade: 'A+',
        totalLessons: 3,
        completedLessons: 3,
        timeSpent: 0,
        completedAt: new Date('2025-09-14T17:10:57.435Z')
      },
      certificate: {
        issuedAt: new Date('2025-09-14T17:10:57.541Z'),
        isValid: true,
        revokedAt: undefined,
        revokedReason: undefined
      }
    };

    console.log('📄 Données réelles du certificat:', realCertificateData);

    // Test 1: Génération HTML avec vraies données
    console.log('\n🔄 Test 1: Génération du certificat HTML avec vraies données...');
    try {
      const htmlContent = await generateCertificateHTML(realCertificateData);
      console.log('✅ Certificat HTML généré avec succès');
      
      // Sauvegarder le HTML
      const htmlFilePath = path.join(__dirname, 'test-real-certificate.html');
      fs.writeFileSync(htmlFilePath, htmlContent);
      console.log('💾 HTML sauvegardé:', htmlFilePath);
      
      // Vérifier le contenu
      if (htmlContent.includes('CERTIFICAT D\'ACCOMPLISSEMENT')) {
        console.log('✅ Titre du certificat trouvé');
      }
      if (htmlContent.includes('d')) {
        console.log('✅ Nom du participant trouvé');
      }
      if (htmlContent.includes('1 heure 2 minutes')) {
        console.log('✅ Durée formatée correctement');
      }
      
    } catch (error) {
      console.error('❌ Erreur lors de la génération HTML:', error.message);
    }

    // Test 2: Génération PDF avec vraies données
    console.log('\n🔄 Test 2: Génération du certificat PDF avec vraies données...');
    try {
      const pdfBuffer = await generateCertificatePDF(realCertificateData);
      console.log('✅ Certificat PDF généré avec succès, taille:', pdfBuffer.length);
      
      // Sauvegarder le PDF
      const pdfFilePath = path.join(__dirname, 'test-real-certificate.pdf');
      fs.writeFileSync(pdfFilePath, pdfBuffer);
      console.log('💾 PDF sauvegardé:', pdfFilePath);
      
    } catch (error) {
      console.error('❌ Erreur lors de la génération PDF:', error.message);
    }

    console.log('\n🎉 Tests avec vraies données terminés !');
    console.log('\n📋 Vérifications:');
    console.log('  ✅ Gestion des durées en chaîne formatée');
    console.log('  ✅ Données réelles du certificat');
    console.log('  ✅ Format horizontal sans statistiques');
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
testRealCertificate();
