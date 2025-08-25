const axios = require('axios');

const API_BASE = 'http://localhost:5000/api';
const COURSE_ID = '68abbe763bbb581ccb822323';

// Test de création d'un module
async function testCreateModule() {
  try {
    console.log('🧪 Test de création de module...\n');

    const moduleData = {
      title: 'Module de test',
      description: 'Ceci est un module de test pour vérifier l\'API',
      order: 5,
      estimatedDuration: '1 heure',
      objectives: ['Tester l\'API', 'Vérifier la création'],
      resources: [
        {
          title: 'Document de test',
          type: 'pdf',
          url: '/test/document.pdf',
          description: 'Document de test pour le module'
        }
      ]
    };

    console.log('📤 Envoi de la requête de création...');
    console.log('Données:', JSON.stringify(moduleData, null, 2));

    const response = await axios.post(`${API_BASE}/modules/course/${COURSE_ID}`, moduleData);
    
    if (response.data.success) {
      console.log('✅ Module créé avec succès !');
      console.log('ID du module:', response.data.data._id);
      console.log('Titre:', response.data.data.title);
      console.log('Ordre:', response.data.data.order);
    } else {
      console.log('❌ Échec de la création:', response.data.message);
    }

  } catch (error) {
    console.error('❌ Erreur lors du test:', error.response?.data || error.message);
    
    if (error.response?.status === 401) {
      console.log('💡 Conseil: Vérifiez que vous êtes authentifié');
    } else if (error.response?.status === 404) {
      console.log('💡 Conseil: Vérifiez que le cours existe');
    }
  }
}

// Test de récupération des modules
async function testGetModules() {
  try {
    console.log('\n📚 Test de récupération des modules...\n');

    const response = await axios.get(`${API_BASE}/modules/course/${COURSE_ID}`);
    
    if (response.data.success) {
      console.log(`✅ ${response.data.data.length} modules récupérés`);
      response.data.data.forEach((module, index) => {
        console.log(`${index + 1}. ${module.title} (Ordre: ${module.order})`);
      });
    } else {
      console.log('❌ Échec de la récupération:', response.data.message);
    }

  } catch (error) {
    console.error('❌ Erreur lors de la récupération:', error.response?.data || error.message);
  }
}

// Exécuter les tests
async function runTests() {
  console.log('🚀 Démarrage des tests de l\'API modules...\n');
  
  await testCreateModule();
  await testGetModules();
  
  console.log('\n🎉 Tests terminés !');
}

runTests();
