/**
 * Comprehensive Test Script for All Access Logs Endpoints
 * Tests GET, POST, and PUT endpoints
 */

const axios = require('axios');

const API_BASE_URL = 'http://localhost:3001/api/v1';

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

let authToken = null;
let testResults = {
  get: { passed: 0, failed: 0 },
  post: { passed: 0, failed: 0 },
  put: { passed: 0, failed: 0 },
};

async function login() {
  try {
    log('\n=== AUTHENTICATION ===', 'blue');
    const response = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: 'admin@rcc-healthcare.com',
      password: 'Healthcare@2024',
    });
    authToken = response.data.accessToken;
    log('✓ Login successful', 'green');
    return true;
  } catch (error) {
    log('✗ Login failed', 'red');
    return false;
  }
}

async function testGetEndpoint() {
  log('\n=== TEST 1: GET /patients/access-logs ===', 'cyan');
  
  try {
    // Test 1.1: Basic GET
    log('1.1 Testing basic GET...', 'yellow');
    const response1 = await axios.get(`${API_BASE_URL}/patients/access-logs?limit=5`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    
    if (response1.status === 200 && Array.isArray(response1.data.data)) {
      log('  ✓ Basic GET works', 'green');
      testResults.get.passed++;
    } else {
      log('  ✗ Basic GET failed', 'red');
      testResults.get.failed++;
      return;
    }
    
    // Test 1.2: Pagination
    log('1.2 Testing pagination...', 'yellow');
    const response2 = await axios.get(`${API_BASE_URL}/patients/access-logs?page=1&limit=3`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    
    if (response2.data.page === 1 && response2.data.limit === 3 && response2.data.data.length <= 3) {
      log('  ✓ Pagination works', 'green');
      testResults.get.passed++;
    } else {
      log('  ✗ Pagination failed', 'red');
      testResults.get.failed++;
    }
    
    // Test 1.3: Filtering
    if (response1.data.data.length > 0) {
      const sampleLog = response1.data.data[0];
      log('1.3 Testing filtering...', 'yellow');
      const response3 = await axios.get(
        `${API_BASE_URL}/patients/access-logs?patientId=${sampleLog.patientId}`,
        { headers: { Authorization: `Bearer ${authToken}` } }
      );
      
      if (response3.status === 200) {
        log('  ✓ Filtering works', 'green');
        testResults.get.passed++;
      } else {
        log('  ✗ Filtering failed', 'red');
        testResults.get.failed++;
      }
    }
    
    return response1.data.data.length > 0 ? response1.data.data[0] : null;
  } catch (error) {
    log(`  ✗ GET endpoint failed: ${error.message}`, 'red');
    testResults.get.failed++;
    return null;
  }
}

async function testPostEndpoint(sampleLog) {
  log('\n=== TEST 2: POST /patients/access-logs ===', 'cyan');
  
  try {
    if (!sampleLog) {
      log('  ⚠ Skipping POST test - no sample data', 'yellow');
      return null;
    }
    
    log('2.1 Testing POST create...', 'yellow');
    const createResponse = await axios.post(
      `${API_BASE_URL}/patients/access-logs`,
      {
        patientId: sampleLog.patientId,
        userId: sampleLog.userId,
        accessType: 'VIEW',
        accessMethod: 'API',
        reason: 'Test creation from PR test script',
      },
      {
        headers: { Authorization: `Bearer ${authToken}` },
        validateStatus: () => true,
      }
    );
    
    if (createResponse.status === 201 || createResponse.status === 200) {
      log('  ✓ POST create works', 'green');
      log(`  Created log ID: ${createResponse.data.id}`, 'cyan');
      testResults.post.passed++;
      return createResponse.data;
    } else {
      log(`  ✗ POST create failed: Status ${createResponse.status}`, 'red');
      log(`  Response: ${JSON.stringify(createResponse.data).substring(0, 200)}`, 'red');
      testResults.post.failed++;
      return null;
    }
  } catch (error) {
    log(`  ✗ POST endpoint failed: ${error.message}`, 'red');
    if (error.response) {
      log(`  Status: ${error.response.status}`, 'red');
      log(`  Data: ${JSON.stringify(error.response.data).substring(0, 200)}`, 'red');
    }
    testResults.post.failed++;
    return null;
  }
}

async function testPutEndpoint(createdLog) {
  log('\n=== TEST 3: PUT /patients/access-logs/:logId ===', 'cyan');
  
  try {
    if (!createdLog) {
      log('  ⚠ Skipping PUT test - no created log', 'yellow');
      return;
    }
    
    log('3.1 Testing PUT update...', 'yellow');
    const updateResponse = await axios.put(
      `${API_BASE_URL}/patients/access-logs/${createdLog.id}`,
      {
        reason: 'Updated reason from PR test script',
        accessType: 'UPDATE',
      },
      {
        headers: { Authorization: `Bearer ${authToken}` },
        validateStatus: () => true,
      }
    );
    
    if (updateResponse.status === 200) {
      log('  ✓ PUT update works', 'green');
      log(`  Updated reason: ${updateResponse.data.reason}`, 'cyan');
      log(`  Updated accessType: ${updateResponse.data.accessType}`, 'cyan');
      testResults.put.passed++;
    } else {
      log(`  ✗ PUT update failed: Status ${updateResponse.status}`, 'red');
      log(`  Response: ${JSON.stringify(updateResponse.data).substring(0, 200)}`, 'red');
      testResults.put.failed++;
    }
  } catch (error) {
    log(`  ✗ PUT endpoint failed: ${error.message}`, 'red');
    if (error.response) {
      log(`  Status: ${error.response.status}`, 'red');
      log(`  Data: ${JSON.stringify(error.response.data).substring(0, 200)}`, 'red');
    }
    testResults.put.failed++;
  }
}

async function runAllTests() {
  log('\n' + '='.repeat(70), 'blue');
  log('PATIENT ACCESS LOGS - COMPLETE ENDPOINT TEST SUITE', 'blue');
  log('='.repeat(70), 'blue');
  
  if (!(await login())) {
    log('\nCannot proceed without authentication', 'red');
    process.exit(1);
  }
  
  const sampleLog = await testGetEndpoint();
  const createdLog = await testPostEndpoint(sampleLog);
  await testPutEndpoint(createdLog);
  
  // Summary
  log('\n' + '='.repeat(70), 'blue');
  log('TEST SUMMARY', 'blue');
  log('='.repeat(70), 'blue');
  
  const totalPassed = testResults.get.passed + testResults.post.passed + testResults.put.passed;
  const totalFailed = testResults.get.failed + testResults.post.failed + testResults.put.failed;
  const totalTests = totalPassed + totalFailed;
  
  log(`\nGET Endpoint:  ${testResults.get.passed} passed, ${testResults.get.failed} failed`, 
      testResults.get.failed === 0 ? 'green' : 'yellow');
  log(`POST Endpoint: ${testResults.post.passed} passed, ${testResults.post.failed} failed`, 
      testResults.post.failed === 0 ? 'green' : 'yellow');
  log(`PUT Endpoint:  ${testResults.put.passed} passed, ${testResults.put.failed} failed`, 
      testResults.put.failed === 0 ? 'green' : 'yellow');
  
  log(`\nTotal: ${totalPassed} passed, ${totalFailed} failed`, 
      totalFailed === 0 ? 'green' : 'red');
  log(`Success Rate: ${((totalPassed / totalTests) * 100).toFixed(1)}%`, 
      totalFailed === 0 ? 'green' : 'yellow');
  
  if (totalFailed === 0) {
    log('\n✓ All endpoints working correctly!', 'green');
    process.exit(0);
  } else {
    log('\n⚠ Some tests failed. Review errors above.', 'yellow');
    process.exit(1);
  }
}

runAllTests().catch(error => {
  log('\nFATAL ERROR:', 'red');
  console.error(error);
  process.exit(1);
});

