const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

async function testUpload() {
  try {
    console.log('🧪 Test d\'upload de fichier...');
    
    // Créer un fichier de test
    fs.writeFileSync('test-file.txt', 'Contenu de test pour l\'upload');
    
    // Créer FormData
    const formData = new FormData();
    formData.append('title', 'Test Lesson');
    formData.append('description', 'Description de test');
    formData.append('type', 'file');
    formData.append('content', 'Contenu de test');
    formData.append('attachments', fs.createReadStream('test-file.txt'));
    formData.append('module', 'test-module-id');
    
    console.log('📤 Envoi de la requête...');
    
    const response = await axios.post('http://localhost:5000/api/lessons/module/test-module-id', formData, {
      headers: {
        ...formData.getHeaders(),
        'Authorization': 'Bearer test-token' // Token de test
      },
      timeout: 10000
    });
    
    console.log('✅ Réponse reçue:', response.status);
    console.log('📄 Données:', response.data);
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    if (error.response) {
      console.error('📄 Status:', error.response.status);
      console.error('📄 Data:', error.response.data);
    }
  } finally {
    // Nettoyer
    try {
      fs.unlinkSync('test-file.txt');
    } catch (e) {
      // Ignorer si le fichier n'existe pas
    }
  }
}

testUpload();

