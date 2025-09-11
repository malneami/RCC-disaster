import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Sample data for critical cases
const hospitals = [
  { id: 'hospital-1', name: 'King Fahd Hospital' },
  { id: 'hospital-2', name: 'King Khalid Hospital' },
  { id: 'hospital-3', name: 'King Abdulaziz Hospital' },
  { id: 'hospital-4', name: 'King Saud Hospital' },
  { id: 'hospital-5', name: 'King Faisal Hospital' },
];

const users = [
  { id: 'user-1', email: 'admin@rcc.com', firstName: 'Admin', lastName: 'User' },
  { id: 'user-2', email: 'doctor1@rcc.com', firstName: 'Dr. Ahmed', lastName: 'Al-Rashid' },
  { id: 'user-3', email: 'doctor2@rcc.com', firstName: 'Dr. Sarah', lastName: 'Al-Mansouri' },
  { id: 'user-4', email: 'nurse1@rcc.com', firstName: 'Nurse Fatima', lastName: 'Al-Zahra' },
  { id: 'user-5', email: 'nurse2@rcc.com', firstName: 'Nurse Omar', lastName: 'Al-Hassan' },
];

const patients = [
  {
    id: 'patient-1',
    firstName: 'Mohammed',
    lastName: 'Al-Sheikh',
    nationalId: '1234567890',
    dateOfBirth: new Date('1975-03-15'),
    gender: 'MALE' as const,
    phoneNumber: '+966501234567',
    address: 'Riyadh, Saudi Arabia',
    emergencyContact: 'Aisha Al-Sheikh',
    emergencyPhone: '+966501234568',
    medicalHistory: 'Hypertension, Diabetes',
    allergies: 'Penicillin',
    medications: 'Metformin, Lisinopril',
    createdById: 'user-1',
  },
  {
    id: 'patient-2',
    firstName: 'Fatima',
    lastName: 'Al-Rashid',
    nationalId: '1234567891',
    dateOfBirth: new Date('1980-07-22'),
    gender: 'FEMALE' as const,
    phoneNumber: '+966501234569',
    address: 'Jeddah, Saudi Arabia',
    emergencyContact: 'Ahmed Al-Rashid',
    emergencyPhone: '+966501234570',
    medicalHistory: 'Previous stroke, Atrial fibrillation',
    allergies: 'None',
    medications: 'Warfarin, Aspirin',
    createdById: 'user-1',
  },
  {
    id: 'patient-3',
    firstName: 'Abdullah',
    lastName: 'Al-Mansouri',
    nationalId: '1234567892',
    dateOfBirth: new Date('1965-11-08'),
    gender: 'MALE' as const,
    phoneNumber: '+966501234571',
    address: 'Dammam, Saudi Arabia',
    emergencyContact: 'Nora Al-Mansouri',
    emergencyPhone: '+966501234572',
    medicalHistory: 'Coronary artery disease, Previous MI',
    allergies: 'Contrast dye',
    medications: 'Atorvastatin, Clopidogrel',
    createdById: 'user-1',
  },
  {
    id: 'patient-4',
    firstName: 'Aisha',
    lastName: 'Al-Zahra',
    nationalId: '1234567893',
    dateOfBirth: new Date('1990-05-12'),
    gender: 'FEMALE' as const,
    phoneNumber: '+966501234573',
    address: 'Mecca, Saudi Arabia',
    emergencyContact: 'Khalid Al-Zahra',
    emergencyPhone: '+966501234574',
    medicalHistory: 'None',
    allergies: 'Shellfish',
    medications: 'None',
    createdById: 'user-1',
  },
  {
    id: 'patient-5',
    firstName: 'Omar',
    lastName: 'Al-Hassan',
    nationalId: '1234567894',
    dateOfBirth: new Date('1972-09-30'),
    gender: 'MALE' as const,
    phoneNumber: '+966501234575',
    address: 'Medina, Saudi Arabia',
    emergencyContact: 'Layla Al-Hassan',
    emergencyPhone: '+966501234576',
    medicalHistory: 'Hypertension, Smoking history',
    allergies: 'None',
    medications: 'Amlodipine',
    createdById: 'user-1',
  },
  {
    id: 'patient-6',
    firstName: 'Nora',
    lastName: 'Al-Mansouri',
    nationalId: '1234567895',
    dateOfBirth: new Date('1985-12-03'),
    gender: 'FEMALE' as const,
    phoneNumber: '+966501234577',
    address: 'Taif, Saudi Arabia',
    emergencyContact: 'Yousef Al-Mansouri',
    emergencyPhone: '+966501234578',
    medicalHistory: 'Migraine, Depression',
    allergies: 'Sulfa drugs',
    medications: 'Sumatriptan, Sertraline',
    createdById: 'user-1',
  },
  {
    id: 'patient-7',
    firstName: 'Khalid',
    lastName: 'Al-Zahra',
    nationalId: '1234567896',
    dateOfBirth: new Date('1978-04-18'),
    gender: 'MALE' as const,
    phoneNumber: '+966501234579',
    address: 'Abha, Saudi Arabia',
    emergencyContact: 'Maha Al-Zahra',
    emergencyPhone: '+966501234580',
    medicalHistory: 'Diabetes, Obesity',
    allergies: 'None',
    medications: 'Insulin, Metformin',
    createdById: 'user-1',
  },
  {
    id: 'patient-8',
    firstName: 'Layla',
    lastName: 'Al-Hassan',
    nationalId: '1234567897',
    dateOfBirth: new Date('1995-08-25'),
    gender: 'FEMALE' as const,
    phoneNumber: '+966501234581',
    address: 'Tabuk, Saudi Arabia',
    emergencyContact: 'Saad Al-Hassan',
    emergencyPhone: '+966501234582',
    medicalHistory: 'None',
    allergies: 'Latex',
    medications: 'None',
    createdById: 'user-1',
  },
  {
    id: 'patient-9',
    firstName: 'Yousef',
    lastName: 'Al-Mansouri',
    nationalId: '1234567898',
    dateOfBirth: new Date('1960-01-14'),
    gender: 'MALE' as const,
    phoneNumber: '+966501234583',
    address: 'Hail, Saudi Arabia',
    emergencyContact: 'Huda Al-Mansouri',
    emergencyPhone: '+966501234584',
    medicalHistory: 'COPD, Previous pneumonia',
    allergies: 'None',
    medications: 'Albuterol, Prednisone',
    createdById: 'user-1',
  },
  {
    id: 'patient-10',
    firstName: 'Maha',
    lastName: 'Al-Zahra',
    nationalId: '1234567899',
    dateOfBirth: new Date('1988-06-07'),
    gender: 'FEMALE' as const,
    phoneNumber: '+966501234585',
    address: 'Qassim, Saudi Arabia',
    emergencyContact: 'Fahad Al-Zahra',
    emergencyPhone: '+966501234586',
    medicalHistory: 'Thyroid disorder',
    allergies: 'Iodine',
    medications: 'Levothyroxine',
    createdById: 'user-1',
  },
];

// Helper function to get random item from array
function getRandomItem<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

// Helper function to generate random date within last 30 days
function getRandomDate(): Date {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const randomTime = thirtyDaysAgo.getTime() + Math.random() * (now.getTime() - thirtyDaysAgo.getTime());
  return new Date(randomTime);
}

// Helper function to add minutes to date
function addMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60 * 1000);
}

async function seedCriticalCases() {
  console.log('🌱 Starting critical cases seed...');

  try {
    // Create hospitals
    console.log('📋 Creating hospitals...');
    for (const hospital of hospitals) {
      await prisma.hospital.upsert({
        where: { id: hospital.id },
        update: hospital,
        create: hospital,
      });
    }

    // Create users
    console.log('👥 Creating users...');
    for (const user of users) {
      await prisma.user.upsert({
        where: { id: user.id },
        update: user,
        create: {
          ...user,
          email: user.email,
          passwordHash: '$2b$10$example.hash', // Placeholder hash
          role: 'DATA_COLLECTOR',
          status: 'ACTIVE',
        },
      });
    }

    // Create patients
    console.log('🏥 Creating patients...');
    for (const patient of patients) {
      await prisma.patient.upsert({
        where: { id: patient.id },
        update: patient,
        create: patient,
      });
    }

    // Create STEMI cases
    console.log('❤️ Creating STEMI cases...');
    for (let i = 1; i <= 12; i++) {
      const patient = getRandomItem(patients);
      const originHospital = getRandomItem(hospitals);
      const destinationHospital = Math.random() > 0.4 ? getRandomItem(hospitals.filter(h => h.id !== originHospital.id)) : null;
      const createdBy = getRandomItem(users);
      
      const admissionTime = getRandomDate();
      const triageTime = addMinutes(admissionTime, Math.floor(Math.random() * 5) + 1);
      const firstEcgTime = addMinutes(triageTime, Math.floor(Math.random() * 15) + 1);
      const balloonInflationTime = addMinutes(triageTime, Math.floor(Math.random() * 120) + 30);
      const thrombolyticAdminTime = addMinutes(triageTime, Math.floor(Math.random() * 45) + 10);
      const doorOutTime = destinationHospital ? addMinutes(admissionTime, Math.floor(Math.random() * 180) + 60) : null;

      // Create transfer ticket if destination hospital exists
      let ticket = null;
      if (destinationHospital) {
        ticket = await prisma.ticket.create({
          data: {
            ticketNumber: `STEMI-${Date.now()}-${i}`,
            patientId: patient.id,
            originHospitalId: originHospital.id,
            destinationHospitalId: destinationHospital.id,
            priority: 'CRITICAL',
            status: 'PENDING',
            pathway: 'STEMI',
            chiefComplaint: 'Chest pain - suspected STEMI',
            vitals: JSON.stringify({}),
            isEmergency: true,
            emergencyType: 'STEMI',
            emergencySeverity: 'CRITICAL',
            notes: `STEMI case: Chest pain with ST elevation`,
            createdById: createdBy.id,
          },
        });
      }

      // Create STEMI case
      const stemiCase = await prisma.stemiCase.create({
        data: {
          ticketId: ticket?.id,
          patientId: patient.id,
          originHospitalId: originHospital.id,
          destinationHospitalId: destinationHospital?.id,
          
          // Clinical Assessment
          heartScore: Math.floor(Math.random() * 8) + 1,
          clinicalRiskLevel: getRandomItem(['LOW', 'INTERMEDIATE', 'HIGH', 'VERY_HIGH']),
          presentingSymptoms: 'Chest pain, shortness of breath, diaphoresis',
          symptomOnset: addMinutes(admissionTime, -Math.floor(Math.random() * 120) - 30),
          symptomDuration: Math.floor(Math.random() * 120) + 30,
          
          // Pathway Execution
          currentStatus: getRandomItem(['SUSPECTED', 'STEMI_CONFIRMED', 'PCI_READY', 'BALLOON_INFLATED', 'CCU_ADMITTED']),
          selectedTreatment: getRandomItem(['PRIMARY_PCI', 'RESCUE_PCI', 'FIBRINOLYSIS', 'TRANSFER_FOR_PRIMARY_PCI']),
          pathwayStarted: admissionTime,
          modeOfArrival: getRandomItem(['AMBULANCE', 'PRIVATE_VEHICLE', 'WALK_IN']),
          rccActivated: Math.random() > 0.3,
          rccUnit: Math.random() > 0.3 ? `RCC-${Math.floor(Math.random() * 5) + 1}` : null,
          
          // Critical Timestamps
          triageTime,
          firstEcgTime,
          
          // ECG Results
          ecgResult: getRandomItem(['STEMI_ANTERIOR', 'STEMI_INFERIOR', 'STEMI_LATERAL', 'NSTEMI_CHANGES']),
          ecgFindings: 'ST elevation in leads II, III, aVF',
          
          // Interventions and Treatments
          eligibleForPrimaryPci: Math.random() > 0.2,
          pciLocation: Math.random() > 0.3 ? getRandomItem(['CATH_LAB_1', 'CATH_LAB_2', 'CATH_LAB_3']) : null,
          doorOutTime,
          balloonInflationTime,
          thrombolyticGiven: Math.random() > 0.6,
          thrombolyticAdminTime: Math.random() > 0.6 ? thrombolyticAdminTime : null,
          
          // Outcomes
          successful: Math.random() > 0.1,
          complications: Math.random() > 0.8 ? getRandomItem(['Bleeding', 'Arrhythmia', 'Contrast nephropathy']) : null,
          dischargeDate: Math.random() > 0.3 ? addMinutes(admissionTime, Math.floor(Math.random() * 1440) + 1440) : null,
          thirtyDayReadmission: Math.random() > 0.9,
          followUpCallCompleted: Math.random() > 0.4,
          followUpCallDate: Math.random() > 0.4 ? addMinutes(admissionTime, Math.floor(Math.random() * 4320) + 1440) : null,
          
          createdById: createdBy.id,
        },
      });

      // Calculate and update quality metrics
      const updateData: any = {};
      
      if (triageTime && firstEcgTime) {
        const doorToEcg = Math.round((firstEcgTime.getTime() - triageTime.getTime()) / (1000 * 60));
        updateData.doorToEcgMinutes = doorToEcg;
        updateData.metKpi1 = doorToEcg <= 10;
      }
      
      if (triageTime && balloonInflationTime) {
        const doorToBalloon = Math.round((balloonInflationTime.getTime() - triageTime.getTime()) / (1000 * 60));
        updateData.doorToBalloonMinutes = doorToBalloon;
        updateData.metKpi2 = doorToBalloon <= 90;
      }
      
      if (triageTime && thrombolyticAdminTime) {
        const doorToNeedle = Math.round((thrombolyticAdminTime.getTime() - triageTime.getTime()) / (1000 * 60));
        updateData.doorToNeedleMinutes = doorToNeedle;
        updateData.metKpi3 = doorToNeedle <= 30;
      }
      
      if (admissionTime && doorOutTime) {
        const doorInDoorOut = Math.round((doorOutTime.getTime() - admissionTime.getTime()) / (1000 * 60));
        updateData.doorInDoorOutMinutes = doorInDoorOut;
        updateData.metKpi4 = doorInDoorOut <= 120;
      }

      if (Object.keys(updateData).length > 0) {
        await prisma.stemiCase.update({
          where: { id: stemiCase.id },
          data: updateData,
        });
      }
    }

    // Create Stroke cases
    console.log('🧠 Creating Stroke cases...');
    for (let i = 1; i <= 12; i++) {
      const patient = getRandomItem(patients);
      const originHospital = getRandomItem(hospitals);
      const destinationHospital = Math.random() > 0.4 ? getRandomItem(hospitals.filter(h => h.id !== originHospital.id)) : null;
      const createdBy = getRandomItem(users);
      
      const admissionTime = getRandomDate();
      const triageTime = addMinutes(admissionTime, Math.floor(Math.random() * 5) + 1);
      const firstCtTime = addMinutes(triageTime, Math.floor(Math.random() * 25) + 5);
      const thrombolyticAdminTime = addMinutes(triageTime, Math.floor(Math.random() * 60) + 15);
      const doorOutTime = destinationHospital ? addMinutes(admissionTime, Math.floor(Math.random() * 180) + 60) : null;

      // Create transfer ticket if destination hospital exists
      let ticket = null;
      if (destinationHospital) {
        ticket = await prisma.ticket.create({
          data: {
            ticketNumber: `STROKE-${Date.now()}-${i}`,
            patientId: patient.id,
            originHospitalId: originHospital.id,
            destinationHospitalId: destinationHospital.id,
            priority: 'CRITICAL',
            status: 'PENDING',
            pathway: 'STROKE',
            chiefComplaint: 'Sudden onset weakness, speech difficulty',
            vitals: JSON.stringify({}),
            isEmergency: true,
            emergencyType: 'STROKE',
            emergencySeverity: 'CRITICAL',
            notes: `Stroke case: Acute neurological deficit`,
            createdById: createdBy.id,
          },
        });
      }

      // Create Stroke case
      const strokeCase = await prisma.strokeCase.create({
        data: {
          ticketId: ticket?.id || null,
          patientId: patient.id,
          originHospitalId: originHospital.id,
          destinationHospitalId: destinationHospital?.id,
          
          // Clinical Assessment
          nihssBaseline: Math.floor(Math.random() * 20) + 1,
          strokeType: getRandomItem(['ISCHEMIC', 'HEMORRHAGIC', 'TIA']),
          presentingSymptoms: 'Sudden onset left-sided weakness, facial droop, speech difficulty',
          symptomOnset: addMinutes(admissionTime, -Math.floor(Math.random() * 180) - 30),
          lastKnownWell: addMinutes(admissionTime, -Math.floor(Math.random() * 240) - 60),
          
          // Pathway Execution
          currentStatus: getRandomItem(['SUSPECTED', 'CONFIRMED', 'IMAGING_PENDING', 'IMAGING_COMPLETE', 'TREATMENT_EVALUATION', 'THROMBOLYSIS_STARTED', 'THROMBECTOMY_STARTED', 'TREATMENT_COMPLETE', 'STROKEUNIT_ADMITTED', 'REHABILITATION_STARTED', 'DISCHARGED', 'FOLLOW_UP']),
          selectedTreatment: getRandomItem(['IV_THROMBOLYSIS', 'MECHANICAL_THROMBECTOMY', 'COMBINED_THERAPY', 'CONSERVATIVE_MANAGEMENT', 'SURGICAL_INTERVENTION', 'NOT_ELIGIBLE']),
          pathwayStarted: admissionTime,
          
          // Imaging Results
          ctResults: getRandomItem(['NORMAL', 'ACUTE_INFARCT', 'HEMORRHAGE', 'OLD_INFARCT']),
          
          // Interventions and Treatments
          eligibleForThrombolysis: Math.random() > 0.3,
          eligibleForThrombectomy: Math.random() > 0.4,
          
          // Outcomes
          successful: Math.random() > 0.15,
          complications: Math.random() > 0.8 ? getRandomItem(['Intracranial hemorrhage', 'Aspiration pneumonia', 'UTI']) : null,
          dischargeDate: Math.random() > 0.3 ? addMinutes(admissionTime, Math.floor(Math.random() * 2880) + 1440) : null,
          thirtyDayReadmission: Math.random() > 0.85,
          followUpCallCompleted: Math.random() > 0.4,
          followUpCallDate: Math.random() > 0.4 ? addMinutes(admissionTime, Math.floor(Math.random() * 4320) + 1440) : null,
          
          createdById: createdBy.id,
        },
      });

      // Calculate and update quality metrics
      const updateData: any = {};
      
      if (triageTime && firstCtTime) {
        const doorToCt = Math.round((firstCtTime.getTime() - triageTime.getTime()) / (1000 * 60));
        updateData.doorToImagingMinutes = doorToCt;
        updateData.metKpi1 = doorToCt <= 25;
      }
      
      if (triageTime && thrombolyticAdminTime) {
        const doorToNeedle = Math.round((thrombolyticAdminTime.getTime() - triageTime.getTime()) / (1000 * 60));
        updateData.doorToNeedleMinutes = doorToNeedle;
        updateData.metKpi2 = doorToNeedle <= 60;
      }
      
      // doorInDoorOutMinutes field not available in stroke case schema

      if (Object.keys(updateData).length > 0) {
        await prisma.strokeCase.update({
          where: { id: strokeCase.id },
          data: updateData,
        });
      }
    }

    // Create Trauma cases
    console.log('🚑 Creating Trauma cases...');
    for (let i = 1; i <= 12; i++) {
      const patient = getRandomItem(patients);
      const originHospital = getRandomItem(hospitals);
      const destinationHospital = Math.random() > 0.4 ? getRandomItem(hospitals.filter(h => h.id !== originHospital.id)) : null;
      const createdBy = getRandomItem(users);
      
      const admissionTime = getRandomDate();
      const triageTime = addMinutes(admissionTime, Math.floor(Math.random() * 5) + 1);
      const firstSurgeryTime = addMinutes(triageTime, Math.floor(Math.random() * 120) + 30);
      const doorOutTime = destinationHospital ? addMinutes(admissionTime, Math.floor(Math.random() * 180) + 60) : null;

      // Create transfer ticket if destination hospital exists
      let ticket = null;
      if (destinationHospital) {
        ticket = await prisma.ticket.create({
          data: {
            ticketNumber: `TRAUMA-${Date.now()}-${i}`,
            patientId: patient.id,
            originHospitalId: originHospital.id,
            destinationHospitalId: destinationHospital.id,
            priority: 'CRITICAL',
            status: 'PENDING',
            pathway: 'TRAUMA',
            chiefComplaint: 'Motor vehicle accident, multiple injuries',
            vitals: JSON.stringify({}),
            isEmergency: true,
            emergencyType: 'TRAUMA',
            emergencySeverity: 'CRITICAL',
            notes: `Trauma case: MVA with head and chest injuries`,
            createdById: createdBy.id,
          },
        });
      }

      // Create Trauma case
      const traumaCase = await prisma.traumaCase.create({
        data: {
          ticketId: ticket?.id || null,
          patientId: patient.id,
          originHospitalId: originHospital.id,
          destinationHospitalId: destinationHospital?.id,
          
          // Clinical Assessment
          glasgowComaScale: Math.floor(Math.random() * 8) + 8,
          mechanismOfInjury: getRandomItem(['PENETRATING', 'BLUNT', 'BURN', 'FALL', 'MOTOR_VEHICLE_ACCIDENT', 'OTHER']),
          incidentDateTime: addMinutes(admissionTime, -Math.floor(Math.random() * 60) - 15),
          
          // Pathway Execution
          arrivalDateTime: admissionTime,
          modeOfArrival: getRandomItem(['AMBULANCE', 'PRIVATE_VEHICLE', 'AIR_TRANSPORT', 'WALK_IN', 'POLICE', 'TRANSFERRED_FROM_HOSPITAL', 'OTHER']),
          
          
          // Injuries
          headAndNeckInjury: Math.random() > 0.3 ? 'Head trauma with possible concussion' : null,
          chestInjury: Math.random() > 0.4 ? 'Chest wall contusion, possible rib fractures' : null,
          abdomenInjury: Math.random() > 0.5 ? 'Abdominal tenderness, possible internal bleeding' : null,
          extremitiesInjury: Math.random() > 0.6 ? 'Multiple fractures, soft tissue injuries' : null,
          externalInjury: Math.random() > 0.8 ? 'Lacerations and abrasions' : null,
          
          // Additional Notes
          additionalNotes: `Trauma case with ${Math.random() > 0.5 ? 'surgery required' : 'conservative management'}. ${Math.random() > 0.6 ? 'Blood transfusion administered.' : ''} ${Math.random() > 0.8 ? 'Complications: ' + getRandomItem(['Infection', 'Bleeding', 'Organ failure', 'Sepsis']) : ''}`,
          
          createdById: createdBy.id,
        },
      });

      // Calculate and update quality metrics
      const updateData: any = {};
      
      // doorToSurgeryMinutes field not available in trauma case schema
      
      // doorInDoorOutMinutes field not available in trauma case schema

      if (Object.keys(updateData).length > 0) {
        await prisma.traumaCase.update({
          where: { id: traumaCase.id },
          data: updateData,
        });
      }
    }

    console.log('✅ Critical cases seed completed successfully!');
    console.log(`📊 Created:`);
    console.log(`   - 12 STEMI cases (${Math.floor(12 * 0.6)} with transfer tickets)`);
    console.log(`   - 12 Stroke cases (${Math.floor(12 * 0.6)} with transfer tickets)`);
    console.log(`   - 12 Trauma cases (${Math.floor(12 * 0.6)} with transfer tickets)`);
    console.log(`   - ${hospitals.length} hospitals`);
    console.log(`   - ${users.length} users`);
    console.log(`   - ${patients.length} patients`);

  } catch (error) {
    console.error('❌ Error seeding critical cases:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Export the seed function
export default seedCriticalCases;

// Run if called directly
if (require.main === module) {
  seedCriticalCases()
    .then(() => {
      console.log('🎉 Seed completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Seed failed:', error);
      process.exit(1);
    });
}
