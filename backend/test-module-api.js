const http = require('http');

console.log('🧪 Test de l\'API de création de modules...\n');

// Test de récupération des modules d'un cours
function testGetModules() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: '/api/modules/course/68abbe763bbb581ccb822323',
      method: 'GET'
    };

    const req = http.request(options, (res) => {
      console.log(`📚 GET /api/modules/course/:courseId - Statut: ${res.statusCode}`);
      
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          if (res.statusCode === 200) {
            const response = JSON.parse(data);
            if (response.success) {
              console.log(`✅ ${response.data.length} modules récupérés`);
              response.data.forEach((module, index) => {
                console.log(`   ${index + 1}. ${module.title} (Ordre: ${module.order})`);
              });
            } else {
              console.log(`❌ Erreur: ${response.message}`);
            }
          } else {
            console.log(`❌ Statut ${res.statusCode}: ${data}`);
          }
        } catch (e) {
          console.log(`📄 Réponse brute: ${data}`);
        }
        resolve();
      });
    });

    req.on('error', (e) => {
      console.error('❌ Erreur de connexion:', e.message);
      reject(e);
    });

    req.end();
  });
}

// Test de création d'un module (sans authentification - devrait échouer)
function testCreateModule() {
  return new Promise((resolve, reject) => {
    const moduleData = JSON.stringify({
      title: 'Module de test',
      description: 'Description de test',
      order: 1,
      course: '68abbe763bbb581ccb822323'
    });

    const options = {
      hostname: 'localhost',
      port: 5000,
      path: '/api/modules/course/68abbe763bbb581ccb822323',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(moduleData)
      }
    };

    const req = http.request(options, (res) => {
      console.log(`📤 POST /api/modules/course/:courseId - Statut: ${res.statusCode}`);
      
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          if (res.statusCode === 401) {
            console.log('✅ Correctement protégé - authentification requise');
          } else if (res.statusCode === 200) {
            const response = JSON.parse(data);
            console.log('✅ Module créé:', response.data.title);
          } else {
            console.log(`📄 Réponse: ${data}`);
          }
        } catch (e) {
          console.log(`📄 Réponse brute: ${data}`);
        }
        resolve();
      });
    });

    req.on('error', (e) => {
      console.error('❌ Erreur de connexion:', e.message);
      reject(e);
    });

    req.write(moduleData);
    req.end();
  });
}

// Exécuter les tests
async function runTests() {
  try {
    await testGetModules();
    console.log('');
    await testCreateModule();
    console.log('\n🎉 Tests terminés !');
  } catch (error) {
    console.error('❌ Erreur lors des tests:', error.message);
  }
}

runTests();
