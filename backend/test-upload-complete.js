const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

async function testUpload() {
  try {
    console.log('🧪 Test d\'upload de fichier complet...');
    
    // Créer un fichier de test
    fs.writeFileSync('test-file.txt', 'Contenu de test pour l\'upload de leçon');
    
    // D'abord, essayer de se connecter sans authentification pour voir l'erreur
    console.log('📤 Test 1: Upload sans authentification...');
    try {
      const formData = new FormData();
      formData.append('title', 'Test Lesson');
      formData.append('description', 'Description de test');
      formData.append('type', 'file');
      formData.append('content', 'Contenu de test');
      formData.append('attachments', fs.createReadStream('test-file.txt'));
      formData.append('module', 'test-module-id');
      
      const response = await axios.post('http://localhost:5000/api/lessons/module/test-module-id', formData, {
        headers: {
          ...formData.getHeaders()
        },
        timeout: 10000
      });
      
      console.log('✅ Réponse reçue:', response.status);
      console.log('📄 Données:', response.data);
      
    } catch (error) {
      console.log('❌ Erreur attendue (pas d\'auth):', error.response?.status, error.response?.data?.message || error.message);
    }
    
    // Test 2: Vérifier que le serveur répond
    console.log('\n📤 Test 2: Vérification du serveur...');
    try {
      const healthResponse = await axios.get('http://localhost:5000/api/health');
      console.log('✅ Serveur accessible:', healthResponse.status);
      console.log('📄 Health:', healthResponse.data);
    } catch (error) {
      console.log('❌ Serveur non accessible:', error.message);
      return;
    }
    
    // Test 3: Test avec un token factice pour voir la réponse d'erreur
    console.log('\n📤 Test 3: Upload avec token factice...');
    try {
      const formData = new FormData();
      formData.append('title', 'Test Lesson');
      formData.append('description', 'Description de test');
      formData.append('type', 'file');
      formData.append('content', 'Contenu de test');
      formData.append('attachments', fs.createReadStream('test-file.txt'));
      formData.append('module', 'test-module-id');
      
      const response = await axios.post('http://localhost:5000/api/lessons/module/test-module-id', formData, {
        headers: {
          ...formData.getHeaders(),
          'Authorization': 'Bearer fake-token'
        },
        timeout: 10000
      });
      
      console.log('✅ Réponse reçue:', response.status);
      console.log('📄 Données:', response.data);
      
    } catch (error) {
      console.log('❌ Erreur auth:', error.response?.status, error.response?.data?.message || error.message);
    }
    
  } catch (error) {
    console.error('❌ Erreur générale:', error.message);
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
