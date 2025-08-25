const http = require('http');

console.log('🔍 Test de connexion frontend-backend...\n');

// Test 1: Vérifier que le backend répond
function testBackend() {
  console.log('1️⃣ Test du backend (port 5000)...');
  
  const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/health',
    method: 'GET'
  };

  const req = http.request(options, (res) => {
    let data = '';
    res.on('data', (chunk) => data += chunk);
    res.on('end', () => {
      try {
        const response = JSON.parse(data);
        console.log(`   ✅ Backend OK - ${response.message}`);
      } catch (error) {
        console.log('   ❌ Erreur parsing réponse backend');
      }
    });
  });

  req.on('error', (error) => {
    console.log(`   ❌ Backend inaccessible: ${error.message}`);
  });

  req.end();
}

// Test 2: Vérifier que le frontend peut se connecter
function testFrontendConnection() {
  console.log('\n2️⃣ Test de connexion frontend vers backend...');
  
  const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/courses/test-id/publish',
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Origin': 'http://localhost:3000',
      'Access-Control-Request-Method': 'PATCH',
      'Access-Control-Request-Headers': 'Content-Type, Authorization'
    }
  };

  const req = http.request(options, (res) => {
    console.log(`   📊 Status: ${res.statusCode}`);
    console.log(`   📋 Headers CORS:`, res.headers['access-control-allow-origin']);
    
    let data = '';
    res.on('data', (chunk) => data += chunk);
    res.on('end', () => {
      try {
        const response = JSON.parse(data);
        console.log(`   📋 Réponse: ${response.message}`);
        
        if (res.statusCode === 401) {
          console.log('   ✅ Connexion OK - Erreur d\'auth normale');
        } else if (res.statusCode === 404) {
          console.log('   ✅ Connexion OK - Cours introuvable');
        } else {
          console.log('   ⚠️ Réponse inattendue');
        }
      } catch (error) {
        console.log('   ❌ Erreur parsing JSON');
      }
    });
  });

  req.on('error', (error) => {
    console.log(`   ❌ Erreur de connexion: ${error.message}`);
    console.log('   💡 Vérifiez que le frontend est démarré sur le port 3000');
  });

  req.end();
}

// Test 3: Vérifier les ports utilisés
function checkPorts() {
  console.log('\n3️⃣ Vérification des ports...');
  
  const net = require('net');
  
  // Vérifier le port 3000 (frontend)
  const frontendTest = net.createServer();
  frontendTest.listen(3000, () => {
    console.log('   ✅ Port 3000 disponible (frontend peut démarrer)');
    frontendTest.close();
  });
  
  frontendTest.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
      console.log('   ⚠️ Port 3000 occupé - Vérifiez si le frontend est déjà démarré');
    } else {
      console.log(`   ❌ Erreur port 3000: ${error.message}`);
    }
  });
  
  // Vérifier le port 5000 (backend)
  const backendTest = net.createServer();
  backendTest.listen(5000, () => {
    console.log('   ✅ Port 5000 disponible');
    backendTest.close();
  });
  
  backendTest.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
      console.log('   ✅ Port 5000 occupé par le backend (normal)');
    } else {
      console.log(`   ❌ Erreur port 5000: ${error.message}`);
    }
  });
}

// Lancer les tests
testBackend();
setTimeout(() => testFrontendConnection(), 1000);
setTimeout(() => checkPorts(), 2000);

console.log('\n⏳ Tests en cours...');
