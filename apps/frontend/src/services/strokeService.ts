import { apiClient } from './apiClient';

// Stroke Types
export type StrokeType = 'ISCHEMIC' | 'HEMORRHAGIC' | 'TIA' | 'UNKNOWN';
export type StrokeSeverity = 'MILD' | 'MODERATE' | 'SEVERE' | 'CRITICAL';
export type StrokeStatus = 'SUSPECTED' | 'CONFIRMED' | 'IMAGING_PENDING' | 'IMAGING_COMPLETE' | 'TREATMENT_EVALUATION' | 'THROMBOLYSIS_STARTED' | 'THROMBECTOMY_STARTED' | 'TREATMENT_COMPLETE' | 'STROKEUNIT_ADMITTED' | 'REHABILITATION_STARTED' | 'DISCHARGED' | 'FOLLOW_UP';
export type StrokeTreatment = 'IV_THROMBOLYSIS' | 'MECHANICAL_THROMBECTOMY' | 'COMBINED_THERAPY' | 'CONSERVATIVE_MANAGEMENT' | 'SURGICAL_INTERVENTION' | 'NOT_ELIGIBLE';
export type StrokeEventType = 'ARRIVAL' | 'TRIAGE' | 'ASSESSMENT' | 'IMAGING' | 'LABORATORY' | 'TREATMENT_START' | 'TREATMENT_COMPLETE' | 'TRANSFER' | 'DISCHARGE' | 'COMPLICATION' | 'FOLLOWUP';

// Patient Info for auto-creation
export interface PatientInfo {
  mrn?: string;
  nationalId?: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  dateOfBirth?: string;
  gender?: 'MALE' | 'FEMALE' | 'UNKNOWN';
  phoneNumber?: string;
  email?: string;
}

// Stroke Case Interfaces
export interface StrokeCase {
  id: string;
  ticketId: string;
  patientId: string;
  originHospitalId: string;
  destinationHospitalId?: string;
  strokeType: StrokeType;
  strokeSubtype?: string;
  strokeSeverity?: StrokeSeverity;
  
  // Clinical Assessments
  nihssBaseline?: number;
  nihss24hr?: number;
  nihssDischarge?: number;
  mrsBaseline?: number;
  mrs90day?: number;
  barthelBaseline?: number;
  barthelDischarge?: number;
  aspectsScore?: number;
  gcsBaseline?: number;
  
  // Symptom & Presentation
  presentingSymptoms?: string;
  symptomOnset?: string;
  symptomToHospitalMinutes?: number;
  lastKnownWell?: string;
  wakeUpStroke?: boolean;
  
  // Treatment Details
  currentStatus: StrokeStatus;
  selectedTreatment?: StrokeTreatment;
  eligibleForThrombolysis?: boolean;
  thrombolysisContraindications?: string;
  eligibleForThrombectomy?: boolean;
  thrombectomyContraindications?: string;
  
  // Pathway Timings
  pathwayStarted?: string;
  pathwayCompleted?: string;
  strokeUnitAdmissionTime?: string;
  
  // Key Performance Timings (minutes)
  doorToImagingMinutes?: number;
  doorToNeedleMinutes?: number;
  doorToGroinMinutes?: number;
  symptomNeedleMinutes?: number;
  symptomGroinMinutes?: number;
  imagingToNeedleMinutes?: number;
  imagingToGroinMinutes?: number;
  
  // Clinical Assessments Timeline
  dysphagiaScreeningMinutes?: number;
  earlyMobilizationHours?: number;
  speechTherapyHours?: number;
  physiotherapyHours?: number;
  occupationalTherapyHours?: number;
  
  // Imaging Results
  ctResults?: string;
  ctaResults?: string;
  ctpResults?: string;
  mriResults?: string;
  mraResults?: string;
  echocardiogram?: string;
  carotidUcsDoppler?: string;
  
  // Treatment Outcomes
  successful?: boolean;
  recanalizationGrade?: string;
  complications?: string;
  secondaryPrevention?: string;
  
  // Discharge & Follow-up
  dischargeDestination?: string;
  dischargeDate?: string;
  lengthOfStayDays?: number;
  thirtyDayReadmission?: boolean;
  ninetyDayMortality?: boolean;
  followUpCallCompleted?: boolean;
  followUpCallDate?: string;
  
  // KPI Tracking
  metKpi1?: boolean;
  metKpi2?: boolean;
  metKpi3?: boolean;
  metKpi4?: boolean;
  metKpi5?: boolean;
  metKpi6?: boolean;
  metKpi7?: boolean;
  metKpi8?: boolean;
  
  // Relations
  ticket?: {
    id: string;
    ticketNumber: string;
    pathway: string;
    status: string;
  };
  patient?: {
    id: string;
    firstName: string;
    lastName: string;
    nationalId?: string;
    mrn?: string;
    dateOfBirth: string;
    gender: string;
    phoneNumber?: string;
    email?: string;
  };
  originHospital?: {
    id: string;
    name: string;
    hasStrokeUnit: boolean;
    hasThrombolysis: boolean;
    hasThrombectomy: boolean;
  };
  destinationHospital?: {
    id: string;
    name: string;
    hasStrokeUnit: boolean;
    hasThrombolysis: boolean;
    hasThrombectomy: boolean;
  };
  createdBy?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  timeline?: StrokeTimeline[];
  assessmentScores?: StrokeAssessmentScore[];
  rehabilitation?: StrokeRehabilitation[];
  
  createdAt: string;
  updatedAt: string;
}

export interface StrokeTimeline {
  id: string;
  strokeCaseId: string;
  ticketId: string;
  fromStatus?: StrokeStatus;
  toStatus: StrokeStatus;
  eventTimestamp: string;
  eventDescription: string;
  eventLocation?: string;
  eventType: StrokeEventType;
  triggeredBy: string;
  minutesFromSymptom?: number;
  minutesFromAdmission?: number;
  withinTarget?: boolean;
  targetMinutes?: number;
  nihssAtSession?: number;
  clinicalNotes?: string;
  
  // Relations
  strokeCase?: {
    id: string;
    strokeType: StrokeType;
    currentStatus: StrokeStatus;
    patient?: {
      id: string;
      firstName: string;
      lastName: string;
    };
  };
  ticket?: {
    id: string;
    ticketNumber: string;
    status: string;
  };
  triggeredByUser?: {
    id: string;
    firstName: string;
    lastName: string;
    role: string;
  };
  createdBy?: {
    id: string;
    firstName: string;
    lastName: string;
  };
  
  createdAt: string;
}

export interface StrokeAssessmentScore {
  id: string;
  strokeCaseId: string;
  patientId: string;
  assessmentType: string; // NIHSS, MRS, BARTHEL, ASPECTS, GCS
  assessmentTiming: string; // BASELINE, 24HR, DISCHARGE, 90DAY
  totalScore?: number;
  subScores?: string; // JSON for detailed breakdown
  assessorName?: string;
  assessorQualification?: string;
  assessmentDateTime: string;
  assessmentNotes?: string;
  createdAt: string;
}

export interface StrokeRehabilitation {
  id: string;
  strokeCaseId: string;
  patientId: string;
  rehabilitationType: string; // PHYSIOTHERAPY, SPEECH, OCCUPATIONAL
  startDate?: string;
  endDate?: string;
  frequency?: string;
  durationMinutes?: number;
  initialGoals?: string;
  progressNotes?: string;
  dischargeRecommendations?: string;
  functionalImprovement?: boolean;
  goalsMeet?: boolean;
  therapistId?: string;
  rehabilitationCenterId?: string;
  createdAt: string;
  updatedAt: string;
}

// Create/Update DTOs
export interface CreateStrokeCaseData {
  ticketId?: string;
  patientId?: string;
  patientInfo?: PatientInfo;
  chiefComplaint?: string;
  originHospitalId: string;
  destinationHospitalId?: string;
  strokeType: StrokeType;
  strokeSubtype?: string;
  strokeSeverity?: StrokeSeverity;
  nihssBaseline?: number;
  nihss24hr?: number;
  nihssDischarge?: number;
  mrsBaseline?: number;
  mrs90day?: number;
  barthelBaseline?: number;
  barthelDischarge?: number;
  aspectsScore?: number;
  gcsBaseline?: number;
  presentingSymptoms?: string;
  symptomOnset?: string;
  symptomToHospitalMinutes?: number;
  lastKnownWell?: string;
  wakeUpStroke?: boolean;
  currentStatus: StrokeStatus;
  selectedTreatment?: StrokeTreatment;
  eligibleForThrombolysis?: boolean;
  thrombolysisContraindications?: string;
  eligibleForThrombectomy?: boolean;
  thrombectomyContraindications?: string;
  pathwayStarted?: string;
  pathwayCompleted?: string;
  strokeUnitAdmissionTime?: string;
  doorToImagingMinutes?: number;
  doorToNeedleMinutes?: number;
  doorToGroinMinutes?: number;
  symptomNeedleMinutes?: number;
  symptomGroinMinutes?: number;
  imagingToNeedleMinutes?: number;
  imagingToGroinMinutes?: number;
  dysphagiaScreeningMinutes?: number;
  earlyMobilizationHours?: number;
  speechTherapyHours?: number;
  physiotherapyHours?: number;
  occupationalTherapyHours?: number;
  ctResults?: string;
  ctaResults?: string;
  ctpResults?: string;
  mriResults?: string;
  mraResults?: string;
  echocardiogram?: string;
  carotidUcsDoppler?: string;
  successful?: boolean;
  recanalizationGrade?: string;
  complications?: string;
  secondaryPrevention?: string;
  dischargeDestination?: string;
  dischargeDate?: string;
  lengthOfStayDays?: number;
  thirtyDayReadmission?: boolean;
  ninetyDayMortality?: boolean;
  followUpCallCompleted?: boolean;
  followUpCallDate?: string;
}

export interface CreateStrokeTimelineData {
  strokeCaseId: string;
  ticketId: string;
  fromStatus?: StrokeStatus;
  toStatus: StrokeStatus;
  eventTimestamp: string;
  eventDescription: string;
  eventLocation?: string;
  eventType: StrokeEventType;
  triggeredBy: string;
  minutesFromSymptom?: number;
  minutesFromAdmission?: number;
  withinTarget?: boolean;
  targetMinutes?: number;
  nihssAtSession?: number;
  clinicalNotes?: string;
}

// Filter interfaces
export interface StrokeCaseFilters {
  hospitalId?: string;
  strokeType?: StrokeType;
  status?: StrokeStatus;
  dateFrom?: string;
  dateTo?: string;
}

export interface StrokeTimelineFilters {
  strokeCaseId?: string;
  ticketId?: string;
  eventType?: StrokeEventType;
  dateFrom?: string;
  dateTo?: string;
}

// KPI Summary interface
export interface StrokeKPISummary {
  totalCases: number;
  strokeTypeBreakdown: {
    ischemic: number;
    hemorrhagic: number;
    tia: number;
  };
  kpiPerformance: {
    kpi1: { met: number; total: number; percentage: number };
    kpi2: { met: number; total: number; percentage: number };
    kpi3: { met: number; total: number; percentage: number };
    kpi4: { met: number; total: number; percentage: number };
    kpi5: { met: number; total: number; percentage: number };
    kpi6: { met: number; total: number; percentage: number };
    kpi7: { met: number; total: number; percentage: number };
    kpi8: { met: number; total: number; percentage: number };
  };
  averageTimings: {
    doorToImaging: number;
    doorToNeedle: number;
    doorToGroin: number;
  };
  outcomes: {
    successRate: number;
    readmissionRate: number;
    mortalityRate: number;
    averageLengthOfStay: number;
    independentDischargeRate: number;
  };
}

// Stroke Service Class
export class StrokeService {
  // Stroke Cases
  static async createStrokeCase(data: CreateStrokeCaseData): Promise<StrokeCase> {
    // Filter data to only include fields that exist in the backend DTO
    const filteredData = {
      ticketId: data.ticketId,
      patientId: data.patientId,
      patientInfo: data.patientInfo ? {
        firstName: data.patientInfo.firstName,
        lastName: data.patientInfo.lastName,
        nationalId: data.patientInfo.nationalId,
        mrn: data.patientInfo.mrn,
        dateOfBirth: data.patientInfo.dateOfBirth,
        gender: data.patientInfo.gender,
        phoneNumber: data.patientInfo.phoneNumber,
        email: data.patientInfo.email
      } : undefined,
      chiefComplaint: data.chiefComplaint,
      originHospitalId: data.originHospitalId,
      strokeType: data.strokeType,
      currentStatus: data.currentStatus,
      strokeSeverity: data.strokeSeverity,
      selectedTreatment: data.selectedTreatment
    };
    
    console.log('Sending filtered data:', filteredData);
    const response = await apiClient.post('/stroke-cases', filteredData);
    return response.data;
  }

  static async getStrokeCases(filters?: StrokeCaseFilters): Promise<StrokeCase[]> {
    const params = new URLSearchParams();
    if (filters?.hospitalId) params.append('hospitalId', filters.hospitalId);
    if (filters?.strokeType) params.append('strokeType', filters.strokeType);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.dateFrom) params.append('dateFrom', filters.dateFrom);
    if (filters?.dateTo) params.append('dateTo', filters.dateTo);

    const response = await apiClient.get(`/stroke-cases?${params.toString()}`);
    return response.data;
  }

  static async getStrokeCase(id: string): Promise<StrokeCase> {
    const response = await apiClient.get(`/stroke-cases/${id}`);
    return response.data;
  }

  static async updateStrokeCase(id: string, data: Partial<CreateStrokeCaseData>): Promise<StrokeCase> {
    const response = await apiClient.patch(`/stroke-cases/${id}`, data);
    return response.data;
  }

  static async deleteStrokeCase(id: string): Promise<void> {
    await apiClient.delete(`/stroke-cases/${id}`);
  }

  // Stroke Timeline
  static async createStrokeTimeline(data: CreateStrokeTimelineData): Promise<StrokeTimeline> {
    const response = await apiClient.post('/stroke-timeline', data);
    return response.data;
  }

  static async getStrokeTimeline(filters?: StrokeTimelineFilters): Promise<StrokeTimeline[]> {
    const params = new URLSearchParams();
    if (filters?.strokeCaseId) params.append('strokeCaseId', filters.strokeCaseId);
    if (filters?.ticketId) params.append('ticketId', filters.ticketId);
    if (filters?.eventType) params.append('eventType', filters.eventType);
    if (filters?.dateFrom) params.append('dateFrom', filters.dateFrom);
    if (filters?.dateTo) params.append('dateTo', filters.dateTo);

    const response = await apiClient.get(`/stroke-timeline?${params.toString()}`);
    return response.data;
  }

  static async getStrokeTimelineForCase(strokeCaseId: string): Promise<StrokeTimeline[]> {
    const response = await apiClient.get(`/stroke-timeline/case/${strokeCaseId}`);
    return response.data;
  }

  static async getStrokeTimelineForTicket(ticketId: string): Promise<StrokeTimeline[]> {
    const response = await apiClient.get(`/stroke-timeline/ticket/${ticketId}`);
    return response.data;
  }

  static async getCriticalEvents(hospitalId?: string, hoursBack?: number): Promise<StrokeTimeline[]> {
    const params = new URLSearchParams();
    if (hospitalId) params.append('hospitalId', hospitalId);
    if (hoursBack) params.append('hoursBack', hoursBack.toString());

    const response = await apiClient.get(`/stroke-timeline/critical-events?${params.toString()}`);
    return response.data;
  }

  static async getStrokeTimelineEvent(id: string): Promise<StrokeTimeline> {
    const response = await apiClient.get(`/stroke-timeline/${id}`);
    return response.data;
  }

  static async updateStrokeTimeline(id: string, data: Partial<CreateStrokeTimelineData>): Promise<StrokeTimeline> {
    const response = await apiClient.patch(`/stroke-timeline/${id}`, data);
    return response.data;
  }

  static async deleteStrokeTimeline(id: string): Promise<void> {
    await apiClient.delete(`/stroke-timeline/${id}`);
  }

  // KPI Summary
  static async getKPISummary(hospitalId?: string, year?: number, month?: number): Promise<StrokeKPISummary> {
    const params = new URLSearchParams();
    if (hospitalId) params.append('hospitalId', hospitalId);
    if (year) params.append('year', year.toString());
    if (month) params.append('month', month.toString());

    const response = await apiClient.get(`/stroke-cases/kpi-summary?${params.toString()}`);
    return response.data;
  }

  // Utility functions
  static getStrokeTypeLabel(strokeType: StrokeType): string {
    const labels: Record<StrokeType, string> = {
      ISCHEMIC: 'Ischemic Stroke',
      HEMORRHAGIC: 'Hemorrhagic Stroke',
      TIA: 'Transient Ischemic Attack',
      UNKNOWN: 'Unknown',
    };
    return labels[strokeType] || strokeType;
  }

  static getStrokeSeverityLabel(severity: StrokeSeverity): string {
    const labels: Record<StrokeSeverity, string> = {
      MILD: 'Mild',
      MODERATE: 'Moderate',
      SEVERE: 'Severe',
      CRITICAL: 'Critical',
    };
    return labels[severity] || severity;
  }

  static getStrokeStatusLabel(status: StrokeStatus): string {
    const labels: Record<StrokeStatus, string> = {
      SUSPECTED: 'Suspected',
      CONFIRMED: 'Confirmed',
      IMAGING_PENDING: 'Imaging Pending',
      IMAGING_COMPLETE: 'Imaging Complete',
      TREATMENT_EVALUATION: 'Treatment Evaluation',
      THROMBOLYSIS_STARTED: 'Thrombolysis Started',
      THROMBECTOMY_STARTED: 'Thrombectomy Started',
      TREATMENT_COMPLETE: 'Treatment Complete',
      STROKEUNIT_ADMITTED: 'Stroke Unit Admitted',
      REHABILITATION_STARTED: 'Rehabilitation Started',
      DISCHARGED: 'Discharged',
      FOLLOW_UP: 'Follow Up',
    };
    return labels[status] || status;
  }

  static getStrokeTreatmentLabel(treatment: StrokeTreatment): string {
    const labels: Record<StrokeTreatment, string> = {
      IV_THROMBOLYSIS: 'IV Thrombolysis',
      MECHANICAL_THROMBECTOMY: 'Mechanical Thrombectomy',
      COMBINED_THERAPY: 'Combined Therapy',
      CONSERVATIVE_MANAGEMENT: 'Conservative Management',
      SURGICAL_INTERVENTION: 'Surgical Intervention',
      NOT_ELIGIBLE: 'Not Eligible',
    };
    return labels[treatment] || treatment;
  }

  static getEventTypeLabel(eventType: StrokeEventType): string {
    const labels: Record<StrokeEventType, string> = {
      ARRIVAL: 'Arrival',
      TRIAGE: 'Triage',
      ASSESSMENT: 'Assessment',
      IMAGING: 'Imaging',
      LABORATORY: 'Laboratory',
      TREATMENT_START: 'Treatment Start',
      TREATMENT_COMPLETE: 'Treatment Complete',
      TRANSFER: 'Transfer',
      DISCHARGE: 'Discharge',
      COMPLICATION: 'Complication',
      FOLLOWUP: 'Follow Up',
    };
    return labels[eventType] || eventType;
  }

  static getKPILabel(kpiNumber: number): string {
    const labels: Record<number, string> = {
      1: 'Door to Imaging ≤25min',
      2: 'Door to Needle ≤60min',
      3: 'Door to Groin ≤90min',
      4: 'Stroke Unit Admission ≤4hr',
      5: 'Dysphagia Screening ≤4hr',
      6: 'Early Mobilization ≤24hr',
      7: 'Secondary Prevention Prescribed',
      8: 'Appropriate Rehabilitation Referral',
    };
    return labels[kpiNumber] || `KPI ${kpiNumber}`;
  }

  static calculateNIHSSSeverity(nihssScore: number): StrokeSeverity {
    if (nihssScore <= 4) return 'MILD';
    if (nihssScore <= 15) return 'MODERATE';
    if (nihssScore <= 20) return 'SEVERE';
    return 'CRITICAL';
  }

  static formatDuration(minutes: number): string {
    if (minutes < 60) {
      return `${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
  }

  static isKPIMet(kpiValue: boolean | undefined): boolean {
    return kpiValue === true;
  }

  static getKPIColor(percentage: number): string {
    if (percentage >= 90) return 'text-green-600';
    if (percentage >= 75) return 'text-yellow-600';
    return 'text-red-600';
  }

  static getKPIBadgeColor(percentage: number): string {
    if (percentage >= 90) return 'bg-green-100 text-green-800';
    if (percentage >= 75) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  }

  // Delete stroke case
  static async deleteStrokeCase(id: string): Promise<void> {
    try {
      console.log('Deleting stroke case:', id);
      await apiClient.delete(`/stroke-cases/${id}`);
      console.log('Stroke case deleted successfully');
    } catch (error) {
      console.error('Error deleting stroke case:', error);
      throw error;
    }
  }

}

export default StrokeService;
