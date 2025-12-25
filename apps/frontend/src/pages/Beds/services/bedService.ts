import { apiClient } from '../../../services/apiClient';

export type BedStatus = 'OCCUPIED' | 'VACANT' | 'CLEANING' | 'BLOCKED' | 'RESERVED';
export type BedType = 'ICU' | 'PICU' | 'NICU' | 'ED' | 'MALE_WARD' | 'FEMALE_WARD' | 'PEDIATRIC_WARD' | 'STANDARD_WARD' | 'STROKE_UNIT' | 'CCU' | 'OTHER';

export interface Unit {
  id: string;
  name: string;
  bedType: BedType;
}

export interface Bed {
  id: string;
  bedNumber: string;
  status: BedStatus;
  location?: string;
  isOperational: boolean;
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

export interface BedStatusHistoryItem {
  id: string;
  previousStatus: BedStatus | null;
  newStatus: BedStatus;
  changedAt: string;
  reason?: string | null;
  notes?: string | null;
  changedBy: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

class BedService {
  async getBeds(params?: GetBedsParams): Promise<Bed[]> {
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
    const response = await apiClient.get<Bed[]>(url);
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
}



export const bedService = new BedService();

