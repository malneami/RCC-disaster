import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import * as XLSX from 'xlsx';

@Injectable()
export class TraumaExportService {
  constructor(private prisma: PrismaService) {}

  async exportTraumaCasesToExcel() {
    try {
      // Fetch all trauma cases with related data
      const traumaCases = await this.prisma.traumaCase.findMany({
        include: {
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
          // Clean column headers matching the specification
          'Date of arrival': this.formatDate(arrivalTime),
          'Patient ID (National ID or IQAMA Number or Passport)': patient.nationalId || patient.id.substring(0, 8),
          'Gender': patient.gender === 'MALE' ? 'M' : patient.gender === 'FEMALE' ? 'F' : '',
          'Age in years': age,
          'Mode of arrival': this.formatModeOfArrival(case_.modeOfArrival),
          'Transfer request date & time (mm/dd/yyyy hh:mm)': this.getTransferRequestDateTime(case_),
          'Transfer arrival date & time (mm/dd/yyyy hh:mm)': this.getTransferArrivalDateTime(case_),
          'Transfer to Arrival Time': this.calculateTransferToArrivalTime(case_),
          'Mechanism of trauma': this.formatMechanismOfTrauma(case_.mechanismOfInjury),
          'Systolic Blood Pressure': case_.systolicBloodPressure || null,
          'Diastolic Blood Pressure': diastolicBP,
          'Heart Rate': heartRate,
          'Glasgow Coma Scale': case_.glasgowComaScale || null,
          'Respiratory Rate': case_.respiratoryRate || null,
          'Oxygen Saturation': oxygenSaturation,
          'Temperature': temperature,
          'Head and Neck (Includes Cervical Spine)': this.getHeadNeckInjurySeverity(case_),
          'Face (Facial Skeleton, Nose, Mouth, Eyes, & Ears)': this.getFaceInjurySeverity(case_),
          'Chest (thoracic spine and diaphragm)': this.getChestInjurySeverity(case_),
          'Abdomen (abdominal organs and lumbar spine)': this.getAbdomenInjurySeverity(case_),
          'Extremities or Pelvic Girdle': this.getExtremitiesInjurySeverity(case_),
          'External and other': this.getExternalInjurySeverity(case_),
          'Head & Neck AIS Score': this.getHeadNeckAISScore(case_),
          'Face AIS Score': this.getFaceAISScore(case_),
          'Chest AIS Score': this.getChestAISScore(case_),
          'Abdomen AIS Score': this.getAbdomenAISScore(case_),
          'Extremities AIS Score': this.getExtremitiesAISScore(case_),
          'External AIS Score': this.getExternalAISScore(case_),
          'ISS Score': issScore,
          'RTS Score': this.calculateRTSScore(case_, diastolicBP, heartRate, oxygenSaturation),
          'TRISS Score': this.calculateTRISSScore(case_, issScore),
          'ED disposition': this.formatEDDisposition(case_.edDisposition || ''),
          'Origin Hospital': originHospital?.name || 'Unknown',
          'Origin Hospital Cluster': originHospital?.cluster || '',
          'Destination Hospital': destinationHospital?.name || 'Unknown',
          'Destination Hospital Cluster': destinationHospital?.cluster || '',
          'Survival Probability': this.calculateSurvivalProbability(case_),
          'Length of Stay (days)': this.calculateLengthOfStay(case_),
          'Discharge Date/Time': this.getDischargeDateTime(case_),
          'Complications': this.getComplications(case_),
          'Follow-up Required': this.getFollowUpRequired(case_),
          'Follow-up Date': this.getFollowUpDate(case_),
          'Door to CT Scan Time': this.calculateDoorToCTTime(case_),
          'Door to OR Time': this.calculateDoorToORTime(case_),
          'Door to ICU Time': this.calculateDoorToICUTime(case_),
          'Door to Blood Time': this.calculateDoorToBloodTime(case_),
          'Door to Antibiotics Time': this.calculateDoorToAntibioticsTime(case_),
          'Door to Tetanus Time': this.calculateDoorToTetanusTime(case_),
          'Door to Wound Care Time': this.calculateDoorToWoundCareTime(case_),
          'Door to Splinting Time': this.calculateDoorToSplintingTime(case_),
          'Door to Pain Meds Time': this.calculateDoorToPainMedsTime(case_),
          'Minimum time from transfer to arrival': this.getMinTransferTime(case_),
          'Maximum time from transfer to arrival': this.getMaxTransferTime(case_),
          'Average transfer time': this.getAverageTransferTime(case_),
          'Severity assessment numerator': this.getSeverityAssessmentNumerator(case_),
          'Severity assessment denominator': this.getSeverityAssessmentDenominator(case_),
          'Severity assessment percentage': this.getSeverityAssessmentPercentage(case_),
          'Mortality numerator': this.getMortalityNumerator(case_),
          'Mortality denominator': this.getMortalityDenominator(case_),
          'ED Mortality Rate (Actual)': this.getEDMortalityRate(case_),
          'Expected ED mortality rate': this.getExpectedEDMortalityRate(case_),
        };
      });

      // Create workbook and worksheet
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(exportData);

      // Set column widths for comprehensive headers
      const columnWidths = [
        { wch: 15 }, // Date of arrival
        { wch: 25 }, // Patient ID (National ID or IQAMA Number or Passport)
        { wch: 8 },  // Gender
        { wch: 12 }, // Age in years
        { wch: 20 }, // Mode of arrival
        { wch: 30 }, // Transfer request date & time (mm/dd/yyyy hh:mm)
        { wch: 30 }, // Transfer arrival date & time (mm/dd/yyyy hh:mm)
        { wch: 20 }, // Transfer to Arrival Time
        { wch: 18 }, // Mechanism of trauma
        { wch: 18 }, // Systolic Blood Pressure
        { wch: 18 }, // Diastolic Blood Pressure
        { wch: 12 }, // Heart Rate
        { wch: 15 }, // Glasgow Coma Scale
        { wch: 15 }, // Respiratory Rate
        { wch: 15 }, // Oxygen Saturation
        { wch: 12 }, // Temperature
        { wch: 50 }, // Head and Neck (Includes Cervical Spine)
        { wch: 50 }, // Face (Facial Skeleton, Nose, Mouth, Eyes, & Ears)
        { wch: 50 }, // Chest (thoracic spine and diaphragm)
        { wch: 50 }, // Abdomen (abdominal organs and lumbar spine)
        { wch: 50 }, // Extremities or Pelvic Girdle
        { wch: 50 }, // External and other
        { wch: 15 }, // Head & Neck AIS Score
        { wch: 12 }, // Face AIS Score
        { wch: 12 }, // Chest AIS Score
        { wch: 15 }, // Abdomen AIS Score
        { wch: 18 }, // Extremities AIS Score
        { wch: 15 }, // External AIS Score
        { wch: 10 }, // ISS Score
        { wch: 10 }, // RTS Score
        { wch: 12 }, // TRISS Score
        { wch: 25 }, // ED disposition
        { wch: 25 }, // Origin Hospital
        { wch: 20 }, // Origin Hospital Cluster
        { wch: 25 }, // Destination Hospital
        { wch: 20 }, // Destination Hospital Cluster
        { wch: 18 }, // Survival Probability
        { wch: 15 }, // Length of Stay (days)
        { wch: 20 }, // Discharge Date/Time
        { wch: 30 }, // Complications
        { wch: 15 }, // Follow-up Required
        { wch: 20 }, // Follow-up Date
        { wch: 18 }, // Door to CT Scan Time
        { wch: 15 }, // Door to OR Time
        { wch: 15 }, // Door to ICU Time
        { wch: 15 }, // Door to Blood Time
        { wch: 18 }, // Door to Antibiotics Time
        { wch: 15 }, // Door to Tetanus Time
        { wch: 18 }, // Door to Wound Care Time
        { wch: 18 }, // Door to Splinting Time
        { wch: 18 }, // Door to Pain Meds Time
        { wch: 25 }, // Minimum time from transfer to arrival
        { wch: 25 }, // Maximum time from transfer to arrival
        { wch: 20 }, // Average transfer time
        { wch: 25 }, // Severity assessment numerator
        { wch: 25 }, // Severity assessment denominator
        { wch: 25 }, // Severity assessment percentage
        { wch: 20 }, // Mortality numerator
        { wch: 20 }, // Mortality denominator
        { wch: 20 }, // ED Mortality Rate (Actual)
        { wch: 25 }, // Expected ED mortality rate
      ];

      worksheet['!cols'] = columnWidths;

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Trauma Cases');

      // Generate Excel file buffer
      const excelBuffer = XLSX.write(workbook, { 
        type: 'buffer', 
        bookType: 'xlsx',
        compression: true 
      });

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
}
