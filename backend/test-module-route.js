const http = require('http');

console.log('🧪 Test de la route POST des modules...\n');

// Test de la route POST /api/modules/course/:courseId
function testPostModuleRoute() {
  const moduleData = JSON.stringify({
    title: 'Module de test',
    description: 'Description de test',
    order: 1,
    course: '68ab9b8184dff1577465b1b0'
  });

  const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/modules/course/68ab9b8184dff1577465b1b0',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(moduleData)
    }
  };

  const req = http.request(options, (res) => {
    console.log(`📤 Test POST /api/modules/course/:courseId`);
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
        console.log('✅ Module créé avec succès');
      } else if (res.statusCode === 404) {
        console.log('❌ Route non trouvée');
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

// Test de la route GET pour vérifier qu'elle existe
function testGetModuleRoute() {
  const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/modules/course/68ab9b8184dff1577465b1b0',
    method: 'GET'
  };

  const req = http.request(options, (res) => {
    console.log(`\n📚 Test GET /api/modules/course/:courseId`);
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

// Exécuter les tests
console.log('🔍 Test de la route GET...');
testGetModuleRoute();

setTimeout(() => {
  console.log('\n🔍 Test de la route POST...');
  testPostModuleRoute();
}, 1000);

console.log('\n⏳ Tests en cours...');

