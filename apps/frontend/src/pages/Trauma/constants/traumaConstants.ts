/**
 * Trauma-specific constants
 * Centralized constants for trauma case management
 */

import { 
  HEAD_NECK_INJURY_OPTIONS,
  FACE_INJURY_OPTIONS,
  CHEST_INJURY_OPTIONS,
  ABDOMEN_INJURY_OPTIONS,
  EXTREMITIES_INJURY_OPTIONS,
  EXTERNAL_INJURY_OPTIONS
} from './injurySeverityOptions';

// Form field options
export const MODE_OF_ARRIVAL_OPTIONS = [
  { value: 'AMBULANCE_RED_CRESCENT', label: 'Ambulance (Red Crescent)' },
  { value: 'PRIVATE_CAR', label: 'Private Car' },
  { value: 'TRANSFERRED_FROM_ANOTHER_HOSPITAL', label: 'Transferred from another hospital' },
] as const;

export const MECHANISM_OF_INJURY_OPTIONS = [
  { value: 'PENETRATING', label: 'Penetrating' },
  { value: 'BLUNT', label: 'Blunt' },
  { value: 'BURN', label: 'Burn' },
  { value: 'FALL', label: 'Fall' },
  { value: 'MOTOR_VEHICLE_ACCIDENT', label: 'Motor Vehicle Accident' },
  { value: 'OTHER', label: 'Other' },
] as const;

export const DISPOSITION_OPTIONS = [
  { value: 'ICU_ADMISSION', label: 'ICU Admission' },
  { value: 'SURGICAL_WARD_ADMISSION', label: 'Surgical Ward Admission' },
  { value: 'MEDICAL_WARD_ADMISSION', label: 'Medical Ward Admission' },
  { value: 'DISCHARGE', label: 'Discharge' },
  { value: 'OPERATING_THEATRE', label: 'Operating Theatre' },
  { value: 'TRANSFER_TO_HIGHER_CENTER', label: 'Transfer to Higher Center' },
  { value: 'DEATH', label: 'Death' },
  { value: 'DISCHARGE_AGAINST_MEDICAL_ADVICE', label: 'Discharge Against Medical Advice' },
  { value: 'OTHER', label: 'Other' },
] as const;

// Glasgow Coma Scale Options
export const GLASGOW_COMA_SCALE_OPTIONS = [
  { value: 3, label: '3' },
  { value: 4, label: '4' },
  { value: 5, label: '5' },
  { value: 6, label: '6' },
  { value: 7, label: '7' },
  { value: 8, label: '8' },
  { value: 9, label: '9' },
  { value: 10, label: '10' },
  { value: 11, label: '11' },
  { value: 12, label: '12' },
  { value: 13, label: '13' },
  { value: 14, label: '14' },
  { value: 15, label: '15' },
] as const;

export const GENDER_OPTIONS = [
  { value: 'MALE', label: 'Male' },
  { value: 'FEMALE', label: 'Female' },
] as const;

// Hospital Selection Options (will be populated from API)
export const HOSPITAL_OPTIONS = [
  { value: '1', label: 'Jazan General Hospital (JGH)' },
  { value: '2', label: 'King Fahd Central Hospital (KFCH)' },
  { value: '3', label: 'Prince Mohammed bin Nasser Hospital (PMNH)' },
] as const;

// Export injury severity options
export {
  HEAD_NECK_INJURY_OPTIONS,
  FACE_INJURY_OPTIONS,
  CHEST_INJURY_OPTIONS,
  ABDOMEN_INJURY_OPTIONS,
  EXTREMITIES_INJURY_OPTIONS,
  EXTERNAL_INJURY_OPTIONS
};

// Form steps configuration
export const TRAUMA_FORM_STEPS = [
  { 
    id: 'patient-info', 
    label: 'Patient Information', 
    icon: '👤',
    description: 'Basic patient details and demographics'
  },
  { 
    id: 'incident-details', 
    label: 'Incident Details', 
    icon: '🚨',
    description: 'Incident information and arrival details'
  },
  { 
    id: 'vitals-assessment', 
    label: 'Vitals & Assessment', 
    icon: '🩺',
    description: 'Vital signs and Glasgow Coma Scale'
  },
  { 
    id: 'injury-assessment', 
    label: 'Injury Assessment', 
    icon: '⚠️',
    description: 'Body region injury assessment'
  },
  { 
    id: 'disposition', 
    label: 'Disposition', 
    icon: '✅',
    description: 'Final disposition and follow-up'
  },
  { 
    id: 'bed-assignment', 
    label: 'Bed Assignment', 
    icon: '🛏️',
    description: 'Assign bed to patient (optional)'
  },
  {
    id: 'review-step',
    label: 'Review & Submit',
    icon: '📋',
    description: 'Review case details and submit'
  },
] as const;

// KPI thresholds
export const KPI_THRESHOLDS = {
  RESPONSE_TIME: {
    EXCELLENT: 15, // minutes
    GOOD: 30,
    FAIR: 60,
  },
  MORTALITY_RATE: {
    EXCELLENT: 5, // percentage
    GOOD: 10,
    FAIR: 20,
  },
  CRITICAL_CASE_RATE: {
    TARGET: 20, // percentage
  },
  TRANSFER_RATE: {
    TARGET: 30, // percentage
  },
} as const;

// Table configuration
export const TRAUMA_TABLE_CONFIG = {
  ROWS_PER_PAGE_OPTIONS: [5, 10, 25, 50],
  DEFAULT_ROWS_PER_PAGE: 10,
  SORTABLE_FIELDS: [
    'patient',
    'arrivalDateTime',
    'modeOfArrival',
    'mechanismOfInjury',
    'glasgowComaScale',
    'edDisposition',
    'createdAt',
  ],
} as const;

// Filter configuration
export const TRAUMA_FILTER_FIELDS = [
  {
    key: 'search',
    label: 'Search',
    type: 'text' as const,
    placeholder: 'Search by patient name, ID, or complaint...',
  },
  {
    key: 'modeOfArrival',
    label: 'Mode of Arrival',
    type: 'select' as const,
    options: MODE_OF_ARRIVAL_OPTIONS,
  },
  {
    key: 'mechanismOfInjury',
    label: 'Mechanism of Injury',
    type: 'select' as const,
    options: MECHANISM_OF_INJURY_OPTIONS,
  },
  {
    key: 'edDisposition',
    label: 'ED Disposition',
    type: 'select' as const,
    options: DISPOSITION_OPTIONS,
  },
  {
    key: 'criticalCase',
    label: 'Critical Case',
    type: 'select' as const,
    options: [
      { value: 'true', label: 'Yes' },
      { value: 'false', label: 'No' },
    ],
  },
  {
    key: 'transferCase',
    label: 'Transfer Case',
    type: 'select' as const,
    options: [
      { value: 'true', label: 'Yes' },
      { value: 'false', label: 'No' },
    ],
  },
  {
    key: 'dateFrom',
    label: 'From Date',
    type: 'date' as const,
  },
  {
    key: 'dateTo',
    label: 'To Date',
    type: 'date' as const,
  },
] as const;

// API endpoints
export const TRAUMA_API_ENDPOINTS = {
  CASES: '/api/v1/trauma-cases',
  KPIS: '/api/v1/trauma-cases/kpis',
  EXPORT: '/api/v1/trauma-cases/export',
} as const;

// Error messages
export const TRAUMA_ERROR_MESSAGES = {
  REQUIRED_FIELD: 'This field is required',
  INVALID_GLASGOW_SCORE: 'Glasgow Coma Scale must be between 3 and 15',
  INVALID_VITAL_SIGNS: 'Invalid vital signs values',
  INVALID_DATE: 'Invalid date format',
  NETWORK_ERROR: 'Network error. Please try again.',
  UNAUTHORIZED: 'You are not authorized to perform this action',
  NOT_FOUND: 'Trauma case not found',
  VALIDATION_ERROR: 'Please check your input and try again',
} as const;

// Success messages
export const TRAUMA_SUCCESS_MESSAGES = {
  CASE_CREATED: 'Trauma case created successfully',
  CASE_UPDATED: 'Trauma case updated successfully',
  CASE_DELETED: 'Trauma case deleted successfully',
  DATA_LOADED: 'Data loaded successfully',
} as const;
