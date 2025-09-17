const axios = require('axios');

const BASE_URL = 'http://localhost:3001';

async function testGPSPolling() {
  console.log('🔄 Testing GPS Polling Functionality\n');

  const tests = [
    {
      name: 'Check GPS Polling Status',
      method: 'GET',
      url: '/gps/polling/status',
      expectedStatus: 200
    },
    {
      name: 'Start GPS Polling',
      method: 'POST',
      url: '/gps/polling/start',
      expectedStatus: 200
    },
    {
      name: 'Trigger Manual GPS Polling',
      method: 'POST',
      url: '/gps/polling/trigger',
      expectedStatus: 200
    },
    {
      name: 'Check GPS Health After Polling',
      method: 'GET',
      url: '/gps/health',
      expectedStatus: 200
    },
    {
      name: 'Stop GPS Polling',
      method: 'POST',
      url: '/gps/polling/stop',
      expectedStatus: 200
    }
  ];

  for (const test of tests) {
    console.log(`📍 Testing: ${test.name}`);
    try {
      const response = await axios({
        method: test.method,
        url: `${BASE_URL}${test.url}`,
        timeout: 10000
      });

      if (response.status === test.expectedStatus) {
        console.log(`   ✅ PASS: Status ${response.status}`);
        if (response.data) {
          console.log(`   📊 Response: ${JSON.stringify(response.data).substring(0, 150)}...`);
        }
      } else {
        console.log(`   ❌ FAIL: Expected ${test.expectedStatus}, got ${response.status}`);
      }
    } catch (error) {
      if (error.response) {
        console.log(`   ❌ FAIL: ${error.response.status} - ${error.response.data?.message || error.message}`);
      } else if (error.code === 'ECONNREFUSED') {
        console.log(`   ❌ FAIL: Server not running on ${BASE_URL}`);
      } else {
        console.log(`   ❌ FAIL: ${error.message}`);
      }
    }
    console.log('');
  }
}

async function monitorPollingActivity() {
  console.log('📡 Monitoring GPS Polling Activity\n');
  
  try {
    // Check polling status
    const statusResponse = await axios.get(`${BASE_URL}/gps/polling/status`);
    console.log('📊 GPS Polling Status:');
    console.log(`   Is Polling: ${statusResponse.data.isPolling}`);
    console.log(`   Interval: ${statusResponse.data.interval}ms`);
    console.log(`   Last Poll: ${statusResponse.data.lastPoll}`);
    console.log('');

    // Check GPS health
    const healthResponse = await axios.get(`${BASE_URL}/gps/health`);
    console.log('🏥 GPS Health Metrics:');
    console.log(`   Status: ${healthResponse.data.health?.status}`);
    console.log(`   Total Vehicles: ${healthResponse.data.health?.totalVehicles}`);
    console.log(`   Valid GPS: ${healthResponse.data.health?.vehiclesWithValidGPS}`);
    console.log(`   Stale Data: ${healthResponse.data.health?.vehiclesWithStaleData}`);
    console.log(`   Invalid Coordinates: ${healthResponse.data.health?.vehiclesWithInvalidCoordinates}`);
    console.log('');

    // Check recent alerts
    const alertsResponse = await axios.get(`${BASE_URL}/gps/alerts`);
    console.log('🚨 Recent GPS Alerts:');
    if (alertsResponse.data.alerts && alertsResponse.data.alerts.length > 0) {
      alertsResponse.data.alerts.slice(0, 3).forEach((alert, index) => {
        console.log(`   ${index + 1}. ${alert.type}: ${alert.message}`);
      });
    } else {
      console.log('   No recent alerts');
    }
    console.log('');

  } catch (error) {
    console.log(`❌ Error monitoring polling activity: ${error.response?.data?.error || error.message}`);
  }
}

async function runPollingTests() {
  console.log('🚀 Starting GPS Polling Tests\n');
  console.log('=' .repeat(60));
  
  await testGPSPolling();
  console.log('=' .repeat(60));
  
  await monitorPollingActivity();
  console.log('=' .repeat(60));
  
  console.log('🎉 GPS Polling Tests Completed!');
  console.log('\n💡 GPS Polling Features:');
  console.log('- ✅ Automatic GPS data fetching every 30 seconds');
  console.log('- ✅ Real-time location updates via WebSocket');
  console.log('- ✅ GPS validation and alerting');
  console.log('- ✅ Manual polling trigger');
  console.log('- ✅ Start/stop polling control');
  console.log('- ✅ Polling status monitoring');
  console.log('\n📋 Available Endpoints:');
  console.log('- GET /gps/polling/status - Check polling status');
  console.log('- POST /gps/polling/start - Start automatic polling');
  console.log('- POST /gps/polling/stop - Stop automatic polling');
  console.log('- POST /gps/polling/trigger - Trigger manual polling');
  console.log('- GET /gps/health - GPS system health');
  console.log('- GET /gps/alerts - Recent GPS alerts');
}

// Run tests
runPollingTests().catch(console.error);

