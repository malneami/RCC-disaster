/**
 * Test script for creating access logs
 */

const axios = require('axios');

const API_BASE_URL = 'http://localhost:3001/api/v1';

async function testCreateAccessLog() {
  try {
    console.log('=== Testing Access Log Creation ===\n');
    
    // Login
    console.log('1. Logging in...');
    const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: 'admin@rcc-healthcare.com',
      password: 'Healthcare@2024',
    });
    const token = loginResponse.data.accessToken;
    console.log('✅ Login successful\n');

    // Get sample data
    console.log('2. Getting sample patient and user...');
    const logsResponse = await axios.get(`${API_BASE_URL}/patients/access-logs?limit=1`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    
    if (!logsResponse.data.data || logsResponse.data.data.length === 0) {
      console.log('No existing logs, getting patient list...');
      const patientsResponse = await axios.get(`${API_BASE_URL}/patients?limit=1`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (!patientsResponse.data || patientsResponse.data.length === 0) {
        console.error('❌ No patients found');
        return;
      }
      
      const patientId = patientsResponse.data[0].id;
      const userId = loginResponse.data.user?.id || '4622626a-e9db-4e16-b818-a45ab294e610';
      
      console.log(`Using patientId: ${patientId}`);
      console.log(`Using userId: ${userId}\n`);
      
      // Test CREATE
      console.log('3. Testing POST /patients/access-logs...');
      const createResponse = await axios.post(
        `${API_BASE_URL}/patients/access-logs`,
        {
          patientId,
          userId,
          accessType: 'VIEW',
          accessMethod: 'API',
          reason: 'Test creation from script',
        },
        {
          headers: { Authorization: `Bearer ${token}` },
          validateStatus: () => true,
        }
      );
      
      console.log(`Status: ${createResponse.status}`);
      
      if (createResponse.status === 201 || createResponse.status === 200) {
        console.log('✅ CREATE SUCCESS!');
        console.log('\nCreated Access Log:');
        console.log(JSON.stringify(createResponse.data, null, 2));
      } else {
        console.log('❌ CREATE FAILED');
        console.log('\nResponse:');
        console.log(JSON.stringify(createResponse.data, null, 2));
      }
    } else {
      const patientId = logsResponse.data.data[0].patientId;
      const userId = logsResponse.data.data[0].userId;
      
      console.log(`Using patientId: ${patientId}`);
      console.log(`Using userId: ${userId}\n`);
      
      // Test CREATE
      console.log('3. Testing POST /patients/access-logs...');
      const createResponse = await axios.post(
        `${API_BASE_URL}/patients/access-logs`,
        {
          patientId,
          userId,
          accessType: 'VIEW',
          accessMethod: 'API',
          reason: 'Test creation from script',
        },
        {
          headers: { Authorization: `Bearer ${token}` },
          validateStatus: () => true,
        }
      );
      
      console.log(`Status: ${createResponse.status}`);
      
      if (createResponse.status === 201 || createResponse.status === 200) {
        console.log('✅ CREATE SUCCESS!');
        console.log('\nCreated Access Log:');
        console.log(JSON.stringify(createResponse.data, null, 2));
        
        // Test UPDATE
        console.log('\n4. Testing PUT /patients/access-logs/:logId...');
        const logId = createResponse.data.id;
        const updateResponse = await axios.put(
          `${API_BASE_URL}/patients/access-logs/${logId}`,
          {
            reason: 'Updated reason from test script',
            accessType: 'UPDATE',
          },
          {
            headers: { Authorization: `Bearer ${token}` },
            validateStatus: () => true,
          }
        );
        
        console.log(`Status: ${updateResponse.status}`);
        
        if (updateResponse.status === 200) {
          console.log('✅ UPDATE SUCCESS!');
          console.log('\nUpdated Access Log:');
          console.log(JSON.stringify(updateResponse.data, null, 2));
        } else {
          console.log('❌ UPDATE FAILED');
          console.log('\nResponse:');
          console.log(JSON.stringify(updateResponse.data, null, 2));
        }
      } else {
        console.log('❌ CREATE FAILED');
        console.log('\nResponse:');
        console.log(JSON.stringify(createResponse.data, null, 2));
      }
    }
  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', JSON.stringify(error.response.data, null, 2));
    } else if (error.request) {
      console.error('No response received. Is the backend running?');
    }
  }
}

testCreateAccessLog();

