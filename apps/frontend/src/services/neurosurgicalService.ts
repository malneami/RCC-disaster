import { apiClient } from './apiClient';

export type NeurosurgicalTriggerReason =
  | 'TRAUMATIC_BRAIN_INJURY'
  | 'INTRACRANIAL_HEMORRHAGE'
  | 'SUBDURAL_HEMATOMA'
  | 'EPIDURAL_HEMATOMA'
  | 'SUBARACHNOID_HEMORRHAGE'
  | 'DEPRESSED_SKULL_FRACTURE'
  | 'HYDROCEPHALUS'
  | 'SPINAL_CORD_INJURY'
  | 'SPINAL_COMPRESSION'
  | 'INTRACRANIAL_MASS_RAISED_ICP'
  | 'POSTOPERATIVE_COMPLICATION'
  | 'OTHER';

export type NeurosurgicalSeverity = 'RED' | 'ORANGE';
export type NeurosurgicalPupils = 'EQUAL' | 'UNEQUAL' | 'FIXED';
export type NeurosurgicalGcsTrend = 'IMPROVING' | 'STABLE' | 'DETERIORATING';
export type NeurosurgicalDisposition =
  | 'OPERATING_ROOM'
  | 'ICU'
  | 'OBSERVATION'
  | 'CONSERVATIVE'
  | 'NO_INTERVENTION';
export type NeurosurgicalOutcome =
  | 'IMPROVED'
  | 'STABLE'
  | 'DETERIORATED'
  | 'SEVERE_DISABILITY'
  | 'DEATH';
export type NeurosurgicalDefinitiveTreatment =
  | 'SURGERY'
  | 'ICU_MANAGEMENT'
  | 'CONSERVATIVE_TREATMENT'
  | 'NO_NEUROSURGICAL_INTERVENTION';
export type NeurosurgicalCaseStatus = 'ACTIVE' | 'DEFINITIVE_CARE_REACHED' | 'CLOSED';

export interface NeurosurgicalCase {
  id: string;
  ticketId: string;
  patientId: string;
  createdById: string;
  originHospitalId: string;
  destinationHospitalId?: string | null;
  status: NeurosurgicalCaseStatus;
  activatedAt: string;
  triggerReason: NeurosurgicalTriggerReason;
  triggerReasonOther?: string | null;
  gcs?: number | null;
  gcsTrend?: NeurosurgicalGcsTrend | null;
  pupils?: NeurosurgicalPupils | null;
  newFocalDeficit: boolean;
  seizure: boolean;
  intubated: boolean;
  hemodynamicInstability: boolean;
  anticoagulantUse: boolean;
  mechanismOfInjury?: string | null;
  severity: NeurosurgicalSeverity;
  severityOverrideReason?: string | null;
  doorTime?: string | null;
  doorOutTime?: string | null;
  rccActivationTime?: string | null;
  ctLocation?: 'ORIGIN' | 'DESTINATION' | null;
  ctScanStartTime?: string | null;
  ctReportFinalTime?: string | null;
  neurosurgeonNotifiedAt?: string | null;
  neurosurgeonConnectedAt?: string | null;
  definitiveDisposition?: NeurosurgicalDisposition | null;
  dispositionDetail?: Record<string, unknown> | null;
  definitiveCareReachedAt?: string | null;
  doorToCtMinutes?: number | null;
  doorToCtReportMinutes?: number | null;
  activationToNeurosurgeonMinutes?: number | null;
  doorOutToDefinitiveCareMinutes?: number | null;
  activationToDefinitiveCareMinutes?: number | null;
  metKpi1?: boolean | null;
  metKpi2?: boolean | null;
  metKpi3?: boolean | null;
  metKpi4?: boolean | null;
  metKpi5?: boolean | null;
  metKpi6?: boolean | null;
  brainPreserved?: boolean | null;
  neurologicalOutcome?: NeurosurgicalOutcome | null;
  definitiveTreatment?: NeurosurgicalDefinitiveTreatment | null;
  deteriorationDuringTransfer: boolean;
  cardiacArrestDuringTransfer: boolean;
  unplannedIntubation: boolean;
  delayedIntervention: boolean;
  wrongDestination: boolean;
  repeatTransferRequired: boolean;
  reviewFlag: boolean;
  closedAt?: string | null;
  closedById?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
  ticket?: {
    id: string;
    ticketNumber: string;
    pathway: string;
    status: string;
    priority: string;
    createdAt: string;
    emsContactTime?: string | null;
  };
  patient?: {
    id: string;
    firstName: string;
    lastName: string;
    mrn?: string | null;
    nationalId?: string | null;
    age?: number | null;
    gender?: string;
  };
  createdBy?: { id: string; firstName?: string; lastName?: string; email?: string };
  closedBy?: { id: string; firstName?: string; lastName?: string } | null;
  originHospital?: { id: string; name: string; cluster?: string };
  destinationHospital?: { id: string; name: string; cluster?: string } | null;
}

export interface NeurosurgicalKPIMetric {
  met: number;
  total: number;
  percentage: number;
}

export interface NeurosurgicalKPISummary {
  totalCases: number;
  casesThisMonth: number;
  casesThisWeek: number;
  severityBreakdown: { red: number; orange: number };
  kpiPerformance: {
    kpi1: NeurosurgicalKPIMetric;
    kpi2: NeurosurgicalKPIMetric;
    kpi3: NeurosurgicalKPIMetric;
    kpi4: NeurosurgicalKPIMetric;
    kpi5: NeurosurgicalKPIMetric;
    kpi6: NeurosurgicalKPIMetric;
  };
  averageTimings: {
    doorToCt: number;
    doorToCtReport: number;
    activationToNeurosurgeon: number;
    doorOutToDefinitiveCare?: number;
    activationToDefinitiveCare: number;
  };
  brainPreservationRate: number;
  outcomes: {
    improved: number;
    stable: number;
    deteriorated: number;
    severeDisability: number;
    death: number;
  };
}

export interface CreateNeurosurgicalCaseData {
  ticketId: string;
  patientId?: string;
  originHospitalId?: string;
  destinationHospitalId?: string;
  triggerReason: NeurosurgicalTriggerReason;
  triggerReasonOther?: string;
  gcs?: number;
  gcsTrend?: NeurosurgicalGcsTrend;
  pupils?: NeurosurgicalPupils;
  newFocalDeficit?: boolean;
  seizure?: boolean;
  intubated?: boolean;
  hemodynamicInstability?: boolean;
  anticoagulantUse?: boolean;
  mechanismOfInjury?: string;
  severity?: NeurosurgicalSeverity;
  severityOverrideReason?: string;
  doorTime?: string;
  doorOutTime?: string;
  rccActivationTime?: string;
  ctLocation?: 'ORIGIN' | 'DESTINATION';
  ctScanStartTime?: string;
  ctReportFinalTime?: string;
  neurosurgeonNotifiedAt?: string;
  neurosurgeonConnectedAt?: string;
  notes?: string;
}

export type ActivateFromTicketData = Omit<
  CreateNeurosurgicalCaseData,
  'ticketId' | 'patientId' | 'originHospitalId' | 'destinationHospitalId'
>;

export type UpdateNeurosurgicalCaseData = Partial<
  ActivateFromTicketData & {
    destinationHospitalId?: string | null;
    doorOutTime?: string;
    rccActivationTime?: string;
    ctLocation?: 'ORIGIN' | 'DESTINATION';
    definitiveCareReachedAt?: string;
    definitiveDisposition?: NeurosurgicalDisposition;
    dispositionDetail?: Record<string, unknown>;
    neurologicalOutcome?: NeurosurgicalOutcome;
    definitiveTreatment?: NeurosurgicalDefinitiveTreatment;
    deteriorationDuringTransfer?: boolean;
    cardiacArrestDuringTransfer?: boolean;
    unplannedIntubation?: boolean;
    delayedIntervention?: boolean;
    wrongDestination?: boolean;
    repeatTransferRequired?: boolean;
  }
>;

export interface NeurosurgicalCaseListResponse {
  items: NeurosurgicalCase[];
  total: number;
  limit: number;
  offset: number;
}

export const TRIGGER_REASON_LABELS: Record<NeurosurgicalTriggerReason, string> = {
  TRAUMATIC_BRAIN_INJURY: 'Traumatic brain injury',
  INTRACRANIAL_HEMORRHAGE: 'Intracranial hemorrhage',
  SUBDURAL_HEMATOMA: 'Subdural hematoma',
  EPIDURAL_HEMATOMA: 'Epidural hematoma',
  SUBARACHNOID_HEMORRHAGE: 'Subarachnoid hemorrhage',
  DEPRESSED_SKULL_FRACTURE: 'Depressed skull fracture',
  HYDROCEPHALUS: 'Hydrocephalus',
  SPINAL_CORD_INJURY: 'Spinal cord injury',
  SPINAL_COMPRESSION: 'Spinal compression',
  INTRACRANIAL_MASS_RAISED_ICP: 'Intracranial mass / raised ICP',
  POSTOPERATIVE_COMPLICATION: 'Postoperative neurosurgical complication',
  OTHER: 'Other',
};

export const DISPOSITION_LABELS: Record<NeurosurgicalDisposition, string> = {
  OPERATING_ROOM: 'Operating Room',
  ICU: 'ICU',
  OBSERVATION: 'Observation / Ward',
  CONSERVATIVE: 'Conservative management',
  NO_INTERVENTION: 'No neurosurgical intervention',
};

export const OUTCOME_LABELS: Record<NeurosurgicalOutcome, string> = {
  IMPROVED: 'Improved',
  STABLE: 'Stable',
  DETERIORATED: 'Deteriorated',
  SEVERE_DISABILITY: 'Severe neurological disability',
  DEATH: 'Death',
};

export const neurosurgicalService = {
  async create(data: CreateNeurosurgicalCaseData): Promise<NeurosurgicalCase> {
    const { data: result } = await apiClient.post('/neurosurgical-cases', data);
    return result;
  },

  async activateFromTicket(
    ticketId: string,
    data: ActivateFromTicketData,
  ): Promise<NeurosurgicalCase> {
    const { data: result } = await apiClient.post(
      `/neurosurgical-cases/from-ticket/${ticketId}`,
      data,
    );
    return result;
  },

  async list(params?: {
    ticketId?: string;
    patientId?: string;
    status?: NeurosurgicalCaseStatus;
    severity?: NeurosurgicalSeverity;
    originHospitalId?: string;
    limit?: number;
    offset?: number;
  }): Promise<NeurosurgicalCaseListResponse> {
    const { data } = await apiClient.get('/neurosurgical-cases', { params });
    return data;
  },

  async getById(id: string): Promise<NeurosurgicalCase> {
    const { data } = await apiClient.get(`/neurosurgical-cases/${id}`);
    return data;
  },

  async update(id: string, data: UpdateNeurosurgicalCaseData): Promise<NeurosurgicalCase> {
    const { data: result } = await apiClient.patch(`/neurosurgical-cases/${id}`, data);
    return result;
  },

  async close(id: string): Promise<NeurosurgicalCase> {
    const { data } = await apiClient.post(`/neurosurgical-cases/${id}/close`);
    return data;
  },

  async getKpiSummary(filters?: {
    hospitalId?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<NeurosurgicalKPISummary> {
    const { data } = await apiClient.get('/neurosurgical-cases/kpis', { params: filters });
    return data;
  },
};
