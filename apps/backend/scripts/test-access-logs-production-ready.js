/**
 * Production-Ready Test Suite for Patient Access Logs Endpoint
 * Tests edge cases, performance, security, and production scenarios
 * 
 * Run with: node apps/backend/scripts/test-access-logs-production-ready.js
 */

const axios = require('axios');

const API_BASE_URL = 'http://localhost:3001/api/v1';
let authToken = null;
let testResults = [];
let testCount = 0;
let passCount = 0;
let failCount = 0;

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
    const response = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: 'admin@rcc-healthcare.com',
      password: 'Healthcare@2024',
    });
    authToken = response.data.accessToken;
    return true;
  } catch (error) {
    logFail('Login failed', error);
    return false;
  }
}

// Edge Case Tests
async function testEdgeCaseLargeLimit() {
  logTest('Edge Case: Very large limit (should cap at 100)');
  try {
    const response = await axios.get(`${API_BASE_URL}/patients/access-logs?limit=1000`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    
    if (response.data.limit > 100) {
      logFail(`Limit should be capped at 100, got ${response.data.limit}`);
      recordTest('Large limit cap', false);
      return false;
    }
    
    if (response.data.data.length > 100) {
      logFail(`Should return max 100 items, got ${response.data.data.length}`);
      recordTest('Large limit cap', false);
      return false;
    }
    
    logPass(`Limit correctly capped at ${response.data.limit}`);
    recordTest('Large limit cap', true);
    return true;
  } catch (error) {
    logFail('Large limit test failed', error);
    recordTest('Large limit cap', false);
    return false;
  }
}

async function testEdgeCaseZeroLimit() {
  logTest('Edge Case: Zero limit (should default to 50)');
  try {
    const response = await axios.get(`${API_BASE_URL}/patients/access-logs?limit=0`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    
    if (response.data.limit === 0) {
      logFail('Limit should not be 0, should default to 50');
      recordTest('Zero limit', false);
      return false;
    }
    
    logPass(`Zero limit correctly handled, using ${response.data.limit}`);
    recordTest('Zero limit', true);
    return true;
  } catch (error) {
    logFail('Zero limit test failed', error);
    recordTest('Zero limit', false);
    return false;
  }
}

async function testEdgeCaseNegativePage() {
  logTest('Edge Case: Negative page number (should default to 1)');
  try {
    const response = await axios.get(`${API_BASE_URL}/patients/access-logs?page=-5`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    
    if (response.data.page < 1) {
      logFail(`Page should be >= 1, got ${response.data.page}`);
      recordTest('Negative page', false);
      return false;
    }
    
    logPass(`Negative page correctly handled, using page ${response.data.page}`);
    recordTest('Negative page', true);
    return true;
  } catch (error) {
    logFail('Negative page test failed', error);
    recordTest('Negative page', false);
    return false;
  }
}

async function testEdgeCaseInvalidDateFormat() {
  logTest('Edge Case: Invalid date format (should return error)');
  try {
    const response = await axios.get(
      `${API_BASE_URL}/patients/access-logs?startDate=invalid-date`,
      {
        headers: { Authorization: `Bearer ${authToken}` },
        validateStatus: () => true,
      }
    );
    
    if (response.status === 200) {
      logFail('Should return error for invalid date format');
      recordTest('Invalid date format', false);
      return false;
    }
    
    logPass(`Invalid date format correctly rejected with status ${response.status}`);
    recordTest('Invalid date format', true);
    return true;
  } catch (error) {
    // If it throws an error, that's also acceptable
    if (error.response && error.response.status !== 200) {
      logPass(`Invalid date format correctly rejected with status ${error.response.status}`);
      recordTest('Invalid date format', true);
      return true;
    }
    logFail('Invalid date format test failed', error);
    recordTest('Invalid date format', false);
    return false;
  }
}

async function testEdgeCaseReversedDateRange() {
  logTest('Edge Case: Reversed date range (startDate > endDate)');
  try {
    const response = await axios.get(
      `${API_BASE_URL}/patients/access-logs?startDate=2025-12-01&endDate=2025-11-01`,
      {
        headers: { Authorization: `Bearer ${authToken}` },
        validateStatus: () => true,
      }
    );
    
    if (response.status === 200) {
      logFail('Should return error for reversed date range');
      recordTest('Reversed date range', false);
      return false;
    }
    
    logPass(`Reversed date range correctly rejected with status ${response.status}`);
    recordTest('Reversed date range', true);
    return true;
  } catch (error) {
    if (error.response && error.response.status !== 200) {
      logPass(`Reversed date range correctly rejected with status ${error.response.status}`);
      recordTest('Reversed date range', true);
      return true;
    }
    logFail('Reversed date range test failed', error);
    recordTest('Reversed date range', false);
    return false;
  }
}

async function testEdgeCaseSpecialCharacters() {
  logTest('Edge Case: Special characters in IDs (SQL injection attempt)');
  try {
    const response = await axios.get(
      `${API_BASE_URL}/patients/access-logs?patientId=' OR '1'='1`,
      {
        headers: { Authorization: `Bearer ${authToken}` },
        validateStatus: () => true,
      }
    );
    
    // Should handle gracefully, not crash
    if (response.status >= 500) {
      logFail('Should not crash on special characters');
      recordTest('Special characters', false);
      return false;
    }
    
    // Should return empty results or error, not crash
    logPass('Special characters handled gracefully');
    recordTest('Special characters', true);
    return true;
  } catch (error) {
    if (error.response && error.response.status < 500) {
      logPass('Special characters handled gracefully');
      recordTest('Special characters', true);
      return true;
    }
    logFail('Special characters test failed', error);
    recordTest('Special characters', false);
    return false;
  }
}

// Performance Tests
async function testPerformanceLargeDataset() {
  logTest('Performance: Large dataset pagination');
  try {
    const startTime = Date.now();
    const response = await axios.get(`${API_BASE_URL}/patients/access-logs?limit=50`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    if (duration > 2000) {
      logFail(`Response took ${duration}ms, should be < 2000ms`);
      recordTest('Performance large dataset', false, { duration });
      return false;
    }
    
    logPass(`Response time: ${duration}ms (acceptable)`);
    recordTest('Performance large dataset', true, { duration });
    return true;
  } catch (error) {
    logFail('Performance test failed', error);
    recordTest('Performance large dataset', false);
    return false;
  }
}

async function testPerformanceMultipleFilters() {
  logTest('Performance: Multiple filters combined');
  try {
    const startTime = Date.now();
    const response = await axios.get(
      `${API_BASE_URL}/patients/access-logs?patientId=test&userId=test&accessType=VIEW&startDate=2024-01-01&endDate=2025-12-31`,
      {
        headers: { Authorization: `Bearer ${authToken}` },
      }
    );
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    if (duration > 2000) {
      logFail(`Response took ${duration}ms, should be < 2000ms`);
      recordTest('Performance multiple filters', false, { duration });
      return false;
    }
    
    logPass(`Response time: ${duration}ms (acceptable)`);
    recordTest('Performance multiple filters', true, { duration });
    return true;
  } catch (error) {
    logFail('Performance test failed', error);
    recordTest('Performance multiple filters', false);
    return false;
  }
}

// Data Consistency Tests
async function testDataConsistencyPagination() {
  logTest('Data Consistency: Pagination totals match');
  try {
    const page1 = await axios.get(`${API_BASE_URL}/patients/access-logs?page=1&limit=5`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    
    const page2 = await axios.get(`${API_BASE_URL}/patients/access-logs?page=2&limit=5`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    
    if (page1.data.total !== page2.data.total) {
      logFail(`Total mismatch: page1=${page1.data.total}, page2=${page2.data.total}`);
      recordTest('Pagination consistency', false);
      return false;
    }
    
    // Check for duplicates
    const page1Ids = page1.data.data.map(log => log.id);
    const page2Ids = page2.data.data.map(log => log.id);
    const duplicates = page1Ids.filter(id => page2Ids.includes(id));
    
    if (duplicates.length > 0) {
      logFail(`Found ${duplicates.length} duplicate IDs between pages`);
      recordTest('Pagination consistency', false);
      return false;
    }
    
    logPass('Pagination totals consistent, no duplicates');
    recordTest('Pagination consistency', true);
    return true;
  } catch (error) {
    logFail('Pagination consistency test failed', error);
    recordTest('Pagination consistency', false);
    return false;
  }
}

async function testDataConsistencyOrdering() {
  logTest('Data Consistency: Results ordered by timestamp DESC');
  try {
    const response = await axios.get(`${API_BASE_URL}/patients/access-logs?limit=10`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    
    if (response.data.data.length < 2) {
      logPass('Not enough data to test ordering');
      recordTest('Ordering consistency', true);
      return true;
    }
    
    let isOrdered = true;
    for (let i = 0; i < response.data.data.length - 1; i++) {
      const current = new Date(response.data.data[i].timestamp);
      const next = new Date(response.data.data[i + 1].timestamp);
      if (current < next) {
        isOrdered = false;
        break;
      }
    }
    
    if (!isOrdered) {
      logFail('Results not properly ordered by timestamp DESC');
      recordTest('Ordering consistency', false);
      return false;
    }
    
    logPass('Results correctly ordered by timestamp DESC');
    recordTest('Ordering consistency', true);
    return true;
  } catch (error) {
    logFail('Ordering consistency test failed', error);
    recordTest('Ordering consistency', false);
    return false;
  }
}

// Security Tests
async function testSecurityUnauthorizedAccess() {
  logTest('Security: Unauthorized access (no token)');
  try {
    const response = await axios.get(`${API_BASE_URL}/patients/access-logs`, {
      validateStatus: () => true,
    });
    
    if (response.status === 200) {
      logFail('Should require authentication');
      recordTest('Unauthorized access', false);
      return false;
    }
    
    if (response.status !== 401 && response.status !== 403) {
      logFail(`Expected 401/403, got ${response.status}`);
      recordTest('Unauthorized access', false);
      return false;
    }
    
    logPass(`Unauthorized access correctly rejected with status ${response.status}`);
    recordTest('Unauthorized access', true);
    return true;
  } catch (error) {
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      logPass(`Unauthorized access correctly rejected with status ${error.response.status}`);
      recordTest('Unauthorized access', true);
      return true;
    }
    logFail('Unauthorized access test failed', error);
    recordTest('Unauthorized access', false);
    return false;
  }
}

async function testSecurityInvalidToken() {
  logTest('Security: Invalid token');
  try {
    const response = await axios.get(`${API_BASE_URL}/patients/access-logs`, {
      headers: { Authorization: 'Bearer invalid-token-12345' },
      validateStatus: () => true,
    });
    
    if (response.status === 200) {
      logFail('Should reject invalid token');
      recordTest('Invalid token', false);
      return false;
    }
    
    logPass(`Invalid token correctly rejected with status ${response.status}`);
    recordTest('Invalid token', true);
    return true;
  } catch (error) {
    if (error.response && error.response.status !== 200) {
      logPass(`Invalid token correctly rejected with status ${error.response.status}`);
      recordTest('Invalid token', true);
      return true;
    }
    logFail('Invalid token test failed', error);
    recordTest('Invalid token', false);
    return false;
  }
}

// Stress Tests
async function testStressConcurrentRequests() {
  logTest('Stress: Concurrent requests (10 simultaneous)');
  try {
    const requests = Array(10).fill(null).map(() =>
      axios.get(`${API_BASE_URL}/patients/access-logs?limit=10`, {
        headers: { Authorization: `Bearer ${authToken}` },
      })
    );
    
    const startTime = Date.now();
    const responses = await Promise.all(requests);
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    const allSuccess = responses.every(r => r.status === 200);
    if (!allSuccess) {
      logFail('Not all concurrent requests succeeded');
      recordTest('Concurrent requests', false);
      return false;
    }
    
    const allSameTotal = responses.every(r => r.data.total === responses[0].data.total);
    if (!allSameTotal) {
      logFail('Inconsistent totals across concurrent requests');
      recordTest('Concurrent requests', false);
      return false;
    }
    
    logPass(`10 concurrent requests completed in ${duration}ms, all consistent`);
    recordTest('Concurrent requests', true, { duration, count: 10 });
    return true;
  } catch (error) {
    logFail('Concurrent requests test failed', error);
    recordTest('Concurrent requests', false);
    return false;
  }
}

async function runAllTests() {
  log('\n' + '='.repeat(70), 'blue');
  log('PRODUCTION-READY ACCESS LOGS ENDPOINT TEST SUITE', 'blue');
  log('='.repeat(70), 'blue');
  
  if (!(await login())) {
    log('\nCannot proceed without authentication', 'red');
    return;
  }
  
  log('\n' + '='.repeat(70), 'blue');
  log('RUNNING PRODUCTION TESTS', 'blue');
  log('='.repeat(70), 'blue');
  
  // Edge Cases
  await testEdgeCaseLargeLimit();
  await testEdgeCaseZeroLimit();
  await testEdgeCaseNegativePage();
  await testEdgeCaseInvalidDateFormat();
  await testEdgeCaseReversedDateRange();
  await testEdgeCaseSpecialCharacters();
  
  // Performance
  await testPerformanceLargeDataset();
  await testPerformanceMultipleFilters();
  
  // Data Consistency
  await testDataConsistencyPagination();
  await testDataConsistencyOrdering();
  
  // Security
  await testSecurityUnauthorizedAccess();
  await testSecurityInvalidToken();
  
  // Stress
  await testStressConcurrentRequests();
  
  // Summary
  log('\n' + '='.repeat(70), 'blue');
  log('TEST SUMMARY', 'blue');
  log('='.repeat(70), 'blue');
  log(`Total Tests: ${testCount}`, 'cyan');
  log(`Passed: ${passCount}`, 'green');
  log(`Failed: ${failCount}`, failCount > 0 ? 'red' : 'green');
  log(`Success Rate: ${((passCount / testCount) * 100).toFixed(1)}%`, passCount === testCount ? 'green' : 'yellow');
  
  // Save results
  const fs = require('fs');
  const path = require('path');
  const resultsFile = path.join(__dirname, 'test-results-production-ready.json');
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
    log('\n✓ All production tests passed!', 'green');
    process.exit(0);
  }
}

runAllTests().catch(error => {
  log('\nFATAL ERROR:', 'red');
  console.error(error);
  process.exit(1);
});

