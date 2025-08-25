const http = require('http');

console.log('🧪 Test de création de module avec authentification...\n');

// Simuler une connexion utilisateur pour obtenir un token
function loginAndCreateModule() {
  const loginData = JSON.stringify({
    email: 'tuteur@example.com',
    password: 'password123'
  });

  const loginOptions = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/auth/login',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(loginData)
    }
  };

  const loginReq = http.request(loginOptions, (res) => {
    console.log(`🔐 Tentative de connexion...`);
    console.log(`   Statut: ${res.statusCode}`);
    
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      if (res.statusCode === 200) {
        try {
          const response = JSON.parse(data);
          if (response.success && response.token) {
            console.log('✅ Connexion réussie, token obtenu');
            console.log(`   Utilisateur: ${response.user.name} (${response.user.role})`);
            
            // Maintenant créer un module avec le token
            createModuleWithToken(response.token);
          } else {
            console.log('❌ Échec de la connexion:', response.message);
          }
        } catch (e) {
          console.log('❌ Erreur parsing réponse:', e.message);
        }
      } else {
        console.log('❌ Échec de la connexion, statut:', res.statusCode);
        console.log('   Réponse:', data);
      }
    });
  });

  loginReq.on('error', (e) => {
    console.error('❌ Erreur connexion:', e.message);
  });

  loginReq.write(loginData);
  loginReq.end();
}

function createModuleWithToken(token) {
  console.log('\n📤 Création de module avec token...');
  
  const moduleData = JSON.stringify({
    title: 'Module de test authentifié',
    description: 'Description de test avec authentification',
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
    
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      console.log(`   Réponse: ${data}`);
      
      if (res.statusCode === 200) {
        console.log('✅ Module créé avec succès !');
      } else if (res.statusCode === 201) {
        console.log('✅ Module créé avec succès (201) !');
      } else if (res.statusCode === 400) {
        console.log('❌ Erreur de validation:', data);
      } else if (res.statusCode === 401) {
        console.log('❌ Token invalide ou expiré');
      } else if (res.statusCode === 403) {
        console.log('❌ Accès refusé - rôle insuffisant');
      } else if (res.statusCode === 404) {
        console.log('❌ Cours non trouvé');
      } else {
        console.log(`⚠️ Statut inattendu: ${res.statusCode}`);
      }
    });
  });

  req.on('error', (e) => {
    console.error('❌ Erreur création module:', e.message);
  });

  req.write(moduleData);
  req.end();
}

// Démarrer le test
console.log('🔍 Test de connexion et création de module...');
loginAndCreateModule();
