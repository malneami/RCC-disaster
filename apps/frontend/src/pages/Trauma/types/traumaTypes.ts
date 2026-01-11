/**
 * Trauma-specific TypeScript types and interfaces
 */

import { TraumaCase, CreateTraumaCaseData, UpdateTraumaCaseData } from '../../../services/traumaService';

// Form data interfaces
export interface PatientInfoFormData {
  firstName: string;
  lastName: string;
  nationalId: string;
  nationalIdNotAvailable?: boolean;
  dateOfBirth?: string; // Will be removed after migration
  age?: number; // Age in years
  gender: 'MALE' | 'FEMALE';
  phoneNumber: string;
  email?: string;
  address: string;
  emergencyContact: string;
  emergencyPhone: string;
  medicalHistory: string;
  allergies: string;
  medications: string;
  originHospitalId: string;
  destinationHospitalId?: string;
}

export interface IncidentDetailsFormData {
  arrivalDateTime: string;
  incidentDateTime: string;
  modeOfArrival: string;
  transferRequestDateTime: string;
  transferArrivalDateTime: string;
  chiefComplaint: string;
  mechanismOfInjury: string;
  primarySurveyFindings: string;
  additionalNotes: string;
}

export interface VitalsAssessmentFormData {
  vitalSigns: {
    temperature: number;
    heartRate: number;
    bloodPressure: string;
    oxygenSaturation: number;
    respiratoryRate: number;
  };
  glasgowComaScale: number;
  systolicBloodPressure: number;
  respiratoryRate: number;
  additionalVitalSigns: string;
}

export interface InjuryAssessmentFormData {
  headAndNeckInjury: string;
  faceInjury: string;
  chestInjury: string;
  abdomenInjury: string;
  extremitiesInjury: string;
  externalInjury: string;
}

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

export interface DispositionFormData {
  edDisposition: string;
  disposition: {
    dischargeInstructions: string;
    followUpRequired: boolean;
    followUpDate: string;
    medicationsPrescribed: string;
    restrictions: string;
  };
}

// Complete form data
export interface TraumaCaseFormData {
  patientInfo: PatientInfoFormData;
  incidentDetails: IncidentDetailsFormData;
  vitalsAssessment: VitalsAssessmentFormData;
  injuryAssessment: InjuryAssessmentFormData;
  disposition: DispositionFormData;
  bedAssignment?: BedAssignmentFormData;
  originHospitalId: string;
  destinationHospitalId: string;
}

// Filter interfaces
export interface TraumaCaseFilters {
  search: string;
  modeOfArrival: string;
  mechanismOfInjury: string;
  edDisposition: string;
  criticalCase: boolean | null;
  transferCase: boolean | null;
  dateFrom: string;
  dateTo: string;
  hospitalId: string;
}

// Sort configuration
export interface SortConfig {
  field: keyof TraumaCase;
  direction: 'asc' | 'desc';
}

// Pagination configuration
export interface PaginationConfig {
  page: number;
  rowsPerPage: number;
  total: number;
}

// Table row data
export interface TraumaCaseTableRow {
  id: string;
  patient: {
    name: string;
    nationalId: string;
    avatar?: string;
  };
  arrivalDateTime: string;
  modeOfArrival: string;
  mechanismOfInjury: string;
  glasgowComaScale: number | null;
  criticalCase: boolean;
  transferCase: boolean;
  edDisposition: string | null;
  hospital: string;
  actions: string[];
}

// KPI card data
export interface KPICardData {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  color: string;
  icon: React.ReactNode;
}

// Timeline event data
export interface TraumaTimelineEvent {
  id: string;
  timestamp: string;
  title: string;
  description: string;
  type: 'arrival' | 'assessment' | 'treatment' | 'disposition';
  status: 'completed' | 'in-progress' | 'pending';
  user: {
    name: string;
    role: string;
  };
  hospital?: {
    name: string;
    id: string;
  };
  details: Record<string, any>;
}

// Form step configuration
export interface FormStep {
  id: string;
  label: string;
  icon: string;
  description: string;
  isValid: (data: any) => boolean;
  component: React.ComponentType<any>;
}

// Dialog props
export interface CreateTraumaCaseDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: CreateTraumaCaseData) => Promise<void>;
}

export interface EditTraumaCaseDialogProps {
  open: boolean;
  case: TraumaCase | null;
  onClose: () => void;
  onSubmit: (id: string, data: UpdateTraumaCaseData) => Promise<void>;
}

export interface ViewTraumaCaseDialogProps {
  open: boolean;
  case: TraumaCase | null;
  onClose: () => void;
}

// List component props
export interface TraumaCasesListProps {
  cases: TraumaCase[];
  onCreateCase: () => void;
  onDeleteCase: (id: string) => Promise<void>;
  isAdmin: boolean;
}

// Dashboard component props
export interface TraumaKPIDashboardProps {
  kpiSummary: TraumaKPIsResponse | null;
}

// Portal page props
export interface TraumaPortalPageProps {
  // Add any specific props if needed
}

// API response types
export interface TraumaCasesResponse {
  cases: TraumaCase[];
  total: number;
  page: number;
  limit: number;
}

export interface TraumaKPIsResponse {
  totalCases: number;
  criticalCases: number;
  transferCases: number;
  averageResponseTime: number;
  averageGlasgowScore: number;
  mortalityRate: number;
  criticalCaseRate: number;
  transferRate: number;
  casesThisMonth: number;
  casesThisWeek: number;
}

// Error types
export interface TraumaError {
  code: string;
  message: string;
  field?: string;
}

export interface TraumaValidationError extends TraumaError {
  field: string;
  value: any;
}

// Loading states
export interface TraumaLoadingStates {
  cases: boolean;
  kpis: boolean;
  creating: boolean;
  updating: boolean;
  deleting: boolean;
}

// Export types
export interface TraumaExportOptions {
  format: 'csv' | 'excel' | 'pdf';
  dateRange: {
    from: string;
    to: string;
  };
  filters: Partial<TraumaCaseFilters>;
}
