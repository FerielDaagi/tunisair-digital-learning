const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

async function testFileUploadDebug() {
  try {
    console.log('🧪 Test d\'upload de fichier avec debug...');
    
    // Créer un fichier de test similaire
    const testContent = 'Contenu de test pour le sujet de repassage';
    fs.writeFileSync('sujet de repassage sptembre 2025.pdf', testContent);
    
    // Créer FormData exactement comme le frontend
    const formData = new FormData();
    formData.append('title', 'Test Lesson File');
    formData.append('description', 'Description de test pour leçon de type fichier');
    formData.append('type', 'file');
    formData.append('content', 'Contenu optionnel de la leçon');
    formData.append('duration', '5');
    formData.append('order', '1');
    formData.append('attachments', fs.createReadStream('sujet de repassage sptembre 2025.pdf'), 'sujet de repassage sptembre 2025.pdf');
    formData.append('module', '68af106d628ba56cd9c59a11'); // ID du module de test
    
    console.log('📤 Envoi de la requête d\'upload...');
    console.log('📋 Données envoyées:');
    console.log('  - Title: Test Lesson File');
    console.log('  - Type: file');
    console.log('  - File: sujet de repassage sptembre 2025.pdf');
    console.log('  - Module ID: 68af106d628ba56cd9c59a11');
    
    // Note: Vous devrez remplacer 'YOUR_TOKEN' par un vrai token d'authentification
    const response = await axios.post('http://localhost:5000/api/lessons/module/68af106d628ba56cd9c59a11', formData, {
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
      fs.unlinkSync('sujet de repassage sptembre 2025.pdf');
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
console.log('3. Remplacez YOUR_TOKEN dans ce script');
console.log('4. Exécutez: node test-file-upload-debug.js');
console.log('');

testFileUploadDebug();
