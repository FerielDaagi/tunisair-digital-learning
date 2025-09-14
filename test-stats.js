const axios = require('axios');

async function testStats() {
  try {
    const response = await axios.get('http://localhost:5000/api/reviews/course/68b9afad4a2b08c19620cc4e/reviews?page=1&limit=10');
    
    console.log('✅ API Response:');
    console.log('Reviews count:', response.data.data.reviews.length);
    console.log('Stats:', JSON.stringify(response.data.data.stats, null, 2));
    console.log('Pagination:', JSON.stringify(response.data.data.pagination, null, 2));
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

testStats();


