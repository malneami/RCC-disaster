import { apiClient } from '../../../services/apiClient';

// Types
export interface PatientInfo {
  firstName: string;
  lastName: string;
  nationalId: string;
  dateOfBirth?: string; // Will be removed after migration
  age?: number; // Age in years
  gender: 'MALE' | 'FEMALE';
  phoneNumber?: string;
  address?: string;
  emergencyContact?: string;
  emergencyPhone?: string;
  medicalHistory?: string;
  allergies?: string;
  medications?: string;
  originHospitalId: string;
  destinationHospitalId?: string;
}

export interface CriticalTimestamps {
  triageTime?: string;
  firstEcgTime?: string;
}

export interface InterventionsAndTreatments {
  eligibleForPrimaryPci?: boolean;
  pciType?: 'PRIMARY' | 'NON_PRIMARY' | 'RESCUE_PCI';
  pciLocation?: string;
  doorOutTime?: string;
  balloonInflationTime?: string;
  thrombolyticGiven?: boolean;
  thrombolyticAdminTime?: string;
  fibrinolyticAbsoluteContraindications?: string;
  fibrinolyticRelativeContraindications?: string;
}

export interface ClinicalAssessment {
  heartScore?: number;
  clinicalRiskLevel?: string;
  presentingSymptoms?: string;
  symptomOnset?: string;
  symptomDuration?: number;
  miType?: 'STEMI' | 'NON_STEMI';
  outcome?: 'TRANSFERRED_TO_PCI_CAPABLE_HOSPITAL' | 'DAMA_FROM_ED' | 'DISCHARGED_ALIVE' | 'DAMA' | 'STILL_ADMITTED' | 'DIED';
}

export interface StemiCase {
  id: string;
  ticketId: string;
  patientId: string;
  originHospitalId: string;
  destinationHospitalId?: string;
  modeOfArrival?: 'AMBULANCE_RED_CRESCENT' | 'PRIVATE_CAR' | 'TRANSFERRED_FROM_ANOTHER_HOSPITAL';
  transferRequestDateTime?: string;
  transferArrivalDateTime?: string;
  caseType?: 'DIRECT' | 'TRANSFER';
  
  // Patient Information
  patient?: {
    id: string;
    firstName: string;
    lastName: string;
    nationalId: string;
    dateOfBirth?: string; // Will be removed after migration
    age?: number; // Age in years
    gender: 'MALE' | 'FEMALE';
    phoneNumber?: string;
    address?: string;
    emergencyContact?: string;
    emergencyPhone?: string;
    medicalHistory?: string;
    allergies?: string;
    medications?: string;
  };
  
  // Clinical Assessment
  heartScore?: number;
  clinicalRiskLevel?: string;
  presentingSymptoms?: string;
  symptomOnset?: string;
  symptomDuration?: number;
  miType?: 'STEMI' | 'NON_STEMI';
  outcome?: 'TRANSFERRED_TO_PCI_CAPABLE_HOSPITAL' | 'DAMA_FROM_ED' | 'DISCHARGED_ALIVE' | 'DAMA' | 'STILL_ADMITTED' | 'DIED';
  
  // Pathway Execution
  currentStatus: 'SUSPECTED' | 'ECG_PENDING' | 'STEMI_CONFIRMED' | 'NSTEMI_CONFIRMED' | 'UNSTABLE_ANGINA' | 'RCC_ACTIVATED' | 'IN_TRANSIT' | 'PCI_READY' | 'BALLOON_INFLATED' | 'CCU_ADMITTED' | 'DISCHARGED' | 'EXPIRED';
  selectedTreatment?: 'PRIMARY_PCI' | 'RESCUE_PCI' | 'FIBRINOLYSIS' | 'TRANSFER_FOR_PRIMARY_PCI' | 'MEDICAL_MANAGEMENT';
  pathwayStarted?: string;
  pathwayCompleted?: string;
  rccActivated: boolean;
  rccUnit?: string;
  
  // Critical Timestamps
  triageTime?: string;
  firstEcgTime?: string;
  
  // ECG Results
  ecgResult?: 'PENDING' | 'NORMAL' | 'STEMI_ANTERIOR' | 'STEMI_INFERIOR' | 'STEMI_LATERAL' | 'STEMI_POSTERIOR' | 'NSTEMI_CHANGES' | 'UNSTABLE_PATTERN' | 'TECHNICAL_ISSUE';
  ecgFindings?: string;
  
  // Interventions and Treatments
  eligibleForPrimaryPci?: boolean;
  pciType?: 'PRIMARY' | 'NON_PRIMARY' | 'RESCUE_PCI';
  pciLocation?: string;
  doorOutTime?: string;
  balloonInflationTime?: string;
  thrombolyticGiven?: boolean;
  thrombolyticAdminTime?: string;
  fibrinolyticAbsoluteContraindications?: string;
  fibrinolyticRelativeContraindications?: string;
  
  // Outcomes
  successful?: boolean;
  complications?: string;
  dischargeDate?: string;
  thirtyDayReadmission: boolean;
  followUpCallCompleted: boolean;
  followUpCallDate?: string;
  
  // PCI Procedure Phase
  cathLabActivationTime?: string;
  cathLabArrivalTime?: string;
  pciProcedureStartTime?: string;
  pciProcedureCompleteTime?: string;
  
  // Post-PCI Management Phase
  postPciComplications?: string;
  dischargeStatus?: string;
  dischargeMedications?: string;
  followUpAppointmentDate?: string;
  followUpAppointmentProvider?: string;
  
  // Outcome Form Management
  outcomeFormCompleted?: boolean;
  outcomeFormCompletionDate?: string;
  outcomePercentageCompleteness?: number;
  
  // Quality Metrics
  doorToEcgMinutes?: number;
  rccActivationToDoorOutMinutes?: number;
  doorInDoorOutMinutes?: number;
  doorToNeedleMinutes?: number;
  doorToBalloonMinutes?: number;
  metKpi1?: boolean;
  metKpi2?: boolean;
  metKpi2Direct?: boolean;
  metKpi2Transfer?: boolean;
  metKpi3?: boolean;
  metKpi4?: boolean;
  metKpi5?: boolean;
  metKpi6?: boolean;
  
  // Relations
  ticket: {
    id: string;
    ticketNumber: string;
    priority: string;
    status: string;
    pathway: string;
    stemiStatus?: string;
    stemiTreatmentPlan?: string;
    ecgResult?: string;
    ecgTime?: string;
    ecgFindings?: string;
    isTroponinPositive?: boolean;
    troponinValue?: number;
    firstMedicalContact?: string;
    createdAt: string;
    updatedAt: string;
  };
  originHospital: {
    id: string;
    name: string;
    cluster: string;
    hasPrimaryPci: boolean;
    pciLab24x7: boolean;
    hasFibrinolytics: boolean;
    ccuBeds: number;
    ccuBedsAvailable: number;
  };
  destinationHospital?: {
    id: string;
    name: string;
    cluster: string;
    hasPrimaryPci: boolean;
    pciLab24x7: boolean;
    hasFibrinolytics: boolean;
    ccuBeds: number;
    ccuBedsAvailable: number;
  };
  createdBy: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  timeline?: Array<{
    id: string;
    fromStatus: string;
    toStatus: string;
    eventTimestamp: string;
    eventDescription: string;
    eventLocation?: string;
    triggeredBy?: string;
  }>;
  
  createdAt: string;
  updatedAt: string;
}

export interface CreateStemiCaseData {
  ticketId?: string; // If provided, link to existing ticket instead of creating new one
  patientInfo: PatientInfo;
  admissionTime: string;
  modeOfArrival: 'AMBULANCE_RED_CRESCENT' | 'PRIVATE_CAR' | 'TRANSFERRED_FROM_ANOTHER_HOSPITAL';
  transferRequestDateTime?: string;
  transferArrivalDateTime?: string;
  criticalTimestamps: CriticalTimestamps;
  interventionsAndTreatments: InterventionsAndTreatments;
  clinicalAssessment: ClinicalAssessment;
  currentStatus?: 'SUSPECTED' | 'ECG_PENDING' | 'STEMI_CONFIRMED' | 'NSTEMI_CONFIRMED' | 'UNSTABLE_ANGINA' | 'RCC_ACTIVATED' | 'IN_TRANSIT' | 'PCI_READY' | 'BALLOON_INFLATED' | 'CCU_ADMITTED' | 'DISCHARGED' | 'EXPIRED';
  selectedTreatment?: 'PRIMARY_PCI' | 'RESCUE_PCI' | 'FIBRINOLYSIS' | 'TRANSFER_FOR_PRIMARY_PCI' | 'MEDICAL_MANAGEMENT';
  ecgResult?: 'PENDING' | 'NORMAL' | 'STEMI_ANTERIOR' | 'STEMI_INFERIOR' | 'STEMI_LATERAL' | 'STEMI_POSTERIOR' | 'NSTEMI_CHANGES' | 'UNSTABLE_PATTERN' | 'TECHNICAL_ISSUE';
  ecgFindings?: string;
  isTroponinPositive?: boolean;
  troponinValue?: number;
  additionalNotes?: string;
}

export interface UpdateStemiCaseData {
  patientInfo?: PatientInfo;
  admissionTime?: string;
  modeOfArrival?: 'AMBULANCE_RED_CRESCENT' | 'PRIVATE_CAR' | 'TRANSFERRED_FROM_ANOTHER_HOSPITAL';
  transferRequestDateTime?: string;
  transferArrivalDateTime?: string;
  criticalTimestamps?: CriticalTimestamps;
  interventionsAndTreatments?: InterventionsAndTreatments;
  clinicalAssessment?: ClinicalAssessment;
  currentStatus?: 'SUSPECTED' | 'ECG_PENDING' | 'STEMI_CONFIRMED' | 'NSTEMI_CONFIRMED' | 'UNSTABLE_ANGINA' | 'RCC_ACTIVATED' | 'IN_TRANSIT' | 'PCI_READY' | 'BALLOON_INFLATED' | 'CCU_ADMITTED' | 'DISCHARGED' | 'EXPIRED';
  selectedTreatment?: 'PRIMARY_PCI' | 'RESCUE_PCI' | 'FIBRINOLYSIS' | 'TRANSFER_FOR_PRIMARY_PCI' | 'MEDICAL_MANAGEMENT';
  ecgResult?: 'PENDING' | 'NORMAL' | 'STEMI_ANTERIOR' | 'STEMI_INFERIOR' | 'STEMI_LATERAL' | 'STEMI_POSTERIOR' | 'NSTEMI_CHANGES' | 'UNSTABLE_PATTERN' | 'TECHNICAL_ISSUE';
  ecgFindings?: string;
  isTroponinPositive?: boolean;
  troponinValue?: number;
  additionalNotes?: string;
}

export interface StemiFilterParams {
  patientId?: string;
  originHospitalId?: string;
  destinationHospitalId?: string;
  modeOfArrival?: string;
  currentStatus?: string;
  selectedTreatment?: string;
  ecgResult?: string;
  eligibleForPrimaryPci?: boolean;
  thrombolyticGiven?: boolean;
  isTroponinPositive?: boolean;
  rccActivated?: boolean;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
  search?: string;
}

export interface StemiCasesResponse {
  cases: StemiCase[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface StemiKpiResponse {
  totalCases: number;
  casesThisMonth: number;
  casesThisWeek: number;
  averageDoorToBalloonTime: number;
  averageDoorToNeedleTime: number;
  kpi1: {
    name: string;
    target: string;
    totalCases: number;
    withinTarget: number;
    percentage: number;
    status: 'GREEN' | 'YELLOW' | 'RED';
  };
  kpi2: {
    name: string;
    target: string;
    totalCases: number;
    withinTarget: number;
    percentage: number;
    status: 'GREEN' | 'YELLOW' | 'RED';
  };
  kpi2Direct: {
    name: string;
    target: string;
    totalCases: number;
    withinTarget: number;
    percentage: number;
    status: 'GREEN' | 'YELLOW' | 'RED';
  };
  kpi2Transfer: {
    name: string;
    target: string;
    totalCases: number;
    withinTarget: number;
    percentage: number;
    status: 'GREEN' | 'YELLOW' | 'RED';
  };
  kpi3: {
    name: string;
    target: string;
    totalCases: number;
    withinTarget: number;
    percentage: number;
    status: 'GREEN' | 'YELLOW' | 'RED';
  };
  kpi4: {
    name: string;
    target: string;
    totalCases: number;
    withinTarget: number;
    percentage: number;
    status: 'GREEN' | 'YELLOW' | 'RED';
  };
  kpi5: {
    name: string;
    target: string;
    totalCases: number;
    withinTarget: number;
    percentage: number;
    status: 'GREEN' | 'YELLOW' | 'RED';
  };
  kpi6: {
    name: string;
    target: string;
    totalCases: number;
    withinTarget: number;
    percentage: number;
    status: 'GREEN' | 'YELLOW' | 'RED';
  };
  kpi7: {
    name: string;
    target: string;
    totalTransfers: number;
    postFibrinolysis: number;
    percentage: number;
    status: string;
  };
  kpi8: {
    name: string;
    target: string;
    totalTransfers: number;
    primaryPci: number;
    percentage: number;
    status: string;
  };
  kpi9: {
    name: string;
    target: string;
    totalAdmissions: number;
    deaths: number;
    percentage: number;
    status: 'GREEN' | 'YELLOW' | 'RED';
  };
  kpi10: {
    name: string;
    target: string;
    totalDischarges: number;
    readmissions: number;
    percentage: number;
    status: 'GREEN' | 'YELLOW' | 'RED';
  };
  kpi11: {
    name: string;
    target: string;
    totalDischarges: number;
    followupCallsCompleted: number;
    percentage: number;
    status: 'GREEN' | 'YELLOW' | 'RED';
  };
}

// Service class
export class StemiService {

  static async getStemiCases(params: StemiFilterParams = {}): Promise<StemiCasesResponse> {
    const queryParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value.toString());
      }
    });

    const response = await apiClient.get(`/stemi-cases?${queryParams.toString()}`);
    return response.data;
  }

  static async getStemiCaseById(id: string): Promise<StemiCase> {
    const response = await apiClient.get(`/stemi-cases/${id}`);
    return response.data;
  }

  static async createStemiCase(data: CreateStemiCaseData): Promise<StemiCase> {
    const response = await apiClient.post('/stemi-cases', data);
    return response.data;
  }

  static async updateStemiCase(id: string, data: UpdateStemiCaseData): Promise<StemiCase> {
    const response = await apiClient.patch(`/stemi-cases/${id}`, data);
    return response.data;
  }

  static async deleteStemiCase(id: string): Promise<void> {
    await apiClient.delete(`/stemi-cases/${id}`);
  }

  static async getKpiSummary(hospitalId?: string, startDate?: string, endDate?: string): Promise<StemiKpiResponse> {
    const queryParams = new URLSearchParams();
    
    if (hospitalId) queryParams.append('hospitalId', hospitalId);
    if (startDate) queryParams.append('startDate', startDate);
    if (endDate) queryParams.append('endDate', endDate);

    const response = await apiClient.get(`/stemi-cases/kpis?${queryParams.toString()}`);
    return response.data;
  }
}
