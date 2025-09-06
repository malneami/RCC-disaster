#!/usr/bin/env node

const axios = require('axios');

const API_BASE_URL = 'http://localhost:3001/api/v1';

// Test scenarios for stroke case creation (using CreateStrokeCaseV2Dto structure)
const testScenarios = [
  {
    name: 'Complete stroke case with patient auto-creation',
    data: {
      patientInfo: {
        firstName: 'John',
        lastName: 'Doe',
        dateOfBirth: '1980-01-15',
        gender: 'MALE',
        phoneNumber: '+1234567890'
      },
      originHospitalId: 'hospital-1',
      strokeType: 'ISCHEMIC',
      currentStatus: 'SUSPECTED',
      strokeSeverity: 'MODERATE',
      chiefComplaint: 'Sudden weakness on left side',
      selectedTreatment: 'IV_THROMBOLYSIS'
    }
  },
  {
    name: 'Minimal stroke case with required fields only',
    data: {
      patientInfo: {
        firstName: 'Jane',
        lastName: 'Smith',
        dateOfBirth: '1975-05-20',
        gender: 'FEMALE'
      },
      originHospitalId: 'hospital-1',
      strokeType: 'HEMORRHAGIC',
      currentStatus: 'SUSPECTED',
      strokeSeverity: 'SEVERE',
      chiefComplaint: 'Severe headache and confusion'
    }
  },
  {
    name: 'Stroke case with existing patient ID',
    data: {
      patientId: 'existing-patient-id',
      originHospitalId: 'hospital-1',
      strokeType: 'TIA',
      currentStatus: 'CONFIRMED',
      strokeSeverity: 'MILD',
      chiefComplaint: 'Temporary weakness resolved'
    }
  },
  {
    name: 'Stroke case with existing ticket ID',
    data: {
      ticketId: 'existing-ticket-id',
      originHospitalId: 'hospital-2',
      strokeType: 'ISCHEMIC',
      currentStatus: 'IMAGING_PENDING',
      strokeSeverity: 'MODERATE',
      chiefComplaint: 'Speech difficulty'
    }
  },
  {
    name: 'Stroke case with thrombectomy treatment',
    data: {
      patientInfo: {
        firstName: 'Mike',
        lastName: 'Johnson',
        dateOfBirth: '1965-12-10',
        gender: 'MALE'
      },
      originHospitalId: 'hospital-1',
      strokeType: 'ISCHEMIC',
      currentStatus: 'TREATMENT_EVALUATION',
      strokeSeverity: 'SEVERE',
      chiefComplaint: 'Large vessel occlusion',
      selectedTreatment: 'MECHANICAL_THROMBECTOMY'
    }
  },
  {
    name: 'Invalid stroke case - missing required fields',
    data: {
      patientInfo: {
        firstName: 'Test',
        lastName: 'Patient'
        // Missing required fields
      },
      strokeType: 'ISCHEMIC'
      // Missing originHospitalId, currentStatus
    }
  },
  {
    name: 'Invalid stroke case - invalid enum values',
    data: {
      patientInfo: {
        firstName: 'Invalid',
        lastName: 'Case',
        dateOfBirth: '1990-01-01',
        gender: 'INVALID_GENDER'
      },
      originHospitalId: 'hospital-1',
      strokeType: 'INVALID_TYPE',
      currentStatus: 'INVALID_STATUS',
      strokeSeverity: 'INVALID_SEVERITY',
      chiefComplaint: 'Test complaint'
    }
  },
  {
    name: 'Stroke case with invalid hospital IDs',
    data: {
      patientInfo: {
        firstName: 'Hospital',
        lastName: 'Test',
        dateOfBirth: '1985-03-15',
        gender: 'MALE'
      },
      originHospitalId: 'invalid-hospital-id',
      strokeType: 'ISCHEMIC',
      currentStatus: 'SUSPECTED',
      strokeSeverity: 'MODERATE',
      chiefComplaint: 'Testing invalid hospitals'
    }
  }
];

async function testStrokeCaseCreation(hospitals = []) {
  console.log('🧪 Starting comprehensive stroke case creation tests...\n');
  
  let passedTests = 0;
  let failedTests = 0;
  const errors = [];

  for (let i = 0; i < testScenarios.length; i++) {
    const scenario = testScenarios[i];
    console.log(`\n📋 Testing: ${scenario.name}`);
    console.log('─'.repeat(50));
    
    // Update hospital IDs with real ones if available
    if (hospitals.length > 0) {
      if (scenario.data.originHospitalId === 'hospital-1') {
        scenario.data.originHospitalId = hospitals[0].id;
      }
      if (scenario.data.originHospitalId === 'hospital-2') {
        scenario.data.originHospitalId = hospitals[1]?.id || hospitals[0].id;
      }
    }
    
    try {
      const response = await axios.post(`${API_BASE_URL}/stroke-cases`, scenario.data, {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 10000
      });

      console.log(`✅ SUCCESS: Status ${response.status}`);
      console.log(`📊 Response:`, JSON.stringify(response.data, null, 2));
      passedTests++;

    } catch (error) {
      console.log(`❌ FAILED: ${error.message}`);
      
      if (error.response) {
        console.log(`📊 Status: ${error.response.status}`);
        console.log(`📊 Response:`, JSON.stringify(error.response.data, null, 2));
        errors.push({
          scenario: scenario.name,
          status: error.response.status,
          data: error.response.data,
          requestData: scenario.data
        });
      } else {
        console.log(`📊 Error:`, error.message);
        errors.push({
          scenario: scenario.name,
          error: error.message,
          requestData: scenario.data
        });
      }
      failedTests++;
    }
    
    // Add delay between requests to avoid throttling
    if (i < testScenarios.length - 1) {
      console.log('⏳ Waiting 2 seconds before next test...');
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  // Test the test endpoint
  console.log(`\n\n🧪 Testing basic connectivity...`);
  console.log('─'.repeat(50));
  
  try {
    const testResponse = await axios.post(`${API_BASE_URL}/stroke-cases/test`, {
      message: 'Testing connectivity',
      timestamp: new Date().toISOString()
    });
    
    console.log(`✅ Test endpoint working: Status ${testResponse.status}`);
    console.log(`📊 Response:`, JSON.stringify(testResponse.data, null, 2));
  } catch (error) {
    console.log(`❌ Test endpoint failed: ${error.message}`);
    if (error.response) {
      console.log(`📊 Status: ${error.response.status}`);
      console.log(`📊 Response:`, JSON.stringify(error.response.data, null, 2));
    }
  }

  // Summary
  console.log(`\n\n📈 TEST SUMMARY`);
  console.log('═'.repeat(50));
  console.log(`✅ Passed: ${passedTests}`);
  console.log(`❌ Failed: ${failedTests}`);
  console.log(`📊 Total: ${testScenarios.length}`);

  if (errors.length > 0) {
    console.log(`\n🔍 ERROR ANALYSIS`);
    console.log('═'.repeat(50));
    
    errors.forEach((error, index) => {
      console.log(`\n${index + 1}. ${error.scenario}`);
      console.log(`   Status: ${error.status || 'Network Error'}`);
      if (error.data) {
        console.log(`   Error: ${JSON.stringify(error.data)}`);
      }
      if (error.error) {
        console.log(`   Error: ${error.error}`);
      }
    });
  }

  return { passedTests, failedTests, errors };
}

// Test hospital endpoint
async function testHospitalEndpoint() {
  console.log(`\n\n🏥 Testing hospital endpoint...`);
  console.log('─'.repeat(50));
  
  try {
    const response = await axios.get(`${API_BASE_URL}/hospitals`);
    console.log(`✅ Hospitals endpoint working: Status ${response.status}`);
    console.log(`📊 Found ${response.data.length} hospitals`);
    
    if (response.data.length > 0) {
      console.log(`📋 Sample hospital:`, JSON.stringify(response.data[0], null, 2));
    }
    
    return response.data;
  } catch (error) {
    console.log(`❌ Hospitals endpoint failed: ${error.message}`);
    if (error.response) {
      console.log(`📊 Status: ${error.response.status}`);
      console.log(`📊 Response:`, JSON.stringify(error.response.data, null, 2));
    }
    return [];
  }
}

// Main execution
async function main() {
  try {
    // First test hospitals endpoint to get valid hospital IDs
    const hospitals = await testHospitalEndpoint();
    
    if (hospitals.length > 0) {
      // Update test scenarios with real hospital IDs
      const hospitalIds = hospitals.map(h => h.id);
      testScenarios.forEach(scenario => {
        if (scenario.data.originHospitalId === 'hospital-1') {
          scenario.data.originHospitalId = hospitalIds[0];
        }
        if (scenario.data.destinationHospitalId === 'hospital-2') {
          scenario.data.destinationHospitalId = hospitalIds[1] || hospitalIds[0];
        }
        if (scenario.data.destinationHospitalId === 'hospital-3') {
          scenario.data.destinationHospitalId = hospitalIds[2] || hospitalIds[0];
        }
      });
    }
    
    // Run stroke case tests
    const results = await testStrokeCaseCreation(hospitals);
    
    console.log(`\n🎯 Testing completed!`);
    
  } catch (error) {
    console.error('💥 Test execution failed:', error.message);
  }
}

// Run the tests
main();
