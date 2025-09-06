const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

async function testFileUpload() {
  try {
    console.log('🧪 Test d\'upload de fichier pour leçons...');
    
    // Créer un fichier de test
    const testContent = 'Contenu de test pour l\'upload de leçon de type fichier';
    fs.writeFileSync('test-lesson-file.txt', testContent);
    
    // Créer FormData
    const formData = new FormData();
    formData.append('title', 'Test Lesson File');
    formData.append('description', 'Description de test pour leçon de type fichier');
    formData.append('type', 'file');
    formData.append('content', 'Contenu optionnel de la leçon');
    formData.append('duration', '5');
    formData.append('order', '1');
    formData.append('attachments', fs.createReadStream('test-lesson-file.txt'), 'test-lesson-file.txt');
    
    console.log('📤 Envoi de la requête d\'upload...');
    console.log('📋 Données envoyées:');
    console.log('  - Title: Test Lesson File');
    console.log('  - Type: file');
    console.log('  - File: test-lesson-file.txt');
    
    // Note: Vous devrez remplacer 'YOUR_TOKEN' par un vrai token d'authentification
    const response = await axios.post('http://localhost:5000/api/lessons/module/YOUR_MODULE_ID', formData, {
      headers: {
        ...formData.getHeaders(),
        'Authorization': 'Bearer YOUR_TOKEN' // Remplacez par un vrai token
      },
      timeout: 30000
    });
    
    console.log('✅ Upload réussi!');
    console.log('📄 Status:', response.status);
    console.log('📄 Response:', response.data);
    
  } catch (error) {
    console.error('❌ Erreur lors de l\'upload:');
    if (error.response) {
      console.error('📄 Status:', error.response.status);
      console.error('📄 Data:', error.response.data);
    } else {
      console.error('📄 Message:', error.message);
    }
  } finally {
    // Nettoyer
    try {
      fs.unlinkSync('test-lesson-file.txt');
      console.log('🧹 Fichier de test supprimé');
    } catch (e) {
      // Ignorer si le fichier n'existe pas
    }
  }
}

// Instructions d'utilisation
console.log('📋 Instructions pour tester:');
console.log('1. Démarrez le serveur: node server.js');
console.log('2. Obtenez un token d\'authentification valide');
console.log('3. Remplacez YOUR_TOKEN et YOUR_MODULE_ID dans ce script');
console.log('4. Exécutez: node test-file-upload.js');
console.log('');

testFileUpload();