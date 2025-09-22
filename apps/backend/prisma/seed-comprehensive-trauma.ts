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

export async function seedComprehensiveTraumaCases() {
  console.log('🚑 Starting comprehensive Trauma case seeding...');

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
          firstName: `TraumaPatient${i + 1}`,
          lastName: `Injury${i + 1}`,
          nationalId: `345678901${i.toString().padStart(2, '0')}`,
          mrn: `TRAUMA-MRN${i + 1}`,
          age: 25 + Math.floor(Math.random() * 50),
          gender: getRandomItem(['MALE', 'FEMALE']),
          phoneNumber: `+966503456${i.toString().padStart(3, '0')}`,
          email: `traumapatient${i + 1}@test.com`,
          address: `Trauma Address ${i + 1}`,
          emergencyContact: `Trauma Emergency Contact ${i + 1}`,
          emergencyPhone: `+966503456${i.toString().padStart(3, '0')}`,
          medicalHistory: getRandomItem(['None', 'Previous surgery', 'Diabetes', 'Hypertension', 'Asthma', 'Epilepsy']),
          allergies: getRandomItem(['None', 'Penicillin', 'Latex', 'Contrast dye', 'Morphine']),
          medications: getRandomItem(['None', 'Antihypertensive', 'Insulin', 'Anticoagulant', 'Antiplatelet']),
          bloodType: getRandomItem(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']),
          createdBy: {
            connect: { id: users[0].id }
          }
        },
      });
      patients.push(patient);
    }
  }

  console.log(`👥 Created ${patients.length} patients for Trauma cases`);

  // Trauma scenarios with different severity levels
  const scenarios = [
    {
      name: 'Minor Trauma',
      gcsRange: { min: 13, max: 15 },
      sbpRange: { min: 110, max: 140 },
      rrRange: { min: 14, max: 20 },
      transferTime: { min: 30, max: 60 },
      criticalCase: false,
      transferCase: false
    },
    {
      name: 'Moderate Trauma',
      gcsRange: { min: 9, max: 12 },
      sbpRange: { min: 90, max: 110 },
      rrRange: { min: 20, max: 28 },
      transferTime: { min: 45, max: 90 },
      criticalCase: false,
      transferCase: true
    },
    {
      name: 'Severe Trauma',
      gcsRange: { min: 6, max: 8 },
      sbpRange: { min: 70, max: 90 },
      rrRange: { min: 28, max: 35 },
      transferTime: { min: 60, max: 120 },
      criticalCase: true,
      transferCase: true
    },
    {
      name: 'Critical Trauma',
      gcsRange: { min: 3, max: 5 },
      sbpRange: { min: 50, max: 70 },
      rrRange: { min: 35, max: 40 },
      transferTime: { min: 90, max: 180 },
      criticalCase: true,
      transferCase: true
    }
  ];

  // Create Trauma cases
  for (let i = 0; i < 20; i++) {
    const patient = patients[i % patients.length];
    const hospital = hospitals[i % hospitals.length];
    const user = users[i % users.length];
    const scenario = scenarios[i % scenarios.length];

    // Create transfer ticket for transfer cases
    let ticket = null;
    if (scenario.transferCase) {
      ticket = await prisma.ticket.create({
        data: {
          ticketNumber: `TRAUMA-${Date.now()}-${i}`,
          patientId: patient.id,
          originHospitalId: hospital.id,
          destinationHospitalId: hospitals[(i + 1) % hospitals.length].id,
          pathway: 'TRAUMA',
          priority: scenario.criticalCase ? 'CRITICAL' : getRandomItem(['CRITICAL', 'EMERGENCY']),
          emergencyType: 'TRAUMA',
          status: getRandomItem(['PENDING', 'ASSIGNED', 'COMPLETED']),
          notes: `Trauma case: ${scenario.name} scenario`,
          createdById: user.id,
        },
      });
    }

    // Calculate timings based on scenario
    const arrivalTime = new Date(Date.now() - Math.random() * 3600000);
    const incidentTime = addMinutes(arrivalTime, -Math.random() * 120 - 30); // 30-150 minutes before arrival
    const transferRequestTime = scenario.transferCase ? addMinutes(arrivalTime, Math.random() * 30 + 15) : null;
    const transferArrivalTime = scenario.transferCase && transferRequestTime ? addMinutes(transferRequestTime, Math.random() * (scenario.transferTime.max - scenario.transferTime.min) + scenario.transferTime.min) : null;

    await prisma.traumaCase.create({
      data: {
        ticketId: ticket?.id || null,
        patientId: patient.id,
        originHospitalId: hospital.id,
        destinationHospitalId: ticket ? hospitals[(i + 1) % hospitals.length].id : null,
        
        // Date and Time Information
        arrivalDateTime: arrivalTime,
        incidentDateTime: incidentTime,
        modeOfArrival: getRandomItem(['AMBULANCE', 'PRIVATE_VEHICLE', 'AIR_TRANSPORT', 'WALK_IN', 'POLICE']),
        transferRequestDateTime: transferRequestTime,
        transferArrivalDateTime: transferArrivalTime,
        transferDurationMinutes: transferArrivalTime && transferRequestTime ? Math.floor((transferArrivalTime.getTime() - transferRequestTime.getTime()) / (1000 * 60)) : null,
        
        // Chief Complaint and Mechanism
        chiefComplaint: getRandomItem([
          'Motor vehicle accident with head injury',
          'Fall from height with multiple fractures',
          'Penetrating injury to chest',
          'Blunt trauma to abdomen',
          'Burn injury with smoke inhalation',
          'Assault with facial injuries',
          'Industrial accident with crush injury'
        ]),
        mechanismOfInjury: getRandomItem(['MOTOR_VEHICLE_ACCIDENT', 'FALL', 'PENETRATING', 'BURN', 'BLUNT', 'OTHER']),
        
        // Vital Signs
        vitalSigns: JSON.stringify({
          temperature: (36.5 + Math.random() * 2).toFixed(1),
          heartRate: Math.floor(Math.random() * 40 + 60),
          bloodPressure: `${Math.floor(Math.random() * (scenario.sbpRange.max - scenario.sbpRange.min) + scenario.sbpRange.min)}/${Math.floor(Math.random() * 20 + 60)}`,
          oxygenSaturation: Math.floor(Math.random() * 10 + 90),
          respiratoryRate: Math.floor(Math.random() * (scenario.rrRange.max - scenario.rrRange.min) + scenario.rrRange.min)
        }),
        glasgowComaScale: Math.floor(Math.random() * (scenario.gcsRange.max - scenario.gcsRange.min + 1) + scenario.gcsRange.min),
        systolicBloodPressure: Math.floor(Math.random() * (scenario.sbpRange.max - scenario.sbpRange.min) + scenario.sbpRange.min),
        respiratoryRate: Math.floor(Math.random() * (scenario.rrRange.max - scenario.rrRange.min) + scenario.rrRange.min),
        additionalVitalSigns: getRandomItem([
          'Patient alert and oriented',
          'Patient confused but responsive',
          'Patient lethargic but arousable',
          'Patient unresponsive to verbal stimuli',
          'Patient in shock with poor perfusion'
        ]),
        
        // Injury Information - Body Regions
        headAndNeckInjury: Math.random() > 0.4 ? getRandomItem([
          'Skull fracture with intracranial hemorrhage',
          'Concussion with loss of consciousness',
          'Facial fractures with airway compromise',
          'Cervical spine injury',
          'Soft tissue injury to head and neck'
        ]) : null,
        faceInjury: Math.random() > 0.5 ? getRandomItem([
          'Facial fractures',
          'Soft tissue lacerations',
          'Eye injury',
          'Nasal fracture',
          'Dental trauma'
        ]) : null,
        chestInjury: Math.random() > 0.4 ? getRandomItem([
          'Rib fractures with pneumothorax',
          'Hemothorax',
          'Cardiac contusion',
          'Aortic injury',
          'Lung contusion'
        ]) : null,
        abdomenInjury: Math.random() > 0.5 ? getRandomItem([
          'Liver laceration',
          'Splenic injury',
          'Bowel perforation',
          'Retroperitoneal hematoma',
          'Kidney injury'
        ]) : null,
        extremitiesInjury: Math.random() > 0.3 ? getRandomItem([
          'Femur fracture',
          'Tibia/fibula fracture',
          'Upper extremity fracture',
          'Crush injury',
          'Amputation'
        ]) : null,
        externalInjury: Math.random() > 0.6 ? getRandomItem([
          'Multiple lacerations',
          'Abrasion injuries',
          'Burn injuries',
          'Contusion injuries',
          'Penetrating wounds'
        ]) : null,
        
        // Assessment and Disposition
        primarySurveyFindings: getRandomItem([
          'Airway clear, breathing adequate, circulation stable',
          'Airway compromised, breathing labored, circulation poor',
          'Airway patent, breathing rapid, circulation adequate',
          'Airway clear, breathing shallow, circulation unstable',
          'Airway obstructed, breathing absent, circulation absent'
        ]),
        edDisposition: getRandomItem(['ICU_ADMISSION', 'SURGICAL_WARD_ADMISSION', 'MEDICAL_WARD_ADMISSION', 'DISCHARGE', 'OPERATING_THEATRE', 'TRANSFER_TO_HIGHER_CENTER']),
        additionalNotes: getRandomItem([
          'Patient stable, monitoring in ICU',
          'Patient requires immediate surgery',
          'Patient transferred to higher level of care',
          'Patient discharged with follow-up instructions',
          'Patient expired despite resuscitation efforts'
        ]),
        
        // KPI Tracking
        responseTimeMinutes: Math.floor(Math.random() * 60 + 15), // 15-75 minutes
        criticalCase: scenario.criticalCase,
        transferCase: scenario.transferCase,
        
        createdById: user.id,
      },
    });
  }

  console.log('✅ Comprehensive Trauma case seeding completed successfully!');
}
