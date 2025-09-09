const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Helper function to create realistic dates
function createRealisticDates() {
  const now = new Date();
  const incidentTime = new Date(now.getTime() - Math.random() * 2 * 60 * 60 * 1000); // 0-2 hours ago
  const arrivalTime = new Date(incidentTime.getTime() + Math.random() * 60 * 60 * 1000); // 0-1 hour after incident
  
  return {
    incidentDateTime: incidentTime.toISOString(),
    arrivalDateTime: arrivalTime.toISOString(),
    transferRequestDateTime: Math.random() > 0.5 ? new Date(arrivalTime.getTime() + Math.random() * 30 * 60 * 1000).toISOString() : null,
    transferArrivalDateTime: Math.random() > 0.5 ? new Date(arrivalTime.getTime() + Math.random() * 2 * 60 * 60 * 1000).toISOString() : null,
  };
}

// Helper function to create realistic vital signs
function createRealisticVitalSigns() {
  return {
    temperature: Math.round((36.5 + Math.random() * 2) * 10) / 10, // 36.5-38.5°C
    heartRate: Math.floor(60 + Math.random() * 60), // 60-120 bpm
    bloodPressure: `${Math.floor(90 + Math.random() * 40)}/${Math.floor(60 + Math.random() * 30)}`, // 90-130/60-90
    oxygenSaturation: Math.floor(95 + Math.random() * 5), // 95-100%
    respiratoryRate: Math.floor(12 + Math.random() * 16), // 12-28 breaths/min
  };
}

// Helper function to create realistic disposition
function createRealisticDisposition() {
  const dispositions = [
    {
      dischargeInstructions: "Follow up with primary care physician within 48 hours. Rest and avoid strenuous activity.",
      followUpRequired: true,
      followUpDate: new Date(Date.now() + Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Within 7 days
      medicationsPrescribed: "Ibuprofen 400mg every 6 hours as needed for pain",
      restrictions: "No heavy lifting for 2 weeks. Avoid contact sports until cleared by physician."
    },
    {
      dischargeInstructions: "Monitor for signs of concussion. Return immediately if symptoms worsen.",
      followUpRequired: true,
      followUpDate: new Date(Date.now() + Math.random() * 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Within 3 days
      medicationsPrescribed: "Acetaminophen 500mg every 4-6 hours. Avoid aspirin.",
      restrictions: "No driving for 24 hours. Rest in quiet environment."
    },
    {
      dischargeInstructions: "Continue current medications. Schedule follow-up with cardiology.",
      followUpRequired: true,
      followUpDate: new Date(Date.now() + Math.random() * 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Within 14 days
      medicationsPrescribed: "Metoprolol 25mg twice daily. Lisinopril 10mg daily.",
      restrictions: "Low sodium diet. Monitor blood pressure daily."
    }
  ];
  
  return dispositions[Math.floor(Math.random() * dispositions.length)];
}

// Comprehensive test data
const comprehensiveTestData = [
  {
    patientInfo: {
      firstName: "Ahmed",
      lastName: "Al-Rashid",
      nationalId: "1234567890",
      dateOfBirth: "1985-03-15",
      gender: "MALE",
      phoneNumber: "+966501234567",
      address: "123 King Fahd Road, Riyadh, Saudi Arabia",
      emergencyContact: "Fatima Al-Rashid",
      emergencyPhone: "+966501234568",
      medicalHistory: "Hypertension, Type 2 Diabetes",
      allergies: "Penicillin, Shellfish",
      medications: "Metformin 500mg twice daily, Lisinopril 10mg daily"
    },
    incidentDetails: {
      modeOfArrival: "AMBULANCE",
      mechanismOfInjury: "MOTOR_VEHICLE_ACCIDENT",
      chiefComplaint: "Severe chest pain and difficulty breathing after car accident"
    },
    vitalsAssessment: {
      vitalSigns: createRealisticVitalSigns(),
      glasgowComaScale: 15,
      systolicBloodPressure: 140,
      respiratoryRate: 22,
      additionalVitalSigns: "Patient appears anxious, diaphoretic"
    },
    injuryAssessment: {
      headAndNeckInjury: "2 - Minor: - Superficial lacerations",
      faceInjury: "1 - No Injury: - No injury",
      chestInjury: "3 - Moderate: - Simple rib fractures (1-2 ribs)",
      abdomenInjury: "2 - Minor: - Contusion",
      extremitiesInjury: "2 - Minor: - Minor fractures",
      externalInjury: "2 - Minor: - Superficial burns"
    },
    disposition: {
      edDisposition: "ICU_ADMISSION",
      additionalNotes: "Patient requires close monitoring due to chest trauma",
      disposition: createRealisticDisposition()
    }
  },
  {
    patientInfo: {
      firstName: "Sarah",
      lastName: "Al-Zahra",
      nationalId: "2345678901",
      dateOfBirth: "1992-07-22",
      gender: "FEMALE",
      phoneNumber: "+966502345678",
      address: "456 Prince Mohammed Street, Jeddah, Saudi Arabia",
      emergencyContact: "Mohammed Al-Zahra",
      emergencyPhone: "+966502345679",
      medicalHistory: "Asthma, Allergic rhinitis",
      allergies: "Latex, Dust mites",
      medications: "Albuterol inhaler PRN, Cetirizine 10mg daily"
    },
    incidentDetails: {
      modeOfArrival: "PRIVATE_VEHICLE",
      mechanismOfInjury: "FALL",
      chiefComplaint: "Severe headache and confusion after falling down stairs"
    },
    vitalsAssessment: {
      vitalSigns: createRealisticVitalSigns(),
      glasgowComaScale: 12,
      systolicBloodPressure: 110,
      respiratoryRate: 18,
      additionalVitalSigns: "Patient confused, pupils equal and reactive"
    },
    injuryAssessment: {
      headAndNeckInjury: "4 - Serious: - Skull fracture with intracranial bleeding",
      faceInjury: "2 - Minor: - Facial contusion",
      chestInjury: "1 - No Injury: - No injury",
      abdomenInjury: "1 - No Injury: - No injury",
      extremitiesInjury: "2 - Minor: - Minor contusions",
      externalInjury: "2 - Minor: - Abrasions"
    },
    disposition: {
      edDisposition: "ICU_ADMISSION",
      additionalNotes: "Urgent ICU admission for head injury monitoring",
      disposition: createRealisticDisposition()
    }
  },
  {
    patientInfo: {
      firstName: "Omar",
      lastName: "Al-Mansouri",
      nationalId: "3456789012",
      dateOfBirth: "1978-11-08",
      gender: "MALE",
      phoneNumber: "+966503456789",
      address: "789 Al-Madinah Road, Dammam, Saudi Arabia",
      emergencyContact: "Aisha Al-Mansouri",
      emergencyPhone: "+966503456790",
      medicalHistory: "Coronary artery disease, Hyperlipidemia",
      allergies: "None known",
      medications: "Atorvastatin 40mg daily, Aspirin 81mg daily"
    },
    incidentDetails: {
      modeOfArrival: "AIR_TRANSPORT",
      mechanismOfInjury: "MOTOR_VEHICLE_ACCIDENT",
      chiefComplaint: "Gunshot wound to abdomen with severe bleeding"
    },
    vitalsAssessment: {
      vitalSigns: createRealisticVitalSigns(),
      glasgowComaScale: 14,
      systolicBloodPressure: 90,
      respiratoryRate: 24,
      additionalVitalSigns: "Patient pale, tachycardic, hypotensive"
    },
    injuryAssessment: {
      headAndNeckInjury: "1 - No Injury: - No injury",
      faceInjury: "1 - No Injury: - No injury",
      chestInjury: "1 - No Injury: - No injury",
      abdomenInjury: "5 - Critical: - Major organ injury with active bleeding",
      extremitiesInjury: "1 - No Injury: - No injury",
      externalInjury: "4 - Serious: - Penetrating wound with foreign body"
    },
    disposition: {
      edDisposition: "ICU_ADMISSION",
      additionalNotes: "Emergency surgery required immediately",
      disposition: createRealisticDisposition()
    }
  },
  {
    patientInfo: {
      firstName: "Layla",
      lastName: "Al-Fahad",
      nationalId: "4567890123",
      dateOfBirth: "1995-05-30",
      gender: "FEMALE",
      phoneNumber: "+966504567890",
      address: "321 Al-Khobar Corniche, Al-Khobar, Saudi Arabia",
      emergencyContact: "Khalid Al-Fahad",
      emergencyPhone: "+966504567891",
      medicalHistory: "Pregnancy (32 weeks), Gestational diabetes",
      allergies: "Sulfa drugs",
      medications: "Insulin glargine 20 units daily, Prenatal vitamins"
    },
    incidentDetails: {
      modeOfArrival: "AMBULANCE",
      mechanismOfInjury: "MOTOR_VEHICLE_ACCIDENT",
      chiefComplaint: "Abdominal pain and vaginal bleeding after car accident"
    },
    vitalsAssessment: {
      vitalSigns: createRealisticVitalSigns(),
      glasgowComaScale: 15,
      systolicBloodPressure: 120,
      respiratoryRate: 20,
      additionalVitalSigns: "Fetal heart rate 140 bpm, uterus tender"
    },
    injuryAssessment: {
      headAndNeckInjury: "1 - No Injury: - No injury",
      faceInjury: "1 - No Injury: - No injury",
      chestInjury: "1 - No Injury: - No injury",
      abdomenInjury: "3 - Moderate: - Uterine trauma with placental abruption",
      extremitiesInjury: "2 - Minor: - Minor contusions",
      externalInjury: "2 - Minor: - Seat belt abrasions"
    },
    disposition: {
      edDisposition: "ICU_ADMISSION",
      additionalNotes: "Urgent ICU admission for pregnancy complications",
      disposition: createRealisticDisposition()
    }
  },
  {
    patientInfo: {
      firstName: "Hassan",
      lastName: "Al-Sheikh",
      nationalId: "5678901234",
      dateOfBirth: "1988-12-12",
      gender: "MALE",
      phoneNumber: "+966505678901",
      address: "654 Al-Taif Highway, Taif, Saudi Arabia",
      emergencyContact: "Noura Al-Sheikh",
      emergencyPhone: "+966505678902",
      medicalHistory: "Epilepsy, Depression",
      allergies: "Phenytoin",
      medications: "Levetiracetam 1000mg twice daily, Sertraline 50mg daily"
    },
    incidentDetails: {
      modeOfArrival: "PRIVATE_VEHICLE",
      mechanismOfInjury: "FALL",
      chiefComplaint: "Seizure and head injury after falling during seizure"
    },
    vitalsAssessment: {
      vitalSigns: createRealisticVitalSigns(),
      glasgowComaScale: 8,
      systolicBloodPressure: 130,
      respiratoryRate: 16,
      additionalVitalSigns: "Post-ictal state, tongue laceration"
    },
    injuryAssessment: {
      headAndNeckInjury: "3 - Moderate: - Concussion with brief loss of consciousness",
      faceInjury: "2 - Minor: - Tongue laceration",
      chestInjury: "1 - No Injury: - No injury",
      abdomenInjury: "1 - No Injury: - No injury",
      extremitiesInjury: "2 - Minor: - Minor abrasions from fall",
      externalInjury: "2 - Minor: - Minor lacerations"
    },
    disposition: {
      edDisposition: "MEDICAL_WARD_ADMISSION",
      additionalNotes: "Medical ward admission for seizure management",
      disposition: createRealisticDisposition()
    }
  },
  {
    patientInfo: {
      firstName: "Amina",
      lastName: "Al-Qurashi",
      nationalId: "6789012345",
      dateOfBirth: "1990-09-18",
      gender: "FEMALE",
      phoneNumber: "+966506789012",
      address: "987 Al-Baha Street, Al-Baha, Saudi Arabia",
      emergencyContact: "Abdullah Al-Qurashi",
      emergencyPhone: "+966506789013",
      medicalHistory: "Rheumatoid arthritis, Osteoporosis",
      allergies: "NSAIDs",
      medications: "Methotrexate 15mg weekly, Calcium 1000mg daily"
    },
    incidentDetails: {
      modeOfArrival: "AMBULANCE",
      mechanismOfInjury: "FALL",
      chiefComplaint: "Hip pain and inability to walk after fall"
    },
    vitalsAssessment: {
      vitalSigns: createRealisticVitalSigns(),
      glasgowComaScale: 15,
      systolicBloodPressure: 110,
      respiratoryRate: 18,
      additionalVitalSigns: "Patient in severe pain, right leg externally rotated"
    },
    injuryAssessment: {
      headAndNeckInjury: "1 - No Injury: - No injury",
      faceInjury: "1 - No Injury: - No injury",
      chestInjury: "1 - No Injury: - No injury",
      abdomenInjury: "1 - No Injury: - No injury",
      extremitiesInjury: "4 - Serious: - Hip fracture with displacement",
      externalInjury: "2 - Minor: - Minor abrasions"
    },
    disposition: {
      edDisposition: "MEDICAL_WARD_ADMISSION",
      additionalNotes: "Medical ward admission for hip fracture management",
      disposition: createRealisticDisposition()
    }
  },
  {
    patientInfo: {
      firstName: "Yousef",
      lastName: "Al-Mutairi",
      nationalId: "7890123456",
      dateOfBirth: "1983-04-25",
      gender: "MALE",
      phoneNumber: "+966507890123",
      address: "147 Al-Hail District, Riyadh, Saudi Arabia",
      emergencyContact: "Mariam Al-Mutairi",
      emergencyPhone: "+966507890124",
      medicalHistory: "Chronic kidney disease, Hypertension",
      allergies: "Contrast dye",
      medications: "Furosemide 40mg daily, Amlodipine 5mg daily"
    },
    incidentDetails: {
      modeOfArrival: "PRIVATE_VEHICLE",
      mechanismOfInjury: "MOTOR_VEHICLE_ACCIDENT",
      chiefComplaint: "Severe back pain and leg weakness after rear-end collision"
    },
    vitalsAssessment: {
      vitalSigns: createRealisticVitalSigns(),
      glasgowComaScale: 15,
      systolicBloodPressure: 150,
      respiratoryRate: 20,
      additionalVitalSigns: "Decreased sensation in lower extremities"
    },
    injuryAssessment: {
      headAndNeckInjury: "2 - Minor: - Whiplash injury",
      faceInjury: "1 - No Injury: - No injury",
      chestInjury: "1 - No Injury: - No injury",
      abdomenInjury: "1 - No Injury: - No injury",
      extremitiesInjury: "3 - Moderate: - Spinal cord injury with neurological deficit",
      externalInjury: "2 - Minor: - Minor contusions"
    },
    disposition: {
      edDisposition: "ICU_ADMISSION",
      additionalNotes: "ICU admission for spinal cord injury monitoring",
      disposition: createRealisticDisposition()
    }
  },
  {
    patientInfo: {
      firstName: "Fatima",
      lastName: "Al-Harbi",
      nationalId: "8901234567",
      dateOfBirth: "1997-01-14",
      gender: "FEMALE",
      phoneNumber: "+966508901234",
      address: "258 Al-Qassim Road, Buraydah, Saudi Arabia",
      emergencyContact: "Saad Al-Harbi",
      emergencyPhone: "+966508901235",
      medicalHistory: "None significant",
      allergies: "None known",
      medications: "None"
    },
    incidentDetails: {
      modeOfArrival: "AMBULANCE",
      mechanismOfInjury: "BURN",
      chiefComplaint: "Severe burns to arms and chest from kitchen fire"
    },
    vitalsAssessment: {
      vitalSigns: createRealisticVitalSigns(),
      glasgowComaScale: 15,
      systolicBloodPressure: 100,
      respiratoryRate: 24,
      additionalVitalSigns: "Patient in severe pain, burns covering 15% body surface"
    },
    injuryAssessment: {
      headAndNeckInjury: "1 - No Injury: - No injury",
      faceInjury: "1 - No Injury: - No injury",
      chestInjury: "3 - Moderate: - Partial thickness burns",
      abdomenInjury: "1 - No Injury: - No injury",
      extremitiesInjury: "3 - Moderate: - Partial thickness burns to both arms",
      externalInjury: "4 - Serious: - 2nd degree burns involving 15% TBSA"
    },
    disposition: {
      edDisposition: "ICU_ADMISSION",
      additionalNotes: "ICU admission for burn care and monitoring",
      disposition: createRealisticDisposition()
    }
  },
  {
    patientInfo: {
      firstName: "Khalid",
      lastName: "Al-Ghamdi",
      nationalId: "9012345678",
      dateOfBirth: "1980-08-03",
      gender: "MALE",
      phoneNumber: "+966509012345",
      address: "369 Al-Jubail Industrial City, Jubail, Saudi Arabia",
      emergencyContact: "Hala Al-Ghamdi",
      emergencyPhone: "+966509012346",
      medicalHistory: "Industrial chemical exposure history, COPD",
      allergies: "Industrial solvents",
      medications: "Albuterol inhaler PRN, Prednisone 10mg daily"
    },
    incidentDetails: {
      modeOfArrival: "AMBULANCE",
      mechanismOfInjury: "BURN",
      chiefComplaint: "Difficulty breathing and chemical burns after industrial accident"
    },
    vitalsAssessment: {
      vitalSigns: createRealisticVitalSigns(),
      glasgowComaScale: 13,
      systolicBloodPressure: 110,
      respiratoryRate: 28,
      additionalVitalSigns: "Wheezing, chemical odor present"
    },
    injuryAssessment: {
      headAndNeckInjury: "2 - Minor: - Chemical irritation",
      faceInjury: "2 - Minor: - Chemical burns to face",
      chestInjury: "3 - Moderate: - Chemical pneumonitis",
      abdomenInjury: "1 - No Injury: - No injury",
      extremitiesInjury: "2 - Minor: - Minor chemical burns",
      externalInjury: "3 - Moderate: - Chemical burns involving 10% TBSA"
    },
    disposition: {
      edDisposition: "ICU_ADMISSION",
      additionalNotes: "ICU admission for respiratory monitoring and chemical exposure treatment",
      disposition: createRealisticDisposition()
    }
  },
  {
    patientInfo: {
      firstName: "Noura",
      lastName: "Al-Sabah",
      nationalId: "0123456789",
      dateOfBirth: "1993-06-20",
      gender: "FEMALE",
      phoneNumber: "+966500123456",
      address: "741 Al-Ahsa Oasis, Al-Ahsa, Saudi Arabia",
      emergencyContact: "Fahad Al-Sabah",
      emergencyPhone: "+966500123457",
      medicalHistory: "Migraine, Anxiety disorder",
      allergies: "Codeine",
      medications: "Sumatriptan 50mg PRN, Lorazepam 0.5mg PRN"
    },
    incidentDetails: {
      modeOfArrival: "PRIVATE_VEHICLE",
      mechanismOfInjury: "MOTOR_VEHICLE_ACCIDENT",
      chiefComplaint: "Severe headache and neck pain after head-on collision"
    },
    vitalsAssessment: {
      vitalSigns: createRealisticVitalSigns(),
      glasgowComaScale: 14,
      systolicBloodPressure: 120,
      respiratoryRate: 18,
      additionalVitalSigns: "Patient anxious, photophobic"
    },
    injuryAssessment: {
      headAndNeckInjury: "3 - Moderate: - Concussion with post-traumatic headache",
      faceInjury: "2 - Minor: - Facial contusion",
      chestInjury: "2 - Minor: - Seat belt contusion",
      abdomenInjury: "1 - No Injury: - No injury",
      extremitiesInjury: "2 - Minor: - Minor contusions",
      externalInjury: "2 - Minor: - Minor abrasions"
    },
    disposition: {
      edDisposition: "DISCHARGE",
      additionalNotes: "Patient stable for discharge with follow-up instructions",
      disposition: createRealisticDisposition()
    }
  }
];

async function createComprehensiveTestData() {
  try {
    console.log('🚀 Starting comprehensive trauma test data creation...');
    
    // Get available hospitals
    const hospitals = await prisma.hospital.findMany({
      select: { id: true, name: true }
    });
    
    if (hospitals.length < 2) {
      throw new Error('Need at least 2 hospitals for test data');
    }
    
    console.log(`📋 Found ${hospitals.length} hospitals available`);
    
    // Create or update patients first
    const patients = [];
    for (let i = 0; i < comprehensiveTestData.length; i++) {
      const data = comprehensiveTestData[i];
      const uniqueNationalId = `${data.patientInfo.nationalId}${i}`; // Make unique
      
      const patient = await prisma.patient.upsert({
        where: { nationalId: uniqueNationalId },
        update: {
          firstName: data.patientInfo.firstName,
          lastName: data.patientInfo.lastName,
          dateOfBirth: new Date(data.patientInfo.dateOfBirth),
          gender: data.patientInfo.gender,
          phoneNumber: data.patientInfo.phoneNumber,
          address: data.patientInfo.address,
          emergencyContact: data.patientInfo.emergencyContact,
          emergencyPhone: data.patientInfo.emergencyPhone,
          medicalHistory: data.patientInfo.medicalHistory,
          allergies: data.patientInfo.allergies,
          medications: data.patientInfo.medications,
          updatedAt: new Date(),
        },
        create: {
          firstName: data.patientInfo.firstName,
          lastName: data.patientInfo.lastName,
          nationalId: uniqueNationalId,
          dateOfBirth: new Date(data.patientInfo.dateOfBirth),
          gender: data.patientInfo.gender,
          phoneNumber: data.patientInfo.phoneNumber,
          address: data.patientInfo.address,
          emergencyContact: data.patientInfo.emergencyContact,
          emergencyPhone: data.patientInfo.emergencyPhone,
          medicalHistory: data.patientInfo.medicalHistory,
          allergies: data.patientInfo.allergies,
          medications: data.patientInfo.medications,
          createdById: '069b34bc-26ae-478d-b962-bba99707b50d', // Admin user
        }
      });
      patients.push(patient);
    }
    
    console.log(`✅ Created ${patients.length} patients`);
    
    // Create tickets and trauma cases
    const traumaCases = [];
    for (let i = 0; i < comprehensiveTestData.length; i++) {
      const data = comprehensiveTestData[i];
      const patient = patients[i];
      const dates = createRealisticDates();
      
      // Select random hospitals
      const originHospital = hospitals[Math.floor(Math.random() * hospitals.length)];
      const destinationHospital = hospitals[Math.floor(Math.random() * hospitals.length)];
      
      const uniqueTicketNumber = `TRAUMA-${Date.now()}-${i}-${Math.random().toString(36).substr(2, 9)}`;
      
      // Create ticket first
      const ticket = await prisma.ticket.create({
        data: {
          ticketNumber: uniqueTicketNumber,
          patientId: patient.id,
          originHospitalId: originHospital.id,
          destinationHospitalId: destinationHospital.id,
          priority: 'HIGH',
          status: 'COMPLETED',
          pathway: 'TRAUMA',
          chiefComplaint: data.incidentDetails.chiefComplaint,
          vitals: JSON.stringify(data.vitalsAssessment.vitalSigns),
          isEmergency: true,
          emergencyType: 'TRAUMA',
          emergencySeverity: data.vitalsAssessment.glasgowComaScale < 8 ? 'CRITICAL' : 'URGENT',
          notes: `Trauma case: ${data.incidentDetails.mechanismOfInjury}`,
          createdById: '069b34bc-26ae-478d-b962-bba99707b50d', // Admin user
          completedAt: new Date(dates.arrivalDateTime),
        }
      });
      
      // Create trauma case
      const traumaCase = await prisma.traumaCase.create({
        data: {
          ticketId: ticket.id,
          patientId: patient.id,
          originHospitalId: originHospital.id,
          destinationHospitalId: destinationHospital.id,
          arrivalDateTime: new Date(dates.arrivalDateTime),
          incidentDateTime: new Date(dates.incidentDateTime),
          modeOfArrival: data.incidentDetails.modeOfArrival,
          transferRequestDateTime: dates.transferRequestDateTime ? new Date(dates.transferRequestDateTime) : null,
          transferArrivalDateTime: dates.transferArrivalDateTime ? new Date(dates.transferArrivalDateTime) : null,
          transferDurationMinutes: dates.transferArrivalDateTime && dates.transferRequestDateTime ? 
            Math.floor((new Date(dates.transferArrivalDateTime).getTime() - new Date(dates.transferRequestDateTime).getTime()) / (1000 * 60)) : null,
          chiefComplaint: data.incidentDetails.chiefComplaint,
          mechanismOfInjury: data.incidentDetails.mechanismOfInjury,
          vitalSigns: JSON.stringify(data.vitalsAssessment.vitalSigns),
          glasgowComaScale: data.vitalsAssessment.glasgowComaScale,
          systolicBloodPressure: data.vitalsAssessment.systolicBloodPressure,
          respiratoryRate: data.vitalsAssessment.respiratoryRate,
          additionalVitalSigns: data.vitalsAssessment.additionalVitalSigns,
          headAndNeckInjury: data.injuryAssessment.headAndNeckInjury,
          faceInjury: data.injuryAssessment.faceInjury,
          chestInjury: data.injuryAssessment.chestInjury,
          abdomenInjury: data.injuryAssessment.abdomenInjury,
          extremitiesInjury: data.injuryAssessment.extremitiesInjury,
          externalInjury: data.injuryAssessment.externalInjury,
          primarySurveyFindings: "Primary survey completed - ABCDE assessment",
          edDisposition: data.disposition.edDisposition,
          additionalNotes: data.disposition.additionalNotes,
          disposition: JSON.stringify(data.disposition.disposition),
          responseTimeMinutes: Math.floor((new Date(dates.arrivalDateTime).getTime() - new Date(dates.incidentDateTime).getTime()) / (1000 * 60)),
          criticalCase: data.vitalsAssessment.glasgowComaScale < 8,
          transferCase: Math.random() > 0.3, // 70% chance of being a transfer case
          createdById: '069b34bc-26ae-478d-b962-bba99707b50d', // Admin user
        }
      });
      
      traumaCases.push(traumaCase);
    }
    
    console.log(`✅ Created ${traumaCases.length} trauma cases`);
    
    // Test KPI calculation
    console.log('🧪 Testing KPI calculation...');
    const kpiSummary = await prisma.traumaCase.aggregate({
      where: { deletedAt: null },
      _count: { id: true },
      _avg: { 
        responseTimeMinutes: true,
        glasgowComaScale: true 
      }
    });
    
    console.log('📊 KPI Summary:');
    console.log(`Total Cases: ${kpiSummary._count.id}`);
    console.log(`Average Response Time: ${kpiSummary._avg.responseTimeMinutes?.toFixed(1) || 0} minutes`);
    console.log(`Average Glasgow Score: ${kpiSummary._avg.glasgowComaScale?.toFixed(1) || 0}`);
    
    console.log('🎉 Comprehensive trauma test data creation completed successfully!');
    console.log(`📋 Created ${patients.length} patients and ${traumaCases.length} trauma cases`);
    console.log('🔗 Test the frontend at: http://localhost:5173');
    
  } catch (error) {
    console.error('❌ Error creating comprehensive test data:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
createComprehensiveTestData()
  .then(() => {
    console.log('✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
