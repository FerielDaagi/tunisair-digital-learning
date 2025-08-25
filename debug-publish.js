const http = require('http');

console.log('🔍 Débogage du problème de publication de cours...\n');

// Test 1: Vérifier l'endpoint de santé
function testHealth() {
  console.log('1️⃣ Test de l\'endpoint de santé...');
  
  const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/health',
    method: 'GET'
  };

  const req = http.request(options, (res) => {
    let data = '';
    res.on('data', (chunk) => data += chunk);
    res.on('end', () => {
      try {
        const response = JSON.parse(data);
        console.log(`   ✅ Serveur OK - ${response.message}`);
      } catch (error) {
        console.log('   ❌ Erreur parsing réponse');
      }
    });
  });

  req.on('error', (error) => {
    console.log(`   ❌ Erreur serveur: ${error.message}`);
  });

  req.end();
}

// Test 2: Vérifier l'endpoint de publication avec token invalide
function testPublishWithInvalidToken() {
  console.log('\n2️⃣ Test publication avec token invalide...');
  
  const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/courses/test-course-id/publish',
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer invalid-token'
    }
  };

  const req = http.request(options, (res) => {
    let data = '';
    res.on('data', (chunk) => data += chunk);
    res.on('end', () => {
      console.log(`   📊 Status: ${res.statusCode}`);
      try {
        const response = JSON.parse(data);
        console.log(`   📋 Réponse: ${response.message}`);
        
        if (res.statusCode === 401) {
          console.log('   ✅ Endpoint accessible - Erreur d\'auth normale');
        } else if (res.statusCode === 404) {
          console.log('   ✅ Endpoint accessible - Cours introuvable');
        } else {
          console.log('   ⚠️ Réponse inattendue');
        }
      } catch (error) {
        console.log('   ❌ Erreur parsing JSON');
      }
    });
  });

  req.on('error', (error) => {
    console.log(`   ❌ Erreur connexion: ${error.message}`);
  });

  req.end();
}

// Test 3: Vérifier l'endpoint de publication sans token
function testPublishWithoutToken() {
  console.log('\n3️⃣ Test publication sans token...');
  
  const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/courses/test-course-id/publish',
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json'
    }
  };

  const req = http.request(options, (res) => {
    let data = '';
    res.on('data', (chunk) => data += chunk);
    res.on('end', () => {
      console.log(`   📊 Status: ${res.statusCode}`);
      try {
        const response = JSON.parse(data);
        console.log(`   📋 Réponse: ${response.message}`);
        
        if (res.statusCode === 401) {
          console.log('   ✅ Endpoint accessible - Erreur d\'auth normale');
        } else {
          console.log('   ⚠️ Réponse inattendue');
        }
      } catch (error) {
        console.log('   ❌ Erreur parsing JSON');
      }
    });
  });

  req.on('error', (error) => {
    console.log(`   ❌ Erreur connexion: ${error.message}`);
  });

  req.end();
}

// Test 4: Vérifier l'endpoint de création de cours
function testCreateCourse() {
  console.log('\n4️⃣ Test création de cours...');
  
  const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/courses',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer invalid-token'
    }
  };

  const req = http.request(options, (res) => {
    let data = '';
    res.on('data', (chunk) => data += chunk);
    res.on('end', () => {
      console.log(`   📊 Status: ${res.statusCode}`);
      try {
        const response = JSON.parse(data);
        console.log(`   📋 Réponse: ${response.message}`);
        
        if (res.statusCode === 401) {
          console.log('   ✅ Endpoint accessible - Erreur d\'auth normale');
        } else {
          console.log('   ⚠️ Réponse inattendue');
        }
      } catch (error) {
        console.log('   ❌ Erreur parsing JSON');
      }
    });
  });

  req.on('error', (error) => {
    console.log(`   ❌ Erreur connexion: ${error.message}`);
  });

  req.end();
}

// Lancer tous les tests
testHealth();
setTimeout(() => testPublishWithInvalidToken(), 1000);
setTimeout(() => testPublishWithoutToken(), 2000);
setTimeout(() => testCreateCourse(), 3000);

console.log('\n⏳ Tests en cours...');
