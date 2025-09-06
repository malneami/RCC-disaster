#!/usr/bin/env node

const axios = require('axios');

const API_BASE_URL = 'http://localhost:3001/api/v1';

// Test case based on the form data shown in the image
const formDataFromImage = {
  patientInfo: {
    firstName: "Denise",
    lastName: "Vargas Johnson",
    nationalId: "900900",
    dateOfBirth: "1973-01-27",
    gender: "FEMALE"
  },
  originHospitalId: "5", // This should be the actual hospital ID, not the name
  destinationHospitalId: null, // "None" in the form
  strokeType: "ISCHEMIC",
  strokeSeverity: "MODERATE",
  currentStatus: "IMAGING_PENDING", // "Imaging Pending" in the form
  selectedTreatment: "CONSERVATIVE_MANAGEMENT", // "Conservative Management" in the form
  nihssBaseline: 13,
  doorToImagingMinutes: 38,
  doorToGroinMinutes: 37,
  doorToNeedleMinutes: 69,
  eligibleForThrombectomy: true,
  eligibleForThrombolysis: false,
  presentingSymptoms: "Facere in magnam deb", // Placeholder text from form
  thrombolysisContraindications: "Consectetur aute un", // Placeholder text from form
  thrombectomyContraindications: "Quaerat dolorem dolo" // Placeholder text from form
};

// Test case with only the fields that the backend DTO expects
const backendCompatibleData = {
  patientInfo: {
    firstName: "Denise",
    lastName: "Vargas Johnson",
    dateOfBirth: "1973-01-27",
    gender: "FEMALE"
  },
  originHospitalId: "5",
  strokeType: "ISCHEMIC",
  currentStatus: "IMAGING_PENDING",
  strokeSeverity: "MODERATE",
  selectedTreatment: "CONSERVATIVE_MANAGEMENT",
  chiefComplaint: "Stroke symptoms"
};

async function testFormSubmission() {
  console.log('🧪 Testing Frontend Form Submission...\n');
  
  // First, let's get the actual hospital IDs
  console.log('📋 Getting hospital data...');
  try {
    const hospitalsResponse = await axios.get(`${API_BASE_URL}/hospitals`);
    const hospitals = hospitalsResponse.data;
    console.log(`✅ Found ${hospitals.length} hospitals`);
    
    // Find "Jazan Specialized Hospital" or similar
    const jazanHospital = hospitals.find(h => 
      h.name.toLowerCase().includes('jazan') || 
      h.name.toLowerCase().includes('specialized')
    );
    
    if (jazanHospital) {
      console.log(`🏥 Found hospital: ${jazanHospital.name} (ID: ${jazanHospital.id})`);
      backendCompatibleData.originHospitalId = jazanHospital.id;
      formDataFromImage.originHospitalId = jazanHospital.id;
    } else {
      console.log('⚠️  Using default hospital ID: 5');
    }
  } catch (error) {
    console.log('❌ Error fetching hospitals:', error.message);
  }
  
  console.log('\n📋 Test 1: Full form data (as sent by frontend)');
  console.log('─'.repeat(60));
  try {
    const response = await axios.post(`${API_BASE_URL}/stroke-cases`, formDataFromImage, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 10000
    });
    console.log(`✅ SUCCESS: Status ${response.status}`);
    console.log(`📊 Response:`, JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.log(`❌ FAILED: ${error.message}`);
    if (error.response) {
      console.log(`📊 Status: ${error.response.status}`);
      console.log(`📊 Response:`, JSON.stringify(error.response.data, null, 2));
    }
  }
  
  console.log('\n📋 Test 2: Backend-compatible data only');
  console.log('─'.repeat(60));
  try {
    const response = await axios.post(`${API_BASE_URL}/stroke-cases`, backendCompatibleData, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 10000
    });
    console.log(`✅ SUCCESS: Status ${response.status}`);
    console.log(`📊 Response:`, JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.log(`❌ FAILED: ${error.message}`);
    if (error.response) {
      console.log(`📊 Status: ${error.response.status}`);
      console.log(`📊 Response:`, JSON.stringify(error.response.data, null, 2));
    }
  }
  
  console.log('\n📋 Test 3: Minimal required fields only');
  console.log('─'.repeat(60));
  const minimalData = {
    patientInfo: {
      firstName: "Test",
      lastName: "Patient",
      dateOfBirth: "1980-01-01",
      gender: "MALE"
    },
    originHospitalId: backendCompatibleData.originHospitalId,
    strokeType: "ISCHEMIC",
    currentStatus: "SUSPECTED"
  };
  
  try {
    const response = await axios.post(`${API_BASE_URL}/stroke-cases`, minimalData, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 10000
    });
    console.log(`✅ SUCCESS: Status ${response.status}`);
    console.log(`📊 Response:`, JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.log(`❌ FAILED: ${error.message}`);
    if (error.response) {
      console.log(`📊 Status: ${error.response.status}`);
      console.log(`📊 Response:`, JSON.stringify(error.response.data, null, 2));
    }
  }
  
  console.log('\n🎯 Analysis Complete!');
}

// Run the test
testFormSubmission().catch(console.error);
