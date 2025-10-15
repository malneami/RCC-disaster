import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import * as ExcelJS from 'exceljs';

interface StemiCaseData {
  id: string;
  ticketId: string | null;
  pathwayStarted: Date | null;
  modeOfArrival: string | null;
  triageTime: Date | null;
  firstEcgTime: Date | null;
  thrombolyticGiven: boolean | null;
  thrombolyticAdminTime: Date | null;
  doorOutTime: Date | null;
  balloonInflationTime: Date | null;
  pciLocation: string | null;
  doorToEcgMinutes: number | null;
  doorToNeedleMinutes: number | null;
  doorInDoorOutMinutes: number | null;
  doorToBalloonMinutes: number | null;
  createdAt: Date;
  updatedAt: Date;
  createdById: string;
  patient: {
    id: string;
    firstName: string;
    lastName: string;
    nationalId: string | null;
    age: number | null;
    gender: string;
    phoneNumber: string | null;
    email: string | null;
  } | null;
  originHospital: {
    id: string;
    name: string;
    cluster: string;
    hasCardiologyCenter: boolean;
  } | null;
  destinationHospital: {
    id: string;
    name: string;
    cluster: string;
    hasCardiologyCenter: boolean;
  } | null;
}

@Injectable()
export class StemiExportService {
  constructor(private readonly prisma: PrismaService) {}

  async exportStemiCasesToExcel() {
    try {
      // Fetch all STEMI cases with related data
      const stemiCases = await this.prisma.stemiCase.findMany({
        select: {
          id: true,
          ticketId: true,
          pathwayStarted: true,
          modeOfArrival: true,
          triageTime: true,
          firstEcgTime: true,
          thrombolyticGiven: true,
          thrombolyticAdminTime: true,
          doorOutTime: true,
          balloonInflationTime: true,
          pciLocation: true,
          doorToEcgMinutes: true,
          doorToNeedleMinutes: true,
          doorInDoorOutMinutes: true,
          doorToBalloonMinutes: true,
          createdAt: true,
          updatedAt: true,
          createdById: true,
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
            },
          },
          originHospital: {
            select: {
              id: true,
              name: true,
              cluster: true,
              hasCardiologyCenter: true,
            },
          },
          destinationHospital: {
            select: {
              id: true,
              name: true,
              cluster: true,
              hasCardiologyCenter: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      // Transform data for Excel export
      const exportData = stemiCases.map((case_) => this.transformCaseForExport(case_));

      // Calculate aggregated KPI data
      const kpiData = this.calculateAggregatedKPIs(stemiCases);
      
      // Add KPI row after the case data - matching spreadsheet structure (no KPI columns)
      const kpiRow = {
        'Date of admission (dd/mm/yyyy)': '',
        'Patient ID (National ID or IQAMA Number or Passport)': '',
        'Gender': '',
        'Age in years': '',
        'Mode of arrival': '',
        'Referred From Hospital': '',
        'Triage Time (hh:mm)': '',
        'Time of first ECG (hh:mm)': '',
        'Has the patient given intravenous thrombolytic medication?': '',
        'Time of thrombolytic administration (hh:mm)': '',
        'Door out time (hh:mm)': '',
        'Time of 1st PCI began (hh:mm)': '',
        'PCI location': '',
        'Facility name (Origin)': '',
        'Cluster name (Origin)': '',
        'Facility name (Destination)': '',
        'Cluster name (Destination)': '',
        '1-Door to ECG': '',
        '1-Door to Needle': '',
        '1-Door Out time': '',
        '1-Door to Balloon (1ry PCI)': '',
        'Door to ECG': '',
        'Door to Needle': '',
        'Door (In-Out) time': '',
        'Door to Balloon': '',
        'Door to ECG 2': '',
        'Door to Needle 2': '',
        'Door (In-Out) time 2': '',
        'Door to Balloon (1ry PCI)': '',
        'Mode of arrival: By ambulance': '',
        'Mode of arrival: By private car': '',
        'Mode of arrival: Transferred': '',
        'Validity: Date of admission (Valid=1, Blank=2, Invalid=3)': '',
        'Validity: Pt ID (Valid=1, Blank=2, Invalid=3)': '',
        'Validity: Age (Valid=1, Blank=2, Invalid=3)': '',
        'Given FIBRINOLYTICS? (Yes=1, No=0)': '',
        'Arrived by Ambulance or car (Yes=1, No=0)': '',
        'Arrived by Ambulance or car AND candidate for Fibrinolysis (Yes=1, No=0)': '',
        'PCI capable (Yes=1, No=0)': '',
        'Non-PCI capable (Yes=1, No=0)': '',
        'Door to Balloon for Transferred patients (Yes=1, No=0)': '',
      };

      // Combine case data with KPI row
      const allData = [...exportData, kpiRow];

      // Create workbook and worksheet using ExcelJS
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('STEMI Cases');

      // Define headers - matching exact spreadsheet format
      const headers = [
        'Date of admission (dd/mm/yyyy)',
        'Patient ID (National ID or IQAMA Number or Passport)',
        'Gender',
        'Age in years',
        'Mode of arrival',
        'Referred From Hospital',
        'Triage Time (hh:mm)',
        'Time of first ECG (hh:mm)',
        'Has the patient given intravenous thrombolytic medication?',
        'Time of thrombolytic administration (hh:mm)',
        'Door out time (hh:mm)',
        'Time of 1st PCI began (hh:mm)',
        'PCI location',
        'Facility name (Origin)',
        'Cluster name (Origin)',
        'Facility name (Destination)',
        'Cluster name (Destination)',
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
        'Door (In-Out) time 2',
        'Door to Balloon (1ry PCI)',
        'Mode of arrival: By ambulance',
        'Mode of arrival: By private car',
        'Mode of arrival: Transferred',
        'Validity: Date of admission (Valid=1, Blank=2, Invalid=3)',
        'Validity: Pt ID (Valid=1, Blank=2, Invalid=3)',
        'Validity: Age (Valid=1, Blank=2, Invalid=3)',
        'Given FIBRINOLYTICS? (Yes=1, No=0)',
        'Arrived by Ambulance or car (Yes=1, No=0)',
        'Arrived by Ambulance or car AND candidate for Fibrinolysis (Yes=1, No=0)',
        'PCI capable (Yes=1, No=0)',
        'Non-PCI capable (Yes=1, No=0)',
        'Door to Balloon for Transferred patients (Yes=1, No=0)',
      ];

      // Add header row with styling - matching spreadsheet color scheme
      const headerRow = worksheet.addRow(headers);
      headerRow.eachCell((cell, colNumber) => {
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        
        // Color scheme based on column position
        let backgroundColor = 'FF808080'; // Default grey
        
        if (colNumber >= 18 && colNumber <= 32) {
          // Orange section (columns R-AI) - 1-Door to ECG through Mode of arrival: Transferred
          backgroundColor = 'FFFF8C00'; // Orange
        } else if (colNumber >= 33 && colNumber <= 41) {
          // Dark orange section (columns AJ-AQ) - Validity through Door to Balloon for Transferred patients
          backgroundColor = 'FFCC6600'; // Dark orange
        } else {
          // Light grey section (columns A-Q) - Demographics and timestamps
          backgroundColor = 'FF808080'; // Light grey
        }
        
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: backgroundColor }
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

      // Set column widths - updated for 41 columns matching spreadsheet
      const columnWidths = [
        20, 35, 8, 12, 20, 20, 15, 20, 35, 25, 15, 25, 20, 25, 15, 25, 15, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 15, 15, 15, 20, 15, 15, 20, 25, 35, 15, 15, 25
      ];
      
      worksheet.columns.forEach((column, index) => {
        column.width = columnWidths[index] || 15;
      });

      // Add data rows
      allData.forEach((rowData) => {
        const row = worksheet.addRow(Object.values(rowData));
        row.eachCell((cell) => {
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

      // Add data validation (dropdowns) for categorical fields
      this.addDataValidation(worksheet);

      // Generate Excel file buffer
      const excelBuffer = await workbook.xlsx.writeBuffer();

      // Generate filename with timestamp
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `stemi-cases-export-${timestamp}.xlsx`;

      return {
        buffer: excelBuffer,
        filename: filename,
        mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      };

    } catch (error) {
      console.error('Error exporting STEMI cases to Excel:', error);
      throw new Error('Failed to export STEMI cases to Excel');
    }
  }

  private transformCaseForExport(case_: StemiCaseData): Record<string, string | number | null> {
    const admissionDate = case_.pathwayStarted || case_.createdAt;
    const patient = case_.patient;
    const originHospital = case_.originHospital;
    const destinationHospital = case_.destinationHospital;

    // Get patient age
    const age = patient?.age || 0;

    // Mode of arrival calculations
    const modeOfArrival = this.formatModeOfArrival(case_.modeOfArrival || '');
    const modeByAmbulance = case_.modeOfArrival === 'AMBULANCE' ? 1 : 0;
    const modeByPrivateCar = case_.modeOfArrival === 'PRIVATE_VEHICLE' ? 1 : 0;
    const modeTransferred = case_.modeOfArrival === 'TRANSFERRED_FROM_HOSPITAL' ? 1 : 0;

    // Time calculations (in minutes)
    const doorToEcg = case_.doorToEcgMinutes || this.calculateTimeDifference(admissionDate, case_.firstEcgTime);
    const doorToNeedle = case_.doorToNeedleMinutes || this.calculateTimeDifference(admissionDate, case_.thrombolyticAdminTime);
    const doorOutTime = case_.doorInDoorOutMinutes || this.calculateTimeDifference(admissionDate, case_.doorOutTime);
    const doorToBalloon = case_.doorToBalloonMinutes || this.calculateTimeDifference(admissionDate, case_.balloonInflationTime);

    // Data validation
    const dateValidity = this.validateDate(admissionDate);
    const patientIdValidity = this.validatePatientId(patient?.nationalId || '');
    const ageValidity = this.validateAge(age);

    // Treatment analysis - return numeric values for consistency
    const thrombolyticGiven = case_.thrombolyticGiven ? 1 : 0;
    const arrivedByAmbulanceOrCar = (case_.modeOfArrival === 'AMBULANCE' || case_.modeOfArrival === 'PRIVATE_VEHICLE') ? 1 : 0;
    const candidateForFibrinolysis = arrivedByAmbulanceOrCar === 1 && case_.thrombolyticGiven ? 1 : 0;
    
    // PCI capability analysis - ensure logical consistency (one must be 1, other must be 0)
    const isPciCapable = originHospital?.hasCardiologyCenter || false;
    const pciCapable = isPciCapable ? 1 : 0;
    const nonPciCapable = !isPciCapable ? 1 : 0;

    // Door to Balloon for Transferred patients
    const doorToBalloonTransferred = modeTransferred === 1 ? doorToBalloon : 0;

    // Calculate formula-based columns
    const oneDoorToEcg = this.calculateOneDoorToEcg(case_.triageTime, case_.firstEcgTime);
    const oneDoorToNeedle = this.calculateOneDoorToNeedle(case_.triageTime, case_.thrombolyticAdminTime);
    const oneDoorOutTime = this.calculateOneDoorOutTime(case_.triageTime, case_.doorOutTime);
    const oneDoorToBalloon = this.calculateOneDoorToBalloon(case_.triageTime, case_.balloonInflationTime);
    
    const doorToEcg2 = this.calculateDoorToEcg2(doorToEcg);
    const doorToNeedle2 = this.calculateDoorToNeedle2(doorToNeedle);
    const doorInOutTime2 = this.calculateDoorInOutTime2(doorOutTime);
    const doorToBalloon2 = this.calculateDoorToBalloon2(doorToBalloon, case_.pciLocation || '');

    return {
      // Basic Demographics
      'Date of admission (dd/mm/yyyy)': this.formatDate(admissionDate),
      'Patient ID (National ID or IQAMA Number or Passport)': patient?.nationalId || '',
      'Gender': patient?.gender || '',
      'Age in years': age,
      'Mode of arrival': modeOfArrival,
      'Referred From Hospital': originHospital?.name || '',

      // Timestamps
      'Triage Time (hh:mm)': this.formatTime(case_.triageTime),
      'Time of first ECG (hh:mm)': this.formatTime(case_.firstEcgTime),
      'Has the patient given intravenous thrombolytic medication?': case_.thrombolyticGiven ? 'YES' : 'NO',
      'Time of thrombolytic administration (hh:mm)': this.formatTime(case_.thrombolyticAdminTime),
      'Door out time (hh:mm)': this.formatTime(case_.doorOutTime),
      'Time of 1st PCI began (hh:mm)': this.formatTime(case_.balloonInflationTime),
      'PCI location': case_.pciLocation || 'NA',

      // Hospital Information
      'Facility name (Origin)': originHospital?.name || '',
      'Cluster name (Origin)': originHospital?.cluster || '',
      'Facility name (Destination)': destinationHospital?.name || '',
      'Cluster name (Destination)': destinationHospital?.cluster || '',

      // Formula-based Time Metrics (1-Door series)
      '1-Door to ECG': oneDoorToEcg,
      '1-Door to Needle': oneDoorToNeedle,
      '1-Door Out time': oneDoorOutTime,
      '1-Door to Balloon (1ry PCI)': oneDoorToBalloon,

      // Formula-based Time Metrics (Door series)
      'Door to ECG': this.calculateDoorToEcg(case_.triageTime, case_.firstEcgTime, oneDoorToEcg),
      'Door to Needle': this.calculateDoorToNeedle(case_.triageTime, case_.thrombolyticAdminTime, oneDoorToNeedle),
      'Door (In-Out) time': this.calculateDoorInOutTime(case_.triageTime, case_.doorOutTime, oneDoorOutTime),
      'Door to Balloon': this.calculateDoorToBalloon(case_.triageTime, case_.balloonInflationTime, oneDoorToBalloon),

      // Formula-based Time Metrics (2 series)
      'Door to ECG 2': doorToEcg2,
      'Door to Needle 2': doorToNeedle2,
      'Door (In-Out) time 2': doorInOutTime2,
      'Door to Balloon (1ry PCI)': doorToBalloon2,

      // Mode of Arrival Analysis (formula-based)
      'Mode of arrival: By ambulance': modeByAmbulance,
      'Mode of arrival: By private car': modeByPrivateCar,
      'Mode of arrival: Transferred': modeTransferred,

      // Data Validation - matching spreadsheet format with codes
      'Validity: Date of admission (Valid=1, Blank=2, Invalid=3)': dateValidity,
      'Validity: Pt ID (Valid=1, Blank=2, Invalid=3)': patientIdValidity,
      'Validity: Age (Valid=1, Blank=2, Invalid=3)': ageValidity,

      // Treatment Analysis - matching spreadsheet format with codes
      'Given FIBRINOLYTICS? (Yes=1, No=0)': thrombolyticGiven,
      'Arrived by Ambulance or car (Yes=1, No=0)': arrivedByAmbulanceOrCar,
      'Arrived by Ambulance or car AND candidate for Fibrinolysis (Yes=1, No=0)': candidateForFibrinolysis,
      'PCI capable (Yes=1, No=0)': pciCapable,
      'Non-PCI capable (Yes=1, No=0)': nonPciCapable,
      'Door to Balloon for Transferred patients (Yes=1, No=0)': doorToBalloonTransferred,
    };
  }


  private calculateTimeDifference(startTime: Date | null, endTime: Date | null): number | null {
    if (!startTime || !endTime) return null;
    const start = new Date(startTime);
    const end = new Date(endTime);
    const diffMs = end.getTime() - start.getTime();
    return Math.round(diffMs / (1000 * 60)); // Convert to minutes
  }

  private formatDate(date: Date): string {
    if (!date) return '';
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  }

  private formatTime(date: Date | null): string {
    if (!date) return '';
    const d = new Date(date);
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  }

  private validateDate(date: Date | null): string {
    if (!date) return '2'; // Blank=2
    const d = new Date(date);
    if (isNaN(d.getTime())) return '3'; // Invalid=3
    return '1'; // Valid=1
  }

  private validatePatientId(nationalId: string | null): string {
    if (!nationalId || nationalId.trim() === '') return '2'; // Blank=2
    // Add more sophisticated validation if needed
    return '1'; // Valid=1
  }

  private validateAge(age: number | null): string {
    if (age === null || age === undefined) return '2'; // Blank=2
    if (age === 0 || age < 0 || age > 150) return '3'; // Invalid=3
    return '1'; // Valid=1
  }

  private formatModeOfArrival(modeOfArrival: string): string {
    switch (modeOfArrival) {
      case 'AMBULANCE': return 'By Ambulance';
      case 'PRIVATE_VEHICLE': return 'By Private car/walk-in';
      case 'WALK_IN': return 'By Private car/walk-in';
      case 'TRANSFERRED_FROM_HOSPITAL': return 'Transferred from another hospital';
      default: return 'By Private car/walk-in';
    }
  }

  // Formula calculation methods based on Excel formulas
  private calculateOneDoorToEcg(triageTime: Date | null, firstEcgTime: Date | null): string {
    // IF(COUNTBLANK(H2),"NA",IF(COUNTBLANK(G2),"NA",IF((G2<H2),H2-G2,MOD(H2-G2,1))))
    if (!firstEcgTime) return 'NA';
    if (!triageTime) return 'NA';
    
    const triage = new Date(triageTime);
    const ecg = new Date(firstEcgTime);
    const diffMs = ecg.getTime() - triage.getTime();
    const diffMinutes = Math.round(diffMs / (1000 * 60));
    
    return diffMinutes.toString();
  }

  private calculateOneDoorToNeedle(triageTime: Date | null, thrombolyticTime: Date | null): string {
    // IF(COUNTBLANK(J2),"NA",IF(COUNTBLANK(G2),"NA",Q2IF((G2<J2),J2-G2,MOD(J2-G2,1))))
    if (!thrombolyticTime) return 'NA';
    if (!triageTime) return 'NA';
    
    const triage = new Date(triageTime);
    const thrombolytic = new Date(thrombolyticTime);
    const diffMs = thrombolytic.getTime() - triage.getTime();
    const diffMinutes = Math.round(diffMs / (1000 * 60));
    
    return diffMinutes.toString();
  }

  private calculateOneDoorOutTime(triageTime: Date | null, doorOutTime: Date | null): string {
    // IF(COUNTBLANK(K2),"NA",IF(COUNTBLANK(G2),"NA",IF((G2<K2),K2-G2,MOD(K2-G2,1))))
    if (!doorOutTime) return 'NA';
    if (!triageTime) return 'NA';
    
    const triage = new Date(triageTime);
    const doorOut = new Date(doorOutTime);
    const diffMs = doorOut.getTime() - triage.getTime();
    const diffMinutes = Math.round(diffMs / (1000 * 60));
    
    return diffMinutes.toString();
  }

  private calculateOneDoorToBalloon(triageTime: Date | null, balloonTime: Date | null): string {
    // IF(COUNTBLANK(L2),"NA",IF(COUNTBLANK(G2),"NA",IF((G2<L2),L2-G2,MOD(L2-G2,1))))
    if (!balloonTime) return 'NA';
    if (!triageTime) return 'NA';
    
    const triage = new Date(triageTime);
    const balloon = new Date(balloonTime);
    const diffMs = balloon.getTime() - triage.getTime();
    const diffMinutes = Math.round(diffMs / (1000 * 60));
    
    return diffMinutes.toString();
  }

  private calculateDoorToEcg(triageTime: Date | null, firstEcgTime: Date | null, oneDoorToEcg: string): string {
    // IF((COUNTBLANK(G2)+COUNTBLANK(H2))>0,"NA",P2)
    if (!triageTime || !firstEcgTime) return 'NA';
    return oneDoorToEcg;
  }

  private calculateDoorToNeedle(triageTime: Date | null, thrombolyticTime: Date | null, oneDoorToNeedle: string): string {
    // IF((COUNTBLANK(G2)+COUNTBLANK(J2))>0,"NA",Q2)
    if (!triageTime || !thrombolyticTime) return 'NA';
    return oneDoorToNeedle;
  }

  private calculateDoorInOutTime(triageTime: Date | null, doorOutTime: Date | null, oneDoorOutTime: string): string {
    // IF((COUNTBLANK(G2)+COUNTBLANK(K2))>0,"NA",R2)
    if (!triageTime || !doorOutTime) return 'NA';
    return oneDoorOutTime;
  }

  private calculateDoorToBalloon(triageTime: Date | null, balloonTime: Date | null, oneDoorToBalloon: string): string {
    // IF((COUNTBLANK(G2)+COUNTBLANK(L2))>0,"NA",S2)
    if (!triageTime || !balloonTime) return 'NA';
    return oneDoorToBalloon;
  }

  private calculateDoorToEcg2(doorToEcg: number | null): number {
    // IF(T2="NA","",COUNTIFS(T2,"<="&'Dropdown lists'!$H$3))
    if (doorToEcg === null || doorToEcg === undefined) return 0;
    // Assuming target is 10 minutes (equivalent to 'Dropdown lists'!$H$3)
    return doorToEcg <= 10 ? 1 : 0;
  }

  private calculateDoorToNeedle2(doorToNeedle: number | null): number {
    // IF(U2="NA","",COUNTIFS(U2,"<="&'Dropdown lists'!$I$3))
    if (doorToNeedle === null || doorToNeedle === undefined) return 0;
    // Assuming target is 30 minutes (equivalent to 'Dropdown lists'!$I$3)
    return doorToNeedle <= 30 ? 1 : 0;
  }

  private calculateDoorInOutTime2(doorOutTime: number | null): number {
    // IF(V2="NA","",COUNTIFS(V2,"<="&'Dropdown lists'!$L$3))
    if (doorOutTime === null || doorOutTime === undefined) return 0;
    // Assuming target is 90 minutes (equivalent to 'Dropdown lists'!$L$3)
    return doorOutTime <= 90 ? 1 : 0;
  }

  private calculateDoorToBalloon2(doorToBalloon: number | null, pciLocation: string): number {
    // IF(W2="NA","",COUNTIFS(W2,"<="&'Dropdown lists'!$K$6,M2,'Dropdown lists'!$AA$3))
    if (doorToBalloon === null || doorToBalloon === undefined) return 0;
    if (!pciLocation || pciLocation === 'NA') return 0;
    // Assuming target is 90 minutes and PCI location is valid
    return doorToBalloon <= 90 ? 1 : 0;
  }

  private calculateAggregatedKPIs(stemiCases: StemiCaseData[]): Record<string, string | number> {
    const totalCases = stemiCases.length;
    
    if (totalCases === 0) {
      return {
        averageDoorToEcg: 0,
        averageDoorToNeedle: 0,
        averageDoorToBalloon: 0,
        totalCases: 0,
        casesWithThrombolytic: 0,
        thrombolyticRate: '0.00%',
        casesWithPCI: 0,
        pciRate: '0.00%',
        doorToEcgTarget: 'No Data',
        doorToNeedleTarget: 'No Data',
        doorToBalloonTarget: 'No Data',
      };
    }

    // Calculate time metrics
    const doorToEcgTimes = stemiCases
      .map(case_ => case_.doorToEcgMinutes || this.calculateTimeDifference(case_.pathwayStarted || case_.createdAt, case_.firstEcgTime))
      .filter(time => time !== null);
    
    const doorToNeedleTimes = stemiCases
      .map(case_ => case_.doorToNeedleMinutes || this.calculateTimeDifference(case_.pathwayStarted || case_.createdAt, case_.thrombolyticAdminTime))
      .filter(time => time !== null);
    
    const doorToBalloonTimes = stemiCases
      .map(case_ => case_.doorToBalloonMinutes || this.calculateTimeDifference(case_.pathwayStarted || case_.createdAt, case_.balloonInflationTime))
      .filter(time => time !== null);

    const averageDoorToEcg = doorToEcgTimes.length > 0 
      ? Math.round((doorToEcgTimes.reduce((a, b) => a + b, 0) / doorToEcgTimes.length) * 100) / 100 
      : 0;
    
    const averageDoorToNeedle = doorToNeedleTimes.length > 0 
      ? Math.round((doorToNeedleTimes.reduce((a, b) => a + b, 0) / doorToNeedleTimes.length) * 100) / 100 
      : 0;
    
    const averageDoorToBalloon = doorToBalloonTimes.length > 0 
      ? Math.round((doorToBalloonTimes.reduce((a, b) => a + b, 0) / doorToBalloonTimes.length) * 100) / 100 
      : 0;

    // Calculate treatment metrics
    const casesWithThrombolytic = stemiCases.filter(case_ => case_.thrombolyticGiven).length;
    const casesWithPCI = stemiCases.filter(case_ => case_.balloonInflationTime).length;
    
    const thrombolyticRate = totalCases > 0 
      ? Math.round((casesWithThrombolytic / totalCases) * 10000) / 100 
      : 0;
    
    const pciRate = totalCases > 0 
      ? Math.round((casesWithPCI / totalCases) * 10000) / 100 
      : 0;

    // Determine target achievement
    const doorToEcgTarget = averageDoorToEcg <= 10 ? 'Achieved' : 'Not Achieved';
    const doorToNeedleTarget = averageDoorToNeedle <= 30 ? 'Achieved' : 'Not Achieved';
    const doorToBalloonTarget = averageDoorToBalloon <= 90 ? 'Achieved' : 'Not Achieved';

    return {
      averageDoorToEcg,
      averageDoorToNeedle,
      averageDoorToBalloon,
      totalCases,
      casesWithThrombolytic,
      thrombolyticRate: `${thrombolyticRate}%`,
      casesWithPCI,
      pciRate: `${pciRate}%`,
      doorToEcgTarget,
      doorToNeedleTarget,
      doorToBalloonTarget,
    };
  }

  private addDataValidation(worksheet: ExcelJS.Worksheet): void {
    // Define options for categorical fields
    const modeOfArrivalOptions = [
      'By Ambulance',
      'By Private car/walk-in',
      'Transferred from another hospital'
    ];

    const yesNoOptions = [
      '1',
      '0'
    ];

    const validityOptions = [
      '1',
      '2',
      '3'
    ];

    // Mode of Arrival (column E)
    for (let row = 2; row <= 1000; row++) {
      const cellAddress = `E${row}`;
      worksheet.getCell(cellAddress).dataValidation = {
        type: 'list',
        allowBlank: true,
        formulae: [modeOfArrivalOptions.map(option => `"${option.replace(/"/g, '""')}"`).join(',')],
        showErrorMessage: true,
        errorTitle: 'Invalid Selection',
        error: 'Please select a valid mode of arrival.',
        showInputMessage: true,
        promptTitle: 'Select Mode of Arrival',
        prompt: 'Choose the mode of arrival from the dropdown list.'
      };
    }

    // Yes/No fields (columns Z, AA, AB, AF, AG, AH, AI, AJ)
    const yesNoColumns = ['Z', 'AA', 'AB', 'AF', 'AG', 'AH', 'AI', 'AJ'];
    yesNoColumns.forEach(column => {
      for (let row = 2; row <= 1000; row++) {
        const cellAddress = `${column}${row}`;
        worksheet.getCell(cellAddress).dataValidation = {
          type: 'list',
          allowBlank: true,
          formulae: [yesNoOptions.map(option => `"${option.replace(/"/g, '""')}"`).join(',')],
          showErrorMessage: true,
          errorTitle: 'Invalid Selection',
          error: 'Please select Yes or No.',
          showInputMessage: true,
          promptTitle: 'Select Option',
          prompt: 'Choose Yes or No from the dropdown list.'
        };
      }
    });

    // Validity fields (columns AC, AD, AE)
    const validityColumns = ['AC', 'AD', 'AE'];
    validityColumns.forEach(column => {
      for (let row = 2; row <= 1000; row++) {
        const cellAddress = `${column}${row}`;
        worksheet.getCell(cellAddress).dataValidation = {
          type: 'list',
          allowBlank: true,
          formulae: [validityOptions.map(option => `"${option.replace(/"/g, '""')}"`).join(',')],
          showErrorMessage: true,
          errorTitle: 'Invalid Selection',
          error: 'Please select a valid option.',
          showInputMessage: true,
          promptTitle: 'Select Validity',
          prompt: 'Choose the validity status from the dropdown list.'
        };
      }
    });
  }
}