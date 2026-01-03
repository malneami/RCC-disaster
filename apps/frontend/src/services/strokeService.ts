import { apiClient } from './apiClient';

// Stroke Types
export type StrokeType = 'ISCHEMIC' | 'HEMORRHAGIC' | 'TIA' | 'UNKNOWN';
export type StrokeSeverity = 'MILD' | 'MODERATE' | 'SEVERE' | 'CRITICAL';
export type StrokeStatus = 'SUSPECTED' | 'CONFIRMED' | 'IMAGING_PENDING' | 'IMAGING_COMPLETE' | 'TREATMENT_EVALUATION' | 'THROMBOLYSIS_STARTED' | 'THROMBECTOMY_STARTED' | 'TREATMENT_COMPLETE' | 'STROKEUNIT_ADMITTED' | 'REHABILITATION_STARTED' | 'DISCHARGED' | 'FOLLOW_UP';

// Stroke Toolkit Enums
export type StrokeModeOfArrival = 'AMBULANCE_RED_CRESCENT' | 'PRIVATE_CAR' | 'TRANSFERRED_FROM_ANOTHER_HOSPITAL';
export type StrokeTypeDetailed = 'ISCHEMIC_STROKE' | 'HEMORRHAGIC_STROKE' | 'TRANSIENT_ISCHEMIC_ATTACK_TIA' | 'UNKNOWN';
export type SwallowingScreeningResult = 'PASS' | 'FAIL' | 'NOT_APPLICABLE';
export type CTFindings = 'ISCHEMIC_CHANGES' | 'HEMORRHAGE' | 'NORMAL' | 'UNCLEAR' | 'OTHER';
export type CandidateAssessment = 'YES' | 'NO' | 'NOT_ASSESSED';
export type IVThrombolysisGiven = 'YES' | 'NO' | 'NOT_APPLICABLE';
export type StrokeDisposition = 'STROKE_UNIT' | 'ICU' | 'INPATIENT_WARD' | 'DISCHARGED_HOME' | 'DIED_BEFORE_ADMISSION' | 'TRANSFERRED_TO_ANOTHER_HOSPITAL' | 'DAMA' | 'IN_ED_WAITING_FOR_ADMISSION';
export type ReferralTo = 'STROKE_UNIT' | 'ICU' | 'NEUROLOGY' | 'INTERVENTIONAL_RADIOLOGY' | 'ANOTHER_HOSPITAL' | 'OTHER';
export type ModifiedRankinScale = 'SCORE_0' | 'SCORE_1' | 'SCORE_2' | 'SCORE_3' | 'SCORE_4' | 'SCORE_5' | 'SCORE_6_DEAD';
export type StrokeTreatment = 'IV_THROMBOLYSIS' | 'MECHANICAL_THROMBECTOMY' | 'COMBINED_THERAPY' | 'CONSERVATIVE_MANAGEMENT' | 'SURGICAL_INTERVENTION' | 'NOT_ELIGIBLE';
export type StrokeEventType = 'ARRIVAL' | 'TRIAGE' | 'ASSESSMENT' | 'IMAGING' | 'LABORATORY' | 'TREATMENT_START' | 'TREATMENT_COMPLETE' | 'TRANSFER' | 'DISCHARGE' | 'COMPLICATION' | 'FOLLOWUP';

// Patient Info for auto-creation
export interface PatientInfo {
  mrn?: string;
  nationalId?: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  dateOfBirth?: string; // Will be removed after migration
  age?: number; // Age in years
  gender?: 'MALE' | 'FEMALE';
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
  strokeSeverity?: StrokeSeverity;
  
  // Treatment Details
  currentStatus: StrokeStatus;
  selectedTreatment?: StrokeTreatment;
  eligibleForThrombolysis?: boolean;
  thrombolysisContraindications?: string;
  eligibleForThrombectomy?: boolean;
  thrombectomyContraindications?: string;
  
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
  
  // Legacy fields
  chiefComplaint?: string;
  presentingSymptoms?: string;
  symptomOnset?: string;
  symptomToHospitalMinutes?: number;
  lastKnownWell?: string;
  wakeUpStroke?: boolean;
  
  // Patient Arrival & Timing (Step 1)
  modeOfArrival?: StrokeModeOfArrival;
  transferRequestDateTime?: string;
  transferArrivalDateTime?: string;
  srcaCallTime?: string;
  timeOfSymptomOnset?: string;
  lastKnownNormal?: string;
  dateOfAdmission?: string;
  timeOfTriage?: string;
  timeOfPhysicianAssessment?: string;
  
  // Clinical Assessment & Diagnosis (Step 2)
  strokeTypeDetailed?: StrokeTypeDetailed;
  swallowingScreeningPerformed?: boolean;
  timeOfSwallowingScreening?: string;
  swallowingScreeningResult?: SwallowingScreeningResult;
  ctScanPerformed?: boolean;
  timeOfCtScanStart?: string;
  timeOfCtReportFinal?: string;
  ctFindings?: CTFindings;
  lvoDetected?: boolean;
  candidateForIVThrombolysis?: CandidateAssessment;
  thrombolysisOrderTime?: string;
  ivThrombolysisAdministrationTime?: string;
  ivThrombolysisGiven?: IVThrombolysisGiven;
  reasonForNotAdministeringIV?: string;
  candidateForMechanicalThrombectomy?: CandidateAssessment;
  timeOfMechanicalThrombectomyPuncture?: string;
  mechanicalThrombectomyPerformed?: boolean;
  timeOfThrombectomyComplete?: string;
  
  // Disposition & Transfer Decisions (Step 3)
  facilityHasCt?: boolean;
  transferToAnotherHospital?: boolean;
  timeOfTransferActivation?: string;
  timeOfTransferDeparture?: string;
  prehospitalNotificationBySrca?: boolean;
  prehospitalNotificationByUccPhc?: boolean;
  disposition?: StrokeDisposition;
  referralTo?: ReferralTo[];
  admittedToStrokeUnit?: boolean;
  
  // Follow-up & Outcome Tracking (Step 4)
  followUpContactAttempted?: boolean;
  modifiedRankinScaleAt90Days?: ModifiedRankinScale;
  
  // Pathway Timings
  pathwayStarted?: string;
  pathwayCompleted?: string;
  strokeUnitAdmissionTime?: string;
  symptomNeedleMinutes?: number;
  symptomToMechanicalThrombectomyMinutes?: number;
  imagingToNeedleMinutes?: number;
  imagingToMechanicalThrombectomyMinutes?: number;
  doorToCtScanMinutes?: number;
  doorToNeedleMinutes?: number;
  doorToMechanicalThrombectomyMinutes?: number;
  
  // Clinical Assessments Timeline
  dysphagiaScreeningMinutes?: number;
  earlyMobilizationHours?: number;
  speechTherapyHours?: number;
  physiotherapyHours?: number;
  occupationalTherapyHours?: number;
  
  // CT Scan Results
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
  
  // Outcome Form Fields
  outcomePercentageCompleteness?: number;
  
  // KPI Tracking
  metKpi1?: boolean;
  metKpi2?: boolean;
  metKpi3?: boolean;
  metKpi4?: boolean;
  metKpi5?: boolean;
  metKpi6?: boolean;
  metKpi7?: boolean;
  metKpi8?: boolean;
  
  // KPI Timing Calculations (in minutes)
  doorToPhysicianMinutes?: number;
  registrationToCtMinutes?: number;
  doorToCtReportMinutes?: number;
  doorToThrombolysisOrderMinutes?: number;
  registrationToThrombolysisMinutes?: number;
  registrationToMechanicalThrombectomyMinutes?: number;
  srcaCallToArrivalMinutes?: number;
  transferActivationToDepartureMinutes?: number;
  
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
    dateOfBirth?: string; // Will be removed after migration
    age?: number; // Age in years
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
  assignedBed?: {
    id: string;
    bedNumber: string;
    status: string;
    location?: string;
    isOperational: boolean;
    unit: {
      id: string;
      name: string;
      bedType: string;
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
  } | null;
  
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
export interface BedAssignmentFormData {
  hospitalId?: string;
  hospitalType?: 'origin' | 'destination';
  unitId?: string;
  bedId?: string;
  bedNumber?: string;
  location?: string;
  arrivalDate?: string;
  assignedBed?: {
    id: string;
    bedNumber: string;
    unitName: string;
    hospitalName: string;
  };
}

export interface CreateStrokeCaseData {
  ticketId?: string;
  patientId?: string;
  patientInfo?: PatientInfo;
  chiefComplaint?: string;
  originHospitalId: string;
  destinationHospitalId?: string;
  strokeType: StrokeType;
  strokeSeverity?: StrokeSeverity;
  currentStatus: StrokeStatus;
  bedAssignment?: BedAssignmentFormData;
  selectedTreatment?: StrokeTreatment;
  eligibleForThrombolysis?: boolean;
  thrombolysisContraindications?: string;
  eligibleForThrombectomy?: boolean;
  thrombectomyContraindications?: string;
  pathwayStarted?: string;
  pathwayCompleted?: string;
  strokeUnitAdmissionTime?: string;
  symptomNeedleMinutes?: number;
  symptomToMechanicalThrombectomyMinutes?: number;
  imagingToNeedleMinutes?: number;
  imagingToMechanicalThrombectomyMinutes?: number;
  doorToCtScanMinutes?: number;
  doorToNeedleMinutes?: number;
  doorToMechanicalThrombectomyMinutes?: number;
  
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
  
  // Legacy fields
  presentingSymptoms?: string;
  symptomOnset?: string;
  symptomToHospitalMinutes?: number;
  lastKnownWell?: string;
  wakeUpStroke?: boolean;
  
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

  // Stroke Toolkit Fields - Patient Arrival & Timing (Step 1)
  modeOfArrival?: StrokeModeOfArrival;
  transferRequestDateTime?: string;
  transferArrivalDateTime?: string;
  srcaCallTime?: string;
  timeOfSymptomOnset?: string;
  lastKnownNormal?: string;
  dateOfAdmission?: string;
  timeOfTriage?: string;
  timeOfPhysicianAssessment?: string;

  // Clinical Assessment & Diagnosis (Step 2)
  strokeTypeDetailed?: StrokeTypeDetailed;
  swallowingScreeningPerformed?: boolean;
  timeOfSwallowingScreening?: string;
  swallowingScreeningResult?: SwallowingScreeningResult;
  ctScanPerformed?: boolean;
  timeOfCtScanStart?: string;
  timeOfCtReportFinal?: string;
  ctFindings?: CTFindings;
  lvoDetected?: boolean;
  candidateForIVThrombolysis?: CandidateAssessment;
  thrombolysisOrderTime?: string;
  ivThrombolysisAdministrationTime?: string;
  ivThrombolysisGiven?: IVThrombolysisGiven;
  reasonForNotAdministeringIV?: string;
  candidateForMechanicalThrombectomy?: CandidateAssessment;
  timeOfMechanicalThrombectomyPuncture?: string;
  mechanicalThrombectomyPerformed?: boolean;
  timeOfThrombectomyComplete?: string;

  // Disposition & Transfer Decisions (Step 3)
  facilityHasCt?: boolean;
  transferToAnotherHospital?: boolean;
  timeOfTransferActivation?: string;
  timeOfTransferDeparture?: string;
  prehospitalNotificationBySrca?: boolean;
  prehospitalNotificationByUccPhc?: boolean;
  disposition?: StrokeDisposition;
  referralTo?: ReferralTo[];
  admittedToStrokeUnit?: boolean;

  // Follow-up & Outcome Tracking (Step 4)
  followUpContactAttempted?: boolean;
  modifiedRankinScaleAt90Days?: ModifiedRankinScale;

  // KPI Tracking (11 Stroke Toolkit KPIs)
  metKpi1?: boolean;
  metKpi2?: boolean;
  metKpi3?: boolean;
  metKpi4?: boolean;
  metKpi5?: boolean;
  metKpi6?: boolean;
  metKpi7?: boolean;
  metKpi8?: boolean;
  metKpi9?: boolean;
  metKpi10?: boolean;
  metKpi11?: boolean;

  // KPI Timing Calculations (in minutes)
  doorToPhysicianMinutes?: number;
  registrationToCtMinutes?: number;
  doorToCtReportMinutes?: number;
  doorToThrombolysisOrderMinutes?: number;
  registrationToThrombolysisMinutes?: number;
  registrationToMechanicalThrombectomyMinutes?: number;
  srcaCallToArrivalMinutes?: number;
  transferActivationToDepartureMinutes?: number;
  swallowingScreeningWithin4Hours?: boolean;
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
  clinicalNotes?: string;
}

// Filter interfaces
export interface StrokeCaseFilters {
  hospitalId?: string;
  originHospitalId?: string;
  destinationHospitalId?: string;
  strokeType?: StrokeType;
  status?: StrokeStatus;
   modeOfArrival?: StrokeModeOfArrival;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
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
    doorToPhysician: number;
    registrationToCt: number;
    registrationToThrombolysis: number;
    registrationToMechanicalThrombectomy: number;
    srcaCallToArrival: number;
    transferActivationToDeparture: number;
  };
  outcomes: {
    successRate: number;
    independentDischargeRate: number;
  };
}

export interface StrokeCasesPaginatedResponse {
  cases: StrokeCase[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Stroke Service Class
export class StrokeService {
  // Stroke Cases
  static async createStrokeCase(data: CreateStrokeCaseData): Promise<StrokeCase> {
    // Helper function to clean values (remove empty strings, keep only valid values)
    const cleanValue = (value: any): any => {
      if (value === '' || value === null) return undefined;
      if (typeof value === 'string' && value.trim() === '') return undefined;
      return value;
    };

    // Clean patientInfo - only clean optional fields, keep required fields as-is
    const cleanPatientInfo = data.patientInfo ? {
      firstName: data.patientInfo.firstName, // Required, don't clean
      lastName: data.patientInfo.lastName, // Required, don't clean
      nationalId: data.patientInfo.nationalId, // Required, don't clean
      dateOfBirth: cleanValue(data.patientInfo.dateOfBirth), // Optional
      age: data.patientInfo.age, // Optional
      gender: data.patientInfo.gender, // Required, don't clean
      mrn: cleanValue(data.patientInfo.mrn), // Optional
      phoneNumber: cleanValue(data.patientInfo.phoneNumber), // Optional
      email: cleanValue(data.patientInfo.email) // Optional
    } : undefined;

    // Remove undefined values from patientInfo (only optional fields)
    if (cleanPatientInfo) {
      const optionalFields = ['mrn', 'phoneNumber', 'email', 'dateOfBirth', 'age'];
      optionalFields.forEach(key => {
        if (cleanPatientInfo[key as keyof typeof cleanPatientInfo] === undefined) {
          delete cleanPatientInfo[key as keyof typeof cleanPatientInfo];
        }
      });
    }

    // Include all fields that exist in the backend DTO
    const filteredData: any = {
      ticketId: cleanValue(data.ticketId),
      patientId: cleanValue(data.patientId),
      patientInfo: cleanPatientInfo && Object.keys(cleanPatientInfo).length > 0 ? cleanPatientInfo : undefined,
      chiefComplaint: cleanValue(data.chiefComplaint),
      originHospitalId: data.originHospitalId,
      destinationHospitalId: cleanValue(data.destinationHospitalId),
      strokeType: data.strokeType,
      currentStatus: data.currentStatus,
      selectedTreatment: cleanValue(data.selectedTreatment),
      
      // Patient Arrival & Timing (Step 1)
      modeOfArrival: cleanValue(data.modeOfArrival),
      transferRequestDateTime: cleanValue(data.transferRequestDateTime),
      transferArrivalDateTime: cleanValue(data.transferArrivalDateTime),
      srcaCallTime: cleanValue(data.srcaCallTime),
      timeOfSymptomOnset: cleanValue(data.timeOfSymptomOnset),
      lastKnownNormal: cleanValue(data.lastKnownNormal),
      dateOfAdmission: cleanValue(data.dateOfAdmission),
      timeOfTriage: cleanValue(data.timeOfTriage),
      timeOfPhysicianAssessment: cleanValue(data.timeOfPhysicianAssessment),
      
      // Clinical Assessment & Diagnosis (Step 2)
      strokeTypeDetailed: cleanValue(data.strokeTypeDetailed),
      swallowingScreeningPerformed: data.swallowingScreeningPerformed,
      timeOfSwallowingScreening: cleanValue(data.timeOfSwallowingScreening),
      swallowingScreeningResult: cleanValue(data.swallowingScreeningResult),
      ctScanPerformed: data.ctScanPerformed,
      timeOfCtScanStart: cleanValue(data.timeOfCtScanStart),
      timeOfCtReportFinal: cleanValue(data.timeOfCtReportFinal),
      ctFindings: cleanValue(data.ctFindings),
      lvoDetected: data.lvoDetected,
      candidateForIVThrombolysis: cleanValue(data.candidateForIVThrombolysis),
      thrombolysisOrderTime: cleanValue(data.thrombolysisOrderTime),
      ivThrombolysisAdministrationTime: cleanValue(data.ivThrombolysisAdministrationTime),
      ivThrombolysisGiven: cleanValue(data.ivThrombolysisGiven),
      reasonForNotAdministeringIV: cleanValue(data.reasonForNotAdministeringIV),
      candidateForMechanicalThrombectomy: cleanValue(data.candidateForMechanicalThrombectomy),
      timeOfMechanicalThrombectomyPuncture: cleanValue(data.timeOfMechanicalThrombectomyPuncture),
      mechanicalThrombectomyPerformed: data.mechanicalThrombectomyPerformed,
      timeOfThrombectomyComplete: cleanValue(data.timeOfThrombectomyComplete),
      
      // Disposition & Transfer Decisions (Step 3)
      facilityHasCt: data.facilityHasCt,
      transferToAnotherHospital: data.transferToAnotherHospital,
      timeOfTransferActivation: cleanValue(data.timeOfTransferActivation),
      timeOfTransferDeparture: cleanValue(data.timeOfTransferDeparture),
      prehospitalNotificationBySrca: data.prehospitalNotificationBySrca,
      prehospitalNotificationByUccPhc: data.prehospitalNotificationByUccPhc,
      disposition: cleanValue(data.disposition),
      referralTo: data.referralTo,
      admittedToStrokeUnit: data.admittedToStrokeUnit,
      
      // Follow-up & Outcome Tracking (Step 4)
      followUpContactAttempted: data.followUpContactAttempted,
      modifiedRankinScaleAt90Days: cleanValue(data.modifiedRankinScaleAt90Days),
    };

    // Remove all undefined values from the payload
    Object.keys(filteredData).forEach(key => {
      if (filteredData[key] === undefined) {
        delete filteredData[key];
      }
    });
    
    console.log('Sending filtered data:', filteredData);
    const response = await apiClient.post('/stroke-cases', filteredData);
    return response.data;
  }

  static async getStrokeCases(filters?: StrokeCaseFilters): Promise<StrokeCase[]> {
    const params = new URLSearchParams();
    if (filters?.hospitalId) params.append('hospitalId', filters.hospitalId);
    if (filters?.originHospitalId) params.append('originHospitalId', filters.originHospitalId);
    if (filters?.destinationHospitalId) params.append('destinationHospitalId', filters.destinationHospitalId);
    if (filters?.strokeType) params.append('strokeType', filters.strokeType);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.modeOfArrival) params.append('modeOfArrival', filters.modeOfArrival);
    if (filters?.dateFrom) params.append('dateFrom', filters.dateFrom);
    if (filters?.dateTo) params.append('dateTo', filters.dateTo);

    const response = await apiClient.get(`/stroke-cases?${params.toString()}`);
    return response.data;
  }

  static async getStrokeCasesPaginated(
    filters: StrokeCaseFilters & { limit?: number; offset?: number } = {},
  ): Promise<StrokeCasesPaginatedResponse> {
    const params = new URLSearchParams();

    if (filters.hospitalId) params.append('hospitalId', filters.hospitalId);
    if (filters.originHospitalId) params.append('originHospitalId', filters.originHospitalId);
    if (filters.destinationHospitalId) params.append('destinationHospitalId', filters.destinationHospitalId);
    if (filters.strokeType) params.append('strokeType', filters.strokeType);
    if (filters.status) params.append('status', filters.status);
    if (filters.modeOfArrival) params.append('modeOfArrival', filters.modeOfArrival);
    if (filters.dateFrom) params.append('dateFrom', filters.dateFrom);
    if (filters.dateTo) params.append('dateTo', filters.dateTo);
    if (filters.search) params.append('search', filters.search);
    if (filters.limit !== undefined) params.append('limit', String(filters.limit));
    if (filters.offset !== undefined) params.append('offset', String(filters.offset));

    const response = await apiClient.get(`/stroke-cases/paginated?${params.toString()}`);
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
      IMAGING_PENDING: 'CT Scan Pending',
      IMAGING_COMPLETE: 'CT Scan Complete',
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

  static getModeOfArrivalLabel(mode: StrokeModeOfArrival): string {
    const labels: Record<StrokeModeOfArrival, string> = {
      AMBULANCE_RED_CRESCENT: 'Ambulance (Red Crescent)',
      PRIVATE_CAR: 'Private Car',
      TRANSFERRED_FROM_ANOTHER_HOSPITAL: 'Transferred from another hospital',
    };
    return labels[mode] || mode;
  }

  static getEventTypeLabel(eventType: StrokeEventType): string {
    const labels: Record<StrokeEventType, string> = {
      ARRIVAL: 'Arrival',
      TRIAGE: 'Triage',
      ASSESSMENT: 'Assessment',
      IMAGING: 'CT Scan',
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
      1: 'Door to Physician ≤15min',
      2: 'Pre-hospital Notification ≥90%',
      3: 'Registration to CT ≤20min',
      4: 'Registration to IV Thrombolysis ≤60min',
      5: 'IV Thrombolysis Rate ≥5%',
      6: 'Direct Stroke Unit Admission ≥80%',
      7: 'Transfer Time ≤20min (no CT), ≤40min (with CT)',
      8: 'Registration to Mechanical Thrombectomy Puncture ≤120min',
      9: 'SRCA Call to Arrival ≤60min',
      10: 'Swallowing Screening ≤4hr ≥85%',
      11: '3-month Follow-up with mRS ≥80%',
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

  // KPI Dashboard Methods
  static async getKPISummary(filters?: {
    hospitalId?: string;
    timeframe?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<any> {
    const params = new URLSearchParams();
    if (filters?.hospitalId) params.append('hospitalId', filters.hospitalId);
    if (filters?.timeframe) params.append('timeframe', filters.timeframe);
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);

    const response = await apiClient.get(`/stroke-cases/kpi-summary?${params.toString()}`);
    return response.data;
  }

  static async getKPIDetails(kpiId: string, filters?: {
    hospitalId?: string;
    timeframe?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<any> {
    const params = new URLSearchParams();
    if (filters?.hospitalId) params.append('hospitalId', filters.hospitalId);
    if (filters?.timeframe) params.append('timeframe', filters.timeframe);
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);

    const response = await apiClient.get(`/stroke-cases/kpi-details/${kpiId}?${params.toString()}`);
    return response.data;
  }

}

export default StrokeService;
