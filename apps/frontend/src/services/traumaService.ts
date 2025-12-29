import { apiClient } from './apiClient';
import type { TraumaKPIsResponse } from '../pages/Trauma/types/traumaTypes';

// Trauma Types
export type TraumaModeOfArrival = 'AMBULANCE_RED_CRESCENT' | 'PRIVATE_CAR' | 'TRANSFERRED_FROM_ANOTHER_HOSPITAL';
export type TraumaMechanismOfInjury = 'PENETRATING' | 'BLUNT' | 'BURN' | 'FALL' | 'MOTOR_VEHICLE_ACCIDENT' | 'OTHER';
export type TraumaDispositionType = 'ICU_ADMISSION' | 'SURGICAL_WARD_ADMISSION' | 'MEDICAL_WARD_ADMISSION' | 'DISCHARGE' | 'OPERATING_THEATRE' | 'TRANSFER_TO_HIGHER_CENTER' | 'DEATH' | 'DISCHARGE_AGAINST_MEDICAL_ADVICE' | 'OTHER';
export type TraumaInjurySeverity = 'NO_INJURY' | 'MINOR' | 'MODERATE' | 'SERIOUS' | 'SEVERE' | 'CRITICAL' | 'UNSURVIVABLE';

// Patient Info for auto-creation
export interface PatientInfo {
  mrn?: string;
  nationalId?: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  dateOfBirth?: string;
  age?: number;
  gender?: 'MALE' | 'FEMALE';
  phoneNumber?: string;
  email?: string;
  address?: string;
  emergencyContact?: string;
  emergencyPhone?: string;
  medicalHistory?: string;
  allergies?: string;
  medications?: string;
}

// Trauma Case Interfaces
export interface TraumaCase {
  id: string;
  ticketId: string;
  patientId: string;
  originHospitalId: string;
  destinationHospitalId?: string;
  
  // Date and Time Information
  arrivalDateTime: string;
  incidentDateTime?: string;
  modeOfArrival: TraumaModeOfArrival;
  transferRequestDateTime?: string;
  transferArrivalDateTime?: string;
  transferDurationMinutes?: number;
  
  // Chief Complaint and Mechanism
  chiefComplaint?: string;
  mechanismOfInjury: TraumaMechanismOfInjury;
  
  // Vital Signs
  vitalSigns?: any;
  glasgowComaScale?: number;
  systolicBloodPressure?: number;
  respiratoryRate?: number;
  additionalVitalSigns?: string;
  
  // Injury Information - Body Regions
  headAndNeckInjury?: TraumaInjurySeverity;
  faceInjury?: TraumaInjurySeverity;
  chestInjury?: TraumaInjurySeverity;
  abdomenInjury?: TraumaInjurySeverity;
  extremitiesInjury?: TraumaInjurySeverity;
  externalInjury?: TraumaInjurySeverity;
  
  // Assessment and Disposition
  primarySurveyFindings?: string;
  edDisposition?: TraumaDispositionType;
  additionalNotes?: string;
  disposition?: any;
  
  // KPI Tracking
  responseTimeMinutes?: number;
  criticalCase: boolean;
  transferCase: boolean;
  averageGlasgowScore?: number;
  mortalityRate?: number;
  averageLengthOfStay?: number;
  
  // Audit Fields
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
  createdById: string;
  
  // Relations
  patient?: {
    id: string;
    firstName: string;
    lastName: string;
    age?: number;
    nationalId?: string;
    mrn?: string;
    dateOfBirth: string;
    gender: string;
    phoneNumber?: string;
    email?: string;
  };
  
  originHospital?: {
    id: string;
    name: string;
    cluster: string;
  };
  
  destinationHospital?: {
    id: string;
    name: string;
    cluster: string;
  };
  
  createdBy?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  
  assignedBed?: {
    id: string;
    bedNumber: string;
    status: string;
    location?: string;
    isOperational: boolean;
    unit: {
      id: string;
      name: string;
      bedType: string;
    };
    hospital: {
      id: string;
      name: string;
    };
    currentPatient?: {
      id: string;
      name: string;
      nationalId?: string;
      age?: number;
      gender?: string;
      mrn?: string;
    };
  } | null;
}

// Create Trauma Case Data
export interface CreateTraumaCaseData {
  ticketId?: string;
  patientId?: string;
  originHospitalId: string;
  destinationHospitalId?: string;
  
  // Date and Time Information
  arrivalDateTime: string;
  incidentDateTime?: string;
  modeOfArrival: TraumaModeOfArrival;
  transferRequestDateTime?: string;
  transferArrivalDateTime?: string;
  transferDurationMinutes?: number;
  
  // Chief Complaint and Mechanism
  chiefComplaint?: string;
  mechanismOfInjury: TraumaMechanismOfInjury;
  
  // Vital Signs
  vitalSigns?: any;
  glasgowComaScale?: number;
  systolicBloodPressure?: number;
  respiratoryRate?: number;
  additionalVitalSigns?: string;
  
  // Injury Information - Body Regions
  headAndNeckInjury?: TraumaInjurySeverity;
  faceInjury?: TraumaInjurySeverity;
  chestInjury?: TraumaInjurySeverity;
  abdomenInjury?: TraumaInjurySeverity;
  extremitiesInjury?: TraumaInjurySeverity;
  externalInjury?: TraumaInjurySeverity;
  
  // Assessment and Disposition
  primarySurveyFindings?: string;
  edDisposition?: TraumaDispositionType;
  additionalNotes?: string;
  disposition?: any;
  
  // Patient Information
  patientInfo?: PatientInfo;
}

// Update Trauma Case Data
export interface UpdateTraumaCaseData extends Partial<CreateTraumaCaseData> {}

// Trauma KPI Summary
export interface TraumaKPISummary {
  totalCases: number;
  criticalCases: number;
  transferCases: number;
  averageResponseTime: number;
  averageGlasgowScore: number;
  mortalityRate: number;
  criticalCaseRate: number;
  transferRate: number;
}

// Trauma Case Filters
export interface TraumaCaseFilters {
  patientId?: string;
  originHospitalId?: string;
  destinationHospitalId?: string;
  modeOfArrival?: TraumaModeOfArrival;
  mechanismOfInjury?: TraumaMechanismOfInjury;
  criticalCase?: boolean;
  transferCase?: boolean;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
}

// Trauma Service Class
export class TraumaService {
  // Create a new trauma case
  static async createTraumaCase(data: CreateTraumaCaseData): Promise<TraumaCase> {
    // Helper function to clean values (remove empty strings, keep only valid values)
    const cleanValue = (value: any): any => {
      if (value === '' || value === null) return undefined;
      if (typeof value === 'string' && value.trim() === '') return undefined;
      return value;
    };

    // Clean patientInfo - only clean optional fields, keep required fields as-is
    const cleanPatientInfo = data.patientInfo ? {
      firstName: data.patientInfo.firstName, // Required, don't clean
      lastName: data.patientInfo.lastName, // Required, don't clean
      nationalId: data.patientInfo.nationalId, // Required, don't clean
      gender: data.patientInfo.gender, // Required, don't clean
      age: data.patientInfo.age !== undefined && data.patientInfo.age !== null ? data.patientInfo.age : undefined, // Optional but keep if provided
      phoneNumber: cleanValue(data.patientInfo.phoneNumber), // Optional
      email: cleanValue(data.patientInfo.email), // Optional
      mrn: cleanValue(data.patientInfo.mrn), // Optional
      dateOfBirth: cleanValue(data.patientInfo.dateOfBirth), // Optional
      middleName: cleanValue(data.patientInfo.middleName), // Optional
      address: cleanValue(data.patientInfo.address), // Optional
      emergencyContact: cleanValue(data.patientInfo.emergencyContact), // Optional
      emergencyPhone: cleanValue(data.patientInfo.emergencyPhone), // Optional
      medicalHistory: cleanValue(data.patientInfo.medicalHistory), // Optional
      allergies: cleanValue(data.patientInfo.allergies), // Optional
      medications: cleanValue(data.patientInfo.medications), // Optional
    } : undefined;

    // Remove undefined values from patientInfo (only optional fields)
    if (cleanPatientInfo) {
      const optionalFields = ['phoneNumber', 'email', 'mrn', 'dateOfBirth', 'middleName', 'age', 'address', 'emergencyContact', 'emergencyPhone', 'medicalHistory', 'allergies', 'medications'];
      optionalFields.forEach(key => {
        if (cleanPatientInfo[key as keyof typeof cleanPatientInfo] === undefined) {
          delete cleanPatientInfo[key as keyof typeof cleanPatientInfo];
        }
      });
    }

    // Include all fields that exist in the backend DTO
    const filteredData: any = {
      ticketId: cleanValue(data.ticketId),
      patientId: cleanValue(data.patientId),
      patientInfo: cleanPatientInfo && Object.keys(cleanPatientInfo).length > 0 ? cleanPatientInfo : undefined,
      originHospitalId: data.originHospitalId, // Required
      destinationHospitalId: cleanValue(data.destinationHospitalId),
      arrivalDateTime: data.arrivalDateTime, // Required
      incidentDateTime: cleanValue(data.incidentDateTime),
      modeOfArrival: data.modeOfArrival, // Required
      transferRequestDateTime: cleanValue(data.transferRequestDateTime),
      transferArrivalDateTime: cleanValue(data.transferArrivalDateTime),
      transferDurationMinutes: cleanValue(data.transferDurationMinutes),
      chiefComplaint: cleanValue(data.chiefComplaint),
      mechanismOfInjury: data.mechanismOfInjury, // Required
      vitalSigns: data.vitalSigns,
      glasgowComaScale: cleanValue(data.glasgowComaScale),
      systolicBloodPressure: cleanValue(data.systolicBloodPressure),
      respiratoryRate: cleanValue(data.respiratoryRate),
      additionalVitalSigns: cleanValue(data.additionalVitalSigns),
      headAndNeckInjury: cleanValue(data.headAndNeckInjury),
      faceInjury: cleanValue(data.faceInjury),
      chestInjury: cleanValue(data.chestInjury),
      abdomenInjury: cleanValue(data.abdomenInjury),
      extremitiesInjury: cleanValue(data.extremitiesInjury),
      externalInjury: cleanValue(data.externalInjury),
      primarySurveyFindings: cleanValue(data.primarySurveyFindings),
      edDisposition: cleanValue(data.edDisposition),
      additionalNotes: cleanValue(data.additionalNotes),
      disposition: data.disposition,
    };

    // Remove all undefined values from the payload
    Object.keys(filteredData).forEach(key => {
      if (filteredData[key] === undefined) {
        delete filteredData[key];
      }
    });
    
    try {
      console.log('=== SENDING TO BACKEND ===');
      console.log('Filtered data:', JSON.stringify(filteredData, null, 2));
      console.log('Patient Info in filtered data:', JSON.stringify(filteredData.patientInfo, null, 2));
      const response = await apiClient.post('/trauma-cases', filteredData);
      return response.data;
    } catch (error) {
      console.error('Error creating trauma case:', error);
      throw error;
    }
  }

  // Get all trauma cases with optional filters
  static async getTraumaCases(filters?: TraumaCaseFilters): Promise<{ cases: TraumaCase[]; total: number }> {
    try {
      const params = new URLSearchParams();
      
      if (filters?.patientId) params.append('patientId', filters.patientId);
      if (filters?.originHospitalId) params.append('originHospitalId', filters.originHospitalId);
      if (filters?.destinationHospitalId) params.append('destinationHospitalId', filters.destinationHospitalId);
      if (filters?.modeOfArrival) params.append('modeOfArrival', filters.modeOfArrival);
      if (filters?.mechanismOfInjury) params.append('mechanismOfInjury', filters.mechanismOfInjury);
      if (filters?.criticalCase !== undefined) params.append('criticalCase', filters.criticalCase.toString());
      if (filters?.transferCase !== undefined) params.append('transferCase', filters.transferCase.toString());
      if (filters?.startDate) params.append('startDate', filters.startDate);
      if (filters?.endDate) params.append('endDate', filters.endDate);
      if (filters?.limit) params.append('limit', filters.limit.toString());
      if (filters?.offset) params.append('offset', filters.offset.toString());

      const response = await apiClient.get(`/trauma-cases?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching trauma cases:', error);
      throw error;
    }
  }

  // Get a specific trauma case by ID
  static async getTraumaCaseById(id: string): Promise<TraumaCase> {
    try {
      const response = await apiClient.get(`/trauma-cases/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching trauma case:', error);
      throw error;
    }
  }

  // Update a trauma case
  static async updateTraumaCase(id: string, data: UpdateTraumaCaseData): Promise<TraumaCase> {
    try {
      const response = await apiClient.patch(`/trauma-cases/${id}`, data);
      return response.data;
    } catch (error) {
      console.error('Error updating trauma case:', error);
      throw error;
    }
  }

  // Delete a trauma case
  static async deleteTraumaCase(id: string): Promise<void> {
    try {
      await apiClient.delete(`/trauma-cases/${id}`);
    } catch (error) {
      console.error('Error deleting trauma case:', error);
      throw error;
    }
  }

  // Get trauma KPIs
  static async getKPISummary(hospitalId?: string, startDate?: string, endDate?: string): Promise<TraumaKPIsResponse> {
    try {
      const params = new URLSearchParams();
      if (hospitalId) params.append('hospitalId', hospitalId);
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const response = await apiClient.get(`/trauma-cases/kpis?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching trauma KPIs:', error);
      throw error;
    }
  }

  // Utility functions for labels and formatting
  static getModeOfArrivalLabel(mode: TraumaModeOfArrival): string {
    const labels: Record<TraumaModeOfArrival, string> = {
      AMBULANCE_RED_CRESCENT: 'Ambulance (Red Crescent)',
      PRIVATE_CAR: 'Private Car',
      TRANSFERRED_FROM_ANOTHER_HOSPITAL: 'Transferred from another hospital'
    };
    return labels[mode] || mode;
  }

  static getMechanismOfInjuryLabel(mechanism: TraumaMechanismOfInjury): string {
    const labels: Record<TraumaMechanismOfInjury, string> = {
      PENETRATING: 'Penetrating',
      BLUNT: 'Blunt',
      BURN: 'Burn',
      FALL: 'Fall',
      MOTOR_VEHICLE_ACCIDENT: 'Motor Vehicle Accident',
      OTHER: 'Other'
    };
    return labels[mechanism] || mechanism;
  }

  static getDispositionLabel(disposition: TraumaDispositionType): string {
    const labels: Record<TraumaDispositionType, string> = {
      ICU_ADMISSION: 'ICU Admission',
      SURGICAL_WARD_ADMISSION: 'Surgical Ward Admission',
      MEDICAL_WARD_ADMISSION: 'Medical Ward Admission',
      DISCHARGE: 'Discharge',
      OPERATING_THEATRE: 'Operating Theatre',
      TRANSFER_TO_HIGHER_CENTER: 'Transfer to Higher Center',
      DEATH: 'Death',
      DISCHARGE_AGAINST_MEDICAL_ADVICE: 'Discharge Against Medical Advice',
      OTHER: 'Other'
    };
    return labels[disposition] || disposition;
  }

  static getInjurySeverityLabel(severity: TraumaInjurySeverity): string {
    const labels: Record<TraumaInjurySeverity, string> = {
      NO_INJURY: 'No Injury',
      MINOR: 'Minor',
      MODERATE: 'Moderate',
      SERIOUS: 'Serious',
      SEVERE: 'Severe',
      CRITICAL: 'Critical',
      UNSURVIVABLE: 'Unsurvivable'
    };
    return labels[severity] || severity;
  }

  static getInjurySeverityColor(severity: TraumaInjurySeverity): string {
    const colors: Record<TraumaInjurySeverity, string> = {
      NO_INJURY: '#4caf50',
      MINOR: '#8bc34a',
      MODERATE: '#ffc107',
      SERIOUS: '#ff9800',
      SEVERE: '#ff5722',
      CRITICAL: '#f44336',
      UNSURVIVABLE: '#9c27b0'
    };
    return colors[severity] || '#757575';
  }

  static formatDateTime(dateTime: string): string {
    return new Date(dateTime).toLocaleString();
  }

  static formatDate(dateTime: string): string {
    return new Date(dateTime).toLocaleDateString();
  }

  static formatTime(dateTime: string): string {
    return new Date(dateTime).toLocaleTimeString();
  }


  static getGlasgowComaScaleColor(score: number): string {
    if (score >= 13) return '#4caf50'; // Green - Mild
    if (score >= 9) return '#ffc107';  // Yellow - Moderate
    if (score >= 3) return '#ff5722';  // Red - Severe
    return '#9c27b0'; // Purple - Critical
  }

  static getGlasgowComaScaleLabel(score: number): string {
    if (score >= 13) return 'Mild';
    if (score >= 9) return 'Moderate';
    if (score >= 3) return 'Severe';
    return 'Critical';
  }

  // Calculate door to transfer time for KPI display
  static calculateDoorToTransferTime(case_: TraumaCase): string {
    // Only calculate for transfer cases
    if (!case_.transferCase || !case_.transferRequestDateTime || !case_.transferArrivalDateTime) {
      return 'N/A';
    }

    try {
      const requestTime = new Date(case_.transferRequestDateTime);
      const arrivalTime = new Date(case_.transferArrivalDateTime);
      
      // Calculate difference in minutes
      const diffMinutes = Math.floor((arrivalTime.getTime() - requestTime.getTime()) / (1000 * 60));
      
      if (diffMinutes < 0) return 'N/A';
      
      // Format as hours:minutes if >= 60 minutes, otherwise just minutes
      if (diffMinutes >= 60) {
        const hours = Math.floor(diffMinutes / 60);
        const minutes = diffMinutes % 60;
        return `${hours}:${minutes.toString().padStart(2, '0')}h`;
      } else {
        return `${diffMinutes}m`;
      }
    } catch (error) {
      console.error('Error calculating door to transfer time:', error);
      return 'N/A';
    }
  }

  // Get door to transfer time color based on KPI compliance
  static getDoorToTransferTimeColor(case_: TraumaCase): string {
    if (!case_.transferCase || !case_.transferRequestDateTime || !case_.transferArrivalDateTime) {
      return '#757575'; // Gray for N/A
    }

    try {
      const requestTime = new Date(case_.transferRequestDateTime);
      const arrivalTime = new Date(case_.transferArrivalDateTime);
      const diffMinutes = Math.floor((arrivalTime.getTime() - requestTime.getTime()) / (1000 * 60));
      
      if (diffMinutes < 0) return '#757575';
      
      // KPI Target: ≤4 hours (240 minutes) for trauma transfer
      if (diffMinutes <= 240) {
        return '#4caf50'; // Green - within target
      } else if (diffMinutes <= 360) {
        return '#ffc107'; // Yellow - approaching target
      } else {
        return '#f44336'; // Red - exceeds target
      }
    } catch (error) {
      return '#757575';
    }
  }

}

export default TraumaService;

