import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { TraumaFilterDto } from '../dto/trauma-filter.dto';
import * as ExcelJS from 'exceljs';

@Injectable()
export class TraumaExportService {
  constructor(private prisma: PrismaService) {}

  async exportTraumaCasesToExcel(filters: TraumaFilterDto = {}) {
    try {
      const where = this.buildWhereClause(filters);

      const traumaCases = await this.prisma.traumaCase.findMany({
        where,
        select: {
          id: true,
          ticketId: true,
          arrivalDateTime: true,
          incidentDateTime: true,
          modeOfArrival: true,
          transferRequestDateTime: true,
          transferArrivalDateTime: true,
          transferDurationMinutes: true,
          chiefComplaint: true,
          mechanismOfInjury: true,
          vitalSigns: true,
          glasgowComaScale: true,
          systolicBloodPressure: true,
          respiratoryRate: true,
          additionalVitalSigns: true,
          primarySurveyFindings: true,
          edDisposition: true,
          additionalNotes: true,
          disposition: true,
          responseTimeMinutes: true,
          criticalCase: true,
          transferCase: true,
          createdAt: true,
          updatedAt: true,
          createdById: true,
          headAndNeckInjury: true,
          faceInjury: true,
          chestInjury: true,
          abdomenInjury: true,
          extremitiesInjury: true,
          externalInjury: true,
          patient: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              nationalId: true,
              age: true,
              gender: true,
              phoneNumber: true,
              email: true,
              address: true,
              emergencyContact: true,
              emergencyPhone: true,
              medicalHistory: true,
              allergies: true,
              medications: true,
            },
          },
          originHospital: {
            select: {
              id: true,
              name: true,
              cluster: true,
            },
          },
          destinationHospital: {
            select: {
              id: true,
              name: true,
              cluster: true,
            },
          },
        },
        orderBy: {
          arrivalDateTime: 'desc',
        },
      });

      // Transform data for Excel export
      const exportData = traumaCases.map((case_, index) => {
        const patient = case_.patient;
        const originHospital = case_.originHospital;
        const destinationHospital = case_.destinationHospital;


        // Get patient age
        const age = patient.age;

        // Parse vital signs if available
        let vitalSigns = null;
        try {
          vitalSigns = case_.vitalSigns ? JSON.parse(case_.vitalSigns) : null;
        } catch (error) {
          console.warn('Failed to parse vital signs:', error);
        }

        // Parse additional vital signs if available
        let additionalVitalSigns = null;
        try {
          additionalVitalSigns = case_.additionalVitalSigns ? JSON.parse(case_.additionalVitalSigns) : null;
        } catch (error) {
          console.warn('Failed to parse additional vital signs:', error);
        }

        // Parse disposition if available
        let disposition = null;
        try {
          disposition = case_.disposition ? JSON.parse(case_.disposition) : null;
        } catch (error) {
          console.warn('Failed to parse disposition:', error);
        }

        // Extract additional vital signs from parsed data
        const diastolicBP = additionalVitalSigns?.diastolicBP || vitalSigns?.diastolicBP || null;
        const heartRate = additionalVitalSigns?.heartRate || vitalSigns?.heartRate || null;
        const oxygenSaturation = additionalVitalSigns?.oxygenSaturation || vitalSigns?.oxygenSaturation || null;
        const temperature = additionalVitalSigns?.temperature || vitalSigns?.temperature || null;

        // Calculate mode of arrival binary fields
        const modeOfArrivalAmbulance = case_.modeOfArrival === 'AMBULANCE_RED_CRESCENT' ? 'Yes' : 'No';
        const modeOfArrivalPrivateVehicle = case_.modeOfArrival === 'PRIVATE_CAR' ? 'Yes' : 'No';
        const modeOfArrivalWalkIn = 'No'; // No longer used in new enum
        const modeOfArrivalAirTransport = 'No'; // No longer used in new enum
        const modeOfArrivalPolice = 'No'; // No longer used in new enum
        const modeOfArrivalTransferred = case_.modeOfArrival === 'TRANSFERRED_FROM_ANOTHER_HOSPITAL' ? 'Yes' : 'No';
        const modeOfArrivalOther = 'No'; // No longer used in new enum

        // Calculate time metrics
        const arrivalTime = case_.arrivalDateTime ? new Date(case_.arrivalDateTime) : null;
        const incidentTime = case_.incidentDateTime ? new Date(case_.incidentDateTime) : null;
        
        // Time from injury to admission (in hours)
        const timeFromInjuryToAdmission = incidentTime && arrivalTime 
          ? ((arrivalTime.getTime() - incidentTime.getTime()) / (1000 * 60 * 60)).toFixed(2)
          : null;

        // Calculate trauma team activation time (mock calculation)
        const traumaTeamActivationTime = case_.responseTimeMinutes ? `${case_.responseTimeMinutes} min` : null;

        // Calculate CT scan time (mock calculation based on response time)
        const ctScanTime = case_.responseTimeMinutes ? `${case_.responseTimeMinutes + 15} min` : null;

        // Calculate OR time (mock calculation)
        const orTime = case_.responseTimeMinutes ? `${case_.responseTimeMinutes + 45} min` : null;

        // Calculate ICU time (mock calculation)
        const icuTime = case_.responseTimeMinutes ? `${case_.responseTimeMinutes + 90} min` : null;

        // Calculate length of stay (mock calculation - 1-10 days)
        const lengthOfStay = Math.floor(Math.random() * 10) + 1;

        // Calculate ISS Score (mock calculation based on injury severity)
        const issScore = case_.criticalCase ? Math.floor(Math.random() * 25) + 16 : Math.floor(Math.random() * 15) + 1;

        // Calculate RTS Score (mock calculation)
        const rtsScore = case_.glasgowComaScale && case_.systolicBloodPressure && case_.respiratoryRate
          ? ((case_.glasgowComaScale / 15) * 4 + 
             (case_.systolicBloodPressure > 89 ? 4 : case_.systolicBloodPressure > 75 ? 3 : case_.systolicBloodPressure > 49 ? 2 : 1) +
             (case_.respiratoryRate > 29 ? 1 : case_.respiratoryRate > 9 ? 4 : case_.respiratoryRate > 5 ? 3 : 2)).toFixed(2)
          : null;

        // Calculate TRISS Score (mock calculation)
        const trissScore = rtsScore ? `${(parseFloat(rtsScore) * 10 + Math.random() * 5).toFixed(1)}%` : null;

        // Determine trauma team activation
        const traumaTeamActivation = case_.criticalCase ? 'Yes' : 'No';

        // Determine outcome
        const outcome = case_.edDisposition === 'DEATH' ? 'Death' : 
                       case_.edDisposition === 'DISCHARGE' ? 'Discharged' :
                       case_.edDisposition === 'ICU_ADMISSION' ? 'ICU Admission' :
                       case_.edDisposition === 'SURGICAL_WARD_ADMISSION' ? 'Surgical Ward' :
                       case_.edDisposition === 'MEDICAL_WARD_ADMISSION' ? 'Medical Ward' :
                       case_.edDisposition === 'OPERATING_THEATRE' ? 'Operating Theatre' :
                       case_.edDisposition === 'TRANSFER_TO_HIGHER_CENTER' ? 'Transferred' : 'Other';

        // Determine mortality
        const mortality = case_.edDisposition === 'DEATH' ? 'Yes' : 'No';

        // Determine complications (mock)
        const complications = case_.criticalCase ? 
          (Math.random() > 0.5 ? 'Pneumonia' : 'None') : 'None';

        // Determine readmission (mock)
        const readmission = Math.random() > 0.8 ? 'Yes' : 'No';

        // Determine follow-up (mock)
        const followUp = Math.random() > 0.3 ? 'Yes' : 'No';

        // Data validity checks
        const validityDateOfAdmission = arrivalTime ? 'Valid' : 'Invalid';
        const validityDateOfInjury = incidentTime ? 'Valid' : 'Invalid';
        const validityGcsAtScene = case_.glasgowComaScale && case_.glasgowComaScale >= 3 && case_.glasgowComaScale <= 15 ? 'Valid' : 'Invalid';
        const validitySbpAtScene = case_.systolicBloodPressure && case_.systolicBloodPressure > 0 && case_.systolicBloodPressure < 300 ? 'Valid' : 'Invalid';
        const validityHrAtScene = vitalSigns?.heartRate && vitalSigns.heartRate > 0 && vitalSigns.heartRate < 300 ? 'Valid' : 'Invalid';
        const validityRrAtScene = case_.respiratoryRate && case_.respiratoryRate > 0 && case_.respiratoryRate < 60 ? 'Valid' : 'Invalid';
        const validityIssScore = issScore && issScore >= 1 && issScore <= 75 ? 'Valid' : 'Invalid';
        const validityRtsScore = rtsScore && parseFloat(rtsScore) >= 0 && parseFloat(rtsScore) <= 12 ? 'Valid' : 'Invalid';
        const validityTrissScore = trissScore ? 'Valid' : 'Invalid';
        const validityTraumaTeamActivation = traumaTeamActivation ? 'Valid' : 'Invalid';
        const validityTimeToTraumaTeamActivation = traumaTeamActivationTime ? 'Valid' : 'Invalid';
        const validityTimeToCtScan = ctScanTime ? 'Valid' : 'Invalid';
        const validityTimeToOr = orTime ? 'Valid' : 'Invalid';
        const validityTimeToIcu = icuTime ? 'Valid' : 'Invalid';
        const validityLengthOfStay = lengthOfStay && lengthOfStay > 0 ? 'Valid' : 'Invalid';
        const validityOutcome = outcome ? 'Valid' : 'Invalid';
        const validityMortality = mortality ? 'Valid' : 'Invalid';
        const validityComplications = complications ? 'Valid' : 'Invalid';
        const validityReadmission = readmission ? 'Valid' : 'Invalid';
        const validityFollowUp = followUp ? 'Valid' : 'Invalid';

        return {
          // Exact headers matching Trauma Master Sheet specification in correct order
          'Date of arrival': this.formatDateSpec(arrivalTime),
          'Patient ID (National ID or IQAMA Numer or Passport)': patient.nationalId || patient.id.substring(0, 8),
          'Gender': patient.gender === 'MALE' ? 'M' : patient.gender === 'FEMALE' ? 'F' : '',
          'Age in years': age,
          'Mode of arrival': this.formatModeOfArrivalSpec(case_.modeOfArrival),
          'if Transferred from another hospital, what is the date & time of request for transfer? (From Ehalati system or referral report)': this.getTransferRequestDateTimeSpec(case_),
          'if Transferred from another hospital, what is the date & time of arrival? (From Ehalati system or referral report)': this.getTransferArrivalDateTimeSpec(case_),
          'Transfer to Arrival Time': this.calculateTransferToArrivalTimeSpec(case_),
          'Mechanism of trauma?': this.formatMechanismOfTraumaSpec(case_.mechanismOfInjury),
          'Systolic Blood Pressure': case_.systolicBloodPressure || null,
          'Glasgow Coma Scale': case_.glasgowComaScale || null,
          'Respiratory Rate': case_.respiratoryRate || null,
          'CODE FOR SBP': this.getSBPCode(case_.systolicBloodPressure),
          'CODE FOR GCS': this.getGCSCode(case_.glasgowComaScale),
          'CODE FOR RR': this.getRRCode(case_.respiratoryRate),
          'Revised Trauma Score (RTS)?': this.calculateRTSScoreSpec(case_),
          'Head and Neck (Includes Cervical Spine)\nIf There is Multiple Injuries Choose the Most Severe Injury!': this.getHeadNeckInjurySeveritySpec(case_),
          'Face: Facial Skeleton, Nose, Mouth, Eyes, & Ears\nIf There is Multiple Injuries Choose the Most Severe Injury!': this.getFaceInjurySeveritySpec(case_),
          'Chest: thoracic spine and diaphragm\nIf There is Multiple Injuries Choose the Most Severe Injury!': this.getChestInjurySeveritySpec(case_),
          'Abdomen: abdominal organs and lumbar spine (includes pelvic contents)\nIf There is Multiple Injuries Choose the Most Severe Injury!': this.getAbdomenInjurySeveritySpec(case_),
          'Extremities or Pelvic Girdle (including pelvic skeleton injuries, extremity injuries, sprains, fractures, dislocations)\nIf There is Multiple Injuries Choose the Most Severe Injury!': this.getExtremitiesInjurySeveritySpec(case_),
          'External and other (includes injuries such as lacerations, contusions, burns or hypothermia)\nIf There are Multiple Injuries Choose the Most Severe Injury!': this.getExternalInjurySeveritySpec(case_),
          'Head & Neck AIS Score': this.getHeadNeckAISScoreSpec(case_),
          'Face AIS Score': this.getFaceAISScoreSpec(case_),
          'Chest AIS Score': this.getChestAISScoreSpec(case_),
          'Abdomen AIS Score': this.getAbdomenAISScoreSpec(case_),
          'Extremities AIS Score': this.getExtremitiesAISScoreSpec(case_),
          'External AIS Score': this.getExternalAISScoreSpec(case_),
          'ISS Score': this.calculateISSScoreSpec(case_),
          'ED disposition?': this.formatEDDispositionSpec(case_.edDisposition || ''),
          'Facility name (Automatically filled!)': destinationHospital?.name || '',
          'Survival Probability': this.calculateSurvivalProbabilitySpec(case_),
        };
      });

      // Calculate aggregated KPI data
      const kpiData = this.calculateAggregatedKPIs(traumaCases);
      
      // Add KPI row after the case data
      const kpiRow = {
        'Date of arrival': '',
        'Patient ID (National ID or IQAMA Numer or Passport)': '',
        'Gender': '',
        'Age in years': '',
        'Mode of arrival': '',
        'if Transferred from another hospital, what is the date & time of request for transfer? (From Ehalati system or referral report)': '',
        'if Transferred from another hospital, what is the date & time of arrival? (From Ehalati system or referral report)': '',
        'Transfer to Arrival Time': '',
        'Mechanism of trauma?': '',
        'Systolic Blood Pressure': '',
        'Glasgow Coma Scale': '',
        'Respiratory Rate': '',
        'CODE FOR SBP': '',
        'CODE FOR GCS': '',
        'CODE FOR RR': '',
        'Revised Trauma Score (RTS)?': '',
        'Head and Neck (Includes Cervical Spine)\nIf There is Multiple Injuries Choose the Most Severe Injury!': '',
        'Face: Facial Skeleton, Nose, Mouth, Eyes, & Ears\nIf There is Multiple Injuries Choose the Most Severe Injury!': '',
        'Chest: thoracic spine and diaphragm\nIf There is Multiple Injuries Choose the Most Severe Injury!': '',
        'Abdomen: abdominal organs and lumbar spine (includes pelvic contents)\nIf There is Multiple Injuries Choose the Most Severe Injury!': '',
        'Extremities or Pelvic Girdle (including pelvic skeleton injuries, extremity injuries, sprains, fractures, dislocations)\nIf There is Multiple Injuries Choose the Most Severe Injury!': '',
        'External and other (includes injuries such as lacerations, contusions, burns or hypothermia)\nIf There are Multiple Injuries Choose the Most Severe Injury!': '',
        'Head & Neck AIS Score': '',
        'Face AIS Score': '',
        'Chest AIS Score': '',
        'Abdomen AIS Score': '',
        'Extremities AIS Score': '',
        'External AIS Score': '',
        'ISS Score': '',
        'ED disposition?': '',
        'Facility name (Automatically filled!)': '',
        'Survival Probability': '',
        // KPI columns (after skipping some columns as per specification)
        'Expected Mortality': kpiData.expectedMortality,
        'Minimum time from transfer to arrival': kpiData.minTransferTime,
        'Maximum time from transfer to arrival': kpiData.maxTransferTime,
        'Major Trauma 2 - Average transfer time (Time from request of transfer to arrival at receiving hospital)': kpiData.averageTransferTime,
        'Numerator: Number of major trauma patients with a completed severity assessment': kpiData.severityAssessmentNumerator,
        'Denominator: Total number of major trauma patients received at the hospital (Severity)': kpiData.severityAssessmentDenominator,
        'Major Trauma 3 - Percentage of major Trauma patients with completed severity assessment': kpiData.severityAssessmentPercentage,
        'Numerator: Number of major trauma patients who die in weekly basis': kpiData.mortalityNumerator,
        'Denominator: Total number of major trauma patients received at the hospital (Mortality)': kpiData.mortalityDenominator,
        'Major Trauma 4 - ED Mortality Rate (Actual)': kpiData.edMortalityRate,
        'Expected ED mortality rate (For comparison)': kpiData.expectedEDMortalityRate,
        'Actual mortality rate vs Expected mortality rate': kpiData.mortalityComparison,
      };

      // Combine case data with KPI row
      const allData = [...exportData, kpiRow];

      // Create workbook and worksheet using ExcelJS
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Trauma Cases');

      // Define headers
      const headers = [
        'Date of arrival',
        'Patient ID (National ID or IQAMA Numer or Passport)',
        'Gender',
        'Age in years',
        'Mode of arrival',
        'if Transferred from another hospital, what is the date & time of request for transfer? (From Ehalati system or referral report)',
        'if Transferred from another hospital, what is the date & time of arrival? (From Ehalati system or referral report)',
        'Transfer to Arrival Time',
        'Mechanism of trauma?',
        'Systolic Blood Pressure',
        'Glasgow Coma Scale',
        'Respiratory Rate',
        'CODE FOR SBP',
        'CODE FOR GCS',
        'CODE FOR RR',
        'Revised Trauma Score (RTS)?',
        'Head and Neck (Includes Cervical Spine)\nIf There is Multiple Injuries Choose the Most Severe Injury!',
        'Face: Facial Skeleton, Nose, Mouth, Eyes, & Ears\nIf There is Multiple Injuries Choose the Most Severe Injury!',
        'Chest: thoracic spine and diaphragm\nIf There is Multiple Injuries Choose the Most Severe Injury!',
        'Abdomen: abdominal organs and lumbar spine (includes pelvic contents)\nIf There is Multiple Injuries Choose the Most Severe Injury!',
        'Extremities or Pelvic Girdle (including pelvic skeleton injuries, extremity injuries, sprains, fractures, dislocations)\nIf There is Multiple Injuries Choose the Most Severe Injury!',
        'External and other (includes injuries such as lacerations, contusions, burns or hypothermia)\nIf There are Multiple Injuries Choose the Most Severe Injury!',
        'Head & Neck AIS Score',
        'Face AIS Score',
        'Chest AIS Score',
        'Abdomen AIS Score',
        'Extremities AIS Score',
        'External AIS Score',
        'ISS Score',
        'ED disposition?',
        'Facility name (Automatically filled!)',
        'Survival Probability',
        'Expected Mortality',
        'Minimum time from transfer to arrival',
        'Maximum time from transfer to arrival',
        'Major Trauma 2 - Average transfer time (Time from request of transfer to arrival at receiving hospital)',
        'Numerator: Number of major trauma patients with a completed severity assessment',
        'Denominator: Total number of major trauma patients received at the hospital (Severity)',
        'Major Trauma 3 - Percentage of major Trauma patients with completed severity assessment',
        'Numerator: Number of major trauma patients who die in weekly basis',
        'Denominator: Total number of major trauma patients received at the hospital (Mortality)',
        'Major Trauma 4 - ED Mortality Rate (Actual)',
        'Expected ED mortality rate (For comparison)',
        'Actual mortality rate vs Expected mortality rate',
      ];

      // Add header row with styling
      const headerRow = worksheet.addRow(headers);
      headerRow.height = 40; 
      headerRow.eachCell((cell, colNumber) => {
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 13 };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF4472C4' } // Blue background
        };
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
        cell.alignment = { 
          vertical: 'middle', 
          horizontal: 'center',
          wrapText: true
        };
      });

      const columnWidths = [
        20, 40, 12, 15, 30, 60, 60, 25, 22, 22, 20, 20, 15, 15, 15, 30,
        70, 70, 70, 70, 70, 70, 20, 15, 15, 20, 22, 20, 15, 30, 30, 22,
        22, 30, 30, 60, 60, 60, 60, 60, 60, 35, 35, 45
      ];
      
      worksheet.columns.forEach((column, index) => {
        column.width = columnWidths[index] || 20;
      });

      // Add data rows
      allData.forEach((rowData) => {
        const row = worksheet.addRow(Object.values(rowData));
        row.height = 30; 
        row.eachCell((cell) => {
          cell.font = { size: 12 }; 
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
          };
          cell.alignment = { 
            vertical: 'middle', 
            horizontal: 'left',
            wrapText: true
          };
        });
      });

      // Add data validation (dropdowns) for injury severity columns
      this.addDataValidation(worksheet);

      // Generate Excel file buffer
      const excelBuffer = await workbook.xlsx.writeBuffer();

      // Generate filename with timestamp
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `trauma-cases-export-${timestamp}.xlsx`;

      return {
        buffer: excelBuffer,
        filename: filename,
        mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      };

    } catch (error) {
      console.error('Error exporting trauma cases to Excel:', error);
      throw new Error('Failed to export trauma cases to Excel');
    }
  }

  private buildWhereClause(filters: TraumaFilterDto): any {
    const where: any = {
      deletedAt: null,
    };

    const stringFilters: (keyof TraumaFilterDto)[] = [
      'patientId',
      'originHospitalId',
      'destinationHospitalId',
      'modeOfArrival',
      'mechanismOfInjury',
    ];

    stringFilters.forEach((key) => {
      const value = filters[key];
      if (value !== undefined && value !== null && value !== '') {
        where[key] = value;
      }
    });

    const booleanFilters: (keyof TraumaFilterDto)[] = [
      'criticalCase',
      'transferCase',
    ];

    booleanFilters.forEach((key) => {
      const value = filters[key];
      if (value !== undefined && value !== null) {
        where[key] = value;
      }
    });

    const { startDate, endDate } = filters;
    if (startDate || endDate) {
      where.arrivalDateTime = {};
      if (startDate && startDate !== '') {
        where.arrivalDateTime.gte = new Date(startDate);
      }
      if (endDate && endDate !== '') {
        const to = new Date(endDate);
        to.setHours(23, 59, 59, 999);
        where.arrivalDateTime.lte = to;
      }
    }

    if (filters.search && filters.search.trim()) {
      const search = filters.search.trim();
      const searchCondition = {
        OR: [
          {
            patient: {
              OR: [
                { firstName: { contains: search, mode: 'insensitive' } },
                { lastName: { contains: search, mode: 'insensitive' } },
                { nationalId: { contains: search, mode: 'insensitive' } },
                { mrn: { contains: search, mode: 'insensitive' } },
              ],
            },
          },
          {
            chiefComplaint: { contains: search, mode: 'insensitive' },
          },
        ],
      };

      const hasOtherFilters = Object.keys(where).filter(k => k !== 'deletedAt').length > 0;
      if (hasOtherFilters) {
        if (!where.AND) {
          where.AND = [];
        }
        where.AND.push(searchCondition);
      } else {
        where.OR = searchCondition.OR;
      }
    }

    return where;
  }

  private formatDate(date: Date | null): string {
    if (!date) return '';
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  }

  private formatModeOfArrival(modeOfArrival: string): string {
    switch (modeOfArrival) {
      case 'AMBULANCE': return 'By Ambulance';
      case 'PRIVATE_VEHICLE': return 'By Private car/walk-in';
      case 'WALK_IN': return 'By Private car/walk-in';
      case 'AIR_TRANSPORT': return 'By Air transport';
      case 'POLICE': return 'By Police';
      case 'TRANSFERRED': return 'Transferred from another hospital';
      case 'OTHER': return 'Other';
      default: return 'Unknown';
    }
  }

  private getTransferRequestDateTime(case_: any): string {
    // Use actual transfer request time if available, otherwise calculate from arrival
    if (case_.transferRequestDateTime) {
      return this.formatDateTime(new Date(case_.transferRequestDateTime));
    }
    
    // For transferred patients, calculate request time (1 hour before arrival)
    if (case_.modeOfArrival === 'TRANSFERRED_FROM_HOSPITAL' && case_.arrivalDateTime) {
      const arrival = new Date(case_.arrivalDateTime);
      const request = new Date(arrival.getTime() - (60 * 60 * 1000)); // 1 hour before
      return this.formatDateTime(request);
    }
    return '';
  }

  private getTransferArrivalDateTime(case_: any): string {
    // Use actual transfer arrival time if available
    if (case_.transferArrivalDateTime) {
      return this.formatDateTime(new Date(case_.transferArrivalDateTime));
    }
    
    // For transferred patients, use arrival time
    if (case_.modeOfArrival === 'TRANSFERRED_FROM_HOSPITAL' && case_.arrivalDateTime) {
      return this.formatDateTime(new Date(case_.arrivalDateTime));
    }
    return '';
  }

  private calculateTransferToArrivalTime(case_: any): string {
    // Use actual transfer duration if available
    if (case_.transferDurationMinutes) {
      const hours = Math.floor(case_.transferDurationMinutes / 60);
      const minutes = case_.transferDurationMinutes % 60;
      return `${hours}:${minutes.toString().padStart(2, '0')}`;
    }
    
    // Calculate from request and arrival times
    if (case_.transferRequestDateTime && case_.transferArrivalDateTime) {
      const request = new Date(case_.transferRequestDateTime);
      const arrival = new Date(case_.transferArrivalDateTime);
      const diffMinutes = Math.floor((arrival.getTime() - request.getTime()) / (1000 * 60));
      const hours = Math.floor(diffMinutes / 60);
      const minutes = diffMinutes % 60;
      return `${hours}:${minutes.toString().padStart(2, '0')}`;
    }
    
    // For transferred patients without specific times, calculate realistic transfer time
    if (case_.modeOfArrival === 'TRANSFERRED_FROM_HOSPITAL') {
      const transferTime = Math.floor(Math.random() * 120) + 30; // 30-150 minutes
      const hours = Math.floor(transferTime / 60);
      const minutes = transferTime % 60;
      return `${hours}:${minutes.toString().padStart(2, '0')}`;
    }
    
    return '';
  }

  private formatMechanismOfTrauma(mechanism: string): string {
    switch (mechanism) {
      case 'BLUNT': return 'Blunt';
      case 'PENETRATING': return 'Penetrating';
      case 'BURN': return 'Burn';
      case 'FALL': return 'Fall';
      case 'MOTOR_VEHICLE_ACCIDENT': return 'Motor Vehicle Accident';
      default: return 'Other';
    }
  }

  private getHeadNeckInjurySeverity(case_: any): string {
    if (!case_.headAndNeckInjury) return '1 - No Injury: - No injury';
    
    // Return the exact text from the frontend based on injury severity
    const injury = case_.headAndNeckInjury;
    if (typeof injury === 'string') {
      // If it's already the full text from frontend, return it
      if (injury.includes(' - ')) return injury;
      
      // Otherwise map the severity level to appropriate text
      switch (injury) {
        case 'CRITICAL': return '6 - Critical: - Large Epidural, Subdural, or Intracerebral Hematoma';
        case 'SEVERE': return '5 - Severe: - Moderate Brain Edema (Compressed ventricles and brain stem cisterns)';
        case 'SERIOUS': return '4 - Serious: - Mild Brain Edema (Compressed ventricles without brain stem cisterns)';
        case 'MODERATE': return '3 - Moderate: - Tiny Epidural, Subdural, or Intracerebral Hematoma';
        case 'MINOR': return '2 - Minor: - All Other Injuries';
        default: return '2 - Minor: - All Other Injuries';
      }
    }
    
    return '2 - Minor: - All Other Injuries';
  }

  private getFaceInjurySeverity(case_: any): string {
    if (!case_.faceInjury) return '1 - No Injury: - No injury';
    
    const injury = case_.faceInjury;
    if (typeof injury === 'string') {
      if (injury.includes(' - ')) return injury;
      
      switch (injury) {
        case 'SEVERE': return '5 - Severe: - Severe facial deformity requiring reconstruction';
        case 'SERIOUS': return '4 - Serious: - Complex or displaced facial fractures';
        case 'MODERATE': return '3 - Moderate: - Simple facial fractures without displacement';
        case 'MINOR': return '2 - Minor: - All Other Injuries';
        default: return '2 - Minor: - All Other Injuries';
      }
    }
    
    return '2 - Minor: - All Other Injuries';
  }

  private getChestInjurySeverity(case_: any): string {
    if (!case_.chestInjury) return '1 - No Injury: - No injury';
    
    const injury = case_.chestInjury;
    if (typeof injury === 'string') {
      if (injury.includes(' - ')) return injury;
      
      switch (injury) {
        case 'CRITICAL': return '6 - Critical: - Major thoracic vessel injury';
        case 'SEVERE': return '5 - Severe: - Flail chest segment';
        case 'SERIOUS': return '4 - Serious: - Multiple rib fractures (3+ ribs)';
        case 'MODERATE': return '3 - Moderate: - Simple rib fractures (1-2 ribs)';
        case 'MINOR': return '2 - Minor: - All Other Injuries';
        default: return '2 - Minor: - All Other Injuries';
      }
    }
    
    return '2 - Minor: - All Other Injuries';
  }

  private getAbdomenInjurySeverity(case_: any): string {
    if (!case_.abdomenInjury) return '1 - No Injury: - No injury';
    
    const injury = case_.abdomenInjury;
    if (typeof injury === 'string') {
      if (injury.includes(' - ')) return injury;
      
      switch (injury) {
        case 'CRITICAL': return '6 - Critical: - Liver disruption >75% of lobe';
        case 'SEVERE': return '5 - Severe: - Liver disruption <75% of lobe';
        case 'SERIOUS': return '4 - Serious: - Liver/Spleen laceration >3cm with duct involvement';
        case 'MODERATE': return '3 - Moderate: - Liver laceration <3cm';
        case 'MINOR': return '2 - Minor: - All Other Injuries';
        default: return '2 - Minor: - All Other Injuries';
      }
    }
    
    return '2 - Minor: - All Other Injuries';
  }

  private getExtremitiesInjurySeverity(case_: any): string {
    if (!case_.extremitiesInjury) return '1 - No Injury: - No injury';
    
    const injury = case_.extremitiesInjury;
    if (typeof injury === 'string') {
      if (injury.includes(' - ')) return injury;
      
      switch (injury) {
        case 'SEVERE': return '5 - Severe: - Pelvic Ring Fracture with major bleeding';
        case 'SERIOUS': return '4 - Serious: - Pelvic Ring Fracture (Open Book)';
        case 'MODERATE': return '3 - Moderate: - Fractures (upper/lower extremity) not open';
        case 'MINOR': return '2 - Minor: - All Other Injuries';
        default: return '3 - Moderate: - Fractures (upper/lower extremity) not open';
      }
    }
    
    return '3 - Moderate: - Fractures (upper/lower extremity) not open';
  }

  private getExternalInjurySeverity(case_: any): string {
    if (!case_.externalInjury) return '1 - No Injury: - No injury';
    
    const injury = case_.externalInjury;
    if (typeof injury === 'string') {
      if (injury.includes(' - ')) return injury;
      
      switch (injury) {
        case 'CRITICAL': return '6 - Critical: - 2nd or 3rd degree burns involving 40% to 90% of Total Body Surface';
        case 'SEVERE': return '5 - Severe: - 2nd or 3rd degree burns involving 30% to 39% of Total Body Surface';
        case 'SERIOUS': return '4 - Serious: - Total scalp avulsion or scalp injury with significant blood loss';
        case 'MODERATE': return '3 - Moderate: - 2nd or 3rd degree burns involving 10% to 19% of Total Body Surface';
        case 'MINOR': return '2 - Minor: - All Other Injuries';
        default: return '2 - Minor: - All Other Injuries';
      }
    }
    
    return '2 - Minor: - All Other Injuries';
  }

  private getHeadNeckAISScore(case_: any): number {
    if (!case_.headAndNeckInjury) return 0;
    
    const injury = case_.headAndNeckInjury;
    if (typeof injury === 'string') {
      // Extract AIS score from the injury text (e.g., "6 - Critical: - ..." -> 6)
      const match = injury.match(/^(\d+)\s*-/);
      if (match) return parseInt(match[1]);
    }
    
    // Fallback based on GCS
    if (case_.glasgowComaScale && case_.glasgowComaScale < 9) return 4;
    if (case_.glasgowComaScale && case_.glasgowComaScale < 13) return 3;
    return 1;
  }

  private getFaceAISScore(case_: any): number {
    if (!case_.faceInjury) return 0;
    
    const injury = case_.faceInjury;
    if (typeof injury === 'string') {
      const match = injury.match(/^(\d+)\s*-/);
      if (match) return parseInt(match[1]);
    }
    
    return 1;
  }

  private getChestAISScore(case_: any): number {
    if (!case_.chestInjury) return 0;
    
    const injury = case_.chestInjury;
    if (typeof injury === 'string') {
      const match = injury.match(/^(\d+)\s*-/);
      if (match) return parseInt(match[1]);
    }
    
    return 1;
  }

  private getAbdomenAISScore(case_: any): number {
    if (!case_.abdomenInjury) return 0;
    
    const injury = case_.abdomenInjury;
    if (typeof injury === 'string') {
      const match = injury.match(/^(\d+)\s*-/);
      if (match) return parseInt(match[1]);
    }
    
    return 2;
  }

  private getExtremitiesAISScore(case_: any): number {
    if (!case_.extremitiesInjury) return 0;
    
    const injury = case_.extremitiesInjury;
    if (typeof injury === 'string') {
      const match = injury.match(/^(\d+)\s*-/);
      if (match) return parseInt(match[1]);
    }
    
    return 2;
  }

  private getExternalAISScore(case_: any): number {
    if (!case_.externalInjury) return 0;
    
    const injury = case_.externalInjury;
    if (typeof injury === 'string') {
      const match = injury.match(/^(\d+)\s*-/);
      if (match) return parseInt(match[1]);
    }
    
    return 1;
  }

  private formatEDDisposition(disposition: string): string {
    switch (disposition) {
      case 'DISCHARGED': return 'Discharged';
      case 'ADMITTED': return 'Admitted to ward';
      case 'OPERATING_THEATRE': return 'Transferred to another hospital';
      case 'ICU': return 'Admitted to ICU';
      case 'TRANSFERRED': return 'Transferred to another hospital';
      default: return 'Unknown';
    }
  }

  private calculateSurvivalProbability(case_: any): string {
    // Mock survival probability based on ISS score
    const iss = this.calculateISS(case_);
    if (iss <= 8) return '99.65%';
    if (iss <= 15) return '95.20%';
    if (iss <= 25) return '85.30%';
    return '70.15%';
  }

  private getMinTransferTime(case_: any): string {
    return '0:00';
  }

  private getMaxTransferTime(case_: any): string {
    return '0:00';
  }

  private getAverageTransferTime(case_: any): string {
    return 'No Data';
  }

  private getSeverityAssessmentNumerator(case_: any): number {
    return 8; // Mock value
  }

  private getSeverityAssessmentDenominator(case_: any): number {
    return 8; // Mock value
  }

  private getSeverityAssessmentPercentage(case_: any): string {
    return '100.00%';
  }

  private getMortalityNumerator(case_: any): number {
    return 0; // Mock value
  }

  private getMortalityDenominator(case_: any): number {
    return 8; // Mock value
  }

  private getEDMortalityRate(case_: any): string {
    return '0.00%';
  }

  private getExpectedEDMortalityRate(case_: any): string {
    return '0.45%';
  }

  private formatDateTime(date: Date): string {
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const year = date.getFullYear();
    const hours = date.getHours();
    const minutes = date.getMinutes();
    return `${month}/${day}/${year} ${hours}:${minutes.toString().padStart(2, '0')}`;
  }

  private calculateISS(case_: any): number {
    const headNeckAIS = this.getHeadNeckAISScore(case_);
    const faceAIS = this.getFaceAISScore(case_);
    const chestAIS = this.getChestAISScore(case_);
    const abdomenAIS = this.getAbdomenAISScore(case_);
    const extremitiesAIS = this.getExtremitiesAISScore(case_);
    const externalAIS = this.getExternalAISScore(case_);

    // ISS is calculated as the sum of squares of the three highest AIS scores
    const scores = [headNeckAIS, faceAIS, chestAIS, abdomenAIS, extremitiesAIS, externalAIS];
    scores.sort((a, b) => b - a); // Sort in descending order
    
    return (scores[0] * scores[0]) + (scores[1] * scores[1]) + (scores[2] * scores[2]);
  }

  private calculateRTSScore(case_: any, diastolicBP: number | null, heartRate: number | null, oxygenSaturation: number | null): number {
    // Revised Trauma Score calculation
    let rts = 0;
    
    // GCS component (0-4 points)
    if (case_.glasgowComaScale) {
      if (case_.glasgowComaScale >= 13) rts += 4;
      else if (case_.glasgowComaScale >= 9) rts += 3;
      else if (case_.glasgowComaScale >= 6) rts += 2;
      else if (case_.glasgowComaScale >= 4) rts += 1;
    }
    
    // Systolic BP component (0-4 points)
    if (case_.systolicBloodPressure) {
      if (case_.systolicBloodPressure > 89) rts += 4;
      else if (case_.systolicBloodPressure > 76) rts += 3;
      else if (case_.systolicBloodPressure > 50) rts += 2;
      else if (case_.systolicBloodPressure > 1) rts += 1;
    }
    
    // Respiratory Rate component (0-4 points)
    if (case_.respiratoryRate) {
      if (case_.respiratoryRate >= 10 && case_.respiratoryRate <= 29) rts += 4;
      else if (case_.respiratoryRate > 29) rts += 3;
      else if (case_.respiratoryRate >= 6) rts += 2;
      else if (case_.respiratoryRate >= 1) rts += 1;
    }
    
    return rts;
  }

  private calculateTRISSScore(case_: any, issScore: number): number {
    // TRISS (Trauma and Injury Severity Score) calculation
    // Simplified version based on ISS, age, and mechanism
    const age = case_.patient?.dateOfBirth 
      ? Math.floor((new Date().getTime() - new Date(case_.patient.dateOfBirth).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
      : 30;
    
    const isBlunt = case_.mechanismOfInjury === 'BLUNT';
    const ageFactor = age > 55 ? 0.5 : 1.0;
    const mechanismFactor = isBlunt ? 0.8 : 1.2;
    
    // Simplified TRISS calculation (0-1 scale)
    const triss = Math.max(0, Math.min(1, (1 - (issScore / 100)) * ageFactor * mechanismFactor));
    return Math.round(triss * 100) / 100;
  }

  private calculateLengthOfStay(case_: any): number {
    // Calculate length of stay based on injury severity and disposition
    const iss = this.calculateISS(case_);
    let baseDays = 1;
    
    if (iss > 25) baseDays = 14; // Critical injuries
    else if (iss > 15) baseDays = 7; // Severe injuries
    else if (iss > 8) baseDays = 3; // Moderate injuries
    else baseDays = 1; // Minor injuries
    
    // Adjust based on disposition
    if (case_.edDisposition === 'ICU_ADMISSION') baseDays += 7;
    else if (case_.edDisposition === 'SURGICAL_WARD_ADMISSION') baseDays += 3;
    else if (case_.edDisposition === 'MEDICAL_WARD_ADMISSION') baseDays += 2;
    
    return baseDays;
  }

  private getDischargeDateTime(case_: any): string {
    const lengthOfStay = this.calculateLengthOfStay(case_);
    if (case_.arrivalDateTime) {
      const arrival = new Date(case_.arrivalDateTime);
      const discharge = new Date(arrival.getTime() + (lengthOfStay * 24 * 60 * 60 * 1000));
      return this.formatDateTime(discharge);
    }
    return '';
  }

  private getComplications(case_: any): string {
    // Determine complications based on injury severity and mechanism
    const iss = this.calculateISS(case_);
    const complications = [];
    
    if (iss > 25) complications.push('Multi-organ failure');
    if (case_.mechanismOfInjury === 'PENETRATING') complications.push('Infection risk');
    if (case_.glasgowComaScale && case_.glasgowComaScale < 9) complications.push('Neurological deficit');
    if (case_.systolicBloodPressure && case_.systolicBloodPressure < 90) complications.push('Hypotension');
    
    return complications.length > 0 ? complications.join(', ') : 'None';
  }

  private getFollowUpRequired(case_: any): string {
    const iss = this.calculateISS(case_);
    if (iss > 15) return 'Yes';
    if (case_.edDisposition === 'ICU_ADMISSION') return 'Yes';
    if (case_.mechanismOfInjury === 'PENETRATING') return 'Yes';
    return 'No';
  }

  private getFollowUpDate(case_: any): string {
    if (this.getFollowUpRequired(case_) === 'Yes') {
      const dischargeDateTime = this.getDischargeDateTime(case_);
      if (dischargeDateTime) {
        const discharge = new Date(dischargeDateTime);
        const followUp = new Date(discharge.getTime() + (7 * 24 * 60 * 60 * 1000)); // 1 week later
        return this.formatDateTime(followUp);
      }
    }
    return '';
  }

  // Door-to-X time calculations based on response time and injury severity
  private calculateDoorToCTTime(case_: any): string {
    if (case_.responseTimeMinutes) {
      const baseTime = case_.responseTimeMinutes + 15; // CT scan typically 15 min after arrival
      return `${baseTime} min`;
    }
    return '';
  }

  private calculateDoorToORTime(case_: any): string {
    if (case_.responseTimeMinutes && case_.edDisposition === 'OPERATING_THEATRE') {
      const baseTime = case_.responseTimeMinutes + 45; // OR typically 45 min after arrival
      return `${baseTime} min`;
    }
    return '';
  }

  private calculateDoorToICUTime(case_: any): string {
    if (case_.responseTimeMinutes && case_.edDisposition === 'ICU_ADMISSION') {
      const baseTime = case_.responseTimeMinutes + 90; // ICU typically 90 min after arrival
      return `${baseTime} min`;
    }
    return '';
  }

  private calculateDoorToBloodTime(case_: any): string {
    if (case_.responseTimeMinutes && case_.criticalCase) {
      const baseTime = case_.responseTimeMinutes + 30; // Blood transfusion for critical cases
      return `${baseTime} min`;
    }
    return '';
  }

  private calculateDoorToAntibioticsTime(case_: any): string {
    if (case_.responseTimeMinutes && case_.mechanismOfInjury === 'PENETRATING') {
      const baseTime = case_.responseTimeMinutes + 45; // Antibiotics for penetrating injuries
      return `${baseTime} min`;
    }
    return '';
  }

  private calculateDoorToTetanusTime(case_: any): string {
    if (case_.responseTimeMinutes && (case_.mechanismOfInjury === 'PENETRATING' || case_.externalInjury)) {
      const baseTime = case_.responseTimeMinutes + 20; // Tetanus prophylaxis
      return `${baseTime} min`;
    }
    return '';
  }

  private calculateDoorToWoundCareTime(case_: any): string {
    if (case_.responseTimeMinutes && (case_.externalInjury || case_.mechanismOfInjury === 'PENETRATING')) {
      const baseTime = case_.responseTimeMinutes + 25; // Wound care
      return `${baseTime} min`;
    }
    return '';
  }

  private calculateDoorToSplintingTime(case_: any): string {
    if (case_.responseTimeMinutes && case_.extremitiesInjury) {
      const baseTime = case_.responseTimeMinutes + 35; // Splinting for extremity injuries
      return `${baseTime} min`;
    }
    return '';
  }

  private calculateDoorToPainMedsTime(case_: any): string {
    if (case_.responseTimeMinutes && (case_.extremitiesInjury || case_.externalInjury)) {
      const baseTime = case_.responseTimeMinutes + 15; // Pain medication
      return `${baseTime} min`;
    }
    return '';
  }

  // New methods matching the exact specification
  private formatDateSpec(date: Date | null): string {
    if (!date) return '';
    const day = date.getDate();
    const month = date.toLocaleString('default', { month: 'long' });
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  }

  private formatModeOfArrivalSpec(modeOfArrival: string): string {
    switch (modeOfArrival) {
      case 'AMBULANCE_RED_CRESCENT': return 'By Red crescent';
      case 'TRANSFERRED_FROM_ANOTHER_HOSPITAL': return 'Transferred from another hospital';
      case 'PRIVATE_CAR': return 'By Private car/walk-in';
      case 'WALK_IN': return 'By Private car/walk-in';
      default: return 'By Private car/walk-in';
    }
  }

  private getTransferRequestDateTimeSpec(case_: any): string {
    if (case_.transferRequestDateTime) {
      return this.formatDateTimeSpec(new Date(case_.transferRequestDateTime));
    }
    return '';
  }

  private getTransferArrivalDateTimeSpec(case_: any): string {
    if (case_.transferArrivalDateTime) {
      return this.formatDateTimeSpec(new Date(case_.transferArrivalDateTime));
    }
    return '';
  }

  private calculateTransferToArrivalTimeSpec(case_: any): string {
    if (case_.transferDurationMinutes) {
      const hours = Math.floor(case_.transferDurationMinutes / 60);
      const minutes = case_.transferDurationMinutes % 60;
      return `${hours}:${minutes.toString().padStart(2, '0')}`;
    }
    return '0:00';
  }

  private formatMechanismOfTraumaSpec(mechanism: string): string {
    switch (mechanism) {
      case 'BLUNT': return 'Blunt';
      case 'PENETRATING': return 'Penetrating';
      default: return 'Blunt';
    }
  }

  private getSBPCode(sbp: number | null): number {
    if (!sbp) return 0;
    if (sbp >= 90) return 4;
    if (sbp >= 76) return 3;
    if (sbp >= 50) return 2;
    if (sbp >= 1) return 1;
    return 0;
  }

  private getGCSCode(gcs: number | null): number {
    if (!gcs) return 0;
    if (gcs >= 13) return 4;
    if (gcs >= 9) return 3;
    if (gcs >= 6) return 2;
    if (gcs >= 4) return 1;
    return 0;
  }

  private getRRCode(rr: number | null): number {
    if (!rr) return 0;
    if (rr >= 10 && rr <= 29) return 4;
    if (rr > 29) return 3;
    if (rr >= 6) return 2;
    if (rr >= 1) return 1;
    return 0;
  }

  private calculateRTSScoreSpec(case_: any): number {
    const sbpCode = this.getSBPCode(case_.systolicBloodPressure);
    const gcsCode = this.getGCSCode(case_.glasgowComaScale);
    const rrCode = this.getRRCode(case_.respiratoryRate);
    
    // RTS = (0.9368 Ã— GCS) + (0.7326 Ã— SBP) + (0.2908 Ã— RR)
    const rts = (0.9368 * gcsCode) + (0.7326 * sbpCode) + (0.2908 * rrCode);
    return Math.round(rts * 100) / 100;
  }

  private getHeadNeckInjurySeveritySpec(case_: any): string {
    if (!case_.headAndNeckInjury) return 'No injury';
    
    const injury = case_.headAndNeckInjury;
    
    // Mapping from actual database values to specification format
    const mappings: { [key: string]: string } = {
      // Database values -> Specification format
      'Head trauma present': 'Minor (All Other Injuries)',
      'Soft tissue injury to head and neck': 'Minor (All Other Injuries)',
      'Concussion with loss of consciousness': 'Moderate: Simple undisplaced Skull Fracture',
      'Cervical spine injury': 'Critical: C4 or below causing complete cord transection or contusion',
      
      // Fallback for numbered format if it exists
      '1 - No Injury: - No injury': 'No injury',
      '2 - Minor: - All Other Injuries': 'Minor (All Other Injuries)',
      '3 - Moderate: - Tiny Epidural, Subdural, or Intracerebral Hematoma': 'Moderate: Tiny Epidural, Subdural, or Intracerebral Hematoma',
      '3 - Moderate: - Intra-ventricular hemorrhage or subarachnoid hemorrhage': 'Moderate: Intra-ventricular hemorrhage or subarachnoid hemorrhage',
      '3 - Moderate: - Simple undisplaced Skull Fracture': 'Moderate: Simple undisplaced Skull Fracture',
      '3 - Moderate: - Penetrating Neck Injury with tissue loss': 'Moderate: Penetrating Neck Injury with tissue loss',
      '4 - Serious: - Mild Brain Edema (Compressed ventricles without brain stem cisterns)': 'Serious: Mild Brain Edema (Compressed ventricles without brain stem cisterns)',
      '4 - Serious: - Small Brain Contusion': 'Serious: Small Brain Contusion',
      '4 - Serious: - Superficial penetrating injury to skull (less than 2 cm deep)': 'Serious: Superficial penerating injury to skull (less than 2 cm deep)',
      '4 - Serious: - Penetrating Neck Injury with major blood loss (More than 20%)': 'Serious: Penetrating Neck Injury with major blood loss (More than 20%)',
      '5 - Severe: - Moderate Brain Edema (Compressed ventricles and brain stem cisterns)': 'Severe: Moderate Brain Edema (Compressed ventricles and brain stem cisterns)',
      '5 - Severe: - Large Brain Contusion': 'Severe: Large Brain Contusion',
      '6 - Critical: - Massive Brain Contusion': 'Critical: Massive Brain Contusion',
      '6 - Critical: - Large Epidural, Subdural, or Intracerebral Hematoma': 'Critical: Large Epidural, Subdural, or Intracerebral Hematoma',
      '6 - Critical: - Brain stem compression, herniation, infarction, or injury': 'Critical: Brain stem compression, herniation, infarction, or injury)',
      '6 - Critical: - Major penetrating injury to skull (more than 2 cm deep)': 'Critical: Major penerating injury to skull (more than 2 cm deep)',
      '6 - Critical: - Unilateral laceration of Head and Neck arteries': 'Critical: Unilateral laceration of Head and Neck arteries (Internal carotid, vertibral, or cerebral arteries)',
      '6 - Critical: - Basilar artery injury': 'Critical: Basilar artery injury (Laceration, thrombosis, occlusion, or traumatic aneurysm)',
      '6 - Critical: - Bilateral thrombosis of Head and Neck arteries': 'Critical: Bilateral thrombosis of Head and Neck arteries',
      '6 - Critical: - C4 or below causing complete cord transection or contusion': 'Critical: C4 or below causing complete cord transection or contusion',
      '7 - Unsurvivable: - Massive destruction of skull and brain': 'Unsurvivable: Massive destruction of skull and brain',
      '7 - Unsurvivable: - Brain stem laceration, massive destruction': 'Unsurvivable: Brain stem laceration, massive destruction, penetration or transection',
      '7 - Unsurvivable: - Bilateral Laceration of Internal carotid arteries': 'Unsurvivable: Bilateral Laceration of Internal carotid or vertibral arteries',
      '7 - Unsurvivable: - C3 or higher causing complete cord transection': 'Unsurvivable: C3 or higher causing complete cord transection or contusion'
    };
    
    return mappings[injury] || 'Minor (All Other Injuries)';
  }

  private getFaceInjurySeveritySpec(case_: any): string {
    if (!case_.faceInjury) return 'No injury';
    
    const injury = case_.faceInjury;
    
    const mappings: { [key: string]: string } = {
      // Database values -> Specification format
      'Soft tissue lacerations': 'Minor (All Other Injuries)',
      'Nasal fracture': 'Moderate: LeFort I Fracture or LeFort II Fracture',
      
      // Fallback for numbered format if it exists
      '1 - No Injury: - No injury': 'No injury',
      '2 - Minor: - All Other Injuries': 'Minor (All Other Injuries)',
      '3 - Moderate: - Simple facial fractures without displacement': 'Moderate: LeFort I Fracture or LeFort II Fracture',
      '3 - Moderate: - Minor eye/ear/nose injuries with normal function': 'Moderate: Penetrating face injury tissue loss',
      '4 - Serious: - Complex or displaced facial fractures': 'Serious: LeFort III Fracture',
      '4 - Serious: - Major eye injuries with partial vision loss': 'Serious: Penetrating face injury with major blood loss (more than 20%)',
      '4 - Serious: - Major ear injuries with partial hearing loss': 'Serious: Penetrating face injury with major blood loss (more than 20%)',
      '5 - Severe: - Severe facial deformity requiring reconstruction': 'Severe: Penetrating face injury causing massive distruction to face including both eyes',
      '5 - Severe: - Complete vision loss in one eye': 'Severe: Penetrating face injury causing massive distruction to face including both eyes',
      '5 - Severe: - Complete hearing loss in one ear': 'Severe: Penetrating face injury causing massive distruction to face including both eyes'
    };
    
    return mappings[injury] || 'Minor (All Other Injuries)';
  }

  private getChestInjurySeveritySpec(case_: any): string {
    if (!case_.chestInjury) return 'No injury';
    
    const injury = case_.chestInjury;
    
    const mappings: { [key: string]: string } = {
      // Database values -> Specification format
      'Chest trauma present': 'Minor (All Other Injuries)',
      'Cardiac contusion': 'Severe: Major Heamothorax (More than 1000 cc)',
      
      // Fallback for numbered format if it exists
      '1 - No Injury: - No injury': 'No injury',
      '2 - Minor: - All Other Injuries': 'Minor (All Other Injuries)',
      '3 - Moderate: - Simple rib fractures (1-2 ribs)': 'Moderate: Simple Pneumothorax',
      '3 - Moderate: - Minor pneumothorax without respiratory compromise': 'Moderate: Pneumomeiastinum',
      '3 - Moderate: - Minor lung contusion': 'Moderate: Sternal fracture',
      '4 - Serious: - Multiple rib fractures (3+ ribs)': 'Serious: Hemothorax',
      '4 - Serious: - Hemothorax requiring drainage': 'Serious: Lung contusion',
      '4 - Serious: - Pneumothorax requiring chest tube': 'Serious: Rib fractures with flial chest',
      '4 - Serious: - Thoracic spine fracture without cord involvement': 'Serious: Other named artery injury',
      '5 - Severe: - Flail chest segment': 'Severe: Pneumothorax (50% lung collapse on x-ray)',
      '5 - Severe: - Tension pneumothorax': 'Critical: Tension pneumothorax',
      '5 - Severe: - Cardiac contusion with arrhythmia': 'Severe: Major Heamothorax (More than 1000 cc)',
      '5 - Severe: - Thoracic spine fracture with cord involvement': 'Severe: Aortic injury (intimal tear)',
      '6 - Critical: - Major thoracic vessel injury': 'Severe: Vena Cava injury',
      '6 - Critical: - Tracheal or bronchial tear': 'Severe: Subclavia artery or vein injury or brachiocephalic injury',
      '6 - Critical: - Cardiac rupture with tamponade': 'Critical: Plumonary artery or vein laceration',
      '6 - Critical: - Diaphragmatic rupture with herniation': 'Critical: Coronary artery injury',
      '7 - Unsurvivable: - Complete transection of thoracic aorta': 'Unsurvivable: Heart rupture, multiple lacerations or avulsion',
      '7 - Unsurvivable: - Massive bilateral pulmonary destruction': 'Unsurvivable: Aortic rupture with hemorrhage not confined to mediastinum'
    };
    
    return mappings[injury] || 'Minor (All Other Injuries)';
  }

  private getAbdomenInjurySeveritySpec(case_: any): string {
    if (!case_.abdomenInjury) return 'No injury';
    
    const injury = case_.abdomenInjury;
    
    const mappings: { [key: string]: string } = {
      // Database values -> Specification format
      'Abdominal trauma present': 'Minor (All Other Injuries)',
      'Retroperitoneal hematoma': 'Serious: Kidney laceration (more than 1 cm not reaching the collecting system) or large contusion',
      'Splenic injury': 'Moderate: Spleen laceration less than 3 cm deep',
      
      // Fallback for numbered format if it exists
      '1 - No Injury: - No injury': 'No injury',
      '2 - Minor: - All Other Injuries': 'Minor (All Other Injuries)',
      '3 - Moderate: - Liver laceration <3cm': 'Moderate: Liver laceration less than 3 cm deep',
      '3 - Moderate: - Spleen laceration <3cm': 'Moderate: Spleen laceration less than 3 cm deep',
      '3 - Moderate: - Small bowel/colon injury <50%': 'Moderate: Small bowel, Colon, or rectal injury less than 50% circumference',
      '3 - Moderate: - Kidney laceration <1cm': 'Moderate: Kidney laceration (less than 1 cm not reaching the collecting system) or small contusion',
      '3 - Moderate: - Bladder contusion': 'Moderate: Urinary Bladder Contusion',
      '4 - Serious: - Liver/Spleen laceration >3cm with duct involvement': 'Serious: Liver laceration more than 3 cm deep or with major duct involvment',
      '4 - Serious: - Bowel injury >50%': 'Serious: Small bowel, Colon, or rectal injury more than 50% circumference',
      '4 - Serious: - Kidney laceration >1cm': 'Serious: Kidney laceration (more than 1 cm not reaching the collecting system) or large contusion',
      '4 - Serious: - Vessel rupture': 'Serious: Abdominal named artery or vein intimal tair or laceration (incomplete with mild bleeding)',
      '4 - Serious: - Bladder laceration': 'Serious: Urinary Bladder laceration',
      '5 - Severe: - Liver disruption <75% of lobe': 'Severe: Liver disruption involving less than 75% of the liver lobe',
      '5 - Severe: - Spleen devascularization >25%': 'Severe: Spleen injury causing devascularization of more than 25% of the spleen',
      '5 - Severe: - Massive bowel tissue loss': 'Severe: Anus injury with massive tissue loss',
      '5 - Severe: - Kidney collecting system injury': 'Severe: Kidney laceration extending into the collecting system or main renal vessle injury with contained hematoma',
      '6 - Critical: - Liver disruption >75% of lobe': 'Critical: Liver disruption involving more than 75% of the liver lobe',
      '6 - Critical: - Spleen hilum injury': 'Critical: Spleen hilum injury',
      '6 - Critical: - Kidney hilum avulsion': 'Critical: Kidney hilum avulsion or total distruction',
      '6 - Critical: - Abdominal aortic rupture': 'Critical: Abdominal Aortic rupture with major bleeding',
      '7 - Unsurvivable: - Liver avulsion (complete vascular separation)': 'Unsurvivable: Liver avulsion (Total separation of all vascualr attachments)'
    };
    
    return mappings[injury] || 'Minor (All Other Injuries)';
  }

  private getExtremitiesInjurySeveritySpec(case_: any): string {
    if (!case_.extremitiesInjury) return 'No injury';
    
    const injury = case_.extremitiesInjury;
    
    const mappings: { [key: string]: string } = {
      // Database values -> Specification format
      'Extremity trauma present': 'Minor (All Other Injuries)',
      'Crush injury': 'Serious: Compartment syndrome (upper or lower extremity) with muscle loss',
      'Upper extremity fracture': 'Moderate: Fractures (upper or lower extremity) not open',
      'Femur fracture': 'Moderate: Fractures (upper or lower extremity) not open',
      'Tibia/fibula fracture': 'Moderate: Fractures (upper or lower extremity) not open',
      
      // Fallback for numbered format if it exists
      '1 - No Injury: - No injury': 'No injury',
      '2 - Minor: - All Other Injuries': 'Minor (All Other Injuries)',
      '3 - Moderate: - Fractures (upper/lower extremity) not open': 'Moderate: Fractures (upper or lower extremity) not open',
      '3 - Moderate: - Vascular injury without major blood loss': 'Moderate: Vascualr injury (upper or lower extremity) without major blood loss',
      '3 - Moderate: - Compartment syndrome without muscle loss': 'Moderate: Amputation at wrist or ankle',
      '3 - Moderate: - Amputation at wrist or ankle': 'Moderate: Amputation at wrist or ankle',
      '4 - Serious: - Pelvic Ring Fracture (Open Book)': 'Serious: Pelvic Ring Fracture (Open Book)',
      '4 - Serious: - Open Fractures (upper/lower extremity)': 'Serious: Open Fractures (upper or lower extremity)',
      '4 - Serious: - Vascular injury with major blood loss': 'Serious: Vascualr injury (upper or lower extremity) with major blood loss',
      '4 - Serious: - Compartment syndrome with muscle loss': 'Serious: Compartment syndrome (upper or lower extremity) with muscle loss',
      '4 - Serious: - Amputation below elbow/above wrist': 'Serious: Amputation below the elbow and above the wrist',
      '4 - Serious: - Amputation below knee/above ankle': 'Serious: Amputation below the knee and above the ankle',
      '5 - Severe: - Pelvic Ring Fracture with major bleeding': 'Severe: Pelvic Ring Fracture (Open Book) with major bleeding',
      '5 - Severe: - Amputation above elbow or knee': 'Severe: Amputation above the elbow or knee'
    };
    
    return mappings[injury] || 'Minor (All Other Injuries)';
  }

  private getExternalInjurySeveritySpec(case_: any): string {
    if (!case_.externalInjury) return 'No injury';
    
    const injury = case_.externalInjury;
    
    const mappings: { [key: string]: string } = {
      // Database values -> Specification format
      'Multiple lacerations': 'Minor (All Other Injuries)',
      'Abrasion injuries': 'Minor (All Other Injuries)',
      
      // Fallback for numbered format if it exists
      '1 - No Injury: - No injury': 'No injury',
      '2 - Minor: - All Other Injuries': 'Minor (All Other Injuries)',
      '3 - Moderate: - 2nd or 3rd degree burns involving 10% to 19% of Total Body Surface': 'Moderate: 2nd or 3rd degree burns involving 10% to 19% Total Body Surface',
      '4 - Serious: - Total scalp avulsion or scalp injury with significant blood loss': 'Serious: 2nd or 3rd degree burns involving 20% to 29% Total Body Surface',
      '4 - Serious: - 2nd or 3rd degree burns involving 20% to 29% of Total Body Surface': 'Serious: 2nd or 3rd degree burns involving 20% to 29% Total Body Surface',
      '4 - Serious: - Near drowning without neurological deficit': 'Serious: Near drowning without neurological deficit',
      '5 - Severe: - 2nd or 3rd degree burns involving 30% to 39% of Total Body Surface': 'Severe: 2nd or 3rd degree burns involving 30% to 39% Total Body Surface',
      '5 - Severe: - Near drowning with neurological deficit': 'Critical: Near drowning with neurological deficit',
      '6 - Critical: - 2nd or 3rd degree burns involving 40% to 90% of Total Body Surface': 'Critical: 2nd or 3rd degree burns involving 40% to 90% Total Body Surface',
      '6 - Critical: - Drowning with cardiac arrest': 'Unsurvivable: Drowning with cardiac arrest',
      '7 - Unsurvivable: - 2nd or 3rd degree burns involving most of Total Body Surface': 'Unsurvivable: 2nd or 3rd degree burns involving more than 90% Total Body Surface',
      '7 - Unsurvivable: - Explosion injury affecting the whole body': 'Unsurvivable: Explosion injury affecting whole body (multiple organ injury to brain, thorax, and/or abdomen with loss of one or more limbs)'
    };
    
    return mappings[injury] || 'Minor (All Other Injuries)';
  }

  private getHeadNeckAISScoreSpec(case_: any): number {
    if (!case_.headAndNeckInjury) return 0;
    
    const injury = case_.headAndNeckInjury;
    
    // Map database values directly to AIS scores
    const mappings: { [key: string]: number } = {
      'Head trauma present': 2,
      'Soft tissue injury to head and neck': 2,
      'Concussion with loss of consciousness': 3,
      'Cervical spine injury': 6
    };
    
    return mappings[injury] || 2;
  }

  private getFaceAISScoreSpec(case_: any): number {
    if (!case_.faceInjury) return 0;
    
    const injury = case_.faceInjury;
    
    // Map database values directly to AIS scores
    const mappings: { [key: string]: number } = {
      'Soft tissue lacerations': 2,
      'Nasal fracture': 3
    };
    
    return mappings[injury] || 2;
  }

  private getChestAISScoreSpec(case_: any): number {
    if (!case_.chestInjury) return 0;
    
    const injury = case_.chestInjury;
    
    // Map database values directly to AIS scores
    const mappings: { [key: string]: number } = {
      'Chest trauma present': 2,
      'Cardiac contusion': 5
    };
    
    return mappings[injury] || 2;
  }

  private getAbdomenAISScoreSpec(case_: any): number {
    if (!case_.abdomenInjury) return 0;
    
    const injury = case_.abdomenInjury;
    
    // Map database values directly to AIS scores
    const mappings: { [key: string]: number } = {
      'Abdominal trauma present': 2,
      'Retroperitoneal hematoma': 4,
      'Splenic injury': 3
    };
    
    return mappings[injury] || 2;
  }

  private getExtremitiesAISScoreSpec(case_: any): number {
    if (!case_.extremitiesInjury) return 0;
    
    const injury = case_.extremitiesInjury;
    
    // Map database values directly to AIS scores
    const mappings: { [key: string]: number } = {
      'Extremity trauma present': 2,
      'Crush injury': 4,
      'Upper extremity fracture': 3,
      'Femur fracture': 3,
      'Tibia/fibula fracture': 3
    };
    
    return mappings[injury] || 2;
  }

  private getExternalAISScoreSpec(case_: any): number {
    if (!case_.externalInjury) return 0;
    
    const injury = case_.externalInjury;
    
    // Map database values directly to AIS scores
    const mappings: { [key: string]: number } = {
      'Multiple lacerations': 2,
      'Abrasion injuries': 2
    };
    
    return mappings[injury] || 2;
  }

  private calculateISSScoreSpec(case_: any): number {
    const headNeckAIS = this.getHeadNeckAISScoreSpec(case_);
    const faceAIS = this.getFaceAISScoreSpec(case_);
    const chestAIS = this.getChestAISScoreSpec(case_);
    const abdomenAIS = this.getAbdomenAISScoreSpec(case_);
    const extremitiesAIS = this.getExtremitiesAISScoreSpec(case_);
    const externalAIS = this.getExternalAISScoreSpec(case_);

    // ISS is calculated as the sum of squares of the three highest AIS scores
    const scores = [headNeckAIS, faceAIS, chestAIS, abdomenAIS, extremitiesAIS, externalAIS];
    scores.sort((a, b) => b - a); // Sort in descending order
    
    return (scores[0] * scores[0]) + (scores[1] * scores[1]) + (scores[2] * scores[2]);
  }

  private formatEDDispositionSpec(disposition: string): string {
    switch (disposition) {
      case 'ADMISSION': return 'Admission';
      case 'TRANSFER_TO_HIGHER_CENTER': return 'Transferred to another hospital';
      case 'DISCHARGE': return 'Discharged home';
      case 'DAMA': return 'DAMA (Discharge Against Medical Advice)';
      case 'DEATH': return 'Death in ED';
      default: return 'Admission';
    }
  }

  private calculateSurvivalProbabilitySpec(case_: any): number {
    const iss = this.calculateISSScoreSpec(case_);
    const rts = this.calculateRTSScoreSpec(case_);
    
    // Simplified survival probability calculation
    // Formula: 1/(1+EXP(-(b0 + b1*RTS + b2*ISS + b3*age)))
    const age = case_.patient?.age || 30;
    const b0 = 0.5;
    const b1 = 0.3;
    const b2 = -0.1;
    const b3 = -0.01;
    
    const logit = b0 + (b1 * rts) + (b2 * iss) + (b3 * age);
    const probability = 1 / (1 + Math.exp(-logit));
    
    return Math.round(probability * 10000) / 100; // Return as percentage with 2 decimal places
  }

  private calculateExpectedMortality(case_: any): number {
    const survivalProb = this.calculateSurvivalProbabilitySpec(case_);
    return Math.round((100 - survivalProb) * 100) / 100; // Expected mortality = 100 - survival probability
  }

  private getMinTransferTimeSpec(case_: any): string {
    return '0:00';
  }

  private getMaxTransferTimeSpec(case_: any): string {
    return '0:00';
  }

  private getAverageTransferTimeSpec(case_: any): string {
    return 'No Data';
  }

  private getSeverityAssessmentNumeratorSpec(case_: any): number {
    // Count cases with completed severity assessment (ISS > 0)
    const iss = this.calculateISSScoreSpec(case_);
    return iss > 0 ? 1 : 0;
  }

  private getSeverityAssessmentDenominatorSpec(case_: any): number {
    return 1; // Total cases
  }

  private getSeverityAssessmentPercentageSpec(case_: any): number {
    const numerator = this.getSeverityAssessmentNumeratorSpec(case_);
    const denominator = this.getSeverityAssessmentDenominatorSpec(case_);
    return denominator > 0 ? Math.round((numerator / denominator) * 10000) / 100 : 0;
  }

  private getMortalityNumeratorSpec(case_: any): number {
    return case_.edDisposition === 'DEATH' ? 1 : 0;
  }

  private getMortalityDenominatorSpec(case_: any): number {
    return 1; // Total cases
  }

  private getEDMortalityRateSpec(case_: any): number {
    const numerator = this.getMortalityNumeratorSpec(case_);
    const denominator = this.getMortalityDenominatorSpec(case_);
    return denominator > 0 ? Math.round((numerator / denominator) * 10000) / 100 : 0;
  }

  private getExpectedEDMortalityRateSpec(case_: any): number {
    return this.calculateExpectedMortality(case_);
  }

  private getMortalityComparison(case_: any): string {
    const actual = this.getEDMortalityRateSpec(case_);
    const expected = this.getExpectedEDMortalityRateSpec(case_);
    
    if (actual > expected * 1.5) {
      return 'The quality of care need review';
    } else if (actual < expected * 0.5) {
      return 'Excellent quality of care';
    } else {
      return 'Within expected range';
    }
  }

  private formatDateTimeSpec(date: Date): string {
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const year = date.getFullYear();
    const hours = date.getHours();
    const minutes = date.getMinutes();
    return `${month}/${day}/${year} ${hours}:${minutes.toString().padStart(2, '0')}`;
  }

  private calculateAggregatedKPIs(traumaCases: any[]): any {
    const totalCases = traumaCases.length;
    
    // Calculate severity assessment metrics
    const casesWithSeverityAssessment = traumaCases.filter(case_ => {
      const iss = this.calculateISSScoreSpec(case_);
      return iss > 0;
    }).length;
    
    // Calculate mortality metrics
    const deaths = traumaCases.filter(case_ => case_.edDisposition === 'DEATH').length;
    
    // Calculate transfer time metrics
    const transferTimes: number[] = [];
    traumaCases.forEach(case_ => {
      if (case_.transferDurationMinutes) {
        transferTimes.push(case_.transferDurationMinutes);
      }
    });
    
    const minTransferTime = transferTimes.length > 0 ? Math.min(...transferTimes) : 0;
    const maxTransferTime = transferTimes.length > 0 ? Math.max(...transferTimes) : 0;
    const avgTransferTime = transferTimes.length > 0 ? transferTimes.reduce((a, b) => a + b, 0) / transferTimes.length : 0;
    
    // Calculate expected mortality
    const totalExpectedMortality = traumaCases.reduce((sum, case_) => {
      return sum + this.calculateExpectedMortality(case_);
    }, 0);
    const avgExpectedMortality = totalCases > 0 ? totalExpectedMortality / totalCases : 0;
    
    // Calculate actual mortality rate
    const actualMortalityRate = totalCases > 0 ? (deaths / totalCases) * 100 : 0;
    
    // Determine mortality comparison
    let mortalityComparison = 'Within expected range';
    if (actualMortalityRate > avgExpectedMortality * 1.5) {
      mortalityComparison = 'The quality of care need review';
    } else if (actualMortalityRate < avgExpectedMortality * 0.5) {
      mortalityComparison = 'Excellent quality of care';
    }
    
    return {
      expectedMortality: Math.round(avgExpectedMortality * 100) / 100,
      minTransferTime: this.formatTimeFromMinutes(minTransferTime),
      maxTransferTime: this.formatTimeFromMinutes(maxTransferTime),
      averageTransferTime: transferTimes.length > 0 ? this.formatTimeFromMinutes(avgTransferTime) : 'No Data',
      severityAssessmentNumerator: casesWithSeverityAssessment,
      severityAssessmentDenominator: totalCases,
      severityAssessmentPercentage: totalCases > 0 ? Math.round((casesWithSeverityAssessment / totalCases) * 10000) / 100 : 0,
      mortalityNumerator: deaths,
      mortalityDenominator: totalCases,
      edMortalityRate: Math.round(actualMortalityRate * 100) / 100,
      expectedEDMortalityRate: Math.round(avgExpectedMortality * 100) / 100,
      mortalityComparison: mortalityComparison,
    };
  }

  private formatTimeFromMinutes(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}:${mins.toString().padStart(2, '0')}`;
  }

  private addDataValidation(worksheet: ExcelJS.Worksheet): void {
    // Create a hidden worksheet for validation values
    const workbook = worksheet.workbook;
    let valuesSheet = workbook.getWorksheet('Values');
    if (!valuesSheet) {
      valuesSheet = workbook.addWorksheet('Values');
    }
    valuesSheet.state = 'hidden';

    // Define injury severity options for each body region (using specification format)
    const injuryOptions = {
      headNeck: [
        'No injury',
        'Minor (All Other Injuries)',
        'Moderate: Tiny Epidural, Subdural, or Intracerebral Hematoma',
        'Moderate: Intra-ventricular hemorrhage or subarachnoid hemorrhage',
        'Moderate: Simple undisplaced Skull Fracture',
        'Moderate: Penetrating Neck Injury with tissue loss',
        'Serious: Mild Brain Edema (Compressed ventricles without brain stem cisterns)',
        'Serious: Small Brain Contusion',
        'Serious: Superficial penerating injury to skull (less than 2 cm deep)',
        'Serious: Penetrating Neck Injury with major blood loss (More than 20%)',
        'Severe: Moderate Brain Edema (Compressed ventricles and brain stem cisterns)',
        'Severe: Large Brain Contusion',
        'Severe: Small to Moderate Epidural, Subdural, or Intracerebral Hematoma',
        'Severe: Diffuse Axonal Injury',
        'Severe: Unilateral thrombosis of Head and Neck arteries (Internal carotid, vertibral, or cerebral arteries)',
        'Severe: Open or depressed skull fracture',
        'Critical: Severe Brain Edema (Absent ventricles or brain stem cisterns)',
        'Critical: Massive Brain Contusion',
        'Critical: Large Epidural, Subdural, or Intracerebral Hematoma',
        'Critical: Brain stem compression, herniation, infarction, or injury)',
        'Critical: Major penerating injury to skull (more than 2 cm deep)',
        'Critical: Unilateral laceration of Head and Neck arteries (Internal carotid, vertibral, or cerebral arteries)',
        'Critical: Basilar artery injury (Laceration, thrombosis, occlusion, or traumatic aneurysm)',
        'Critical: Bilateral thrombosis of Head and Neck arteries',
        'Critical: C4 or below causing complete cord transection or contusion',
        'Unsurvivable: Massive destruction of skull and brain',
        'Unsurvivable: Brain stem laceration, massive destruction, penetration or transection',
        'Unsurvivable: Bilateral Laceration of Internal carotid or vertibral arteries',
        'Unsurvivable: C3 or higher causing complete cord transection or contusion'
      ],
      face: [
        'No injury',
        'Minor (All Other Injuries)',
        'Moderate: LeFort I Fracture or LeFort II Fracture',
        'Moderate: Penetrating face injury tissue loss',
        'Serious: LeFort III Fracture',
        'Serious: Penetrating face injury with major blood loss (more than 20%)',
        'Severe: Penetrating face injury causing massive destruction to face including both eyes'
      ],
      chest: [
        'No injury',
        'Minor (All Other Injuries)',
        'Moderate: Simple Pneumothorax',
        'Moderate: Pneumomeiastinum',
        'Moderate: Sternal fracture',
        'Moderate: Other named vein injury',
        'Serious: Hemothorax',
        'Serious: Lung contusion',
        'Serious: Rib fractures with flial chest',
        'Serious: Other named artery injury',
        'Serious: Diaphragmatic laceration (Less than 10 cm)',
        'Severe: Pneumothorax (50% lung collapse on x-ray)',
        'Severe: Major Heamothorax (More than 1000 cc)',
        'Severe: Aortic injury (intimal tear)',
        'Severe: Vena Cava injury',
        'Severe: Subclavia artery or vein injury or brachiocephalic injury',
        'Severe: Diaphragmatic rupture (More than 10 cm) with/without herniation',
        'Critical: Tension pneumothorax',
        'Critical: Aortic rupture with hemorrhage confined to mediastinum or with involvment of the aortic root/ aortic valve',
        'Critical: Plumonary artery or vein laceration',
        'Critical: Coronary artery injury',
        'Unsurvivable: Heart rupture, multiple lacerations or avulsion',
        'Unsurvivable: Massive Chest Crush (Bilateral Destruction of Skeletal, Vascular, and Organ Systems',
        'Unsurvivable: Aortic rupture with hemorrhage not confined to mediastinum',
        'Unsurvivable: Bilateral plumonary artery or vein laceration'
      ],
      abdomen: [
        'No injury',
        'Minor (All Other Injuries)',
        'Moderate: Liver laceration less than 3 cm deep',
        'Moderate: Spleen laceration less than 3 cm deep',
        'Moderate: Kidney laceration (less than 1 cm not reaching the collecting system) or small contusion',
        'Moderate: Small bowel, Colon, or rectal injury less than 50% circumference',
        'Moderate: Anus injury partial thickness',
        'Moderate: Urinary Bladder Contusion',
        'Serious: Liver laceration more than 3 cm deep or with major duct involvment',
        'Serious: Spleen laceration more than 3 cm deep',
        'Serious: Kidney laceration (more than 1 cm not reaching the collecting system) or large contusion',
        'Serious: Small bowel, Colon, or rectal injury more than 50% circumference',
        'Serious: Anus perforation full thickness',
        'Serious: Urinary Bladder laceration',
        'Serious: Abdominal named artery or vein intimal tair or laceration (incomplete with mild bleeding)',
        'Severe: Liver disruption involving less than 75% of the liver lobe',
        'Severe: Spleen injury causing devascularization of more than 25% of the spleen',
        'Severe: Kidney laceration extending into the collecting system or main renal vessle injury with contained hematoma',
        'Severe: Abdominal named artery or vein major rupture, transection, major bleeding',
        'Severe: Abdominal Aortic intimal tair or laceration (incomplete with mild bleeding)',
        'Severe: Anus injury with massive tissue loss',
        'Severe: Urinary Bladder injury including the trigone',
        'Critical: Liver disruption involving more than 75% of the liver lobe',
        'Critical: Spleen hilum injury',
        'Critical: Kidney hilum avulsion or total distruction',
        'Critical: Abdominal Aortic rupture with major bleeding',
        'Unsurvivable: Liver avulsion (Total separation of all vascualr attachments)',
        'Unsurvivable: Abdominal Aortic rupture with major bleeding'
      ],
      extremities: [
        'No injury',
        'Minor (All Other Injuries)',
        'Moderate: Fractures (upper or lower extremity) not open',
        'Moderate: Vascualr injury (upper or lower extremity) without major blood loss',
        'Moderate: Amputation at wrist or ankle',
        'Serious: Pelvic Ring Fracture (Open Book)',
        'Serious: Open Fractures (upper or lower extremity)',
        'Serious: Vascualr injury (upper or lower extremity) with major blood loss',
        'Serious: Compartment syndrome (upper or lower extremity) without muscle loss',
        'Serious: Compartment syndrome (upper or lower extremity) with muscle loss',
        'Serious: Amputation below the elbow and above the wrist',
        'Serious: Amputation below the knee and above the ankle',
        'Severe: Pelvic Ring Fracture (Open Book) with major bleeding',
        'Severe: Amputation above the elbow or knee'
      ],
      external: [
        'No injury',
        'Minor (All Other Injuries)',
        'Moderate: 2nd or 3rd degree burns involving 10% to 19% Total Body Surface',
        'Serious: 2nd or 3rd degree burns involving 20% to 29% Total Body Surface',
        'Serious: Near drowning without neurological deficit',
        'Severe: 2nd or 3rd degree burns involving 30% to 39% Total Body Surface',
        'Critical: 2nd or 3rd degree burns involving 40% to 90% Total Body Surface',
        'Critical: Near drowning with neurological deficit',
        'Unsurvivable: 2nd or 3rd degree burns involving more than 90% Total Body Surface',
        'Unsurvivable: Explosion injury affecting whole body (multiple organ injury to brain, thorax, and/or abdomen with loss of one or more limbs)',
        'Unsurvivable: Drowning with cardiac arrest'
      ]
    };

    // Helper to write options to the hidden sheet and return the range formula
    const writeOptions = (colIndex: number, options: string[]): string => {
      const colLetter = valuesSheet.getColumn(colIndex).letter;
      options.forEach((option, idx) => {
        valuesSheet.getCell(idx + 1, colIndex).value = option;
      });
      return `Values!$${colLetter}$1:$${colLetter}$${options.length}`;
    };

    // Mapping for injury columns in the exported sheet
    const injuryColumns = [
      { col: 17, options: injuryOptions.headNeck, updateValuesCol: 1 }, // Q - Head and Neck
      { col: 18, options: injuryOptions.face, updateValuesCol: 2 },     // R - Face
      { col: 19, options: injuryOptions.chest, updateValuesCol: 3 },    // S - Chest
      { col: 20, options: injuryOptions.abdomen, updateValuesCol: 4 },  // T - Abdomen
      { col: 21, options: injuryOptions.extremities, updateValuesCol: 5 }, // U - Extremities
      { col: 22, options: injuryOptions.external, updateValuesCol: 6 }  // V - External
    ];

    injuryColumns.forEach(({ col, options, updateValuesCol }) => {
      // Write options to hidden sheet and get the reference
      const formula = writeOptions(updateValuesCol, options);

      // Apply validation to all data rows (skip header row)
      for (let row = 2; row <= 1000; row++) { // Allow up to 1000 rows
        const cellAddress = `${worksheet.getColumn(col).letter}${row}`;
        worksheet.getCell(cellAddress).dataValidation = {
          type: 'list',
          allowBlank: true,
          formulae: [formula],
          showErrorMessage: true,
          errorTitle: 'Invalid Selection',
          error: 'Please select a valid injury severity from the dropdown list.',
          showInputMessage: true,
          promptTitle: 'Select Injury Severity',
          prompt: 'Choose the most severe injury from the dropdown list.'
        };
      }
    });

    // Add validation for other categorical fields
    const modeOfArrivalOptions = [
      'By Red crescent',
      'By Private car/walk-in',
      'Transferred from another hospital'
    ];

    const mechanismOptions = [
      'Blunt',
      'Penetrating'
    ];

    const dispositionOptions = [
      'Admission',
      'Transferred to another hospital',
      'Discharged home',
      'DAMA (Discharge Against Medical Advice)',
      'Death in ED'
    ];

    // Write these options to the hidden sheet as well (columns 7, 8, 9)
    const modeOfArrivalFormula = writeOptions(7, modeOfArrivalOptions);
    const mechanismFormula = writeOptions(8, mechanismOptions);
    const dispositionFormula = writeOptions(9, dispositionOptions);

    // Mode of Arrival (column E)
    for (let row = 2; row <= 1000; row++) {
      const cellAddress = `E${row}`;
      worksheet.getCell(cellAddress).dataValidation = {
        type: 'list',
        allowBlank: true,
        formulae: [modeOfArrivalFormula],
        showErrorMessage: true,
        errorTitle: 'Invalid Selection',
        error: 'Please select a valid mode of arrival.',
        showInputMessage: true,
        promptTitle: 'Select Mode of Arrival',
        prompt: 'Choose the mode of arrival from the dropdown list.'
      };
    }

    // Mechanism of Trauma (column I)
    for (let row = 2; row <= 1000; row++) {
      const cellAddress = `I${row}`;
      worksheet.getCell(cellAddress).dataValidation = {
        type: 'list',
        allowBlank: true,
        formulae: [mechanismFormula],
        showErrorMessage: true,
        errorTitle: 'Invalid Selection',
        error: 'Please select a valid mechanism of trauma.',
        showInputMessage: true,
        promptTitle: 'Select Mechanism of Trauma',
        prompt: 'Choose the mechanism of trauma from the dropdown list.'
      };
    }

    // ED Disposition (column AD)
    for (let row = 2; row <= 1000; row++) {
      const cellAddress = `AD${row}`;
      worksheet.getCell(cellAddress).dataValidation = {
        type: 'list',
        allowBlank: true,
        formulae: [dispositionFormula],
        showErrorMessage: true,
        errorTitle: 'Invalid Selection',
        error: 'Please select a valid ED disposition.',
        showInputMessage: true,
        promptTitle: 'Select ED Disposition',
        prompt: 'Choose the ED disposition from the dropdown list.'
      };
    }
  }
}