import { apiClient } from './apiClient';

export type ObMaternalTransferStatus =
  | 'CREATED'
  | 'ACTIVATED'
  | 'OB_CONNECTED'
  | 'DECISION_MADE'
  | 'DISPATCHED'
  | 'DEPARTED'
  | 'ARRIVED'
  | 'CLOSED';

export type ObActivationLevel = 'MATERNAL_RED' | 'MATERNAL_ORANGE';
export type ObExpectedDeliveryMode = 'VAGINAL' | 'CESAREAN' | 'PENDING';
export type ObSystemSuggestedDeliveryMode = 'LIKELY_CS' | 'LIKELY_VAGINAL' | 'PENDING';
export type ObPhysicianConfirmedDeliveryMode = 'VAGINAL' | 'CESAREAN';
export type ObAcceptanceStatus = 'PENDING' | 'ACCEPTED' | 'DECLINED';
export type ObAmbulanceType = 'BLS' | 'ALS' | 'AIR';
export type ObConsciousness = 'ALERT' | 'VERBAL' | 'PAIN' | 'UNRESPONSIVE';
export type ObBleeding = 'NONE' | 'MILD' | 'MODERATE' | 'SEVERE';
export type ObFetalStatus = 'REASSURING' | 'NONREASSURING' | 'UNKNOWN';

export interface ObMaternalTransfer {
  id: string;
  ticketId: string;
  patientId: string;
  pregnancyCaseId?: string;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  status: ObMaternalTransferStatus;
  gestationalAgeWeeks: number;
  gravida?: number;
  para?: number;
  sbp?: number;
  dbp?: number;
  hr?: number;
  rr?: number;
  temp?: number;
  spo2?: number;
  consciousness?: ObConsciousness;
  bleeding?: ObBleeding;
  seizure?: boolean;
  suspectedConditions?: string[];
  fetalStatus?: ObFetalStatus;
  fetalHeartRate?: number;
  hb?: number;
  platelets?: number;
  glucose?: number;
  urineProtein?: string;
  labsOther?: Record<string, unknown>;
  stabilizationDone?: string[];
  referringFacilityId: string;
  referringContactName?: string;
  referringContactPhone?: string;
  activationLevel: ObActivationLevel;
  expectedDeliveryMode: ObExpectedDeliveryMode;
  systemSuggestedDeliveryMode?: ObSystemSuggestedDeliveryMode;
  physicianConfirmedDeliveryMode?: ObPhysicianConfirmedDeliveryMode;
  destinationHospitalId?: string;
  acceptanceStatus: ObAcceptanceStatus;
  ambulanceType: ObAmbulanceType;
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
}

export interface CreateObMaternalTransferData {
  ticketId: string;
  patientId: string;
  pregnancyCaseId?: string;
  gestationalAgeWeeks: number;
  gravida?: number;
  para?: number;
  sbp?: number;
  dbp?: number;
  hr?: number;
  rr?: number;
  temp?: number;
  spo2?: number;
  consciousness?: ObConsciousness;
  bleeding?: ObBleeding;
  seizure?: boolean;
  suspectedConditions?: string[];
  fetalStatus?: ObFetalStatus;
  fetalHeartRate?: number;
  hb?: number;
  platelets?: number;
  glucose?: number;
  urineProtein?: string;
  labsOther?: Record<string, unknown>;
  stabilizationDone?: string[];
  referringFacilityId: string;
  referringContactName?: string;
  referringContactPhone?: string;
  activationLevel: ObActivationLevel;
  expectedDeliveryMode: ObExpectedDeliveryMode;
  systemSuggestedDeliveryMode?: ObSystemSuggestedDeliveryMode;
  physicianConfirmedDeliveryMode?: ObPhysicianConfirmedDeliveryMode;
  destinationHospitalId?: string;
  acceptanceStatus?: ObAcceptanceStatus;
  ambulanceType: ObAmbulanceType;
}

export interface UpdateObMaternalTransferData extends Partial<CreateObMaternalTransferData> {
  status?: ObMaternalTransferStatus;
}

export interface ObMaternalTransferFilters {
  ticketId?: string;
  patientId?: string;
  status?: ObMaternalTransferStatus;
  referringFacilityId?: string;
  destinationHospitalId?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
}

export interface ObMaternalKpiSummary {
  totalCases: number;
  maternalRedCount: number;
  maternalOrangeCount: number;
  maternalMortalityRate?: number | null;
  nicuRate?: number | null;
  vaginalPercentage?: number | null;
  cesareanPercentage?: number | null;
  documentationCompleteness?: number | null;
  kpiPerformance?: Record<
    string,
    { met: number; total: number; percentage: number }
  >;
  byHospital?: Array<{
    hospitalId: string;
    hospitalName: string;
    totalCases: number;
    maternalRed: number;
    maternalOrange: number;
    maternalMortalityRate?: number;
    nicuRate?: number;
  }>;
  dailyTrend?: Array<{
    date: string;
    total: number;
    red: number;
    orange: number;
  }>;
}

export interface ObMaternalKpiFilters {
  hospitalId?: string;
  startDate?: string;
  endDate?: string;
}

class ObMaternalTransferService {
  async create(data: CreateObMaternalTransferData): Promise<ObMaternalTransfer> {
    const response = await apiClient.post('/ob-maternal-transfers', data);
    return response.data;
  }

  async getAll(filters?: ObMaternalTransferFilters): Promise<{ data: ObMaternalTransfer[]; total: number }> {
    const params = new URLSearchParams();
    if (filters?.ticketId) params.append('ticketId', filters.ticketId);
    if (filters?.patientId) params.append('patientId', filters.patientId);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.referringFacilityId) params.append('referringFacilityId', filters.referringFacilityId);
    if (filters?.destinationHospitalId) params.append('destinationHospitalId', filters.destinationHospitalId);
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);
    if (filters?.limit) params.append('limit', filters.limit.toString());
    if (filters?.offset) params.append('offset', filters.offset.toString());

    const response = await apiClient.get(`/ob-maternal-transfers?${params.toString()}`);
    return response.data;
  }

  async getById(id: string): Promise<ObMaternalTransfer> {
    const response = await apiClient.get(`/ob-maternal-transfers/${id}`);
    return response.data;
  }

  async getKPISummary(
    filters?: ObMaternalKpiFilters,
  ): Promise<ObMaternalKpiSummary> {
    const params = new URLSearchParams();
    if (filters?.hospitalId) params.append('hospitalId', filters.hospitalId);
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);
    const response = await apiClient.get(
      `/ob-maternal-transfers/kpi-summary?${params.toString()}`,
    );
    return response.data;
  }

  async update(id: string, data: UpdateObMaternalTransferData): Promise<ObMaternalTransfer> {
    const response = await apiClient.patch(`/ob-maternal-transfers/${id}`, data);
    return response.data;
  }
}

export const obMaternalTransferService = new ObMaternalTransferService();
