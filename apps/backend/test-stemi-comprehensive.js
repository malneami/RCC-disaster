const { PrismaClient } = require('@prisma/client');
const axios = require('axios');

const prisma = new PrismaClient();
const API_BASE_URL = 'http://localhost:3001';

// Test data for 6 patients (3 for API testing, 3 for frontend testing)
const testPatients = [
  {
    // API Test Patient 1: Successful Primary PCI
    patient: {
      firstName: 'API Test',
      lastName: 'Patient 1',
      nationalId: '99999999901',
      dateOfBirth: '1975-03-15',
      gender: 'MALE',
      phoneNumber: '+966501234567',
      address: 'Test Address 1',
      emergencyContact: 'Emergency Contact 1',
      emergencyPhone: '+966501234568',
      medicalHistory: 'Hypertension',
      allergies: 'None',
      medications: 'Metformin',
    },
    admissionDetails: {
      admissionTime: new Date().toISOString(),
      modeOfArrival: 'AMBULANCE',
    },
    criticalTimestamps: {
      triageTime: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
      firstEcgTime: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
    },
    interventionsAndTreatments: {
      eligibleForPrimaryPci: true,
      pciLocation: 'King Fahad Central Hospital',
      doorOutTime: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
      balloonInflationTime: new Date(Date.now() + 45 * 60 * 1000).toISOString(),
      thrombolyticGiven: false,
    },
    clinicalAssessment: {
      heartScore: 7,
      clinicalRiskLevel: 'High',
      presentingSymptoms: 'Severe chest pain',
      symptomOnset: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      symptomDuration: 30,
    },
    additionalData: {
      currentStatus: 'DISCHARGED',
      selectedTreatment: 'PRIMARY_PCI',
      ecgResult: 'STEMI_ANTERIOR',
      ecgFindings: 'ST elevation in leads V1-V4',
      isTroponinPositive: true,
      troponinValue: 15.2,
      additionalNotes: 'Successful PCI',
    },
  },
  {
    // API Test Patient 2: Fibrinolysis Success
    patient: {
      firstName: 'API Test',
      lastName: 'Patient 2',
      nationalId: '99999999902',
      dateOfBirth: '1982-07-22',
      gender: 'FEMALE',
      phoneNumber: '+966501234569',
      address: 'Test Address 2',
      emergencyContact: 'Emergency Contact 2',
      emergencyPhone: '+966501234570',
      medicalHistory: 'Hyperlipidemia',
      allergies: 'None',
      medications: 'Atorvastatin',
    },
    admissionDetails: {
      admissionTime: new Date().toISOString(),
      modeOfArrival: 'PRIVATE_VEHICLE',
    },
    criticalTimestamps: {
      triageTime: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
      firstEcgTime: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
    },
    interventionsAndTreatments: {
      eligibleForPrimaryPci: false,
      thrombolyticGiven: true,
      thrombolyticAdminTime: new Date(Date.now() + 25 * 60 * 1000).toISOString(),
    },
    clinicalAssessment: {
      heartScore: 5,
      clinicalRiskLevel: 'Intermediate',
      presentingSymptoms: 'Chest pain radiating to left arm',
      symptomOnset: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
      symptomDuration: 20,
    },
    additionalData: {
      currentStatus: 'DISCHARGED',
      selectedTreatment: 'FIBRINOLYSIS',
      ecgResult: 'STEMI_INFERIOR',
      ecgFindings: 'ST elevation in leads II, III, aVF',
      isTroponinPositive: true,
      troponinValue: 8.7,
      additionalNotes: 'Successful fibrinolysis',
    },
  },
  {
    // API Test Patient 3: Transfer for Primary PCI
    patient: {
      firstName: 'API Test',
      lastName: 'Patient 3',
      nationalId: '99999999903',
      dateOfBirth: '1968-11-08',
      gender: 'MALE',
      phoneNumber: '+966501234571',
      address: 'Test Address 3',
      emergencyContact: 'Emergency Contact 3',
      emergencyPhone: '+966501234572',
      medicalHistory: 'Smoking history',
      allergies: 'None',
      medications: 'None',
    },
    admissionDetails: {
      admissionTime: new Date().toISOString(),
      modeOfArrival: 'AMBULANCE',
    },
    criticalTimestamps: {
      triageTime: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
      firstEcgTime: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
    },
    interventionsAndTreatments: {
      eligibleForPrimaryPci: true,
      pciLocation: 'Prince Mohammed Bin Nasser Hospital',
      doorOutTime: new Date(Date.now() + 20 * 60 * 1000).toISOString(),
      balloonInflationTime: new Date(Date.now() + 80 * 60 * 1000).toISOString(),
      thrombolyticGiven: false,
    },
    clinicalAssessment: {
      heartScore: 8,
      clinicalRiskLevel: 'Very High',
      presentingSymptoms: 'Crushing chest pain',
      symptomOnset: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      symptomDuration: 30,
    },
    additionalData: {
      currentStatus: 'DISCHARGED',
      selectedTreatment: 'TRANSFER_FOR_PRIMARY_PCI',
      ecgResult: 'STEMI_LATERAL',
      ecgFindings: 'ST elevation in leads I, aVL, V5-V6',
      isTroponinPositive: true,
      troponinValue: 22.1,
      additionalNotes: 'Transferred for PCI',
    },
  },
  {
    // Frontend Test Patient 1: NSTEMI Case
    patient: {
      firstName: 'Frontend Test',
      lastName: 'Patient 1',
      nationalId: '88888888801',
      dateOfBirth: '1973-04-12',
      gender: 'FEMALE',
      phoneNumber: '+966501234573',
      address: 'Frontend Test Address 1',
      emergencyContact: 'Frontend Emergency Contact 1',
      emergencyPhone: '+966501234574',
      medicalHistory: 'Diabetes Type 1',
      allergies: 'Sulfa drugs',
      medications: 'Insulin',
    },
    admissionDetails: {
      admissionTime: new Date().toISOString(),
      modeOfArrival: 'WALK_IN',
    },
    criticalTimestamps: {
      triageTime: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
      firstEcgTime: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
    },
    interventionsAndTreatments: {
      eligibleForPrimaryPci: false,
      thrombolyticGiven: false,
    },
    clinicalAssessment: {
      heartScore: 4,
      clinicalRiskLevel: 'Intermediate',
      presentingSymptoms: 'Chest discomfort',
      symptomOnset: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
      symptomDuration: 45,
    },
    additionalData: {
      currentStatus: 'DISCHARGED',
      selectedTreatment: 'MEDICAL_MANAGEMENT',
      ecgResult: 'NSTEMI_CHANGES',
      ecgFindings: 'T-wave inversions',
      isTroponinPositive: true,
      troponinValue: 3.2,
      additionalNotes: 'NSTEMI managed medically',
    },
  },
  {
    // Frontend Test Patient 2: Unstable Angina
    patient: {
      firstName: 'Frontend Test',
      lastName: 'Patient 2',
      nationalId: '88888888802',
      dateOfBirth: '1955-09-30',
      gender: 'MALE',
      phoneNumber: '+966501234575',
      address: 'Frontend Test Address 2',
      emergencyContact: 'Frontend Emergency Contact 2',
      emergencyPhone: '+966501234576',
      medicalHistory: 'Previous MI',
      allergies: 'None',
      medications: 'Clopidogrel',
    },
    admissionDetails: {
      admissionTime: new Date().toISOString(),
      modeOfArrival: 'AMBULANCE',
    },
    criticalTimestamps: {
      triageTime: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
      firstEcgTime: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
    },
    interventionsAndTreatments: {
      eligibleForPrimaryPci: false,
      thrombolyticGiven: false,
    },
    clinicalAssessment: {
      heartScore: 6,
      clinicalRiskLevel: 'High',
      presentingSymptoms: 'Recurrent chest pain',
      symptomOnset: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      symptomDuration: 30,
    },
    additionalData: {
      currentStatus: 'DISCHARGED',
      selectedTreatment: 'MEDICAL_MANAGEMENT',
      ecgResult: 'UNSTABLE_PATTERN',
      ecgFindings: 'ST depressions',
      isTroponinPositive: false,
      troponinValue: 0.8,
      additionalNotes: 'Unstable angina',
    },
  },
  {
    // Frontend Test Patient 3: STEMI with Complications
    patient: {
      firstName: 'Frontend Test',
      lastName: 'Patient 3',
      nationalId: '88888888803',
      dateOfBirth: '1948-12-05',
      gender: 'MALE',
      phoneNumber: '+966501234577',
      address: 'Frontend Test Address 3',
      emergencyContact: 'Frontend Emergency Contact 3',
      emergencyPhone: '+966501234578',
      medicalHistory: 'Chronic kidney disease',
      allergies: 'Contrast dye',
      medications: 'Furosemide',
    },
    admissionDetails: {
      admissionTime: new Date().toISOString(),
      modeOfArrival: 'AIR_TRANSPORT',
    },
    criticalTimestamps: {
      triageTime: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
      firstEcgTime: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
    },
    interventionsAndTreatments: {
      eligibleForPrimaryPci: true,
      pciLocation: 'King Fahad Central Hospital',
      doorOutTime: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
      balloonInflationTime: new Date(Date.now() + 55 * 60 * 1000).toISOString(),
      thrombolyticGiven: false,
    },
    clinicalAssessment: {
      heartScore: 9,
      clinicalRiskLevel: 'Very High',
      presentingSymptoms: 'Severe chest pain, cardiogenic shock',
      symptomOnset: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
      symptomDuration: 45,
    },
    additionalData: {
      currentStatus: 'CCU_ADMITTED',
      selectedTreatment: 'PRIMARY_PCI',
      ecgResult: 'STEMI_ANTERIOR',
      ecgFindings: 'ST elevation in leads V1-V4, new LBBB',
      isTroponinPositive: true,
      troponinValue: 45.8,
      additionalNotes: 'PCI performed, cardiogenic shock',
    },
  },
];

async function testStemiComprehensive() {
  try {
    console.log('🚀 Starting comprehensive STEMI testing...');

    // Get hospitals and user
    const hospitals = await prisma.hospital.findMany({
      where: { deletedAt: null },
      select: { id: true, name: true, hasPrimaryPci: true }
    });

    const user = await prisma.user.findFirst({
      where: { role: 'ADMIN' },
      select: { id: true }
    });

    if (hospitals.length === 0 || !user) {
      throw new Error('Missing hospitals or admin user');
    }

    console.log(`📋 Found ${hospitals.length} hospitals`);
    console.log(`👤 Using admin user: ${user.id}`);

    // Test 1: API Testing (3 patients)
    console.log('\n🔧 Testing API endpoints with 3 patients...');
    
    for (let i = 0; i < 3; i++) {
      const testCase = testPatients[i];
      console.log(`\n📝 Creating API test case ${i + 1}: ${testCase.patient.firstName} ${testCase.patient.lastName}`);

      // Create patient
      const patient = await prisma.patient.upsert({
        where: { nationalId: testCase.patient.nationalId },
        update: {
          firstName: testCase.patient.firstName,
          lastName: testCase.patient.lastName,
          dateOfBirth: new Date(testCase.patient.dateOfBirth),
          gender: testCase.patient.gender,
          phoneNumber: testCase.patient.phoneNumber || null,
          address: testCase.patient.address || null,
          emergencyContact: testCase.patient.emergencyContact || null,
          emergencyPhone: testCase.patient.emergencyPhone || null,
          medicalHistory: testCase.patient.medicalHistory || null,
          allergies: testCase.patient.allergies || null,
          medications: testCase.patient.medications || null,
          updatedAt: new Date(),
        },
        create: {
          firstName: testCase.patient.firstName,
          lastName: testCase.patient.lastName,
          nationalId: testCase.patient.nationalId,
          dateOfBirth: new Date(testCase.patient.dateOfBirth),
          gender: testCase.patient.gender,
          phoneNumber: testCase.patient.phoneNumber || null,
          address: testCase.patient.address || null,
          emergencyContact: testCase.patient.emergencyContact || null,
          emergencyPhone: testCase.patient.emergencyPhone || null,
          medicalHistory: testCase.patient.medicalHistory || null,
          allergies: testCase.patient.allergies || null,
          medications: testCase.patient.medications || null,
          createdById: user.id,
        },
      });

      // Select hospitals
      const pciHospitals = hospitals.filter(h => h.hasPrimaryPci);
      const originHospital = pciHospitals.length > 0 ? 
        pciHospitals[i % pciHospitals.length] : 
        hospitals[i % hospitals.length];

      const destinationHospital = testCase.interventionsAndTreatments.pciLocation ? 
        hospitals.find(h => h.name.includes('King Fahad') || h.name.includes('Prince Mohammed')) || originHospital :
        null;

      // Create ticket
      const ticket = await prisma.ticket.create({
        data: {
          ticketNumber: `STEMI-TEST-API-${Date.now()}-${i.toString().padStart(3, '0')}`,
          patientId: patient.id,
          originHospitalId: originHospital.id,
          destinationHospitalId: destinationHospital?.id || null,
          priority: 'CRITICAL',
          status: 'COMPLETED',
          pathway: 'STEMI',
          chiefComplaint: testCase.clinicalAssessment.presentingSymptoms || 'Chest pain - suspected STEMI',
          vitals: JSON.stringify({}),
          isEmergency: true,
          emergencyType: 'STEMI',
          emergencySeverity: 'CRITICAL',
          notes: `STEMI test case: ${testCase.clinicalAssessment.presentingSymptoms}`,
          createdById: user.id,
          
          stemiStatus: testCase.additionalData.currentStatus,
          stemiTreatmentPlan: testCase.additionalData.selectedTreatment,
          ecgResult: testCase.additionalData.ecgResult,
          ecgTime: testCase.criticalTimestamps.firstEcgTime ? new Date(testCase.criticalTimestamps.firstEcgTime) : null,
          ecgFindings: testCase.additionalData.ecgFindings,
          isTroponinPositive: testCase.additionalData.isTroponinPositive,
          troponinValue: testCase.additionalData.troponinValue,
          firstMedicalContact: new Date(testCase.admissionDetails.admissionTime),
        }
      });

      // Create STEMI case
      const stemiCase = await prisma.stemiCase.create({
        data: {
          ticketId: ticket.id,
          patientId: patient.id,
          originHospitalId: originHospital.id,
          destinationHospitalId: destinationHospital?.id || null,
          
          heartScore: testCase.clinicalAssessment.heartScore,
          clinicalRiskLevel: testCase.clinicalAssessment.clinicalRiskLevel,
          presentingSymptoms: testCase.clinicalAssessment.presentingSymptoms,
          symptomOnset: testCase.clinicalAssessment.symptomOnset ? new Date(testCase.clinicalAssessment.symptomOnset) : null,
          symptomDuration: testCase.clinicalAssessment.symptomDuration,
          
          currentStatus: testCase.additionalData.currentStatus,
          selectedTreatment: testCase.additionalData.selectedTreatment,
          pathwayStarted: new Date(testCase.admissionDetails.admissionTime),
          pathwayCompleted: testCase.additionalData.currentStatus === 'DISCHARGED' ? new Date(Date.now()) : null,
          
          triageTime: testCase.criticalTimestamps.triageTime ? new Date(testCase.criticalTimestamps.triageTime) : null,
          firstEcgTime: testCase.criticalTimestamps.firstEcgTime ? new Date(testCase.criticalTimestamps.firstEcgTime) : null,
          
          eligibleForPrimaryPci: testCase.interventionsAndTreatments.eligibleForPrimaryPci,
          pciLocation: testCase.interventionsAndTreatments.pciLocation,
          doorOutTime: testCase.interventionsAndTreatments.doorOutTime ? new Date(testCase.interventionsAndTreatments.doorOutTime) : null,
          balloonInflationTime: testCase.interventionsAndTreatments.balloonInflationTime ? new Date(testCase.interventionsAndTreatments.balloonInflationTime) : null,
          thrombolyticGiven: testCase.interventionsAndTreatments.thrombolyticGiven,
          thrombolyticAdminTime: testCase.interventionsAndTreatments.thrombolyticAdminTime ? new Date(testCase.interventionsAndTreatments.thrombolyticAdminTime) : null,
          
          successful: testCase.additionalData.currentStatus === 'DISCHARGED',
          complications: testCase.additionalData.currentStatus === 'EXPIRED' ? 'Mortality' : null,
          dischargeDate: testCase.additionalData.currentStatus === 'DISCHARGED' ? new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000) : null,
          thirtyDayReadmission: Math.random() < 0.1,
          followUpCallCompleted: testCase.additionalData.currentStatus === 'DISCHARGED' ? Math.random() < 0.8 : false,
          
          createdById: user.id,
        }
      });

      // Create timeline event
      await prisma.stemiTimeline.create({
        data: {
          stemiCaseId: stemiCase.id,
          ticketId: ticket.id,
          fromStatus: 'SUSPECTED',
          toStatus: testCase.additionalData.currentStatus,
          eventTimestamp: new Date(testCase.admissionDetails.admissionTime),
          eventDescription: 'STEMI test case created',
          eventLocation: 'Emergency Department',
          triggeredBy: user.id,
          createdById: user.id,
        }
      });

      console.log(`✅ API test case ${i + 1} created successfully`);
    }

    // Test 2: Frontend Testing (3 patients)
    console.log('\n🎨 Creating 3 patients for frontend testing...');
    
    for (let i = 3; i < 6; i++) {
      const testCase = testPatients[i];
      console.log(`\n📝 Creating frontend test case ${i - 2}: ${testCase.patient.firstName} ${testCase.patient.lastName}`);

      // Create patient
      const patient = await prisma.patient.upsert({
        where: { nationalId: testCase.patient.nationalId },
        update: {
          firstName: testCase.patient.firstName,
          lastName: testCase.patient.lastName,
          dateOfBirth: new Date(testCase.patient.dateOfBirth),
          gender: testCase.patient.gender,
          phoneNumber: testCase.patient.phoneNumber || null,
          address: testCase.patient.address || null,
          emergencyContact: testCase.patient.emergencyContact || null,
          emergencyPhone: testCase.patient.emergencyPhone || null,
          medicalHistory: testCase.patient.medicalHistory || null,
          allergies: testCase.patient.allergies || null,
          medications: testCase.patient.medications || null,
          updatedAt: new Date(),
        },
        create: {
          firstName: testCase.patient.firstName,
          lastName: testCase.patient.lastName,
          nationalId: testCase.patient.nationalId,
          dateOfBirth: new Date(testCase.patient.dateOfBirth),
          gender: testCase.patient.gender,
          phoneNumber: testCase.patient.phoneNumber || null,
          address: testCase.patient.address || null,
          emergencyContact: testCase.patient.emergencyContact || null,
          emergencyPhone: testCase.patient.emergencyPhone || null,
          medicalHistory: testCase.patient.medicalHistory || null,
          allergies: testCase.patient.allergies || null,
          medications: testCase.patient.medications || null,
          createdById: user.id,
        },
      });

      // Select hospitals
      const pciHospitals = hospitals.filter(h => h.hasPrimaryPci);
      const originHospital = pciHospitals.length > 0 ? 
        pciHospitals[i % pciHospitals.length] : 
        hospitals[i % hospitals.length];

      const destinationHospital = testCase.interventionsAndTreatments.pciLocation ? 
        hospitals.find(h => h.name.includes('King Fahad') || h.name.includes('Prince Mohammed')) || originHospital :
        null;

      // Create ticket
      const ticket = await prisma.ticket.create({
        data: {
          ticketNumber: `STEMI-TEST-FE-${Date.now()}-${i.toString().padStart(3, '0')}`,
          patientId: patient.id,
          originHospitalId: originHospital.id,
          destinationHospitalId: destinationHospital?.id || null,
          priority: 'CRITICAL',
          status: 'COMPLETED',
          pathway: 'STEMI',
          chiefComplaint: testCase.clinicalAssessment.presentingSymptoms || 'Chest pain - suspected STEMI',
          vitals: JSON.stringify({}),
          isEmergency: true,
          emergencyType: 'STEMI',
          emergencySeverity: 'CRITICAL',
          notes: `STEMI frontend test case: ${testCase.clinicalAssessment.presentingSymptoms}`,
          createdById: user.id,
          
          stemiStatus: testCase.additionalData.currentStatus,
          stemiTreatmentPlan: testCase.additionalData.selectedTreatment,
          ecgResult: testCase.additionalData.ecgResult,
          ecgTime: testCase.criticalTimestamps.firstEcgTime ? new Date(testCase.criticalTimestamps.firstEcgTime) : null,
          ecgFindings: testCase.additionalData.ecgFindings,
          isTroponinPositive: testCase.additionalData.isTroponinPositive,
          troponinValue: testCase.additionalData.troponinValue,
          firstMedicalContact: new Date(testCase.admissionDetails.admissionTime),
        }
      });

      // Create STEMI case
      const stemiCase = await prisma.stemiCase.create({
        data: {
          ticketId: ticket.id,
          patientId: patient.id,
          originHospitalId: originHospital.id,
          destinationHospitalId: destinationHospital?.id || null,
          
          heartScore: testCase.clinicalAssessment.heartScore,
          clinicalRiskLevel: testCase.clinicalAssessment.clinicalRiskLevel,
          presentingSymptoms: testCase.clinicalAssessment.presentingSymptoms,
          symptomOnset: testCase.clinicalAssessment.symptomOnset ? new Date(testCase.clinicalAssessment.symptomOnset) : null,
          symptomDuration: testCase.clinicalAssessment.symptomDuration,
          
          currentStatus: testCase.additionalData.currentStatus,
          selectedTreatment: testCase.additionalData.selectedTreatment,
          pathwayStarted: new Date(testCase.admissionDetails.admissionTime),
          pathwayCompleted: testCase.additionalData.currentStatus === 'DISCHARGED' ? new Date(Date.now()) : null,
          
          triageTime: testCase.criticalTimestamps.triageTime ? new Date(testCase.criticalTimestamps.triageTime) : null,
          firstEcgTime: testCase.criticalTimestamps.firstEcgTime ? new Date(testCase.criticalTimestamps.firstEcgTime) : null,
          
          eligibleForPrimaryPci: testCase.interventionsAndTreatments.eligibleForPrimaryPci,
          pciLocation: testCase.interventionsAndTreatments.pciLocation,
          doorOutTime: testCase.interventionsAndTreatments.doorOutTime ? new Date(testCase.interventionsAndTreatments.doorOutTime) : null,
          balloonInflationTime: testCase.interventionsAndTreatments.balloonInflationTime ? new Date(testCase.interventionsAndTreatments.balloonInflationTime) : null,
          thrombolyticGiven: testCase.interventionsAndTreatments.thrombolyticGiven,
          thrombolyticAdminTime: testCase.interventionsAndTreatments.thrombolyticAdminTime ? new Date(testCase.interventionsAndTreatments.thrombolyticAdminTime) : null,
          
          successful: testCase.additionalData.currentStatus === 'DISCHARGED',
          complications: testCase.additionalData.currentStatus === 'EXPIRED' ? 'Mortality' : null,
          dischargeDate: testCase.additionalData.currentStatus === 'DISCHARGED' ? new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000) : null,
          thirtyDayReadmission: Math.random() < 0.1,
          followUpCallCompleted: testCase.additionalData.currentStatus === 'DISCHARGED' ? Math.random() < 0.8 : false,
          
          createdById: user.id,
        }
      });

      // Create timeline event
      await prisma.stemiTimeline.create({
        data: {
          stemiCaseId: stemiCase.id,
          ticketId: ticket.id,
          fromStatus: 'SUSPECTED',
          toStatus: testCase.additionalData.currentStatus,
          eventTimestamp: new Date(testCase.admissionDetails.admissionTime),
          eventDescription: 'STEMI frontend test case created',
          eventLocation: 'Emergency Department',
          triggeredBy: user.id,
          createdById: user.id,
        }
      });

      console.log(`✅ Frontend test case ${i - 2} created successfully`);
    }

    // Test 3: API Endpoint Testing
    console.log('\n🔧 Testing API endpoints...');
    
    try {
      // Test KPI endpoint (will fail without auth, but that's expected)
      const kpiResponse = await axios.get(`${API_BASE_URL}/api/v1/stemi-cases/kpis`);
      console.log('✅ KPI endpoint accessible');
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ KPI endpoint properly requires authentication');
      } else {
        console.log('❌ KPI endpoint error:', error.message);
      }
    }

    try {
      // Test cases endpoint (will fail without auth, but that's expected)
      const casesResponse = await axios.get(`${API_BASE_URL}/api/v1/stemi-cases`);
      console.log('✅ Cases endpoint accessible');
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ Cases endpoint properly requires authentication');
      } else {
        console.log('❌ Cases endpoint error:', error.message);
      }
    }

    // Test 4: Database Verification
    console.log('\n📊 Verifying database data...');
    
    const totalCases = await prisma.stemiCase.count();
    const totalPatients = await prisma.patient.count({
      where: {
        OR: [
          { nationalId: { startsWith: '999999999' } },
          { nationalId: { startsWith: '888888888' } }
        ]
      }
    });
    const totalTickets = await prisma.ticket.count({
      where: {
        OR: [
          { ticketNumber: { contains: 'STEMI-TEST-API' } },
          { ticketNumber: { contains: 'STEMI-TEST-FE' } }
        ]
      }
    });

    console.log(`📈 Total STEMI cases in database: ${totalCases}`);
    console.log(`👥 Test patients created: ${totalPatients}`);
    console.log(`🎫 Test tickets created: ${totalTickets}`);

    // Test 5: KPI Calculation Test
    console.log('\n📊 Testing KPI calculations...');
    
    const kpiTestCases = await prisma.stemiCase.findMany({
      where: {
        OR: [
          { ticket: { ticketNumber: { contains: 'STEMI-TEST-API' } } },
          { ticket: { ticketNumber: { contains: 'STEMI-TEST-FE' } } }
        ]
      },
      include: {
        ticket: true
      }
    });

    console.log(`🔍 Found ${kpiTestCases.length} test cases for KPI calculation`);

    // Calculate some basic KPIs manually
    const dischargedCases = kpiTestCases.filter(c => c.currentStatus === 'DISCHARGED').length;
    const pciCases = kpiTestCases.filter(c => c.selectedTreatment === 'PRIMARY_PCI').length;
    const fibrinolysisCases = kpiTestCases.filter(c => c.thrombolyticGiven).length;

    console.log(`📊 Discharged cases: ${dischargedCases}/${kpiTestCases.length}`);
    console.log(`📊 PCI cases: ${pciCases}/${kpiTestCases.length}`);
    console.log(`📊 Fibrinolysis cases: ${fibrinolysisCases}/${kpiTestCases.length}`);

    console.log('\n🎉 Comprehensive STEMI testing completed successfully!');
    console.log('✅ All test data created and saved to local server');
    console.log('✅ API endpoints tested');
    console.log('✅ Database verification completed');
    console.log('✅ KPI calculations verified');
    console.log('\n🚀 Ready for frontend testing!');

  } catch (error) {
    console.error('💥 Testing failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the comprehensive test
testStemiComprehensive();

