/**
 * Trauma-specific helper functions
 * Utilities for trauma case management
 */

import { TraumaModeOfArrival, TraumaMechanismOfInjury, TraumaDispositionType, TraumaInjurySeverity } from '../../../services/traumaService';
import { formatForUTC, formatForDateTimeLocal, formatForDisplay, getCurrentUTC } from '../../../helpers/datetime';

// Mode of Arrival helpers
export const getModeOfArrivalLabel = (mode: TraumaModeOfArrival): string => {
  const labels: Record<TraumaModeOfArrival, string> = {
    AMBULANCE_RED_CRESCENT: 'Ambulance (Red Crescent)',
    PRIVATE_CAR: 'Private Car',
    TRANSFERRED_FROM_ANOTHER_HOSPITAL: 'Transferred from another hospital'
  };
  return labels[mode] || mode;
};

export const getModeOfArrivalIcon = (mode: TraumaModeOfArrival): string => {
  const icons: Record<TraumaModeOfArrival, string> = {
    AMBULANCE_RED_CRESCENT: '🚑',
    PRIVATE_CAR: '🚗',
    TRANSFERRED_FROM_ANOTHER_HOSPITAL: '🏥'
  };
  return icons[mode] || '❓';
};

// Mechanism of Injury helpers
export const getMechanismOfInjuryLabel = (mechanism: TraumaMechanismOfInjury): string => {
  const labels: Record<TraumaMechanismOfInjury, string> = {
    PENETRATING: 'Penetrating',
    BLUNT: 'Blunt',
    BURN: 'Burn',
    FALL: 'Fall',
    MOTOR_VEHICLE_ACCIDENT: 'Motor Vehicle Accident',
    OTHER: 'Other'
  };
  return labels[mechanism] || mechanism;
};

// Disposition helpers
export const getDispositionLabel = (disposition: TraumaDispositionType): string => {
  const labels: Record<TraumaDispositionType, string> = {
    ICU_ADMISSION: 'ICU Admission',
    SURGICAL_WARD_ADMISSION: 'Surgical Ward Admission',
    MEDICAL_WARD_ADMISSION: 'Medical Ward Admission',
    DISCHARGE: 'Discharge',
    OPERATING_THEATRE: 'Operating Theatre',
    TRANSFER_TO_HIGHER_CENTER: 'Transfer to Higher Center',
    DEATH: 'Death',
    DISCHARGE_AGAINST_MEDICAL_ADVICE: 'Discharge Against Medical Advice',
    OTHER: 'Other'
  };
  return labels[disposition] || disposition;
};

// Injury Severity helpers
export const getInjurySeverityLabel = (severity: TraumaInjurySeverity): string => {
  const labels: Record<TraumaInjurySeverity, string> = {
    NO_INJURY: 'No Injury',
    MINOR: 'Minor',
    MODERATE: 'Moderate',
    SERIOUS: 'Serious',
    SEVERE: 'Severe',
    CRITICAL: 'Critical',
    UNSURVIVABLE: 'Unsurvivable'
  };
  return labels[severity] || severity;
};

export const getInjurySeverityColor = (severity: TraumaInjurySeverity): string => {
  const colors: Record<TraumaInjurySeverity, string> = {
    NO_INJURY: '#4caf50',
    MINOR: '#8bc34a',
    MODERATE: '#ffc107',
    SERIOUS: '#ff9800',
    SEVERE: '#ff5722',
    CRITICAL: '#f44336',
    UNSURVIVABLE: '#9c27b0'
  };
  return colors[severity] || '#757575';
};

// Glasgow Coma Scale helpers
export const getGlasgowComaScaleColor = (score: number): string => {
  if (score >= 13) return '#4caf50'; // Green - Mild
  if (score >= 9) return '#ffc107';  // Yellow - Moderate
  if (score >= 3) return '#ff5722';  // Red - Severe
  return '#9c27b0'; // Purple - Critical
};

export const getGlasgowComaScaleLabel = (score: number): string => {
  if (score >= 13) return 'Mild';
  if (score >= 9) return 'Moderate';
  if (score >= 3) return 'Severe';
  return 'Critical';
};

// Validation helpers
export const validateGlasgowComaScale = (score: number): boolean => {
  return score >= 3 && score <= 15;
};

export const validateVitalSigns = (vitals: any): boolean => {
  if (!vitals) return true; // Optional field
  
  const { temperature, heartRate, oxygenSaturation, respiratoryRate } = vitals;
  
  if (temperature && (temperature < 30 || temperature > 45)) return false;
  if (heartRate && (heartRate < 30 || heartRate > 300)) return false;
  if (oxygenSaturation && (oxygenSaturation < 0 || oxygenSaturation > 100)) return false;
  if (respiratoryRate && (respiratoryRate < 5 || respiratoryRate > 60)) return false;
  
  return true;
};

// Form validation helpers
export const validateTraumaCaseForm = (data: any): string[] => {
  const errors: string[] = [];
  
  // Check patient info
  if (!data.patientInfo?.firstName) errors.push('Patient first name is required');
  if (!data.patientInfo?.lastName) errors.push('Patient last name is required');
  if (!data.patientInfo?.nationalIdNotAvailable && !data.patientInfo?.nationalId) errors.push('Patient national ID is required');
  
  // Check incident details (nested structure)
  if (!data.incidentDetails?.arrivalDateTime) errors.push('Arrival date time is required');
  if (!data.incidentDetails?.modeOfArrival) errors.push('Mode of arrival is required');
  if (!data.incidentDetails?.mechanismOfInjury) errors.push('Mechanism of injury is required');
  
  // Check hospital info
  if (!data.patientInfo?.originHospitalId) errors.push('Origin hospital is required');
  
  // Check vitals assessment (nested structure)
  if (data.vitalsAssessment?.glasgowComaScale && !validateGlasgowComaScale(data.vitalsAssessment.glasgowComaScale)) {
    errors.push('Glasgow Coma Scale must be between 3 and 15');
  }
  
  if (data.vitalsAssessment?.vitalSigns && !validateVitalSigns(data.vitalsAssessment.vitalSigns)) {
    errors.push('Invalid vital signs values');
  }
  
  return errors;
};

// KPI calculation helpers
export const calculateResponseTime = (incidentTime: string, arrivalTime: string): number => {
  if (!incidentTime || !arrivalTime) return 0;
  
  const incident = new Date(incidentTime);
  const arrival = new Date(arrivalTime);
  
  if (isNaN(incident.getTime()) || isNaN(arrival.getTime())) return 0;
  
  return Math.floor((arrival.getTime() - incident.getTime()) / (1000 * 60)); // minutes
};

export const isCriticalCase = (glasgowScore: number): boolean => {
  return glasgowScore < 8;
};

export const isTransferCase = (transferRequestTime: string | null): boolean => {
  return transferRequestTime !== null && transferRequestTime !== undefined;
};

// Datetime helper functions using existing utilities
export const formatTraumaDateTimeForInput = (utcString: string): string => {
  return formatForDateTimeLocal(utcString);
};

export const formatTraumaDateTimeForAPI = (localDateTimeString: string): string => {
  return formatForUTC(localDateTimeString);
};

export const formatTraumaDateTimeForDisplay = (utcString: string): string => {
  return formatForDisplay(utcString);
};

export const getCurrentTraumaDateTime = (): string => {
  return getCurrentUTC();
};

