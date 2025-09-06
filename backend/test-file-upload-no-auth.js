const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

async function testFileUploadNoAuth() {
  try {
    console.log('🧪 Test d\'upload de fichier SANS authentification...');
    
    // Créer un fichier de test
    const testContent = 'Contenu de test pour le sujet de repassage';
    fs.writeFileSync('test-file.pdf', testContent);
    
    // Créer FormData
    const formData = new FormData();
    formData.append('title', 'Test Lesson File');
    formData.append('description', 'Description de test');
    formData.append('type', 'file');
    formData.append('content', 'Contenu optionnel');
    formData.append('duration', '5');
    formData.append('order', '1');
    formData.append('attachments', fs.createReadStream('test-file.pdf'), 'test-file.pdf');
    formData.append('module', '68af106d628ba56cd9c59a11');
    
    console.log('📤 Envoi de la requête SANS token...');
    
    const response = await axios.post('http://localhost:5000/api/lessons/module/68af106d628ba56cd9c59a11', formData, {
      headers: {
        ...formData.getHeaders()
        // Pas de token d'authentification
      },
      timeout: 10000
    });
    
    console.log('✅ Upload réussi!');
    console.log('📄 Status:', response.status);
    console.log('📄 Response:', response.data);
    
  } catch (error) {
    console.error('❌ Erreur attendue (pas d\'auth):');
    if (error.response) {
      console.error('📄 Status:', error.response.status);
      console.error('📄 Data:', error.response.data);
    } else {
      console.error('📄 Message:', error.message);
    }
  } finally {
    // Nettoyer
    try {
      fs.unlinkSync('test-file.pdf');
    } catch (e) {
      // Ignorer si le fichier n'existe pas
    }
  }
}

testFileUploadNoAuth();

