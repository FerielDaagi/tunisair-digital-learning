const http = require('http');

console.log('🧪 Test de création de module avec un vrai token...\n');

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
  
  console.log('🔑 Token reçu, test de création de module...\n');
  testModuleCreation(token);
});

function testModuleCreation(token) {
  const moduleData = {
    title: 'Module Test avec Token',
    description: 'Description de test avec authentification',
    order: 1,
    course: '68ab9b8184dff1577465b1b0',
    isPublished: false
  };

  const data = JSON.stringify(moduleData);
  
  console.log('📤 Données du module:');
  console.log(JSON.stringify(moduleData, null, 2));

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
    console.log(`\n📡 Réponse du serveur:`);
    console.log(`   Statut: ${res.statusCode}`);
    console.log(`   Headers: ${JSON.stringify(res.headers, null, 2)}`);
    
    let responseData = '';
    res.on('data', (chunk) => {
      responseData += chunk;
    });
    
    res.on('end', () => {
      console.log(`   Corps de la réponse: ${responseData}`);
      
      try {
        const parsed = JSON.parse(responseData);
        console.log(`   Réponse parsée: ${JSON.stringify(parsed, null, 2)}`);
        
        if (res.statusCode === 201 || res.statusCode === 200) {
          console.log('\n✅ Module créé avec succès !');
          console.log('💡 Le problème était probablement le token ou l\'authentification');
        } else if (res.statusCode === 400) {
          console.log('\n❌ Erreur de validation des données');
          console.log('💡 Vérifiez la structure des données envoyées');
        } else if (res.statusCode === 401) {
          console.log('\n❌ Token invalide ou expiré');
          console.log('💡 Vérifiez que vous êtes bien connecté en tant que tuteur');
        } else if (res.statusCode === 403) {
          console.log('\n❌ Accès refusé');
          console.log('💡 Vérifiez que votre compte a le rôle "tuteur"');
        } else if (res.statusCode === 404) {
          console.log('\n❌ Cours non trouvé');
          console.log('💡 Vérifiez que l\'ID du cours est correct');
        } else if (res.statusCode === 500) {
          console.log('\n❌ Erreur interne du serveur');
          console.log('💡 Vérifiez les logs du serveur backend');
        } else {
          console.log(`\n⚠️ Statut inattendu: ${res.statusCode}`);
        }
      } catch (e) {
        console.log(`\n⚠️ Réponse non-JSON: ${responseData}`);
      }
    });
  });

  req.on('error', (e) => {
    console.error('\n❌ Erreur de requête:', e.message);
  });

  req.write(data);
  req.end();
}

console.log('⏳ En attente du token...');
console.log('🔑 Collez votre token JWT et appuyez sur Entrée:');
