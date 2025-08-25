const http = require('http');

console.log('🧪 Test simple de connexion à l\'API...\n');

// Test de connexion simple
const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/health',
  method: 'GET'
};

const req = http.request(options, (res) => {
  console.log(`✅ Statut de la réponse: ${res.statusCode}`);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    try {
      const response = JSON.parse(data);
      console.log('📊 Réponse du serveur:');
      console.log('- Statut:', response.status);
      console.log('- Timestamp:', response.timestamp);
      console.log('- Connexions actives:', response.connections);
    } catch (e) {
      console.log('📄 Réponse brute:', data);
    }
  });
});

req.on('error', (e) => {
  console.error('❌ Erreur de connexion:', e.message);
});

req.end();

console.log('🔍 Envoi de la requête de test...');

