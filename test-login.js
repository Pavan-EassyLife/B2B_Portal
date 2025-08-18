// Test script to verify the B2B login API endpoint
// Run with: node test-login.js

const fetch = require('node-fetch');

async function testLogin() {
  const API_BASE_URL = 'http://localhost:5001/';
  
  const testCredentials = {
    email: "mohini@eassylife.in",
    password: "12345678"
  };

  try {
    console.log('Testing B2B Login API...');
    console.log('Endpoint:', `${API_BASE_URL}b2b/login`);
    console.log('Credentials:', testCredentials);
    
    const response = await fetch(`${API_BASE_URL}b2b/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testCredentials)
    });

    const result = await response.json();
    
    console.log('\nResponse Status:', response.status);
    console.log('Response Data:', JSON.stringify(result, null, 2));
    
    if (response.ok && result.status) {
      console.log('\n✅ Login successful!');
      console.log('User ID:', result.data.user.id);
      console.log('Email:', result.data.user.email);
      console.log('Contact Person:', result.data.user.contact_person);
      console.log('Company:', result.data.user.company_name);
      console.log('Phone:', result.data.user.phone);
      console.log('Role:', result.data.user.role);
      console.log('\nNote: No token provided in response - using session-based auth');
    } else {
      console.log('\n❌ Login failed');
      console.log('Error:', result.message || 'Unknown error');
    }
    
  } catch (error) {
    console.error('\n❌ Network error:', error.message);
  }
}

testLogin();
