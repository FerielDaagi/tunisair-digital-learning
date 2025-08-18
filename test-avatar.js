const axios = require('axios');

const API_BASE_URL = 'http://localhost:5000/api';

// Test de connexion et récupération du profil
async function testProfileAndAvatar() {
  try {
    console.log('🧪 Test de connexion et profil...');
    
    // 1. Connexion
    const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: 'admin@example.com',
      password: 'password123'
    });
    
    const token = loginResponse.data.token;
    console.log('✅ Connexion réussie, token obtenu');
    
    // 2. Récupération du profil
    const profileResponse = await axios.get(`${API_BASE_URL}/user/profile`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    console.log('✅ Profil récupéré:', {
      name: profileResponse.data.user?.name,
      hasAvatar: !!profileResponse.data.user?.profile?.avatar,
      avatarPath: profileResponse.data.user?.profile?.avatar
    });
    
    // 3. Test de l'historique des avatars
    try {
      const historyResponse = await axios.get(`${API_BASE_URL}/user/avatar/history`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      console.log('✅ Historique des avatars récupéré:', {
        hasHistory: !!historyResponse.data.previousAvatars,
        count: historyResponse.data.previousAvatars?.length || 0
      });
      
      if (historyResponse.data.previousAvatars?.length > 0) {
        console.log('📷 Avatars dans l\'historique:', historyResponse.data.previousAvatars);
      }
      
    } catch (historyError) {
      console.log('⚠️ Historique des avatars non disponible:', historyError.response?.data?.message || historyError.message);
    }
    
    return token;
    
  } catch (error) {
    console.error('❌ Erreur:', {
      status: error.response?.status,
      message: error.response?.data?.message || error.message
    });
    return null;
  }
}

// Test de mise à jour du profil
async function testProfileUpdate(token) {
  if (!token) {
    console.log('⚠️ Pas de token, impossible de tester la mise à jour');
    return;
  }
  
  try {
    console.log('🧪 Test de mise à jour du profil...');
    
    const updateData = {
      name: 'Admin Test',
      profile: {
        bio: 'Test de mise à jour du profil',
        phone: '+33 1 23 45 67 89'
      }
    };
    
    const response = await axios.put(`${API_BASE_URL}/user/profile`, updateData, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    console.log('✅ Profil mis à jour:', {
      success: response.data.success,
      hasUser: !!response.data.user,
      newName: response.data.user?.name,
      newBio: response.data.user?.profile?.bio
    });
    
  } catch (error) {
    console.error('❌ Erreur mise à jour profil:', {
      status: error.response?.status,
      message: error.response?.data?.message || error.message
    });
  }
}

// Exécuter les tests
async function runTests() {
  console.log('🚀 Démarrage des tests avatar et profil...\n');
  
  // Test 1: Connexion et profil
  const token = await testProfileAndAvatar();
  console.log('');
  
  // Test 2: Mise à jour du profil
  await testProfileUpdate(token);
  console.log('');
  
  console.log('🏁 Tests terminés !');
}

// Lancer les tests si le fichier est exécuté directement
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { testProfileAndAvatar, testProfileUpdate };



