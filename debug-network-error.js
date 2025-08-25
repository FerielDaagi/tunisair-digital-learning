const http = require('http');
const https = require('https');

console.log('🔍 Débogage de l\'erreur Network Error...\n');

// Test 1: Vérifier la connectivité réseau de base
function testBasicConnectivity() {
  console.log('1️⃣ Test de connectivité réseau de base...');
  
  // Test localhost
  const req = http.request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/health',
    method: 'GET',
    timeout: 5000
  }, (res) => {
    console.log('   ✅ Connectivité locale OK');
  });

  req.on('error', (error) => {
    console.log(`   ❌ Erreur connectivité locale: ${error.message}`);
    console.log(`   🔍 Code d'erreur: ${error.code}`);
  });

  req.on('timeout', () => {
    console.log('   ⏰ Timeout de la requête');
    req.destroy();
  });

  req.end();
}

// Test 2: Vérifier les headers CORS en détail
function testCORSHeaders() {
  console.log('\n2️⃣ Test des headers CORS...');
  
  const req = http.request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/courses/test-id/publish',
    method: 'OPTIONS',
    headers: {
      'Origin': 'http://localhost:3000',
      'Access-Control-Request-Method': 'PATCH',
      'Access-Control-Request-Headers': 'Content-Type, Authorization'
    }
  }, (res) => {
    console.log(`   📊 Status: ${res.statusCode}`);
    console.log(`   📋 CORS Origin: ${res.headers['access-control-allow-origin']}`);
    console.log(`   📋 CORS Methods: ${res.headers['access-control-allow-methods']}`);
    console.log(`   📋 CORS Headers: ${res.headers['access-control-allow-headers']}`);
    console.log(`   📋 CORS Credentials: ${res.headers['access-control-allow-credentials']}`);
  });

  req.on('error', (error) => {
    console.log(`   ❌ Erreur CORS: ${error.message}`);
  });

  req.end();
}

// Test 3: Vérifier la méthode PATCH spécifiquement
function testPATCHMethod() {
  console.log('\n3️⃣ Test de la méthode PATCH...');
  
  const req = http.request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/courses/test-id/publish',
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer test-token',
      'Origin': 'http://localhost:3000'
    }
  }, (res) => {
    console.log(`   📊 Status: ${res.statusCode}`);
    
    let data = '';
    res.on('data', (chunk) => data += chunk);
    res.on('end', () => {
      try {
        const response = JSON.parse(data);
        console.log(`   📋 Réponse: ${response.message}`);
      } catch (error) {
        console.log('   📋 Réponse brute:', data);
      }
    });
  });

  req.on('error', (error) => {
    console.log(`   ❌ Erreur PATCH: ${error.message}`);
    console.log(`   🔍 Code d'erreur: ${error.code}`);
    console.log(`   🔍 Type d'erreur: ${error.type}`);
  });

  req.end();
}

// Test 4: Vérifier les ports et processus
function checkPortsAndProcesses() {
  console.log('\n4️⃣ Vérification des ports et processus...');
  
  const { exec } = require('child_process');
  
  // Vérifier le port 3000
  exec('netstat -an | findstr :3000', (error, stdout, stderr) => {
    if (error) {
      console.log('   ❌ Erreur vérification port 3000');
      return;
    }
    
    if (stdout.trim()) {
      console.log('   ✅ Port 3000 occupé:', stdout.trim());
    } else {
      console.log('   ⚠️ Port 3000 libre (frontend non démarré)');
    }
  });
  
  // Vérifier le port 5000
  exec('netstat -an | findstr :5000', (error, stdout, stderr) => {
    if (error) {
      console.log('   ❌ Erreur vérification port 5000');
      return;
    }
    
    if (stdout.trim()) {
      console.log('   ✅ Port 5000 occupé:', stdout.trim());
    } else {
      console.log('   ❌ Port 5000 libre (backend non démarré)');
    }
  });
}

// Test 5: Vérifier la configuration réseau
function checkNetworkConfig() {
  console.log('\n5️⃣ Vérification de la configuration réseau...');
  
  const { exec } = require('child_process');
  
  // Vérifier les interfaces réseau
  exec('ipconfig', (error, stdout, stderr) => {
    if (error) {
      console.log('   ❌ Erreur vérification interfaces réseau');
      return;
    }
    
    const lines = stdout.split('\n');
    const localhostLine = lines.find(line => line.includes('127.0.0.1') || line.includes('localhost'));
    if (localhostLine) {
      console.log('   ✅ Interface localhost détectée');
    } else {
      console.log('   ⚠️ Interface localhost non détectée');
    }
  });
}

// Lancer tous les tests
console.log('🚀 Lancement des tests de débogage...\n');

testBasicConnectivity();
setTimeout(() => testCORSHeaders(), 1000);
setTimeout(() => testPATCHMethod(), 2000);
setTimeout(() => checkPortsAndProcesses(), 3000);
setTimeout(() => checkNetworkConfig(), 4000);

console.log('\n⏳ Tests en cours...');
