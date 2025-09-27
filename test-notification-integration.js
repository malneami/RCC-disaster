const axios = require('axios');

// Configuration
const API_BASE_URL = 'http://localhost:3001/api/v1';
const FRONTEND_URL = 'http://localhost:5173';

// Test data
const TEST_USER = {
  email: 'admin@rcc-healthcare.com',
  password: 'Healthcare@2024'
};

let authToken = null;
let testNotificationId = null;
let testUserId = null;
let testPatientId = null;

// Utility functions
const makeRequest = async (method, url, data = null, headers = {}) => {
  try {
    const config = {
      method,
      url: `${API_BASE_URL}${url}`,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    if (authToken) {
      config.headers.Authorization = `Bearer ${authToken}`;
    }

    if (data) {
      config.data = data;
    }

    const response = await axios(config);
    return response.data;
  } catch (error) {
    console.error(`❌ Request failed: ${method} ${url}`);
    console.error('Error details:', {
      status: error.response?.status,
      message: error.response?.data?.message || error.message,
      data: error.response?.data
    });
    throw error;
  }
};

// Test functions
const testAuthentication = async () => {
  console.log('\n🔐 Testing Authentication...');
  
  try {
    const response = await makeRequest('POST', '/auth/login', {
      email: TEST_USER.email,
      password: TEST_USER.password
    });
    
    authToken = response.accessToken;
    console.log('✅ Authentication successful');
    console.log(`   Token: ${authToken.substring(0, 20)}...`);
    
    return true;
  } catch (error) {
    console.log('❌ Authentication failed');
    return false;
  }
};

const testGetUsers = async () => {
  console.log('\n👥 Testing User Retrieval...');
  
  try {
    const response = await makeRequest('GET', '/users?page=1&limit=10');
    const users = response.data;
    
    if (users.length > 0) {
      testUserId = users[0].id;
      console.log('✅ Users retrieved successfully');
      console.log(`   Found ${users.length} users`);
      console.log(`   Test user ID: ${testUserId}`);
      return true;
    } else {
      console.log('❌ No users found');
      return false;
    }
  } catch (error) {
    console.log('❌ Failed to retrieve users');
    return false;
  }
};

const testGetPatients = async () => {
  console.log('\n🏥 Testing Patient Retrieval...');
  
  try {
    const response = await makeRequest('GET', '/patients?page=1&limit=10');
    const patients = response.data;
    
    if (patients.length > 0) {
      testPatientId = patients[0].id;
      console.log('✅ Patients retrieved successfully');
      console.log(`   Found ${patients.length} patients`);
      console.log(`   Test patient ID: ${testPatientId}`);
      console.log(`   Test patient name: ${patients[0].firstName} ${patients[0].lastName}`);
      return true;
    } else {
      console.log('❌ No patients found');
      return false;
    }
  } catch (error) {
    console.log('❌ Failed to retrieve patients');
    return false;
  }
};

const testCreateNotification = async () => {
  console.log('\n🔔 Testing Notification Creation...');
  
  try {
    if (!testPatientId) {
      console.log('❌ No test patient ID available');
      return false;
    }

    const notificationData = {
      type: 'CASE_COMMENT',
      priority: 'HIGH',
      title: 'Integration Test Notification',
      message: 'This is a test notification created during integration testing',
      caseType: 'STEMI',
      caseId: 'test-case-integration-' + Date.now(),
      patientId: testPatientId,
      patientName: 'Test Patient Integration',
      recipientUserIds: [testUserId],
      deliveryMethod: 'IN_APP'
    };

    const response = await makeRequest('POST', '/notifications', notificationData);
    testNotificationId = response.id;
    
    console.log('✅ Notification created successfully');
    console.log(`   Notification ID: ${testNotificationId}`);
    console.log(`   Title: ${response.title}`);
    console.log(`   Priority: ${response.priority}`);
    
    return true;
  } catch (error) {
    console.log('❌ Failed to create notification');
    return false;
  }
};

const testGetNotifications = async () => {
  console.log('\n📋 Testing Notification Retrieval...');
  
  try {
    const response = await makeRequest('GET', '/notifications?page=1&limit=10');
    const notifications = response.notifications;
    
    console.log('✅ Notifications retrieved successfully');
    console.log(`   Found ${notifications.length} notifications`);
    console.log(`   Total: ${response.pagination.total}`);
    
    // Check if our test notification is in the list
    const testNotification = notifications.find(n => n.id === testNotificationId);
    if (testNotification) {
      console.log('✅ Test notification found in list');
      console.log(`   Status: ${testNotification.isRead ? 'Read' : 'Unread'}`);
    } else {
      console.log('⚠️  Test notification not found in list');
    }
    
    return true;
  } catch (error) {
    console.log('❌ Failed to retrieve notifications');
    return false;
  }
};

const testGetNotificationSummary = async () => {
  console.log('\n📊 Testing Notification Summary...');
  
  try {
    const response = await makeRequest('GET', '/notifications/summary');
    
    console.log('✅ Notification summary retrieved successfully');
    console.log(`   Total notifications: ${response.totalNotifications}`);
    console.log(`   Unread notifications: ${response.unreadNotifications}`);
    console.log(`   High priority notifications: ${response.highPriorityNotifications}`);
    console.log(`   Email notifications: ${response.emailNotifications}`);
    console.log(`   SMS notifications: ${response.smsNotifications}`);
    
    return true;
  } catch (error) {
    console.log('❌ Failed to retrieve notification summary');
    return false;
  }
};

const testGetNotificationCategories = async () => {
  console.log('\n📂 Testing Notification Categories...');
  
  try {
    const response = await makeRequest('GET', '/notifications/categories');
    
    console.log('✅ Notification categories retrieved successfully');
    console.log(`   Found ${response.length} categories:`);
    response.forEach(category => {
      console.log(`     - ${category.type}: ${category.count}`);
    });
    
    return true;
  } catch (error) {
    console.log('❌ Failed to retrieve notification categories');
    return false;
  }
};

const testMarkNotificationAsRead = async () => {
  console.log('\n✅ Testing Mark Notification as Read...');
  
  try {
    const response = await makeRequest('PUT', '/notifications/mark-read', {
      notificationIds: [testNotificationId]
    });
    
    console.log('✅ Notification marked as read successfully');
    console.log(`   Updated count: ${response.count}`);
    
    return true;
  } catch (error) {
    console.log('❌ Failed to mark notification as read');
    return false;
  }
};

const testGetNotificationById = async () => {
  console.log('\n🔍 Testing Get Notification by ID...');
  
  try {
    const response = await makeRequest('GET', `/notifications/${testNotificationId}`);
    
    console.log('✅ Notification retrieved by ID successfully');
    console.log(`   ID: ${response.id}`);
    console.log(`   Title: ${response.title}`);
    console.log(`   Is Read: ${response.isRead}`);
    console.log(`   Recipients: ${response.recipients.length}`);
    
    return true;
  } catch (error) {
    console.log('❌ Failed to retrieve notification by ID');
    return false;
  }
};

const testDeleteNotification = async () => {
  console.log('\n🗑️  Testing Delete Notification...');
  
  try {
    const response = await makeRequest('DELETE', `/notifications/${testNotificationId}`);
    
    console.log('✅ Notification deleted successfully');
    console.log(`   Deleted count: ${response.count}`);
    
    return true;
  } catch (error) {
    console.log('❌ Failed to delete notification');
    return false;
  }
};

const testCaseNoteCreation = async () => {
  console.log('\n📝 Testing Case Note Creation...');
  
  try {
    if (!testPatientId) {
      console.log('❌ No test patient ID available');
      return false;
    }

    const caseNoteData = {
      content: 'This is a test case note created during integration testing',
      priority: 'MEDIUM',
      caseType: 'STEMI',
      caseId: 'test-case-integration-' + Date.now(),
      patientId: testPatientId,
      patientName: 'Test Patient Integration',
      notifyTeam: true,
      recipientUserIds: [testUserId],
      deliveryMethod: 'IN_APP'
    };

    const response = await makeRequest('POST', '/case-notes', caseNoteData);
    
    console.log('✅ Case note created successfully');
    console.log(`   Case Note ID: ${response.id}`);
    console.log(`   Content: ${response.content.substring(0, 50)}...`);
    console.log(`   Priority: ${response.priority}`);
    
    return true;
  } catch (error) {
    console.log('❌ Failed to create case note');
    return false;
  }
};

const testFrontendAccessibility = async () => {
  console.log('\n🌐 Testing Frontend Accessibility...');
  
  try {
    const response = await axios.get(FRONTEND_URL, { timeout: 5000 });
    
    if (response.status === 200) {
      console.log('✅ Frontend is accessible');
      console.log(`   URL: ${FRONTEND_URL}`);
      console.log(`   Status: ${response.status}`);
      return true;
    } else {
      console.log('❌ Frontend returned unexpected status');
      return false;
    }
  } catch (error) {
    console.log('❌ Frontend is not accessible');
    console.log(`   Error: ${error.message}`);
    return false;
  }
};

// Main test runner
const runIntegrationTests = async () => {
  console.log('🚀 Starting Notification System Integration Tests...');
  console.log('=' .repeat(60));
  
  const tests = [
    { name: 'Authentication', fn: testAuthentication, critical: true },
    { name: 'Get Users', fn: testGetUsers, critical: true },
    { name: 'Get Patients', fn: testGetPatients, critical: true },
    { name: 'Create Notification', fn: testCreateNotification, critical: true },
    { name: 'Get Notifications', fn: testGetNotifications, critical: true },
    { name: 'Get Notification Summary', fn: testGetNotificationSummary, critical: false },
    { name: 'Get Notification Categories', fn: testGetNotificationCategories, critical: false },
    { name: 'Mark Notification as Read', fn: testMarkNotificationAsRead, critical: true },
    { name: 'Get Notification by ID', fn: testGetNotificationById, critical: true },
    { name: 'Create Case Note', fn: testCaseNoteCreation, critical: false },
    { name: 'Delete Notification', fn: testDeleteNotification, critical: true },
    { name: 'Frontend Accessibility', fn: testFrontendAccessibility, critical: false }
  ];
  
  let passed = 0;
  let failed = 0;
  let criticalFailed = 0;
  
  for (const test of tests) {
    try {
      const result = await test.fn();
      if (result) {
        passed++;
      } else {
        failed++;
        if (test.critical) {
          criticalFailed++;
        }
      }
    } catch (error) {
      console.log(`❌ Test "${test.name}" threw an error:`, error.message);
      failed++;
      if (test.critical) {
        criticalFailed++;
      }
    }
  }
  
  console.log('\n' + '=' .repeat(60));
  console.log('📊 Integration Test Results:');
  console.log(`   ✅ Passed: ${passed}`);
  console.log(`   ❌ Failed: ${failed}`);
  console.log(`   🚨 Critical Failed: ${criticalFailed}`);
  
  if (criticalFailed === 0) {
    console.log('\n🎉 All critical tests passed! Notification system is working correctly.');
  } else {
    console.log('\n⚠️  Some critical tests failed. Please check the issues above.');
  }
  
  console.log('\n🔗 Frontend URL:', FRONTEND_URL);
  console.log('🔗 Backend API:', API_BASE_URL);
};

// Run the tests
runIntegrationTests().catch(console.error);
