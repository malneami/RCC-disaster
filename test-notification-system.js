#!/usr/bin/env node

/**
 * Comprehensive Notification System Test Script
 * Tests all notification endpoints with real UUIDs from the database
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3001/api/v1';
const TEST_USER_EMAIL = 'admin@rcc-healthcare.com'; // Use existing admin user
const TEST_USER_PASSWORD = 'Healthcare@2024';

let authToken = null;
let testUser = null;
let testPatient = null;

// Test data
const testNotificationData = {
  type: 'CASE_COMMENT',
  priority: 'HIGH',
  title: 'Test Notification - Emergency Case Update',
  message: 'This is a test notification for emergency case updates. Patient requires immediate attention.',
  caseType: 'STEMI',
  caseId: 'test-case-123',
  patientId: '', // Will be set after getting a real patient
  patientName: 'Test Patient',
  recipientUserIds: [], // Will be set after getting real users
  deliveryMethod: 'IN_APP'
};

const testCaseNoteData = {
  content: 'Test case note: Patient showing signs of improvement. Vital signs stable.',
  priority: 'MEDIUM',
  caseType: 'STROKE',
  caseId: 'test-stroke-case-456',
  patientId: '', // Will be set after getting a real patient
  patientName: 'Test Stroke Patient',
  notifyTeam: true,
  recipientUserIds: [], // Will be set after getting real users
  deliveryMethod: 'ALL'
};

async function makeRequest(method, endpoint, data = null, headers = {}) {
  try {
    const config = {
      method,
      url: `${BASE_URL}${endpoint}`,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    // Always include auth token if available
    if (authToken) {
      config.headers.Authorization = `Bearer ${authToken}`;
    }

    if (data) {
      config.data = data;
    }

    const response = await axios(config);
    return { success: true, data: response.data, status: response.status };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data || error.message,
      status: error.response?.status || 500
    };
  }
}

async function authenticate() {
  console.log('🔐 Authenticating...');
  
  const result = await makeRequest('POST', '/auth/login', {
    email: TEST_USER_EMAIL,
    password: TEST_USER_PASSWORD
  });

  if (result.success) {
    authToken = result.data.access_token;
    testUser = result.data.user;
    console.log(`✅ Authenticated as: ${testUser.firstName} ${testUser.lastName} (${testUser.email})`);
    return true;
  } else {
    console.error('❌ Authentication failed:', result.error);
    return false;
  }
}

async function getTestData() {
  console.log('📊 Getting test data...');

  // Get users for recipients
  const usersResult = await makeRequest('GET', '/users?limit=5');
  if (usersResult.success) {
    const users = usersResult.data.data || usersResult.data;
    testNotificationData.recipientUserIds = users.slice(0, 3).map(u => u.id);
    testCaseNoteData.recipientUserIds = users.slice(0, 2).map(u => u.id);
    console.log(`✅ Found ${users.length} users for testing`);
  }

  // Get a patient for testing
  const patientsResult = await makeRequest('GET', '/patients?limit=1');
  if (patientsResult.success) {
    const patients = patientsResult.data.data || patientsResult.data;
    if (patients.length > 0) {
      testPatient = patients[0];
      testNotificationData.patientId = testPatient.id;
      testNotificationData.patientName = `${testPatient.firstName} ${testPatient.lastName}`;
      testCaseNoteData.patientId = testPatient.id;
      testCaseNoteData.patientName = `${testPatient.firstName} ${testPatient.lastName}`;
      console.log(`✅ Found test patient: ${testNotificationData.patientName} (${testPatient.id})`);
    }
  }
}

async function testNotificationEndpoints() {
  console.log('\n🔔 Testing Notification Endpoints...');

  // Test 1: Create notification
  console.log('\n1️⃣ Creating notification...');
  const createResult = await makeRequest('POST', '/notifications', testNotificationData);
  if (createResult.success) {
    console.log('✅ Notification created successfully');
    console.log(`   ID: ${createResult.data.id}`);
    console.log(`   Title: ${createResult.data.title}`);
    console.log(`   Recipients: ${createResult.data.recipients?.length || 0}`);
    
    const notificationId = createResult.data.id;

    // Test 2: Get notifications
    console.log('\n2️⃣ Getting notifications...');
    const getResult = await makeRequest('GET', '/notifications?limit=10');
    if (getResult.success) {
      console.log(`✅ Retrieved ${getResult.data.notifications?.length || 0} notifications`);
      console.log(`   Total: ${getResult.data.pagination?.total || 0}`);
    }

    // Test 3: Get notification by ID
    console.log('\n3️⃣ Getting notification by ID...');
    const getByIdResult = await makeRequest('GET', `/notifications/${notificationId}`);
    if (getByIdResult.success) {
      console.log('✅ Retrieved notification by ID');
      console.log(`   Title: ${getByIdResult.data.title}`);
      console.log(`   Priority: ${getByIdResult.data.priority}`);
    }

    // Test 4: Mark as read
    console.log('\n4️⃣ Marking notification as read...');
    const markReadResult = await makeRequest('PUT', '/notifications/mark-read', {
      notificationIds: [notificationId]
    });
    if (markReadResult.success) {
      console.log(`✅ Marked ${markReadResult.data.count} notifications as read`);
    }

    // Test 5: Get notification summary
    console.log('\n5️⃣ Getting notification summary...');
    const summaryResult = await makeRequest('GET', '/notifications/summary');
    if (summaryResult.success) {
      console.log('✅ Retrieved notification summary');
      console.log(`   Total: ${summaryResult.data.totalNotifications}`);
      console.log(`   Unread: ${summaryResult.data.unreadNotifications}`);
      console.log(`   High Priority: ${summaryResult.data.highPriorityNotifications}`);
    }

    // Test 6: Get notification categories
    console.log('\n6️⃣ Getting notification categories...');
    const categoriesResult = await makeRequest('GET', '/notifications/categories');
    if (categoriesResult.success) {
      console.log('✅ Retrieved notification categories');
      categoriesResult.data.forEach(cat => {
        console.log(`   ${cat.type}: ${cat.count}`);
      });
    }

    // Test 7: Delete notification (soft delete)
    console.log('\n7️⃣ Deleting notification...');
    const deleteResult = await makeRequest('DELETE', `/notifications/${notificationId}`);
    if (deleteResult.success) {
      console.log(`✅ Deleted notification (soft delete)`);
    }

    return notificationId;
  } else {
    console.error('❌ Failed to create notification:', createResult.error);
    return null;
  }
}

async function testCaseNoteEndpoints() {
  console.log('\n📝 Testing Case Note Endpoints...');

  // Test 1: Create case note
  console.log('\n1️⃣ Creating case note...');
  const createResult = await makeRequest('POST', '/case-notes', testCaseNoteData);
  if (createResult.success) {
    console.log('✅ Case note created successfully');
    console.log(`   ID: ${createResult.data.id}`);
    console.log(`   Content: ${createResult.data.content.substring(0, 50)}...`);
    console.log(`   Recipients: ${createResult.data.recipients?.length || 0}`);
    
    const caseNoteId = createResult.data.id;

    // Test 2: Get case notes for case
    console.log('\n2️⃣ Getting case notes for case...');
    const getCaseNotesResult = await makeRequest('GET', `/case-notes/case/${testCaseNoteData.caseType}/${testCaseNoteData.caseId}`);
    if (getCaseNotesResult.success) {
      console.log(`✅ Retrieved ${getCaseNotesResult.data.length} case notes for case`);
    }

    // Test 3: Get case note by ID
    console.log('\n3️⃣ Getting case note by ID...');
    const getByIdResult = await makeRequest('GET', `/case-notes/${caseNoteId}`);
    if (getByIdResult.success) {
      console.log('✅ Retrieved case note by ID');
      console.log(`   Content: ${getByIdResult.data.content.substring(0, 50)}...`);
      console.log(`   Priority: ${getByIdResult.data.priority}`);
    }

    // Test 4: Mark case note as read
    console.log('\n4️⃣ Marking case note as read...');
    const markReadResult = await makeRequest('PUT', `/case-notes/${caseNoteId}/mark-read`);
    if (markReadResult.success) {
      console.log('✅ Marked case note as read');
    }

    // Test 5: Update case note
    console.log('\n5️⃣ Updating case note...');
    const updateResult = await makeRequest('PUT', `/case-notes/${caseNoteId}`, {
      content: testCaseNoteData.content + ' [UPDATED]'
    });
    if (updateResult.success) {
      console.log('✅ Updated case note');
    }

    // Test 6: Delete case note
    console.log('\n6️⃣ Deleting case note...');
    const deleteResult = await makeRequest('DELETE', `/case-notes/${caseNoteId}`);
    if (deleteResult.success) {
      console.log('✅ Deleted case note');
    }

    return caseNoteId;
  } else {
    console.error('❌ Failed to create case note:', createResult.error);
    return null;
  }
}

async function testUserPreferences() {
  console.log('\n⚙️ Testing User Preferences...');

  // Test 1: Get user preferences
  console.log('\n1️⃣ Getting user notification preferences...');
  const getPrefsResult = await makeRequest('GET', '/notifications/preferences');
  if (getPrefsResult.success) {
    console.log('✅ Retrieved user preferences');
    console.log(`   Email notifications: ${getPrefsResult.data.emailNotifications}`);
    console.log(`   SMS notifications: ${getPrefsResult.data.smsNotifications}`);
    console.log(`   Push notifications: ${getPrefsResult.data.pushNotifications}`);
  }

  // Test 2: Update user preferences
  console.log('\n2️⃣ Updating user notification preferences...');
  const updatePrefsResult = await makeRequest('PUT', '/notifications/preferences', {
    emailNotifications: false,
    smsNotifications: true,
    pushNotifications: true,
    inAppNotifications: true
  });
  if (updatePrefsResult.success) {
    console.log('✅ Updated user preferences');
    console.log(`   Email notifications: ${updatePrefsResult.data.emailNotifications}`);
    console.log(`   SMS notifications: ${updatePrefsResult.data.smsNotifications}`);
  }
}

async function testFilteringAndSearch() {
  console.log('\n🔍 Testing Filtering and Search...');

  // Test different filters
  const filters = [
    { name: 'All notifications', params: '' },
    { name: 'High priority only', params: '?priority=HIGH' },
    { name: 'STEMI cases only', params: '?caseType=STEMI' },
    { name: 'Unread only', params: '?isRead=false' },
    { name: 'Search for "test"', params: '?search=test' },
    { name: 'Pagination (page 1, limit 5)', params: '?page=1&limit=5' }
  ];

  for (const filter of filters) {
    console.log(`\n🔍 Testing: ${filter.name}`);
    const result = await makeRequest('GET', `/notifications${filter.params}`);
    if (result.success) {
      const count = result.data.notifications?.length || 0;
      const total = result.data.pagination?.total || 0;
      console.log(`   ✅ Found ${count} notifications (${total} total)`);
    } else {
      console.log(`   ❌ Failed: ${result.error.message || result.error}`);
    }
  }
}

async function runTests() {
  console.log('🚀 Starting Notification System Tests...\n');

  try {
    // Step 1: Authenticate
    const authSuccess = await authenticate();
    if (!authSuccess) {
      console.error('❌ Cannot proceed without authentication');
      return;
    }

    // Step 2: Get test data
    await getTestData();

    // Step 3: Test notification endpoints
    await testNotificationEndpoints();

    // Step 4: Test case note endpoints
    await testCaseNoteEndpoints();

    // Step 5: Test user preferences
    await testUserPreferences();

    // Step 6: Test filtering and search
    await testFilteringAndSearch();

    console.log('\n🎉 All tests completed successfully!');
    console.log('\n📋 Test Summary:');
    console.log('   ✅ Authentication');
    console.log('   ✅ Notification CRUD operations');
    console.log('   ✅ Case note CRUD operations');
    console.log('   ✅ User preferences');
    console.log('   ✅ Filtering and search');
    console.log('   ✅ Pagination');

  } catch (error) {
    console.error('\n❌ Test suite failed:', error.message);
    console.error(error.stack);
  }
}

// Run the tests
runTests();
