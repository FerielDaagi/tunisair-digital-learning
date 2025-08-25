const http = require('http');

console.log('🧪 Test détaillé de création de module...\n');

// Test avec différentes structures de données
function testModuleCreation() {
  console.log('📤 Test 1: Données minimales');
  testWithData({
    title: 'Module Test 1',
    description: 'Description test',
    order: 1,
    course: '68ab9b8184dff1577465b1b0'
  });

  setTimeout(() => {
    console.log('\n📤 Test 2: Données complètes');
    testWithData({
      title: 'Module Test 2',
      description: 'Description complète du module',
      order: 2,
      course: '68ab9b8184dff1577465b1b0',
      estimatedDuration: '2 heures',
      objectives: ['Objectif 1', 'Objectif 2'],
      resources: [],
      isPublished: false
    });
  }, 1000);

  setTimeout(() => {
    console.log('\n📤 Test 3: Données avec champs optionnels');
    testWithData({
      title: 'Module Test 3',
      description: 'Description avec champs optionnels',
      order: 3,
      course: '68ab9b8184dff1577465b1b0',
      isPublished: true
    });
  }, 2000);
}

function testWithData(moduleData) {
  const data = JSON.stringify(moduleData);
  
  console.log(`   Données: ${JSON.stringify(moduleData, null, 2)}`);

  const options = {
    hostname: 'localhost',
    port: 5000,
    path: `/api/modules/course/${moduleData.course}`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(data)
    }
  };

  const req = http.request(options, (res) => {
    console.log(`   Statut: ${res.statusCode}`);
    
    let responseData = '';
    res.on('data', (chunk) => {
      responseData += chunk;
    });
    
    res.on('end', () => {
      try {
        const parsed = JSON.parse(responseData);
        console.log(`   Réponse: ${JSON.stringify(parsed, null, 2)}`);
        
        if (res.statusCode === 201 || res.statusCode === 200) {
          console.log('   ✅ Succès');
        } else if (res.statusCode === 400) {
          console.log('   ❌ Erreur de validation');
        } else if (res.statusCode === 401) {
          console.log('   ❌ Non authentifié');
        } else if (res.statusCode === 500) {
          console.log('   ❌ Erreur serveur');
          console.log('   💡 Vérifiez les logs du serveur backend');
        }
      } catch (e) {
        console.log(`   ⚠️ Réponse non-JSON: ${responseData}`);
      }
    });
  });

  req.on('error', (e) => {
    console.error('   ❌ Erreur requête:', e.message);
  });

  req.write(data);
  req.end();
}

// Test de connexion d'abord
console.log('🔍 Test de connexion au serveur...');
const testOptions = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/courses',
  method: 'GET'
};

const testReq = http.request(testOptions, (res) => {
  console.log(`📡 Serveur accessible: ${res.statusCode}`);
  
  if (res.statusCode === 200 || res.statusCode === 401) {
    console.log('✅ Serveur fonctionne, test des modules...\n');
    testModuleCreation();
  } else {
    console.log('❌ Problème avec le serveur');
  }
});

testReq.on('error', (e) => {
  console.error('❌ Erreur connexion serveur:', e.message);
});

testReq.end();
