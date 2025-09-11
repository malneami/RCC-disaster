import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import * as XLSX from 'xlsx';

@Injectable()
export class StemiExportService {
  constructor(private readonly prisma: PrismaService) {}

  async exportStemiCasesToExcel(filters?: any) {
    // Get all STEMI cases with related data
    const stemiCases = await this.prisma.stemiCase.findMany({
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            nationalId: true,
            dateOfBirth: true,
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

    // Transform data for Excel export
    const exportData = stemiCases.map(case_ => this.transformCaseForExport(case_));

    // Create Excel workbook
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(exportData);

    // Set column widths
    const columnWidths = [
      { wch: 12 }, // Date of admission
      { wch: 20 }, // Patient ID (National ID)
      { wch: 8 },  // Gender
      { wch: 6 },  // Age
      { wch: 15 }, // Mode of arrival
      { wch: 20 }, // Referred From Hospital
      { wch: 12 }, // Triage Time
      { wch: 15 }, // Time of first ECG
      { wch: 8 },  // Thrombolytic given
      { wch: 20 }, // Thrombolytic admin time
      { wch: 12 }, // Door out time
      { wch: 15 }, // Time of 1st PCI began
      { wch: 15 }, // PCI location
      { wch: 25 }, // Facility name (Origin)
      { wch: 15 }, // Cluster name (Origin)
      { wch: 25 }, // Facility name (Destination)
      { wch: 15 }, // Cluster name (Destination)
      { wch: 15 }, // 1-Door to ECG
      { wch: 15 }, // 1-Door to Needle
      { wch: 15 }, // 1-Door Out time
      { wch: 20 }, // 1-Door to Balloon (1st PCI)
      { wch: 15 }, // Door to ECG
      { wch: 15 }, // Door to Needle
      { wch: 15 }, // Door (In-Out) time
      { wch: 15 }, // Door to Balloon
      { wch: 15 }, // Door to ECG 2
      { wch: 15 }, // Door to Needle 2
      { wch: 15 }, // Door (In-Out) time 2
      { wch: 20 }, // Door to Balloon/PCI 2
      { wch: 8 },  // Mode: By ambulance
      { wch: 8 },  // Mode: By private car
      { wch: 8 },  // Mode: Transferred
      { wch: 15 }, // Validity: Date of admission
      { wch: 12 }, // Validity: Pt ID
      { wch: 12 }, // Validity: Age
      { wch: 8 },  // Given FIBRINOLYTICS?
      { wch: 8 },  // Arrived by Ambulance or car
      { wch: 8 },  // Arrived by Ambulance or car AND candidate for Fibrinolysis
      { wch: 8 },  // PCI capable
      { wch: 8 },  // Non-PCI capable
      { wch: 20 }, // Door to Balloon for Transferred patients
    ];

    worksheet['!cols'] = columnWidths;

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, 'STEMI Cases');

    // Generate Excel buffer
    const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    return {
      buffer: excelBuffer,
      filename: `stemi-cases-export-${new Date().toISOString().split('T')[0]}.xlsx`,
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    };
  }

  private transformCaseForExport(case_: any) {
    const admissionDate = case_.pathwayStarted || case_.createdAt;
    const patient = case_.patient;
    const originHospital = case_.originHospital;
    const destinationHospital = case_.destinationHospital;

    // Calculate age
    const age = this.calculateAge(patient.dateOfBirth);

    // Mode of arrival calculations
    const modeOfArrival = case_.modeOfArrival || '';
    const modeByAmbulance = modeOfArrival === 'AMBULANCE' ? 'Yes' : 'No';
    const modeByPrivateCar = modeOfArrival === 'PRIVATE_VEHICLE' ? 'Yes' : 'No';
    const modeTransferred = modeOfArrival === 'TRANSFERRED_FROM_HOSPITAL' ? 'Yes' : 'No';

    // Time calculations (in minutes)
    const doorToEcg = case_.doorToEcgMinutes || this.calculateTimeDifference(admissionDate, case_.firstEcgTime);
    const doorToNeedle = case_.doorToNeedleMinutes || this.calculateTimeDifference(admissionDate, case_.thrombolyticAdminTime);
    const doorOutTime = case_.doorInDoorOutMinutes || this.calculateTimeDifference(admissionDate, case_.doorOutTime);
    const doorToBalloon = case_.doorToBalloonMinutes || this.calculateTimeDifference(admissionDate, case_.balloonInflationTime);

    // Data validation
    const dateValidity = this.validateDate(admissionDate);
    const patientIdValidity = this.validatePatientId(patient.nationalId);
    const ageValidity = this.validateAge(age);

    // Treatment analysis
    const thrombolyticGiven = case_.thrombolyticGiven ? 'Yes' : 'No';
    const arrivedByAmbulanceOrCar = (modeOfArrival === 'AMBULANCE' || modeOfArrival === 'PRIVATE_VEHICLE') ? 'Yes' : 'No';
    const candidateForFibrinolysis = arrivedByAmbulanceOrCar === 'Yes' && case_.thrombolyticGiven ? 'Yes' : 'No';
    
    // PCI capability analysis
    const pciCapable = originHospital?.hasCardiologyCenter ? 'Yes' : 'No';
    const nonPciCapable = !originHospital?.hasCardiologyCenter ? 'Yes' : 'No';

    // Door to Balloon for Transferred patients
    const doorToBalloonTransferred = modeTransferred === 'Yes' ? doorToBalloon : null;

    return {
      // Basic Demographics
      'Date of admission (dd/mm/yyyy)': this.formatDate(admissionDate),
      'Patient ID (National ID)': patient.nationalId || '',
      'Gender': patient.gender || '',
      'Age': age,
      'Mode of arrival': modeOfArrival,
      'Referred From Hospital': modeTransferred,

      // Timestamps
      'Triage Time (hh:mm)': this.formatTime(case_.triageTime),
      'Time of first ECG (hh:mm)': this.formatTime(case_.firstEcgTime),
      'Has the patient given intravenous thrombolytic medication?': thrombolyticGiven,
      'Time of thrombolytic administration (hh:mm)': this.formatTime(case_.thrombolyticAdminTime),
      'Door out time (hh:mm)': this.formatTime(case_.doorOutTime),
      'Time of 1st PCI began (hh:mm)': this.formatTime(case_.balloonInflationTime),
      'PCI location': case_.pciLocation || '',

      // Hospital Information
      'Facility name (Origin)': originHospital?.name || '',
      'Cluster name (Origin)': originHospital?.cluster || '',
      'Facility name (Destination)': destinationHospital?.name || '',
      'Cluster name (Destination)': destinationHospital?.cluster || '',

      // Time Metrics - Version 1
      '1-Door to ECG': doorToEcg,
      '1-Door to Needle': doorToNeedle,
      '1-Door Out time': doorOutTime,
      '1-Door to Balloon (1st PCI)': doorToBalloon,

      // Time Metrics - Version 2
      'Door to ECG': doorToEcg,
      'Door to Needle': doorToNeedle,
      'Door (In-Out) time': doorOutTime,
      'Door to Balloon': doorToBalloon,

      // Time Metrics - Version 3
      'Door to ECG 2': doorToEcg,
      'Door to Needle 2': doorToNeedle,
      'Door (In-Out) time 2': doorOutTime,
      'Door to Balloon/PCI 2': doorToBalloon,

      // Mode of Arrival Analysis
      'Mode of arrival: By ambulance': modeByAmbulance,
      'Mode of arrival: By private car': modeByPrivateCar,
      'Mode of arrival: Transferred': modeTransferred,

      // Data Validation
      'Validity: Date of admission': dateValidity,
      'Validity: Pt ID': patientIdValidity,
      'Validity: Age': ageValidity,

      // Treatment Analysis
      'Given FIBRINOLYTICS?': thrombolyticGiven,
      'Arrived by Ambulance or car': arrivedByAmbulanceOrCar,
      'Arrived by Ambulance or car AND candidate for Fibrinolysis': candidateForFibrinolysis,
      'PCI capable': pciCapable,
      'Non-PCI capable': nonPciCapable,
      'Door to Balloon for Transferred patients': doorToBalloonTransferred,
    };
  }

  private calculateAge(dateOfBirth: Date): number {
    if (!dateOfBirth) return 0;
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  }

  private calculateTimeDifference(startTime: Date, endTime: Date): number | null {
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

  private formatTime(date: Date): string {
    if (!date) return '';
    const d = new Date(date);
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  }

  private validateDate(date: Date): string {
    if (!date) return 'Blank=2';
    const d = new Date(date);
    if (isNaN(d.getTime())) return 'Invalid=3';
    return 'Valid=1';
  }

  private validatePatientId(nationalId: string): string {
    if (!nationalId || nationalId.trim() === '') return 'Blank=2';
    // Add more sophisticated validation if needed
    return 'Valid=1';
  }

  private validateAge(age: number): string {
    if (age === 0 || age < 0 || age > 150) return 'Invalid=3';
    return 'Valid=1';
  }
}
