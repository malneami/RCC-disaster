import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Helper function to add minutes to a date
function addMinutes(date: Date, minutes: number | null): Date | null {
  if (minutes === null) return null;
  return new Date(date.getTime() + minutes * 60 * 1000);
}

// Helper function to get a date N days ago
function daysAgo(days: number): Date {
  const now = new Date();
  return new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
}

async function seedKPITestData() {
  console.log('🌱 Starting Comprehensive 60-Patient KPI Test Data Seed...\n');

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

    // ==================== STEMI TEST PATIENTS (22 Total) ====================
    console.log('💓 Creating 22 STEMI Test Patients...\n');

    const stemiPatientsData = [
      // Historical Cases (5-25 days ago)
      { mrn: 'STEMI-001', name: 'Ahmed Al-Rashid', age: 58, days: 5 },
      { mrn: 'STEMI-002', name: 'Fatima Al-Mansouri', age: 62, days: 8 },
      { mrn: 'STEMI-003', name: 'Omar Al-Hassan', age: 55, days: 12 },
      { mrn: 'STEMI-004', name: 'Khalid Al-Zahra', age: 67, days: 15 },
      { mrn: 'STEMI-005', name: 'Nora Al-Mansouri', age: 71, days: 18 },
      { mrn: 'STEMI-006', name: 'Ibrahim Al-Saud', age: 63, days: 20 },
      { mrn: 'STEMI-007', name: 'Sara Al-Otaibi', age: 59, days: 22 },
      { mrn: 'STEMI-008', name: 'Mohammed Al-Qasimi', age: 65, days: 25 },
      // Recent Cases (0-3 days ago)
      { mrn: 'STEMI-009', name: 'Layla Al-Hassan', age: 59, days: 1 },
      { mrn: 'STEMI-010', name: 'Yousef Al-Mansouri', age: 64, days: 2 },
      { mrn: 'STEMI-011', name: 'Sami Al-Rashid', age: 50, days: 0 },
      { mrn: 'STEMI-012', name: 'Mona Al-Zahra', age: 75, days: 3 },
      { mrn: 'STEMI-013', name: 'Tarek Al-Hassan', age: 48, days: 1 },
      { mrn: 'STEMI-014', name: 'Hala Al-Mutairi', age: 56, days: 0 },
      { mrn: 'STEMI-015', name: 'Faisal Al-Shammari', age: 61, days: 2 },
      { mrn: 'STEMI-016', name: 'Nada Al-Dosari', age: 68, days: 1 },
      { mrn: 'STEMI-017', name: 'Khalid Al-Ghamdi', age: 54, days: 3 },
      { mrn: 'STEMI-018', name: 'Rania Al-Shehri', age: 52, days: 0 },
      { mrn: 'STEMI-019', name: 'Majed Al-Harbi', age: 70, days: 2 },
      { mrn: 'STEMI-020', name: 'Lina Al-Zahrani', age: 57, days: 1 },
      // Additional transfer cases for KPI 4 coverage
      { mrn: 'STEMI-021', name: 'Salem Al-Mutairi', age: 60, days: 1 },
      { mrn: 'STEMI-022', name: 'Amira Al-Shehri', age: 55, days: 2 }
    ];

    const stemiPatients = [];
    for (const p of stemiPatientsData) {
      const isFemale = ['002', '005', '006', '009', '012', '014', '016', '018', '020', '022'].includes(p.mrn.split('-')[1]);
      // Check if patient exists, if so delete related cases and patient
      const existingPatient = await prisma.patient.findUnique({ where: { mrn: p.mrn } });
      if (existingPatient) {
        await prisma.stemiCase.deleteMany({ where: { patientId: existingPatient.id } });
        await prisma.patient.delete({ where: { mrn: p.mrn } });
      }
      const patient = await prisma.patient.create({
        data: {
          firstName: p.name.split(' ')[0],
          lastName: p.name.split(' ')[1],
          mrn: p.mrn,
          nationalId: `1${p.mrn.replace('STEMI-', '').padStart(9, '0')}`,
          age: p.age,
          gender: isFemale ? 'FEMALE' : 'MALE',
          phoneNumber: `+96650${p.mrn.replace('STEMI-', '').padStart(7, '0')}`,
          address: `Street ${p.mrn.split('-')[1]}, Riyadh`,
          emergencyContact: `Emergency Contact ${p.mrn.split('-')[1]}`,
          emergencyPhone: `+96651${p.mrn.replace('STEMI-', '').padStart(7, '1')}`,
          medicalHistory: p.age > 65 ? 'Hypertension, Diabetes' : 'Hypertension',
          allergies: 'None',
          medications: 'Aspirin, Metformin',
          createdById: user.id
        }
      });
      stemiPatients.push({ ...patient, arrivalDate: daysAgo(p.days) });
      console.log(`  Created ${p.mrn}`);
    }

    // Group 1: Direct Cases - Primary PCI (8 patients)
    // STEMI-001: Perfect Direct Primary PCI - All KPIs PASS
    const s1 = stemiPatients[0];
    await prisma.stemiCase.create({
      data: {
        patientId: s1.id, originHospitalId: stemiHospital.id, currentStatus: 'CCU_ADMITTED',
        selectedTreatment: 'PRIMARY_PCI', caseType: 'DIRECT', modeOfArrival: 'AMBULANCE_RED_CRESCENT',
        triageTime: addMinutes(s1.arrivalDate, 2)!, firstEcgTime: addMinutes(s1.arrivalDate, 10),
        ecgResult: 'STEMI_ANTERIOR', ecgFindings: 'ST elevation in leads V1-V4',
        rccActivated: true, rccUnit: 'RCC-001', cathLabActivationTime: addMinutes(s1.arrivalDate, 22),
        cathLabArrivalTime: addMinutes(s1.arrivalDate, 45), pciProcedureStartTime: addMinutes(s1.arrivalDate, 50),
        pciProcedureCompleteTime: addMinutes(s1.arrivalDate, 75), balloonInflationTime: addMinutes(s1.arrivalDate, 77),
        eligibleForPrimaryPci: true, pciType: 'PRIMARY', pciLocation: 'LAD',
        successful: true, complications: null,
        dischargeStatus: 'STABLE', dischargeDate: addMinutes(s1.arrivalDate, 3 * 24 * 60),
        dischargeMedications: 'Aspirin, Clopidogrel, Atorvastatin',
        followUpAppointmentDate: addMinutes(s1.arrivalDate, 30 * 24 * 60),
        followUpAppointmentProvider: 'Dr. Ahmed Cardiology',
        followUpCallCompleted: true, followUpCallDate: addMinutes(s1.arrivalDate, 35 * 24 * 60),
        thirtyDayReadmission: false,
        heartScore: 5, clinicalRiskLevel: 'High', presentingSymptoms: 'Chest pain, SOB',
        symptomOnset: addMinutes(s1.arrivalDate, -120), symptomDuration: 120, miType: 'STEMI',
        pathwayStarted: s1.arrivalDate, pathwayCompleted: addMinutes(s1.arrivalDate, 80),
        doorToEcgMinutes: 8, doorToBalloonMinutes: 75,
        metKpi1: true, metKpi2: true, metKpi2Direct: true, metKpi6: true, metKpi11: true,
        createdById: user.id
      }
    });

    // STEMI-002: Direct Primary PCI - Delayed ECG (KPI 1 FAIL)
    const s2 = stemiPatients[1];
    await prisma.stemiCase.create({
      data: {
        patientId: s2.id, originHospitalId: stemiHospital.id, currentStatus: 'CCU_ADMITTED',
        selectedTreatment: 'PRIMARY_PCI', caseType: 'DIRECT', modeOfArrival: 'PRIVATE_CAR',
        triageTime: addMinutes(s2.arrivalDate, 3)!, firstEcgTime: addMinutes(s2.arrivalDate, 18),
        ecgResult: 'STEMI_INFERIOR', ecgFindings: 'ST elevation in leads II, III, aVF',
        rccActivated: true, balloonInflationTime: addMinutes(s2.arrivalDate, 88),
        eligibleForPrimaryPci: true, pciType: 'PRIMARY', pciLocation: 'RCA',
        successful: true, dischargeStatus: 'STABLE',
        followUpCallCompleted: true, thirtyDayReadmission: false,
        presentingSymptoms: 'Chest pain radiating to jaw',
        symptomOnset: addMinutes(s2.arrivalDate, -90), symptomDuration: 90,
        doorToEcgMinutes: 15, doorToBalloonMinutes: 85,
        metKpi1: false, metKpi2: true, metKpi2Direct: true, metKpi6: true, metKpi11: true,
        createdById: user.id
      }
    });

    // STEMI-003: Direct Primary PCI - Delayed Balloon (KPI 2 FAIL)
    const s3 = stemiPatients[2];
    await prisma.stemiCase.create({
      data: {
        patientId: s3.id, originHospitalId: stemiHospital.id, currentStatus: 'CCU_ADMITTED',
        selectedTreatment: 'PRIMARY_PCI', caseType: 'DIRECT', modeOfArrival: 'AMBULANCE_RED_CRESCENT',
        triageTime: addMinutes(s3.arrivalDate, 2)!, firstEcgTime: addMinutes(s3.arrivalDate, 11),
        ecgResult: 'STEMI_LATERAL', ecgFindings: 'ST elevation in leads I, aVL, V5-V6',
        rccActivated: true, balloonInflationTime: addMinutes(s3.arrivalDate, 127),
        eligibleForPrimaryPci: true, pciType: 'PRIMARY', pciLocation: 'LCx',
        successful: true, dischargeStatus: 'STABLE',
        followUpCallCompleted: true, thirtyDayReadmission: false,
        presentingSymptoms: 'Severe chest pain',
        doorToEcgMinutes: 9, doorToBalloonMinutes: 125,
        metKpi1: true, metKpi2: false, metKpi2Direct: false, metKpi6: true, metKpi11: true,
        createdById: user.id
      }
    });

    // STEMI-004: Direct Primary PCI - PCI Failure (KPI 6 FAIL)
    const s4 = stemiPatients[3];
    await prisma.stemiCase.create({
      data: {
        patientId: s4.id, originHospitalId: stemiHospital.id, currentStatus: 'CCU_ADMITTED',
        selectedTreatment: 'PRIMARY_PCI', caseType: 'DIRECT', modeOfArrival: 'AMBULANCE_RED_CRESCENT',
        triageTime: addMinutes(s4.arrivalDate, 2)!, firstEcgTime: addMinutes(s4.arrivalDate, 10),
        ecgResult: 'STEMI_ANTERIOR', rccActivated: true,
        balloonInflationTime: addMinutes(s4.arrivalDate, 78), successful: false,
        complications: 'Failed to cross lesion - severe calcification',
        eligibleForPrimaryPci: true, pciType: 'PRIMARY',
        dischargeStatus: 'COMPLICATIONS', followUpCallCompleted: true,
        doorToEcgMinutes: 8, doorToBalloonMinutes: 76,
        metKpi1: true, metKpi2: true, metKpi6: false, metKpi11: true,
        createdById: user.id
      }
    });

    // STEMI-005: Direct Primary PCI - Missing Follow-up (KPI 11 FAIL)
    const s5 = stemiPatients[4];
    await prisma.stemiCase.create({
      data: {
        patientId: s5.id, originHospitalId: stemiHospital.id, currentStatus: 'DISCHARGED',
        selectedTreatment: 'PRIMARY_PCI', caseType: 'DIRECT', modeOfArrival: 'AMBULANCE_RED_CRESCENT',
        triageTime: addMinutes(s5.arrivalDate, 2)!, firstEcgTime: addMinutes(s5.arrivalDate, 12),
        ecgResult: 'STEMI_INFERIOR', rccActivated: true,
        balloonInflationTime: addMinutes(s5.arrivalDate, 90), successful: true,
        dischargeStatus: 'STABLE', dischargeDate: addMinutes(s5.arrivalDate, 4 * 24 * 60),
        followUpCallCompleted: false, thirtyDayReadmission: false,
        doorToEcgMinutes: 10, doorToBalloonMinutes: 88,
        metKpi1: true, metKpi2: true, metKpi6: true, metKpi11: false,
        createdById: user.id
      }
    });

    // STEMI-006: Direct Primary PCI - 30-Day Readmission (KPI 10 FAIL)
    const s6 = stemiPatients[5];
    await prisma.stemiCase.create({
      data: {
        patientId: s6.id, originHospitalId: stemiHospital.id, currentStatus: 'CCU_ADMITTED',
        selectedTreatment: 'PRIMARY_PCI', caseType: 'DIRECT', modeOfArrival: 'AMBULANCE_RED_CRESCENT',
        triageTime: addMinutes(s6.arrivalDate, 2)!, firstEcgTime: addMinutes(s6.arrivalDate, 9),
        ecgResult: 'STEMI_ANTERIOR', rccActivated: true,
        balloonInflationTime: addMinutes(s6.arrivalDate, 82), successful: true,
        dischargeStatus: 'STABLE', dischargeDate: addMinutes(s6.arrivalDate, 3 * 24 * 60),
        followUpCallCompleted: true, thirtyDayReadmission: true,
        doorToEcgMinutes: 7, doorToBalloonMinutes: 80,
        metKpi1: true, metKpi2: true, metKpi6: true, metKpi11: true,
        createdById: user.id
      }
    });

    // STEMI-007: Direct Primary PCI - All Fields Complete
    const s7 = stemiPatients[6];
    await prisma.stemiCase.create({
      data: {
        patientId: s7.id, originHospitalId: stemiHospital.id, currentStatus: 'CCU_ADMITTED',
        selectedTreatment: 'PRIMARY_PCI', caseType: 'DIRECT', modeOfArrival: 'AMBULANCE_RED_CRESCENT',
        triageTime: addMinutes(s7.arrivalDate, 2)!, firstEcgTime: addMinutes(s7.arrivalDate, 8),
        ecgResult: 'STEMI_ANTERIOR', ecgFindings: 'ST elevation V1-V4, Q waves present',
        rccActivated: true, rccUnit: 'RCC-002', cathLabActivationTime: addMinutes(s7.arrivalDate, 20),
        cathLabArrivalTime: addMinutes(s7.arrivalDate, 42), pciProcedureStartTime: addMinutes(s7.arrivalDate, 48),
        pciProcedureCompleteTime: addMinutes(s7.arrivalDate, 72), balloonInflationTime: addMinutes(s7.arrivalDate, 74),
        eligibleForPrimaryPci: true, pciType: 'PRIMARY', pciLocation: 'LAD',
        successful: true, complications: null,
        postPciComplications: 'None', dischargeStatus: 'STABLE',
        dischargeMedications: 'Aspirin 81mg, Clopidogrel 75mg, Atorvastatin 40mg, Metoprolol 50mg',
        followUpAppointmentDate: addMinutes(s7.arrivalDate, 30 * 24 * 60),
        followUpAppointmentProvider: 'Dr. Sara Cardiology Clinic',
        followUpCallCompleted: true, followUpCallDate: addMinutes(s7.arrivalDate, 32 * 24 * 60),
        thirtyDayReadmission: false,
        heartScore: 6, clinicalRiskLevel: 'Very High', presentingSymptoms: 'Severe chest pain, diaphoresis, nausea',
        symptomOnset: addMinutes(s7.arrivalDate, -150), symptomDuration: 150, miType: 'STEMI',
        outcome: 'SUCCESSFUL_PCI', pathwayStarted: s7.arrivalDate, pathwayCompleted: addMinutes(s7.arrivalDate, 76),
        doorToEcgMinutes: 6, doorToBalloonMinutes: 72,
        metKpi1: true, metKpi2: true, metKpi2Direct: true, metKpi6: true, metKpi11: true,
        createdById: user.id
      }
    });

    // STEMI-008: Direct Primary PCI - RESCUE_PCI Type
    const s8 = stemiPatients[7];
    await prisma.stemiCase.create({
      data: {
        patientId: s8.id, originHospitalId: stemiHospital.id, currentStatus: 'CCU_ADMITTED',
        selectedTreatment: 'PRIMARY_PCI', caseType: 'DIRECT', modeOfArrival: 'AMBULANCE_RED_CRESCENT',
        triageTime: addMinutes(s8.arrivalDate, 2)!, firstEcgTime: addMinutes(s8.arrivalDate, 9),
        ecgResult: 'STEMI_INFERIOR', rccActivated: true,
        balloonInflationTime: addMinutes(s8.arrivalDate, 85), successful: true,
        eligibleForPrimaryPci: true, pciType: 'RESCUE_PCI', pciLocation: 'RCA',
        followUpCallCompleted: true, thirtyDayReadmission: false,
        doorToEcgMinutes: 7, doorToBalloonMinutes: 83,
        metKpi1: true, metKpi2: true, metKpi6: true, metKpi11: true,
        createdById: user.id
      }
    });

    // Group 2: Transfer Cases - Primary PCI (6 patients)
    // STEMI-009: Perfect Transfer Primary PCI
    const s9 = stemiPatients[8];
    const s9DoorOutTime = addMinutes(s9.arrivalDate, 28)!;
    const s9EmsContactTime = addMinutes(s9.arrivalDate, 13); // 15 minutes before doorOut (PASS)
    const s9Ticket = await prisma.ticket.create({
      data: {
        ticketNumber: `STEMI-TRANSFER-${s9.mrn}-${Date.now()}`,
        patientId: s9.id,
        originHospitalId: stemiHospital.id,
        destinationHospitalId: transferHospital.id,
        priority: 'CRITICAL',
        status: 'PENDING',
        pathway: 'STEMI',
        emsContactTime: s9EmsContactTime,
        isEmergency: true,
        emergencyType: 'STEMI',
        emergencySeverity: 'CRITICAL',
        createdById: user.id
      }
    });
    await prisma.stemiCase.create({
      data: {
        ticketId: s9Ticket.id,
        patientId: s9.id, originHospitalId: stemiHospital.id, destinationHospitalId: transferHospital.id,
        currentStatus: 'CCU_ADMITTED', selectedTreatment: 'TRANSFER_FOR_PRIMARY_PCI', caseType: 'TRANSFER',
        modeOfArrival: 'AMBULANCE_RED_CRESCENT', transferRequestDateTime: addMinutes(s9.arrivalDate, 15),
        transferArrivalDateTime: addMinutes(s9.arrivalDate, 43),
        triageTime: addMinutes(s9.arrivalDate, 3)!, firstEcgTime: addMinutes(s9.arrivalDate, 12),
        ecgResult: 'STEMI_ANTERIOR', rccActivated: true, rccUnit: 'RCC-003',
        cathLabActivationTime: addMinutes(s9.arrivalDate, 22), doorOutTime: s9DoorOutTime,
        balloonInflationTime: addMinutes(s9.arrivalDate, 113), successful: true,
        eligibleForPrimaryPci: true, pciType: 'PRIMARY',
        followUpCallCompleted: true, thirtyDayReadmission: false,
        doorToEcgMinutes: 9, doorToBalloonMinutes: 110, doorInDoorOutMinutes: 25,
        rccActivationToDoorOutMinutes: 13,
        metKpi1: true, metKpi2: true, metKpi2Transfer: true, metKpi4: true, metKpi5: true, metKpi6: true, metKpi11: true,
        createdById: user.id
      }
    });

    // STEMI-010: Transfer Primary PCI - Delayed RCC Activation (KPI 4 FAIL)
    const s10 = stemiPatients[9];
    const s10DoorOutTime = addMinutes(s10.arrivalDate, 35)!;
    const s10EmsContactTime = addMinutes(s10.arrivalDate, 19); // 16 minutes before doorOut (FAIL >15)
    const s10Ticket = await prisma.ticket.create({
      data: {
        ticketNumber: `STEMI-TRANSFER-${s10.mrn}-${Date.now()}`,
        patientId: s10.id,
        originHospitalId: stemiHospital.id,
        destinationHospitalId: transferHospital.id,
        priority: 'CRITICAL',
        status: 'PENDING',
        pathway: 'STEMI',
        emsContactTime: s10EmsContactTime,
        isEmergency: true,
        emergencyType: 'STEMI',
        emergencySeverity: 'CRITICAL',
        createdById: user.id
      }
    });
    await prisma.stemiCase.create({
      data: {
        ticketId: s10Ticket.id,
        patientId: s10.id, originHospitalId: stemiHospital.id, destinationHospitalId: transferHospital.id,
        currentStatus: 'CCU_ADMITTED', selectedTreatment: 'TRANSFER_FOR_PRIMARY_PCI', caseType: 'TRANSFER',
        modeOfArrival: 'AMBULANCE_RED_CRESCENT', transferRequestDateTime: addMinutes(s10.arrivalDate, 20),
        triageTime: addMinutes(s10.arrivalDate, 3)!, firstEcgTime: addMinutes(s10.arrivalDate, 11),
        ecgResult: 'STEMI_INFERIOR', rccActivated: true,
        cathLabActivationTime: addMinutes(s10.arrivalDate, 25), doorOutTime: s10DoorOutTime,
        balloonInflationTime: addMinutes(s10.arrivalDate, 115), successful: true,
        eligibleForPrimaryPci: true, doorToEcgMinutes: 8, doorToBalloonMinutes: 112,
        doorInDoorOutMinutes: 32, rccActivationToDoorOutMinutes: 20,
        metKpi1: true, metKpi2: true, metKpi4: false, metKpi5: true, metKpi6: true, metKpi11: true,
        createdById: user.id
      }
    });

    // STEMI-011: Transfer Primary PCI - Delayed DIDO (KPI 5 FAIL)
    const s11 = stemiPatients[10];
    const s11DoorOutTime = addMinutes(s11.arrivalDate, 60)!;
    const s11EmsContactTime = addMinutes(s11.arrivalDate, 50); // 10 minutes before doorOut (PASS for KPI4)
    const s11Ticket = await prisma.ticket.create({
      data: {
        ticketNumber: `STEMI-TRANSFER-${s11.mrn}-${Date.now()}`,
        patientId: s11.id,
        originHospitalId: stemiHospital.id,
        destinationHospitalId: transferHospital.id,
        priority: 'CRITICAL',
        status: 'PENDING',
        pathway: 'STEMI',
        emsContactTime: s11EmsContactTime,
        isEmergency: true,
        emergencyType: 'STEMI',
        emergencySeverity: 'CRITICAL',
        createdById: user.id
      }
    });
    await prisma.stemiCase.create({
      data: {
        ticketId: s11Ticket.id,
        patientId: s11.id, originHospitalId: stemiHospital.id, destinationHospitalId: transferHospital.id,
        currentStatus: 'CCU_ADMITTED', selectedTreatment: 'TRANSFER_FOR_PRIMARY_PCI', caseType: 'TRANSFER',
        modeOfArrival: 'AMBULANCE_RED_CRESCENT', transferRequestDateTime: addMinutes(s11.arrivalDate, 18),
        triageTime: addMinutes(s11.arrivalDate, 5)!, firstEcgTime: addMinutes(s11.arrivalDate, 15),
        ecgResult: 'STEMI_LATERAL', rccActivated: true,
        doorOutTime: s11DoorOutTime, balloonInflationTime: addMinutes(s11.arrivalDate, 130),
        eligibleForPrimaryPci: true, successful: true,
        doorToEcgMinutes: 10, doorToBalloonMinutes: 125, doorInDoorOutMinutes: 55,
        metKpi1: true, metKpi2: false, metKpi4: true, metKpi5: false, metKpi6: true, metKpi11: true,
        createdById: user.id
      }
    });

    // STEMI-012: Transfer Primary PCI - Delayed Balloon (KPI 2 Transfer FAIL)
    const s12 = stemiPatients[11];
    const s12DoorOutTime = addMinutes(s12.arrivalDate, 27)!;
    const s12EmsContactTime = addMinutes(s12.arrivalDate, 15); // 12 minutes before doorOut (PASS for KPI4)
    const s12Ticket = await prisma.ticket.create({
      data: {
        ticketNumber: `STEMI-TRANSFER-${s12.mrn}-${Date.now()}`,
        patientId: s12.id,
        originHospitalId: stemiHospital.id,
        destinationHospitalId: transferHospital.id,
        priority: 'CRITICAL',
        status: 'PENDING',
        pathway: 'STEMI',
        emsContactTime: s12EmsContactTime,
        isEmergency: true,
        emergencyType: 'STEMI',
        emergencySeverity: 'CRITICAL',
        createdById: user.id
      }
    });
    await prisma.stemiCase.create({
      data: {
        ticketId: s12Ticket.id,
        patientId: s12.id, originHospitalId: stemiHospital.id, destinationHospitalId: transferHospital.id,
        currentStatus: 'CCU_ADMITTED', selectedTreatment: 'TRANSFER_FOR_PRIMARY_PCI', caseType: 'TRANSFER',
        modeOfArrival: 'TRANSFERRED_FROM_ANOTHER_HOSPITAL', transferRequestDateTime: addMinutes(s12.arrivalDate, 10),
        triageTime: addMinutes(s12.arrivalDate, 2)!, firstEcgTime: addMinutes(s12.arrivalDate, 9),
        ecgResult: 'STEMI_ANTERIOR', rccActivated: true,
        doorOutTime: s12DoorOutTime, balloonInflationTime: addMinutes(s12.arrivalDate, 125),
        eligibleForPrimaryPci: true, successful: true,
        doorToEcgMinutes: 7, doorToBalloonMinutes: 123, doorInDoorOutMinutes: 25,
        metKpi1: true, metKpi2: false, metKpi2Transfer: false, metKpi4: true, metKpi5: true, metKpi6: true, metKpi11: true,
        createdById: user.id
      }
    });

    // STEMI-013: Transfer Primary PCI - All Transfer Fields Complete
    const s13 = stemiPatients[12];
    const s13DoorOutTime = addMinutes(s13.arrivalDate, 29)!;
    const s13EmsContactTime = addMinutes(s13.arrivalDate, 16); // 13 minutes before doorOut (PASS)
    const s13Ticket = await prisma.ticket.create({
      data: {
        ticketNumber: `STEMI-TRANSFER-${s13.mrn}-${Date.now()}`,
        patientId: s13.id,
        originHospitalId: stemiHospital.id,
        destinationHospitalId: transferHospital.id,
        priority: 'CRITICAL',
        status: 'PENDING',
        pathway: 'STEMI',
        emsContactTime: s13EmsContactTime,
        isEmergency: true,
        emergencyType: 'STEMI',
        emergencySeverity: 'CRITICAL',
        createdById: user.id
      }
    });
    await prisma.stemiCase.create({
      data: {
        ticketId: s13Ticket.id,
        patientId: s13.id, originHospitalId: stemiHospital.id, destinationHospitalId: transferHospital.id,
        currentStatus: 'CCU_ADMITTED', selectedTreatment: 'TRANSFER_FOR_PRIMARY_PCI', caseType: 'TRANSFER',
        modeOfArrival: 'AMBULANCE_RED_CRESCENT', transferRequestDateTime: addMinutes(s13.arrivalDate, 16),
        transferArrivalDateTime: addMinutes(s13.arrivalDate, 48),
        triageTime: addMinutes(s13.arrivalDate, 3)!, firstEcgTime: addMinutes(s13.arrivalDate, 11),
        ecgResult: 'STEMI_INFERIOR', rccActivated: true, rccUnit: 'RCC-004',
        cathLabActivationTime: addMinutes(s13.arrivalDate, 23), doorOutTime: s13DoorOutTime,
        balloonInflationTime: addMinutes(s13.arrivalDate, 112), successful: true,
        eligibleForPrimaryPci: true, pciType: 'PRIMARY',
        followUpCallCompleted: true, thirtyDayReadmission: false,
        doorToEcgMinutes: 8, doorToBalloonMinutes: 109, doorInDoorOutMinutes: 26,
        metKpi1: true, metKpi2: true, metKpi2Transfer: true, metKpi4: true, metKpi5: true, metKpi6: true, metKpi11: true,
        createdById: user.id
      }
    });

    // STEMI-014: Transfer Primary PCI - Missing Follow-up (KPI 11 FAIL)
    const s14 = stemiPatients[13];
    const s14DoorOutTime = addMinutes(s14.arrivalDate, 28)!;
    const s14EmsContactTime = addMinutes(s14.arrivalDate, 14); // 14 minutes before doorOut (PASS)
    const s14Ticket = await prisma.ticket.create({
      data: {
        ticketNumber: `STEMI-TRANSFER-${s14.mrn}-${Date.now()}`,
        patientId: s14.id,
        originHospitalId: stemiHospital.id,
        destinationHospitalId: transferHospital.id,
        priority: 'CRITICAL',
        status: 'PENDING',
        pathway: 'STEMI',
        emsContactTime: s14EmsContactTime,
        isEmergency: true,
        emergencyType: 'STEMI',
        emergencySeverity: 'CRITICAL',
        createdById: user.id
      }
    });
    await prisma.stemiCase.create({
      data: {
        ticketId: s14Ticket.id,
        patientId: s14.id, originHospitalId: stemiHospital.id, destinationHospitalId: transferHospital.id,
        currentStatus: 'CCU_ADMITTED', selectedTreatment: 'TRANSFER_FOR_PRIMARY_PCI', caseType: 'TRANSFER',
        modeOfArrival: 'AMBULANCE_RED_CRESCENT', triageTime: addMinutes(s14.arrivalDate, 3)!,
        firstEcgTime: addMinutes(s14.arrivalDate, 12), ecgResult: 'STEMI_LATERAL', rccActivated: true,
        doorOutTime: s14DoorOutTime, balloonInflationTime: addMinutes(s14.arrivalDate, 114),
        eligibleForPrimaryPci: true, successful: true,
        followUpCallCompleted: false, thirtyDayReadmission: false,
        doorToEcgMinutes: 9, doorToBalloonMinutes: 111, doorInDoorOutMinutes: 25,
        metKpi1: true, metKpi2: true, metKpi4: true, metKpi5: true, metKpi6: true, metKpi11: false,
        createdById: user.id
      }
    });

    // Group 3: Fibrinolysis Cases (4 patients)
    // STEMI-015: Transfer Fibrinolysis - Perfect (KPI 3 PASS)
    const s15 = stemiPatients[14];
    const s15DoorOutTime = addMinutes(s15.arrivalDate, 30)!;
    const s15EmsContactTime = addMinutes(s15.arrivalDate, 18); // 12 minutes before doorOut (PASS)
    const s15Ticket = await prisma.ticket.create({
      data: {
        ticketNumber: `STEMI-TRANSFER-${s15.mrn}-${Date.now()}`,
        patientId: s15.id,
        originHospitalId: stemiHospital.id,
        destinationHospitalId: transferHospital.id,
        priority: 'CRITICAL',
        status: 'PENDING',
        pathway: 'STEMI',
        emsContactTime: s15EmsContactTime,
        isEmergency: true,
        emergencyType: 'STEMI',
        emergencySeverity: 'CRITICAL',
        createdById: user.id
      }
    });
    await prisma.stemiCase.create({
      data: {
        ticketId: s15Ticket.id,
        patientId: s15.id, originHospitalId: stemiHospital.id, destinationHospitalId: transferHospital.id,
        currentStatus: 'CCU_ADMITTED', selectedTreatment: 'FIBRINOLYSIS', caseType: 'TRANSFER',
        modeOfArrival: 'AMBULANCE_RED_CRESCENT', triageTime: addMinutes(s15.arrivalDate, 2)!,
        firstEcgTime: addMinutes(s15.arrivalDate, 8), ecgResult: 'STEMI_ANTERIOR',
        rccActivated: true, thrombolyticGiven: true,
        thrombolyticAdminTime: addMinutes(s15.arrivalDate, 27), successful: true,
        fibrinolyticAbsoluteContraindications: 'None',
        fibrinolyticRelativeContraindications: 'Age >75 years',
        doorOutTime: s15DoorOutTime, followUpCallCompleted: true,
        doorToEcgMinutes: 6, doorToNeedleMinutes: 25,
        metKpi1: true, metKpi3: true, metKpi11: true,
        createdById: user.id
      }
    });

    // STEMI-016: Transfer Fibrinolysis - Delayed Needle (KPI 3 FAIL)
    const s16 = stemiPatients[15];
    const s16DoorOutTime = addMinutes(s16.arrivalDate, 40)!;
    const s16EmsContactTime = addMinutes(s16.arrivalDate, 22); // 18 minutes before doorOut (FAIL >15)
    const s16Ticket = await prisma.ticket.create({
      data: {
        ticketNumber: `STEMI-TRANSFER-${s16.mrn}-${Date.now()}`,
        patientId: s16.id,
        originHospitalId: stemiHospital.id,
        destinationHospitalId: transferHospital.id,
        priority: 'CRITICAL',
        status: 'PENDING',
        pathway: 'STEMI',
        emsContactTime: s16EmsContactTime,
        isEmergency: true,
        emergencyType: 'STEMI',
        emergencySeverity: 'CRITICAL',
        createdById: user.id
      }
    });
    await prisma.stemiCase.create({
      data: {
        ticketId: s16Ticket.id,
        patientId: s16.id, originHospitalId: stemiHospital.id, destinationHospitalId: transferHospital.id,
        currentStatus: 'CCU_ADMITTED', selectedTreatment: 'FIBRINOLYSIS', caseType: 'TRANSFER',
        modeOfArrival: 'AMBULANCE_RED_CRESCENT', triageTime: addMinutes(s16.arrivalDate, 3)!,
        firstEcgTime: addMinutes(s16.arrivalDate, 9), ecgResult: 'STEMI_INFERIOR',
        rccActivated: true, thrombolyticGiven: true,
        thrombolyticAdminTime: addMinutes(s16.arrivalDate, 38), successful: true,
        fibrinolyticAbsoluteContraindications: 'None',
        doorOutTime: s16DoorOutTime,
        doorToEcgMinutes: 6, doorToNeedleMinutes: 35,
        metKpi1: true, metKpi3: false, metKpi11: true,
        createdById: user.id
      }
    });

    // STEMI-017: Direct Fibrinolysis - All Fields Complete
    const s17 = stemiPatients[16];
    await prisma.stemiCase.create({
      data: {
        patientId: s17.id, originHospitalId: stemiHospital.id, currentStatus: 'CCU_ADMITTED',
        selectedTreatment: 'FIBRINOLYSIS', caseType: 'DIRECT', modeOfArrival: 'PRIVATE_CAR',
        triageTime: addMinutes(s17.arrivalDate, 2)!, firstEcgTime: addMinutes(s17.arrivalDate, 10),
        ecgResult: 'STEMI_LATERAL', rccActivated: true, thrombolyticGiven: true,
        thrombolyticAdminTime: addMinutes(s17.arrivalDate, 28), successful: true,
        fibrinolyticAbsoluteContraindications: 'None',
        fibrinolyticRelativeContraindications: 'Recent surgery (2 weeks ago)',
        followUpCallCompleted: true, thirtyDayReadmission: false,
        doorToEcgMinutes: 8, doorToNeedleMinutes: 26,
        metKpi1: true, metKpi3: true, metKpi11: true,
        createdById: user.id
      }
    });

    // STEMI-018: Transfer Fibrinolysis - Post-Fibrinolysis Transfer (KPI 7)
    const s18 = stemiPatients[17];
    const s18DoorOutTime = addMinutes(s18.arrivalDate, 35)!;
    const s18EmsContactTime = addMinutes(s18.arrivalDate, 22); // 13 minutes before doorOut (PASS)
    const s18Ticket = await prisma.ticket.create({
      data: {
        ticketNumber: `STEMI-TRANSFER-${s18.mrn}-${Date.now()}`,
        patientId: s18.id,
        originHospitalId: stemiHospital.id,
        destinationHospitalId: transferHospital.id,
        priority: 'CRITICAL',
        status: 'PENDING',
        pathway: 'STEMI',
        emsContactTime: s18EmsContactTime,
        isEmergency: true,
        emergencyType: 'STEMI',
        emergencySeverity: 'CRITICAL',
        createdById: user.id
      }
    });
    await prisma.stemiCase.create({
      data: {
        ticketId: s18Ticket.id,
        patientId: s18.id, originHospitalId: stemiHospital.id, destinationHospitalId: transferHospital.id,
        currentStatus: 'CCU_ADMITTED', selectedTreatment: 'FIBRINOLYSIS', caseType: 'TRANSFER',
        modeOfArrival: 'AMBULANCE_RED_CRESCENT', triageTime: addMinutes(s18.arrivalDate, 2)!,
        firstEcgTime: addMinutes(s18.arrivalDate, 9), ecgResult: 'STEMI_ANTERIOR',
        rccActivated: true, thrombolyticGiven: true,
        thrombolyticAdminTime: addMinutes(s18.arrivalDate, 29), successful: true,
        doorOutTime: s18DoorOutTime, followUpCallCompleted: true,
        doorToEcgMinutes: 7, doorToNeedleMinutes: 27,
        metKpi1: true, metKpi3: true, metKpi11: true,
        createdById: user.id
      }
    });

    // Group 4: Conservative Management & Edge Cases (2 patients)
    // STEMI-019: Conservative Management
    const s19 = stemiPatients[18];
    await prisma.stemiCase.create({
      data: {
        patientId: s19.id, originHospitalId: stemiHospital.id, currentStatus: 'CCU_ADMITTED',
        selectedTreatment: 'CONSERVATIVE_MANAGEMENT', caseType: 'DIRECT', modeOfArrival: 'AMBULANCE_RED_CRESCENT',
        triageTime: addMinutes(s19.arrivalDate, 4)!, firstEcgTime: addMinutes(s19.arrivalDate, 12),
        ecgResult: 'STEMI_INFERIOR', rccActivated: true,
        eligibleForPrimaryPci: false, presentingSymptoms: 'Mild chest discomfort',
        symptomOnset: addMinutes(s19.arrivalDate, -180), symptomDuration: 180,
        followUpCallCompleted: true, thirtyDayReadmission: false,
        doorToEcgMinutes: 8,
        metKpi1: true, metKpi11: true,
        createdById: user.id
      }
    });

    // STEMI-020: Mortality Case (KPI 9)
    const s20 = stemiPatients[19];
    await prisma.stemiCase.create({
      data: {
        patientId: s20.id, originHospitalId: stemiHospital.id, currentStatus: 'DECEASED',
        selectedTreatment: 'PRIMARY_PCI', caseType: 'DIRECT', modeOfArrival: 'AMBULANCE_RED_CRESCENT',
        triageTime: addMinutes(s20.arrivalDate, 2)!, firstEcgTime: addMinutes(s20.arrivalDate, 10),
        ecgResult: 'STEMI_ANTERIOR', rccActivated: true,
        balloonInflationTime: addMinutes(s20.arrivalDate, 85), successful: false,
        complications: 'Cardiogenic shock, cardiac arrest',
        dischargeStatus: 'DECEASED', dischargeDate: addMinutes(s20.arrivalDate, 1 * 24 * 60),
        followUpCallCompleted: false, thirtyDayReadmission: false,
        doorToEcgMinutes: 8, doorToBalloonMinutes: 83,
        metKpi1: true, metKpi2: true, metKpi6: false, metKpi11: false,
        createdById: user.id
      }
    });

    // Additional Transfer Cases for KPI 4 Coverage
    // STEMI-021: Transfer Primary PCI - Perfect RCC Activation (KPI 4 PASS)
    const s21 = stemiPatients[20];
    const s21DoorOutTime = addMinutes(s21.arrivalDate, 26)!;
    const s21EmsContactTime = addMinutes(s21.arrivalDate, 12); // 14 minutes before doorOut (PASS)
    const s21Ticket = await prisma.ticket.create({
      data: {
        ticketNumber: `STEMI-TRANSFER-${s21.mrn}-${Date.now()}`,
        patientId: s21.id,
        originHospitalId: stemiHospital.id,
        destinationHospitalId: transferHospital.id,
        priority: 'CRITICAL',
        status: 'PENDING',
        pathway: 'STEMI',
        emsContactTime: s21EmsContactTime,
        isEmergency: true,
        emergencyType: 'STEMI',
        emergencySeverity: 'CRITICAL',
        createdById: user.id
      }
    });
    await prisma.stemiCase.create({
      data: {
        ticketId: s21Ticket.id,
        patientId: s21.id, originHospitalId: stemiHospital.id, destinationHospitalId: transferHospital.id,
        currentStatus: 'CCU_ADMITTED', selectedTreatment: 'TRANSFER_FOR_PRIMARY_PCI', caseType: 'TRANSFER',
        modeOfArrival: 'AMBULANCE_RED_CRESCENT', transferRequestDateTime: addMinutes(s21.arrivalDate, 14),
        triageTime: addMinutes(s21.arrivalDate, 3)!, firstEcgTime: addMinutes(s21.arrivalDate, 10),
        ecgResult: 'STEMI_ANTERIOR', rccActivated: true,
        cathLabActivationTime: addMinutes(s21.arrivalDate, 20), doorOutTime: s21DoorOutTime,
        balloonInflationTime: addMinutes(s21.arrivalDate, 108), successful: true,
        eligibleForPrimaryPci: true, pciType: 'PRIMARY',
        followUpCallCompleted: true, thirtyDayReadmission: false,
        doorToEcgMinutes: 7, doorToBalloonMinutes: 105, doorInDoorOutMinutes: 23,
        metKpi1: true, metKpi2: true, metKpi2Transfer: true, metKpi4: true, metKpi5: true, metKpi6: true, metKpi11: true,
        createdById: user.id
      }
    });

    // STEMI-022: Transfer Primary PCI - Delayed RCC Activation (KPI 4 FAIL)
    const s22 = stemiPatients[21];
    const s22DoorOutTime = addMinutes(s22.arrivalDate, 32)!;
    const s22EmsContactTime = addMinutes(s22.arrivalDate, 15); // 17 minutes before doorOut (FAIL >15)
    const s22Ticket = await prisma.ticket.create({
      data: {
        ticketNumber: `STEMI-TRANSFER-${s22.mrn}-${Date.now()}`,
        patientId: s22.id,
        originHospitalId: stemiHospital.id,
        destinationHospitalId: transferHospital.id,
        priority: 'CRITICAL',
        status: 'PENDING',
        pathway: 'STEMI',
        emsContactTime: s22EmsContactTime,
        isEmergency: true,
        emergencyType: 'STEMI',
        emergencySeverity: 'CRITICAL',
        createdById: user.id
      }
    });
    await prisma.stemiCase.create({
      data: {
        ticketId: s22Ticket.id,
        patientId: s22.id, originHospitalId: stemiHospital.id, destinationHospitalId: transferHospital.id,
        currentStatus: 'CCU_ADMITTED', selectedTreatment: 'TRANSFER_FOR_PRIMARY_PCI', caseType: 'TRANSFER',
        modeOfArrival: 'AMBULANCE_RED_CRESCENT', transferRequestDateTime: addMinutes(s22.arrivalDate, 18),
        triageTime: addMinutes(s22.arrivalDate, 3)!, firstEcgTime: addMinutes(s22.arrivalDate, 11),
        ecgResult: 'STEMI_INFERIOR', rccActivated: true,
        cathLabActivationTime: addMinutes(s22.arrivalDate, 24), doorOutTime: s22DoorOutTime,
        balloonInflationTime: addMinutes(s22.arrivalDate, 116), successful: true,
        eligibleForPrimaryPci: true, pciType: 'PRIMARY',
        followUpCallCompleted: true, thirtyDayReadmission: false,
        doorToEcgMinutes: 8, doorToBalloonMinutes: 113, doorInDoorOutMinutes: 29,
        metKpi1: true, metKpi2: true, metKpi2Transfer: true, metKpi4: false, metKpi5: true, metKpi6: true, metKpi11: true,
        createdById: user.id
      }
    });

    // ==================== STROKE TEST PATIENTS (20 Total) ====================
    console.log('🧠 Creating 20 Stroke Test Patients...\n');

    const strokePatientsData = [
      { mrn: 'STROKE-001', days: 6 }, { mrn: 'STROKE-002', days: 9 },
      { mrn: 'STROKE-003', days: 11 }, { mrn: 'STROKE-004', days: 14 },
      { mrn: 'STROKE-005', days: 16 }, { mrn: 'STROKE-006', days: 19 },
      { mrn: 'STROKE-007', days: 21 }, { mrn: 'STROKE-008', days: 23 },
      { mrn: 'STROKE-009', days: 25 },
      { mrn: 'STROKE-010', days: 0 }, { mrn: 'STROKE-011', days: 1 },
      { mrn: 'STROKE-012', days: 2 }, { mrn: 'STROKE-013', days: 0 },
      { mrn: 'STROKE-014', days: 1 }, { mrn: 'STROKE-015', days: 3 },
      { mrn: 'STROKE-016', days: 0 }, { mrn: 'STROKE-017', days: 2 },
      { mrn: 'STROKE-018', days: 1 }, { mrn: 'STROKE-019', days: 3 },
      { mrn: 'STROKE-020', days: 2 }
    ];

    const strokePatients = [];
    for (const p of strokePatientsData) {
      // Check if patient exists, if so delete related cases and patient
      const existingPatient = await prisma.patient.findUnique({ where: { mrn: p.mrn } });
      if (existingPatient) {
        await prisma.strokeCase.deleteMany({ where: { patientId: existingPatient.id } });
        await prisma.patient.delete({ where: { mrn: p.mrn } });
      }
      const patient = await prisma.patient.create({
        data: {
          firstName: 'Stroke', lastName: `Patient-${p.mrn.split('-')[1]}`,
          mrn: p.mrn, nationalId: `2${p.mrn.replace('STROKE-', '').padStart(9, '0')}`,
          age: 60 + Math.floor(Math.random() * 20), gender: Math.random() > 0.5 ? 'MALE' : 'FEMALE',
          phoneNumber: `+96650${p.mrn.replace('STROKE-', '').padStart(7, '8')}`,
          address: `Street ${p.mrn.split('-')[1]}, Riyadh`,
          emergencyContact: `Emergency Contact ${p.mrn.split('-')[1]}`,
          emergencyPhone: `+96651${p.mrn.replace('STROKE-', '').padStart(7, '8')}`,
          medicalHistory: 'Hypertension, Atrial Fibrillation',
          allergies: 'None',
          medications: 'Warfarin, Lisinopril',
          createdById: user.id
        }
      });
      strokePatients.push({ ...patient, arrivalDate: daysAgo(p.days) });
      console.log(`  Created ${p.mrn}`);
    }

    // Group 1: Ischemic Stroke - IV Thrombolysis (6 patients)
    // STROKE-001: Perfect IV Thrombolysis Case
    await createStrokeCase(strokePatients[0], strokeHospital, true, 12, 18, 55, true, 'PASS', false, null, false, null, null, true, 'STROKE_UNIT', 45, user.id, {
      nihssBaseline: 12, mrsBaseline: 3, chiefComplaint: 'Sudden left-sided weakness',
      timeOfSymptomOnset: addMinutes(strokePatients[0].arrivalDate, -120),
      ctFindings: 'NORMAL', candidateForIVThrombolysis: 'YES',
      ivThrombolysisGiven: 'YES', swallowingScreeningWithin4Hours: true,
      timeOfSwallowingScreening: addMinutes(strokePatients[0].arrivalDate, 180)
    });

    // STROKE-002: IV Thrombolysis - Delayed Physician (KPI 1 FAIL)
    await createStrokeCase(strokePatients[1], strokeHospital, true, 18, 19, 58, true, 'PASS', false, null, false, null, null, true, 'STROKE_UNIT', 50, user.id, {
      metKpi1: false, nihssBaseline: 10, chiefComplaint: 'Sudden speech difficulty'
    });

    // STROKE-003: IV Thrombolysis - Delayed CT (KPI 3 FAIL)
    await createStrokeCase(strokePatients[2], strokeHospital, true, 14, 25, 62, true, 'PASS', false, null, false, null, null, true, 'STROKE_UNIT', 48, user.id, {
      metKpi3: false, nihssBaseline: 14, chiefComplaint: 'Right-sided weakness'
    });

    // STROKE-004: IV Thrombolysis - Delayed Thrombolysis (KPI 4 FAIL)
    await createStrokeCase(strokePatients[3], strokeHospital, true, 13, 17, 65, true, 'PASS', false, null, false, null, null, true, 'STROKE_UNIT', 52, user.id, {
      metKpi4: false, nihssBaseline: 11, chiefComplaint: 'Facial droop, arm weakness'
    });

    // STROKE-005: IV Thrombolysis - Not Admitted to Stroke Unit (KPI 6 FAIL)
    await createStrokeCase(strokePatients[4], strokeHospital, true, 12, 18, 45, false, 'PASS', false, null, false, null, null, true, 'ICU', 47, user.id, {
      metKpi6: false, admittedToStrokeUnit: false, nihssBaseline: 18, chiefComplaint: 'Severe stroke symptoms'
    });

    // STROKE-006: IV Thrombolysis - Delayed Swallowing Screening (KPI 10 FAIL)
    await prisma.strokeCase.create({
      data: {
        ...generateStrokeData(strokePatients[5], strokeHospital, true, 12, 18, 58, true, 'PASS', false, null, false, null, null, true, 'STROKE_UNIT', 45, user.id),
        swallowingScreeningWithin4Hours: false,
        timeOfSwallowingScreening: addMinutes(strokePatients[5].arrivalDate, 300),
        metKpi10: false,
        nihssBaseline: 9, chiefComplaint: 'Mild stroke symptoms'
      }
    });

    // Group 2: Ischemic Stroke - Mechanical Thrombectomy (4 patients)
    // STROKE-007: Perfect Mechanical Thrombectomy
    await createStrokeCase(strokePatients[6], strokeHospital, true, 10, 15, null, true, 'PASS', true, 110, false, null, null, true, 'STROKE_UNIT', 50, user.id, {
      lvoDetected: true, candidateForMechanicalThrombectomy: 'YES',
      mechanicalThrombectomyPerformed: true, nihssBaseline: 16,
      recanalizationGrade: 'mTICI 3', ctFindings: 'VASCULAR_OCCLUSION'
    });

    // STROKE-008: Mechanical Thrombectomy - Delayed (KPI 8 FAIL)
    await createStrokeCase(strokePatients[7], strokeHospital, true, 11, 16, null, true, 'PASS', true, 135, false, null, null, true, 'STROKE_UNIT', 48, user.id, {
      metKpi8: false, lvoDetected: true, mechanicalThrombectomyPerformed: true,
      nihssBaseline: 15, recanalizationGrade: 'mTICI 2b'
    });

    // STROKE-009: Mechanical Thrombectomy + IV Thrombolysis
    await createStrokeCase(strokePatients[8], strokeHospital, true, 12, 18, 58, true, 'PASS', true, 115, false, null, null, true, 'STROKE_UNIT', 45, user.id, {
      lvoDetected: true, ivThrombolysisGiven: 'YES', mechanicalThrombectomyPerformed: true,
      nihssBaseline: 17, recanalizationGrade: 'mTICI 3'
    });

    // STROKE-010: Mechanical Thrombectomy - All Fields Complete
    await createStrokeCase(strokePatients[9], strokeHospital, true, 11, 17, null, true, 'PASS', true, 108, false, null, null, true, 'STROKE_UNIT', 44, user.id, {
      lvoDetected: true, mechanicalThrombectomyPerformed: true,
      timeOfThrombectomyComplete: addMinutes(strokePatients[9].arrivalDate, 125),
      ctResults: 'Large vessel occlusion in M1 segment',
      ctaResults: 'Proximal MCA occlusion confirmed',
      ctpResults: 'Large penumbra, small core',
      mriResults: 'Acute infarct in MCA territory',
      mraResults: 'M1 occlusion',
      recanalizationGrade: 'mTICI 3', nihssBaseline: 14, nihss24hr: 8, nihssDischarge: 4,
      mrsBaseline: 4, mrs90day: 2, aspectsScore: 8
    });

    // Group 3: Transfer Cases (4 patients)
    // STROKE-011: Perfect Transfer with Pre-hospital Notification (KPI 2 PASS)
    await createStrokeCase(strokePatients[10], strokeHospital, true, 14, 19, null, false, 'PASS', false, null, true, transferHospital, 35, true, 'STROKE_UNIT', 50, user.id, {
      prehospitalNotificationBySrca: true, facilityHasCt: true,
      transferToAnotherHospital: true, nihssBaseline: 13
    });

    // STROKE-012: Transfer without Pre-hospital Notification (KPI 2 FAIL)
    await createStrokeCase(strokePatients[11], strokeHospital, false, 15, 20, null, false, 'PASS', false, null, true, transferHospital, 38, true, 'STROKE_UNIT', 55, user.id, {
      metKpi2: false, prehospitalNotificationBySrca: false, modeOfArrival: 'PRIVATE_CAR',
      transferToAnotherHospital: true, nihssBaseline: 12
    });

    // STROKE-013: Transfer - Delayed Transfer Time (KPI 7 FAIL)
    await createStrokeCase(strokePatients[12], strokeHospital, true, 15, 20, null, false, 'PASS', false, null, true, transferHospital, 55, true, 'STROKE_UNIT', 48, user.id, {
      metKpi7: false, facilityHasCt: true, transferToAnotherHospital: true,
      nihssBaseline: 11
    });

    // STROKE-014: Transfer without CT - Fast Transfer (KPI 7 PASS)
    await createStrokeCase(strokePatients[13], strokeHospital, true, 13, 0, null, false, 'PASS', false, null, true, transferHospital, 18, true, 'STROKE_UNIT', 52, user.id, {
      facilityHasCt: false, ctScanPerformed: false, transferToAnotherHospital: true,
      nihssBaseline: 10
    });

    // Group 4: SRCA Notification & Arrival (3 patients)
    // STROKE-015: Perfect SRCA Notification (KPI 9 PASS)
    await createStrokeCase(strokePatients[14], strokeHospital, true, 11, 17, 52, true, 'PASS', false, null, false, null, null, true, 'STROKE_UNIT', 45, user.id, {
      prehospitalNotificationBySrca: true, srcaCallToArrivalMinutes: 45,
      metKpi9: true, nihssBaseline: 10
    });

    // STROKE-016: SRCA Notification - Delayed Arrival (KPI 9 FAIL)
    await createStrokeCase(strokePatients[15], strokeHospital, true, 12, 18, null, true, 'PASS', false, null, false, null, null, true, 'STROKE_UNIT', 75, user.id, {
      prehospitalNotificationBySrca: true, srcaCallToArrivalMinutes: 75,
      metKpi9: false, nihssBaseline: 11
    });

    // STROKE-017: SRCA Notification - All Notification Fields
    await createStrokeCase(strokePatients[16], strokeHospital, true, 13, 19, null, true, 'PASS', false, null, false, null, null, true, 'STROKE_UNIT', 48, user.id, {
      prehospitalNotificationBySrca: true, prehospitalNotificationByUccPhc: true,
      srcaCallToArrivalMinutes: 48, nihssBaseline: 9
    });

    // Group 5: Hemorrhagic Stroke & Follow-up (3 patients)
    // STROKE-018: Hemorrhagic Stroke - Perfect Case
    await prisma.strokeCase.create({
      data: {
        patientId: strokePatients[17].id, originHospitalId: strokeHospital.id, strokeType: 'HEMORRHAGIC',
        strokeSeverity: 'MODERATE', currentStatus: 'STROKEUNIT_ADMITTED',
        modeOfArrival: 'AMBULANCE_RED_CRESCENT', prehospitalNotificationBySrca: true,
        srcaCallTime: addMinutes(strokePatients[17].arrivalDate, -45), dateOfAdmission: strokePatients[17].arrivalDate,
        timeOfTriage: addMinutes(strokePatients[17].arrivalDate, 2),
        timeOfPhysicianAssessment: addMinutes(strokePatients[17].arrivalDate, 13),
        ctScanPerformed: true, timeOfCtScanStart: addMinutes(strokePatients[17].arrivalDate, 17),
        timeOfCtReportFinal: addMinutes(strokePatients[17].arrivalDate, 25),
        ctFindings: 'HEMORRHAGE', ctResults: 'Intracerebral hemorrhage in basal ganglia',
        disposition: 'STROKE_UNIT', admittedToStrokeUnit: true,
        swallowingScreeningPerformed: true, swallowingScreeningResult: 'FAIL',
        timeOfSwallowingScreening: addMinutes(strokePatients[17].arrivalDate, 180),
        followUpCallCompleted: true, followUpCallDate: addMinutes(strokePatients[17].arrivalDate, 90 * 24 * 60),
        doorToPhysicianMinutes: 13, registrationToCtMinutes: 17, srcaCallToArrivalMinutes: 45,
        swallowingScreeningWithin4Hours: true,
        nihssBaseline: 12, gcsBaseline: 13, chiefComplaint: 'Sudden severe headache, left-sided weakness',
        metKpi1: true, metKpi2: true, metKpi3: true, metKpi6: true, metKpi9: true, metKpi10: true, metKpi11: true,
        createdById: user.id
      }
    });

    // STROKE-019: Missing Follow-up (KPI 11 FAIL)
    await createStrokeCase(strokePatients[18], strokeHospital, true, 12, 18, 52, true, 'PASS', false, null, false, null, null, false, 'STROKE_UNIT', 46, user.id, {
      followUpCallCompleted: false, metKpi11: false, nihssBaseline: 10
    });

    // STROKE-020: Complete Follow-up with Modified Rankin Scale
    await prisma.strokeCase.create({
      data: {
        ...generateStrokeData(strokePatients[19], strokeHospital, true, 12, 18, 55, true, 'PASS', false, null, false, null, null, true, 'STROKE_UNIT', 47, user.id),
        followUpCallCompleted: true, followUpCallDate: addMinutes(strokePatients[19].arrivalDate, 90 * 24 * 60),
        followUpContactAttempted: true, modifiedRankinScaleAt90Days: 'SCORE_2',
        followUpModifiedRankinScale: 2, dischargeModifiedRankinScale: 3,
        followUpType: 'PHONE', closureReport: 'Patient doing well, minimal residual deficits',
        functionalStatus: 'INDEPENDENT', mortality: 'ALIVE',
        dischargeType: 'PLANNED', dischargeDate: addMinutes(strokePatients[19].arrivalDate, 7 * 24 * 60),
        lengthOfStayDays: 7, nihssBaseline: 11, nihssDischarge: 3,
        mrsBaseline: 3, mrs90day: 2
      }
    });

    // ==================== TRAUMA TEST PATIENTS (20 Total) ====================
    console.log('🚑 Creating 20 Trauma Test Patients...\n');

    const traumaPatientsData = [
      { mrn: 'TRAUMA-001', days: 7, type: 'PENETRATING', gcs: 8 },
      { mrn: 'TRAUMA-002', days: 10, type: 'PENETRATING', gcs: 10 },
      { mrn: 'TRAUMA-003', days: 13, type: 'PENETRATING', gcs: 12 },
      { mrn: 'TRAUMA-004', days: 15, type: 'PENETRATING', gcs: 3 },
      { mrn: 'TRAUMA-005', days: 17, type: 'MOTOR_VEHICLE_ACCIDENT', gcs: 6 },
      { mrn: 'TRAUMA-006', days: 19, type: 'MOTOR_VEHICLE_ACCIDENT', gcs: 9 },
      { mrn: 'TRAUMA-007', days: 21, type: 'FALL', gcs: 7 },
      { mrn: 'TRAUMA-008', days: 23, type: 'MOTOR_VEHICLE_ACCIDENT', gcs: 11 },
      { mrn: 'TRAUMA-009', days: 25, type: 'BURN', gcs: 13 },
      { mrn: 'TRAUMA-010', days: 0, type: 'PENETRATING', gcs: 15 },
      { mrn: 'TRAUMA-011', days: 1, type: 'FALL', gcs: 11 },
      { mrn: 'TRAUMA-012', days: 0, type: 'MOTOR_VEHICLE_ACCIDENT', gcs: 14 },
      { mrn: 'TRAUMA-013', days: 2, type: 'BURN', gcs: 13 },
      { mrn: 'TRAUMA-014', days: 1, type: 'PENETRATING', gcs: 6 },
      { mrn: 'TRAUMA-015', days: 3, type: 'BLUNT', gcs: 7 },
      { mrn: 'TRAUMA-016', days: 0, type: 'MOTOR_VEHICLE_ACCIDENT', gcs: 15 },
      { mrn: 'TRAUMA-017', days: 2, type: 'OTHER', gcs: 12 },
      { mrn: 'TRAUMA-018', days: 1, type: 'MOTOR_VEHICLE_ACCIDENT', gcs: 14 },
      { mrn: 'TRAUMA-019', days: 3, type: 'PENETRATING', gcs: 10 },
      { mrn: 'TRAUMA-020', days: 0, type: 'MOTOR_VEHICLE_ACCIDENT', gcs: 11 }
    ];

    for (const p of traumaPatientsData) {
      // Check if patient exists, if so delete related cases and patient
      const existingPatient = await prisma.patient.findUnique({ where: { mrn: p.mrn } });
      if (existingPatient) {
        await prisma.traumaCase.deleteMany({ where: { patientId: existingPatient.id } });
        await prisma.patient.delete({ where: { mrn: p.mrn } });
      }
      const patient = await prisma.patient.create({
        data: {
          firstName: 'Trauma', lastName: `Patient-${p.mrn.split('-')[1]}`,
          mrn: p.mrn, nationalId: `3${p.mrn.replace('TRAUMA-', '').padStart(9, '0')}`,
          age: 20 + Math.floor(Math.random() * 30), gender: Math.random() > 0.5 ? 'MALE' : 'FEMALE',
          phoneNumber: `+96650${p.mrn.replace('TRAUMA-', '').padStart(7, '9')}`,
          address: `Street ${p.mrn.split('-')[1]}, Riyadh`,
          emergencyContact: `Emergency Contact ${p.mrn.split('-')[1]}`,
          emergencyPhone: `+96651${p.mrn.replace('TRAUMA-', '').padStart(7, '9')}`,
          medicalHistory: 'None',
          allergies: 'None',
          medications: 'None',
          createdById: user.id
        }
      });
      
      const incident = daysAgo(p.days);
      const responseTime = p.mrn === 'TRAUMA-005' || p.mrn === 'TRAUMA-014' ? 18 : 12;
      const arrival = addMinutes(incident, responseTime)!;
      const isCritical = p.gcs < 13 || p.type === 'PENETRATING';
      const isTransfer = ['TRAUMA-009', 'TRAUMA-011', 'TRAUMA-012', 'TRAUMA-013'].includes(p.mrn);
      
      await prisma.traumaCase.create({
        data: {
          patientId: patient.id, originHospitalId: traumaHospital.id,
          destinationHospitalId: isTransfer ? transferHospital.id : null,
          incidentDateTime: incident, arrivalDateTime: arrival,
          modeOfArrival: isTransfer ? 'TRANSFERRED_FROM_ANOTHER_HOSPITAL' : 'AMBULANCE_RED_CRESCENT',
          transferRequestDateTime: isTransfer ? addMinutes(arrival, 5) : null,
          transferArrivalDateTime: isTransfer ? addMinutes(arrival, 50) : null,
          transferDurationMinutes: isTransfer ? 45 : null,
          mechanismOfInjury: p.type as any,
          chiefComplaint: p.type === 'PENETRATING' ? 'Gunshot wound' : p.type === 'MOTOR_VEHICLE_ACCIDENT' ? 'MVA with multiple injuries' : p.type === 'FALL' ? 'Fall from height' : p.type === 'BURN' ? 'Burn injury' : 'Trauma',
          glasgowComaScale: p.gcs, systolicBloodPressure: p.gcs < 10 ? 90 : 110,
          respiratoryRate: p.gcs < 10 ? 25 : 20, additionalVitalSigns: `HR: ${80 + p.gcs}, Temp: 37.2`,
          vitalSigns: JSON.stringify({ temperature: 37.2, heartRate: 80 + p.gcs, bloodPressure: `${p.gcs < 10 ? 90 : 110}/70`, oxygenSaturation: 98 }),
          headAndNeckInjury: p.gcs < 10 ? '3 - Severe Injury' : p.gcs < 13 ? '2 - Moderate Injury' : '1 - No Injury',
          faceInjury: '1 - No Injury', chestInjury: p.type === 'MOTOR_VEHICLE_ACCIDENT' ? '2 - Moderate Injury' : '1 - No Injury',
          abdomenInjury: p.type === 'PENETRATING' ? '3 - Severe Injury' : '1 - No Injury',
          extremitiesInjury: p.type === 'FALL' ? '2 - Moderate Injury' : '1 - No Injury',
          externalInjury: p.type === 'BURN' ? '3 - Severe Injury' : '1 - No Injury',
          primarySurveyFindings: `GCS: ${p.gcs}, BP: ${p.gcs < 10 ? 90 : 110}/70, RR: ${p.gcs < 10 ? 25 : 20}`,
          additionalNotes: `Trauma case ${p.mrn} - ${p.type}`,
          edDisposition: p.mrn === 'TRAUMA-004' ? 'DEATH' : p.mrn === 'TRAUMA-018' ? 'DISCHARGE_AGAINST_MEDICAL_ADVICE' : isTransfer ? 'TRANSFER_TO_HIGHER_CENTER' : isCritical ? 'OPERATING_THEATRE' : p.gcs < 10 ? 'ICU_ADMISSION' : 'SURGICAL_WARD_ADMISSION',
          responseTimeMinutes: responseTime,
          criticalCase: isCritical,
          transferCase: isTransfer,
          createdById: user.id
        }
      });
      console.log(`  Created ${p.mrn}`);
    }

    console.log('\n✅ Comprehensive 62-Patient Test Data Seed Completed!');
    console.log('   - STEMI: 22 patients');
    console.log('   - Stroke: 20 patients');
    console.log('   - Trauma: 20 patients');

  } catch (error) {
    console.error('❌ Error seeding KPI test data:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Helper to create stroke case with proper KPI calc sim
async function createStrokeCase(
  patient: any, 
  hospital: any, 
  notif: boolean, 
  d2p: number, 
  d2ct: number, 
  d2n: number | null = null, 
  unit: boolean, 
  swallowRes: string, 
  lvo: boolean = false, 
  d2mt: number | null = null, 
  transfer: boolean = false, 
  destHospital: any = null, 
  transTime: number | null = null, 
  followUp: boolean = true, 
  disp: string = 'STROKE_UNIT', 
  srcaTime: number = 45,
  userId: string,
  extraData: any = {}
) {
  const caseData = generateStrokeData(patient, hospital, notif, d2p, d2ct, d2n, unit, swallowRes, lvo, d2mt, transfer, destHospital, transTime, followUp, disp, srcaTime, userId);
  await prisma.strokeCase.create({ data: { ...caseData, ...extraData } });
}

function generateStrokeData(
  patient: any, 
  hospital: any, 
  notif: boolean, 
  d2p: number, 
  d2ct: number, 
  d2n: number | null = null, 
  unit: boolean, 
  swallowRes: string, 
  lvo: boolean = false, 
  d2mt: number | null = null, 
  transfer: boolean = false, 
  destHospital: any = null, 
  transTime: number | null = null, 
  followUp: boolean = true, 
  disp: string = 'STROKE_UNIT', 
  srcaTime: number = 45,
  userId: string
) {
  const arrival = patient.arrivalDate;
  const data: any = {
    patientId: patient.id, originHospitalId: hospital.id, strokeType: 'ISCHEMIC',
    currentStatus: transfer ? 'FOLLOW_UP' : 'STROKEUNIT_ADMITTED',
    modeOfArrival: notif ? 'AMBULANCE_RED_CRESCENT' : 'PRIVATE_CAR',
    prehospitalNotificationBySrca: notif, srcaCallTime: addMinutes(arrival, -srcaTime),
    dateOfAdmission: arrival, timeOfTriage: addMinutes(arrival, 2),
    timeOfPhysicianAssessment: addMinutes(arrival, d2p),
    ctScanPerformed: d2ct !== null && d2ct > 0, timeOfCtScanStart: d2ct !== null && d2ct > 0 ? addMinutes(arrival, d2ct) : null,
    timeOfCtReportFinal: d2ct !== null && d2ct > 0 ? addMinutes(arrival, d2ct + 5) : null,
    disposition: disp, admittedToStrokeUnit: unit,
    swallowingScreeningPerformed: true, swallowingScreeningResult: swallowRes as any,
    timeOfSwallowingScreening: addMinutes(arrival, 180),
    followUpCallCompleted: followUp,
    doorToPhysicianMinutes: d2p, registrationToCtMinutes: d2ct !== null && d2ct > 0 ? d2ct : null, srcaCallToArrivalMinutes: srcaTime,
    swallowingScreeningWithin4Hours: true,
    metKpi1: d2p <= 15, metKpi2: notif, metKpi3: d2ct !== null && d2ct > 0 && d2ct <= 20, metKpi6: unit, metKpi9: srcaTime <= 60, metKpi10: true, metKpi11: followUp,
    createdById: userId
  };

  if (d2n !== null) {
    data.ivThrombolysisGiven = 'YES';
    data.candidateForIVThrombolysis = 'YES';
    data.ivThrombolysisAdministrationTime = addMinutes(arrival, d2n);
    data.doorToNeedleMinutes = d2n;
    data.registrationToThrombolysisMinutes = d2n;
    data.metKpi4 = d2n <= 60;
    data.metKpi5 = true;
  }
  
  if (lvo && d2mt !== null) {
    data.lvoDetected = true;
    data.candidateForMechanicalThrombectomy = 'YES';
    data.mechanicalThrombectomyPerformed = true;
    data.timeOfMechanicalThrombectomyPuncture = addMinutes(arrival, d2mt);
    data.registrationToMechanicalThrombectomyMinutes = d2mt;
    data.metKpi8 = d2mt <= 120;
  }

  if (transfer && transTime !== null && destHospital) {
    data.destinationHospitalId = destHospital.id;
    data.transferToAnotherHospital = true;
    data.facilityHasCt = true;
    data.timeOfTransferActivation = addMinutes(arrival, 60);
    data.timeOfTransferDeparture = addMinutes(arrival, 60 + transTime);
    data.transferActivationToDepartureMinutes = transTime;
    data.metKpi7 = transTime <= 40;
  }

  return data;
}

seedKPITestData()
  .then(() => {
    console.log('✨ Seed completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  });
