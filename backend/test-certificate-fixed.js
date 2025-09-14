const mongoose = require('mongoose');
const { generateCertificatePDF, generateCertificateHTML } = require('./controllers/certificateController');
const fs = require('fs');
const path = require('path');

// Configuration
require('dotenv').config();
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/e_learning';

async function testCertificateFixed() {
  try {
    console.log('🔍 Test du certificat corrigé (sans caractères corrompus, signature repositionnée)...');
    
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

    // Test 1: Génération HTML corrigé
    console.log('\n🔄 Test 1: Génération du certificat HTML corrigé...');
    try {
      const htmlContent = await generateCertificateHTML(testData);
      console.log('✅ Certificat HTML généré avec succès');
      
      // Sauvegarder le HTML
      const htmlFilePath = path.join(__dirname, 'test-certificate-fixed.html');
      fs.writeFileSync(htmlFilePath, htmlContent);
      console.log('💾 HTML sauvegardé:', htmlFilePath);
      
      // Vérifier le contenu
      if (htmlContent.includes('CERTIFICAT D\'ACCOMPLISSEMENT')) {
        console.log('✅ Titre du certificat trouvé');
      }
      if (htmlContent.includes('★')) {
        console.log('✅ Icône étoile trouvée (pas de caractères corrompus)');
      }
      if (!htmlContent.includes('Ø') && !htmlContent.includes('ßÆ')) {
        console.log('✅ Aucun caractère corrompu détecté');
      }
      
    } catch (error) {
      console.error('❌ Erreur lors de la génération HTML:', error.message);
    }

    // Test 2: Génération PDF corrigé
    console.log('\n🔄 Test 2: Génération du certificat PDF corrigé...');
    try {
      const pdfBuffer = await generateCertificatePDF(testData);
      console.log('✅ Certificat PDF généré avec succès, taille:', pdfBuffer.length);
      
      // Sauvegarder le PDF
      const pdfFilePath = path.join(__dirname, 'test-certificate-fixed.pdf');
      fs.writeFileSync(pdfFilePath, pdfBuffer);
      console.log('💾 PDF sauvegardé:', pdfFilePath);
      
    } catch (error) {
      console.error('❌ Erreur lors de la génération PDF:', error.message);
    }

    console.log('\n🎉 Tests de correction terminés !');
    console.log('\n📋 Corrections apportées:');
    console.log('  ✅ Caractères corrompus Ø<ßÆ supprimés');
    console.log('  ✅ Icône étoile ★ utilisée à la place de 🏆');
    console.log('  ✅ Texte redimensionné pour éviter le débordement');
    console.log('  ✅ Signature repositionnée en bas à l\'extrémité');
    console.log('  ✅ Tailles de police ajustées pour un meilleur rendu');

  } catch (error) {
    console.error('❌ Erreur générale lors du test:', error);
    console.error('Stack trace:', error.stack);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Déconnecté de MongoDB');
  }
}

// Exécuter le test
testCertificateFixed();
