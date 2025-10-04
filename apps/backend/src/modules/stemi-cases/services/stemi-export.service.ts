import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import * as ExcelJS from 'exceljs';

@Injectable()
export class StemiExportService {
  constructor(private readonly prisma: PrismaService) {}

  async exportStemiCasesToExcel(filters?: any) {
    // Get all STEMI cases with related data
    const stemiCases = await this.prisma.stemiCase.findMany({
      select: {
        id: true,
        modeOfArrival: true,
        thrombolyticGiven: true,
        pciType: true,
        triageTime: true,
        firstEcgTime: true,
        thrombolyticAdminTime: true,
        doorOutTime: true,
        balloonInflationTime: true,
        pciProcedureStartTime: true,
        pathwayStarted: true,
        createdAt: true,
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            nationalId: true,
            age: true,
            gender: true,
          }
        },
        originHospital: {
          select: {
            id: true,
            name: true,
            cluster: true,
            hasCardiologyCenter: true,
          }
        },
        destinationHospital: {
          select: {
            id: true,
            name: true,
            cluster: true,
            hasCardiologyCenter: true,
          }
        },
        ticket: {
          select: {
            id: true,
            ticketNumber: true,
            createdAt: true,
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Create Excel workbook
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('STEMI Cases');

    // Define headers
    const headers = [
      'Date of admission',
      'Patient ID (National ID or IQAMA Numer or Passport)',
      'Gender',
      'Age',
      'Mode of arrival',
      'Referred From Hospital',
      'Triage Time (hh:mm)',
      'Time of first ECG (hh:mm)',
      'Did the patient given bolus thrombolytic medication',
      'Time of thrombolytic administration (hh:mm)',
      'Door out time (hh:mm)',
      'Time of 1st PCI began (hh:mm)',
      'PCI location',
      'Facility name',
      '', // Empty column
      'Cluster name',
      '1-Door to ECG',
      '1-Door to Needle',
      '1-Door Out time',
      '1-Door to Balloon (1ry PCI)',
      'Door to ECG',
      'Door to Needle',
      'Door (In-Out) time',
      'Door to Balloon',
      'Door to ECG 2',
      'Door to Needle 2',
      'Door (In-Out) time',
      'Door to Balloon (1ry PCI)',
      'Mode of arrival: By ambulance',
      'Mode of arrival: By private car',
      'Mode of arrival: Transferred',
      'Validity: Date of admission',
      'Validity: Pt ID',
      '', // Empty column
      'Validity: Age',
      '', // Empty column
      'Given FIBRONOLYTICS?',
      'Arrived by Ambulance or car',
      'Arrived by Ambulance or car AND candidate for Fibrinolysis',
      'PCI capable',
      'Non-PCI capable',
      'Door to Balloon for Transferred patients',
    ];

    // Add headers
    worksheet.addRow(headers);

    // Style the header row
    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    };

    // Add data rows
    stemiCases.forEach((case_, index) => {
      const patient = case_.patient;
      const originHospital = case_.originHospital;
      const destinationHospital = case_.destinationHospital;

      worksheet.addRow({
        'Date of admission': this.formatDate(case_.pathwayStarted || case_.createdAt),
        'Patient ID (National ID or IQAMA Numer or Passport)': patient.nationalId || '',
        'Gender': patient.gender || '',
        'Age': patient.age || 0,
        'Mode of arrival': this.formatModeOfArrival(case_.modeOfArrival),
        'Referred From Hospital': this.formatReferredFromHospital(originHospital?.name),
        'Triage Time (hh:mm)': this.formatTime(case_.triageTime),
        'Time of first ECG (hh:mm)': this.formatTime(case_.firstEcgTime),
        'Did the patient given bolus thrombolytic medication': case_.thrombolyticGiven ? 'Yes' : 'No',
        'Time of thrombolytic administration (hh:mm)': this.formatTime(case_.thrombolyticAdminTime),
        'Door out time (hh:mm)': this.formatTime(case_.doorOutTime),
        'Time of 1st PCI began (hh:mm)': this.formatTime(case_.pciProcedureStartTime),
        'PCI location': this.formatPciLocation(destinationHospital?.name),
        'Facility name': originHospital?.name || '',
        '': '',
        'Cluster name': originHospital?.cluster || '',
        '1-Door to ECG': this.calculateDoorToEcg(case_),
        '1-Door to Needle': this.calculateDoorToNeedle(case_),
        '1-Door Out time': this.calculateDoorOutTime(case_),
        '1-Door to Balloon (1ry PCI)': this.calculateDoorToBalloon(case_),
        'Door to ECG': this.calculateDoorToEcg(case_),
        'Door to Needle': this.calculateDoorToNeedle(case_),
        'Door (In-Out) time': this.calculateDoorOutTime(case_),
        'Door to Balloon': this.calculateDoorToBalloon(case_),
        'Door to ECG 2': this.calculateDoorToEcg(case_),
        'Door to Needle 2': this.calculateDoorToNeedle(case_),
        'Door (In-Out) time 2': this.calculateDoorOutTime(case_),
        'Door to Balloon (1ry PCI)': this.calculateDoorToBalloon(case_),
        'Mode of arrival: By ambulance': this.isModeByAmbulance(case_.modeOfArrival) ? 'Yes' : 'No',
        'Mode of arrival: By private car': this.isModeByPrivateCar(case_.modeOfArrival) ? 'Yes' : 'No',
        'Mode of arrival: Transferred': this.isModeTransferred(case_.modeOfArrival) ? 'Yes' : 'No',
        'Validity: Date of admission': this.validateDate(case_.pathwayStarted || case_.createdAt),
        'Validity: Pt ID': this.validatePatientId(patient.nationalId),
        '': '',
        'Validity: Age': this.validateAge(patient.age),
        '': '',
        'Given FIBRONOLYTICS?': case_.thrombolyticGiven ? 'Yes' : 'No',
        'Arrived by Ambulance or car': this.isArrivedByAmbulanceOrCar(case_.modeOfArrival) ? 'Yes' : 'No',
        'Arrived by Ambulance or car AND candidate for Fibrinolysis': this.isCandidateForFibrinolysis(case_) ? 'Yes' : 'No',
        'PCI capable': originHospital?.hasCardiologyCenter ? 'Yes' : 'No',
        'Non-PCI capable': !originHospital?.hasCardiologyCenter ? 'Yes' : 'No',
        'Door to Balloon for Transferred patients': this.isModeTransferred(case_.modeOfArrival) ? this.calculateDoorToBalloon(case_) : '',
      });

      // Add alternating row colors
      if (index % 2 === 1) {
        const row = worksheet.getRow(index + 2);
        row.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFF8F8F8' }
        };
      }
    });

    // Set column widths
    worksheet.columns = [
      { width: 15 }, // Date of admission
      { width: 30 }, // Patient ID
      { width: 10 }, // Gender
      { width: 8 },  // Age
      { width: 20 }, // Mode of arrival
      { width: 25 }, // Referred From Hospital
      { width: 15 }, // Triage Time
      { width: 20 }, // Time of first ECG
      { width: 35 }, // Did the patient given bolus thrombolytic medication
      { width: 25 }, // Time of thrombolytic administration
      { width: 15 }, // Door out time
      { width: 20 }, // Time of 1st PCI began
      { width: 15 }, // PCI location
      { width: 25 }, // Facility name
      { width: 5 },  // Empty column
      { width: 15 }, // Cluster name
      { width: 15 }, // 1-Door to ECG
      { width: 15 }, // 1-Door to Needle
      { width: 15 }, // 1-Door Out time
      { width: 20 }, // 1-Door to Balloon
      { width: 15 }, // Door to ECG
      { width: 15 }, // Door to Needle
      { width: 15 }, // Door (In-Out) time
      { width: 15 }, // Door to Balloon
      { width: 15 }, // Door to ECG 2
      { width: 15 }, // Door to Needle 2
      { width: 15 }, // Door (In-Out) time
      { width: 20 }, // Door to Balloon (1ry PCI)
      { width: 25 }, // Mode of arrival: By ambulance
      { width: 25 }, // Mode of arrival: By private car
      { width: 25 }, // Mode of arrival: Transferred
      { width: 20 }, // Validity: Date of admission
      { width: 15 }, // Validity: Pt ID
      { width: 5 },  // Empty column
      { width: 15 }, // Validity: Age
      { width: 5 },  // Empty column
      { width: 20 }, // Given FIBRONOLYTICS?
      { width: 25 }, // Arrived by Ambulance or car
      { width: 35 }, // Arrived by Ambulance or car AND candidate for Fibrinolysis
      { width: 15 }, // PCI capable
      { width: 15 }, // Non-PCI capable
      { width: 25 }, // Door to Balloon for Transferred patients
    ];

    // Add data validation
    this.addDataValidation(worksheet);

    // Generate Excel buffer
    const buffer = await workbook.xlsx.writeBuffer();

    return {
      buffer,
      filename: `stemi-cases-export-${new Date().toISOString().split('T')[0]}.xlsx`,
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    };
  }

  private formatModeOfArrival(modeOfArrival: string | null): string {
    const modeMap: { [key: string]: string } = {
      'AMBULANCE': 'By Red crescent',
      'PRIVATE_CAR': 'By Private car/walk-in',
      'TRANSFERRED_FROM_ANOTHER_HOSPITAL': 'Transferred from another hospital',
      'TRANSFERRED_FROM_HOSPITAL': 'Transferred from another hospital',
      'WALK_IN': 'By Private car/walk-in',
      'PRIVATE_VEHICLE': 'By Private car/walk-in',
    };
    return modeOfArrival ? (modeMap[modeOfArrival] || modeOfArrival) : '';
  }

  private formatReferredFromHospital(hospitalName: string): string {
    return hospitalName || '';
  }

  private calculateDoorToEcg(case_: any): string {
    const startTime = case_.pathwayStarted || case_.createdAt;
    const ecgTime = case_.firstEcgTime;
    
    if (!ecgTime) return '';
    
    return this.calculateTransferTime(startTime, ecgTime);
  }

  private calculateDoorToNeedle(case_: any): string {
    const startTime = case_.pathwayStarted || case_.createdAt;
    const needleTime = case_.thrombolyticAdminTime;
    
    if (!needleTime) return '';
    
    return this.calculateTransferTime(startTime, needleTime);
  }

  private calculateDoorOutTime(case_: any): string {
    const startTime = case_.pathwayStarted || case_.createdAt;
    const doorOutTime = case_.doorOutTime;
    
    if (!doorOutTime) return '';
    
    return this.calculateTransferTime(startTime, doorOutTime);
  }

  private calculateDoorToBalloon(case_: any): string {
    const startTime = case_.pathwayStarted || case_.createdAt;
    const balloonTime = case_.balloonInflationTime || case_.pciProcedureStartTime;
    
    if (!balloonTime) return '';
    
    return this.calculateTransferTime(startTime, balloonTime);
  }

  private isModeByAmbulance(modeOfArrival: string | null): boolean {
    return modeOfArrival === 'AMBULANCE';
  }

  private isModeByPrivateCar(modeOfArrival: string | null): boolean {
    return modeOfArrival === 'PRIVATE_CAR' || modeOfArrival === 'PRIVATE_VEHICLE' || modeOfArrival === 'WALK_IN';
  }

  private isModeTransferred(modeOfArrival: string | null): boolean {
    return modeOfArrival === 'TRANSFERRED_FROM_ANOTHER_HOSPITAL' || modeOfArrival === 'TRANSFERRED_FROM_HOSPITAL';
  }

  private isArrivedByAmbulanceOrCar(modeOfArrival: string | null): boolean {
    return this.isModeByAmbulance(modeOfArrival) || this.isModeByPrivateCar(modeOfArrival);
  }

  private isCandidateForFibrinolysis(case_: any): boolean {
    const arrivedByAmbulanceOrCar = this.isArrivedByAmbulanceOrCar(case_.modeOfArrival);
    const thrombolyticGiven = case_.thrombolyticGiven;
    
    return arrivedByAmbulanceOrCar && thrombolyticGiven;
  }

  private formatPciLocation(hospitalName: string | undefined): string {
    return hospitalName || '';
  }

  private calculateTransferTime(startTime: Date, endTime: Date): string {
    if (!startTime || !endTime) return '';
    
    const diffMs = new Date(endTime).getTime() - new Date(startTime).getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const hours = Math.floor(diffMins / 60);
    const minutes = diffMins % 60;
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  }

  private calculateAverageTransferTime(cases: any[]): string {
    if (cases.length === 0) return '';
    
    const totalMinutes = cases.reduce((sum, case_) => {
      const startTime = case_.pathwayStarted || case_.createdAt;
      const endTime = case_.doorOutTime;
      
      if (!startTime || !endTime) return sum;
      
      const diffMs = new Date(endTime).getTime() - new Date(startTime).getTime();
      return sum + Math.floor(diffMs / (1000 * 60));
    }, 0);
    
    const avgMinutes = Math.round(totalMinutes / cases.length);
    const hours = Math.floor(avgMinutes / 60);
    const minutes = avgMinutes % 60;
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  }

  private countCompletedSeverityAssessments(cases: any[]): number {
    // Count cases with completed outcome forms
    return cases.filter(case_ => case_.outcomeFormCompleted).length;
  }

  private calculateSeverityAssessmentPercentage(cases: any[]): number {
    if (cases.length === 0) return 0;
    return Math.round((this.countCompletedSeverityAssessments(cases) / cases.length) * 100);
  }

  private countWeeklyDeaths(cases: any[]): number {
    // Count cases with death outcome
    return cases.filter(case_ => case_.outcome === 'DEATH').length;
  }

  private calculateActualMortalityRate(cases: any[]): number {
    if (cases.length === 0) return 0;
    return Math.round((this.countWeeklyDeaths(cases) / cases.length) * 100);
  }

  private calculateExpectedMortalityRate(cases: any[]): number {
    if (cases.length === 0) return 0;
    
    const totalExpectedMortality = cases.reduce((sum, case_) => {
      return sum + this.calculateExpectedMortality(case_);
    }, 0);
    
    return Math.round(totalExpectedMortality / cases.length);
  }

  private calculateMortalityComparison(cases: any[]): string {
    const actual = this.calculateActualMortalityRate(cases);
    const expected = this.calculateExpectedMortalityRate(cases);
    
    if (actual === expected) return 'As Expected';
    if (actual > expected) return 'Higher than Expected';
    return 'Lower than Expected';
  }

  private calculateTimeDifference(startTime: Date, endTime: Date): number {
    if (!startTime || !endTime) return 0;
    
    const diffMs = new Date(endTime).getTime() - new Date(startTime).getTime();
    return Math.floor(diffMs / (1000 * 60)); // Return difference in minutes
  }

  private formatDate(date: Date): string {
    if (!date) return '';
    
    const d = new Date(date);
    const day = d.getDate().toString().padStart(2, '0');
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const year = d.getFullYear();
    
    return `${day}/${month}/${year}`;
  }

  private formatTime(date: Date | null): string {
    if (!date) return '';
    
    const d = new Date(date);
    const hours = d.getHours().toString().padStart(2, '0');
    const minutes = d.getMinutes().toString().padStart(2, '0');
    
    return `${hours}:${minutes}`;
  }

  private validateDate(date: Date): string {
    if (!date) return 'Invalid';
    
    const d = new Date(date);
    const now = new Date();
    
    // Check if date is valid and not in the future
    if (isNaN(d.getTime()) || d > now) return 'Invalid';
    
    return 'Valid';
  }

  private validatePatientId(nationalId: string | null): string {
    if (!nationalId || nationalId.trim() === '') return 'Invalid';
    
    // Basic validation - should be non-empty string
    return nationalId.trim().length > 0 ? 'Valid' : 'Invalid';
  }

  private validateAge(age: number | null): string {
    if (age === null || age === undefined) return 'Invalid';
    
    // Age should be between 0 and 150
    return (age >= 0 && age <= 150) ? 'Valid' : 'Invalid';
  }

  private calculateSurvivalProbability(case_: any): number {
    // Placeholder for survival probability calculation
    // This would typically involve complex medical algorithms
    return Math.random() * 100; // Placeholder
  }

  private calculateExpectedMortality(case_: any): number {
    // Placeholder for expected mortality calculation
    // This would typically involve complex medical algorithms
    return Math.random() * 10; // Placeholder
  }

  private addDataValidation(worksheet: ExcelJS.Worksheet): void {
    // Add data validation for mode of arrival
    const modeOfArrivalOptions = [
      'By Red crescent',
      'By Private car/walk-in',
      'Transferred from another hospital'
    ];

    // Add validation for mode of arrival column (E - column 5)
    for (let row = 2; row <= 1000; row++) {
      const cellAddress = `E${row}`;
      worksheet.getCell(cellAddress).dataValidation = {
        type: 'list',
        allowBlank: true,
        formulae: [modeOfArrivalOptions.map(option => `"${option.replace(/"/g, '""')}"`).join(',')],
        showErrorMessage: true,
        errorTitle: 'Invalid Selection',
        error: 'Please select a valid mode of arrival from the dropdown list.',
        showInputMessage: true,
        promptTitle: 'Select Mode of Arrival',
        prompt: 'Choose the patient\'s mode of arrival from the dropdown list.'
      };
    }

    // Add validation for Yes/No columns
    const yesNoColumns = [
      { col: 'I', name: 'Did the patient given bolus thrombolytic medication' }, // Column I
      { col: 'U', name: 'Mode of arrival: By ambulance' }, // Column U
      { col: 'V', name: 'Mode of arrival: By private car' }, // Column V
      { col: 'W', name: 'Mode of arrival: Transferred' }, // Column W
      { col: 'AB', name: 'Given FIBRONOLYTICS?' }, // Column AB
      { col: 'AC', name: 'Arrived by Ambulance or car' }, // Column AC
      { col: 'AD', name: 'Arrived by Ambulance or car AND candidate for Fibrinolysis' }, // Column AD
      { col: 'AE', name: 'PCI capable' }, // Column AE
      { col: 'AF', name: 'Non-PCI capable' }, // Column AF
    ];

    const yesNoOptions = ['Yes', 'No'];

    yesNoColumns.forEach(({ col }) => {
      for (let row = 2; row <= 1000; row++) {
        const cellAddress = `${col}${row}`;
        worksheet.getCell(cellAddress).dataValidation = {
          type: 'list',
          allowBlank: true,
          formulae: [yesNoOptions.map(option => `"${option.replace(/"/g, '""')}"`).join(',')],
          showErrorMessage: true,
          errorTitle: 'Invalid Selection',
          error: 'Please select Yes or No from the dropdown list.',
          showInputMessage: true,
          promptTitle: 'Select Yes/No',
          prompt: 'Choose Yes or No from the dropdown list.'
        };
      }
    });

    // Add validation for validity columns
    const validityColumns = [
      { col: 'X', name: 'Validity: Date of admission' }, // Column X
      { col: 'Y', name: 'Validity: Pt ID' }, // Column Y
      { col: 'AA', name: 'Validity: Age' }, // Column AA
    ];

    const validityOptions = ['Valid', 'Invalid'];

    validityColumns.forEach(({ col }) => {
      for (let row = 2; row <= 1000; row++) {
        const cellAddress = `${col}${row}`;
        worksheet.getCell(cellAddress).dataValidation = {
          type: 'list',
          allowBlank: true,
          formulae: [validityOptions.map(option => `"${option.replace(/"/g, '""')}"`).join(',')],
          showErrorMessage: true,
          errorTitle: 'Invalid Selection',
          error: 'Please select Valid or Invalid from the dropdown list.',
          showInputMessage: true,
          promptTitle: 'Select Validity',
          prompt: 'Choose Valid or Invalid from the dropdown list.'
        };
      }
    });
  }
}