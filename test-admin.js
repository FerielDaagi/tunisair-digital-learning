const axios = require('axios');

const API_BASE_URL = 'http://localhost:5000/api';

// Test de connexion admin
async function testAdminLogin() {
  try {
    console.log('🧪 Test de connexion admin...');
    
    const response = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: 'admin@example.com',
      password: 'password123'
    });
    
    console.log('✅ Connexion admin réussie:', {
      success: response.data.success,
      message: response.data.message,
      hasUser: !!response.data.user,
      hasToken: !!response.data.token,
      userRole: response.data.user?.role
    });
    
    return response.data.token;
  } catch (error) {
    console.error('❌ Erreur de connexion admin:', {
      status: error.response?.status,
      message: error.response?.data?.message || error.message
    });
    return null;
  }
}

// Test de récupération des utilisateurs
async function testGetAllUsers(token) {
  if (!token) {
    console.log('⚠️ Pas de token, impossible de tester getAllUsers');
    return;
  }
  
  try {
    console.log('🧪 Test getAllUsers...');
    
    const response = await axios.get(`${API_BASE_URL}/user/admin/all`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('✅ getAllUsers réussi:', {
      success: response.data.success,
      hasUsers: !!response.data.users,
      userCount: response.data.users?.length || 0
    });
    
    if (response.data.users && response.data.users.length > 0) {
      console.log('👥 Premier utilisateur:', {
        id: response.data.users[0]._id,
        name: response.data.users[0].name,
        email: response.data.users[0].email,
        role: response.data.users[0].role
      });
    }
  } catch (error) {
    console.error('❌ Erreur getAllUsers:', {
      status: error.response?.status,
      message: error.response?.data?.message || error.message
    });
  }
}

// Test de vérification du token
async function testTokenValidation(token) {
  if (!token) {
    console.log('⚠️ Pas de token, impossible de tester la validation');
    return;
  }
  
  try {
    console.log('🧪 Test validation token...');
    
    const response = await axios.get(`${API_BASE_URL}/auth/me`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('✅ Token valide:', {
      success: response.data.success,
      hasUser: !!response.data.user,
      userRole: response.data.user?.role
    });
  } catch (error) {
    console.error('❌ Erreur validation token:', {
      status: error.response?.status,
      message: error.response?.data?.message || error.message
    });
  }
}

// Exécuter les tests
async function runTests() {
  console.log('🚀 Démarrage des tests admin...\n');
  
  // Test 1: Connexion admin
  const adminToken = await testAdminLogin();
  console.log('');
  
  // Test 2: Validation du token
  await testTokenValidation(adminToken);
  console.log('');
  
  // Test 3: Récupération des utilisateurs
  await testGetAllUsers(adminToken);
  console.log('');
  
  console.log('🏁 Tests terminés !');
}

// Lancer les tests si le fichier est exécuté directement
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { testAdminLogin, testGetAllUsers, testTokenValidation };






