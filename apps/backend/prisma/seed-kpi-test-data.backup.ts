import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Helper function to add minutes to a date
function addMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60 * 1000);
}

// Helper function to get a date N days ago
function daysAgo(days: number): Date {
  const now = new Date();
  return new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
}

async function seedKPITestData() {
  console.log('🌱 Starting KPI Test Data Seed...\n');

  try {
    // Get existing hospitals with required services
    const hospitals = await prisma.hospital.findMany({
      where: {
        OR: [
          { hasStemiService: true },
          { hasStrokeService: true },
          { hasTraumaService: true }
        ]
      },
      take: 5
    });

    if (hospitals.length < 2) {
      throw new Error('Need at least 2 hospitals with critical care services');
    }

    console.log(`✓ Found ${hospitals.length} hospitals with critical care services`);

    // Get existing user for case creation
    const user = await prisma.user.findFirst({
      where: { role: { in: ['ADMIN', 'DATA_COLLECTOR', 'HOSPITAL_USER'] } }
    });

    if (!user) {
      throw new Error('Need at least one user to create cases');
    }

    console.log(`✓ Using user: ${user.firstName} ${user.lastName}\n`);

    const stemiHospital = hospitals.find(h => h.hasStemiService) || hospitals[0];
    const strokeHospital = hospitals.find(h => h.hasStrokeService) || hospitals[1];
    const traumaHospital = hospitals.find(h => h.hasTraumaService) || hospitals[0];
    const transferHospital = hospitals[1];

    // ==================== STEMI TEST PATIENTS ====================
    console.log('💓 Creating STEMI Test Patients...\n');

    // STEMI Patient 1: Perfect Direct Case
    console.log('  Creating STEMI Patient 1: Perfect Direct Case');
    const stemiPatient1 = await prisma.patient.create({
      data: {
        firstName: 'Ahmed',
        lastName: 'Al-Rashid',
        mrn: 'STEMI-001',
        nationalId: '1111111111',
        age: 58,
        gender: 'MALE',
        phoneNumber: '+966501111001',
        createdById: user.id
      }
    });

    const stemi1Arrival = daysAgo(5);
    const stemi1Triage = addMinutes(stemi1Arrival, 2);
    const stemi1Ecg = addMinutes(stemi1Triage, 8); // KPI 1: 8 min ✓
    const stemi1CathLab = addMinutes(stemi1Ecg, 12); // KPI 4: 12 min ✓
    const stemi1Balloon = addMinutes(stemi1Triage, 75); // KPI 2: 75 min ✓
    const stemi1Discharge = addMinutes(stemi1Arrival, 4320); // 3 days later
    const stemi1FollowUp = addMinutes(stemi1Discharge, 43200); // 30 days later

    await prisma.stemiCase.create({
      data: {
        patientId: stemiPatient1.id,
        originHospitalId: stemiHospital.id,
        currentStatus: 'CCU_ADMITTED',
        selectedTreatment: 'PRIMARY_PCI',
        caseType: 'DIRECT',
        modeOfArrival: 'AMBULANCE_RED_CRESCENT',
        presentingSymptoms: 'Severe chest pain, diaphoresis',
        symptomOnset: addMinutes(stemi1Arrival, -90),
        triageTime: stemi1Triage,
        firstEcgTime: stemi1Ecg,
        ecgResult: 'STEMI_ANTERIOR',
        rccActivated: true,
        cathLabActivationTime: stemi1CathLab,
        eligibleForPrimaryPci: true,
        pciType: 'PRIMARY',
        balloonInflationTime: stemi1Balloon,
        successful: true,
        dischargeDate: stemi1Discharge,
        followUpCallCompleted: true,
        followUpCallDate: stemi1FollowUp,
        doorToEcgMinutes: 8,
        doorToBalloonMinutes: 75,
        metKpi1: true,
        metKpi2: true,
        metKpi2Direct: true,
        metKpi4: true,
        metKpi6: true,
        metKpi11: true,
        createdById: user.id
      }
    });

    // STEMI Patient 2: Perfect Transfer Case
    console.log('  Creating STEMI Patient 2: Perfect Transfer Case');
    const stemiPatient2 = await prisma.patient.create({
      data: {
        firstName: 'Fatima',
        lastName: 'Al-Mansouri',
        mrn: 'STEMI-002',
        nationalId: '1111111112',
        age: 62,
        gender: 'FEMALE',
        phoneNumber: '+966501111002',
        createdById: user.id
      }
    });

    const stemi2Arrival = daysAgo(8);
    const stemi2Triage = addMinutes(stemi2Arrival, 3);
    const stemi2Ecg = addMinutes(stemi2Triage, 9); // KPI 1: 9 min ✓
    const stemi2CathLab = addMinutes(stemi2Ecg, 10); // KPI 4: 10 min ✓
    const stemi2DoorOut = addMinutes(stemi2Triage, 25); // KPI 5: 25 min ✓
    const stemi2Balloon = addMinutes(stemi2Triage, 110); // KPI 2 Transfer: 110 min ✓

    await prisma.stemiCase.create({
      data: {
        patientId: stemiPatient2.id,
        originHospitalId: stemiHospital.id,
        destinationHospitalId: transferHospital.id,
        currentStatus: 'CCU_ADMITTED',
        selectedTreatment: 'TRANSFER_FOR_PRIMARY_PCI',
        caseType: 'TRANSFER',
        modeOfArrival: 'AMBULANCE_RED_CRESCENT',
        presentingSymptoms: 'Chest pain radiating to left arm',
        triageTime: stemi2Triage,
        firstEcgTime: stemi2Ecg,
        ecgResult: 'STEMI_INFERIOR',
        rccActivated: true,
        cathLabActivationTime: stemi2CathLab,
        doorOutTime: stemi2DoorOut,
        balloonInflationTime: stemi2Balloon,
        successful: true,
        followUpCallCompleted: true,
        doorToEcgMinutes: 9,
        doorToBalloonMinutes: 110,
        doorInDoorOutMinutes: 25,
        metKpi1: true,
        metKpi2: true,
        metKpi2Transfer: true,
        metKpi4: true,
        metKpi5: true,
        metKpi6: true,
        metKpi11: true,
        createdById: user.id
      }
    });

    // STEMI Patient 3: Thrombolysis Case
    console.log('  Creating STEMI Patient 3: Thrombolysis Case');
    const stemiPatient3 = await prisma.patient.create({
      data: {
        firstName: 'Omar',
        lastName: 'Al-Hassan',
        mrn: 'STEMI-003',
        nationalId: '1111111113',
        age: 55,
        gender: 'MALE',
        phoneNumber: '+966501111003',
        createdById: user.id
      }
    });

    const stemi3Arrival = daysAgo(12);
    const stemi3Triage = addMinutes(stemi3Arrival, 2);
    const stemi3Ecg = addMinutes(stemi3Triage, 7); // KPI 1: 7 min ✓
    const stemi3Needle = addMinutes(stemi3Triage, 28); // KPI 3: 28 min ✓

    await prisma.stemiCase.create({
      data: {
        patientId: stemiPatient3.id,
        originHospitalId: stemiHospital.id,
        currentStatus: 'CCU_ADMITTED',
        selectedTreatment: 'FIBRINOLYSIS',
        caseType: 'DIRECT',
        modeOfArrival: 'PRIVATE_CAR',
        presentingSymptoms: 'Crushing chest pain, nausea',
        triageTime: stemi3Triage,
        firstEcgTime: stemi3Ecg,
        ecgResult: 'STEMI_LATERAL',
        rccActivated: true,
        cathLabActivationTime: addMinutes(stemi3Ecg, 8),
        thrombolyticGiven: true,
        thrombolyticAdminTime: stemi3Needle,
        successful: true,
        followUpCallCompleted: true,
        doorToEcgMinutes: 7,
        doorToNeedleMinutes: 28,
        metKpi1: true,
        metKpi3: true,
        metKpi4: true,
        metKpi11: true,
        createdById: user.id
      }
    });

    // STEMI Patient 4: Delayed ECG (KPI 1 Failure)
    console.log('  Creating STEMI Patient 4: Delayed ECG');
    const stemiPatient4 = await prisma.patient.create({
      data: {
        firstName: 'Khalid',
        lastName: 'Al-Zahra',
        mrn: 'STEMI-004',
        nationalId: '1111111114',
        age: 67,
        gender: 'MALE',
        phoneNumber: '+966501111004',
        createdById: user.id
      }
    });

    const stemi4Arrival = daysAgo(15);
    const stemi4Triage = addMinutes(stemi4Arrival, 3);
    const stemi4Ecg = addMinutes(stemi4Triage, 15); // KPI 1: 15 min ✗ FAILED
    const stemi4Balloon = addMinutes(stemi4Triage, 85);

    await prisma.stemiCase.create({
      data: {
        patientId: stemiPatient4.id,
        originHospitalId: stemiHospital.id,
        currentStatus: 'CCU_ADMITTED',
        selectedTreatment: 'PRIMARY_PCI',
        caseType: 'DIRECT',
        modeOfArrival: 'AMBULANCE_RED_CRESCENT',
        triageTime: stemi4Triage,
        firstEcgTime: stemi4Ecg,
        ecgResult: 'STEMI_ANTERIOR',
        rccActivated: true,
        balloonInflationTime: stemi4Balloon,
        successful: true,
        followUpCallCompleted: true,
        doorToEcgMinutes: 15,
        doorToBalloonMinutes: 85,
        metKpi1: false, // FAILED
        metKpi2: true,
        metKpi6: true,
        metKpi11: true,
        createdById: user.id
      }
    });

    // STEMI Patient 5: Delayed Balloon (KPI 2 Failure)
    console.log('  Creating STEMI Patient 5: Delayed Balloon Time');
    const stemiPatient5 = await prisma.patient.create({
      data: {
        firstName: 'Nora',
        lastName: 'Al-Mansouri',
        mrn: 'STEMI-005',
        nationalId: '1111111115',
        age: 71,
        gender: 'FEMALE',
        phoneNumber: '+966501111005',
        createdById: user.id
      }
    });

    const stemi5Arrival = daysAgo(18);
    const stemi5Triage = addMinutes(stemi5Arrival, 2);
    const stemi5Ecg = addMinutes(stemi5Triage, 9);
    const stemi5Balloon = addMinutes(stemi5Triage, 125); // KPI 2: 125 min ✗ FAILED

    await prisma.stemiCase.create({
      data: {
        patientId: stemiPatient5.id,
        originHospitalId: stemiHospital.id,
        currentStatus: 'CCU_ADMITTED',
        selectedTreatment: 'PRIMARY_PCI',
        caseType: 'DIRECT',
        modeOfArrival: 'PRIVATE_CAR',
        triageTime: stemi5Triage,
        firstEcgTime: stemi5Ecg,
        ecgResult: 'STEMI_INFERIOR',
        rccActivated: true,
        balloonInflationTime: stemi5Balloon,
        successful: true,
        followUpCallCompleted: true,
        doorToEcgMinutes: 9,
        doorToBalloonMinutes: 125,
        metKpi1: true,
        metKpi2: false, // FAILED
        metKpi2Direct: false,
        metKpi6: true,
        metKpi11: true,
        createdById: user.id
      }
    });

    // STEMI Patient 6: Delayed Transfer (KPI 5 Failure)
    console.log('  Creating STEMI Patient 6: Delayed Transfer');
    const stemiPatient6 = await prisma.patient.create({
      data: {
        firstName: 'Layla',
        lastName: 'Al-Hassan',
        mrn: 'STEMI-006',
        nationalId: '1111111116',
        age: 59,
        gender: 'FEMALE',
        phoneNumber: '+966501111006',
        createdById: user.id
      }
    });

    const stemi6Arrival = daysAgo(20);
    const stemi6Triage = addMinutes(stemi6Arrival, 3);
    const stemi6Ecg = addMinutes(stemi6Triage, 8);
    const stemi6DoorOut = addMinutes(stemi6Triage, 45); // KPI 5: 45 min ✗ FAILED
    const stemi6Balloon = addMinutes(stemi6Triage, 115);

    await prisma.stemiCase.create({
      data: {
        patientId: stemiPatient6.id,
        originHospitalId: stemiHospital.id,
        destinationHospitalId: transferHospital.id,
        currentStatus: 'CCU_ADMITTED',
        selectedTreatment: 'TRANSFER_FOR_PRIMARY_PCI',
        caseType: 'TRANSFER',
        modeOfArrival: 'AMBULANCE_RED_CRESCENT',
        triageTime: stemi6Triage,
        firstEcgTime: stemi6Ecg,
        ecgResult: 'STEMI_ANTERIOR',
        rccActivated: true,
        doorOutTime: stemi6DoorOut,
        balloonInflationTime: stemi6Balloon,
        successful: true,
        followUpCallCompleted: true,
        doorToEcgMinutes: 8,
        doorToBalloonMinutes: 115,
        doorInDoorOutMinutes: 45,
        metKpi1: true,
        metKpi2: true,
        metKpi5: false, // FAILED
        metKpi6: true,
        metKpi11: true,
        createdById: user.id
      }
    });

    // STEMI Patient 7: Missing Follow-up (KPI 11 Failure)
    console.log('  Creating STEMI Patient 7: Missing Follow-up');
    const stemiPatient7 = await prisma.patient.create({
      data: {
        firstName: 'Yousef',
        lastName: 'Al-Mansouri',
        mrn: 'STEMI-007',
        nationalId: '1111111117',
        age: 64,
        gender: 'MALE',
        phoneNumber: '+966501111007',
        createdById: user.id
      }
    });

    const stemi7Arrival = daysAgo(22);
    const stemi7Triage = addMinutes(stemi7Arrival, 2);
    const stemi7Ecg = addMinutes(stemi7Triage, 10);
    const stemi7Balloon = addMinutes(stemi7Triage, 88);

    await prisma.stemiCase.create({
      data: {
        patientId: stemiPatient7.id,
        originHospitalId: stemiHospital.id,
        currentStatus: 'CCU_ADMITTED',
        selectedTreatment: 'PRIMARY_PCI',
        caseType: 'DIRECT',
        modeOfArrival: 'AMBULANCE_RED_CRESCENT',
        triageTime: stemi7Triage,
        firstEcgTime: stemi7Ecg,
        ecgResult: 'STEMI_LATERAL',
        rccActivated: true,
        balloonInflationTime: stemi7Balloon,
        successful: true,
        complications: 'Minor bleeding at catheter site',
        followUpCallCompleted: false, // KPI 11 FAILED
        doorToEcgMinutes: 10,
        doorToBalloonMinutes: 88,
        metKpi1: true,
        metKpi2: true,
        metKpi6: true,
        metKpi11: false, // FAILED
        createdById: user.id
      }
    });

    console.log('✓ Created 7 STEMI test patients\n');

    // ==================== STROKE TEST PATIENTS ====================
    console.log('🧠 Creating Stroke Test Patients...\n');

    // Stroke Patient 1: Perfect IV Thrombolysis Case
    console.log('  Creating Stroke Patient 1: Perfect IV Thrombolysis');
    const strokePatient1 = await prisma.patient.create({
      data: {
        firstName: 'Maha',
        lastName: 'Al-Zahra',
        mrn: 'STROKE-001',
        nationalId: '2222222221',
        age: 68,
        gender: 'FEMALE',
        phoneNumber: '+966502222001',
        createdById: user.id
      }
    });

    const stroke1Arrival = daysAgo(6);
    const stroke1SrcaCall = addMinutes(stroke1Arrival, -45); // KPI 9: 45 min ✓
    const stroke1Physician = addMinutes(stroke1Arrival, 12); // KPI 1: 12 min ✓
    const stroke1Ct = addMinutes(stroke1Arrival, 18); // KPI 3: 18 min ✓
    const stroke1Thrombolysis = addMinutes(stroke1Arrival, 55); // KPI 4: 55 min ✓
    const stroke1Swallowing = addMinutes(stroke1Arrival, 120); // KPI 10: 2 hours ✓
    const stroke1FollowUp = addMinutes(stroke1Arrival, 129600); // 90 days

    await prisma.strokeCase.create({
      data: {
        patientId: strokePatient1.id,
        originHospitalId: strokeHospital.id,
        strokeType: 'ISCHEMIC',
        currentStatus: 'STROKEUNIT_ADMITTED',
        modeOfArrival: 'AMBULANCE_RED_CRESCENT',
        prehospitalNotificationBySrca: true, // KPI 2 ✓
        srcaCallTime: stroke1SrcaCall,
        dateOfAdmission: stroke1Arrival,
        timeOfPhysicianAssessment: stroke1Physician,
        ctScanPerformed: true,
        timeOfCtScanStart: stroke1Ct,
        timeOfCtReportFinal: addMinutes(stroke1Ct, 15),
        ctFindings: 'ISCHEMIC_CHANGES',
        candidateForIVThrombolysis: 'YES',
        ivThrombolysisGiven: 'YES', // KPI 5 ✓
        ivThrombolysisAdministrationTime: stroke1Thrombolysis,
        disposition: 'STROKE_UNIT', // KPI 6 ✓
        admittedToStrokeUnit: true,
        swallowingScreeningPerformed: true,
        timeOfSwallowingScreening: stroke1Swallowing,
        swallowingScreeningResult: 'PASS',
        followUpCallCompleted: true, // KPI 11 ✓
        followUpModifiedRankinScale: 2,
        doorToPhysicianMinutes: 12,
        registrationToCtMinutes: 18,
        registrationToThrombolysisMinutes: 55,
        doorToNeedleMinutes: 55,
        srcaCallToArrivalMinutes: 45,
        swallowingScreeningWithin4Hours: true,
        metKpi1: true,
        metKpi2: true,
        metKpi3: true,
        metKpi4: true,
        metKpi5: true,
        metKpi6: true,
        metKpi9: true,
        metKpi10: true,
        metKpi11: true,
        createdById: user.id
      }
    });

    // Stroke Patient 2: Perfect Thrombectomy Case
    console.log('  Creating Stroke Patient 2: Perfect Thrombectomy');
    const strokePatient2 = await prisma.patient.create({
      data: {
        firstName: 'Saad',
        lastName: 'Al-Hassan',
        mrn: 'STROKE-002',
        nationalId: '2222222222',
        age: 72,
        gender: 'MALE',
        phoneNumber: '+966502222002',
        createdById: user.id
      }
    });

    const stroke2Arrival = daysAgo(9);
    const stroke2SrcaCall = addMinutes(stroke2Arrival, -50);
    const stroke2Physician = addMinutes(stroke2Arrival, 10); // KPI 1: 10 min ✓
    const stroke2Ct = addMinutes(stroke2Arrival, 15); // KPI 3: 15 min ✓
    const stroke2Thrombectomy = addMinutes(stroke2Arrival, 105); // KPI 8: 105 min ✓

    await prisma.strokeCase.create({
      data: {
        patientId: strokePatient2.id,
        originHospitalId: strokeHospital.id,
        strokeType: 'ISCHEMIC',
        currentStatus: 'STROKEUNIT_ADMITTED',
        modeOfArrival: 'AMBULANCE_RED_CRESCENT',
        prehospitalNotificationBySrca: true,
        srcaCallTime: stroke2SrcaCall,
        dateOfAdmission: stroke2Arrival,
        timeOfPhysicianAssessment: stroke2Physician,
        ctScanPerformed: true,
        timeOfCtScanStart: stroke2Ct,
        lvoDetected: true,
        candidateForMechanicalThrombectomy: 'YES',
        mechanicalThrombectomyPerformed: true,
        timeOfMechanicalThrombectomyPuncture: stroke2Thrombectomy,
        disposition: 'STROKE_UNIT',
        admittedToStrokeUnit: true,
        swallowingScreeningPerformed: true,
        swallowingScreeningResult: 'PASS',
        followUpCallCompleted: true,
        doorToPhysicianMinutes: 10,
        registrationToCtMinutes: 15,
        registrationToMechanicalThrombectomyMinutes: 105,
        srcaCallToArrivalMinutes: 50,
        swallowingScreeningWithin4Hours: true,
        metKpi1: true,
        metKpi2: true,
        metKpi3: true,
        metKpi6: true,
        metKpi8: true,
        metKpi9: true,
        metKpi10: true,
        metKpi11: true,
        createdById: user.id
      }
    });

    // Stroke Patient 3: Transfer Case with CT
    console.log('  Creating Stroke Patient 3: Transfer Case');
    const strokePatient3 = await prisma.patient.create({
      data: {
        firstName: 'Huda',
        lastName: 'Al-Mansouri',
        mrn: 'STROKE-003',
        nationalId: '2222222223',
        age: 65,
        gender: 'FEMALE',
        phoneNumber: '+966502222003',
        createdById: user.id
      }
    });

    const stroke3Arrival = daysAgo(11);
    const stroke3Physician = addMinutes(stroke3Arrival, 14);
    const stroke3Ct = addMinutes(stroke3Arrival, 19);
    const stroke3TransferActivation = addMinutes(stroke3Arrival, 60);
    const stroke3Departure = addMinutes(stroke3TransferActivation, 38); // KPI 7: 38 min with CT ✓

    await prisma.strokeCase.create({
      data: {
        patientId: strokePatient3.id,
        originHospitalId: strokeHospital.id,
        destinationHospitalId: transferHospital.id,
        strokeType: 'ISCHEMIC',
        currentStatus: 'FOLLOW_UP',
        modeOfArrival: 'AMBULANCE_RED_CRESCENT',
        prehospitalNotificationBySrca: true,
        srcaCallTime: addMinutes(stroke3Arrival, -55),
        dateOfAdmission: stroke3Arrival,
        timeOfPhysicianAssessment: stroke3Physician,
        ctScanPerformed: true,
        facilityHasCt: true,
        timeOfCtScanStart: stroke3Ct,
        transferToAnotherHospital: true,
        timeOfTransferActivation: stroke3TransferActivation,
        timeOfTransferDeparture: stroke3Departure,
        swallowingScreeningPerformed: true,
        swallowingScreeningResult: 'PASS',
        followUpCallCompleted: true,
        doorToPhysicianMinutes: 14,
        registrationToCtMinutes: 19,
        transferActivationToDepartureMinutes: 38,
        srcaCallToArrivalMinutes: 55,
        swallowingScreeningWithin4Hours: true,
        metKpi1: true,
        metKpi2: true,
        metKpi3: true,
        metKpi7: true,
        metKpi9: true,
        metKpi10: true,
        metKpi11: true,
        createdById: user.id
      }
    });

    // Stroke Patient 4: Delayed Physician (KPI 1 Failure)
    console.log('  Creating Stroke Patient 4: Delayed Physician');
    const strokePatient4 = await prisma.patient.create({
      data: {
        firstName: 'Fahad',
        lastName: 'Al-Zahra',
        mrn: 'STROKE-004',
        nationalId: '2222222224',
        age: 70,
        gender: 'MALE',
        phoneNumber: '+966502222004',
        createdById: user.id
      }
    });

    const stroke4Arrival = daysAgo(14);
    const stroke4Physician = addMinutes(stroke4Arrival, 22); // KPI 1: 22 min ✗ FAILED

    await prisma.strokeCase.create({
      data: {
        patientId: strokePatient4.id,
        originHospitalId: strokeHospital.id,
        strokeType: 'ISCHEMIC',
        currentStatus: 'IMAGING_COMPLETE',
        modeOfArrival: 'AMBULANCE_RED_CRESCENT',
        prehospitalNotificationBySrca: true,
        dateOfAdmission: stroke4Arrival,
        timeOfPhysicianAssessment: stroke4Physician,
        ctScanPerformed: true,
        timeOfCtScanStart: addMinutes(stroke4Arrival, 20),
        doorToPhysicianMinutes: 22,
        registrationToCtMinutes: 20,
        metKpi1: false, // FAILED
        metKpi2: true,
        metKpi3: true,
        createdById: user.id
      }
    });

    // Stroke Patient 5: Delayed CT (KPI 3 Failure)
    console.log('  Creating Stroke Patient 5: Delayed CT');
    const strokePatient5 = await prisma.patient.create({
      data: {
        firstName: 'Amal',
        lastName: 'Al-Rashid',
        mrn: 'STROKE-005',
        nationalId: '2222222225',
        age: 63,
        gender: 'FEMALE',
        phoneNumber: '+966502222005',
        createdById: user.id
      }
    });

    const stroke5Arrival = daysAgo(16);
    const stroke5Physician = addMinutes(stroke5Arrival, 13);
    const stroke5Ct = addMinutes(stroke5Arrival, 28); // KPI 3: 28 min ✗ FAILED
    const stroke5Thrombolysis = addMinutes(stroke5Arrival, 58);

    await prisma.strokeCase.create({
      data: {
        patientId: strokePatient5.id,
        originHospitalId: strokeHospital.id,
        strokeType: 'ISCHEMIC',
        currentStatus: 'TREATMENT_COMPLETE',
        modeOfArrival: 'AMBULANCE_RED_CRESCENT',
        prehospitalNotificationBySrca: true,
        dateOfAdmission: stroke5Arrival,
        timeOfPhysicianAssessment: stroke5Physician,
        ctScanPerformed: true,
        timeOfCtScanStart: stroke5Ct,
        candidateForIVThrombolysis: 'YES',
        ivThrombolysisGiven: 'YES',
        ivThrombolysisAdministrationTime: stroke5Thrombolysis,
        doorToPhysicianMinutes: 13,
        registrationToCtMinutes: 28,
        registrationToThrombolysisMinutes: 58,
        metKpi1: true,
        metKpi2: true,
        metKpi3: false, // FAILED
        metKpi4: true,
        metKpi5: true,
        createdById: user.id
      }
    });

    // Stroke Patient 6: No Pre-hospital Notification (KPI 2 Failure)
    console.log('  Creating Stroke Patient 6: No Pre-hospital Notification');
    const strokePatient6 = await prisma.patient.create({
      data: {
        firstName: 'Tariq',
        lastName: 'Al-Hassan',
        mrn: 'STROKE-006',
        nationalId: '2222222226',
        age: 66,
        gender: 'MALE',
        phoneNumber: '+966502222006',
        createdById: user.id
      }
    });

    const stroke6Arrival = daysAgo(19);
    const stroke6Physician = addMinutes(stroke6Arrival, 14);
    const stroke6Ct = addMinutes(stroke6Arrival, 19);

    await prisma.strokeCase.create({
      data: {
        patientId: strokePatient6.id,
        originHospitalId: strokeHospital.id,
        strokeType: 'ISCHEMIC',
        currentStatus: 'IMAGING_COMPLETE',
        modeOfArrival: 'PRIVATE_CAR', // Arrived by private car
        prehospitalNotificationBySrca: false, // KPI 2 FAILED
        dateOfAdmission: stroke6Arrival,
        timeOfPhysicianAssessment: stroke6Physician,
        ctScanPerformed: true,
        timeOfCtScanStart: stroke6Ct,
        doorToPhysicianMinutes: 14,
        registrationToCtMinutes: 19,
        metKpi1: true,
        metKpi2: false, // FAILED
        metKpi3: true,
        createdById: user.id
      }
    });

    // Stroke Patient 7: Missing Follow-up (KPI 11 Failure)
    console.log('  Creating Stroke Patient 7: Missing Follow-up');
    const strokePatient7 = await prisma.patient.create({
      data: {
        firstName: 'Reem',
        lastName: 'Al-Mansouri',
        mrn: 'STROKE-007',
        nationalId: '2222222227',
        age: 69,
        gender: 'FEMALE',
        phoneNumber: '+966502222007',
        createdById: user.id
      }
    });

    const stroke7Arrival = daysAgo(21);
    const stroke7Physician = addMinutes(stroke7Arrival, 11);
    const stroke7Ct = addMinutes(stroke7Arrival, 17);
    const stroke7Thrombolysis = addMinutes(stroke7Arrival, 52);

    await prisma.strokeCase.create({
      data: {
        patientId: strokePatient7.id,
        originHospitalId: strokeHospital.id,
        strokeType: 'ISCHEMIC',
        currentStatus: 'DISCHARGED',
        modeOfArrival: 'AMBULANCE_RED_CRESCENT',
        prehospitalNotificationBySrca: true,
        dateOfAdmission: stroke7Arrival,
        timeOfPhysicianAssessment: stroke7Physician,
        ctScanPerformed: true,
        timeOfCtScanStart: stroke7Ct,
        candidateForIVThrombolysis: 'YES',
        ivThrombolysisGiven: 'YES',
        ivThrombolysisAdministrationTime: stroke7Thrombolysis,
        swallowingScreeningPerformed: true,
        swallowingScreeningResult: 'PASS',
        followUpCallCompleted: false, // KPI 11 FAILED
        doorToPhysicianMinutes: 11,
        registrationToCtMinutes: 17,
        registrationToThrombolysisMinutes: 52,
        swallowingScreeningWithin4Hours: true,
        metKpi1: true,
        metKpi2: true,
        metKpi3: true,
        metKpi4: true,
        metKpi5: true,
        metKpi10: true,
        metKpi11: false, // FAILED
        createdById: user.id
      }
    });

    console.log('✓ Created 7 Stroke test patients\n');

    // ==================== TRAUMA TEST PATIENTS ====================
    console.log('🚑 Creating Trauma Test Patients...\n');

    // Trauma Patient 1: Perfect Critical Case
    console.log('  Creating Trauma Patient 1: Perfect Critical Case');
    const traumaPatient1 = await prisma.patient.create({
      data: {
        firstName: 'Zaid',
        lastName: 'Al-Zahra',
        mrn: 'TRAUMA-001',
        nationalId: '3333333331',
        age: 35,
        gender: 'MALE',
        phoneNumber: '+966503333001',
        createdById: user.id
      }
    });

    const trauma1Incident = daysAgo(7);
    const trauma1Arrival = addMinutes(trauma1Incident, 25); // Response time: 25 min

    await prisma.traumaCase.create({
      data: {
        patientId: traumaPatient1.id,
        originHospitalId: traumaHospital.id,
        mechanismOfInjury: 'MOTOR_VEHICLE_ACCIDENT',
        incidentDateTime: trauma1Incident,
        arrivalDateTime: trauma1Arrival,
        modeOfArrival: 'AMBULANCE_RED_CRESCENT',
        glasgowComaScale: 8, // Severe
        systolicBloodPressure: 90,
        respiratoryRate: 28,
        criticalCase: true,
        edDisposition: 'OPERATING_THEATRE',
        headAndNeckInjury: 'Severe head trauma, possible skull fracture',
        chestInjury: 'Multiple rib fractures, pneumothorax',
        responseTimeMinutes: 25,
        createdById: user.id
      }
    });

    // Trauma Patient 2: Perfect Transfer Case
    console.log('  Creating Trauma Patient 2: Perfect Transfer Case');
    const traumaPatient2 = await prisma.patient.create({
      data: {
        firstName: 'Sara',
        lastName: 'Al-Hassan',
        mrn: 'TRAUMA-002',
        nationalId: '3333333332',
        age: 28,
        gender: 'FEMALE',
        phoneNumber: '+966503333002',
        createdById: user.id
      }
    });

    const trauma2Incident = daysAgo(10);
    const trauma2Arrival = addMinutes(trauma2Incident, 30);

    await prisma.traumaCase.create({
      data: {
        patientId: traumaPatient2.id,
        originHospitalId: traumaHospital.id,
        destinationHospitalId: transferHospital.id,
        mechanismOfInjury: 'PENETRATING',
        incidentDateTime: trauma2Incident,
        arrivalDateTime: trauma2Arrival,
        modeOfArrival: 'AMBULANCE_RED_CRESCENT',
        glasgowComaScale: 10, // Moderate
        systolicBloodPressure: 100,
        respiratoryRate: 24,
        criticalCase: true,
        transferCase: true,
        transferRequestDateTime: addMinutes(trauma2Arrival, 30),
        transferArrivalDateTime: addMinutes(trauma2Arrival, 75),
        transferDurationMinutes: 45,
        edDisposition: 'TRANSFER_TO_HIGHER_CENTER',
        abdomenInjury: 'Penetrating abdominal wound',
        responseTimeMinutes: 30,
        createdById: user.id
      }
    });

    // Trauma Patient 3: Blunt Trauma with ICU
    console.log('  Creating Trauma Patient 3: Blunt Trauma ICU');
    const traumaPatient3 = await prisma.patient.create({
      data: {
        firstName: 'Majid',
        lastName: 'Al-Mansouri',
        mrn: 'TRAUMA-003',
        nationalId: '3333333333',
        age: 52,
        gender: 'MALE',
        phoneNumber: '+966503333003',
        createdById: user.id
      }
    });

    const trauma3Incident = daysAgo(13);
    const trauma3Arrival = addMinutes(trauma3Incident, 35);

    await prisma.traumaCase.create({
      data: {
        patientId: traumaPatient3.id,
        originHospitalId: traumaHospital.id,
        mechanismOfInjury: 'FALL',
        incidentDateTime: trauma3Incident,
        arrivalDateTime: trauma3Arrival,
        modeOfArrival: 'AMBULANCE_RED_CRESCENT',
        glasgowComaScale: 12, // Moderate
        systolicBloodPressure: 110,
        respiratoryRate: 20,
        criticalCase: true,
        edDisposition: 'ICU_ADMISSION',
        headAndNeckInjury: 'Head trauma from fall',
        extremitiesInjury: 'Bilateral leg fractures',
        responseTimeMinutes: 35,
        createdById: user.id
      }
    });

    // Trauma Patient 4: Burn Trauma
    console.log('  Creating Trauma Patient 4: Burn Trauma');
    const traumaPatient4 = await prisma.patient.create({
      data: {
        firstName: 'Nouf',
        lastName: 'Al-Rashid',
        mrn: 'TRAUMA-004',
        nationalId: '3333333334',
        age: 42,
        gender: 'FEMALE',
        phoneNumber: '+966503333004',
        createdById: user.id
      }
    });

    const trauma4Incident = daysAgo(15);
    const trauma4Arrival = addMinutes(trauma4Incident, 20);

    await prisma.traumaCase.create({
      data: {
        patientId: traumaPatient4.id,
        originHospitalId: traumaHospital.id,
        mechanismOfInjury: 'BURN',
        incidentDateTime: trauma4Incident,
        arrivalDateTime: trauma4Arrival,
        modeOfArrival: 'AMBULANCE_RED_CRESCENT',
        glasgowComaScale: 14, // Mild
        systolicBloodPressure: 120,
        respiratoryRate: 18,
        criticalCase: false,
        edDisposition: 'SURGICAL_WARD_ADMISSION',
        externalInjury: '2nd degree burns to upper extremities',
        responseTimeMinutes: 20,
        createdById: user.id
      }
    });

    // Trauma Patient 5: Delayed Response
    console.log('  Creating Trauma Patient 5: Delayed Response');
    const traumaPatient5 = await prisma.patient.create({
      data: {
        firstName: 'Waleed',
        lastName: 'Al-Zahra',
        mrn: 'TRAUMA-005',
        nationalId: '3333333335',
        age: 45,
        gender: 'MALE',
        phoneNumber: '+966503333005',
        createdById: user.id
      }
    });

    const trauma5Incident = daysAgo(17);
    const trauma5Arrival = addMinutes(trauma5Incident, 75); // Poor response time

    await prisma.traumaCase.create({
      data: {
        patientId: traumaPatient5.id,
        originHospitalId: traumaHospital.id,
        mechanismOfInjury: 'MOTOR_VEHICLE_ACCIDENT',
        incidentDateTime: trauma5Incident,
        arrivalDateTime: trauma5Arrival,
        modeOfArrival: 'AMBULANCE_RED_CRESCENT',
        glasgowComaScale: 9, // Severe
        systolicBloodPressure: 85,
        respiratoryRate: 30,
        criticalCase: true,
        edDisposition: 'OPERATING_THEATRE',
        headAndNeckInjury: 'Severe head trauma',
        chestInjury: 'Chest trauma with hemothorax',
        responseTimeMinutes: 75, // Poor response time (rural area)
        additionalNotes: 'Rural area, delayed response due to distance',
        createdById: user.id
      }
    });

    // Trauma Patient 6: Fatal Case
    console.log('  Creating Trauma Patient 6: Fatal Case');
    const traumaPatient6 = await prisma.patient.create({
      data: {
        firstName: 'Hamza',
        lastName: 'Al-Hassan',
        mrn: 'TRAUMA-006',
        nationalId: '3333333336',
        age: 29,
        gender: 'MALE',
        phoneNumber: '+966503333006',
        createdById: user.id
      }
    });

    const trauma6Incident = daysAgo(19);
    const trauma6Arrival = addMinutes(trauma6Incident, 40);

    await prisma.traumaCase.create({
      data: {
        patientId: traumaPatient6.id,
        originHospitalId: traumaHospital.id,
        mechanismOfInjury: 'MOTOR_VEHICLE_ACCIDENT',
        incidentDateTime: trauma6Incident,
        arrivalDateTime: trauma6Arrival,
        modeOfArrival: 'AMBULANCE_RED_CRESCENT',
        glasgowComaScale: 3, // Critical
        systolicBloodPressure: 60,
        respiratoryRate: 8,
        criticalCase: true,
        edDisposition: 'DEATH',
        headAndNeckInjury: 'Severe traumatic brain injury',
        chestInjury: 'Massive chest trauma',
        abdomenInjury: 'Severe internal bleeding',
        responseTimeMinutes: 40,
        additionalNotes: 'Patient arrived in critical condition, resuscitation unsuccessful',
        createdById: user.id
      }
    });

    // Trauma Patient 7: DAMA Case
    console.log('  Creating Trauma Patient 7: DAMA Case');
    const traumaPatient7 = await prisma.patient.create({
      data: {
        firstName: 'Lina',
        lastName: 'Al-Mansouri',
        mrn: 'TRAUMA-007',
        nationalId: '3333333337',
        age: 38,
        gender: 'FEMALE',
        phoneNumber: '+966503333007',
        createdById: user.id
      }
    });

    const trauma7Incident = daysAgo(23);
    const trauma7Arrival = addMinutes(trauma7Incident, 28);

    await prisma.traumaCase.create({
      data: {
        patientId: traumaPatient7.id,
        originHospitalId: traumaHospital.id,
        mechanismOfInjury: 'BLUNT',
        incidentDateTime: trauma7Incident,
        arrivalDateTime: trauma7Arrival,
        modeOfArrival: 'PRIVATE_CAR',
        glasgowComaScale: 13, // Moderate
        systolicBloodPressure: 115,
        respiratoryRate: 19,
        criticalCase: false,
        edDisposition: 'DISCHARGE_AGAINST_MEDICAL_ADVICE',
        extremitiesInjury: 'Minor fractures',
        externalInjury: 'Lacerations and contusions',
        responseTimeMinutes: 28,
        additionalNotes: 'Patient left against medical advice before complete evaluation',
        createdById: user.id
      }
    });

    console.log('✓ Created 7 Trauma test patients\n');

    // Summary
    console.log('✅ KPI Test Data Seed Completed!\n');
    console.log('📊 Summary:');
    console.log('  STEMI Cases: 7 patients');
    console.log('    - 5 with all/most KPIs passing');
    console.log('    - 2 with specific KPI failures');
    console.log('  Stroke Cases: 7 patients');
    console.log('    - 4 with all/most KPIs passing');
    console.log('    - 3 with specific KPI failures');
    console.log('  Trauma Cases: 7 patients');
    console.log('    - Various mechanisms and outcomes');
    console.log('    - Range of response times and severity');
    console.log('\n🎯 Total: 21 test patients ready for KPI validation\n');

  } catch (error) {
    console.error('❌ Error seeding KPI test data:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seed
seedKPITestData()
  .then(() => {
    console.log('✨ Seed completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('�� Seed failed:', error);
    process.exit(1);
  });
