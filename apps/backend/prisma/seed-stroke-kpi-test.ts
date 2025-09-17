import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'crypto';

const prisma = new PrismaClient();

// Helper function to add minutes to a date
function addMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60000);
}

// Helper function to get random item from array
function getRandomItem<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

// Helper function to generate random boolean with probability
function randomBoolean(probability: number = 0.5): boolean {
  return Math.random() < probability;
}

async function main() {
  console.log('🧠 Starting Stroke KPI Test Seed...');

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

  // Get existing patients or create new ones
  let patients = await prisma.patient.findMany({ take: 20 });
  
  if (patients.length < 20) {
    // Create additional patients if needed
    for (let i = patients.length; i < 20; i++) {
      const patient = await prisma.patient.create({
        data: {
          firstName: `Patient${i + 1}`,
          lastName: `Test${i + 1}`,
          nationalId: `123456789${i.toString().padStart(2, '0')}`,
          mrn: `MRN${i + 1}`,
          age: 45 + Math.floor(Math.random() * 40), // 45-85 years
          gender: getRandomItem(['MALE', 'FEMALE']),
          phoneNumber: `+966501234${i.toString().padStart(3, '0')}`,
          email: `patient${i + 1}@test.com`,
          address: `Test Address ${i + 1}`,
          emergencyContact: `Emergency Contact ${i + 1}`,
          emergencyPhone: `+966501234${i.toString().padStart(3, '0')}`,
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

  // Create stroke cases with varied KPI results
  const strokeCases = [];
  
  // Scenario 1: Excellent KPI performance (5 cases)
  for (let i = 0; i < 5; i++) {
    // Use a consistent base time (2 hours ago) to ensure realistic timing
    const baseTime = new Date();
    baseTime.setHours(baseTime.getHours() - 2);
    const admissionTime = new Date(baseTime);
    
    const strokeCase = await prisma.strokeCase.create({
      data: {
        ticketId: null,
        patientId: patients[i].id,
        originHospitalId: hospitals[0].id,
        destinationHospitalId: null,
        
        // Basic Information
        strokeType: 'ISCHEMIC',
        currentStatus: 'TREATMENT_COMPLETE',
        selectedTreatment: 'IV_THROMBOLYSIS',
        
        // Patient Arrival & Timing - EXCELLENT PERFORMANCE
        modeOfArrival: 'BY_AMBULANCE_RED_CRESCENT',
        srcaCallTime: addMinutes(admissionTime, -45), // 45 min before arrival
        timeOfSymptomOnset: addMinutes(admissionTime, -120), // 2 hours before arrival
        lastKnownNormal: addMinutes(admissionTime, -120),
        timeOfRegistration: admissionTime,
        timeOfTriage: addMinutes(admissionTime, 2), // 2 min after registration
        timeOfPhysicianAssessment: addMinutes(admissionTime, 10), // 10 min after registration
        
        // Clinical Assessment & Diagnosis
        strokeTypeDetailed: 'ISCHEMIC_STROKE',
        swallowingScreeningPerformed: true,
        timeOfSwallowingScreening: addMinutes(admissionTime, 15), // 15 min after registration
        swallowingScreeningResult: 'PASS',
        ctScanPerformed: true,
        timeOfCtScanStart: addMinutes(admissionTime, 15), // 15 min after registration
        timeOfCtReportFinal: addMinutes(admissionTime, 25), // 25 min after registration
        ctFindings: 'NORMAL',
        lvoDetected: false,
        
        // Treatment Details
        candidateForIVThrombolysis: 'YES',
        thrombolysisOrderTime: addMinutes(admissionTime, 30), // 30 min after registration
        ivThrombolysisAdministrationTime: addMinutes(admissionTime, 45), // 45 min after registration
        ivThrombolysisGiven: 'YES',
        reasonForNotAdministeringIV: null,
        candidateForMechanicalThrombectomy: 'NO',
        timeOfGroinPuncture: null,
        mechanicalThrombectomyPerformed: false,
        timeOfThrombectomyComplete: null,
        
        // Disposition & Transfer Decisions
        facilityHasCt: true,
        transferToAnotherHospital: false,
        timeOfTransferActivation: null,
        timeOfTransferDeparture: null,
        prehospitalNotificationBySrca: true,
        prehospitalNotificationByUccPhc: false,
        disposition: 'STROKE_UNIT',
        referralTo: ['STROKE_UNIT'],
        admittedToStrokeUnit: true,
        
        // Follow-up & Outcome Tracking
        followUpContactAttempted: true,
        modifiedRankinScaleAt90Days: 'SCORE_0',
        
        // Legacy fields
        strokeSubtype: 'LARGE_VESSEL_OCCLUSION',
        eligibleForThrombolysis: true,
        thrombolysisContraindications: null,
        eligibleForThrombectomy: false,
        thrombectomyContraindications: 'No LVO detected',
        pathwayStarted: addMinutes(admissionTime, 5),
        pathwayCompleted: addMinutes(admissionTime, 60),
        strokeUnitAdmissionTime: addMinutes(admissionTime, 90),
        symptomNeedleMinutes: 165, // 2h45min from symptom onset
        symptomGroinMinutes: null,
        imagingToNeedleMinutes: 30,
        imagingToGroinMinutes: null,
        
        // KPI calculations will be done by the service
        createdById: users[0].id,
      },
    });
    strokeCases.push(strokeCase);
  }

  // Scenario 2: Good KPI performance (5 cases)
  for (let i = 5; i < 10; i++) {
    // Use a consistent base time (4 hours ago) to ensure realistic timing
    const baseTime = new Date();
    baseTime.setHours(baseTime.getHours() - 4);
    const admissionTime = new Date(baseTime);
    
    const strokeCase = await prisma.strokeCase.create({
      data: {
        ticketId: null,
        patientId: patients[i].id,
        originHospitalId: hospitals[1].id,
        destinationHospitalId: null,
        
        // Basic Information
        strokeType: 'ISCHEMIC',
        currentStatus: 'TREATMENT_COMPLETE',
        selectedTreatment: 'IV_THROMBOLYSIS',
        
        // Patient Arrival & Timing - GOOD PERFORMANCE
        modeOfArrival: 'BY_AMBULANCE_RED_CRESCENT',
        srcaCallTime: addMinutes(admissionTime, -50), // 50 min before arrival
        timeOfSymptomOnset: addMinutes(admissionTime, -180), // 3 hours before arrival
        lastKnownNormal: addMinutes(admissionTime, -180),
        timeOfRegistration: admissionTime,
        timeOfTriage: addMinutes(admissionTime, 5), // 5 min after registration
        timeOfPhysicianAssessment: addMinutes(admissionTime, 18), // 18 min after registration
        
        // Clinical Assessment & Diagnosis
        strokeTypeDetailed: 'ISCHEMIC_STROKE',
        swallowingScreeningPerformed: true,
        timeOfSwallowingScreening: addMinutes(admissionTime, 25), // 25 min after registration
        swallowingScreeningResult: 'FAIL',
        ctScanPerformed: true,
        timeOfCtScanStart: addMinutes(admissionTime, 22), // 22 min after registration
        timeOfCtReportFinal: addMinutes(admissionTime, 35), // 35 min after registration
        ctFindings: 'NORMAL',
        lvoDetected: true,
        
        // Treatment Details
        candidateForIVThrombolysis: 'YES',
        thrombolysisOrderTime: addMinutes(admissionTime, 40), // 40 min after registration
        ivThrombolysisAdministrationTime: addMinutes(admissionTime, 55), // 55 min after registration
        ivThrombolysisGiven: 'YES',
        reasonForNotAdministeringIV: null,
        candidateForMechanicalThrombectomy: 'YES',
        timeOfGroinPuncture: addMinutes(admissionTime, 110), // 110 min after registration
        mechanicalThrombectomyPerformed: true,
        timeOfThrombectomyComplete: addMinutes(admissionTime, 180), // 180 min after registration
        
        // Disposition & Transfer Decisions
        facilityHasCt: true,
        transferToAnotherHospital: false,
        timeOfTransferActivation: null,
        timeOfTransferDeparture: null,
        prehospitalNotificationBySrca: true,
        prehospitalNotificationByUccPhc: false,
        disposition: 'STROKE_UNIT',
        referralTo: ['STROKE_UNIT'],
        admittedToStrokeUnit: true,
        
        // Follow-up & Outcome Tracking
        followUpContactAttempted: true,
        modifiedRankinScaleAt90Days: 'SCORE_2',
        
        // Legacy fields
        strokeSubtype: 'LARGE_VESSEL_OCCLUSION',
        eligibleForThrombolysis: true,
        thrombolysisContraindications: null,
        eligibleForThrombectomy: true,
        thrombectomyContraindications: null,
        pathwayStarted: addMinutes(admissionTime, 8),
        pathwayCompleted: addMinutes(admissionTime, 75),
        strokeUnitAdmissionTime: addMinutes(admissionTime, 120),
        symptomNeedleMinutes: 235, // 3h55min from symptom onset
        symptomGroinMinutes: 290, // 4h50min from symptom onset
        imagingToNeedleMinutes: 33,
        imagingToGroinMinutes: 88,
        
        createdById: users[0].id,
      },
    });
    strokeCases.push(strokeCase);
  }

  // Scenario 3: Poor KPI performance (5 cases)
  for (let i = 10; i < 15; i++) {
    // Use a consistent base time (6 hours ago) to ensure realistic timing
    const baseTime = new Date();
    baseTime.setHours(baseTime.getHours() - 6);
    const admissionTime = new Date(baseTime);
    
    const strokeCase = await prisma.strokeCase.create({
      data: {
        ticketId: null,
        patientId: patients[i].id,
        originHospitalId: hospitals[2].id,
        destinationHospitalId: null,
        
        // Basic Information
        strokeType: 'ISCHEMIC',
        currentStatus: 'TREATMENT_EVALUATION',
        selectedTreatment: 'CONSERVATIVE_MANAGEMENT',
        
        // Patient Arrival & Timing - POOR PERFORMANCE
        modeOfArrival: 'WALK_IN',
        srcaCallTime: null, // No SRCA call
        timeOfSymptomOnset: addMinutes(admissionTime, -300), // 5 hours before arrival
        lastKnownNormal: addMinutes(admissionTime, -300),
        timeOfRegistration: admissionTime,
        timeOfTriage: addMinutes(admissionTime, 15), // 15 min after registration
        timeOfPhysicianAssessment: addMinutes(admissionTime, 45), // 45 min after registration
        
        // Clinical Assessment & Diagnosis
        strokeTypeDetailed: 'ISCHEMIC_STROKE',
        swallowingScreeningPerformed: false, // Not performed
        timeOfSwallowingScreening: null,
        swallowingScreeningResult: null,
        ctScanPerformed: true,
        timeOfCtScanStart: addMinutes(admissionTime, 50), // 50 min after registration
        timeOfCtReportFinal: addMinutes(admissionTime, 70), // 70 min after registration
        ctFindings: 'NORMAL',
        lvoDetected: false,
        
        // Treatment Details
        candidateForIVThrombolysis: 'NO',
        thrombolysisOrderTime: null,
        ivThrombolysisAdministrationTime: null,
        ivThrombolysisGiven: 'NO',
        reasonForNotAdministeringIV: 'Outside treatment window',
        candidateForMechanicalThrombectomy: 'NO',
        timeOfGroinPuncture: null,
        mechanicalThrombectomyPerformed: false,
        timeOfThrombectomyComplete: null,
        
        // Disposition & Transfer Decisions
        facilityHasCt: true,
        transferToAnotherHospital: false,
        timeOfTransferActivation: null,
        timeOfTransferDeparture: null,
        prehospitalNotificationBySrca: false,
        prehospitalNotificationByUccPhc: false,
        disposition: 'INPATIENT_WARD',
        referralTo: ['NEUROLOGY'],
        admittedToStrokeUnit: false,
        
        // Follow-up & Outcome Tracking
        followUpContactAttempted: false, // Not attempted
        modifiedRankinScaleAt90Days: null, // No follow-up
        
        // Legacy fields
        strokeSubtype: 'SMALL_VESSEL_DISEASE',
        eligibleForThrombolysis: false,
        thrombolysisContraindications: 'Outside treatment window',
        eligibleForThrombectomy: false,
        thrombectomyContraindications: 'No LVO',
        pathwayStarted: addMinutes(admissionTime, 20),
        pathwayCompleted: addMinutes(admissionTime, 120),
        strokeUnitAdmissionTime: null,
        symptomNeedleMinutes: null,
        symptomGroinMinutes: null,
        imagingToNeedleMinutes: null,
        imagingToGroinMinutes: null,
        
        createdById: users[0].id,
      },
    });
    strokeCases.push(strokeCase);
  }

  // Scenario 4: Mixed performance (5 cases)
  for (let i = 15; i < 20; i++) {
    // Use a consistent base time (8 hours ago) to ensure realistic timing
    const baseTime = new Date();
    baseTime.setHours(baseTime.getHours() - 8);
    const admissionTime = new Date(baseTime);
    
    const strokeCase = await prisma.strokeCase.create({
      data: {
        ticketId: null,
        patientId: patients[i].id,
        originHospitalId: hospitals[0].id,
        destinationHospitalId: hospitals[1].id,
        
        // Basic Information
        strokeType: getRandomItem(['ISCHEMIC', 'HEMORRHAGIC', 'TIA']),
        currentStatus: 'TREATMENT_COMPLETE',
        selectedTreatment: getRandomItem(['IV_THROMBOLYSIS', 'MECHANICAL_THROMBECTOMY', 'CONSERVATIVE_MANAGEMENT']),
        
        // Patient Arrival & Timing - MIXED PERFORMANCE
        modeOfArrival: getRandomItem(['BY_AMBULANCE_RED_CRESCENT', 'TRANSFERRED_FROM_PHC_UCC', 'WALK_IN']),
        srcaCallTime: randomBoolean(0.7) ? addMinutes(admissionTime, -60) : null,
        timeOfSymptomOnset: addMinutes(admissionTime, -180), // 3 hours before arrival
        lastKnownNormal: addMinutes(admissionTime, -180),
        timeOfRegistration: admissionTime,
        timeOfTriage: addMinutes(admissionTime, 5), // 5 min after registration
        timeOfPhysicianAssessment: addMinutes(admissionTime, 20), // 20 min after registration
        
        // Clinical Assessment & Diagnosis
        strokeTypeDetailed: getRandomItem(['ISCHEMIC_STROKE', 'HEMORRHAGIC_STROKE', 'TRANSIENT_ISCHEMIC_ATTACK_TIA']),
        swallowingScreeningPerformed: randomBoolean(0.8),
        timeOfSwallowingScreening: randomBoolean(0.8) ? addMinutes(admissionTime, 25) : null,
        swallowingScreeningResult: randomBoolean(0.8) ? getRandomItem(['PASS', 'FAIL', 'NOT_APPLICABLE']) : null,
        ctScanPerformed: true,
        timeOfCtScanStart: addMinutes(admissionTime, 25), // 25 min after registration
        timeOfCtReportFinal: addMinutes(admissionTime, 35), // 35 min after registration
        ctFindings: getRandomItem(['NORMAL', 'HEMORRHAGE', 'ISCHEMIC_CHANGES']),
        lvoDetected: randomBoolean(0.3),
        
        // Treatment Details
        candidateForIVThrombolysis: getRandomItem(['YES', 'NO']),
        thrombolysisOrderTime: null, // Will be set conditionally below
        ivThrombolysisAdministrationTime: null, // Will be set conditionally below
        ivThrombolysisGiven: getRandomItem(['YES', 'NO']),
        reasonForNotAdministeringIV: randomBoolean(0.4) ? 'Contraindications present' : null,
        candidateForMechanicalThrombectomy: getRandomItem(['YES', 'NO']),
        timeOfGroinPuncture: randomBoolean(0.4) ? addMinutes(admissionTime, 90) : null,
        mechanicalThrombectomyPerformed: randomBoolean(0.4),
        timeOfThrombectomyComplete: randomBoolean(0.4) ? addMinutes(admissionTime, 150) : null,
        
        // Disposition & Transfer Decisions
        facilityHasCt: randomBoolean(0.8),
        transferToAnotherHospital: randomBoolean(0.3),
        timeOfTransferActivation: randomBoolean(0.3) ? addMinutes(admissionTime, 60) : null,
        timeOfTransferDeparture: randomBoolean(0.3) ? addMinutes(admissionTime, 90) : null,
        prehospitalNotificationBySrca: randomBoolean(0.6),
        prehospitalNotificationByUccPhc: randomBoolean(0.4),
        disposition: getRandomItem(['STROKE_UNIT', 'INPATIENT_WARD', 'DISCHARGED_HOME']),
        referralTo: getRandomItem([['STROKE_UNIT'], ['NEUROLOGY'], ['OTHER']]),
        admittedToStrokeUnit: randomBoolean(0.7),
        
        // Follow-up & Outcome Tracking
        followUpContactAttempted: randomBoolean(0.8),
        modifiedRankinScaleAt90Days: randomBoolean(0.8) ? getRandomItem(['SCORE_0', 'SCORE_2', 'SCORE_4', 'SCORE_6_DEAD']) : null,
        
        // Legacy fields
        strokeSubtype: getRandomItem(['LARGE_VESSEL_OCCLUSION', 'SMALL_VESSEL_DISEASE', 'CARDIOEMBOLIC']),
        eligibleForThrombolysis: randomBoolean(0.6),
        thrombolysisContraindications: randomBoolean(0.3) ? 'Contraindications present' : null,
        eligibleForThrombectomy: randomBoolean(0.4),
        thrombectomyContraindications: randomBoolean(0.3) ? 'No LVO detected' : null,
        pathwayStarted: addMinutes(admissionTime, 8),
        pathwayCompleted: addMinutes(admissionTime, 75),
        strokeUnitAdmissionTime: randomBoolean(0.7) ? addMinutes(admissionTime, 120) : null,
        symptomNeedleMinutes: randomBoolean(0.6) ? 240 : null, // 4 hours from symptom onset
        symptomGroinMinutes: randomBoolean(0.4) ? 300 : null, // 5 hours from symptom onset
        imagingToNeedleMinutes: randomBoolean(0.6) ? 35 : null,
        imagingToGroinMinutes: randomBoolean(0.4) ? 85 : null,
        
        createdById: users[0].id,
      },
    });
    
    // Set conditional timing fields based on candidate status for mixed performance cases
    if (strokeCase.candidateForIVThrombolysis === 'YES') {
      await prisma.strokeCase.update({
        where: { id: strokeCase.id },
        data: {
          thrombolysisOrderTime: addMinutes(admissionTime, 40),
          ivThrombolysisAdministrationTime: addMinutes(admissionTime, 55),
        }
      });
    }
    
    strokeCases.push(strokeCase);
  }

  console.log(`🧠 Created ${strokeCases.length} stroke cases with varied KPI performance`);

  // Now let's calculate and update the KPIs for each case
  console.log('📊 Calculating KPIs for all cases...');
  
  for (const strokeCase of strokeCases) {
    // Refresh the stroke case data to get the updated timing fields
    const updatedStrokeCase = await prisma.strokeCase.findUnique({
      where: { id: strokeCase.id }
    });
    
    if (!updatedStrokeCase) continue;
    
    // Calculate KPI timing values
    const kpiData: any = {};
    
    // KPI 1: Door to physician (registration to physician assessment)
    if (updatedStrokeCase.timeOfRegistration && updatedStrokeCase.timeOfPhysicianAssessment) {
      const doorToPhysicianMs = updatedStrokeCase.timeOfPhysicianAssessment.getTime() - updatedStrokeCase.timeOfRegistration.getTime();
      kpiData.doorToPhysicianMinutes = Math.round(doorToPhysicianMs / (1000 * 60));
      kpiData.metKpi1 = kpiData.doorToPhysicianMinutes <= 15;
    }
    
    // KPI 2: Pre-hospital notification
    kpiData.metKpi2 = updatedStrokeCase.prehospitalNotificationBySrca || updatedStrokeCase.prehospitalNotificationByUccPhc;
    
    // KPI 3: Registration to CT scan
    if (updatedStrokeCase.timeOfRegistration && updatedStrokeCase.timeOfCtScanStart) {
      const registrationToCtMs = updatedStrokeCase.timeOfCtScanStart.getTime() - updatedStrokeCase.timeOfRegistration.getTime();
      kpiData.registrationToCtMinutes = Math.round(registrationToCtMs / (1000 * 60));
      kpiData.metKpi3 = kpiData.registrationToCtMinutes <= 20;
    }
    
    // Door to CT Report
    if (updatedStrokeCase.timeOfRegistration && updatedStrokeCase.timeOfCtReportFinal) {
      const doorToCtReportMs = updatedStrokeCase.timeOfCtReportFinal.getTime() - updatedStrokeCase.timeOfRegistration.getTime();
      kpiData.doorToCtReportMinutes = Math.round(doorToCtReportMs / (1000 * 60));
    }
    
    // Door to Thrombolysis Order
    if (updatedStrokeCase.timeOfRegistration && updatedStrokeCase.thrombolysisOrderTime) {
      const doorToThrombolysisOrderMs = updatedStrokeCase.thrombolysisOrderTime.getTime() - updatedStrokeCase.timeOfRegistration.getTime();
      kpiData.doorToThrombolysisOrderMinutes = Math.round(doorToThrombolysisOrderMs / (1000 * 60));
    }
    
    // KPI 4: Registration to IV thrombolysis
    if (updatedStrokeCase.timeOfRegistration && updatedStrokeCase.ivThrombolysisAdministrationTime) {
      const registrationToThrombolysisMs = updatedStrokeCase.ivThrombolysisAdministrationTime.getTime() - updatedStrokeCase.timeOfRegistration.getTime();
      kpiData.registrationToThrombolysisMinutes = Math.round(registrationToThrombolysisMs / (1000 * 60));
      kpiData.metKpi4 = kpiData.registrationToThrombolysisMinutes <= 60;
    }
    
    // Door to Needle Minutes (for table display - same as registration to thrombolysis)
    if (updatedStrokeCase.timeOfRegistration && updatedStrokeCase.ivThrombolysisAdministrationTime) {
      const doorToNeedleMs = updatedStrokeCase.ivThrombolysisAdministrationTime.getTime() - updatedStrokeCase.timeOfRegistration.getTime();
      kpiData.doorToNeedleMinutes = Math.round(doorToNeedleMs / (1000 * 60));
    }
    
    // KPI 5: IV thrombolysis rate (for eligible patients)
    if (updatedStrokeCase.strokeType === 'ISCHEMIC' && updatedStrokeCase.candidateForIVThrombolysis === 'YES') {
      kpiData.metKpi5 = updatedStrokeCase.ivThrombolysisGiven === 'YES';
    }
    
    // KPI 6: Direct stroke unit admission
    kpiData.metKpi6 = updatedStrokeCase.admittedToStrokeUnit === true;
    
    // KPI 7: Transfer time
    if (updatedStrokeCase.timeOfTransferActivation && updatedStrokeCase.timeOfTransferDeparture) {
      const transferMs = updatedStrokeCase.timeOfTransferDeparture.getTime() - updatedStrokeCase.timeOfTransferActivation.getTime();
      kpiData.transferActivationToDepartureMinutes = Math.round(transferMs / (1000 * 60));
      // Target: ≤20 min (no CT), ≤40 min (with CT)
      const target = updatedStrokeCase.facilityHasCt ? 40 : 20;
      kpiData.metKpi7 = kpiData.transferActivationToDepartureMinutes <= target;
    }
    
    // KPI 8: Registration to groin puncture
    if (updatedStrokeCase.timeOfRegistration && updatedStrokeCase.timeOfGroinPuncture) {
      const registrationToGroinMs = updatedStrokeCase.timeOfGroinPuncture.getTime() - updatedStrokeCase.timeOfRegistration.getTime();
      kpiData.registrationToGroinMinutes = Math.round(registrationToGroinMs / (1000 * 60));
      kpiData.metKpi8 = kpiData.registrationToGroinMinutes <= 120;
    }
    
    // KPI 9: SRCA call to arrival
    if (updatedStrokeCase.srcaCallTime && updatedStrokeCase.timeOfRegistration) {
      const srcaCallToArrivalMs = updatedStrokeCase.timeOfRegistration.getTime() - updatedStrokeCase.srcaCallTime.getTime();
      kpiData.srcaCallToArrivalMinutes = Math.round(srcaCallToArrivalMs / (1000 * 60));
      kpiData.metKpi9 = kpiData.srcaCallToArrivalMinutes <= 60;
    }
    
    // KPI 10: Swallowing screening within 4 hours
    if (updatedStrokeCase.timeOfRegistration && updatedStrokeCase.timeOfSwallowingScreening) {
      const screeningMs = updatedStrokeCase.timeOfSwallowingScreening.getTime() - updatedStrokeCase.timeOfRegistration.getTime();
      const screeningMinutes = Math.round(screeningMs / (1000 * 60));
      kpiData.swallowingScreeningWithin4Hours = screeningMinutes <= 240; // 4 hours = 240 minutes
      kpiData.metKpi10 = kpiData.swallowingScreeningWithin4Hours;
    } else {
      kpiData.swallowingScreeningWithin4Hours = false;
      kpiData.metKpi10 = false;
    }
    
    // KPI 11: 3-month follow-up with mRS
    kpiData.metKpi11 = updatedStrokeCase.modifiedRankinScaleAt90Days !== null;
    
    // Update the stroke case with KPI data
    await prisma.strokeCase.update({
      where: { id: strokeCase.id },
      data: kpiData,
    });
  }

  console.log('✅ Stroke KPI Test Seed completed successfully!');
  console.log('📊 Created stroke cases with varied KPI performance:');
  console.log('   - 5 cases with EXCELLENT KPI performance');
  console.log('   - 5 cases with GOOD KPI performance');
  console.log('   - 5 cases with POOR KPI performance');
  console.log('   - 5 cases with MIXED KPI performance');
  console.log('🎯 All 11 KPIs have been calculated and stored');
}

main()
  .catch((e) => {
    console.error('❌ Error during seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
