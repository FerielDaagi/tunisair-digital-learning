const http = require('http');

async function testServer() {
  console.log('🧪 Test du serveur...');
  
  try {
    // Test de santé
    const health = await makeRequest('/api/health');
    console.log('✅ Health check:', health.status);
    
    // Test de debug
    const debug = await makeRequest('/api/debug');
    console.log('✅ Debug info:', debug.connections, 'connexions actives');
    
    // Test de Socket.io
    const socketTest = await makeRequest('/socket.io/');
    console.log('✅ Socket.io accessible');
    
    console.log('🎉 Tous les tests passent !');
    
  } catch (error) {
    console.error('❌ Erreur de test:', error.message);
  }
}

function makeRequest(path) {
  return new Promise((resolve, reject) => {
    const req = http.request({
      hostname: 'localhost',
      port: 5000,
      path: path,
      method: 'GET',
      timeout: 5000
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          resolve(response);
        } catch (error) {
          resolve({ status: res.statusCode, data });
        }
      });
    });
    
    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Timeout'));
    });
    
    req.end();
  });
}

// Lancer le test
testServer();

