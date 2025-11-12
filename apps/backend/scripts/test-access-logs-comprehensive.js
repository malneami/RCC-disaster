/**
 * Comprehensive Test Suite for Patient Access Logs Endpoint
 * Tests all scenarios: filters, pagination, edge cases, data integrity
 * 
 * Run with: node apps/backend/scripts/test-access-logs-comprehensive.js
 */

const axios = require('axios');

const API_BASE_URL = 'http://localhost:3001/api/v1';
let authToken = null;
let testResults = [];
let testCount = 0;
let passCount = 0;
let failCount = 0;

// Test data from DB
let samplePatientId = null;
let sampleUserId = null;
let sampleLogIds = [];

// Colors for console output
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

function logTest(name) {
  testCount++;
  log(`\n[TEST ${testCount}] ${name}`, 'cyan');
}

function logPass(message) {
  passCount++;
  log(`  ✓ PASS: ${message}`, 'green');
}

function logFail(message, error = null) {
  failCount++;
  log(`  ✗ FAIL: ${message}`, 'red');
  if (error) {
    log(`    Error: ${error.message || error}`, 'red');
    if (error.response) {
      log(`    Status: ${error.response.status}`, 'red');
      log(`    Data: ${JSON.stringify(error.response.data).substring(0, 200)}`, 'red');
    }
  }
}

function recordTest(name, passed, details = {}) {
  testResults.push({
    test: name,
    passed,
    timestamp: new Date().toISOString(),
    ...details,
  });
}

async function login() {
  try {
    log('\n=== AUTHENTICATION ===', 'blue');
    const response = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: 'admin@rcc-healthcare.com',
      password: 'Healthcare@2024',
    });
    authToken = response.data.accessToken;
    logPass('Login successful');
    return true;
  } catch (error) {
    logFail('Login failed', error);
    return false;
  }
}

async function fetchSampleData() {
  try {
    log('\n=== FETCHING SAMPLE DATA ===', 'blue');
    
    // Get some access logs to use as test data
    const logsResponse = await axios.get(`${API_BASE_URL}/patients/access-logs?limit=5`, {
      headers: { Authorization: `Bearer ${authToken}` },
      validateStatus: () => true,
    });
    
    if (logsResponse.status === 200 && logsResponse.data && logsResponse.data.data && logsResponse.data.data.length > 0) {
      const logs = logsResponse.data.data;
      samplePatientId = logs[0].patientId;
      sampleUserId = logs[0].userId;
      sampleLogIds = logs.map(log => log.id);
      logPass(`Found ${logs.length} sample logs`);
      log(`  Sample Patient ID: ${samplePatientId}`, 'yellow');
      log(`  Sample User ID: ${sampleUserId}`, 'yellow');
      return true;
    } else {
      logFail('Could not fetch sample data - endpoint may not be working');
      return false;
    }
  } catch (error) {
    logFail('Error fetching sample data', error);
    return false;
  }
}

async function testBasicEndpoint() {
  logTest('Basic endpoint - no filters');
  try {
    const response = await axios.get(`${API_BASE_URL}/patients/access-logs`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    
    // Validate response structure
    if (!response.data) {
      logFail('Response data is missing');
      recordTest('Basic endpoint', false, { error: 'No response data' });
      return false;
    }
    
    if (typeof response.data !== 'object') {
      logFail(`Response data is not an object: ${typeof response.data}`);
      recordTest('Basic endpoint', false, { error: `Invalid data type: ${typeof response.data}` });
      return false;
    }
    
    const requiredFields = ['data', 'total', 'page', 'limit', 'pages'];
    const missingFields = requiredFields.filter(field => !(field in response.data));
    
    if (missingFields.length > 0) {
      logFail(`Missing required fields: ${missingFields.join(', ')}`);
      recordTest('Basic endpoint', false, { error: `Missing fields: ${missingFields.join(', ')}` });
      return false;
    }
    
    if (!Array.isArray(response.data.data)) {
      logFail(`data field is not an array: ${typeof response.data.data}`);
      recordTest('Basic endpoint', false, { error: 'data is not an array' });
      return false;
    }
    
    logPass(`Response structure valid. Total: ${response.data.total}, Returned: ${response.data.data.length}`);
    recordTest('Basic endpoint', true, { total: response.data.total, returned: response.data.data.length });
    return true;
  } catch (error) {
    logFail('Basic endpoint test failed', error);
    recordTest('Basic endpoint', false, { error: error.message });
    return false;
  }
}

async function testPagination() {
  logTest('Pagination - page 1, limit 5');
  try {
    const response = await axios.get(`${API_BASE_URL}/patients/access-logs?page=1&limit=5`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    
    if (response.data.page !== 1) {
      logFail(`Expected page 1, got ${response.data.page}`);
      recordTest('Pagination page 1', false);
      return false;
    }
    
    if (response.data.limit !== 5) {
      logFail(`Expected limit 5, got ${response.data.limit}`);
      recordTest('Pagination limit 5', false);
      return false;
    }
    
    if (response.data.data.length > 5) {
      logFail(`Expected max 5 items, got ${response.data.data.length}`);
      recordTest('Pagination limit 5', false);
      return false;
    }
    
    logPass(`Page 1: ${response.data.data.length} items, Total: ${response.data.total}`);
    recordTest('Pagination page 1', true, { page: response.data.page, limit: response.data.limit, items: response.data.data.length });
    return true;
  } catch (error) {
    logFail('Pagination test failed', error);
    recordTest('Pagination page 1', false);
    return false;
  }
}

async function testPaginationPage2() {
  logTest('Pagination - page 2, limit 5');
  try {
    const response = await axios.get(`${API_BASE_URL}/patients/access-logs?page=2&limit=5`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    
    if (response.data.page !== 2) {
      logFail(`Expected page 2, got ${response.data.page}`);
      recordTest('Pagination page 2', false);
      return false;
    }
    
    logPass(`Page 2: ${response.data.data.length} items`);
    recordTest('Pagination page 2', true, { page: response.data.page, items: response.data.data.length });
    return true;
  } catch (error) {
    logFail('Pagination page 2 test failed', error);
    recordTest('Pagination page 2', false);
    return false;
  }
}

async function testFilterByPatientId() {
  if (!samplePatientId) {
    logTest('Filter by Patient ID - SKIPPED (no sample data)');
    return false;
  }
  
  logTest(`Filter by Patient ID: ${samplePatientId}`);
  try {
    const response = await axios.get(`${API_BASE_URL}/patients/access-logs?patientId=${samplePatientId}`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    
    const allMatch = response.data.data.every(log => log.patientId === samplePatientId);
    if (!allMatch) {
      logFail('Not all logs match the patient ID filter');
      recordTest('Filter by Patient ID', false);
      return false;
    }
    
    logPass(`Found ${response.data.data.length} logs for patient ${samplePatientId}`);
    recordTest('Filter by Patient ID', true, { count: response.data.data.length });
    return true;
  } catch (error) {
    logFail('Filter by Patient ID test failed', error);
    recordTest('Filter by Patient ID', false);
    return false;
  }
}

async function testFilterByUserId() {
  if (!sampleUserId) {
    logTest('Filter by User ID - SKIPPED (no sample data)');
    return false;
  }
  
  logTest(`Filter by User ID: ${sampleUserId}`);
  try {
    const response = await axios.get(`${API_BASE_URL}/patients/access-logs?userId=${sampleUserId}`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    
    const allMatch = response.data.data.every(log => log.userId === sampleUserId);
    if (!allMatch) {
      logFail('Not all logs match the user ID filter');
      recordTest('Filter by User ID', false);
      return false;
    }
    
    logPass(`Found ${response.data.data.length} logs for user ${sampleUserId}`);
    recordTest('Filter by User ID', true, { count: response.data.data.length });
    return true;
  } catch (error) {
    logFail('Filter by User ID test failed', error);
    recordTest('Filter by User ID', false);
    return false;
  }
}

async function testFilterByAccessType() {
  logTest('Filter by Access Type: VIEW');
  try {
    const response = await axios.get(`${API_BASE_URL}/patients/access-logs?accessType=VIEW`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    
    const allMatch = response.data.data.every(log => log.accessType === 'VIEW');
    if (!allMatch) {
      logFail('Not all logs match the access type filter');
      recordTest('Filter by Access Type', false);
      return false;
    }
    
    logPass(`Found ${response.data.data.length} VIEW logs`);
    recordTest('Filter by Access Type', true, { count: response.data.data.length });
    return true;
  } catch (error) {
    logFail('Filter by Access Type test failed', error);
    recordTest('Filter by Access Type', false);
    return false;
  }
}

async function testFilterByDateRange() {
  logTest('Filter by Date Range (last 30 days)');
  try {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);
    
    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];
    
    const response = await axios.get(
      `${API_BASE_URL}/patients/access-logs?startDate=${startDateStr}&endDate=${endDateStr}`,
      {
        headers: { Authorization: `Bearer ${authToken}` },
      }
    );
    
    const allInRange = response.data.data.every(log => {
      const logDate = new Date(log.timestamp);
      return logDate >= startDate && logDate <= endDate;
    });
    
    if (!allInRange) {
      logFail('Not all logs are within the date range');
      recordTest('Filter by Date Range', false);
      return false;
    }
    
    logPass(`Found ${response.data.data.length} logs in date range`);
    recordTest('Filter by Date Range', true, { count: response.data.data.length });
    return true;
  } catch (error) {
    logFail('Filter by Date Range test failed', error);
    recordTest('Filter by Date Range', false);
    return false;
  }
}

async function testCombinedFilters() {
  if (!samplePatientId) {
    logTest('Combined Filters - SKIPPED (no sample data)');
    return false;
  }
  
  logTest('Combined Filters: Patient ID + Access Type');
  try {
    const response = await axios.get(
      `${API_BASE_URL}/patients/access-logs?patientId=${samplePatientId}&accessType=VIEW`,
      {
        headers: { Authorization: `Bearer ${authToken}` },
      }
    );
    
    const allMatch = response.data.data.every(log => 
      log.patientId === samplePatientId && log.accessType === 'VIEW'
    );
    
    if (!allMatch) {
      logFail('Not all logs match the combined filters');
      recordTest('Combined Filters', false);
      return false;
    }
    
    logPass(`Found ${response.data.data.length} logs matching combined filters`);
    recordTest('Combined Filters', true, { count: response.data.data.length });
    return true;
  } catch (error) {
    logFail('Combined Filters test failed', error);
    recordTest('Combined Filters', false);
    return false;
  }
}

async function testDataIntegrity() {
  logTest('Data Integrity - Check all required fields');
  try {
    const response = await axios.get(`${API_BASE_URL}/patients/access-logs?limit=10`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    
    if (response.data.data.length === 0) {
      logPass('No logs to validate (empty result)');
      recordTest('Data Integrity', true, { note: 'Empty result' });
      return true;
    }
    
    const requiredFields = ['id', 'patientId', 'userId', 'accessType', 'accessMethod', 'timestamp'];
    const optionalFields = ['ipAddress', 'userAgent', 'reason', 'user', 'patient'];
    
    let allValid = true;
    const issues = [];
    
    response.data.data.forEach((log, index) => {
      // Check required fields
      requiredFields.forEach(field => {
        if (!(field in log)) {
          allValid = false;
          issues.push(`Log ${index}: Missing required field '${field}'`);
        }
      });
      
      // Check field types
      if (typeof log.id !== 'string') {
        allValid = false;
        issues.push(`Log ${index}: id is not a string`);
      }
      
      if (typeof log.timestamp !== 'string') {
        allValid = false;
        issues.push(`Log ${index}: timestamp is not a string`);
      }
      
      // Validate timestamp format
      if (isNaN(Date.parse(log.timestamp))) {
        allValid = false;
        issues.push(`Log ${index}: Invalid timestamp format`);
      }
      
      // Check user object structure if present
      if (log.user) {
        const userFields = ['id', 'firstName', 'lastName', 'email', 'role'];
        userFields.forEach(field => {
          if (!(field in log.user)) {
            allValid = false;
            issues.push(`Log ${index}: user object missing field '${field}'`);
          }
        });
      }
      
      // Check patient object structure if present
      if (log.patient) {
        const patientFields = ['id', 'firstName', 'lastName'];
        patientFields.forEach(field => {
          if (!(field in log.patient)) {
            allValid = false;
            issues.push(`Log ${index}: patient object missing field '${field}'`);
          }
        });
      }
    });
    
    if (!allValid) {
      logFail(`Data integrity issues found:\n${issues.slice(0, 5).join('\n')}`);
      recordTest('Data Integrity', false, { issues });
      return false;
    }
    
    logPass(`All ${response.data.data.length} logs have valid structure`);
    recordTest('Data Integrity', true, { validated: response.data.data.length });
    return true;
  } catch (error) {
    logFail('Data Integrity test failed', error);
    recordTest('Data Integrity', false);
    return false;
  }
}

async function testEmptyResults() {
  logTest('Empty Results - Filter that returns no results');
  try {
    // Use a date range far in the future
    const futureDate = new Date();
    futureDate.setFullYear(futureDate.getFullYear() + 10);
    const futureDateStr = futureDate.toISOString().split('T')[0];
    
    const response = await axios.get(
      `${API_BASE_URL}/patients/access-logs?startDate=${futureDateStr}`,
      {
        headers: { Authorization: `Bearer ${authToken}` },
      }
    );
    
    if (!Array.isArray(response.data.data)) {
      logFail('Response data is not an array');
      recordTest('Empty Results', false);
      return false;
    }
    
    if (response.data.total !== 0 && response.data.data.length !== 0) {
      logFail(`Expected empty results, got ${response.data.data.length} items`);
      recordTest('Empty Results', false);
      return false;
    }
    
    logPass('Empty results handled correctly');
    recordTest('Empty Results', true);
    return true;
  } catch (error) {
    logFail('Empty Results test failed', error);
    recordTest('Empty Results', false);
    return false;
  }
}

async function testInvalidFilters() {
  logTest('Invalid Filters - Should handle gracefully');
  try {
    // Test with invalid access type
    const response = await axios.get(
      `${API_BASE_URL}/patients/access-logs?accessType=INVALID_TYPE`,
      {
        headers: { Authorization: `Bearer ${authToken}` },
        validateStatus: () => true,
      }
    );
    
    // Should either return empty results or 400 error
    if (response.status === 200) {
      if (!Array.isArray(response.data.data)) {
        logFail('Response data is not an array');
        recordTest('Invalid Filters', false);
        return false;
      }
      logPass('Invalid filter handled gracefully (empty results)');
      recordTest('Invalid Filters', true);
      return true;
    } else if (response.status === 400) {
      logPass('Invalid filter returns 400 error as expected');
      recordTest('Invalid Filters', true);
      return true;
    } else {
      logFail(`Unexpected status: ${response.status}`);
      recordTest('Invalid Filters', false);
      return false;
    }
  } catch (error) {
    logFail('Invalid Filters test failed', error);
    recordTest('Invalid Filters', false);
    return false;
  }
}

async function testResponseHeaders() {
  logTest('Response Headers - Content-Type should be application/json');
  try {
    const response = await axios.get(`${API_BASE_URL}/patients/access-logs`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    
    const contentType = response.headers['content-type'];
    if (contentType && contentType.includes('application/json')) {
      logPass(`Content-Type header correct: ${contentType}`);
      recordTest('Response Headers', true);
      return true;
    } else {
      logFail(`Content-Type header missing or incorrect: ${contentType || 'undefined'}`);
      recordTest('Response Headers', false, { contentType });
      return false;
    }
  } catch (error) {
    logFail('Response Headers test failed', error);
    recordTest('Response Headers', false);
    return false;
  }
}

async function runAllTests() {
  log('\n' + '='.repeat(60), 'blue');
  log('COMPREHENSIVE ACCESS LOGS ENDPOINT TEST SUITE', 'blue');
  log('='.repeat(60), 'blue');
  
  // Step 1: Login
  if (!(await login())) {
    log('\nCannot proceed without authentication', 'red');
    return;
  }
  
  // Step 2: Fetch sample data
  await fetchSampleData();
  
  // Step 3: Run all tests
  log('\n' + '='.repeat(60), 'blue');
  log('RUNNING TESTS', 'blue');
  log('='.repeat(60), 'blue');
  
  await testBasicEndpoint();
  await testPagination();
  await testPaginationPage2();
  await testFilterByPatientId();
  await testFilterByUserId();
  await testFilterByAccessType();
  await testFilterByDateRange();
  await testCombinedFilters();
  await testDataIntegrity();
  await testEmptyResults();
  await testInvalidFilters();
  await testResponseHeaders();
  
  // Summary
  log('\n' + '='.repeat(60), 'blue');
  log('TEST SUMMARY', 'blue');
  log('='.repeat(60), 'blue');
  log(`Total Tests: ${testCount}`, 'cyan');
  log(`Passed: ${passCount}`, 'green');
  log(`Failed: ${failCount}`, failCount > 0 ? 'red' : 'green');
  log(`Success Rate: ${((passCount / testCount) * 100).toFixed(1)}%`, passCount === testCount ? 'green' : 'yellow');
  
  // Save test results
  const fs = require('fs');
  const path = require('path');
  const resultsFile = path.join(__dirname, 'test-results-access-logs.json');
  const resultsDir = path.dirname(resultsFile);
  if (!fs.existsSync(resultsDir)) {
    fs.mkdirSync(resultsDir, { recursive: true });
  }
  fs.writeFileSync(resultsFile, JSON.stringify({
    timestamp: new Date().toISOString(),
    summary: {
      total: testCount,
      passed: passCount,
      failed: failCount,
      successRate: ((passCount / testCount) * 100).toFixed(1) + '%',
    },
    tests: testResults,
  }, null, 2));
  
  log(`\nTest results saved to: ${resultsFile}`, 'cyan');
  
  if (failCount > 0) {
    log('\n⚠️  Some tests failed. Review the errors above.', 'yellow');
    process.exit(1);
  } else {
    log('\n✓ All tests passed!', 'green');
    process.exit(0);
  }
}

// Run tests
runAllTests().catch(error => {
  log('\nFATAL ERROR:', 'red');
  console.error(error);
  process.exit(1);
});
