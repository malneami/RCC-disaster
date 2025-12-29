import { apiClient } from '../../../services/apiClient';

export type BedStatus = 'OCCUPIED' | 'VACANT' | 'CLEANING' | 'BLOCKED' | 'RESERVED';
export type BedType = 'ICU' | 'PICU' | 'NICU' | 'ED' | 'MALE_WARD' | 'FEMALE_WARD' | 'PEDIATRIC_WARD' | 'STANDARD_WARD' | 'STROKE_UNIT' | 'CCU' | 'OTHER';

export interface Unit {
  id: string;
  name: string;
  bedType: BedType;
}

export interface BedListItem {
  id: string;
  bedNumber: string;
  status: BedStatus;
  isOperational: boolean;
  unitName: string;
  hospital?: {
    id: string;
    name: string;
  };
  currentPatientName?: string;
}

export interface Bed {
  id: string;
  bedNumber: string;
  status: BedStatus;
  location?: string;
  isOperational: boolean;
  caseId?: string;
  caseType?: CaseType;
  unit: {
    id: string;
    name: string;
    bedType: BedType;
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
}

export interface GetBedsParams {
  hospitalId?: string;
  unitId?: string;
  status?: BedStatus;
}

export interface GetBedStatsParams {
  hospitalId?: string;
  unitId?: string;
}

export interface BedStats {
  total: number;
  vacant: number;
  occupied: number;
  cleaning: number;
  blocked: number;
  reserved: number;
}

export type CaseType = 'TRAUMA' | 'STEMI' | 'STROKE';

export interface BedStatusHistoryItem {
  id: string;
  previousStatus: BedStatus | null;
  newStatus: BedStatus;
  changedAt: string;
  reason?: string | null;
  notes?: string | null;
  patientId?: string | null;
  caseId?: string | null;
  caseType?: CaseType | null;
  changedBy: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  patient?: {
    id: string;
    name: string;
    nationalId?: string | null;
    mrn?: string | null;
  } | null;
}

class BedService {
  async getBeds(params?: GetBedsParams): Promise<BedListItem[]> {
    const queryParams = new URLSearchParams();
    if (params?.hospitalId) {
      queryParams.append('hospitalId', params.hospitalId);
    }
    if (params?.unitId) {
      queryParams.append('unitId', params.unitId);
    }
    if (params?.status) {
      queryParams.append('status', params.status);
    }

    const url = `/beds${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await apiClient.get<BedListItem[]>(url);
    return response.data;
  }

  async getBedStats(params?: GetBedStatsParams): Promise<BedStats> {
    const queryParams = new URLSearchParams();
    if (params?.hospitalId) {
      queryParams.append('hospitalId', params.hospitalId);
    }
    if (params?.unitId) {
      queryParams.append('unitId', params.unitId);
    }
    const url = `/beds/stats${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await apiClient.get<BedStats>(url);
    return response.data;
  }

  async getBedById(id: string): Promise<Bed> {
    const response = await apiClient.get<Bed>(`/beds/${id}`);
    return response.data;
  }

  async getUnits(hospitalId?: string): Promise<Unit[]> {
    const queryParams = new URLSearchParams();
    if (hospitalId) {
      queryParams.append('hospitalId', hospitalId);
    }
    const url = `/beds/units${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await apiClient.get<Unit[]>(url);
    return response.data;
  }

  async updateBedStatus(
    bedId: string,
    status: BedStatus,
    reason?: string,
    notes?: string,
  ): Promise<Bed> {
    const response = await apiClient.patch<Bed>(`/beds/${bedId}/status`, {
      status,
      reason,
      notes,
    });
    return response.data;
  }

  async getBedStatusHistory(bedId: string): Promise<BedStatusHistoryItem[]> {
    const response = await apiClient.get<BedStatusHistoryItem[]>(`/beds/${bedId}/history`);
    return response.data;
  }

  async createBed(data: {
    unitId: string;
    bedNumber: string;
    location?: string;
    notes?: string;
    isOperational?: boolean;
  }): Promise<Bed> {
    const response = await apiClient.post<Bed>('/beds', data);
    return response.data;
  }

  async deleteBed(bedId: string): Promise<void> {
    await apiClient.patch(`/beds/${bedId}`);
  }

  async assignBed(
    bedId: string,
    data: {
      patientId: string;
      caseId?: string;
      caseType?: CaseType;
      arrivalDate?: string;
    },
  ): Promise<Bed> {
    const response = await apiClient.patch<Bed>(`/beds/${bedId}/assign`, data);
    return response.data;
  }
}

export const bedService = new BedService();