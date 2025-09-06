import { STROKE_CONFIG } from '../config/strokeConfig';
import { StrokeType, StrokeSeverity, StrokeStatus, StrokeTreatment } from '../../../services/strokeService';

// Utility functions for stroke portal

export const calculateNIHSSSeverity = (nihssScore: number): StrokeSeverity => {
  if (nihssScore <= STROKE_CONFIG.NIHSS_SEVERITY.MILD.max) return 'MILD';
  if (nihssScore <= STROKE_CONFIG.NIHSS_SEVERITY.MODERATE.max) return 'MODERATE';
  if (nihssScore <= STROKE_CONFIG.NIHSS_SEVERITY.SEVERE.max) return 'SEVERE';
  return 'CRITICAL';
};

export const getNIHSSSeverityColor = (severity: StrokeSeverity): string => {
  const severityConfig = STROKE_CONFIG.STROKE_SEVERITIES.find(s => s.value === severity);
  return severityConfig?.color || '#666';
};

export const getStrokeTypeColor = (strokeType: StrokeType): string => {
  const typeConfig = STROKE_CONFIG.STROKE_TYPES.find(t => t.value === strokeType);
  return typeConfig?.color || '#666';
};

export const getStrokeStatusColor = (status: StrokeStatus): string => {
  const statusConfig = STROKE_CONFIG.STROKE_STATUSES.find(s => s.value === status);
  return statusConfig?.color || '#666';
};

export const getStrokeTreatmentColor = (treatment: StrokeTreatment): string => {
  const treatmentConfig = STROKE_CONFIG.STROKE_TREATMENTS.find(t => t.value === treatment);
  return treatmentConfig?.color || '#666';
};

export const formatDuration = (minutes: number): string => {
  if (minutes < 60) {
    return `${minutes} min`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
};

export const formatDateTime = (dateString: string): string => {
  return new Date(dateString).toLocaleString();
};

export const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString();
};

export const formatTime = (dateString: string): string => {
  return new Date(dateString).toLocaleTimeString();
};

export const isKPIMet = (kpiValue: boolean | undefined): boolean => {
  return kpiValue === true;
};

export const getKPIColor = (percentage: number): string => {
  if (percentage >= STROKE_CONFIG.PERFORMANCE_THRESHOLDS.EXCELLENT) {
    return STROKE_CONFIG.PERFORMANCE_COLORS.EXCELLENT;
  }
  if (percentage >= STROKE_CONFIG.PERFORMANCE_THRESHOLDS.GOOD) {
    return STROKE_CONFIG.PERFORMANCE_COLORS.GOOD;
  }
  return STROKE_CONFIG.PERFORMANCE_COLORS.POOR;
};

export const getKPIBadgeColor = (percentage: number): 'success' | 'warning' | 'error' => {
  if (percentage >= STROKE_CONFIG.PERFORMANCE_THRESHOLDS.EXCELLENT) {
    return 'success';
  }
  if (percentage >= STROKE_CONFIG.PERFORMANCE_THRESHOLDS.GOOD) {
    return 'warning';
  }
  return 'error';
};

export const getKPILabel = (percentage: number): string => {
  if (percentage >= STROKE_CONFIG.PERFORMANCE_THRESHOLDS.EXCELLENT) {
    return 'Excellent';
  }
  if (percentage >= STROKE_CONFIG.PERFORMANCE_THRESHOLDS.GOOD) {
    return 'Good';
  }
  return 'Needs Improvement';
};

export const calculateAge = (dateOfBirth: string): number => {
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
};

export const getTimeSinceSymptomOnset = (symptomOnset: string): string => {
  const now = new Date();
  const onset = new Date(symptomOnset);
  const diffMs = now.getTime() - onset.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  
  return formatDuration(diffMinutes);
};

export const isWithinTargetTime = (actualMinutes: number, targetMinutes: number): boolean => {
  return actualMinutes <= targetMinutes;
};

export const getTargetTimeStatus = (actualMinutes: number, targetMinutes: number): {
  met: boolean;
  color: string;
  label: string;
} => {
  const met = isWithinTargetTime(actualMinutes, targetMinutes);
  return {
    met,
    color: met ? STROKE_CONFIG.PERFORMANCE_COLORS.EXCELLENT : STROKE_CONFIG.PERFORMANCE_COLORS.POOR,
    label: met ? 'On Time' : 'Delayed',
  };
};

export const calculateDoorToNeedleTime = (
  arrivalTime: string,
  needleTime: string
): number => {
  const arrival = new Date(arrivalTime);
  const needle = new Date(needleTime);
  return Math.floor((needle.getTime() - arrival.getTime()) / (1000 * 60));
};

export const calculateDoorToGroinTime = (
  arrivalTime: string,
  groinTime: string
): number => {
  const arrival = new Date(arrivalTime);
  const groin = new Date(groinTime);
  return Math.floor((groin.getTime() - arrival.getTime()) / (1000 * 60));
};

export const calculateSymptomToNeedleTime = (
  symptomOnset: string,
  needleTime: string
): number => {
  const onset = new Date(symptomOnset);
  const needle = new Date(needleTime);
  return Math.floor((needle.getTime() - onset.getTime()) / (1000 * 60));
};

export const calculateSymptomToGroinTime = (
  symptomOnset: string,
  groinTime: string
): number => {
  const onset = new Date(symptomOnset);
  const groin = new Date(groinTime);
  return Math.floor((groin.getTime() - onset.getTime()) / (1000 * 60));
};

export const getStrokeRiskFactors = (): string[] => {
  return [
    'Hypertension',
    'Diabetes',
    'Atrial Fibrillation',
    'Smoking',
    'Hyperlipidemia',
    'Previous Stroke/TIA',
    'Coronary Artery Disease',
    'Heart Failure',
    'Obesity',
    'Sedentary Lifestyle',
    'Family History',
    'Age > 65',
  ];
};

export const getThrombolysisContraindications = (): string[] => {
  return [
    'Recent major surgery (< 14 days)',
    'Recent stroke (< 3 months)',
    'Active bleeding',
    'Severe hypertension (> 185/110)',
    'Low platelets (< 100,000)',
    'Elevated INR (> 1.7)',
    'Recent head trauma',
    'Intracranial hemorrhage',
    'Pregnancy',
    'Severe liver disease',
    'Severe kidney disease',
    'Recent gastrointestinal bleeding',
  ];
};

export const getThrombectomyContraindications = (): string[] => {
  return [
    'Large infarct (> 1/3 MCA territory)',
    'ASPECTS score < 6',
    'Severe comorbidities',
    'Life expectancy < 1 year',
    'Severe contrast allergy',
    'Uncontrolled hypertension',
    'Active bleeding',
    'Recent major surgery',
    'Severe kidney disease',
    'Pregnancy',
  ];
};

export const validateNIHSSScore = (score: number): boolean => {
  return score >= 0 && score <= 42;
};

export const validateMRSScore = (score: number): boolean => {
  return score >= 0 && score <= 6;
};

export const validateBarthelScore = (score: number): boolean => {
  return score >= 0 && score <= 100;
};

export const validateASPECTSScore = (score: number): boolean => {
  return score >= 0 && score <= 10;
};

export const validateGCSScore = (score: number): boolean => {
  return score >= 3 && score <= 15;
};

export const getAssessmentValidation = (type: string, score: number): boolean => {
  switch (type) {
    case 'NIHSS':
      return validateNIHSSScore(score);
    case 'MRS':
      return validateMRSScore(score);
    case 'BARTHEL':
      return validateBarthelScore(score);
    case 'ASPECTS':
      return validateASPECTSScore(score);
    case 'GCS':
      return validateGCSScore(score);
    default:
      return true;
  }
};

export const getAssessmentMaxScore = (type: string): number => {
  const assessment = STROKE_CONFIG.ASSESSMENT_TYPES.find(a => a.value === type);
  return assessment?.max || 0;
};

export const generateStrokeCaseSummary = (case_: any): string => {
  const patient = case_.patient;
  const type = case_.strokeType;
  const severity = case_.strokeSeverity;
  const nihss = case_.nihssBaseline;
  const status = case_.currentStatus;
  
  return `${patient?.firstName} ${patient?.lastName} - ${type} ${severity ? `(${severity})` : ''} - NIHSS: ${nihss || 'N/A'} - Status: ${status}`;
};

export default {
  calculateNIHSSSeverity,
  getNIHSSSeverityColor,
  getStrokeTypeColor,
  getStrokeStatusColor,
  getStrokeTreatmentColor,
  formatDuration,
  formatDateTime,
  formatDate,
  formatTime,
  isKPIMet,
  getKPIColor,
  getKPIBadgeColor,
  getKPILabel,
  calculateAge,
  getTimeSinceSymptomOnset,
  isWithinTargetTime,
  getTargetTimeStatus,
  calculateDoorToNeedleTime,
  calculateDoorToGroinTime,
  calculateSymptomToNeedleTime,
  calculateSymptomToGroinTime,
  getStrokeRiskFactors,
  getThrombolysisContraindications,
  getThrombectomyContraindications,
  validateNIHSSScore,
  validateMRSScore,
  validateBarthelScore,
  validateASPECTSScore,
  validateGCSScore,
  getAssessmentValidation,
  getAssessmentMaxScore,
  generateStrokeCaseSummary,
};
