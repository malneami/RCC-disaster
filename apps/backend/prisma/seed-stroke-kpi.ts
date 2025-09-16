import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Helper functions
function getRandomItem<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function randomBoolean(): boolean {
  return Math.random() > 0.5;
}

export async function seedStrokeKpiTest() {
  console.log('🧠 Starting Stroke KPI Test Seed...');

  // Check if stroke cases already exist from comprehensive seeding
  const existingStrokeCases = await prisma.strokeCase.count();
  if (existingStrokeCases > 0) {
    console.log(`🧠 Found ${existingStrokeCases} existing stroke cases, skipping KPI test seed to avoid conflicts`);
    return;
  }

  // Get hospitals
  const hospitals = await prisma.hospital.findMany();
  if (hospitals.length === 0) {
    console.log('❌ No hospitals found. Please run the main seed first.');
    return;
  }

  // Get users
  const users = await prisma.user.findMany();
  if (users.length === 0) {
    console.log('❌ No users found. Please run the main seed first.');
    return;
  }

  // Get existing patients or create new ones (using KPI-specific naming)
  let patients = await prisma.patient.findMany({ take: 20 });
  
  if (patients.length < 20) {
    // Create additional patients if needed (using KPI-specific naming)
    for (let i = patients.length; i < 20; i++) {
      const patient = await prisma.patient.create({
        data: {
          firstName: `KpiPatient${i + 1}`,
          lastName: `StrokeTest${i + 1}`,
          nationalId: `111111111${i.toString().padStart(2, '0')}`,
          mrn: `KPI-MRN${i + 1}`,
          age: 45 + Math.floor(Math.random() * 40), // 45-85 years
          gender: getRandomItem(['MALE', 'FEMALE']),
          phoneNumber: `+966501111${i.toString().padStart(3, '0')}`,
          email: `kpipatient${i + 1}@test.com`,
          address: `KPI Test Address ${i + 1}`,
          emergencyContact: `KPI Emergency Contact ${i + 1}`,
          emergencyPhone: `+966501111${i.toString().padStart(3, '0')}`,
          medicalHistory: 'Hypertension, Diabetes',
          allergies: 'None',
          medications: 'Aspirin, Metformin',
          bloodType: getRandomItem(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']),
          createdBy: {
            connect: { id: users[0].id }
          }
        },
      });
      patients.push(patient);
    }
  }

  console.log(`👥 Created ${patients.length} patients for KPI testing`);

  // Create 20 stroke cases with varied KPI performance
  console.log('🧠 Creating stroke cases with varied KPI performance...');
  
  for (let i = 0; i < 20; i++) {
    const patient = patients[i % patients.length];
    const hospital = hospitals[i % hospitals.length];
    const user = users[i % users.length];

    // Create varied timing scenarios for different KPI performance
    const now = new Date();
    const symptomOnset = new Date(now.getTime() - (Math.random() * 4 + 1) * 60 * 60 * 1000); // 1-5 hours ago
    const registration = new Date(symptomOnset.getTime() + Math.random() * 30 * 60 * 1000); // Within 30 min of onset
    const triage = new Date(registration.getTime() + Math.random() * 10 * 60 * 1000); // Within 10 min of registration
    const physicianAssessment = new Date(triage.getTime() + Math.random() * 15 * 60 * 1000); // Within 15 min of triage
    const ctScanStart = new Date(physicianAssessment.getTime() + Math.random() * 20 * 60 * 1000); // Within 20 min of assessment
    const ctReportFinal = new Date(ctScanStart.getTime() + Math.random() * 30 * 60 * 1000); // Within 30 min of scan
    const thrombolysisStart = randomBoolean() ? new Date(ctReportFinal.getTime() + Math.random() * 30 * 60 * 1000) : null;
    const thrombectomyStart = randomBoolean() ? new Date(ctReportFinal.getTime() + Math.random() * 60 * 60 * 1000) : null;

    await prisma.strokeCase.create({
      data: {
        patientId: patient.id,
        originHospitalId: hospital.id,
        destinationHospitalId: null,
        
        // Stroke Classification
        strokeType: getRandomItem(['ISCHEMIC', 'HEMORRHAGIC', 'TIA']),
        currentStatus: getRandomItem(['SUSPECTED', 'CONFIRMED', 'IMAGING_PENDING', 'IMAGING_COMPLETE', 'TREATMENT_EVALUATION']),
        
        // Patient Arrival & Timing
        modeOfArrival: getRandomItem(['AMBULANCE', 'PRIVATE_VEHICLE', 'WALK_IN']),
        timeOfSymptomOnset: symptomOnset,
        timeOfRegistration: registration,
        timeOfTriage: triage,
        timeOfPhysicianAssessment: physicianAssessment,
        
        // Assessment
        ctScanPerformed: Math.random() > 0.1,
        timeOfCtScanStart: ctScanStart,
        timeOfCtReportFinal: ctReportFinal,
        
        // Treatment
        ivThrombolysisGiven: getRandomItem(['YES', 'NO', 'NOT_APPLICABLE']),
        mechanicalThrombectomyPerformed: Math.random() > 0.8,
        
        // Outcomes
        dischargeDate: new Date(now.getTime() + Math.random() * 7 * 24 * 60 * 60 * 1000), // Within next week
        thirtyDayReadmission: Math.random() > 0.8,
        followUpCallCompleted: Math.random() > 0.6,
        followUpCallDate: Math.random() > 0.6 ? new Date(now.getTime() + Math.random() * 30 * 24 * 60 * 60 * 1000) : null,
        
        createdById: user.id,
      },
    });
  }

  console.log('✅ Stroke KPI test seeding completed successfully!');
  console.log('📊 Created 20 stroke cases with varied KPI performance for comprehensive testing');
}
