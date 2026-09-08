import { apiClient } from './apiClient';

export type MaternalStatus = 'ALIVE' | 'DECEASED';
export type PerinatalStatus = 'ALIVE' | 'STILLBIRTH' | 'NEONATAL_DEATH' | 'UNKNOWN';

export interface PregnancyOutcome {
  id: string;
  caseId: string;
  createdAt: string;
  updatedAt: string;
  maternalStatus: MaternalStatus;
  maternalIcuAdmission: boolean;
  massiveTransfusion: boolean;
  eclampsiaEvent: boolean;
  majorPph: boolean;
  perinatalStatus: PerinatalStatus;
  nicuAdmission: boolean;
  apgar5?: number;
  reviewFlag: boolean;
  pregnancyCase?: { id: string; patientId: string };
}

export interface CreatePregnancyOutcomeData {
  caseId: string;
  maternalStatus: MaternalStatus;
  maternalIcuAdmission?: boolean;
  massiveTransfusion?: boolean;
  eclampsiaEvent?: boolean;
  majorPph?: boolean;
  perinatalStatus: PerinatalStatus;
  nicuAdmission?: boolean;
  apgar5?: number;
}

export interface UpdatePregnancyOutcomeData extends Partial<CreatePregnancyOutcomeData> {
  reviewFlag?: boolean;
}

export interface PregnancyOutcomeFilters {
  caseId?: string;
  maternalStatus?: MaternalStatus;
  perinatalStatus?: PerinatalStatus;
  reviewFlag?: boolean;
  limit?: number;
  offset?: number;
}

class PregnancyOutcomeService {
  async create(data: CreatePregnancyOutcomeData): Promise<PregnancyOutcome> {
    const response = await apiClient.post('/pregnancy-outcomes', data);
    return response.data;
  }

  async getAll(filters?: PregnancyOutcomeFilters): Promise<{ data: PregnancyOutcome[]; total: number }> {
    const params = new URLSearchParams();
    if (filters?.caseId) params.append('caseId', filters.caseId);
    if (filters?.maternalStatus) params.append('maternalStatus', filters.maternalStatus);
    if (filters?.perinatalStatus) params.append('perinatalStatus', filters.perinatalStatus);
    if (filters?.reviewFlag !== undefined) params.append('reviewFlag', String(filters.reviewFlag));
    if (filters?.limit) params.append('limit', filters.limit.toString());
    if (filters?.offset) params.append('offset', filters.offset.toString());

    const response = await apiClient.get(`/pregnancy-outcomes?${params.toString()}`);
    return response.data;
  }

  async getByCaseId(caseId: string): Promise<PregnancyOutcome> {
    const response = await apiClient.get(`/pregnancy-outcomes/by-case/${caseId}`);
    return response.data;
  }

  async getById(id: string): Promise<PregnancyOutcome> {
    const response = await apiClient.get(`/pregnancy-outcomes/${id}`);
    return response.data;
  }

  async update(id: string, data: UpdatePregnancyOutcomeData): Promise<PregnancyOutcome> {
    const response = await apiClient.patch(`/pregnancy-outcomes/${id}`, data);
    return response.data;
  }
}

export const pregnancyOutcomeService = new PregnancyOutcomeService();
