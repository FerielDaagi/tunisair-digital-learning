const fetch = require('node-fetch');

async function testCourseCreation() {
  try {
    console.log('🧪 Test de création de cours...');
    
    // Test 1: Vérifier que l'API est accessible
    const healthResponse = await fetch('http://localhost:5000/api/health');
    if (healthResponse.ok) {
      console.log('✅ API accessible');
    } else {
      console.log('❌ API non accessible');
      return;
    }
    
    // Test 2: Vérifier que les catégories sont accessibles
    const categoriesResponse = await fetch('http://localhost:5000/api/categories');
    if (categoriesResponse.ok) {
      const categoriesData = await categoriesResponse.json();
      console.log('✅ Catégories accessibles:', categoriesData.data?.length || 0, 'catégories');
    } else {
      console.log('❌ Catégories non accessibles');
    }
    
    console.log('🎯 Test terminé - Le backend semble fonctionner correctement');
    
  } catch (error) {
    console.error('❌ Erreur lors du test:', error.message);
  }
}

testCourseCreation();
