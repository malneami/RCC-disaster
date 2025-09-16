import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Helper functions
function getRandomItem<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function randomBoolean(): boolean {
  return Math.random() > 0.5;
}

function addMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60000);
}

export async function seedComprehensiveStemiCases() {
  console.log('❤️ Starting comprehensive STEMI case seeding...');

  // Get hospitals and users
  const hospitals = await prisma.hospital.findMany();
  const users = await prisma.user.findMany();

  if (hospitals.length === 0 || users.length === 0) {
    console.log('❌ No hospitals or users found. Please run the main seed first.');
    return;
  }

  // Create patients if needed
  let patients = await prisma.patient.findMany({ take: 20 });
  
  if (patients.length < 20) {
    for (let i = patients.length; i < 20; i++) {
      const patient = await prisma.patient.create({
        data: {
          firstName: `StemiPatient${i + 1}`,
          lastName: `Cardiac${i + 1}`,
          nationalId: `123456789${i.toString().padStart(2, '0')}`,
          mrn: `STEMI-MRN${i + 1}`,
          age: 50 + Math.floor(Math.random() * 30),
          gender: getRandomItem(['MALE', 'FEMALE']),
          phoneNumber: `+966501234${i.toString().padStart(3, '0')}`,
          email: `stemipatient${i + 1}@test.com`,
          address: `Cardiac Address ${i + 1}`,
          emergencyContact: `Cardiac Emergency Contact ${i + 1}`,
          emergencyPhone: `+966501234${i.toString().padStart(3, '0')}`,
          medicalHistory: getRandomItem(['Hypertension, Diabetes', 'Previous MI, Hypertension', 'Diabetes, Smoking', 'Family history of CAD', 'Hyperlipidemia']),
          allergies: getRandomItem(['None', 'Aspirin', 'Contrast dye', 'Penicillin']),
          medications: getRandomItem(['Aspirin, Metformin', 'Beta-blocker, ACE inhibitor', 'Statin, Aspirin', 'Antiplatelet therapy']),
          bloodType: getRandomItem(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']),
          createdBy: {
            connect: { id: users[0].id }
          }
        },
      });
      patients.push(patient);
    }
  }

  console.log(`👥 Created ${patients.length} patients for STEMI cases`);

  // STEMI scenarios with different performance levels
  const scenarios = [
    {
      name: 'Excellent Performance',
      doorToEcg: { min: 5, max: 10 },
      doorToBalloon: { min: 60, max: 90 },
      doorToNeedle: { min: 20, max: 30 },
      rccActivation: { min: 5, max: 15 },
      doorInDoorOut: { min: 15, max: 30 },
      successRate: 0.95
    },
    {
      name: 'Good Performance',
      doorToEcg: { min: 10, max: 15 },
      doorToBalloon: { min: 90, max: 120 },
      doorToNeedle: { min: 30, max: 45 },
      rccActivation: { min: 15, max: 25 },
      doorInDoorOut: { min: 30, max: 45 },
      successRate: 0.85
    },
    {
      name: 'Average Performance',
      doorToEcg: { min: 15, max: 25 },
      doorToBalloon: { min: 120, max: 150 },
      doorToNeedle: { min: 45, max: 60 },
      rccActivation: { min: 25, max: 40 },
      doorInDoorOut: { min: 45, max: 60 },
      successRate: 0.75
    },
    {
      name: 'Poor Performance',
      doorToEcg: { min: 25, max: 40 },
      doorToBalloon: { min: 150, max: 200 },
      doorToNeedle: { min: 60, max: 90 },
      rccActivation: { min: 40, max: 60 },
      doorInDoorOut: { min: 60, max: 90 },
      successRate: 0.60
    }
  ];

  // Create STEMI cases
  for (let i = 0; i < 20; i++) {
    const patient = patients[i % patients.length];
    const hospital = hospitals[i % hospitals.length];
    const user = users[i % users.length];
    const scenario = scenarios[i % scenarios.length];

    // Create transfer ticket for 70% of cases
    let ticket = null;
    if (Math.random() < 0.7) {
      ticket = await prisma.ticket.create({
        data: {
          ticketNumber: `STEMI-${Date.now()}-${i}`,
          patientId: patient.id,
          originHospitalId: hospital.id,
          destinationHospitalId: hospitals[(i + 1) % hospitals.length].id,
          pathway: 'STEMI',
          chiefComplaint: getRandomItem([
            'Chest pain radiating to left arm',
            'Severe chest pain with diaphoresis',
            'Acute chest pain with nausea',
            'Crushing chest pain',
            'Chest pain with shortness of breath'
          ]),
          priority: getRandomItem(['CRITICAL', 'HIGH', 'EMERGENCY']),
          emergencyType: 'STEMI',
          status: getRandomItem(['PENDING', 'ASSIGNED', 'COMPLETED']),
          notes: `STEMI case: ${scenario.name} scenario`,
          createdById: user.id,
        },
      });
    }

    // Calculate timings based on scenario
    const arrivalTime = new Date(Date.now() - Math.random() * 3600000);
    const triageTime = addMinutes(arrivalTime, Math.random() * 5 + 2);
    const firstEcgTime = addMinutes(arrivalTime, Math.random() * (scenario.doorToEcg.max - scenario.doorToEcg.min) + scenario.doorToEcg.min);
    const doorOut = addMinutes(arrivalTime, Math.random() * 30 + 20);
    const selectedTreatment = getRandomItem(['PCI', 'THROMBOLYSIS', 'CONSERVATIVE_MANAGEMENT']);
    const balloonInflation = selectedTreatment === 'PCI' ? addMinutes(doorOut, Math.random() * (scenario.doorToBalloon.max - scenario.doorToBalloon.min) + scenario.doorToBalloon.min) : null;

    await prisma.stemiCase.create({
      data: {
        ticketId: ticket?.id || null,
        patientId: patient.id,
        originHospitalId: hospital.id,
        destinationHospitalId: ticket ? hospitals[(i + 1) % hospitals.length].id : null,
        
        // Clinical Assessment
        heartScore: Math.floor(Math.random() * 8) + 1, // TIMI Risk Score 1-8
        clinicalRiskLevel: getRandomItem(['Low', 'Intermediate', 'High', 'Very High']),
        presentingSymptoms: getRandomItem([
          'Chest pain, diaphoresis, nausea',
          'Severe chest pain radiating to jaw',
          'Chest pain with shortness of breath',
          'Crushing chest pain with vomiting',
          'Chest pain with palpitations'
        ]),
        symptomOnset: new Date(Date.now() - Math.random() * 7200000), // Within last 2 hours
        symptomDuration: Math.floor(Math.random() * 120) + 30, // 30-150 minutes
        
        // Pathway Execution
        currentStatus: getRandomItem(['SUSPECTED', 'STEMI_CONFIRMED', 'PCI_READY', 'BALLOON_INFLATED', 'CCU_ADMITTED', 'DISCHARGED']),
        selectedTreatment: getRandomItem(['PCI', 'THROMBOLYSIS', 'CONSERVATIVE_MANAGEMENT']),
        pathwayStarted: arrivalTime,
        pathwayCompleted: balloonInflation || addMinutes(arrivalTime, Math.random() * 120 + 60),
        modeOfArrival: getRandomItem(['AMBULANCE', 'PRIVATE_VEHICLE', 'AIR_TRANSPORT', 'WALK_IN', 'POLICE']),
        rccActivated: Math.random() > 0.3,
        rccUnit: getRandomItem(['RCC-001', 'RCC-002', 'RCC-003', 'RCC-004']),
        
        // Critical Timestamps
        triageTime: triageTime,
        firstEcgTime: firstEcgTime,
        
        // ECG Results
        ecgResult: getRandomItem(['STEMI_ANTERIOR', 'STEMI_INFERIOR', 'STEMI_LATERAL', 'STEMI_POSTERIOR', 'NSTEMI_CHANGES']),
        ecgFindings: getRandomItem([
          'ST elevation in leads II, III, aVF',
          'ST elevation in leads V1-V4',
          'ST elevation in leads V5-V6, I, aVL',
          'ST elevation in leads V7-V9',
          'ST depression with T wave inversion'
        ]),
        
        // Interventions and Treatments
        eligibleForPrimaryPci: Math.random() > 0.2,
        pciLocation: getRandomItem(['LAD', 'RCA', 'LCX', 'Left Main', 'Multiple vessels']),
        doorOutTime: doorOut,
        balloonInflationTime: balloonInflation,
        thrombolyticGiven: Math.random() > 0.6,
        thrombolyticAdminTime: balloonInflation ? addMinutes(arrivalTime, Math.random() * (scenario.doorToNeedle.max - scenario.doorToNeedle.min) + scenario.doorToNeedle.min) : null,
        
        // Outcomes
        successful: Math.random() < scenario.successRate,
        complications: Math.random() > 0.8 ? getRandomItem(['Bleeding', 'Arrhythmia', 'Cardiogenic shock', 'Renal failure', 'Stroke']) : null,
        dischargeDate: addMinutes(arrivalTime, Math.random() * 432000 + 86400), // 1-6 days later
        thirtyDayReadmission: Math.random() > 0.9,
        followUpCallCompleted: Math.random() > 0.7,
        followUpCallDate: addMinutes(arrivalTime, Math.random() * 2592000 + 86400), // 1-30 days later
        
        // Quality Metrics (calculated in minutes)
        doorToEcgMinutes: Math.floor((firstEcgTime.getTime() - arrivalTime.getTime()) / (1000 * 60)),
        rccActivationToDoorOutMinutes: doorOut ? Math.floor((doorOut.getTime() - arrivalTime.getTime()) / (1000 * 60)) : null,
        doorInDoorOutMinutes: doorOut ? Math.floor((doorOut.getTime() - arrivalTime.getTime()) / (1000 * 60)) : null,
        doorToNeedleMinutes: balloonInflation ? Math.floor((balloonInflation.getTime() - arrivalTime.getTime()) / (1000 * 60)) : null,
        doorToBalloonMinutes: balloonInflation ? Math.floor((balloonInflation.getTime() - arrivalTime.getTime()) / (1000 * 60)) : null,
        
        // KPI Achievement Flags
        metKpi1: Math.random() > 0.1, // Door to ECG ≤10min
        metKpi2: Math.random() > 0.2, // Door to Balloon ≤90min
        metKpi3: Math.random() > 0.15, // Door to Needle ≤30min
        metKpi4: Math.random() > 0.25, // RCC Activation ≤15min
        metKpi5: Math.random() > 0.2, // Door In Door Out ≤30min
        metKpi6: Math.random() > 0.1, // Primary PCI Success ≥95%
        
        createdById: user.id,
      },
    });
  }

  console.log('✅ Comprehensive STEMI case seeding completed successfully!');
}
