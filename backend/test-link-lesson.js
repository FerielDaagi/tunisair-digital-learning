const axios = require('axios');

async function testLinkLesson() {
  try {
    console.log('🧪 Test de création de leçon de type lien...');
    
    const lessonData = {
      title: 'Test Lesson Link',
      description: 'Description de test pour leçon de type lien',
      content: 'Contenu optionnel de la leçon',
      duration: 5,
      order: 1,
      type: 'link',
      linkUrl: 'https://www.example.com'
    };
    
    console.log('📤 Envoi de la requête JSON...');
    console.log('📋 Données:', lessonData);
    
    // Note: Vous devrez remplacer 'YOUR_TOKEN' par un vrai token d'authentification
    const response = await axios.post('http://localhost:5000/api/lessons/module/YOUR_MODULE_ID', lessonData, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer YOUR_TOKEN' // Remplacez par un vrai token
      },
      timeout: 10000
    });
    
    console.log('✅ Leçon créée avec succès!');
    console.log('📄 Status:', response.status);
    console.log('📄 Response:', response.data);
    
  } catch (error) {
    console.error('❌ Erreur lors de la création:');
    if (error.response) {
      console.error('📄 Status:', error.response.status);
      console.error('📄 Data:', error.response.data);
    } else {
      console.error('📄 Message:', error.message);
    }
  }
}

// Instructions d'utilisation
console.log('📋 Instructions pour tester:');
console.log('1. Démarrez le serveur: node server.js');
console.log('2. Obtenez un token d\'authentification valide');
console.log('3. Remplacez YOUR_TOKEN et YOUR_MODULE_ID dans ce script');
console.log('4. Exécutez: node test-link-lesson.js');
console.log('');

testLinkLesson();
