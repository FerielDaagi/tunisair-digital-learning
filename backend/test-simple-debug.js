const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

async function testSimpleDebug() {
  try {
    console.log('🧪 Test simple pour debug...');
    
    // Créer un fichier de test
    fs.writeFileSync('test-debug.pdf', 'Test content');
    
    // Créer FormData
    const formData = new FormData();
    formData.append('title', 'Test Debug');
    formData.append('description', 'Test Description');
    formData.append('type', 'file');
    formData.append('content', 'Test content');
    formData.append('duration', '5');
    formData.append('order', '1');
    formData.append('attachments', fs.createReadStream('test-debug.pdf'), 'test-debug.pdf');
    formData.append('module', '68af106d628ba56cd9c59a11');
    
    console.log('📤 Envoi de la requête...');
    
    const response = await axios.post('http://localhost:5000/api/lessons/module/68af106d628ba56cd9c59a11', formData, {
      headers: {
        ...formData.getHeaders()
        // Pas de token pour voir l'erreur d'auth
      },
      timeout: 10000
    });
    
    console.log('✅ Succès!');
    console.log('📄 Response:', response.data);
    
  } catch (error) {
    console.error('❌ Erreur:');
    if (error.response) {
      console.error('📄 Status:', error.response.status);
      console.error('📄 Data:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error('📄 Message:', error.message);
    }
  } finally {
    try {
      fs.unlinkSync('test-debug.pdf');
    } catch (e) {}
  }
}

testSimpleDebug();

