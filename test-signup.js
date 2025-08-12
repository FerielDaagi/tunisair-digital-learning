const axios = require('axios');

async function testSignup() {
  try {
    const response = await axios.post('http://localhost:5000/api/auth/register', {
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
      role: 'apprenti',
      profile: {
        avatar: '',
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
    });
    
    console.log('✅ Signup successful:', response.data);
  } catch (error) {
    console.error('❌ Signup failed:', error.response?.data || error.message);
  }
}

testSignup();
