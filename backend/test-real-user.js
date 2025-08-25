const http = require('http');

console.log('🧪 Test de création de module avec un utilisateur réel...\n');

// Test de connexion avec un utilisateur existant
function testWithRealUser() {
  console.log('💡 Instructions:');
  console.log('1. Ouvrez votre navigateur sur http://localhost:3000');
  console.log('2. Connectez-vous avec un compte tuteur existant');
  console.log('3. Allez dans la console du navigateur (F12)');
  console.log('4. Copiez le token depuis localStorage.getItem("token")');
  console.log('5. Collez le token ci-dessous\n');
  
  // Demander le token à l'utilisateur
  console.log('🔑 Collez votre token JWT ici (ou appuyez sur Entrée pour utiliser un token de test):');
  
  // Pour le test, on peut utiliser un token de test
  const testToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2OGFiOWI4MThkZmYxNTc3NDY2YjFhMCIsInJvbGUiOiJ0dXRldXIiLCJpYXQiOjE3MzU1MzIxMzMsImV4cCI6MTczNTYxODUzM30.test';
  
  console.log('🔍 Test avec token de test...');
  createModuleWithToken(testToken);
}

function createModuleWithToken(token) {
  console.log('\n📤 Test de création de module...');
  
  const moduleData = JSON.stringify({
    title: 'Module de test frontend',
    description: 'Description de test depuis le frontend',
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
      'Content-Length': Buffer.byteLength(moduleData),
      'Authorization': `Bearer ${token}`
    }
  };

  const req = http.request(options, (res) => {
    console.log(`   Statut: ${res.statusCode}`);
    console.log(`   Headers de réponse:`);
    console.log(`     Content-Type: ${res.headers['content-type']}`);
    console.log(`     Content-Length: ${res.headers['content-length']}`);
    
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      console.log(`   Réponse complète: ${data}`);
      
      if (res.statusCode === 200 || res.statusCode === 201) {
        console.log('✅ Module créé avec succès !');
        console.log('💡 Le problème vient probablement du frontend');
      } else if (res.statusCode === 400) {
        console.log('❌ Erreur de validation:', data);
      } else if (res.statusCode === 401) {
        console.log('❌ Token invalide ou expiré');
        console.log('💡 Vérifiez que vous êtes bien connecté en tant que tuteur');
      } else if (res.statusCode === 403) {
        console.log('❌ Accès refusé - rôle insuffisant');
        console.log('💡 Vérifiez que votre compte a le rôle "tuteur"');
      } else if (res.statusCode === 404) {
        console.log('❌ Cours non trouvé');
        console.log('💡 Vérifiez que l\'ID du cours est correct');
      } else {
        console.log(`⚠️ Statut inattendu: ${res.statusCode}`);
        console.log('💡 Vérifiez les logs du serveur backend');
      }
    });
  });

  req.on('error', (e) => {
    console.error('❌ Erreur de requête:', e.message);
  });

  req.write(moduleData);
  req.end();
}

// Démarrer le test
testWithRealUser();
