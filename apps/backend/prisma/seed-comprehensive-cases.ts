import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Helper functions
function getRandomItem<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function randomBoolean(): boolean {
  return Math.random() > 0.5;
}

export async function seedComprehensiveCases() {
  console.log('🚨 Starting comprehensive case seeding...');

  // Get hospitals and users
  const hospitals = await prisma.hospital.findMany();
  const users = await prisma.user.findMany();

  if (hospitals.length === 0 || users.length === 0) {
    console.log('❌ No hospitals or users found. Please run the main seed first.');
    return;
  }

  // Create patients if needed (using different naming to avoid conflicts)
  let patients = await prisma.patient.findMany({ take: 10 });
  
  if (patients.length < 10) {
    for (let i = patients.length; i < 10; i++) {
      const patient = await prisma.patient.create({
        data: {
          firstName: `CasePatient${i + 1}`,
          lastName: `Comprehensive${i + 1}`,
          nationalId: `987654321${i.toString().padStart(2, '0')}`,
          mrn: `CASE-MRN${i + 1}`,
          age: 45 + Math.floor(Math.random() * 40),
          gender: getRandomItem(['MALE', 'FEMALE']),
          phoneNumber: `+966509876${i.toString().padStart(3, '0')}`,
          email: `casepatient${i + 1}@test.com`,
          address: `Case Address ${i + 1}`,
          emergencyContact: `Case Emergency Contact ${i + 1}`,
          emergencyPhone: `+966509876${i.toString().padStart(3, '0')}`,
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

  console.log(`👥 Created ${patients.length} patients`);

  // Create STEMI cases
  console.log('❤️ Creating STEMI cases...');
  for (let i = 0; i < 12; i++) {
    const patient = patients[i % patients.length];
    const hospital = hospitals[i % hospitals.length];
    const user = users[i % users.length];

    // Create transfer ticket for 60% of cases
    let ticket = null;
    if (Math.random() < 0.6) {
      ticket = await prisma.ticket.create({
        data: {
          ticketNumber: `STEMI-${Date.now()}-${i}`,
          patientId: patient.id,
          originHospitalId: hospital.id,
          destinationHospitalId: hospitals[(i + 1) % hospitals.length].id,
          pathway: 'STEMI',
          
          priority: getRandomItem(['CRITICAL', 'EMERGENCY']),
          emergencyType: 'STEMI',
          status: getRandomItem(['PENDING', 'ASSIGNED', 'COMPLETED']),
          notes: `STEMI case: Chest pain with ST elevation`,
          createdById: user.id,
        },
      });
    }

    await prisma.stemiCase.create({
      data: {
        ticketId: ticket?.id || null,
        patientId: patient.id,
        originHospitalId: hospital.id,
        destinationHospitalId: ticket ? hospitals[(i + 1) % hospitals.length].id : null,
        
        // Basic Information
        currentStatus: getRandomItem(['SUSPECTED', 'STEMI_CONFIRMED', 'PCI_READY', 'BALLOON_INFLATED', 'CCU_ADMITTED']),
        selectedTreatment: getRandomItem(['PCI', 'THROMBOLYSIS', 'CONSERVATIVE_MANAGEMENT']),
        
        // Timing
        symptomOnset: new Date(Date.now() - Math.random() * 3600000), // Within last hour
        triageTime: new Date(Date.now() - Math.random() * 1800000), // Within last 30 min
        firstEcgTime: new Date(Date.now() - Math.random() * 900000), // Within last 15 min
        
        // Clinical Data
        ecgResult: getRandomItem(['STEMI_ANTERIOR', 'STEMI_INFERIOR', 'STEMI_LATERAL', 'NSTEMI_CHANGES']),
        ecgFindings: `ECG findings for case ${i + 1}`,
        
        // Treatment
        eligibleForPrimaryPci: Math.random() > 0.3,
        thrombolyticGiven: Math.random() > 0.7,
        doorToBalloonMinutes: Math.random() > 0.3 ? Math.floor(Math.random() * 120) : null,
        
        createdById: user.id,
      },
    });
  }

  // Create Stroke cases
  console.log('🧠 Creating Stroke cases...');
  for (let i = 0; i < 12; i++) {
    const patient = patients[i % patients.length];
    const hospital = hospitals[i % hospitals.length];
    const user = users[i % users.length];

    // Create transfer ticket for 60% of cases
    let ticket = null;
    if (Math.random() < 0.6) {
      ticket = await prisma.ticket.create({
        data: {
          ticketNumber: `STROKE-${Date.now()}-${i}`,
          patientId: patient.id,
          originHospitalId: hospital.id,
          destinationHospitalId: hospitals[(i + 1) % hospitals.length].id,
          pathway: 'STROKE',
          
          priority: getRandomItem(['CRITICAL', 'EMERGENCY']),
          emergencyType: 'STROKE',
          status: getRandomItem(['PENDING', 'ASSIGNED', 'COMPLETED']),
          notes: `Stroke case: Acute neurological deficit`,
          createdById: user.id,
        },
      });
    }

    await prisma.strokeCase.create({
      data: {
        ticketId: ticket?.id || null,
        patientId: patient.id,
        originHospitalId: hospital.id,
        destinationHospitalId: ticket ? hospitals[(i + 1) % hospitals.length].id : null,
        
        // Stroke Classification
        strokeType: getRandomItem(['ISCHEMIC', 'HEMORRHAGIC', 'TIA']),
        currentStatus: getRandomItem(['SUSPECTED', 'CONFIRMED', 'IMAGING_PENDING', 'IMAGING_COMPLETE', 'TREATMENT_EVALUATION']),
        
        // Timing
        timeOfSymptomOnset: new Date(Date.now() - Math.random() * 3600000),
        dateOfAdmission: new Date(Date.now() - Math.random() * 1800000),
        timeOfTriage: new Date(Date.now() - Math.random() * 900000),
        
        // Assessment
        ctScanPerformed: Math.random() > 0.2,
        timeOfCtScanStart: new Date(Date.now() - Math.random() * 600000),
        
        // Treatment
        ivThrombolysisGiven: getRandomItem(['YES', 'NO', 'NOT_APPLICABLE']),
        mechanicalThrombectomyPerformed: Math.random() > 0.8,
        
        createdById: user.id,
      },
    });
  }

  // Create Trauma cases
  console.log('🚑 Creating Trauma cases...');
  for (let i = 0; i < 12; i++) {
    const patient = patients[i % patients.length];
    const hospital = hospitals[i % hospitals.length];
    const user = users[i % users.length];

    // Create transfer ticket for 60% of cases
    let ticket = null;
    if (Math.random() < 0.6) {
      ticket = await prisma.ticket.create({
        data: {
          ticketNumber: `TRAUMA-${Date.now()}-${i}`,
          patientId: patient.id,
          originHospitalId: hospital.id,
          destinationHospitalId: hospitals[(i + 1) % hospitals.length].id,
          pathway: 'TRAUMA',
          
          priority: getRandomItem(['CRITICAL', 'EMERGENCY']),
          emergencyType: 'TRAUMA',
          status: getRandomItem(['PENDING', 'ASSIGNED', 'COMPLETED']),
          notes: `Trauma case: MVA with head and chest injuries`,
          createdById: user.id,
        },
      });
    }

    await prisma.traumaCase.create({
      data: {
        ticketId: ticket?.id || null,
        patientId: patient.id,
        originHospitalId: hospital.id,
        destinationHospitalId: ticket ? hospitals[(i + 1) % hospitals.length].id : null,
        
        // Basic Information
        arrivalDateTime: new Date(Date.now() - Math.random() * 3600000), // Within last hour
        incidentDateTime: new Date(Date.now() - Math.random() * 7200000), // Within last 2 hours
        modeOfArrival: getRandomItem(['AMBULANCE_RED_CRESCENT', 'PRIVATE_CAR', 'TRANSFERRED_FROM_ANOTHER_HOSPITAL']),
        mechanismOfInjury: getRandomItem(['MOTOR_VEHICLE_ACCIDENT', 'FALL', 'PENETRATING', 'BURN', 'OTHER']),
        
        // Clinical Assessment
        glasgowComaScale: Math.floor(Math.random() * 8) + 3, // 3-15
        systolicBloodPressure: Math.floor(Math.random() * 60) + 80, // 80-140
        respiratoryRate: Math.floor(Math.random() * 20) + 12, // 12-32
        
        // Injuries
        headAndNeckInjury: Math.random() > 0.5 ? 'Head trauma present' : null,
        chestInjury: Math.random() > 0.5 ? 'Chest trauma present' : null,
        abdomenInjury: Math.random() > 0.5 ? 'Abdominal trauma present' : null,
        extremitiesInjury: Math.random() > 0.5 ? 'Extremity trauma present' : null,
        
        // Additional Notes
        additionalNotes: `Trauma case with ${Math.random() > 0.5 ? 'surgery required' : 'conservative management'}. ${Math.random() > 0.6 ? 'Blood transfusion administered.' : ''} ${Math.random() > 0.8 ? 'Complications: ' + getRandomItem(['Infection', 'Bleeding', 'Organ failure', 'Sepsis']) : ''}`,
        
        createdById: user.id,
      },
    });
  }

  console.log('✅ Comprehensive case seeding completed successfully!');
}
