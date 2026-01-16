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
  attachments?: MedicalRecordAttachment[];
  recordDate: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: {
    firstName: string;
    lastName: string;
    email: string;
  };
}

export interface MedicalRecordAttachment {
  id: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
  uploadedAt: string;
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
  attachments?: {
    fileName: string;
    mimeType: string;
    fileSize: number;
    fileData: string;
    file?: File; 
  }[];
  recordDate: string;
}

export interface UpdateMedicalRecordData extends Partial<CreateMedicalRecordData> {
  id: string;
}

export interface MedicalRecordAccessLog {
  id: string;
  medicalRecordId: string;
  userId: string;
  accessType: string;
  accessMethod: string;
  ipAddress?: string;
  userAgent?: string;
  reason?: string;
  timestamp: string;
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
  };
  medicalRecord?: {
    id: string;
    title: string;
    recordType: string;
    patientId: string;
  };
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
    const response = await apiClient.patch(`/medical-records/${id}`, data);
    return response.data;
  }

  async deleteMedicalRecord(id: string): Promise<void> {
    await apiClient.delete(`/medical-records/${id}`);
  }

  async getAttachment(attachmentId: string): Promise<MedicalRecordAttachment & { fileData: string }> {
    const response = await apiClient.get(`/medical-records/attachments/${attachmentId}`);
    return response.data;
  }

  async deleteAttachment(attachmentId: string): Promise<void> {
    await apiClient.delete(`/medical-records/attachments/${attachmentId}`);
  }

  async uploadAttachment(medicalRecordId: string, file: File): Promise<MedicalRecordAttachment> {
    const formData = new FormData();
    formData.append('file', file);
    const response = await apiClient.post(
      `/medical-records/${medicalRecordId}/attachments`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  }

  async getAccessLogs(filters?: {
    page?: number;
    limit?: number;
    medicalRecordId?: string;
    userId?: string;
    accessType?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<{
    data: MedicalRecordAccessLog[];
    total: number;
    page: number;
    limit: number;
    pages: number;
  }> {
    const params = new URLSearchParams();
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());
    if (filters?.medicalRecordId) params.append('medicalRecordId', filters.medicalRecordId);
    if (filters?.userId) params.append('userId', filters.userId);
    if (filters?.accessType) params.append('accessType', filters.accessType);
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);
    
    const response = await apiClient.get(`/medical-records/access-logs?${params}`);
    return response.data;
  }
}

export const medicalRecordService = new MedicalRecordService();
