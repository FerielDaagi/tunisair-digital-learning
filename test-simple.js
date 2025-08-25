const http = require('http');

const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/health',
  method: 'GET'
};

const req = http.request(options, (res) => {
  console.log(`Status: ${res.statusCode}`);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    try {
      const response = JSON.parse(data);
      console.log('Réponse du serveur:', response);
      
      if (res.statusCode === 200) {
        console.log('✅ Serveur connecté et fonctionnel');
      } else {
        console.log('❌ Serveur répond mais avec une erreur');
      }
    } catch (error) {
      console.log('❌ Erreur parsing JSON:', error.message);
      console.log('Réponse brute:', data);
    }
  });
});

req.on('error', (error) => {
  console.log('❌ Erreur de connexion:', error.message);
  console.log('💡 Assurez-vous que le serveur backend est démarré sur le port 5000');
});

req.end();
