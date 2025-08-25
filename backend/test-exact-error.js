const http = require('http');

console.log('🧪 Test de reproduction de l\'erreur exacte...\n');

// Reproduire exactement les données envoyées par le frontend
const moduleData = {
  title: 'dfhgf',
  description: 'ghfgfh',
  order: 1,
  isPublished: false,
  course: '68ab9b8184dff1577465b1b0'
};

console.log('📤 Données exactes envoyées par le frontend:');
console.log(JSON.stringify(moduleData, null, 2));

// Test sans authentification d'abord
console.log('\n🔍 Test 1: Sans authentification (devrait donner 401)');
testModuleCreation(moduleData, null);

setTimeout(() => {
  console.log('\n🔍 Test 2: Avec token d\'authentification');
  console.log('💡 Collez votre token JWT et appuyez sur Entrée:');
  
  process.stdin.once('data', (data) => {
    const token = data.toString().trim();
    
    if (!token || token === 'null' || token === 'undefined') {
      console.log('❌ Aucun token fourni');
      return;
    }
    
    testModuleCreation(moduleData, token);
  });
}, 2000);

function testModuleCreation(moduleData, token) {
  const data = JSON.stringify(moduleData);
  
  const options = {
    hostname: 'localhost',
    port: 5000,
    path: `/api/modules/course/${moduleData.course}`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(data)
    }
  };

  // Ajouter le token si fourni
  if (token) {
    options.headers['Authorization'] = `Bearer ${token}`;
  }

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
      } else if (res.statusCode === 400) {
        console.log('   ❌ Erreur de validation');
      } else if (res.statusCode === 401) {
        console.log('   ❌ Non authentifié (normal sans token)');
      } else if (res.statusCode === 500) {
        console.log('   ❌ Erreur interne du serveur (PROBLÈME IDENTIFIÉ)');
        console.log('   💡 Regardez les logs du serveur backend pour l\'erreur exacte');
      } else {
        console.log(`   ⚠️ Statut inattendu: ${res.statusCode}`);
      }
    });
  });

  req.on('error', (e) => {
    console.error('   ❌ Erreur de requête:', e.message);
  });

  req.write(data);
  req.end();
}

console.log('⏳ Tests en cours...');
