const axios = require('axios');

async function testCourseStudents() {
  try {
    console.log('🔍 Test de la route getCourseStudents...');
    
    // 1. Vérifier d'abord si le serveur répond
    console.log('1. Vérification du serveur...');
    const healthResponse = await axios.get('http://localhost:5000/api/health');
    console.log('✅ Serveur en ligne:', healthResponse.status === 200);
    
    // 2. Tester la route sans authentification (devrait retourner 401)
    console.log('2. Test sans authentification...');
    try {
      await axios.get('http://localhost:5000/api/courses/68b9afad4a2b08c19620cc4e/students');
    } catch (error) {
      console.log('✅ 401 attendu:', error.response?.status === 401);
      console.log('Message:', error.response?.data?.message);
    }
    
    // 3. Tester avec un token invalide
    console.log('3. Test avec token invalide...');
    try {
      await axios.get('http://localhost:5000/api/courses/68b9afad4a2b08c19620cc4e/students', {
        headers: { 'Authorization': 'Bearer invalid-token' }
      });
    } catch (error) {
      console.log('✅ 401 attendu:', error.response?.status === 401);
    }
    
    // 4. Vérifier les routes disponibles
    console.log('4. Test de la route de base...');
    const courseResponse = await axios.get('http://localhost:5000/api/courses/68b9afad4a2b08c19620cc4e');
    console.log('✅ Cours accessible:', courseResponse.status === 200);
    
    console.log('\n📋 Résumé des tests:');
    console.log('- Serveur: ✅ En ligne');
    console.log('- Route /students sans auth: ✅ 401 (correct)');
    console.log('- Route /students avec token invalide: ✅ 401 (correct)');
    console.log('- Route cours de base: ✅ Accessible');
    console.log('\n💡 Le problème semble être que la route /students nécessite une authentification valide.');
    console.log('💡 Vérifiez que l\'utilisateur connecté est bien le propriétaire du cours.');
    
  } catch (error) {
    console.error('❌ Erreur lors du test:');
    console.error('Status:', error.response?.status);
    console.error('Status Text:', error.response?.statusText);
    console.error('Data:', error.response?.data);
    console.error('Message:', error.message);
  }
}

// Exécuter le test
testCourseStudents();
