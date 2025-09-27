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
  gender?: 'MALE' | 'FEMALE';
  phoneNumber?: string;
  email?: string;
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
    try {
      const response = await apiClient.post('/trauma-cases', data);
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

}

export default TraumaService;

