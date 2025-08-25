const http = require('http');

console.log('🧪 Test simple de la route des modules...\n');

// Test de la route GET /api/modules/course/:courseId
function testModulesRoute() {
  const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/modules/course/68abbe763bbb581ccb822323',
    method: 'GET'
  };

  const req = http.request(options, (res) => {
    console.log(`📚 Test GET /api/modules/course/:courseId`);
    console.log(`   Statut: ${res.statusCode}`);
    console.log(`   Headers: ${JSON.stringify(res.headers, null, 2)}`);
    
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      console.log(`   Réponse: ${data}`);
      
      if (res.statusCode === 401) {
        console.log('✅ Route protégée - authentification requise (normal)');
      } else if (res.statusCode === 200) {
        console.log('✅ Route accessible');
      } else {
        console.log(`⚠️ Statut inattendu: ${res.statusCode}`);
      }
    });
  });

  req.on('error', (e) => {
    console.error('❌ Erreur de connexion:', e.message);
  });

  req.end();
}

// Test de la route POST /api/modules/course/:courseId
function testCreateModuleRoute() {
  const moduleData = JSON.stringify({
    title: 'Test Module',
    description: 'Test Description',
    order: 1
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
    console.log(`\n📤 Test POST /api/modules/course/:courseId`);
    console.log(`   Statut: ${res.statusCode}`);
    
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      console.log(`   Réponse: ${data}`);
      
      if (res.statusCode === 401) {
        console.log('✅ Route protégée - authentification requise (normal)');
      } else if (res.statusCode === 200) {
        console.log('✅ Module créé avec succès');
      } else {
        console.log(`⚠️ Statut inattendu: ${res.statusCode}`);
      }
    });
  });

  req.on('error', (e) => {
    console.error('❌ Erreur de connexion:', e.message);
  });

  req.write(moduleData);
  req.end();
}

// Exécuter les tests
console.log('🔍 Test de la route GET...');
testModulesRoute();

setTimeout(() => {
  console.log('\n🔍 Test de la route POST...');
  testCreateModuleRoute();
}, 1000);

console.log('\n⏳ Tests en cours...');

