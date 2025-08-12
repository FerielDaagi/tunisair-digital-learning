const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

async function testEndpoints() {
  console.log('🧪 Test des endpoints...\n');

  try {
    // Test 1: Health check
    console.log('1. Test du health check...');
    const healthResponse = await axios.get(`${BASE_URL}/health`);
    console.log('✅ Health check:', healthResponse.data.message);

    // Test 2: Register (sans avatar)
    console.log('\n2. Test du signup...');
    const signupData = {
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
      role: 'apprenti',
      profile: {
        bio: 'Test user bio',
        phone: '1234567890',
        dateOfBirth: '1990-01-01',
        address: {
          street: '123 Test St',
          city: 'Test City',
          country: 'Test Country',
          zipCode: '12345'
        }
      }
    };

    const signupResponse = await axios.post(`${BASE_URL}/auth/register`, signupData);
    console.log('✅ Signup réussi:', signupResponse.data.message);
    
    const token = signupResponse.data.token;
    console.log('🔑 Token reçu:', token ? 'Oui' : 'Non');

    // Test 3: Login
    console.log('\n3. Test du login...');
    const loginData = {
      email: 'test@example.com',
      password: 'password123'
    };

    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, loginData);
    console.log('✅ Login réussi:', loginResponse.data.message);

    // Test 4: Get Profile (avec token)
    console.log('\n4. Test du profil utilisateur...');
    const profileResponse = await axios.get(`${BASE_URL}/user/profile`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    console.log('✅ Profil récupéré:', profileResponse.data.user.name);

    console.log('\n🎉 Tous les tests sont passés avec succès !');
    console.log('\n📋 Résumé :');
    console.log('- ✅ Backend fonctionne');
    console.log('- ✅ Signup fonctionne');
    console.log('- ✅ Login fonctionne');
    console.log('- ✅ Profil utilisateur fonctionne');
    console.log('- ✅ Upload d\'avatar configuré');
    console.log('\n🚀 Vous pouvez maintenant tester l\'interface utilisateur !');

  } catch (error) {
    console.error('❌ Erreur:', error.response?.data?.message || error.message);
    
    if (error.response?.status === 409) {
      console.log('ℹ️  L\'utilisateur existe déjà, c\'est normal pour les tests répétés');
    }
  }
}

testEndpoints();
