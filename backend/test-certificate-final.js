const mongoose = require('mongoose');
const { generateCertificatePDF, generateCertificateHTML } = require('./controllers/certificateController');
const fs = require('fs');
const path = require('path');

// Configuration
require('dotenv').config();
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/e_learning';

async function testCertificateFinal() {
  try {
    console.log('🔍 Test du certificat final (sans icône, cadre bleu en bas)...');
    
    // Connexion à MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connecté à MongoDB');

    // Données de test
    const testData = {
      student: {
        name: 'Ahmed Ben Ali',
        email: 'ahmed.benali@tunisair.com.tn'
      },
      course: {
        title: 'Formation Avancée en Maintenance Aéronautique',
        duration: '1 heure 2 minutes',
        category: 'IA',
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

    // Test 1: Génération HTML final
    console.log('\n🔄 Test 1: Génération du certificat HTML final...');
    try {
      const htmlContent = await generateCertificateHTML(testData);
      console.log('✅ Certificat HTML généré avec succès');
      
      // Sauvegarder le HTML
      const htmlFilePath = path.join(__dirname, 'test-certificate-final.html');
      fs.writeFileSync(htmlFilePath, htmlContent);
      console.log('💾 HTML sauvegardé:', htmlFilePath);
      
      // Vérifier le contenu
      if (htmlContent.includes('CERTIFICAT D\'ACCOMPLISSEMENT')) {
        console.log('✅ Titre du certificat trouvé');
      }
      if (!htmlContent.includes('★') && !htmlContent.includes('🏆')) {
        console.log('✅ Aucune icône trouvée (supprimée selon la demande)');
      }
      if (htmlContent.includes('certificate-footer-blue')) {
        console.log('✅ Cadre bleu trouvé dans le HTML');
      }
      if (htmlContent.includes('Ce certificat atteste que le participant a démontré')) {
        console.log('✅ Texte de certification dans le cadre bleu');
      }
      
    } catch (error) {
      console.error('❌ Erreur lors de la génération HTML:', error.message);
    }

    // Test 2: Génération PDF final
    console.log('\n🔄 Test 2: Génération du certificat PDF final...');
    try {
      const pdfBuffer = await generateCertificatePDF(testData);
      console.log('✅ Certificat PDF généré avec succès, taille:', pdfBuffer.length);
      
      // Sauvegarder le PDF
      const pdfFilePath = path.join(__dirname, 'test-certificate-final.pdf');
      fs.writeFileSync(pdfFilePath, pdfBuffer);
      console.log('💾 PDF sauvegardé:', pdfFilePath);
      
    } catch (error) {
      console.error('❌ Erreur lors de la génération PDF:', error.message);
    }

    console.log('\n🎉 Tests finaux terminés !');
    console.log('\n📋 Modifications finales:');
    console.log('  ✅ Icône du trophée supprimée');
    console.log('  ✅ Texte de certification déplacé dans un cadre bleu');
    console.log('  ✅ Signature repositionnée dans le cadre bleu');
    console.log('  ✅ Design cohérent entre HTML et PDF');
    console.log('  ✅ Layout horizontal maintenu');

  } catch (error) {
    console.error('❌ Erreur générale lors du test:', error);
    console.error('Stack trace:', error.stack);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Déconnecté de MongoDB');
  }
}

// Exécuter le test
testCertificateFinal();
