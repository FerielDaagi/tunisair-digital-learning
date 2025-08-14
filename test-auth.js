const axios = require('axios');

const API_BASE_URL = 'http://localhost:5000/api';

// Test de connexion
async function testLogin() {
  try {
    console.log('🧪 Test de connexion...');
    
    const response = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: 'admin@example.com',
      password: 'password123'
    });
    
    console.log('✅ Connexion réussie:', {
      success: response.data.success,
      message: response.data.message,
      hasUser: !!response.data.user,
      hasToken: !!response.data.token
    });
    
    return response.data.token;
  } catch (error) {
    console.error('❌ Erreur de connexion:', {
      status: error.response?.status,
      message: error.response?.data?.message || error.message
    });
    return null;
  }
}

// Test d'inscription
async function testSignup() {
  try {
    console.log('🧪 Test d\'inscription...');
    
    const userData = {
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
      role: 'apprenti',
      profile: {
        bio: 'Utilisateur de test',
        phone: '+33 1 23 45 67 89'
      }
    };
    
    const response = await axios.post(`${API_BASE_URL}/auth/register`, userData);
    
    console.log('✅ Inscription réussie:', {
      success: response.data.success,
      message: response.data.message,
      hasUser: !!response.data.user,
      hasToken: !!response.data.token
    });
    
    return response.data.token;
  } catch (error) {
    console.error('❌ Erreur d\'inscription:', {
      status: error.response?.status,
      message: error.response?.data?.message || error.message
    });
    return null;
  }
}

// Test de profil utilisateur
async function testProfile(token) {
  if (!token) {
    console.log('⚠️ Pas de token, impossible de tester le profil');
    return;
  }
  
  try {
    console.log('🧪 Test de profil utilisateur...');
    
    const response = await axios.get(`${API_BASE_URL}/auth/me`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('✅ Profil récupéré:', {
      success: response.data.success,
      hasUser: !!response.data.user,
      userEmail: response.data.user?.email
    });
  } catch (error) {
    console.error('❌ Erreur de profil:', {
      status: error.response?.status,
      message: error.response?.data?.message || error.message
    });
  }
}

// Exécuter les tests
async function runTests() {
  console.log('🚀 Démarrage des tests d\'authentification...\n');
  
  // Test 1: Inscription
  const signupToken = await testSignup();
  console.log('');
  
  // Test 2: Connexion
  const loginToken = await testLogin();
  console.log('');
  
  // Test 3: Profil avec token de connexion
  await testProfile(loginToken);
  console.log('');
  
  console.log('🏁 Tests terminés !');
}

// Lancer les tests si le fichier est exécuté directement
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { testLogin, testSignup, testProfile };

