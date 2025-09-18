// Stroke Portal Configuration

export const STROKE_CONFIG = {
  // KPI Targets (in minutes)
  KPI_TARGETS: {
    DOOR_TO_CT_SCAN: 25,
    DOOR_TO_NEEDLE: 60,
    DOOR_TO_MECHANICAL_THROMBECTOMY: 90,
    STROKE_UNIT_ADMISSION: 240, // 4 hours
    DYSPHAGIA_SCREENING: 240, // 4 hours
    EARLY_MOBILIZATION: 1440, // 24 hours
  },

  // NIHSS Severity Thresholds
  NIHSS_SEVERITY: {
    MILD: { min: 0, max: 4 },
    MODERATE: { min: 5, max: 15 },
    SEVERE: { min: 16, max: 20 },
    CRITICAL: { min: 21, max: 42 },
  },

  // Stroke Types
  STROKE_TYPES: [
    { value: 'ISCHEMIC', label: 'Ischemic Stroke', color: '#1976d2' },
    { value: 'HEMORRHAGIC', label: 'Hemorrhagic Stroke', color: '#d32f2f' },
    { value: 'TIA', label: 'Transient Ischemic Attack', color: '#ed6c02' },
    { value: 'UNKNOWN', label: 'Unknown', color: '#666' },
  ],

  // Stroke Severities
  STROKE_SEVERITIES: [
    { value: 'MILD', label: 'Mild', color: '#2e7d32' },
    { value: 'MODERATE', label: 'Moderate', color: '#ed6c02' },
    { value: 'SEVERE', label: 'Severe', color: '#d32f2f' },
    { value: 'CRITICAL', label: 'Critical', color: '#d32f2f' },
  ],

  // Stroke Statuses
  STROKE_STATUSES: [
    { value: 'SUSPECTED', label: 'Suspected', color: '#666' },
    { value: 'CONFIRMED', label: 'Confirmed', color: '#1976d2' },
    { value: 'IMAGING_PENDING', label: 'CT Scan Pending', color: '#ed6c02' },
    { value: 'IMAGING_COMPLETE', label: 'CT Scan Complete', color: '#2e7d32' },
    { value: 'TREATMENT_EVALUATION', label: 'Treatment Evaluation', color: '#9c27b0' },
    { value: 'THROMBOLYSIS_STARTED', label: 'Thrombolysis Started', color: '#2e7d32' },
    { value: 'THROMBECTOMY_STARTED', label: 'Thrombectomy Started', color: '#2e7d32' },
    { value: 'TREATMENT_COMPLETE', label: 'Treatment Complete', color: '#2e7d32' },
    { value: 'STROKEUNIT_ADMITTED', label: 'Stroke Unit Admitted', color: '#1976d2' },
    { value: 'REHABILITATION_STARTED', label: 'Rehabilitation Started', color: '#1976d2' },
    { value: 'DISCHARGED', label: 'Discharged', color: '#2e7d32' },
    { value: 'FOLLOW_UP', label: 'Follow Up', color: '#666' },
  ],

  // Stroke Treatments
  STROKE_TREATMENTS: [
    { value: 'IV_THROMBOLYSIS', label: 'IV Thrombolysis', color: '#1976d2' },
    { value: 'MECHANICAL_THROMBECTOMY', label: 'Mechanical Thrombectomy', color: '#2e7d32' },
    { value: 'COMBINED_THERAPY', label: 'Combined Therapy', color: '#9c27b0' },
    { value: 'CONSERVATIVE_MANAGEMENT', label: 'Conservative Management', color: '#ed6c02' },
    { value: 'SURGICAL_INTERVENTION', label: 'Surgical Intervention', color: '#d32f2f' },
    { value: 'NOT_ELIGIBLE', label: 'Not Eligible', color: '#666' },
  ],

  // Event Types
  EVENT_TYPES: [
    { value: 'ARRIVAL', label: 'Arrival', color: '#1976d2' },
    { value: 'TRIAGE', label: 'Triage', color: '#ed6c02' },
    { value: 'ASSESSMENT', label: 'Assessment', color: '#2e7d32' },
    { value: 'IMAGING', label: 'CT Scan', color: '#9c27b0' },
    { value: 'LABORATORY', label: 'Laboratory', color: '#f57c00' },
    { value: 'TREATMENT_START', label: 'Treatment Start', color: '#d32f2f' },
    { value: 'TREATMENT_COMPLETE', label: 'Treatment Complete', color: '#388e3c' },
    { value: 'TRANSFER', label: 'Transfer', color: '#7b1fa2' },
    { value: 'DISCHARGE', label: 'Discharge', color: '#1976d2' },
    { value: 'COMPLICATION', label: 'Complication', color: '#d32f2f' },
    { value: 'FOLLOWUP', label: 'Follow Up', color: '#5d4037' },
  ],

  // Assessment Types
  ASSESSMENT_TYPES: [
    { value: 'NIHSS', label: 'NIHSS (National Institutes of Health Stroke Scale)', max: 42 },
    { value: 'MRS', label: 'Modified Rankin Scale', max: 6 },
    { value: 'BARTHEL', label: 'Barthel Index', max: 100 },
    { value: 'ASPECTS', label: 'ASPECTS Score', max: 10 },
    { value: 'GCS', label: 'Glasgow Coma Scale', max: 15 },
  ],

  // Assessment Timings
  ASSESSMENT_TIMINGS: [
    { value: 'BASELINE', label: 'Baseline' },
    { value: '24HR', label: '24 Hours' },
    { value: 'DISCHARGE', label: 'Discharge' },
    { value: '90DAY', label: '90 Days' },
  ],

  // Rehabilitation Types
  REHABILITATION_TYPES: [
    { value: 'PHYSIOTHERAPY', label: 'Physiotherapy' },
    { value: 'SPEECH', label: 'Speech Therapy' },
    { value: 'OCCUPATIONAL', label: 'Occupational Therapy' },
  ],

  // Discharge Destinations
  DISCHARGE_DESTINATIONS: [
    { value: 'HOME', label: 'Home' },
    { value: 'REHABILITATION', label: 'Rehabilitation Center' },
    { value: 'NURSING_HOME', label: 'Nursing Home' },
    { value: 'OTHER_HOSPITAL', label: 'Other Hospital' },
    { value: 'HOSPICE', label: 'Hospice' },
  ],

  // Recanalization Grades (mTICI)
  RECANALIZATION_GRADES: [
    { value: '0', label: 'mTICI 0 - No perfusion' },
    { value: '1', label: 'mTICI 1 - Minimal perfusion' },
    { value: '2a', label: 'mTICI 2a - Partial perfusion (<50%)' },
    { value: '2b', label: 'mTICI 2b - Partial perfusion (≥50%)' },
    { value: '3', label: 'mTICI 3 - Complete perfusion' },
  ],

  // Performance Colors
  PERFORMANCE_COLORS: {
    EXCELLENT: '#2e7d32', // Green
    GOOD: '#ed6c02', // Orange
    POOR: '#d32f2f', // Red
  },

  // Performance Thresholds
  PERFORMANCE_THRESHOLDS: {
    EXCELLENT: 90,
    GOOD: 75,
  },
};

export default STROKE_CONFIG;

