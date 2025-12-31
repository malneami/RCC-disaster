import { PrismaClient, PatientGender, StrokeType, StrokeStatus, TraumaModeOfArrival, TraumaMechanismOfInjury, StrokeModeOfArrival } from '@prisma/client';

const prisma = new PrismaClient();

// Valid 10-digit nationalId values (following Saudi Arabia format)
const patientData = [
  // Stroke-related patients (indices 0-4)
  {
    nationalId: '1000000001',
    firstName: 'Ahmed',
    lastName: 'Al-Farsi',
    dateOfBirth: new Date('1958-03-15'),
    gender: PatientGender.MALE,
    phoneNumber: '+966501000001',
    maritalStatus: 'MARRIED',
    bloodType: 'A+',
    medicalHistory: 'History of hypertension and diabetes',
    riskFactors: '["hypertension", "diabetes", "smoking"]',
    caseType: 'STROKE',
  },
  {
    nationalId: '1000000002',
    firstName: 'Fatima',
    lastName: 'Al-Zahrani',
    dateOfBirth: new Date('1965-07-22'),
    gender: PatientGender.FEMALE,
    phoneNumber: '+966501000002',
    maritalStatus: 'MARRIED',
    bloodType: 'O+',
    medicalHistory: 'Atrial fibrillation, previous TIA',
    riskFactors: '["atrial_fibrillation", "previous_tia"]',
    caseType: 'STROKE',
  },
  {
    nationalId: '1000000003',
    firstName: 'Mohammed',
    lastName: 'Al-Ghamdi',
    dateOfBirth: new Date('1972-11-08'),
    gender: PatientGender.MALE,
    phoneNumber: '+966501000003',
    maritalStatus: 'SINGLE',
    bloodType: 'B+',
    medicalHistory: 'Obesity, hyperlipidemia',
    riskFactors: '["obesity", "hyperlipidemia"]',
    caseType: 'STROKE',
  },
  {
    nationalId: '1000000004',
    firstName: 'Sara',
    lastName: 'Al-Harbi',
    dateOfBirth: new Date('1980-02-28'),
    gender: PatientGender.FEMALE,
    phoneNumber: '+966501000004',
    maritalStatus: 'MARRIED',
    bloodType: 'AB+',
    medicalHistory: 'Migraine with aura',
    riskFactors: '["migraine_with_aura", "oral_contraceptives"]',
    caseType: 'STROKE',
  },
  {
    nationalId: '1000000005',
    firstName: 'Khalid',
    lastName: 'Al-Otaibi',
    dateOfBirth: new Date('1955-09-10'),
    gender: PatientGender.MALE,
    phoneNumber: '+966501000005',
    maritalStatus: 'WIDOWED',
    bloodType: 'O-',
    medicalHistory: 'Previous stroke, heart disease',
    riskFactors: '["previous_stroke", "heart_disease", "advanced_age"]',
    caseType: 'STROKE',
  },
  // STEMI-related patients (indices 5-9)
  {
    nationalId: '1000000006',
    firstName: 'Abdullah',
    lastName: 'Al-Qahtani',
    dateOfBirth: new Date('1962-05-18'),
    gender: PatientGender.MALE,
    phoneNumber: '+966501000006',
    maritalStatus: 'MARRIED',
    bloodType: 'A-',
    medicalHistory: 'Coronary artery disease, previous MI',
    riskFactors: '["coronary_artery_disease", "previous_mi", "smoking"]',
    caseType: 'STEMI',
  },
  {
    nationalId: '1000000007',
    firstName: 'Noura',
    lastName: 'Al-Shehri',
    dateOfBirth: new Date('1970-12-03'),
    gender: PatientGender.FEMALE,
    phoneNumber: '+966501000007',
    maritalStatus: 'DIVORCED',
    bloodType: 'B-',
    medicalHistory: 'Diabetes type 2, hypertension',
    riskFactors: '["diabetes", "hypertension", "family_history"]',
    caseType: 'STEMI',
  },
  {
    nationalId: '1000000008',
    firstName: 'Saud',
    lastName: 'Al-Dossary',
    dateOfBirth: new Date('1975-08-25'),
    gender: PatientGender.MALE,
    phoneNumber: '+966501000008',
    maritalStatus: 'MARRIED',
    bloodType: 'O+',
    medicalHistory: 'High cholesterol, sedentary lifestyle',
    riskFactors: '["hypercholesterolemia", "sedentary_lifestyle", "obesity"]',
    caseType: 'STEMI',
  },
  {
    nationalId: '1000000009',
    firstName: 'Maha',
    lastName: 'Al-Rashid',
    dateOfBirth: new Date('1968-04-14'),
    gender: PatientGender.FEMALE,
    phoneNumber: '+966501000009',
    maritalStatus: 'MARRIED',
    bloodType: 'A+',
    medicalHistory: 'Postmenopausal, family history of heart disease',
    riskFactors: '["postmenopausal", "family_history", "stress"]',
    caseType: 'STEMI',
  },
  {
    nationalId: '1000000010',
    firstName: 'Turki',
    lastName: 'Al-Mutairi',
    dateOfBirth: new Date('1950-01-30'),
    gender: PatientGender.MALE,
    phoneNumber: '+966501000010',
    maritalStatus: 'MARRIED',
    bloodType: 'AB-',
    medicalHistory: 'Advanced age, chronic kidney disease',
    riskFactors: '["advanced_age", "chronic_kidney_disease", "diabetes"]',
    caseType: 'STEMI',
  },
  // Trauma-related patients (indices 10-14)
  {
    nationalId: '1000000011',
    firstName: 'Faisal',
    lastName: 'Al-Subaie',
    dateOfBirth: new Date('1995-06-20'),
    gender: PatientGender.MALE,
    phoneNumber: '+966501000011',
    maritalStatus: 'SINGLE',
    bloodType: 'O+',
    medicalHistory: 'No significant medical history',
    riskFactors: '[]',
    caseType: 'TRAUMA',
  },
  {
    nationalId: '1000000012',
    firstName: 'Hanan',
    lastName: 'Al-Yami',
    dateOfBirth: new Date('1988-09-12'),
    gender: PatientGender.FEMALE,
    phoneNumber: '+966501000012',
    maritalStatus: 'MARRIED',
    bloodType: 'B+',
    medicalHistory: 'Mild asthma',
    riskFactors: '["asthma"]',
    caseType: 'TRAUMA',
  },
  {
    nationalId: '1000000013',
    firstName: 'Nasser',
    lastName: 'Al-Jaber',
    dateOfBirth: new Date('2005-03-08'),
    gender: PatientGender.MALE,
    phoneNumber: '+966501000013',
    maritalStatus: 'SINGLE',
    bloodType: 'A+',
    medicalHistory: 'Pediatric patient, no significant history',
    riskFactors: '[]',
    caseType: 'TRAUMA',
  },
  {
    nationalId: '1000000014',
    firstName: 'Layla',
    lastName: 'Al-Bloushi',
    dateOfBirth: new Date('1992-11-25'),
    gender: PatientGender.FEMALE,
    phoneNumber: '+966501000014',
    maritalStatus: 'SINGLE',
    bloodType: 'O-',
    medicalHistory: 'Previous fracture (healed)',
    riskFactors: '[]',
    caseType: 'TRAUMA',
  },
  {
    nationalId: '1000000015',
    firstName: 'Yasser',
    lastName: 'Al-Enezi',
    dateOfBirth: new Date('1978-07-17'),
    gender: PatientGender.MALE,
    phoneNumber: '+966501000015',
    maritalStatus: 'MARRIED',
    bloodType: 'B-',
    medicalHistory: 'Controlled hypertension',
    riskFactors: '["hypertension"]',
    caseType: 'TRAUMA',
  },
];

export async function seedPatients(): Promise<void> {
  console.log('👤 Seeding patients...');

  // Get admin user for createdById
  const adminUser = await prisma.user.findFirst({
    where: { role: 'ADMIN' },
    select: { id: true },
  });

  if (!adminUser) {
    console.error('❌ Admin user not found. Please seed users first.');
    return;
  }

  // Get first hospital for case creation
  const hospital = await prisma.hospital.findFirst({
    select: { id: true },
  });

  if (!hospital) {
    console.error('❌ No hospital found. Please seed hospitals first.');
    return;
  }

  let patientsCreated = 0;
  let patientsSkipped = 0;
  let strokeCasesCreated = 0;
  let stemiCasesCreated = 0;
  let traumaCasesCreated = 0;

  for (const patient of patientData) {
    try {
      // Check if patient already exists
      const existingPatient = await prisma.patient.findUnique({
        where: { nationalId: patient.nationalId },
      });

      let patientRecord;

      if (existingPatient) {
        patientRecord = existingPatient;
        patientsSkipped++;
      } else {
        // Create patient
        patientRecord = await prisma.patient.create({
          data: {
            nationalId: patient.nationalId,
            firstName: patient.firstName,
            lastName: patient.lastName,
            dateOfBirth: patient.dateOfBirth,
            gender: patient.gender,
            phoneNumber: patient.phoneNumber,
            maritalStatus: patient.maritalStatus as any,
            bloodType: patient.bloodType,
            medicalHistory: patient.medicalHistory,
            riskFactors: patient.riskFactors,
            createdById: adminUser.id,
            privacyLevel: 'PRIVATE',
            consentGiven: true,
          },
        });
        patientsCreated++;
      }

      // Create associated case if it doesn't exist
      if (patient.caseType === 'STROKE') {
        const existingCase = await prisma.strokeCase.findFirst({
          where: { patientId: patientRecord.id },
        });

        if (!existingCase) {
          await prisma.strokeCase.create({
            data: {
              patientId: patientRecord.id,
              originHospitalId: hospital.id,
              createdById: adminUser.id,
              strokeType: StrokeType.ISCHEMIC,
              currentStatus: StrokeStatus.SUSPECTED,
              modeOfArrival: StrokeModeOfArrival.AMBULANCE_RED_CRESCENT,
              dateOfAdmission: new Date(),
              chiefComplaint: patient.medicalHistory,
            },
          });
          strokeCasesCreated++;
        }
      } else if (patient.caseType === 'STEMI') {
        const existingCase = await prisma.stemiCase.findFirst({
          where: { patientId: patientRecord.id },
        });

        if (!existingCase) {
          await prisma.stemiCase.create({
            data: {
              patientId: patientRecord.id,
              originHospitalId: hospital.id,
              createdById: adminUser.id,
              currentStatus: 'SUSPECTED',
              modeOfArrival: 'AMBULANCE_RED_CRESCENT',
              presentingSymptoms: patient.medicalHistory,
              pathwayStarted: new Date(),
            },
          });
          stemiCasesCreated++;
        }
      } else if (patient.caseType === 'TRAUMA') {
        const existingCase = await prisma.traumaCase.findFirst({
          where: { patientId: patientRecord.id },
        });

        if (!existingCase) {
          await prisma.traumaCase.create({
            data: {
              patientId: patientRecord.id,
              originHospitalId: hospital.id,
              createdById: adminUser.id,
              arrivalDateTime: new Date(),
              modeOfArrival: TraumaModeOfArrival.AMBULANCE_RED_CRESCENT,
              mechanismOfInjury: TraumaMechanismOfInjury.MOTOR_VEHICLE_ACCIDENT,
              chiefComplaint: patient.medicalHistory || 'Trauma case',
              glasgowComaScale: 15,
            },
          });
          traumaCasesCreated++;
        }
      }
    } catch (error) {
      console.error(`⚠️  Error processing patient ${patient.firstName} ${patient.lastName}:`, error);
    }
  }

  console.log(`✅ Patients: ${patientsCreated} created, ${patientsSkipped} already existed`);
  console.log(`✅ Cases created: ${strokeCasesCreated} Stroke, ${stemiCasesCreated} STEMI, ${traumaCasesCreated} Trauma`);
}

// Allow running directly
if (require.main === module) {
  seedPatients()
    .catch((e) => {
      console.error('❌ Error seeding patients:', e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
