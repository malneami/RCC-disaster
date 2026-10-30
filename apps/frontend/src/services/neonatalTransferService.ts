import { apiClient } from './apiClient';

export type NeonatalTransferStatus =
  | 'CREATED'
  | 'ACTIVATED'
  | 'NEONATOLOGIST_CONNECTED'
  | 'DECISION_MADE'
  | 'DISPATCHED'
  | 'DEPARTED'
  | 'ARRIVED'
  | 'CLOSED';

export type NeonatalAcuityLevel = 'RED' | 'ORANGE' | 'YELLOW';
export type NicuLevel = 'LEVEL_I' | 'LEVEL_II' | 'LEVEL_III';
export type NicuCotType = 'INCUBATOR' | 'OPEN_WARMER' | 'VENTILATED';
export type NeonatalRespiratorySupport =
  | 'ROOM_AIR'
  | 'LOW_FLOW'
  | 'HIGH_FLOW'
  | 'CPAP'
  | 'NIPPV'
  | 'INVASIVE_VENT'
  | 'HFOV';
export type NeonatalAcceptanceStatus = 'PENDING' | 'ACCEPTED' | 'DECLINED';
export type NeonatalTransportTeam = 'NEONATAL_RETRIEVAL' | 'ALS' | 'BLS' | 'AIR';

export interface NeonatalTransfer {
  id: string;
  ticketId: string;
  patientId: string;
  obMaternalTransferId?: string;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  status: NeonatalTransferStatus;
  gestationalAgeWeeks: number;
  gestationalAgeDays?: number;
  birthWeightGrams?: number;
  ageHours?: number;
  apgar1?: number;
  apgar5?: number;
  apgar10?: number;
  antenatalSteroids?: boolean;
  hr?: number;
  rr?: number;
  temp?: number;
  spo2?: number;
  preDuctalSpo2?: number;
  postDuctalSpo2?: number;
  bloodGlucose?: number;
  respiratorySupport?: NeonatalRespiratorySupport;
  fiO2?: number;
  surfactantGiven?: boolean;
  inotropes?: boolean;
  therapeuticHypothermia?: boolean;
  seizure?: boolean;
  suspectedConditions?: string[];
  stabilizationDone?: string[];
  acuityLevel: NeonatalAcuityLevel;
  tripsScore?: number;
  cribIIScore?: number;
  requiredNicuLevel: NicuLevel;
  requiredCotType: NicuCotType;
  referringFacilityId: string;
  referringContactName?: string;
  referringContactPhone?: string;
  destinationHospitalId?: string;
  assignedBedId?: string;
  acceptanceStatus: NeonatalAcceptanceStatus;
  transportTeam: NeonatalTransportTeam;
  transportIncubator?: boolean;
  activatedAt?: string;
  neonatologistConnectedAt?: string;
  decisionAt?: string;
  dispatchedAt?: string;
  departedAt?: string;
  arrivedAt?: string;
  closedAt?: string;
  ticket?: { id: string; ticketNumber: string };
  patient?: {
    id: string;
    firstName: string;
    lastName: string;
    mrn?: string;
    nationalId?: string;
    age?: number;
  };
  createdBy?: { id: string; firstName: string; lastName: string; email?: string };
  referringFacility?: { id: string; name: string };
  destinationHospital?: { id: string; name: string };
  assignedBed?: { id: string; bedNumber: string; nicuCotType?: NicuCotType; nicuLevel?: NicuLevel };
}

export interface CreateNeonatalTransferData {
  ticketId: string;
  patientId: string;
  obMaternalTransferId?: string;
  gestationalAgeWeeks: number;
  gestationalAgeDays?: number;
  birthWeightGrams?: number;
  ageHours?: number;
  apgar1?: number;
  apgar5?: number;
  apgar10?: number;
  antenatalSteroids?: boolean;
  hr?: number;
  rr?: number;
  temp?: number;
  spo2?: number;
  preDuctalSpo2?: number;
  postDuctalSpo2?: number;
  bloodGlucose?: number;
  respiratorySupport?: NeonatalRespiratorySupport;
  fiO2?: number;
  surfactantGiven?: boolean;
  inotropes?: boolean;
  therapeuticHypothermia?: boolean;
  seizure?: boolean;
  suspectedConditions?: string[];
  stabilizationDone?: string[];
  acuityLevel: NeonatalAcuityLevel;
  tripsScore?: number;
  cribIIScore?: number;
  requiredNicuLevel: NicuLevel;
  requiredCotType: NicuCotType;
  referringFacilityId: string;
  referringContactName?: string;
  referringContactPhone?: string;
  destinationHospitalId?: string;
  assignedBedId?: string;
  acceptanceStatus?: NeonatalAcceptanceStatus;
  transportTeam: NeonatalTransportTeam;
  transportIncubator?: boolean;
}

export interface UpdateNeonatalTransferData extends Partial<CreateNeonatalTransferData> {
  status?: NeonatalTransferStatus;
  activatedAt?: string;
  neonatologistConnectedAt?: string;
  decisionAt?: string;
  dispatchedAt?: string;
  departedAt?: string;
  arrivedAt?: string;
  closedAt?: string;
}

export interface NeonatalTransferFilters {
  ticketId?: string;
  patientId?: string;
  status?: NeonatalTransferStatus;
  acuityLevel?: NeonatalAcuityLevel;
  requiredNicuLevel?: NicuLevel;
  referringFacilityId?: string;
  destinationHospitalId?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
}

export interface NicuKpiSummary {
  totalTransfers: number;
  redCount: number;
  orangeCount: number;
  yellowCount: number;
  avgActivationToNeonatologist?: number | null;
  avgActivationToDispatch?: number | null;
  avgDispatchToArrival?: number | null;
  cotMatchRate?: number | null;
  normothermiaOnArrival?: number | null;
  declinedForCapacityRate?: number | null;
  inUteroVsExUteroRatio?: number | null;
  byHospital?: Array<{
    hospitalId: string;
    hospitalName: string;
    totalTransfers: number;
    red: number;
    orange: number;
    yellow: number;
  }>;
  dailyTrend?: Array<{
    date: string;
    total: number;
    red: number;
    orange: number;
    yellow: number;
  }>;
}

export interface NicuKpiFilters {
  hospitalId?: string;
  startDate?: string;
  endDate?: string;
}

class NeonatalTransferService {
  async create(data: CreateNeonatalTransferData): Promise<NeonatalTransfer> {
    const response = await apiClient.post('/neonatal-transfers', data);
    return response.data;
  }

  async getAll(
    filters?: NeonatalTransferFilters,
  ): Promise<{ data: NeonatalTransfer[]; total: number }> {
    const params = new URLSearchParams();
    if (filters?.ticketId) params.append('ticketId', filters.ticketId);
    if (filters?.patientId) params.append('patientId', filters.patientId);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.acuityLevel) params.append('acuityLevel', filters.acuityLevel);
    if (filters?.requiredNicuLevel) params.append('requiredNicuLevel', filters.requiredNicuLevel);
    if (filters?.referringFacilityId)
      params.append('referringFacilityId', filters.referringFacilityId);
    if (filters?.destinationHospitalId)
      params.append('destinationHospitalId', filters.destinationHospitalId);
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);
    if (filters?.limit) params.append('limit', filters.limit.toString());
    if (filters?.offset) params.append('offset', filters.offset.toString());

    const response = await apiClient.get(`/neonatal-transfers?${params.toString()}`);
    return response.data;
  }

  async getById(id: string): Promise<NeonatalTransfer> {
    const response = await apiClient.get(`/neonatal-transfers/${id}`);
    return response.data;
  }

  async getKPISummary(filters?: NicuKpiFilters): Promise<NicuKpiSummary> {
    const params = new URLSearchParams();
    if (filters?.hospitalId) params.append('hospitalId', filters.hospitalId);
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);
    const response = await apiClient.get(`/neonatal-transfers/kpi-summary?${params.toString()}`);
    return response.data;
  }

  async update(id: string, data: UpdateNeonatalTransferData): Promise<NeonatalTransfer> {
    const response = await apiClient.patch(`/neonatal-transfers/${id}`, data);
    return response.data;
  }
}

export const neonatalTransferService = new NeonatalTransferService();
