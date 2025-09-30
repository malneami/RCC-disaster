/**
 * Zone-Based EMS Assignment Testing Script
 * 
 * This script demonstrates how to test the zone-based EMS assignment system
 * by simulating ambulance movement through different zones and verifying
 * automatic status updates.
 */

const axios = require('axios');

// Configuration
const BASE_URL = 'http://localhost:3000'; // Adjust based on your backend URL
const API_TOKEN = 'your-jwt-token-here'; // Replace with actual JWT token

const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Authorization': `Bearer ${API_TOKEN}`,
    'Content-Type': 'application/json'
  }
});

/**
 * Test the complete zone-based EMS assignment flow
 */
async function testZoneBasedEmsAssignment() {
  console.log('🚀 Starting Zone-Based EMS Assignment Testing\n');

  try {
    // Step 1: Get available EMS assignments
    console.log('📋 Step 1: Getting available EMS assignments...');
    const assignments = await getActiveEmsAssignments();
    
    if (assignments.length === 0) {
      console.log('❌ No active EMS assignments found. Please create an assignment first.');
      return;
    }

    const testAssignment = assignments[0];
    console.log(`✅ Found assignment: ${testAssignment.id}`);
    console.log(`   - Ambulance: ${testAssignment.ambulanceId}`);
    console.log(`   - Current Status: ${testAssignment.status}`);
    console.log(`   - Ticket: ${testAssignment.ticketId}\n`);

    // Step 2: Get zones information
    console.log('🗺️  Step 2: Getting zones information...');
    const zones = await getAllZones();
    console.log(`✅ Retrieved ${zones.length} zones from API\n`);

    // Step 3: Start testing simulation
    console.log('🎯 Step 3: Starting zone testing simulation...');
    const simulation = await startTestingSimulation(testAssignment.id);
    console.log(`✅ Testing simulation started: ${simulation.id}`);
    console.log(`   - Total Steps: ${simulation.totalSteps}`);
    console.log(`   - Origin Zone: ${simulation.originZone.zoneId}`);
    console.log(`   - Destination Zone: ${simulation.destinationZone.zoneId}\n`);

    // Step 4: Monitor simulation progress
    console.log('⏱️  Step 4: Monitoring simulation progress...');
    await monitorSimulation(simulation.id);

    // Step 5: Get final results
    console.log('📊 Step 5: Getting final test results...');
    await getTestResults(testAssignment.id);

    console.log('\n✅ Zone-Based EMS Assignment Testing Completed Successfully!');

  } catch (error) {
    console.error('❌ Testing failed:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
  }
}

/**
 * Get active EMS assignments
 */
async function getActiveEmsAssignments() {
  try {
    const response = await apiClient.get('/ems-assignments');
    return response.data.filter(assignment => 
      ['ASSIGNED', 'EN_ROUTE', 'AT_PICKUP', 'PATIENT_LOADED'].includes(assignment.status)
    );
  } catch (error) {
    console.error('Error fetching EMS assignments:', error.message);
    return [];
  }
}

/**
 * Get all zones from the API
 */
async function getAllZones() {
  try {
    const response = await apiClient.get('/gps/zones');
    return response.data;
  } catch (error) {
    console.error('Error fetching zones:', error.message);
    return [];
  }
}

/**
 * Start testing simulation for an assignment
 */
async function startTestingSimulation(assignmentId) {
  try {
    const response = await apiClient.post(`/gps/testing/start/${assignmentId}`);
    return response.data;
  } catch (error) {
    throw new Error(`Failed to start testing simulation: ${error.message}`);
  }
}

/**
 * Monitor simulation progress
 */
async function monitorSimulation(simulationId) {
  const maxWaitTime = 10 * 60 * 1000; // 10 minutes
  const checkInterval = 30 * 1000; // 30 seconds
  const startTime = Date.now();

  while (Date.now() - startTime < maxWaitTime) {
    try {
      const status = await apiClient.get(`/gps/testing/scenarios/${simulationId}`);
      const scenario = status.data.scenario;
      
      console.log(`📍 Step ${scenario.currentStep}/${scenario.totalSteps}: ${status.data.currentStep?.name || 'Completed'}`);
      
      if (scenario.currentStep >= scenario.totalSteps) {
        console.log('✅ Simulation completed!\n');
        break;
      }

      // Show current assignment status
      if (status.data.assignmentStatus) {
        console.log(`   - Assignment Status: ${status.data.assignmentStatus.status}`);
      }

      // Show next step if available
      if (status.data.nextStep) {
        console.log(`   - Next: ${status.data.nextStep.name}`);
        console.log(`   - Expected Status: ${status.data.nextStep.expectedStatus}`);
        console.log(`   - Expected Zone: ${status.data.nextStep.expectedZone}\n`);
      }

      await sleep(checkInterval);

    } catch (error) {
      console.error('Error monitoring simulation:', error.message);
      break;
    }
  }
}

/**
 * Get test results and verification
 */
async function getTestResults(assignmentId) {
  try {
    // Get assignment status
    const assignmentResponse = await apiClient.get(`/ems-assignments/${assignmentId}`);
    const assignment = assignmentResponse.data;
    
    console.log('📈 Final Assignment Status:');
    console.log(`   - Status: ${assignment.status}`);
    console.log(`   - Assigned At: ${assignment.assignedAt}`);
    console.log(`   - Journey Start: ${assignment.journeyStartTime}`);
    console.log(`   - Journey End: ${assignment.journeyEndTime}`);
    console.log(`   - Notes: ${assignment.notes}\n`);

    // Get zone status
    const zoneStatusResponse = await apiClient.get(`/gps/assignment/${assignmentId}/zone-status`);
    const zoneStatus = zoneStatusResponse.data;
    
    console.log('🗺️  Zone Status:');
    console.log(`   - Current Zone: ${zoneStatus.currentZone?.zone_name || 'None'}`);
    console.log(`   - Origin Zone: ${zoneStatus.originZone?.zone_name || 'None'}`);
    console.log(`   - Destination Zone: ${zoneStatus.destinationZone?.zone_name || 'None'}`);
    console.log(`   - In Origin Zone: ${zoneStatus.isInOriginZone}`);
    console.log(`   - In Destination Zone: ${zoneStatus.isInDestinationZone}\n`);

    // Get ticket status
    const ticketResponse = await apiClient.get(`/tickets/${assignment.ticketId}`);
    const ticket = ticketResponse.data;
    
    console.log('🎫 Ticket Status:');
    console.log(`   - Status: ${ticket.status}`);
    console.log(`   - EMS Assignment Status: ${ticket.emsAssignmentStatus}`);
    console.log(`   - EMS Status Updated: ${ticket.emsStatusUpdatedAt}\n`);

  } catch (error) {
    console.error('Error getting test results:', error.message);
  }
}

/**
 * Manual testing: Execute individual simulation steps
 */
async function manualTesting(assignmentId) {
  console.log('🎮 Starting Manual Testing Mode\n');

  try {
    // Start simulation
    const simulation = await startTestingSimulation(assignmentId);
    console.log(`✅ Simulation started: ${simulation.id}\n`);

    // Execute steps manually
    for (let step = 0; step < simulation.totalSteps; step++) {
      console.log(`🎯 Executing Step ${step + 1}/${simulation.totalSteps}`);
      
      const response = await apiClient.post(`/gps/testing/assignment/${assignmentId}/simulate-step`);
      
      console.log(`   - Step: ${response.data.executedStep?.name || 'Completed'}`);
      console.log(`   - Description: ${response.data.executedStep?.description || 'N/A'}`);
      console.log(`   - Coordinates: ${response.data.executedStep?.coordinates?.latitude}, ${response.data.executedStep?.coordinates?.longitude}`);
      console.log(`   - Expected Status: ${response.data.executedStep?.expectedStatus}`);
      console.log(`   - Status Updates: ${response.data.statusUpdates?.length || 0}\n`);

      // Wait before next step
      await sleep(2000);
    }

    console.log('✅ Manual testing completed!\n');

  } catch (error) {
    console.error('❌ Manual testing failed:', error.message);
  }
}

/**
 * Test zone lookup functionality
 */
async function testZoneLookup() {
  console.log('🔍 Testing Zone Lookup Functionality\n');

  try {
    // Test coordinates (adjust based on your actual zone data)
    const testCoordinates = [
      { lat: 21.4858, lng: 39.1925, name: 'Jazan City Center' },
      { lat: 21.5000, lng: 39.2000, name: 'Test Location 1' },
      { lat: 21.4700, lng: 39.1800, name: 'Test Location 2' }
    ];

    for (const coord of testCoordinates) {
      console.log(`📍 Testing coordinates: ${coord.name} (${coord.lat}, ${coord.lng})`);
      
      try {
        const response = await apiClient.get(`/gps/zones/containing/${coord.lat}/${coord.lng}`);
        const zones = response.data;
        
        console.log(`   - Found ${zones.length} zones:`);
        zones.forEach(zone => {
          console.log(`     • ${zone.zone_name} (${zone.zone_id})`);
        });
        
        if (zones.length === 0) {
          console.log('   - No zones found for these coordinates');
        }
        
      } catch (error) {
        console.log(`   - Error: ${error.message}`);
      }
      
      console.log('');
    }

  } catch (error) {
    console.error('❌ Zone lookup testing failed:', error.message);
  }
}

/**
 * Utility function to sleep for specified milliseconds
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Main execution function
 */
async function main() {
  console.log('🧪 Zone-Based EMS Assignment Testing Suite\n');
  console.log('Available test modes:');
  console.log('1. Automated Testing (default)');
  console.log('2. Manual Testing');
  console.log('3. Zone Lookup Testing\n');

  const args = process.argv.slice(2);
  const mode = args[0] || 'automated';

  switch (mode) {
    case 'manual':
      // Get assignment ID from command line or use first available
      const assignmentId = args[1];
      if (!assignmentId) {
        console.log('❌ Please provide an assignment ID for manual testing');
        console.log('Usage: node test-zone-based-ems-assignment.js manual <assignment-id>');
        return;
      }
      await manualTesting(assignmentId);
      break;
      
    case 'zones':
      await testZoneLookup();
      break;
      
    case 'automated':
    default:
      await testZoneBasedEmsAssignment();
      break;
  }
}

// Export functions for use in other scripts
module.exports = {
  testZoneBasedEmsAssignment,
  manualTesting,
  testZoneLookup,
  getActiveEmsAssignments,
  getAllZones,
  startTestingSimulation
};

// Run the script if called directly
if (require.main === module) {
  main().catch(console.error);
}

