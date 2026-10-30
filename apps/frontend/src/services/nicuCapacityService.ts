import { apiClient } from './apiClient';
import type { NicuLevel, NicuCotType } from './neonatalTransferService';

export interface NicuCotTypeCounts {
  total: number;
  vacant: number;
}

export interface NicuHospitalCapacity {
  hospitalId: string;
  hospitalName: string;
  cluster: string;
  nicuLevel: NicuLevel | null;
  total: number;
  vacant: number;
  occupied: number;
  reserved: number;
  byCotType: Record<NicuCotType, NicuCotTypeCounts>;
}

export interface NicuCapacityResponse {
  totals: { total: number; vacant: number; occupied: number; reserved: number };
  byHospital: NicuHospitalCapacity[];
}

export interface NicuMatchCandidate {
  hospitalId: string;
  hospitalName: string;
  nicuLevel: NicuLevel | null;
  levelFit: number;
  vacantOfRequiredCot: number;
  totalVacant: number;
}

export interface NicuMatchResponse {
  requirement: {
    requiredNicuLevel: NicuLevel;
    requiredCotType: NicuCotType;
    cluster?: string;
    originHospitalId?: string;
  };
  matches: NicuMatchCandidate[];
}

class NicuCapacityService {
  async getCapacity(filters?: {
    hospitalId?: string;
    cluster?: string;
  }): Promise<NicuCapacityResponse> {
    const params = new URLSearchParams();
    if (filters?.hospitalId) params.append('hospitalId', filters.hospitalId);
    if (filters?.cluster) params.append('cluster', filters.cluster);
    const response = await apiClient.get(`/nicu-capacity?${params.toString()}`);
    return response.data;
  }

  async match(params: {
    requiredNicuLevel: NicuLevel;
    requiredCotType: NicuCotType;
    cluster?: string;
    originHospitalId?: string;
  }): Promise<NicuMatchResponse> {
    const q = new URLSearchParams();
    q.append('requiredNicuLevel', params.requiredNicuLevel);
    q.append('requiredCotType', params.requiredCotType);
    if (params.cluster) q.append('cluster', params.cluster);
    if (params.originHospitalId) q.append('originHospitalId', params.originHospitalId);
    const response = await apiClient.get(`/nicu-capacity/match?${q.toString()}`);
    return response.data;
  }

  async reserveCot(bedId: string, neonatalTransferId: string): Promise<unknown> {
    const response = await apiClient.post(`/nicu-capacity/${bedId}/reserve`, {
      neonatalTransferId,
    });
    return response.data;
  }
}

export const nicuCapacityService = new NicuCapacityService();
