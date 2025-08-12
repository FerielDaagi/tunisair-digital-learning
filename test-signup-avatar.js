const axios = require('axios');

async function testSignupWithAvatar() {
  try {
    console.log('🔄 Test du signup avec avatar...');
    
    // Test simple sans fichier pour l'instant
    const response = await axios.post('http://localhost:5000/api/auth/register', {
      name: 'Test User Avatar',
      email: 'testavatar@example.com',
      password: 'password123',
      role: 'apprenti',
      profile: {
        bio: 'Test user with avatar',
        phone: '1234567890',
        dateOfBirth: '1990-01-01',
        address: {
          street: '123 Test St',
          city: 'Test City',
          country: 'Test Country',
          zipCode: '12345'
        }
      }
    });
    
    console.log('✅ Signup réussi:', response.data);
    
  } catch (error) {
    console.error('❌ Signup échoué:', error.response?.data || error.message);
  }
}

testSignupWithAvatar();
