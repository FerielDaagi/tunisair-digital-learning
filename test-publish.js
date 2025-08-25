const http = require('http');

// Test de l'endpoint de publication
function testPublishEndpoint() {
  console.log('🧪 Test de l\'endpoint de publication...');
  
  const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/courses/test-id/publish',
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer test-token'
    }
  };

  const req = http.request(options, (res) => {
    console.log(`📊 Status: ${res.statusCode}`);
    
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      try {
        const response = JSON.parse(data);
        console.log('📋 Réponse du serveur:', response);
        
        if (res.statusCode === 401) {
          console.log('✅ Endpoint accessible - Erreur d\'authentification normale');
        } else if (res.statusCode === 404) {
          console.log('✅ Endpoint accessible - Cours introuvable (normal)');
        } else {
          console.log('⚠️ Réponse inattendue du serveur');
        }
      } catch (error) {
        console.log('❌ Erreur parsing JSON:', error.message);
        console.log('📄 Réponse brute:', data);
      }
    });
  });

  req.on('error', (error) => {
    console.log('❌ Erreur de connexion:', error.message);
  });

  req.end();
}

// Test de l'endpoint de création de cours
function testCreateEndpoint() {
  console.log('\n🧪 Test de l\'endpoint de création de cours...');
  
  const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/courses',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer test-token'
    }
  };

  const req = http.request(options, (res) => {
    console.log(`📊 Status: ${res.statusCode}`);
    
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      try {
        const response = JSON.parse(data);
        console.log('📋 Réponse du serveur:', response);
        
        if (res.statusCode === 401) {
          console.log('✅ Endpoint accessible - Erreur d\'authentification normale');
        } else {
          console.log('⚠️ Réponse inattendue du serveur');
        }
      } catch (error) {
        console.log('❌ Erreur parsing JSON:', error.message);
        console.log('📄 Réponse brute:', data);
      }
    });
  });

  req.on('error', (error) => {
    console.log('❌ Erreur de connexion:', error.message);
  });

  req.end();
}

// Lancer les tests
console.log('🚀 Diagnostic des endpoints de cours...\n');
testPublishEndpoint();
testCreateEndpoint();
