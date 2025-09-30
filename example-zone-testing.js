/**
 * Example: Zone-Based EMS Assignment Testing
 * 
 * This is a simple example showing how to test the zone-based EMS assignment system
 * with the exact scenario you described: coordinates that match zones, then don't match,
 * then match destination zone.
 */

const axios = require('axios');

// Configuration - Update these with your actual values
const CONFIG = {
  baseUrl: 'http://localhost:3000',
  apiToken: 'your-jwt-token-here', // Replace with your actual JWT token
  assignmentId: 'your-assignment-id-here' // Replace with actual assignment ID
};

const apiClient = axios.create({
  baseURL: CONFIG.baseUrl,
  headers: {
    'Authorization': `Bearer ${CONFIG.apiToken}`,
    'Content-Type': 'application/json'
  }
});

/**
 * Example 1: Automated Testing (Recommended)
 * This simulates the exact scenario you described over 6 minutes
 */
async function automatedTesting() {
  console.log('🚀 Starting Automated Zone-Based Testing');
  console.log('This will simulate ambulance movement over 6 minutes:\n');
  console.log('Minute 1: Outside any zone (starting position) → ASSIGNED');
  console.log('Minute 2: Approaching origin hospital → EN_ROUTE');
  console.log('Minute 3: In origin hospital zone → AT_PICKUP');
  console.log('Minute 4: Leaving origin zone → EN_ROUTE');
  console.log('Minute 5: Approaching destination → EN_ROUTE');
  console.log('Minute 6: In destination hospital zone → EMS_ARRIVAL');
  console.log('\nNote: System uses 4 main EMS assignment statuses only.\n');

  try {
    // Start the automated simulation
    const simulation = await apiClient.post(`/gps/testing/start/${CONFIG.assignmentId}`);
    console.log('✅ Simulation started:', simulation.data.id);
    console.log('⏱️  Simulation will run automatically every minute...\n');

    // Monitor progress for up to 10 minutes
    let completed = false;
    let attempts = 0;
    const maxAttempts = 10;

    while (!completed && attempts < maxAttempts) {
      await sleep(60000); // Wait 1 minute
      attempts++;

      try {
        const status = await apiClient.get(`/gps/testing/scenarios/${simulation.data.id}`);
        const scenario = status.data.scenario;
        
        console.log(`📍 Minute ${attempts}: Step ${scenario.currentStep}/${scenario.totalSteps}`);
        
        if (status.data.currentStep) {
          console.log(`   - Current: ${status.data.currentStep.name}`);
          console.log(`   - Status: ${status.data.assignmentStatus?.status || 'Unknown'}`);
        }

        if (status.data.nextStep) {
          console.log(`   - Next: ${status.data.nextStep.name}`);
          console.log(`   - Expected: ${status.data.nextStep.expectedStatus}\n`);
        }

        if (scenario.currentStep >= scenario.totalSteps) {
          completed = true;
          console.log('✅ Simulation completed successfully!\n');
        }

      } catch (error) {
        console.log(`⚠️  Error checking status: ${error.message}\n`);
      }
    }

    if (!completed) {
      console.log('⏰ Simulation monitoring timed out after 10 minutes\n');
    }

  } catch (error) {
    console.error('❌ Automated testing failed:', error.message);
  }
}

/**
 * Example 2: Manual Step-by-Step Testing
 * This gives you full control over each step
 */
async function manualTesting() {
  console.log('🎮 Starting Manual Zone-Based Testing');
  console.log('This allows you to execute each step manually\n');

  try {
    // Start simulation
    const simulation = await apiClient.post(`/gps/testing/start/${CONFIG.assignmentId}`);
    console.log('✅ Simulation started:', simulation.data.id);

    // Execute each step manually
    for (let step = 1; step <= 6; step++) {
      console.log(`\n🎯 Executing Step ${step}/6:`);
      
      const response = await apiClient.post(`/gps/testing/assignment/${CONFIG.assignmentId}/simulate-step`);
      
      console.log(`   - Action: ${response.data.executedStep?.name || 'Completed'}`);
      console.log(`   - Description: ${response.data.executedStep?.description || 'N/A'}`);
      console.log(`   - Coordinates: ${response.data.executedStep?.coordinates?.latitude}, ${response.data.executedStep?.coordinates?.longitude}`);
      console.log(`   - Expected Status: ${response.data.executedStep?.expectedStatus}`);
      console.log(`   - Status Updates: ${response.data.statusUpdates?.length || 0}`);

      if (response.data.statusUpdates?.length > 0) {
        response.data.statusUpdates.forEach(update => {
          console.log(`     → ${update.previousStatus} → ${update.newStatus}`);
        });
      }

      // Wait 2 seconds before next step
      await sleep(2000);
    }

    console.log('\n✅ Manual testing completed!\n');

  } catch (error) {
    console.error('❌ Manual testing failed:', error.message);
  }
}

/**
 * Example 3: Direct Coordinate Testing
 * This tests specific coordinates to verify zone detection
 */
async function coordinateTesting() {
  console.log('📍 Starting Direct Coordinate Testing');
  console.log('This tests specific coordinates to verify zone detection\n');

  // Example coordinates - replace with your actual hospital coordinates
  const testCoordinates = [
    { lat: 21.4858, lng: 39.1925, name: 'Origin Hospital (should be in zone)' },
    { lat: 21.5000, lng: 39.2000, name: 'Destination Hospital (should be in zone)' },
    { lat: 21.4700, lng: 39.1800, name: 'Random Location (should not be in zone)' }
  ];

  try {
    for (const coord of testCoordinates) {
      console.log(`🔍 Testing: ${coord.name}`);
      console.log(`   Coordinates: ${coord.lat}, ${coord.lng}`);
      
      try {
        const response = await apiClient.get(`/gps/zones/containing/${coord.lat}/${coord.lng}`);
        const zones = response.data;
        
        if (zones.length > 0) {
          console.log(`   ✅ Found ${zones.length} zones:`);
          zones.forEach(zone => {
            console.log(`      - ${zone.zone_name} (${zone.zone_id})`);
          });
        } else {
          console.log(`   ❌ No zones found for these coordinates`);
        }
        
      } catch (error) {
        console.log(`   ⚠️  Error: ${error.message}`);
      }
      
      console.log('');
    }

  } catch (error) {
    console.error('❌ Coordinate testing failed:', error.message);
  }
}

/**
 * Utility function
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Main function
 */
async function main() {
  console.log('🧪 Zone-Based EMS Assignment Testing Examples\n');
  
  // Check if configuration is set
  if (CONFIG.apiToken === 'your-jwt-token-here' || CONFIG.assignmentId === 'your-assignment-id-here') {
    console.log('❌ Please update the configuration in this script:');
    console.log('   1. Set CONFIG.apiToken to your actual JWT token');
    console.log('   2. Set CONFIG.assignmentId to an actual EMS assignment ID');
    console.log('   3. Update CONFIG.baseUrl if your backend runs on a different port\n');
    return;
  }

  const args = process.argv.slice(2);
  const mode = args[0] || 'automated';

  switch (mode) {
    case 'manual':
      await manualTesting();
      break;
    case 'coordinates':
      await coordinateTesting();
      break;
    case 'automated':
    default:
      await automatedTesting();
      break;
  }

  console.log('🎉 Testing completed!');
}

// Run the example
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { automatedTesting, manualTesting, coordinateTesting };
