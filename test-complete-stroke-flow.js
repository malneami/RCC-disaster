#!/usr/bin/env node

const axios = require('axios');

const API_BASE_URL = 'http://localhost:3001/api/v1';

// Test data based on the exact form data from the image
const formDataFromImage = {
  patientInfo: {
    firstName: "Brenden",
    lastName: "Marks Gibson",
    nationalId: "900900",
    dateOfBirth: "2025-04-08",
    gender: "MALE"
  },
  originHospitalId: "1", // Jazan Specialized Hospital
  destinationHospitalId: null, // "None" in the form
  strokeType: "ISCHEMIC",
  strokeSeverity: "SEVERE",
  currentStatus: "THROMBOLYSIS_STARTED",
  selectedTreatment: "COMBINED_THERAPY",
  nihssBaseline: 10,
  doorToImagingMinutes: 68,
  doorToNeedleMinutes: 42,
  doorToGroinMinutes: 17,
  eligibleForThrombectomy: true,
  eligibleForThrombolysis: false,
  presentingSymptoms: "Eligendi harum in co",
  thrombolysisContraindications: "Voluptatum dolores d"
};

// Backend-compatible data (only fields that exist in CreateStrokeCaseV2Dto)
const backendCompatibleData = {
  patientInfo: {
    firstName: "Brenden",
    lastName: "Marks Gibson",
    dateOfBirth: "2025-04-08",
    gender: "MALE"
  },
  originHospitalId: "1",
  strokeType: "ISCHEMIC",
  currentStatus: "THROMBOLYSIS_STARTED",
  strokeSeverity: "SEVERE",
  selectedTreatment: "COMBINED_THERAPY",
  chiefComplaint: "Stroke symptoms"
};

async function testCompleteFlow() {
  console.log('🧪 Testing Complete Stroke Case Flow...\n');
  
  // Step 1: Wait for backend to be ready
  console.log('📋 Step 1: Checking backend health...');
  try {
    const healthResponse = await axios.get(`${API_BASE_URL}/health`);
    console.log(`✅ Backend is healthy: ${healthResponse.data.status}`);
  } catch (error) {
    console.log(`❌ Backend health check failed: ${error.message}`);
    return;
  }
  
  // Step 2: Verify hospitals endpoint
  console.log('\n📋 Step 2: Verifying hospitals endpoint...');
  try {
    const hospitalsResponse = await axios.get(`${API_BASE_URL}/hospitals`);
    const hospitals = hospitalsResponse.data;
    console.log(`✅ Found ${hospitals.length} hospitals`);
    
    // Find the specific hospital from the form
    const jazanHospital = hospitals.find(h => 
      h.name.toLowerCase().includes('jazan') || 
      h.name.toLowerCase().includes('specialized')
    );
    
    if (jazanHospital) {
      console.log(`🏥 Found hospital: ${jazanHospital.name} (ID: ${jazanHospital.id})`);
      backendCompatibleData.originHospitalId = jazanHospital.id;
      formDataFromImage.originHospitalId = jazanHospital.id;
    } else {
      console.log('⚠️  Using default hospital ID: 1');
    }
  } catch (error) {
    console.log(`❌ Hospitals endpoint failed: ${error.message}`);
    return;
  }
  
  // Step 3: Test backend DTO validation
  console.log('\n📋 Step 3: Testing backend DTO validation...');
  try {
    const response = await axios.post(`${API_BASE_URL}/stroke-cases`, backendCompatibleData, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 15000
    });
    console.log(`✅ SUCCESS: Stroke case created with status ${response.status}`);
    console.log(`📊 Response:`, JSON.stringify(response.data, null, 2));
    
    // Store the created case ID for further testing
    const createdCaseId = response.data.id;
    console.log(`🆔 Created stroke case ID: ${createdCaseId}`);
    
    // Step 4: Verify the created case can be retrieved
    console.log('\n📋 Step 4: Verifying created case can be retrieved...');
    try {
      const getResponse = await axios.get(`${API_BASE_URL}/stroke-cases/${createdCaseId}`);
      console.log(`✅ SUCCESS: Retrieved stroke case`);
      console.log(`📊 Patient: ${getResponse.data.patient.firstName} ${getResponse.data.patient.lastName}`);
      console.log(`📊 Hospital: ${getResponse.data.originHospital.name}`);
      console.log(`📊 Status: ${getResponse.data.currentStatus}`);
    } catch (error) {
      console.log(`❌ Failed to retrieve created case: ${error.message}`);
    }
    
    // Step 5: Test listing all stroke cases
    console.log('\n📋 Step 5: Testing stroke cases listing...');
    try {
      const listResponse = await axios.get(`${API_BASE_URL}/stroke-cases`);
      console.log(`✅ SUCCESS: Retrieved ${listResponse.data.length} stroke cases`);
    } catch (error) {
      console.log(`❌ Failed to list stroke cases: ${error.message}`);
    }
    
  } catch (error) {
    console.log(`❌ FAILED: ${error.message}`);
    if (error.response) {
      console.log(`📊 Status: ${error.response.status}`);
      console.log(`📊 Response:`, JSON.stringify(error.response.data, null, 2));
    }
  }
  
  // Step 6: Test frontend data filtering
  console.log('\n📋 Step 6: Testing frontend data filtering...');
  console.log('📊 Original form data fields:', Object.keys(formDataFromImage));
  console.log('📊 Filtered backend data fields:', Object.keys(backendCompatibleData));
  
  // Step 7: Test edge cases
  console.log('\n📋 Step 7: Testing edge cases...');
  
  // Test with minimal data
  const minimalData = {
    patientInfo: {
      firstName: "Minimal",
      lastName: "Test",
      dateOfBirth: "1990-01-01",
      gender: "FEMALE"
    },
    originHospitalId: backendCompatibleData.originHospitalId,
    strokeType: "ISCHEMIC",
    currentStatus: "SUSPECTED"
  };
  
  try {
    const minimalResponse = await axios.post(`${API_BASE_URL}/stroke-cases`, minimalData, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 15000
    });
    console.log(`✅ SUCCESS: Minimal case created with status ${minimalResponse.status}`);
  } catch (error) {
    console.log(`❌ Minimal case failed: ${error.message}`);
    if (error.response) {
      console.log(`📊 Response:`, JSON.stringify(error.response.data, null, 2));
    }
  }
  
  console.log('\n🎯 Complete Flow Test Finished!');
}

// Run the comprehensive test
testCompleteFlow().catch(console.error);
