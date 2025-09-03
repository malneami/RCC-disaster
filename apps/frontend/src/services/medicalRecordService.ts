import { apiClient } from './apiClient';

export interface MedicalRecord {
  id: string;
  patientId: string;
  recordType: MedicalRecordType;
  title: string;
  description?: string;
  diagnosis?: string;
  treatment?: string;
  medications?: string;
  testResults?: string;
  attachments?: string;
  recordDate: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: {
    firstName: string;
    lastName: string;
    email: string;
  };
}

export type MedicalRecordType = 
  | 'CONSULTATION'
  | 'LABORATORY'
  | 'RADIOLOGY'
  | 'SURGERY'
  | 'MEDICATION'
  | 'VACCINATION'
  | 'ALLERGY'
  | 'CHRONIC_CONDITION'
  | 'EMERGENCY_VISIT'
  | 'FOLLOW_UP'
  | 'REFERRAL'
  | 'DISCHARGE'
  | 'OTHER';

export interface CreateMedicalRecordData {
  patientId: string;
  recordType: MedicalRecordType;
  title: string;
  description?: string;
  diagnosis?: string;
  treatment?: string;
  medications?: string;
  testResults?: string;
  attachments?: string;
  recordDate: string;
}

export interface UpdateMedicalRecordData extends Partial<CreateMedicalRecordData> {
  id: string;
}

class MedicalRecordService {
  async getMedicalRecords(patientId: string): Promise<MedicalRecord[]> {
    const response = await apiClient.get(`/patients/${patientId}/medical-records`);
    return response.data;
  }

  async getMedicalRecord(id: string): Promise<MedicalRecord> {
    const response = await apiClient.get(`/medical-records/${id}`);
    return response.data;
  }

  async createMedicalRecord(data: CreateMedicalRecordData): Promise<MedicalRecord> {
    const response = await apiClient.post('/medical-records', data);
    return response.data;
  }

  async updateMedicalRecord(id: string, data: Partial<CreateMedicalRecordData>): Promise<MedicalRecord> {
    const response = await apiClient.put(`/medical-records/${id}`, data);
    return response.data;
  }

  async deleteMedicalRecord(id: string): Promise<void> {
    await apiClient.delete(`/medical-records/${id}`);
  }
}

export const medicalRecordService = new MedicalRecordService();
