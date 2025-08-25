const http = require('http');

console.log('🧪 Test simple d\'authentification...\n');

console.log('💡 Instructions:');
console.log('1. Ouvrez votre navigateur sur http://localhost:3000');
console.log('2. Connectez-vous avec un compte tuteur');
console.log('3. Appuyez sur F12 → Console');
console.log('4. Tapez: localStorage.getItem("token")');
console.log('5. Copiez le token et collez-le ci-dessous\n');

// Attendre l'entrée de l'utilisateur
process.stdin.once('data', (data) => {
  const token = data.toString().trim();
  
  if (!token || token === 'null' || token === 'undefined') {
    console.log('❌ Aucun token fourni');
    console.log('💡 Assurez-vous d\'être connecté en tant que tuteur');
    return;
  }
  
  console.log('🔑 Token reçu, test d\'authentification...\n');
  testAuthentication(token);
});

function testAuthentication(token) {
  // Test 1: Vérifier l'authentification avec une route simple
  console.log('📤 Test 1: Vérification de l\'authentification...');
  
  const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/courses/tutor/my-courses',
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  };

  const req = http.request(options, (res) => {
    console.log(`   Statut: ${res.statusCode}`);
    
    let responseData = '';
    res.on('data', (chunk) => {
      responseData += chunk;
    });
    
    res.on('end', () => {
      console.log(`   Réponse: ${responseData.substring(0, 200)}...`);
      
      if (res.statusCode === 200) {
        console.log('   ✅ Authentification réussie !');
        console.log('   💡 Le problème vient de la création de module spécifiquement');
        
        // Test 2: Création de module
        setTimeout(() => {
          testModuleCreation(token);
        }, 1000);
        
      } else if (res.statusCode === 401) {
        console.log('   ❌ Token invalide ou expiré');
        console.log('   💡 Reconnectez-vous en tant que tuteur');
      } else if (res.statusCode === 403) {
        console.log('   ❌ Accès refusé - rôle insuffisant');
        console.log('   💡 Vérifiez que votre compte a le rôle "tuteur"');
      } else {
        console.log(`   ⚠️ Statut inattendu: ${res.statusCode}`);
      }
    });
  });

  req.on('error', (e) => {
    console.error('   ❌ Erreur de requête:', e.message);
  });

  req.end();
}

function testModuleCreation(token) {
  console.log('\n📤 Test 2: Création de module...');
  
  const moduleData = {
    title: 'Module Test Auth',
    description: 'Description de test',
    order: 1,
    course: '68ab9b8184dff1577465b1b0',
    isPublished: false
  };

  const data = JSON.stringify(moduleData);
  
  const options = {
    hostname: 'localhost',
    port: 5000,
    path: `/api/modules/course/${moduleData.course}`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(data),
      'Authorization': `Bearer ${token}`
    }
  };

  const req = http.request(options, (res) => {
    console.log(`   Statut: ${res.statusCode}`);
    
    let responseData = '';
    res.on('data', (chunk) => {
      responseData += chunk;
    });
    
    res.on('end', () => {
      console.log(`   Réponse: ${responseData}`);
      
      if (res.statusCode === 201 || res.statusCode === 200) {
        console.log('   ✅ Module créé avec succès !');
        console.log('   🎉 Le problème est résolu !');
      } else if (res.statusCode === 500) {
        console.log('   ❌ Erreur interne du serveur');
        console.log('   💡 Regardez les logs du serveur backend pour l\'erreur exacte');
      } else {
        console.log(`   ⚠️ Statut: ${res.statusCode}`);
        console.log(`   💡 Problème identifié: ${responseData}`);
      }
    });
  });

  req.on('error', (e) => {
    console.error('   ❌ Erreur de requête:', e.message);
  });

  req.write(data);
  req.end();
}

console.log('⏳ En attente du token...');
console.log('🔑 Collez votre token JWT et appuyez sur Entrée:');
