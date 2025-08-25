const http = require('http');

console.log('🧪 Test de connexion simple au serveur backend...\n');

// Test de connexion basique
const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/courses',
  method: 'GET'
};

const req = http.request(options, (res) => {
  console.log(`📡 Test de connexion au serveur`);
  console.log(`   Statut: ${res.statusCode}`);
  console.log(`   Headers: ${JSON.stringify(res.headers, null, 2)}`);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log(`   Réponse: ${data.substring(0, 200)}...`);
    
    if (res.statusCode === 200 || res.statusCode === 401) {
      console.log('✅ Serveur accessible et répond');
      if (res.statusCode === 401) {
        console.log('ℹ️ Route protégée (normal)');
      }
    } else {
      console.log(`⚠️ Statut inattendu: ${res.statusCode}`);
    }
  });
});

req.on('error', (e) => {
  console.error('❌ Erreur de connexion:', e.message);
  console.log('💡 Vérifiez que le serveur backend est démarré sur le port 5000');
});

req.end();

console.log('⏳ Test en cours...');
