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

export async function seedComprehensiveStrokeCases() {
  console.log('🧠 Starting comprehensive Stroke case seeding...');

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
          firstName: `StrokePatient${i + 1}`,
          lastName: `Neurological${i + 1}`,
          nationalId: `234567890${i.toString().padStart(2, '0')}`,
          mrn: `STROKE-MRN${i + 1}`,
          age: 60 + Math.floor(Math.random() * 30),
          gender: getRandomItem(['MALE', 'FEMALE']),
          phoneNumber: `+966502345${i.toString().padStart(3, '0')}`,
          email: `strokepatient${i + 1}@test.com`,
          address: `Neurological Address ${i + 1}`,
          emergencyContact: `Neurological Emergency Contact ${i + 1}`,
          emergencyPhone: `+966502345${i.toString().padStart(3, '0')}`,
          medicalHistory: getRandomItem(['Hypertension, Atrial fibrillation', 'Diabetes, Previous stroke', 'Hyperlipidemia, Smoking', 'Heart disease, Hypertension', 'Previous TIA, Diabetes']),
          allergies: getRandomItem(['None', 'Contrast dye', 'Aspirin', 'Heparin']),
          medications: getRandomItem(['Warfarin, Aspirin', 'Antihypertensive, Statin', 'Antiplatelet therapy', 'Anticoagulation therapy']),
          bloodType: getRandomItem(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']),
          createdBy: {
            connect: { id: users[0].id }
          }
        },
      });
      patients.push(patient);
    }
  }

  console.log(`👥 Created ${patients.length} patients for Stroke cases`);

  // Create Stroke cases
  for (let i = 0; i < 20; i++) {
    const patient = patients[i % patients.length];
    const hospital = hospitals[i % hospitals.length];
    const user = users[i % users.length];

    // Create transfer ticket for 70% of cases
    let ticket = null;
    if (Math.random() < 0.7) {
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
          notes: `Stroke case: Comprehensive scenario ${i + 1}`,
          createdById: user.id,
        },
      });
    }

    // Calculate timings
    const arrivalTime = new Date(Date.now() - Math.random() * 3600000);
    const registrationTime = addMinutes(arrivalTime, Math.random() * 5 + 2);
    const triageTime = addMinutes(arrivalTime, Math.random() * 10 + 5);
    const physicianAssessmentTime = addMinutes(arrivalTime, Math.random() * 15 + 10);
    const ctScanStart = addMinutes(arrivalTime, Math.random() * 30 + 15);
    const ctReportFinal = addMinutes(ctScanStart, Math.random() * 20 + 10);
    const thrombolysisOrderTime = addMinutes(arrivalTime, Math.random() * 60 + 30);

    await prisma.strokeCase.create({
      data: {
        ticketId: ticket?.id || null,
        patientId: patient.id,
        originHospitalId: hospital.id,
        destinationHospitalId: ticket ? hospitals[(i + 1) % hospitals.length].id : null,
        
        // Stroke Classification
        strokeType: getRandomItem(['ISCHEMIC', 'HEMORRHAGIC', 'TIA']),
        strokeSubtype: getRandomItem(['Large vessel occlusion', 'Small vessel disease', 'Cardioembolic', 'Cryptogenic', 'Other']),
        
        // Patient Arrival & Timing (Step 1)
        modeOfArrival: getRandomItem(['AMBULANCE', 'BY_AMBULANCE_RED_CRESCENT', 'TRANSFERRED_FROM_PHC_UCC', 'WALK_IN', 'PRIVATE_VEHICLE']),
        srcaCallTime: Math.random() > 0.5 ? addMinutes(arrivalTime, -Math.random() * 30 - 10) : null,
        timeOfSymptomOnset: new Date(Date.now() - Math.random() * 7200000),
        lastKnownNormal: new Date(Date.now() - Math.random() * 7200000),
        timeOfRegistration: registrationTime,
        timeOfTriage: triageTime,
        timeOfPhysicianAssessment: physicianAssessmentTime,
        
        // Clinical Assessment & Diagnosis (Step 2)
        strokeTypeDetailed: getRandomItem(['ISCHEMIC_STROKE', 'HEMORRHAGIC_STROKE', 'TRANSIENT_ISCHEMIC_ATTACK_TIA']),
        swallowingScreeningPerformed: Math.random() > 0.1,
        timeOfSwallowingScreening: addMinutes(arrivalTime, Math.random() * 240 + 60),
        swallowingScreeningResult: getRandomItem(['PASS', 'FAIL', 'NOT_APPLICABLE']),
        ctScanPerformed: Math.random() > 0.05,
        timeOfCtScanStart: ctScanStart,
        timeOfCtReportFinal: ctReportFinal,
        ctFindings: getRandomItem(['NORMAL', 'ISCHEMIC_CHANGES', 'HEMORRHAGE']),
        lvoDetected: Math.random() > 0.7,
        candidateForIVThrombolysis: getRandomItem(['YES', 'NO', 'NOT_ASSESSED']),
        thrombolysisOrderTime: addMinutes(arrivalTime, Math.random() * 60 + 30),
        ivThrombolysisAdministrationTime: addMinutes(arrivalTime, Math.random() * 75 + 45),
        ivThrombolysisGiven: getRandomItem(['YES', 'NO', 'NOT_APPLICABLE']),
        reasonForNotAdministeringIV: Math.random() > 0.8 ? getRandomItem(['Contraindications', 'Outside time window', 'Patient refusal', 'Bleeding risk']) : null,
        candidateForMechanicalThrombectomy: getRandomItem(['YES', 'NO', 'NOT_ASSESSED']),
        timeOfMechanicalThrombectomyPuncture: addMinutes(arrivalTime, Math.random() * 120 + 60),
        mechanicalThrombectomyPerformed: Math.random() > 0.8,
        timeOfThrombectomyComplete: addMinutes(arrivalTime, Math.random() * 180 + 120),
        
        // Treatment Details
        currentStatus: getRandomItem(['SUSPECTED', 'CONFIRMED', 'IMAGING_PENDING', 'IMAGING_COMPLETE', 'TREATMENT_EVALUATION', 'THROMBOLYSIS_STARTED', 'THROMBECTOMY_STARTED', 'TREATMENT_COMPLETE', 'STROKEUNIT_ADMITTED']),
        selectedTreatment: getRandomItem(['IV_THROMBOLYSIS', 'MECHANICAL_THROMBECTOMY', 'COMBINED_THERAPY', 'CONSERVATIVE_MANAGEMENT']),
        eligibleForThrombolysis: Math.random() > 0.3,
        thrombolysisContraindications: Math.random() > 0.8 ? getRandomItem(['Recent surgery', 'Bleeding disorder', 'Anticoagulation', 'High blood pressure']) : null,
        eligibleForThrombectomy: Math.random() > 0.7,
        thrombectomyContraindications: Math.random() > 0.9 ? getRandomItem(['Large infarct', 'Bleeding risk', 'Advanced age']) : null,
        pathwayStarted: arrivalTime,
        pathwayCompleted: addMinutes(arrivalTime, Math.random() * 300 + 180),
        strokeUnitAdmissionTime: addMinutes(arrivalTime, Math.random() * 300 + 180),
        
        // Disposition & Transfer Decisions (Step 3)
        facilityHasCt: Math.random() > 0.2,
        transferToAnotherHospital: Math.random() > 0.6,
        timeOfTransferActivation: Math.random() > 0.6 ? addMinutes(arrivalTime, Math.random() * 60 + 30) : null,
        timeOfTransferDeparture: Math.random() > 0.6 ? addMinutes(arrivalTime, Math.random() * 90 + 60) : null,
        prehospitalNotificationBySrca: Math.random() > 0.5,
        prehospitalNotificationByUccPhc: Math.random() > 0.7,
        disposition: getRandomItem(['STROKE_UNIT', 'ICU', 'INPATIENT_WARD', 'DISCHARGED_HOME']),
        referralTo: getRandomItem([['STROKE_UNIT'], ['ICU'], ['NEUROLOGY'], ['INTERVENTIONAL_RADIOLOGY'], ['ANOTHER_HOSPITAL']]),
        admittedToStrokeUnit: Math.random() > 0.3,
        
        // Follow-up & Outcome Tracking (Step 4)
        followUpContactAttempted: Math.random() > 0.6,
        modifiedRankinScaleAt90Days: getRandomItem(['SCORE_0', 'SCORE_1', 'SCORE_2', 'SCORE_3', 'SCORE_4', 'SCORE_5']),
        
        // KPI Tracking (11 Stroke Toolkit KPIs)
        metKpi1: Math.random() > 0.1,
        metKpi2: Math.random() > 0.2,
        metKpi3: Math.random() > 0.15,
        metKpi4: Math.random() > 0.2,
        metKpi5: Math.random() > 0.25,
        metKpi6: Math.random() > 0.2,
        metKpi7: Math.random() > 0.3,
        metKpi8: Math.random() > 0.25,
        metKpi9: Math.random() > 0.2,
        metKpi10: Math.random() > 0.15,
        metKpi11: Math.random() > 0.2,
        
        // KPI Timing Calculations (in minutes)
        doorToPhysicianMinutes: Math.floor((physicianAssessmentTime.getTime() - arrivalTime.getTime()) / (1000 * 60)),
        registrationToCtMinutes: Math.floor((ctScanStart.getTime() - registrationTime.getTime()) / (1000 * 60)),
        doorToNeedleMinutes: Math.floor(Math.random() * 75 + 45), // Same as registration to thrombolysis
        registrationToThrombolysisMinutes: Math.floor(Math.random() * 75 + 45),
        registrationToMechanicalThrombectomyMinutes: Math.floor(Math.random() * 120 + 60),
        srcaCallToArrivalMinutes: Math.random() > 0.5 ? Math.floor(Math.random() * 60 + 30) : null,
        transferActivationToDepartureMinutes: Math.random() > 0.6 ? Math.floor(Math.random() * 40 + 20) : null,
        swallowingScreeningWithin4Hours: Math.random() > 0.15,
        
        createdById: user.id,
      },
    });
  }

  console.log('✅ Comprehensive Stroke case seeding completed successfully!');
}
