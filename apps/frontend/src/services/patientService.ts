import { apiClient } from './apiClient';
import { MedicalRecord } from './medicalRecordService';

export interface Patient {
  id: string;
  mrn?: string;
  nationalId?: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  dateOfBirth?: string; // Will be removed after migration
  age?: number; // Age in years
  gender: 'MALE' | 'FEMALE';
  maritalStatus?: 'SINGLE' | 'MARRIED' | 'DIVORCED' | 'WIDOWED' | 'SEPARATED' | 'UNKNOWN';
  phoneNumber?: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  emergencyContact?: string;
  emergencyPhone?: string;
  emergencyEmail?: string;
  emergencyRelationship?: string;
  insuranceProvider?: string;
  insuranceNumber?: string;
  insuranceGroup?: string;
  insuranceExpiry?: string;
  bloodType?: string;
  rhFactor?: string;
  allergies?: string;
  medications?: string;
  medicalHistory?: string;
  riskFactors?: string;
  chronicConditions?: string;
  weight?: number;
  height?: number;
  bmi?: number;
  dataEncryptionKey?: string;
  privacyLevel: 'PUBLIC' | 'INTERNAL' | 'PRIVATE' | 'RESTRICTED' | 'CONFIDENTIAL';
  consentGiven: boolean;
  consentDate?: string;
  dataRetentionPolicy?: string;
  duplicateGroupId?: string;
  isPrimaryRecord: boolean;
  createdAt: string;
  updatedAt: string;
  lastAccessedAt?: string;
  lastAccessedBy?: string;
  createdBy?: {
    firstName: string;
    lastName: string;
    email: string;
  };
  
  // Case counts
  strokeCasesCount?: number;
  traumaCasesCount?: number;
  stemiCasesCount?: number;
}

export interface CreatePatientData {
  mrn?: string;
  nationalId?: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  dateOfBirth?: string; // Will be removed after migration
  age?: number; // Age in years
  gender: 'MALE' | 'FEMALE';
  maritalStatus?: 'SINGLE' | 'MARRIED' | 'DIVORCED' | 'WIDOWED' | 'SEPARATED' | 'UNKNOWN';
  phoneNumber?: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  emergencyContact?: string;
  emergencyPhone?: string;
  emergencyEmail?: string;
  emergencyRelationship?: string;
  insuranceProvider?: string;
  insuranceNumber?: string;
  insuranceGroup?: string;
  insuranceExpiry?: string;
  bloodType?: string;
  rhFactor?: string;
  allergies?: string;
  medications?: string;
  medicalHistory?: string;
  riskFactors?: string;
  chronicConditions?: string;
  weight?: number;
  height?: number;
  privacyLevel?: 'PUBLIC' | 'INTERNAL' | 'PRIVATE' | 'RESTRICTED' | 'CONFIDENTIAL';
  consentGiven?: boolean;
  dataRetentionPolicy?: string;
}

export interface Ticket {
  id: string;
  ticketNumber: string;
  patientId: string;
  originHospitalId: string;
  destinationHospitalId?: string;
  priority: string;
  status: string;
  pathway: string;
  chiefComplaint: string;
  symptoms?: string;
  vitals?: string;
  diagnostics?: string;
  treatmentPlan?: string;
  emsContactTime?: string;
  actualArrival?: string;
  transportMode?: string;
  emsUnit?: string;
  transportNotes?: string;
  requiresBlood: boolean;
  requiresSpecialist: boolean;
  requiresICU: boolean;
  requiresVentilator: boolean;
  requiredResources?: string;
  isEmergency: boolean;
  emergencyType?: string;
  emergencySeverity?: string;
  notes?: string;
  internalNotes?: string;
  externalNotes?: string;
  createdAt: string;
  updatedAt: string;
  createdById: string;
  assignedToId?: string;
  completedById?: string;
  completedAt?: string;
  originHospital?: {
    id: string;
    name: string;
  };
  destinationHospital?: {
    id: string;
    name: string;
  };
  createdBy?: {
    firstName: string;
    lastName: string;
    email: string;
  };
  assignedTo?: {
    firstName: string;
    lastName: string;
    email: string;
  };
}

export interface PatientAccessLog {
  id: string;
  patientId: string;
  userId: string;
  accessType: string;
  accessMethod: string;
  ipAddress?: string;
  userAgent?: string;
  reason?: string;
  timestamp: string;
  user?: {
    firstName: string;
    lastName: string;
    email: string;
    role: string;
  };
}

export interface PatientWithDetails extends Patient {
  tickets?: Ticket[];
  medicalRecords?: MedicalRecord[];
  accessLogs?: PatientAccessLog[];
  lastAccessedByUser?: {
    firstName: string;
    lastName: string;
    email: string;
    role: string;
  };
  _count?: {
    tickets: number;
    medicalRecords: number;
    accessLogs: number;
  };
}

export interface PatientFilter {
  search?: string;
  gender?: string;
  maritalStatus?: string;
  privacyLevel?: string;
  startDate?: string;
  endDate?: string;
  bloodType?: string;
  hasInsurance?: boolean;
  hospitalId?: string;
}

export interface DuplicateMatch {
  patientId: string;
  confidence: number;
  matchReason: string;
  matchedFields: string[];
}

export interface DuplicateGroup {
  groupId: string;
  patients: DuplicateMatch[];
  primaryPatientId: string;
  totalConfidence: number;
}

class PatientService {
  async getPatients(
    page = 1,
    limit = 50,
    filters?: PatientFilter
  ): Promise<{ data: Patient[]; total: number; page: number; limit: number; pages: number }> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    
    // Add filters if provided
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, value.toString());
        }
      });
    }
    
    const response = await apiClient.get(`/patients?${params}`);
    return response.data;
  }

  async searchPatients(query: string): Promise<Patient[]> {
    const response = await apiClient.get(`/patients/search?q=${encodeURIComponent(query)}`);
    return response.data;
  }

  async getPatient(id: string): Promise<Patient> {
    const response = await apiClient.get(`/patients/${id}`);
    return response.data;
  }

  async getPatientById(id: string): Promise<PatientWithDetails> {
    const response = await apiClient.get(`/patients/${id}`);
    return response.data;
  }

  async createPatient(data: CreatePatientData): Promise<Patient> {
    const response = await apiClient.post('/patients', data);
    return response.data;
  }

  async updatePatient(id: string, data: Partial<CreatePatientData>): Promise<Patient> {
    const response = await apiClient.put(`/patients/${id}`, data);
    return response.data;
  }

  async deletePatient(id: string): Promise<void> {
    await apiClient.delete(`/patients/${id}`);
  }

  async detectDuplicates(patientId: string, confidenceThreshold = 0.8): Promise<DuplicateMatch[]> {
    const response = await apiClient.get(`/patients/${patientId}/duplicates?threshold=${confidenceThreshold}`);
    return response.data;
  }

  async getDuplicateGroups(): Promise<DuplicateGroup[]> {
    const response = await apiClient.get('/patients/duplicates/groups');
    return response.data;
  }

  async mergeDuplicates(primaryPatientId: string, duplicatePatientIds: string[]): Promise<void> {
    await apiClient.post('/patients/duplicates/merge', {
      primaryPatientId,
      duplicatePatientIds,
    });
  }

  async exportPatient(patientId: string, format: 'PDF' | 'JSON' | 'CSV' = 'PDF', options?: {
    includeMedicalRecords?: boolean;
    includeAccessLogs?: boolean;
  }): Promise<Blob> {
    const params = new URLSearchParams({
      format,
      includeMedicalRecords: options?.includeMedicalRecords?.toString() || 'true',
      includeAccessLogs: options?.includeAccessLogs?.toString() || 'false',
    });
    
    const response = await apiClient.get(`/patients/${patientId}/export?${params}`, {
      responseType: 'blob',
    });
    return response.data;
  }

  async getPatientStatistics(): Promise<{
    total: number;
    byGender: Record<string, number>;
    byPrivacyLevel: Record<string, number>;
    byBloodType: Record<string, number>;
    recentActivity: number;
  }> {
    const response = await apiClient.get('/patients/statistics');
    return response.data;
  }

  async getPatientAccessLogs(patientId: string, page = 1, limit = 20): Promise<{
    data: Array<{
      id: string;
      userId: string;
      accessType: string;
      accessMethod: string;
      ipAddress?: string;
      timestamp: string;
      reason?: string;
      user: {
        firstName: string;
        lastName: string;
        email: string;
      };
    }>;
    total: number;
    page: number;
    limit: number;
  }> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    
    const response = await apiClient.get(`/patients/${patientId}/access-logs?${params}`);
    return response.data;
  }

  async getLatestCaseInfo(nationalId: string): Promise<{
    caseType: 'stroke' | 'trauma' | 'stemi' | null;
    caseId: string | null;
    createdAt: string | null;
    status: string | null;
  }> {
    const response = await apiClient.get(`/patients/latest-case/${encodeURIComponent(nationalId)}`);
    return response.data;
  }
}

export const patientService = new PatientService();
