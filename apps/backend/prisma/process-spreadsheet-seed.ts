import { PrismaClient } from '@prisma/client';
import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

// Helper function to parse dates from various formats
function parseDate(dateValue: any): Date | null {
  if (!dateValue) return null;
  
  if (dateValue instanceof Date) {
    return dateValue;
  }
  
  if (typeof dateValue === 'number') {
    // Excel serial date (days since 1900-01-01)
    // Excel epoch is 1899-12-30 (day 0 in Excel)
    // Handle both regular dates and time-only values (0-1 range)
    if (dateValue < 1) {
      // This is a time-only value (fraction of a day), not a date
      return null;
    }
    
    // Excel date serial number
    // Excel incorrectly treats 1900 as a leap year, so we need to adjust
    const excelEpoch = new Date(1899, 11, 30);
    const jsDate = new Date(excelEpoch.getTime() + (dateValue - 1) * 86400000);
    
    // Validate the date is reasonable (between 1900 and 2100)
    if (jsDate.getFullYear() < 1900 || jsDate.getFullYear() > 2100) {
      return null;
    }
    
    return jsDate;
  }
  
  if (typeof dateValue === 'string') {
    // Try parsing various date formats
    const parsed = new Date(dateValue);
    if (!isNaN(parsed.getTime())) {
      return parsed;
    }
  }
  
  return null;
}

// Helper function to add minutes to a date
function addMinutes(date: Date | null, minutes: number): Date | null {
  if (!date) return null;
  return new Date(date.getTime() + minutes * 60000);
}

// Helper function to parse boolean values
function parseBoolean(value: any): boolean | null {
  if (value === null || value === undefined || value === '') return null;
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    const lower = value.toLowerCase().trim();
    return lower === 'true' || lower === 'yes' || lower === '1' || lower === 'y';
  }
  if (typeof value === 'number') return value !== 0;
  return null;
}

// Helper function to parse integer values
function parseInteger(value: any): number | null {
  if (value === null || value === undefined || value === '') return null;
  const parsed = parseInt(String(value), 10);
  return isNaN(parsed) ? null : parsed;
}

// Helper function to get or create hospital by name
async function getOrCreateHospital(hospitalName: string): Promise<string> {
  if (!hospitalName) {
    // Get first available hospital
    const hospitals = await prisma.hospital.findMany({ take: 1 });
    if (hospitals.length === 0) {
      throw new Error('No hospitals found. Please run the main seed first.');
    }
    return hospitals[0].id;
  }

  let hospital = await prisma.hospital.findFirst({
    where: {
      name: {
        contains: hospitalName,
        mode: 'insensitive',
      },
    },
  });

  if (!hospital) {
    // Create a new hospital if not found
    hospital = await prisma.hospital.create({
      data: {
        name: hospitalName,
        status: 'ACTIVE',
        traumaLevel: 'LEVEL_1',
      },
    });
  }

  return hospital.id;
}

// Helper function to get or create patient
async function getOrCreatePatient(row: any, userId: string): Promise<string> {
  const nationalId = String(row['National ID'] || row['nationalId'] || row['NationalID'] || '');
  const firstName = String(row['First Name'] || row['firstName'] || row['First Name'] || 'Unknown');
  const lastName = String(row['Last Name'] || row['lastName'] || row['Last Name'] || 'Unknown');
  const age = parseInteger(row['Age'] || row['age']);
  const gender = String(row['Gender'] || row['gender'] || 'MALE').toUpperCase();
  const phoneNumber = String(row['Phone'] || row['phone'] || row['Phone Number'] || '');
  const mrn = String(row['MRN'] || row['mrn'] || '');

  if (nationalId) {
    let patient = await prisma.patient.findFirst({
      where: { nationalId },
    });

    if (patient) {
      return patient.id;
    }
  }

  // Create new patient
  const patient = await prisma.patient.create({
    data: {
      firstName,
      lastName,
      nationalId: nationalId || `TEMP-${Date.now()}-${Math.random()}`,
      mrn: mrn || `MRN-${Date.now()}`,
      age: age || 50,
      gender: gender === 'MALE' || gender === 'FEMALE' ? gender : 'MALE',
      phoneNumber: phoneNumber || undefined,
      createdBy: { connect: { id: userId } },
    },
  });

  return patient.id;
}

// Helper function to parse DD-MONTH-YY date format or Excel serial date
function parseDateDDMonthYY(dateValue: any): Date | null {
  if (!dateValue) return null;
  
  // If it's a number, it's likely an Excel serial date
  if (typeof dateValue === 'number') {
    try {
      const serialDate = Math.floor(dateValue);
      
      // Validate serial date is in reasonable range (1 to ~100000 for years 1900-2173)
      if (serialDate < 1 || serialDate > 100000) {
        console.warn(`Excel serial date ${serialDate} out of reasonable range`);
        return null;
      }
      
      // Excel serial dates: 1 = 1900-01-01
      // Excel incorrectly treats 1900 as a leap year, so we adjust
      // The epoch is December 30, 1899
      // Excel date 1 = Jan 1, 1900 = Dec 30, 1899 + 2 days
      // So: date = Dec 30, 1899 + (serialDate - 1) days
      
      // Create epoch date explicitly
      const epochYear = 1899;
      const epochMonth = 11; // December (0-indexed)
      const epochDay = 30;
      
      // Calculate the date by adding days
      const baseDate = new Date(epochYear, epochMonth, epochDay);
      const daysToAdd = serialDate - 1;
      const resultDate = new Date(baseDate);
      resultDate.setDate(resultDate.getDate() + daysToAdd);
      
      // Validate the result is a valid date
      if (isNaN(resultDate.getTime())) {
        console.warn(`Invalid date created from Excel serial ${serialDate}`);
        return null;
      }
      
      // Validate reasonable date range (1900-2100)
      const year = resultDate.getFullYear();
      if (year >= 1900 && year <= 2100) {
        return resultDate;
      }
      
      console.warn(`Excel date conversion out of range: serial ${serialDate} -> year ${year}`);
      return null;
    } catch (e) {
      console.warn(`Error converting Excel date ${dateValue}:`, e);
      return null;
    }
  }
  
  const dateStr = String(dateValue);
  
  // Try to parse DD-MONTH-YY format (e.g., "01-JAN-23", "15-DEC-22")
  const monthMap: { [key: string]: number } = {
    'JAN': 0, 'FEB': 1, 'MAR': 2, 'APR': 3, 'MAY': 4, 'JUN': 5,
    'JUL': 6, 'AUG': 7, 'SEP': 8, 'OCT': 9, 'NOV': 10, 'DEC': 11
  };
  
  const match = dateStr.toUpperCase().match(/(\d{1,2})-([A-Z]{3})-(\d{2})/);
  if (match) {
    const day = parseInt(match[1], 10);
    const month = monthMap[match[2]];
    const year = 2000 + parseInt(match[3], 10); // Assume 2000s
    
    if (month !== undefined) {
      return new Date(year, month, day);
    }
  }
  
  // Fallback to standard date parsing
  return parseDate(dateValue);
}

// Process STEMI cases from spreadsheet
async function processStemiCases(worksheet: XLSX.WorkSheet, userId: string) {
  const data = XLSX.utils.sheet_to_json(worksheet);
  console.log(`📊 Processing ${data.length} STEMI cases from spreadsheet...`);

  const hospitals = await prisma.hospital.findMany();
  if (hospitals.length === 0) {
    throw new Error('No hospitals found. Please run the main seed first.');
  }

  for (let i = 0; i < data.length; i++) {
    const row: any = data[i];
    
    try {
      // Handle Patient ID - could be "ID" column
      const patientIdValue = String(
        row['ID'] || 
        row['Patient ID'] || 
        row['patientId'] || 
        row['PatientID'] || 
        row['Patient_Id'] || 
        ''
      );
      
      // Get or create patient
      let patientId: string;
      if (patientIdValue && patientIdValue !== '') {
        let patient = await prisma.patient.findFirst({
          where: {
            OR: [
              { nationalId: patientIdValue },
              { mrn: patientIdValue },
            ],
          },
        });

        if (!patient) {
          const firstName = String(row['First Name'] || row['firstName'] || 'Unknown');
          const lastName = String(row['Last Name'] || row['lastName'] || 'Unknown');
          // Handle "Age in years" column
          const age = parseInteger(row['Age in years'] || row['Age'] || row['age'] || row['Age in years']);
          const gender = String(row['Gender'] || row['gender'] || 'MALE').toUpperCase();
          
          patient = await prisma.patient.create({
            data: {
              firstName,
              lastName,
              nationalId: patientIdValue,
              mrn: patientIdValue,
              age: age || 50,
              gender: gender === 'MALE' || gender === 'FEMALE' ? gender : 'MALE',
              createdBy: { connect: { id: userId } },
            },
          });
        }
        patientId = patient.id;
      } else {
        patientId = await getOrCreatePatient(row, userId);
      }
      
      // Get facility name (origin hospital)
      const facilityName = String(
        row['Facility name'] || 
        row['Facility Name'] || 
        row['facilityName'] || 
        row['Facility'] ||
        row['Origin Hospital'] || 
        row['originHospital'] || 
        row['Origin'] || 
        ''
      );
      
      const originHospitalId = await getOrCreateHospital(facilityName || hospitals[0].name);
      
      // Check if this is a transfer case
      const referredFromHospital = String(
        row['Referred From Hospital'] || 
        row['Referred From'] || 
        row['referredFromHospital'] || 
        ''
      );
      const referredToHospital = String(
        row['Referred To Hospital'] || 
        row['Referred To'] || 
        row['referredToHospital'] || 
        ''
      );
      const isTransfer = referredFromHospital !== '' || referredToHospital !== '';
      
      // If transfer, the referred from hospital is the origin, referred to is destination
      let finalOriginHospitalId = originHospitalId;
      let destinationHospitalId: string | null = null;
      
      if (isTransfer) {
        if (referredFromHospital) {
          // For transfers, the "Referred From Hospital" is the origin
          finalOriginHospitalId = await getOrCreateHospital(referredFromHospital || hospitals[0].name);
        }
        if (referredToHospital) {
          // "Referred To Hospital" is the destination
          destinationHospitalId = await getOrCreateHospital(referredToHospital);
        } else if (referredFromHospital) {
          // If only "Referred From" is provided, current facility is destination
          destinationHospitalId = originHospitalId;
        }
      }

      // Parse Date of admission (DD-MONTH-YY format or Excel serial date)
      const dateOfAdmissionValue = row['Date of admission'] || 
        row['Date of Admission'] || 
        row['dateOfAdmission'] || 
        row['Date of admissionDD-MONTH-YY'] ||
        null;
      
      let dateOfAdmission = parseDateDDMonthYY(dateOfAdmissionValue);
      
      // Validate the date is reasonable before using it
      if (!dateOfAdmission || isNaN(dateOfAdmission.getTime())) {
        console.warn(`Invalid date for row ${i + 1}, using current date. Value: ${dateOfAdmissionValue}`);
        dateOfAdmission = new Date();
      } else {
        // Double-check the year is reasonable
        const year = dateOfAdmission.getFullYear();
        if (year < 1900 || year > 2100) {
          console.warn(`Date year ${year} out of range for row ${i + 1}, using current date. Value: ${dateOfAdmissionValue}`);
          dateOfAdmission = new Date();
        }
      }
      
      // Combine date with time values (hh:mm format)
      const triageTimeStr = String(row['Triage Time (Door In) (hh:mm)'] || row['Triage Time'] || row['triageTime'] || '');
      const triageTime = combineDateTime(dateOfAdmission, triageTimeStr);
      
      const firstEcgTimeStr = String(row['Time of first ECG (hh:mm)'] || row['Time of first ECG'] || row['firstEcgTime'] || '');
      const firstEcgTime = combineDateTime(dateOfAdmission, firstEcgTimeStr);
      
      const doorOutTimeStr = String(row['Door out time(hh:mm)'] || row['Door out time'] || row['doorOutTime'] || '');
      const doorOutTime = combineDateTime(dateOfAdmission, doorOutTimeStr);
      
      const thrombolyticAdminTimeStr = String(
        row['Time of Thrombolytic administration(hh:mm)'] || 
        row['Time of Thrombolytic administration'] || 
        row['thrombolyticAdminTime'] || 
        ''
      );
      const thrombolyticAdminTime = combineDateTime(dateOfAdmission, thrombolyticAdminTimeStr);
      
      const pciStartTimeStr = String(
        row['Time of Primary PCI began(hh:mm)'] || 
        row['Time of  1ry PCI began(hh:mm)'] || 
        row['Time of Primary PCI began'] || 
        row['Time of Primary PCI'] || 
        row['pciProcedureStartTime'] || 
        ''
      );
      const pciProcedureStartTime = combineDateTime(dateOfAdmission, pciStartTimeStr);
      const balloonInflationTime = pciProcedureStartTime; // Use PCI start as balloon inflation time

      // Parse mode of arrival
      const modeOfArrivalStr = String(
        row['Mode of arrival'] || 
        row['Mode of Arrival'] || 
        row['modeOfArrival'] || 
        'AMBULANCE_RED_CRESCENT'
      ).toUpperCase().replace(/\s+/g, '_');
      
      let modeOfArrival = 'AMBULANCE_RED_CRESCENT';
      if (modeOfArrivalStr.includes('AMBULANCE') || modeOfArrivalStr.includes('RED_CRESCENT') || modeOfArrivalStr.includes('EMS')) {
        modeOfArrival = 'AMBULANCE_RED_CRESCENT';
      } else if (modeOfArrivalStr.includes('PRIVATE') || modeOfArrivalStr.includes('CAR')) {
        modeOfArrival = 'PRIVATE_CAR';
      } else if (modeOfArrivalStr.includes('TRANSFER') || modeOfArrivalStr.includes('HOSPITAL') || isTransfer) {
        modeOfArrival = 'TRANSFERRED_FROM_ANOTHER_HOSPITAL';
      }

      // Parse thrombolytic given
      const thrombolyticGivenStr = String(
        row['Did the patient given (administered) thrombolytic medication?'] || 
        row['Thrombolytic Given'] || 
        row['thrombolyticGiven'] || 
        ''
      ).toUpperCase();
      const thrombolyticGiven = thrombolyticGivenStr.includes('YES') || 
                                thrombolyticGivenStr.includes('TRUE') || 
                                thrombolyticGivenStr === '1' ||
                                thrombolyticAdminTime !== null;

      // PCI location
      const pciLocation = String(
        row['PCI location'] || 
        row['PCI Location'] || 
        row['pciLocation'] || 
        ''
      );

      // Collect vital signs and symptoms
      const vitalSigns: string[] = [];
      const systolicBP = parseInteger(row['Systolic Blood Pressure'] || row['Systolic BP'] || row['systolicBloodPressure']);
      const diastolicBP = parseInteger(row['Diastolic Blood Pressure'] || row['Diastolic BP'] || row['diastolicBloodPressure']);
      const heartRate = parseInteger(row['Heart Rate'] || row['heartRate']);
      const gcs = parseInteger(row['Glasgow Coma Scale'] || row['GCS'] || row['glasgowComaScale']);
      const respiratoryRate = parseInteger(row['Respiratory Rate'] || row['RR'] || row['respiratoryRate']);
      const oxygenSaturation = parseInteger(row['Oxygen Saturation'] || row['O2 Sat'] || row['oxygenSaturation']);
      const bloodGlucose = parseInteger(row['Blood Glucose'] || row['bloodGlucose']);
      const painScore = parseInteger(row['Pain Score'] || row['painScore']);

      if (systolicBP) vitalSigns.push(`SBP: ${systolicBP} mmHg`);
      if (diastolicBP) vitalSigns.push(`DBP: ${diastolicBP} mmHg`);
      if (heartRate) vitalSigns.push(`HR: ${heartRate} bpm`);
      if (gcs) vitalSigns.push(`GCS: ${gcs}`);
      if (respiratoryRate) vitalSigns.push(`RR: ${respiratoryRate} /min`);
      if (oxygenSaturation) vitalSigns.push(`SpO2: ${oxygenSaturation}%`);
      if (bloodGlucose) vitalSigns.push(`Glucose: ${bloodGlucose} mg/dL`);
      if (painScore !== null) vitalSigns.push(`Pain Score: ${painScore}/10`);

      // Collect symptoms
      const symptoms: string[] = [];
      const chestPain = String(row['Chest Pain'] || row['chestPain'] || '').trim();
      const dyspnea = String(row['Dyspnea'] || row['dyspnea'] || '').trim();
      const extremities = String(row['Extremities'] || row['extremities'] || '').trim();
      const edema = String(row['Edema'] || row['edema'] || '').trim();

      if (chestPain) symptoms.push(`Chest Pain: ${chestPain}`);
      if (dyspnea) symptoms.push(`Dyspnea: ${dyspnea}`);
      if (extremities) symptoms.push(`Extremities: ${extremities}`);
      if (edema) symptoms.push(`Edema: ${edema}`);

      // Build presenting symptoms string
      const presentingSymptomsParts: string[] = [];
      if (symptoms.length > 0) {
        presentingSymptomsParts.push(`Symptoms: ${symptoms.join('; ')}`);
      }
      if (vitalSigns.length > 0) {
        presentingSymptomsParts.push(`Vital Signs: ${vitalSigns.join(', ')}`);
      }
      const presentingSymptoms = presentingSymptomsParts.length > 0 
        ? presentingSymptomsParts.join(' | ') 
        : null;

      // ED disposition and outcome
      const edDisposition = String(
        row['ED disposition'] || 
        row['ED Disposition'] || 
        row['edDisposition'] || 
        row['Disposition'] || 
        ''
      );
      
      const outcome = edDisposition || null;

      // Other clinical data
      const issScore = parseInteger(row['ISS Score'] || row['ISS'] || row['issScore']);
      const survivalPrediction = String(row['Survival Prediction'] || row['survivalPrediction'] || '').trim();
      const backgroundRisk = String(row['Background Risk'] || row['backgroundRisk'] || '').trim();
      const other = String(row['Other'] || row['other'] || '').trim();

      // Build complications/notes from additional data
      const additionalNotes: string[] = [];
      if (issScore !== null) additionalNotes.push(`ISS Score: ${issScore}`);
      if (survivalPrediction) additionalNotes.push(`Survival Prediction: ${survivalPrediction}`);
      if (backgroundRisk) additionalNotes.push(`Background Risk: ${backgroundRisk}`);
      if (other) additionalNotes.push(`Other: ${other}`);
      const complications = additionalNotes.length > 0 ? additionalNotes.join('; ') : null;

      // Calculate timing metrics
      const doorToEcgMinutes = firstEcgTime && triageTime
        ? Math.floor((firstEcgTime.getTime() - triageTime.getTime()) / (1000 * 60))
        : null;
      
      const doorToNeedleMinutes = thrombolyticAdminTime && triageTime
        ? Math.floor((thrombolyticAdminTime.getTime() - triageTime.getTime()) / (1000 * 60))
        : null;
      
      const doorToBalloonMinutes = balloonInflationTime && triageTime
        ? Math.floor((balloonInflationTime.getTime() - triageTime.getTime()) / (1000 * 60))
        : null;
      
      const doorInDoorOutMinutes = doorOutTime && triageTime
        ? Math.floor((doorOutTime.getTime() - triageTime.getTime()) / (1000 * 60))
        : null;

      // Determine treatment type
      let selectedTreatment: string | null = null;
      if (balloonInflationTime) {
        selectedTreatment = 'PRIMARY_PCI';
      } else if (thrombolyticGiven) {
        selectedTreatment = 'FIBRINOLYSIS';
      }

      // Create ticket if transfer case
      let ticketId = null;
      if (destinationHospitalId) {
        const ticket = await prisma.ticket.create({
          data: {
            ticketNumber: `STEMI-${Date.now()}-${i}`,
            patientId,
            originHospitalId: finalOriginHospitalId,
            destinationHospitalId,
            pathway: 'STEMI',
            priority: 'CRITICAL',
            emergencyType: 'STEMI',
            status: 'COMPLETED',
            createdById: userId,
          },
        });
        ticketId = ticket.id;
      }

      // Create STEMI case
      await prisma.stemiCase.create({
        data: {
          ticketId,
          patientId,
          originHospitalId: finalOriginHospitalId,
          destinationHospitalId,
          
          // Clinical Assessment
          heartScore: parseInteger(row['Heart Score'] || row['heartScore'] || row['HEART Score']),
          clinicalRiskLevel: backgroundRisk || null,
          presentingSymptoms,
          symptomOnset: null,
          symptomDuration: null,
          miType: 'STEMI',
          outcome,
          
          // Pathway Execution
          currentStatus: balloonInflationTime ? 'BALLOON_INFLATED' : thrombolyticGiven ? 'THROMBOLYSIS_COMPLETED' : 'STEMI_CONFIRMED',
          selectedTreatment,
          pathwayStarted: triageTime || dateOfAdmission,
          pathwayCompleted: balloonInflationTime || thrombolyticAdminTime || doorOutTime || dateOfAdmission,
          modeOfArrival,
          transferRequestDateTime: isTransfer ? triageTime : null,
          transferArrivalDateTime: isTransfer ? triageTime : null,
          rccActivated: false, // Not provided in spreadsheet
          rccUnit: null,
          caseType: isTransfer ? 'TRANSFER' : 'DIRECT',
          
          // Critical Timestamps
          triageTime: triageTime || dateOfAdmission,
          firstEcgTime,
          
          // ECG Results
          ecgResult: firstEcgTime ? 'STEMI_CONFIRMED' : null,
          ecgFindings: null,
          
          // Interventions
          eligibleForPrimaryPci: balloonInflationTime !== null,
          pciLocation,
          doorOutTime,
          balloonInflationTime,
          thrombolyticGiven,
          thrombolyticAdminTime,
          pciProcedureStartTime,
          
          // Outcomes
          successful: true, // Assume successful if data exists
          complications,
          dischargeDate: null,
          dischargeStatus: edDisposition || null,
          thirtyDayReadmission: false,
          followUpCallCompleted: false,
          followUpCallDate: null,
          
          // Quality Metrics (calculated)
          doorToEcgMinutes,
          rccActivationToDoorOutMinutes: null,
          doorInDoorOutMinutes,
          doorToNeedleMinutes,
          doorToBalloonMinutes,
          
          // KPI Flags (calculated based on thresholds)
          metKpi1: doorToEcgMinutes !== null && doorToEcgMinutes <= 10,
          metKpi2: doorToBalloonMinutes !== null && (isTransfer ? doorToBalloonMinutes <= 120 : doorToBalloonMinutes <= 90),
          metKpi2Direct: !isTransfer && doorToBalloonMinutes !== null && doorToBalloonMinutes <= 90,
          metKpi2Transfer: isTransfer && doorToBalloonMinutes !== null && doorToBalloonMinutes <= 120,
          metKpi3: doorToNeedleMinutes !== null && doorToNeedleMinutes <= 30,
          metKpi4: null, // RCC activation not in spreadsheet
          metKpi5: doorInDoorOutMinutes !== null && doorInDoorOutMinutes <= 30,
          metKpi6: null, // PCI success not determinable from spreadsheet
          metKpi11: false,
          
          createdById: userId,
        },
      });

      if ((i + 1) % 10 === 0) {
        console.log(`  ✅ Processed ${i + 1}/${data.length} STEMI cases...`);
      }
    } catch (error) {
      console.error(`  ❌ Error processing row ${i + 1}:`, error);
      console.error(`     Row data:`, JSON.stringify(row, null, 2));
    }
  }

  console.log(`✅ Successfully processed ${data.length} STEMI cases!`);
}

// Helper function to combine date and time
function combineDateTime(dateValue: any, timeValue: any): Date | null {
  const date = parseDate(dateValue);
  if (!date) return null;
  
  if (timeValue) {
    const timeStr = String(timeValue);
    // Try to parse time in various formats
    const timeMatch = timeStr.match(/(\d{1,2}):(\d{2})(?::(\d{2}))?/);
    if (timeMatch) {
      const hours = parseInt(timeMatch[1], 10);
      const minutes = parseInt(timeMatch[2], 10);
      const seconds = timeMatch[3] ? parseInt(timeMatch[3], 10) : 0;
      date.setHours(hours, minutes, seconds, 0);
    }
  }
  
  return date;
}

// Process Stroke cases from spreadsheet
async function processStrokeCases(worksheet: XLSX.WorkSheet, userId: string) {
  const data = XLSX.utils.sheet_to_json(worksheet);
  console.log(`📊 Processing ${data.length} Stroke cases from spreadsheet...`);

  const hospitals = await prisma.hospital.findMany();
  if (hospitals.length === 0) {
    throw new Error('No hospitals found. Please run the main seed first.');
  }

  for (let i = 0; i < data.length; i++) {
    const row: any = data[i];
    
    try {
      // Handle Patient ID - could be in various formats
      const patientIdValue = String(row['Patient ID'] || row['patientId'] || row['PatientID'] || row['Patient_Id'] || '');
      
      // Get or create patient - handle Patient ID column
      let patientId: string;
      if (patientIdValue && patientIdValue !== '') {
        // Try to find by national ID or MRN
        let patient = await prisma.patient.findFirst({
          where: {
            OR: [
              { nationalId: patientIdValue },
              { mrn: patientIdValue },
            ],
          },
        });

        if (!patient) {
          // Create patient with data from spreadsheet
          const firstName = String(row['First Name'] || row['firstName'] || 'Unknown');
          const lastName = String(row['Last Name'] || row['lastName'] || 'Unknown');
          const age = parseInteger(row['Age'] || row['age']);
          const gender = String(row['Gender'] || row['gender'] || 'MALE').toUpperCase();
          
          patient = await prisma.patient.create({
            data: {
              firstName,
              lastName,
              nationalId: patientIdValue,
              mrn: patientIdValue,
              age: age || 50,
              gender: gender === 'MALE' || gender === 'FEMALE' ? gender : 'MALE',
              createdBy: { connect: { id: userId } },
            },
          });
        }
        patientId = patient.id;
      } else {
        // Fallback to original getOrCreatePatient
        patientId = await getOrCreatePatient(row, userId);
      }
      
      // Get facility name (origin hospital)
      const facilityName = String(
        row['Facility name'] || 
        row['Facility Name'] || 
        row['facilityName'] || 
        row['Facility'] ||
        row['Origin Hospital'] || 
        row['originHospital'] || 
        row['Origin'] || 
        ''
      );
      
      const originHospitalId = await getOrCreateHospital(facilityName || hospitals[0].name);
      
      // Check if this is a transfer case
      const transferReason = String(
        row['If transferred from another hospital, what is the reason for referral?'] || 
        row['Transfer Reason'] || 
        row['transferReason'] || 
        ''
      );
      const isTransfer = transferReason !== '';
      const destinationHospitalId = isTransfer ? null : null; // Could be enhanced to parse destination

      // Parse dates - handle Date of admission
      const dateOfAdmission = parseDate(
        row['Date of admission'] || 
        row['Date of Admission'] || 
        row['dateOfAdmission'] || 
        row['Arrival Time'] || 
        row['arrivalTime'] || 
        row['ArrivalDateTime']
      ) || new Date();
      
      // Combine Date of Onset and Time of Onset
      const dateOfOnset = row['Date of Onset'] || row['Date of onset'] || row['dateOfOnset'];
      const timeOfOnset = row['Time of Onset'] || row['Time of onset'] || row['timeOfOnset'];
      const timeOfSymptomOnset = combineDateTime(dateOfOnset, timeOfOnset) || 
                                  parseDate(row['Symptom Onset'] || row['timeOfSymptomOnset']);
      
      const timeOfTriage = parseDate(
        row['Triage Time'] || 
        row['triageTime'] || 
        row['TriageTime'] ||
        row['Time of Triage']
      );
      
      const timeOfPhysicianAssessment = parseDate(
        row['Time of Physician assessment'] || 
        row['Time of Physician Assessment'] || 
        row['timeOfPhysicianAssessment'] ||
        row['Physician Assessment Time']
      );
      
      const timeOfCtScanStart = parseDate(
        row['Time of Non contrast CT brain performance'] || 
        row['Time of Non contrast CT brain performance'] || 
        row['timeOfCtScanStart'] ||
        row['CT Scan Time'] ||
        row['CT Time']
      );

      // Parse stroke type
      const strokeTypeStr = String(
        row['Type of Stroke'] || 
        row['typeOfStroke'] || 
        row['Stroke Type'] || 
        row['strokeType'] || 
        'ISCHEMIC'
      ).toUpperCase();
      
      let strokeType: any = 'ISCHEMIC';
      if (strokeTypeStr.includes('HEMORRHAGIC') || strokeTypeStr.includes('HEMORRHAGE')) {
        strokeType = 'HEMORRHAGIC';
      } else if (strokeTypeStr.includes('ISCHEMIC') || strokeTypeStr.includes('ISCHAEMIC')) {
        strokeType = 'ISCHEMIC';
      } else if (strokeTypeStr.includes('TIA')) {
        strokeType = 'TIA';
      }

      // Parse mode of arrival
      const modeOfArrivalStr = String(
        row['Mode of arrival'] || 
        row['Mode of Arrival'] || 
        row['modeOfArrival'] || 
        'AMBULANCE_RED_CRESCENT'
      ).toUpperCase().replace(/\s+/g, '_');
      
      let modeOfArrival: any = 'AMBULANCE_RED_CRESCENT';
      if (modeOfArrivalStr.includes('AMBULANCE') || modeOfArrivalStr.includes('RED_CRESCENT') || modeOfArrivalStr.includes('EMS')) {
        modeOfArrival = 'AMBULANCE_RED_CRESCENT';
      } else if (modeOfArrivalStr.includes('PRIVATE') || modeOfArrivalStr.includes('CAR')) {
        modeOfArrival = 'PRIVATE_CAR';
      } else if (modeOfArrivalStr.includes('TRANSFER') || modeOfArrivalStr.includes('HOSPITAL')) {
        modeOfArrival = 'TRANSFERRED_FROM_ANOTHER_HOSPITAL';
      }

      // Swallowing screening
      const swallowingScreeningPerformed = parseBoolean(
        row['Swallowing Screening Performed?'] || 
        row['Swallowing Screening Performed'] || 
        row['swallowingScreeningPerformed']
      );
      
      const timeOfSwallowingScreening = parseDate(
        row['Time of Swallowing Screening (mm/dd/yyyy hh:mm)'] || 
        row['Time of Swallowing Screening'] || 
        row['timeOfSwallowingScreening']
      );
      
      const swallowingScreeningResultStr = String(
        row['Swallowing Screening Result'] || 
        row['swallowingScreeningResult'] || 
        ''
      ).toUpperCase();
      
      let swallowingScreeningResult: any = null;
      if (swallowingScreeningResultStr.includes('PASS') || swallowingScreeningResultStr.includes('NORMAL')) {
        swallowingScreeningResult = 'PASS';
      } else if (swallowingScreeningResultStr.includes('FAIL') || swallowingScreeningResultStr.includes('ABNORMAL')) {
        swallowingScreeningResult = 'FAIL';
      } else if (swallowingScreeningResultStr.includes('INCONCLUSIVE')) {
        swallowingScreeningResult = 'INCONCLUSIVE';
      }

      // IV Thrombolysis
      const candidateForIVThrombolysisStr = String(
        row['Candidate for IV thrombolysis?'] || 
        row['Candidate for IV thrombolysis'] || 
        row['candidateForIVThrombolysis'] || 
        ''
      ).toUpperCase();
      
      let candidateForIVThrombolysis: any = null;
      if (candidateForIVThrombolysisStr.includes('YES') || candidateForIVThrombolysisStr.includes('TRUE')) {
        candidateForIVThrombolysis = 'YES';
      } else if (candidateForIVThrombolysisStr.includes('NO') || candidateForIVThrombolysisStr.includes('FALSE')) {
        candidateForIVThrombolysis = 'NO';
      }
      
      const reasonForNotAdministeringIV = String(
        row['If no, reason for not giving IV thrombolysis?'] || 
        row['reasonForNotAdministeringIV'] || 
        row['Reason for not giving IV thrombolysis'] || 
        ''
      );
      
      const thrombolysisOrderTime = parseDate(
        row['Time of ordering IV thrombolysis'] || 
        row['thrombolysisOrderTime'] || 
        row['Thrombolysis Order Time']
      );
      
      const ivThrombolysisAdministrationTime = parseDate(
        row['Time of administering IV thrombolysis'] || 
        row['Time of administering IV thrombolysis'] || 
        row['ivThrombolysisAdministrationTime'] ||
        row['IV Thrombolysis Admin Time']
      );
      
      const ivThrombolysisDelayReason = String(
        row['If IV thrombolysis is delayed, provide medical reason & justification'] || 
        row['IV Thrombolysis Delay Reason'] || 
        ''
      );

      // Mechanical Thrombectomy
      const candidateForMechanicalThrombectomyStr = String(
        row['Candidate for Mechanical thrombectomy (MT)?'] || 
        row['Candidate for Mechanical thrombectomy (MT)'] || 
        row['candidateForMechanicalThrombectomy'] || 
        ''
      ).toUpperCase();
      
      let candidateForMechanicalThrombectomy: any = null;
      if (candidateForMechanicalThrombectomyStr.includes('YES') || candidateForMechanicalThrombectomyStr.includes('TRUE')) {
        candidateForMechanicalThrombectomy = 'YES';
      } else if (candidateForMechanicalThrombectomyStr.includes('NO') || candidateForMechanicalThrombectomyStr.includes('FALSE')) {
        candidateForMechanicalThrombectomy = 'NO';
      }
      
      const timeOfMechanicalThrombectomyPuncture = parseDate(
        row['Time of MT'] || 
        row['Time of MT'] || 
        row['timeOfMechanicalThrombectomyPuncture'] ||
        row['Mechanical Thrombectomy Time'] ||
        row['MT Time']
      );
      
      const mtDelayReason = String(
        row['If Mechanical thrombectomy (MT) is delayed, provide medical reason & justification'] || 
        row['MT Delay Reason'] || 
        ''
      );
      
      const mechanicalThrombectomyPerformed = timeOfMechanicalThrombectomyPuncture !== null;

      // EMS advance notification
      const prehospitalNotificationBySrca = parseBoolean(
        row['EMS advance notification received (if arrival was via Red Crescent/Oman EMS)'] || 
        row['EMS advance notification received'] || 
        row['prehospitalNotificationBySrca'] ||
        row['EMS Notification']
      );

      // Disposition - map to StrokeDisposition enum
      const dispositionStr = String(
        row['Disposition?'] || 
        row['Disposition'] || 
        row['disposition'] || 
        ''
      ).trim();
      
      let disposition: any = null;
      if (dispositionStr) {
        const dispUpper = dispositionStr.toUpperCase();
        
        // Map to valid StrokeDisposition enum values
        if (dispUpper.includes('STROKE_UNIT') || dispUpper.includes('STROKE UNIT')) {
          disposition = 'STROKE_UNIT';
        } else if (dispUpper.includes('ICU') || dispUpper.includes('INTENSIVE')) {
          disposition = 'ICU';
        } else if (dispUpper.includes('WARD') || dispUpper.includes('INPATIENT')) {
          disposition = 'INPATIENT_WARD';
        } else if (dispUpper.includes('HOME') && !dispUpper.includes('NURSING')) {
          disposition = dispUpper.includes('DISCHARGE') ? 'DISCHARGED_HOME' : 'HOME';
        } else if (dispUpper.includes('REHABILITATION') || dispUpper.includes('REHAB')) {
          disposition = 'REHABILITATION';
        } else if (dispUpper.includes('NURSING_HOME') || dispUpper.includes('NURSING HOME')) {
          disposition = 'NURSING_HOME';
        } else if (dispUpper.includes('TRANSFER')) {
          disposition = 'TRANSFER_TO_ANOTHER_HOSPITAL';
        } else if (dispUpper.includes('DECEASED') || dispUpper.includes('DIED') || dispUpper.includes('DEATH')) {
          disposition = dispUpper.includes('BEFORE_ADMISSION') ? 'DIED_BEFORE_ADMISSION' : 'DECEASED';
        } else if (dispUpper.includes('AGAINST_MEDICAL') || dispUpper.includes('DAMA')) {
          disposition = 'DAMA';
        } else if (dispUpper.includes('ED_WAITING') || dispUpper.includes('WAITING')) {
          disposition = 'IN_ED_WAITING_FOR_ADMISSION';
        }
        
        // Try exact match with enum values
        const enumValues = [
          'HOME', 'REHABILITATION', 'NURSING_HOME', 'TRANSFER_TO_ANOTHER_HOSPITAL',
          'DECEASED', 'AGAINST_MEDICAL_ADVICE', 'STROKE_UNIT', 'ICU', 'INPATIENT_WARD',
          'DISCHARGED_HOME', 'DIED_BEFORE_ADMISSION', 'DAMA', 'IN_ED_WAITING_FOR_ADMISSION'
        ];
        if (enumValues.includes(dispUpper.replace(/\s+/g, '_'))) {
          disposition = dispUpper.replace(/\s+/g, '_');
        }
      }

      // Calculate timing metrics
      const doorToPhysicianMinutes = timeOfPhysicianAssessment && dateOfAdmission
        ? Math.floor((timeOfPhysicianAssessment.getTime() - dateOfAdmission.getTime()) / (1000 * 60))
        : null;
      
      const registrationToCtMinutes = timeOfCtScanStart && dateOfAdmission
        ? Math.floor((timeOfCtScanStart.getTime() - dateOfAdmission.getTime()) / (1000 * 60))
        : null;
      
      const registrationToThrombolysisMinutes = ivThrombolysisAdministrationTime && dateOfAdmission
        ? Math.floor((ivThrombolysisAdministrationTime.getTime() - dateOfAdmission.getTime()) / (1000 * 60))
        : null;
      
      const registrationToMechanicalThrombectomyMinutes = timeOfMechanicalThrombectomyPuncture && dateOfAdmission
        ? Math.floor((timeOfMechanicalThrombectomyPuncture.getTime() - dateOfAdmission.getTime()) / (1000 * 60))
        : null;
      
      const swallowingScreeningWithin4Hours = timeOfSwallowingScreening && dateOfAdmission
        ? Math.floor((timeOfSwallowingScreening.getTime() - dateOfAdmission.getTime()) / (1000 * 60)) <= 240
        : null;

      // Create stroke case
      await prisma.strokeCase.create({
        data: {
          patientId,
          originHospitalId,
          destinationHospitalId,
          
          strokeType,
          strokeSubtype: null,
          strokeSeverity: null,
          
          // Clinical Assessments (if available)
          nihssBaseline: parseInteger(row['NIHSS Baseline'] || row['nihssBaseline'] || row['NIHSS']),
          nihss24hr: parseInteger(row['NIHSS 24hr'] || row['nihss24hr']),
          nihssDischarge: parseInteger(row['NIHSS Discharge'] || row['nihssDischarge']),
          mrsBaseline: parseInteger(row['MRS Baseline'] || row['mrsBaseline']),
          mrs90day: parseInteger(row['MRS 90 Day'] || row['mrs90day']),
          barthelBaseline: parseInteger(row['Barthel Baseline'] || row['barthelBaseline']),
          barthelDischarge: parseInteger(row['Barthel Discharge'] || row['barthelDischarge']),
          aspectsScore: parseInteger(row['ASPECTS Score'] || row['aspectsScore']),
          gcsBaseline: parseInteger(row['GCS Baseline'] || row['gcsBaseline']),
          chiefComplaint: String(row['Chief Complaint'] || row['chiefComplaint'] || ''),
          
          // Patient Arrival & Timing
          modeOfArrival,
          transferRequestDateTime: isTransfer ? dateOfAdmission : null,
          transferArrivalDateTime: null,
          srcaCallTime: null,
          timeOfSymptomOnset,
          lastKnownNormal: timeOfSymptomOnset, // Use symptom onset as LKN if not provided
          dateOfAdmission,
          timeOfTriage,
          timeOfPhysicianAssessment,
          
          // Clinical Assessment & Diagnosis
          strokeTypeDetailed: null,
          swallowingScreeningPerformed,
          timeOfSwallowingScreening,
          swallowingScreeningResult,
          ctScanPerformed: timeOfCtScanStart !== null,
          timeOfCtScanStart,
          timeOfCtReportFinal: timeOfCtScanStart ? addMinutes(timeOfCtScanStart, 20) : null, // Estimate
          ctFindings: null,
          lvoDetected: null,
          candidateForIVThrombolysis,
          thrombolysisOrderTime,
          ivThrombolysisAdministrationTime,
          ivThrombolysisGiven: ivThrombolysisAdministrationTime ? 'YES' : candidateForIVThrombolysis === 'NO' ? 'NO' : null,
          reasonForNotAdministeringIV: reasonForNotAdministeringIV || null,
          candidateForMechanicalThrombectomy,
          timeOfMechanicalThrombectomyPuncture,
          mechanicalThrombectomyPerformed,
          timeOfThrombectomyComplete: timeOfMechanicalThrombectomyPuncture ? addMinutes(timeOfMechanicalThrombectomyPuncture, 60) : null, // Estimate
          
          // Treatment Details
          currentStatus: 'DISCHARGED',
          selectedTreatment: mechanicalThrombectomyPerformed ? 'MECHANICAL_THROMBECTOMY' : 
                            ivThrombolysisAdministrationTime ? 'IV_THROMBOLYSIS' : null,
          eligibleForThrombolysis: candidateForIVThrombolysis === 'YES',
          thrombolysisContraindications: reasonForNotAdministeringIV || null,
          eligibleForThrombectomy: candidateForMechanicalThrombectomy === 'YES',
          thrombectomyContraindications: mtDelayReason || null,
          
          // Pathway Timings
          pathwayStarted: dateOfAdmission,
          pathwayCompleted: timeOfMechanicalThrombectomyPuncture || ivThrombolysisAdministrationTime || dateOfAdmission,
          strokeUnitAdmissionTime: disposition === 'STROKE_UNIT' ? dateOfAdmission : null,
          
          // Key Performance Timings
          doorToCtScanMinutes: registrationToCtMinutes,
          doorToNeedleMinutes: registrationToThrombolysisMinutes,
          doorToMechanicalThrombectomyMinutes: registrationToMechanicalThrombectomyMinutes,
          symptomNeedleMinutes: timeOfSymptomOnset && ivThrombolysisAdministrationTime
            ? Math.floor((ivThrombolysisAdministrationTime.getTime() - timeOfSymptomOnset.getTime()) / (1000 * 60))
            : null,
          symptomToMechanicalThrombectomyMinutes: timeOfSymptomOnset && timeOfMechanicalThrombectomyPuncture
            ? Math.floor((timeOfMechanicalThrombectomyPuncture.getTime() - timeOfSymptomOnset.getTime()) / (1000 * 60))
            : null,
          imagingToNeedleMinutes: timeOfCtScanStart && ivThrombolysisAdministrationTime
            ? Math.floor((ivThrombolysisAdministrationTime.getTime() - timeOfCtScanStart.getTime()) / (1000 * 60))
            : null,
          imagingToMechanicalThrombectomyMinutes: timeOfCtScanStart && timeOfMechanicalThrombectomyPuncture
            ? Math.floor((timeOfMechanicalThrombectomyPuncture.getTime() - timeOfCtScanStart.getTime()) / (1000 * 60))
            : null,
          
          // Clinical Assessments Timeline
          dysphagiaScreeningMinutes: timeOfSwallowingScreening && dateOfAdmission
            ? Math.floor((timeOfSwallowingScreening.getTime() - dateOfAdmission.getTime()) / (1000 * 60))
            : null,
          
          // Disposition & Transfer Decisions
          facilityHasCt: timeOfCtScanStart !== null,
          transferToAnotherHospital: isTransfer,
          prehospitalNotificationBySrca,
          disposition,
          
          // KPI Timing Calculations
          doorToPhysicianMinutes,
          doorToCtReportMinutes: registrationToCtMinutes ? registrationToCtMinutes + 20 : null, // Estimate
          doorToThrombolysisOrderMinutes: thrombolysisOrderTime && dateOfAdmission
            ? Math.floor((thrombolysisOrderTime.getTime() - dateOfAdmission.getTime()) / (1000 * 60))
            : null,
          registrationToCtMinutes,
          registrationToThrombolysisMinutes,
          registrationToMechanicalThrombectomyMinutes,
          swallowingScreeningWithin4Hours,
          
          createdById: userId,
        },
      });

      if ((i + 1) % 10 === 0) {
        console.log(`  ✅ Processed ${i + 1}/${data.length} Stroke cases...`);
      }
    } catch (error) {
      console.error(`  ❌ Error processing row ${i + 1}:`, error);
      console.error(`     Row data:`, JSON.stringify(row, null, 2));
    }
  }

  console.log(`✅ Successfully processed ${data.length} Stroke cases!`);
}

// Process Trauma cases from spreadsheet
async function processTraumaCases(worksheet: XLSX.WorkSheet, userId: string) {
  const data = XLSX.utils.sheet_to_json(worksheet);
  console.log(`📊 Processing ${data.length} Trauma cases from spreadsheet...`);

  const hospitals = await prisma.hospital.findMany();
  if (hospitals.length === 0) {
    throw new Error('No hospitals found. Please run the main seed first.');
  }

  for (let i = 0; i < data.length; i++) {
    const row: any = data[i];
    
    try {
      const patientId = await getOrCreatePatient(row, userId);
      
      const originHospitalName = String(row['Origin Hospital'] || row['originHospital'] || row['Origin'] || '');
      const destinationHospitalName = String(row['Destination Hospital'] || row['destinationHospital'] || row['Destination'] || '');
      
      const originHospitalId = await getOrCreateHospital(originHospitalName || hospitals[0].name);
      const destinationHospitalId = destinationHospitalName 
        ? await getOrCreateHospital(destinationHospitalName)
        : null;

      const arrivalDateTime = parseDate(row['Arrival Time'] || row['arrivalDateTime'] || row['ArrivalDateTime']) || new Date();
      const incidentDateTime = parseDate(row['Incident Time'] || row['incidentDateTime'] || row['IncidentDateTime']);
      const transferRequestDateTime = parseDate(row['Transfer Request Time'] || row['transferRequestDateTime']);
      const transferArrivalDateTime = parseDate(row['Transfer Arrival Time'] || row['transferArrivalDateTime']);

      let ticketId = null;
      if (destinationHospitalId) {
        const ticket = await prisma.ticket.create({
          data: {
            ticketNumber: `TRAUMA-${Date.now()}-${i}`,
            patientId,
            originHospitalId,
            destinationHospitalId,
            pathway: 'TRAUMA',
            priority: 'CRITICAL',
            emergencyType: 'TRAUMA',
            status: 'COMPLETED',
            createdById: userId,
          },
        });
        ticketId = ticket.id;
      }

      await prisma.traumaCase.create({
        data: {
          ticketId,
          patientId,
          originHospitalId,
          destinationHospitalId,
          arrivalDateTime,
          incidentDateTime,
          modeOfArrival: String(row['Mode of Arrival'] || row['modeOfArrival'] || 'AMBULANCE_RED_CRESCENT') as any,
          transferRequestDateTime,
          transferArrivalDateTime,
          transferDurationMinutes: parseInteger(row['Transfer Duration (min)'] || row['transferDurationMinutes']),
          chiefComplaint: String(row['Chief Complaint'] || row['chiefComplaint'] || ''),
          mechanismOfInjury: String(row['Mechanism of Injury'] || row['mechanismOfInjury'] || 'BLUNT') as any,
          vitalSigns: String(row['Vital Signs'] || row['vitalSigns'] || ''),
          glasgowComaScale: parseInteger(row['GCS'] || row['glasgowComaScale'] || row['Glasgow Coma Scale']),
          systolicBloodPressure: parseInteger(row['SBP'] || row['systolicBloodPressure'] || row['Systolic BP']),
          respiratoryRate: parseInteger(row['RR'] || row['respiratoryRate'] || row['Respiratory Rate']),
          additionalVitalSigns: String(row['Additional Vital Signs'] || row['additionalVitalSigns'] || ''),
          primarySurveyFindings: String(row['Primary Survey Findings'] || row['primarySurveyFindings'] || ''),
          edDisposition: (() => {
            const disp = String(row['ED Disposition'] || row['edDisposition'] || '').trim();
            if (!disp) return null;
            
            const dispUpper = disp.toUpperCase().replace(/\s+/g, '_');
            // Map common values to enum
            if (dispUpper.includes('ICU')) return 'ICU_ADMISSION' as any;
            if (dispUpper.includes('SURGICAL') || dispUpper.includes('SURGERY')) return 'SURGICAL_WARD_ADMISSION' as any;
            if (dispUpper.includes('MEDICAL') || dispUpper.includes('WARD')) return 'MEDICAL_WARD_ADMISSION' as any;
            if (dispUpper.includes('DISCHARGE') && dispUpper.includes('AGAINST')) return 'DISCHARGE_AGAINST_MEDICAL_ADVICE' as any;
            if (dispUpper.includes('DISCHARGE')) return 'DISCHARGE' as any;
            if (dispUpper.includes('OPERATING') || dispUpper.includes('THEATRE') || dispUpper.includes('OR')) return 'OPERATING_THEATRE' as any;
            if (dispUpper.includes('TRANSFER')) return 'TRANSFER_TO_HIGHER_CENTER' as any;
            if (dispUpper.includes('DEATH') || dispUpper.includes('DIED')) return 'DEATH' as any;
            
            // Try to match enum value directly
            const enumValues = ['ICU_ADMISSION', 'SURGICAL_WARD_ADMISSION', 'MEDICAL_WARD_ADMISSION', 'DISCHARGE', 'OPERATING_THEATRE', 'TRANSFER_TO_HIGHER_CENTER', 'DEATH', 'DISCHARGE_AGAINST_MEDICAL_ADVICE', 'OTHER'];
            if (enumValues.includes(dispUpper)) return dispUpper as any;
            
            return 'OTHER' as any;
          })(),
          additionalNotes: String(row['Additional Notes'] || row['additionalNotes'] || ''),
          disposition: String(row['Disposition'] || row['disposition'] || ''),
          responseTimeMinutes: parseInteger(row['Response Time (min)'] || row['responseTimeMinutes']),
          criticalCase: parseBoolean(row['Critical Case'] || row['criticalCase']) ?? false,
          transferCase: parseBoolean(row['Transfer Case'] || row['transferCase']) ?? false,
          headAndNeckInjury: String(row['Head and Neck Injury'] || row['headAndNeckInjury'] || ''),
          faceInjury: String(row['Face Injury'] || row['faceInjury'] || ''),
          chestInjury: String(row['Chest Injury'] || row['chestInjury'] || ''),
          abdomenInjury: String(row['Abdomen Injury'] || row['abdomenInjury'] || ''),
          extremitiesInjury: String(row['Extremities Injury'] || row['extremitiesInjury'] || ''),
          externalInjury: String(row['External Injury'] || row['externalInjury'] || ''),
          createdById: userId,
        },
      });

      if ((i + 1) % 10 === 0) {
        console.log(`  ✅ Processed ${i + 1}/${data.length} Trauma cases...`);
      }
    } catch (error) {
      console.error(`  ❌ Error processing row ${i + 1}:`, error);
    }
  }

  console.log(`✅ Successfully processed ${data.length} Trauma cases!`);
}

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log(`
📋 Usage: ts-node prisma/process-spreadsheet-seed.ts <file-path> [case-type]

Arguments:
  file-path   Path to the Excel/CSV file (relative to project root or absolute path)
  case-type   Optional: 'stemi', 'stroke', 'trauma', or 'all' (auto-detects all sheets if 'all' or not provided)

Examples:
  ts-node prisma/process-spreadsheet-seed.ts data/urgent-care.xlsx all
  ts-node prisma/process-spreadsheet-seed.ts data/stemi-cases.xlsx stemi
  ts-node prisma/process-spreadsheet-seed.ts data/stroke-data.xlsx stroke
  ts-node prisma/process-spreadsheet-seed.ts data/trauma-cases.csv trauma

📁 Place your spreadsheet files in: apps/backend/prisma/data/

Note: If the file has multiple sheets (tabs), use 'all' to process all sheets automatically.
    `);
    process.exit(1);
  }

  const filePath = args[0];
  const caseType = args[1]?.toLowerCase();

  // Resolve file path
  let fullPath: string;
  if (path.isAbsolute(filePath)) {
    fullPath = filePath;
  } else {
    fullPath = path.resolve(process.cwd(), filePath);
  }

  if (!fs.existsSync(fullPath)) {
    console.error(`❌ File not found: ${fullPath}`);
    process.exit(1);
  }

  console.log(`📂 Reading file: ${fullPath}`);

  // Read the spreadsheet
  const workbook = XLSX.readFile(fullPath);
  const sheetNames = workbook.SheetNames;

  console.log(`📄 Found ${sheetNames.length} sheet(s): ${sheetNames.join(', ')}`);

  // Get a user for createdById
  const users = await prisma.user.findMany({ take: 1 });
  if (users.length === 0) {
    throw new Error('No users found. Please run the main seed first.');
  }
  const userId = users[0].id;

  // Process all sheets or specific sheet
  const processAll = caseType === 'all' || !caseType;
  
  try {
    if (processAll && sheetNames.length > 1) {
      // Process all sheets automatically
      console.log('\n🔄 Processing all sheets automatically...\n');
      
      for (const sheetName of sheetNames) {
        const worksheet = workbook.Sheets[sheetName];
        const sheetNameLower = sheetName.toLowerCase();
        
        console.log(`\n${'='.repeat(60)}`);
        console.log(`📋 Processing sheet: ${sheetName}`);
        console.log(`${'='.repeat(60)}\n`);
        
        let detectedCaseType: string | null = null;
        
        // Auto-detect case type from sheet name
        if (sheetNameLower.includes('stemi')) {
          detectedCaseType = 'stemi';
        } else if (sheetNameLower.includes('stroke')) {
          detectedCaseType = 'stroke';
        } else if (sheetNameLower.includes('trauma')) {
          detectedCaseType = 'trauma';
        }
        
        if (!detectedCaseType) {
          console.warn(`⚠️  Could not determine case type for sheet "${sheetName}". Skipping...`);
          continue;
        }
        
        console.log(`🔍 Detected case type: ${detectedCaseType.toUpperCase()}\n`);
        
        // Process based on case type
        switch (detectedCaseType) {
          case 'stemi':
            await processStemiCases(worksheet, userId);
            break;
          case 'stroke':
            await processStrokeCases(worksheet, userId);
            break;
          case 'trauma':
            await processTraumaCases(worksheet, userId);
            break;
        }
      }
      
      console.log(`\n${'='.repeat(60)}`);
      console.log('✅ All sheets processed successfully!');
      console.log(`${'='.repeat(60)}\n`);
    } else {
      // Process single sheet
      const sheetName = caseType && sheetNames.length > 1 
        ? sheetNames.find(name => name.toLowerCase().includes(caseType)) || sheetNames[0]
        : sheetNames[0];
      
      const worksheet = workbook.Sheets[sheetName];
      console.log(`📄 Processing sheet: ${sheetName}`);

      // Determine case type
      let detectedCaseType = caseType;
      if (!detectedCaseType) {
        const fileName = path.basename(fullPath).toLowerCase();
        const sheetNameLower = sheetName.toLowerCase();
        
        if (sheetNameLower.includes('stemi') || fileName.includes('stemi')) {
          detectedCaseType = 'stemi';
        } else if (sheetNameLower.includes('stroke') || fileName.includes('stroke')) {
          detectedCaseType = 'stroke';
        } else if (sheetNameLower.includes('trauma') || fileName.includes('trauma')) {
          detectedCaseType = 'trauma';
        } else {
          console.error('❌ Could not determine case type. Please specify: stemi, stroke, or trauma');
          process.exit(1);
        }
      }

      console.log(`🔍 Detected case type: ${detectedCaseType.toUpperCase()}`);

      // Process based on case type
      switch (detectedCaseType) {
        case 'stemi':
          await processStemiCases(worksheet, userId);
          break;
        case 'stroke':
          await processStrokeCases(worksheet, userId);
          break;
        case 'trauma':
          await processTraumaCases(worksheet, userId);
          break;
        default:
          console.error(`❌ Unknown case type: ${detectedCaseType}`);
          process.exit(1);
      }

      console.log('✅ Spreadsheet processing completed successfully!');
    }
  } catch (error) {
    console.error('❌ Error processing spreadsheet:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();

