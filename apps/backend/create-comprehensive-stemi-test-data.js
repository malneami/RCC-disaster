const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Comprehensive STEMI test data with realistic scenarios
const comprehensiveTestData = [
  {
    // Case 1: Successful Primary PCI - Direct
    patient: {
      firstName: 'Ahmed',
      lastName: 'Al-Rashid',
      nationalId: '12345678901',
      dateOfBirth: '1975-03-15',
      gender: 'MALE',
      phoneNumber: '+966501234567',
      address: 'King Fahd Road, Riyadh',
      emergencyContact: 'Fatima Al-Rashid',
      emergencyPhone: '+966501234568',
      medicalHistory: 'Hypertension, Diabetes Type 2',
      allergies: 'Penicillin',
      medications: 'Metformin, Lisinopril',
    },
    admissionDetails: {
      admissionTime: '2024-01-15T08:30:00Z',
      modeOfArrival: 'AMBULANCE',
    },
    criticalTimestamps: {
      triageTime: '2024-01-15T08:35:00Z',
      firstEcgTime: '2024-01-15T08:40:00Z',
    },
    interventionsAndTreatments: {
      eligibleForPrimaryPci: true,
      pciLocation: 'King Fahad Central Hospital',
      doorOutTime: '2024-01-15T08:45:00Z',
      balloonInflationTime: '2024-01-15T09:15:00Z',
      thrombolyticGiven: false,
    },
    clinicalAssessment: {
      heartScore: 7,
      clinicalRiskLevel: 'High',
      presentingSymptoms: 'Severe chest pain, diaphoresis, nausea',
      symptomOnset: '2024-01-15T08:00:00Z',
      symptomDuration: 30,
    },
    additionalData: {
      currentStatus: 'DISCHARGED',
      selectedTreatment: 'PRIMARY_PCI',
      ecgResult: 'STEMI_ANTERIOR',
      ecgFindings: 'ST elevation in leads V1-V4, Q waves in V1-V2',
      isTroponinPositive: true,
      troponinValue: 15.2,
      additionalNotes: 'Successful PCI with stent placement',
    },
  },
  {
    // Case 2: Fibrinolysis Success
    patient: {
      firstName: 'Sara',
      lastName: 'Al-Mansouri',
      nationalId: '12345678902',
      dateOfBirth: '1982-07-22',
      gender: 'FEMALE',
      phoneNumber: '+966501234569',
      address: 'Prince Mohammed Street, Jeddah',
      emergencyContact: 'Mohammed Al-Mansouri',
      emergencyPhone: '+966501234570',
      medicalHistory: 'Hyperlipidemia',
      allergies: 'None',
      medications: 'Atorvastatin',
    },
    admissionDetails: {
      admissionTime: '2024-01-16T14:20:00Z',
      modeOfArrival: 'PRIVATE_VEHICLE',
    },
    criticalTimestamps: {
      triageTime: '2024-01-16T14:25:00Z',
      firstEcgTime: '2024-01-16T14:30:00Z',
    },
    interventionsAndTreatments: {
      eligibleForPrimaryPci: false,
      thrombolyticGiven: true,
      thrombolyticAdminTime: '2024-01-16T14:45:00Z',
    },
    clinicalAssessment: {
      heartScore: 5,
      clinicalRiskLevel: 'Intermediate',
      presentingSymptoms: 'Chest pain radiating to left arm',
      symptomOnset: '2024-01-16T14:00:00Z',
      symptomDuration: 20,
    },
    additionalData: {
      currentStatus: 'DISCHARGED',
      selectedTreatment: 'FIBRINOLYSIS',
      ecgResult: 'STEMI_INFERIOR',
      ecgFindings: 'ST elevation in leads II, III, aVF',
      isTroponinPositive: true,
      troponinValue: 8.7,
      additionalNotes: 'Successful fibrinolysis, no complications',
    },
  },
  {
    // Case 3: Transfer for Primary PCI
    patient: {
      firstName: 'Omar',
      lastName: 'Al-Zahrani',
      nationalId: '12345678903',
      dateOfBirth: '1968-11-08',
      gender: 'MALE',
      phoneNumber: '+966501234571',
      address: 'Al-Madinah Road, Dammam',
      emergencyContact: 'Aisha Al-Zahrani',
      emergencyPhone: '+966501234572',
      medicalHistory: 'Smoking history, Family history of CAD',
      allergies: 'Aspirin',
      medications: 'None',
    },
    admissionDetails: {
      admissionTime: '2024-01-17T06:15:00Z',
      modeOfArrival: 'AMBULANCE',
    },
    criticalTimestamps: {
      triageTime: '2024-01-17T06:20:00Z',
      firstEcgTime: '2024-01-17T06:25:00Z',
    },
    interventionsAndTreatments: {
      eligibleForPrimaryPci: true,
      pciLocation: 'Prince Mohammed Bin Nasser Hospital',
      doorOutTime: '2024-01-17T06:35:00Z',
      balloonInflationTime: '2024-01-17T07:20:00Z',
      thrombolyticGiven: false,
    },
    clinicalAssessment: {
      heartScore: 8,
      clinicalRiskLevel: 'Very High',
      presentingSymptoms: 'Crushing chest pain, shortness of breath',
      symptomOnset: '2024-01-17T05:45:00Z',
      symptomDuration: 30,
    },
    additionalData: {
      currentStatus: 'DISCHARGED',
      selectedTreatment: 'TRANSFER_FOR_PRIMARY_PCI',
      ecgResult: 'STEMI_LATERAL',
      ecgFindings: 'ST elevation in leads I, aVL, V5-V6',
      isTroponinPositive: true,
      troponinValue: 22.1,
      additionalNotes: 'Transferred for PCI, successful intervention',
    },
  },
  {
    // Case 4: NSTEMI Case
    patient: {
      firstName: 'Layla',
      lastName: 'Al-Otaibi',
      nationalId: '12345678904',
      dateOfBirth: '1973-04-12',
      gender: 'FEMALE',
      phoneNumber: '+966501234573',
      address: 'King Abdullah Road, Taif',
      emergencyContact: 'Khalid Al-Otaibi',
      emergencyPhone: '+966501234574',
      medicalHistory: 'Diabetes Type 1, Hypertension',
      allergies: 'Sulfa drugs',
      medications: 'Insulin, Amlodipine',
    },
    admissionDetails: {
      admissionTime: '2024-01-18T10:45:00Z',
      modeOfArrival: 'WALK_IN',
    },
    criticalTimestamps: {
      triageTime: '2024-01-18T10:50:00Z',
      firstEcgTime: '2024-01-18T10:55:00Z',
    },
    interventionsAndTreatments: {
      eligibleForPrimaryPci: false,
      thrombolyticGiven: false,
    },
    clinicalAssessment: {
      heartScore: 4,
      clinicalRiskLevel: 'Intermediate',
      presentingSymptoms: 'Chest discomfort, fatigue',
      symptomOnset: '2024-01-18T10:00:00Z',
      symptomDuration: 45,
    },
    additionalData: {
      currentStatus: 'DISCHARGED',
      selectedTreatment: 'MEDICAL_MANAGEMENT',
      ecgResult: 'NSTEMI_CHANGES',
      ecgFindings: 'T-wave inversions in leads V4-V6',
      isTroponinPositive: true,
      troponinValue: 3.2,
      additionalNotes: 'NSTEMI managed medically',
    },
  },
  {
    // Case 5: Unstable Angina
    patient: {
      firstName: 'Hassan',
      lastName: 'Al-Shehri',
      nationalId: '12345678905',
      dateOfBirth: '1955-09-30',
      gender: 'MALE',
      phoneNumber: '+966501234575',
      address: 'Al-Khobar Corniche, Al-Khobar',
      emergencyContact: 'Noura Al-Shehri',
      emergencyPhone: '+966501234576',
      medicalHistory: 'Previous MI (2019), PCI with stent',
      allergies: 'None',
      medications: 'Clopidogrel, Metoprolol',
    },
    admissionDetails: {
      admissionTime: '2024-01-19T16:30:00Z',
      modeOfArrival: 'AMBULANCE',
    },
    criticalTimestamps: {
      triageTime: '2024-01-19T16:35:00Z',
      firstEcgTime: '2024-01-19T16:40:00Z',
    },
    interventionsAndTreatments: {
      eligibleForPrimaryPci: false,
      thrombolyticGiven: false,
    },
    clinicalAssessment: {
      heartScore: 6,
      clinicalRiskLevel: 'High',
      presentingSymptoms: 'Recurrent chest pain at rest',
      symptomOnset: '2024-01-19T16:00:00Z',
      symptomDuration: 30,
    },
    additionalData: {
      currentStatus: 'DISCHARGED',
      selectedTreatment: 'MEDICAL_MANAGEMENT',
      ecgResult: 'UNSTABLE_PATTERN',
      ecgFindings: 'ST depressions in leads V4-V6',
      isTroponinPositive: false,
      troponinValue: 0.8,
      additionalNotes: 'Unstable angina, optimized medical therapy',
    },
  },
  {
    // Case 6: STEMI with Complications
    patient: {
      firstName: 'Abdullah',
      lastName: 'Al-Ghamdi',
      nationalId: '12345678906',
      dateOfBirth: '1948-12-05',
      gender: 'MALE',
      phoneNumber: '+966501234577',
      address: 'Al-Faisaliah District, Riyadh',
      emergencyContact: 'Maha Al-Ghamdi',
      emergencyPhone: '+966501234578',
      medicalHistory: 'Chronic kidney disease, Hypertension',
      allergies: 'Contrast dye',
      medications: 'Furosemide, Ramipril',
    },
    admissionDetails: {
      admissionTime: '2024-01-20T03:15:00Z',
      modeOfArrival: 'AIR_TRANSPORT',
    },
    criticalTimestamps: {
      triageTime: '2024-01-20T03:20:00Z',
      firstEcgTime: '2024-01-20T03:25:00Z',
    },
    interventionsAndTreatments: {
      eligibleForPrimaryPci: true,
      pciLocation: 'King Fahad Central Hospital',
      doorOutTime: '2024-01-20T03:30:00Z',
      balloonInflationTime: '2024-01-20T04:10:00Z',
      thrombolyticGiven: false,
    },
    clinicalAssessment: {
      heartScore: 9,
      clinicalRiskLevel: 'Very High',
      presentingSymptoms: 'Severe chest pain, cardiogenic shock',
      symptomOnset: '2024-01-20T02:30:00Z',
      symptomDuration: 45,
    },
    additionalData: {
      currentStatus: 'CCU_ADMITTED',
      selectedTreatment: 'PRIMARY_PCI',
      ecgResult: 'STEMI_ANTERIOR',
      ecgFindings: 'ST elevation in leads V1-V4, new LBBB',
      isTroponinPositive: true,
      troponinValue: 45.8,
      additionalNotes: 'PCI performed, cardiogenic shock, on vasopressors',
    },
  },
  {
    // Case 7: Recent STEMI Case (This Week)
    patient: {
      firstName: 'Noura',
      lastName: 'Al-Mutairi',
      nationalId: '12345678907',
      dateOfBirth: '1987-06-18',
      gender: 'FEMALE',
      phoneNumber: '+966501234579',
      address: 'Al-Nakheel District, Riyadh',
      emergencyContact: 'Saad Al-Mutairi',
      emergencyPhone: '+966501234580',
      medicalHistory: 'PCOS, Hyperlipidemia',
      allergies: 'None',
      medications: 'Metformin, Simvastatin',
    },
    admissionDetails: {
      admissionTime: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
      modeOfArrival: 'AMBULANCE',
    },
    criticalTimestamps: {
      triageTime: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 5 * 60 * 1000).toISOString(),
      firstEcgTime: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 10 * 60 * 1000).toISOString(),
    },
    interventionsAndTreatments: {
      eligibleForPrimaryPci: true,
      pciLocation: 'King Fahad Central Hospital',
      doorOutTime: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 15 * 60 * 1000).toISOString(),
      balloonInflationTime: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 45 * 60 * 1000).toISOString(),
      thrombolyticGiven: false,
    },
    clinicalAssessment: {
      heartScore: 6,
      clinicalRiskLevel: 'High',
      presentingSymptoms: 'Chest pain, nausea, diaphoresis',
      symptomOnset: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 - 30 * 60 * 1000).toISOString(),
      symptomDuration: 30,
    },
    additionalData: {
      currentStatus: 'CCU_ADMITTED',
      selectedTreatment: 'PRIMARY_PCI',
      ecgResult: 'STEMI_INFERIOR',
      ecgFindings: 'ST elevation in leads II, III, aVF',
      isTroponinPositive: true,
      troponinValue: 18.5,
      additionalNotes: 'Recent STEMI, recovering well',
    },
  },
  {
    // Case 8: Mortality Case
    patient: {
      firstName: 'Mohammed',
      lastName: 'Al-Rashid',
      nationalId: '12345678908',
      dateOfBirth: '1940-02-14',
      gender: 'MALE',
      phoneNumber: '+966501234581',
      address: 'Al-Malaz District, Riyadh',
      emergencyContact: 'Amina Al-Rashid',
      emergencyPhone: '+966501234582',
      medicalHistory: 'Previous CABG (2015), Diabetes, CKD',
      allergies: 'Multiple drug allergies',
      medications: 'Insulin, Metoprolol, Furosemide',
    },
    admissionDetails: {
      admissionTime: '2024-01-21T11:20:00Z',
      modeOfArrival: 'AMBULANCE',
    },
    criticalTimestamps: {
      triageTime: '2024-01-21T11:25:00Z',
      firstEcgTime: '2024-01-21T11:30:00Z',
    },
    interventionsAndTreatments: {
      eligibleForPrimaryPci: false,
      thrombolyticGiven: false,
    },
    clinicalAssessment: {
      heartScore: 10,
      clinicalRiskLevel: 'Very High',
      presentingSymptoms: 'Cardiogenic shock, cardiac arrest',
      symptomOnset: '2024-01-21T11:00:00Z',
      symptomDuration: 20,
    },
    additionalData: {
      currentStatus: 'EXPIRED',
      selectedTreatment: 'MEDICAL_MANAGEMENT',
      ecgResult: 'STEMI_ANTERIOR',
      ecgFindings: 'Extensive anterior STEMI, cardiogenic shock',
      isTroponinPositive: true,
      troponinValue: 78.3,
      additionalNotes: 'Patient expired despite aggressive medical management',
    },
  },
  {
    // Case 9: Rescue PCI after Failed Fibrinolysis
    patient: {
      firstName: 'Fatima',
      lastName: 'Al-Harbi',
      nationalId: '12345678909',
      dateOfBirth: '1970-08-25',
      gender: 'FEMALE',
      phoneNumber: '+966501234583',
      address: 'Al-Rawdah District, Jeddah',
      emergencyContact: 'Ahmed Al-Harbi',
      emergencyPhone: '+966501234584',
      medicalHistory: 'Hypertension, Hyperlipidemia',
      allergies: 'None',
      medications: 'Amlodipine, Atorvastatin',
    },
    admissionDetails: {
      admissionTime: '2024-01-22T09:10:00Z',
      modeOfArrival: 'AMBULANCE',
    },
    criticalTimestamps: {
      triageTime: '2024-01-22T09:15:00Z',
      firstEcgTime: '2024-01-22T09:20:00Z',
    },
    interventionsAndTreatments: {
      eligibleForPrimaryPci: true,
      pciLocation: 'Prince Mohammed Bin Nasser Hospital',
      doorOutTime: '2024-01-22T10:00:00Z',
      balloonInflationTime: '2024-01-22T10:45:00Z',
      thrombolyticGiven: true,
      thrombolyticAdminTime: '2024-01-22T09:40:00Z',
    },
    clinicalAssessment: {
      heartScore: 7,
      clinicalRiskLevel: 'High',
      presentingSymptoms: 'Chest pain, failed fibrinolysis',
      symptomOnset: '2024-01-22T08:45:00Z',
      symptomDuration: 25,
    },
    additionalData: {
      currentStatus: 'DISCHARGED',
      selectedTreatment: 'RESCUE_PCI',
      ecgResult: 'STEMI_LATERAL',
      ecgFindings: 'Persistent ST elevation after fibrinolysis',
      isTroponinPositive: true,
      troponinValue: 12.4,
      additionalNotes: 'Rescue PCI after failed fibrinolysis',
    },
  },
  {
    // Case 10: Recent Case (This Month)
    patient: {
      firstName: 'Khalid',
      lastName: 'Al-Sulaimani',
      nationalId: '12345678910',
      dateOfBirth: '1985-01-10',
      gender: 'MALE',
      phoneNumber: '+966501234585',
      address: 'Al-Olaya District, Riyadh',
      emergencyContact: 'Reem Al-Sulaimani',
      emergencyPhone: '+966501234586',
      medicalHistory: 'Smoking history',
      allergies: 'None',
      medications: 'None',
    },
    admissionDetails: {
      admissionTime: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
      modeOfArrival: 'PRIVATE_VEHICLE',
    },
    criticalTimestamps: {
      triageTime: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000 + 5 * 60 * 1000).toISOString(),
      firstEcgTime: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000 + 8 * 60 * 1000).toISOString(),
    },
    interventionsAndTreatments: {
      eligibleForPrimaryPci: true,
      pciLocation: 'King Fahad Central Hospital',
      doorOutTime: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000 + 12 * 60 * 1000).toISOString(),
      balloonInflationTime: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000 + 42 * 60 * 1000).toISOString(),
      thrombolyticGiven: false,
    },
    clinicalAssessment: {
      heartScore: 5,
      clinicalRiskLevel: 'Intermediate',
      presentingSymptoms: 'Chest pain, shortness of breath',
      symptomOnset: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000 - 20 * 60 * 1000).toISOString(),
      symptomDuration: 20,
    },
    additionalData: {
      currentStatus: 'DISCHARGED',
      selectedTreatment: 'PRIMARY_PCI',
      ecgResult: 'STEMI_POSTERIOR',
      ecgFindings: 'ST elevation in leads V7-V9',
      isTroponinPositive: true,
      troponinValue: 9.8,
      additionalNotes: 'Posterior STEMI, successful PCI',
    },
  },
];

async function createComprehensiveStemiTestData() {
  try {
    console.log('🚀 Starting comprehensive STEMI test data creation...');

    // Get hospitals for assignment
    const hospitals = await prisma.hospital.findMany({
      where: { deletedAt: null },
      select: { id: true, name: true, hasPrimaryPci: true }
    });

    if (hospitals.length === 0) {
      throw new Error('No hospitals found. Please run hospital seeding first.');
    }

    console.log(`📋 Found ${hospitals.length} hospitals`);

    // Get a user for creation
    const user = await prisma.user.findFirst({
      where: { role: 'ADMIN' },
      select: { id: true }
    });

    if (!user) {
      throw new Error('No admin user found. Please create an admin user first.');
    }

    console.log(`👤 Using admin user: ${user.id}`);

    let createdCount = 0;
    let errorCount = 0;

    for (let i = 0; i < comprehensiveTestData.length; i++) {
      const testCase = comprehensiveTestData[i];
      
      try {
        console.log(`\n📝 Creating case ${i + 1}/${comprehensiveTestData.length}: ${testCase.patient.firstName} ${testCase.patient.lastName}`);

        // Create or update patient
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

        console.log(`✅ Patient created/updated: ${patient.id}`);

        // Select origin hospital (prefer PCI-capable hospitals)
        const pciHospitals = hospitals.filter(h => h.hasPrimaryPci);
        const originHospital = pciHospitals.length > 0 ? 
          pciHospitals[i % pciHospitals.length] : 
          hospitals[i % hospitals.length];

        // Select destination hospital if different
        const destinationHospital = testCase.interventionsAndTreatments.pciLocation ? 
          hospitals.find(h => h.name.includes('King Fahad') || h.name.includes('Prince Mohammed')) || originHospital :
          null;

        // Create ticket first
        const ticket = await prisma.ticket.create({
          data: {
            ticketNumber: `STEMI-${Date.now()}-${i.toString().padStart(3, '0')}`,
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
            notes: `STEMI case: ${testCase.clinicalAssessment.presentingSymptoms}`,
            createdById: user.id,
            
            // STEMI-specific ticket fields
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

        console.log(`✅ Ticket created: ${ticket.ticketNumber}`);

        // Create STEMI case
        const stemiCase = await prisma.stemiCase.create({
          data: {
            ticketId: ticket.id,
            patientId: patient.id,
            originHospitalId: originHospital.id,
            destinationHospitalId: destinationHospital?.id || null,
            
            // Clinical Assessment
            heartScore: testCase.clinicalAssessment.heartScore,
            clinicalRiskLevel: testCase.clinicalAssessment.clinicalRiskLevel,
            presentingSymptoms: testCase.clinicalAssessment.presentingSymptoms,
            symptomOnset: testCase.clinicalAssessment.symptomOnset ? new Date(testCase.clinicalAssessment.symptomOnset) : null,
            symptomDuration: testCase.clinicalAssessment.symptomDuration,
            
            // Pathway Execution
            currentStatus: testCase.additionalData.currentStatus,
            selectedTreatment: testCase.additionalData.selectedTreatment,
            pathwayStarted: new Date(testCase.admissionDetails.admissionTime),
            pathwayCompleted: testCase.additionalData.currentStatus === 'DISCHARGED' ? new Date(Date.now()) : null,
            
            // Critical Timestamps
            triageTime: testCase.criticalTimestamps.triageTime ? new Date(testCase.criticalTimestamps.triageTime) : null,
            firstEcgTime: testCase.criticalTimestamps.firstEcgTime ? new Date(testCase.criticalTimestamps.firstEcgTime) : null,
            
            // Interventions and Treatments
            eligibleForPrimaryPci: testCase.interventionsAndTreatments.eligibleForPrimaryPci,
            pciLocation: testCase.interventionsAndTreatments.pciLocation,
            doorOutTime: testCase.interventionsAndTreatments.doorOutTime ? new Date(testCase.interventionsAndTreatments.doorOutTime) : null,
            balloonInflationTime: testCase.interventionsAndTreatments.balloonInflationTime ? new Date(testCase.interventionsAndTreatments.balloonInflationTime) : null,
            thrombolyticGiven: testCase.interventionsAndTreatments.thrombolyticGiven,
            thrombolyticAdminTime: testCase.interventionsAndTreatments.thrombolyticAdminTime ? new Date(testCase.interventionsAndTreatments.thrombolyticAdminTime) : null,
            
            // Outcomes
            successful: testCase.additionalData.currentStatus === 'DISCHARGED',
            complications: testCase.additionalData.currentStatus === 'EXPIRED' ? 'Mortality' : null,
            dischargeDate: testCase.additionalData.currentStatus === 'DISCHARGED' ? new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000) : null,
            thirtyDayReadmission: Math.random() < 0.1, // 10% readmission rate
            followUpCallCompleted: testCase.additionalData.currentStatus === 'DISCHARGED' ? Math.random() < 0.8 : false, // 80% follow-up rate
            
            createdById: user.id,
          }
        });

        console.log(`✅ STEMI case created: ${stemiCase.id}`);

        // Create initial timeline event
        await prisma.stemiTimeline.create({
          data: {
            stemiCaseId: stemiCase.id,
            ticketId: ticket.id,
            fromStatus: 'SUSPECTED',
            toStatus: testCase.additionalData.currentStatus,
            eventTimestamp: new Date(testCase.admissionDetails.admissionTime),
            eventDescription: 'STEMI case created',
            eventLocation: 'Emergency Department',
            triggeredBy: user.id,
            createdById: user.id,
          }
        });

        console.log(`✅ Timeline event created`);
        createdCount++;

      } catch (error) {
        console.error(`❌ Error creating case ${i + 1}:`, error.message);
        errorCount++;
      }
    }

    console.log(`\n🎉 Comprehensive STEMI test data creation completed!`);
    console.log(`✅ Successfully created: ${createdCount} cases`);
    console.log(`❌ Errors: ${errorCount} cases`);
    console.log(`📊 Total cases in database: ${await prisma.stemiCase.count()}`);

  } catch (error) {
    console.error('💥 Fatal error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
createComprehensiveStemiTestData();

