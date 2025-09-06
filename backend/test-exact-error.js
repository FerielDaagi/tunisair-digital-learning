const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

async function testExactError() {
  try {
    console.log('🧪 Test exact pour reproduire l\'erreur 400...');
    
    // Créer un fichier de test avec le même nom
    const testContent = 'Contenu de test pour le sujet de repassage';
    fs.writeFileSync('sujet de repassage sptembre 2025.pdf', testContent);
    
    // Créer FormData exactement comme le frontend
    const formData = new FormData();
    formData.append('title', 'Test Lesson File');
    formData.append('description', 'Description de test');
    formData.append('type', 'file');
    formData.append('content', 'Contenu optionnel');
    formData.append('duration', '5');
    formData.append('order', '1');
    formData.append('attachments', fs.createReadStream('sujet de repassage sptembre 2025.pdf'), 'sujet de repassage sptembre 2025.pdf');
    formData.append('module', '68af106d628ba56cd9c59a11');
    
    console.log('📤 Envoi de la requête exacte...');
    console.log('📋 Données envoyées:');
    console.log('  - Title: Test Lesson File');
    console.log('  - Type: file');
    console.log('  - File: sujet de repassage sptembre 2025.pdf');
    console.log('  - Module ID: 68af106d628ba56cd9c59a11');
    
    // Test SANS authentification pour voir l'erreur exacte
    const response = await axios.post('http://localhost:5000/api/lessons/module/68af106d628ba56cd9c59a11', formData, {
      headers: {
        ...formData.getHeaders()
        // Pas de token pour voir l'erreur d'auth
      },
      timeout: 10000
    });
    
    console.log('✅ Upload réussi!');
    console.log('📄 Status:', response.status);
    console.log('📄 Response:', response.data);
    
  } catch (error) {
    console.error('❌ Erreur attendue:');
    if (error.response) {
      console.error('📄 Status:', error.response.status);
      console.error('📄 Data:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error('📄 Message:', error.message);
    }
  } finally {
    // Nettoyer
    try {
      fs.unlinkSync('sujet de repassage sptembre 2025.pdf');
      console.log('🧹 Fichier de test supprimé');
    } catch (e) {
      // Ignorer si le fichier n'existe pas
    }
  }
}

testExactError();