import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Stepper,
  Step,
  StepButton,
  Box,
  Alert,
  Typography,
  CircularProgress,
} from '@mui/material';
import * as yup from 'yup';

import { CreateStrokeCaseData } from '../../../services/strokeService';
import { Hospital } from '../../../services/hospitalService';
import PatientStep from './CreateStrokeCase/PatientStep';
import AssessmentStep from './CreateStrokeCase/AssessmentStep';
import DiagnosisStep from './CreateStrokeCase/DiagnosisStep';
import TreatmentStep from './CreateStrokeCase/TreatmentStep';
import ReviewStep from './CreateStrokeCase/ReviewStep';

interface CreateStrokeCaseDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: CreateStrokeCaseData) => Promise<void>;
}

const steps = [
  'Patient',
  'Assessment',
  'Diagnosis',
  'Treatment',
  'Review & Submit'
];

const DESTINATION_REQUIRED_MESSAGE =
  'Please select a destination hospital because the selected origin hospital does not provide Stroke service.';

// Regex patterns supporting Arabic characters
const NAME_REGEX = /^[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFFA-Za-z\s\u00C0-\u017F-]+$/;
// Text regex for general text fields (allows Arabic, English, numbers, common punctuation)
const TEXT_REGEX = /^[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFFA-Za-z0-9\s\u00C0-\u017F.,;:!?'"()\-_/]+$/;
const ALPHANUMERIC_REGEX = /^[A-Za-z0-9]+$/;
const PHONE_REGEX = /^\+?\d{7,15}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const patientInfoSchema = yup.object({
  firstName: yup
    .string()
    .trim()
    .matches(NAME_REGEX, 'First name can only include letters (including Arabic) and spaces.')
    .required('Patient Name is required'),
  lastName: yup
    .string()
    .trim()
    .matches(NAME_REGEX, 'Last name can only include letters (including Arabic) and spaces.')
    .required('Patient Last Name is required'),
  mrn: yup
    .string()
    .nullable()
    .transform((value) => (value ? value.trim() : ''))
    .test('valid-mrn', 'MRN can include letters (including Arabic), numbers, and common characters', (value) => {
      if (!value) return true;
      return TEXT_REGEX.test(value);
    }),
  nationalId: yup
    .string()
    .trim()
    .matches(ALPHANUMERIC_REGEX, 'National ID can only contain letters and numbers.')
    .required('National ID is required'),
  age: yup
    .number()
    .typeError('Age must be a number')
    .required('Age is required')
    .min(0, 'Age must be a positive number')
    .max(150, 'Please enter a realistic age'),
  gender: yup
    .string()
    .oneOf(['MALE', 'FEMALE'], 'Please select a gender')
    .required('Gender is required'),
  phoneNumber: yup
    .string()
    .nullable()
    .transform((value) => (value ? value.trim() : ''))
    .test('valid-phone', 'Phone numbers can only include digits and may start with +', (value) => {
      if (!value) return true;
      return PHONE_REGEX.test(value);
    }),
  email: yup
    .string()
    .nullable()
    .transform((value) => (value ? value.trim() : ''))
    .test('valid-email', 'Please enter a valid email address', (value) => {
      if (!value) return true;
      return EMAIL_REGEX.test(value);
    }),
});

const CreateStrokeCaseDialog: React.FC<CreateStrokeCaseDialogProps> = ({
  open,
  onClose,
  onSubmit,
}) => {
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [timelineWarnings, setTimelineWarnings] = useState<Record<string, string[]>>({});
  const [originHospital, setOriginHospital] = useState<Hospital | null>(null);
  const [formData, setFormData] = useState<CreateStrokeCaseData>({
    originHospitalId: '',
    strokeType: 'ISCHEMIC',
    currentStatus: 'SUSPECTED',
    patientInfo: {
      firstName: '',
      lastName: '',
      nationalId: '',
      mrn: '',
      age: undefined,
    },
  });

  const originRequiresDestination = !!originHospital && !originHospital.hasStrokeService;

  const handleClose = () => {
    setActiveStep(0);
    setFormData({
      originHospitalId: '',
      strokeType: 'ISCHEMIC',
      currentStatus: 'SUSPECTED',
      patientInfo: {
        firstName: '',
        lastName: '',
        nationalId: '',
        mrn: '',
        age: undefined,
      },
    });
    setError(null);
    setValidationErrors({});
    setTimelineWarnings({});
    setOriginHospital(null);
    onClose();
  };

  const handleOriginHospitalSelect = useCallback((hospital: Hospital | null) => {
    setOriginHospital(hospital);
    setValidationErrors((prev) => {
      if (!prev['destinationHospitalId']) {
        return prev;
      }
      if (!hospital || hospital.hasStrokeService) {
        const { ['destinationHospitalId']: _, ...rest } = prev;
        return rest;
      }
      return prev;
    });
  }, []);

  const updateFormData = useCallback((field: keyof CreateStrokeCaseData, value: any) => {
    setFormData((prev) => {
      const updated = { ...prev, [field]: value };

      // Clear validation errors for nested patientInfo fields
      if (field === 'patientInfo' && validationErrors) {
        setValidationErrors((prevErrors) => {
          const newErrors = { ...prevErrors };
          Object.keys(newErrors).forEach((key) => {
            if (key.startsWith('patientInfo.')) {
              delete newErrors[key];
            }
          });
          return newErrors;
        });
      } else if (validationErrors[field as string]) {
        setValidationErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors[field as string];
          return newErrors;
        });
      }

      return updated;
    });
  }, [validationErrors]);

  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <PatientStep
            formData={formData}
            updateFormData={updateFormData}
            validationErrors={validationErrors}
            onOriginHospitalSelect={handleOriginHospitalSelect}
            destinationRequired={originRequiresDestination}
            timelineWarnings={timelineWarnings}
          />
        );
      case 1:
        return (
          <AssessmentStep
            formData={formData}
            updateFormData={updateFormData}
            validationErrors={validationErrors}
            timelineWarnings={timelineWarnings}
          />
        );
      case 2:
        return (
          <DiagnosisStep
            formData={formData}
            updateFormData={updateFormData}
            timelineWarnings={timelineWarnings}
          />
        );
      case 3:
        return (
          <TreatmentStep
            formData={formData}
            updateFormData={updateFormData}
            timelineWarnings={timelineWarnings}
          />
        );
      case 4:
        return <ReviewStep formData={formData} timelineWarnings={timelineWarnings} />;
      default:
        return null;
    }
  };

  // Timeline validation logic
  useEffect(() => {
    const warnings: Record<string, string[]> = {};

    const addWarning = (field: string, message: string) => {
      warnings[field] = [...(warnings[field] || []), message];
    };

    const parseDate = (value?: string) => {
      if (!value) return null;
      const date = new Date(value);
      if (isNaN(date.getTime())) {
        return null;
      }
      return date;
    };

    // Parse all relevant timestamps
    const dateOfAdmission = parseDate(formData.dateOfAdmission);
    const timeOfSymptomOnset = parseDate(formData.timeOfSymptomOnset);
    const timeOfTriage = parseDate(formData.timeOfTriage);
    const timeOfPhysicianAssessment = parseDate(formData.timeOfPhysicianAssessment);
    const transferRequestTime = parseDate(formData.transferRequestDateTime);
    const transferArrivalTime = parseDate(formData.transferArrivalDateTime);
    const srcaCallTime = parseDate(formData.srcaCallTime);
    const timeOfCtScanStart = parseDate(formData.timeOfCtScanStart);
    const timeOfCtReportFinal = parseDate(formData.timeOfCtReportFinal);
    const timeOfSwallowingScreening = parseDate(formData.timeOfSwallowingScreening);
    const thrombolysisOrderTime = parseDate(formData.thrombolysisOrderTime);
    const ivThrombolysisAdminTime = parseDate(formData.ivThrombolysisAdministrationTime);
    const timeOfMechanicalThrombectomyPuncture = parseDate(formData.timeOfMechanicalThrombectomyPuncture);
    const timeOfThrombectomyComplete = parseDate(formData.timeOfThrombectomyComplete);
    const timeOfTransferActivation = parseDate(formData.timeOfTransferActivation);
    const timeOfTransferDeparture = parseDate(formData.timeOfTransferDeparture);

    // Symptom onset validations
    if (timeOfSymptomOnset && dateOfAdmission && timeOfSymptomOnset > dateOfAdmission) {
      addWarning(
        'timeOfSymptomOnset',
        'Symptom onset happens after admission. Please confirm the order of events.'
      );
    }

    // Admission and triage validations
    if (timeOfTriage && dateOfAdmission && timeOfTriage < dateOfAdmission) {
      addWarning(
        'timeOfTriage',
        'Triage time occurs before admission. Double-check both times.'
      );
    }

    // Physician assessment validations
    if (timeOfPhysicianAssessment && dateOfAdmission && timeOfPhysicianAssessment < dateOfAdmission) {
      addWarning(
        'timeOfPhysicianAssessment',
        'Physician assessment is before admission. Please revise the timestamps.'
      );
    }

    if (timeOfPhysicianAssessment && timeOfTriage && timeOfPhysicianAssessment < timeOfTriage) {
      addWarning(
        'timeOfPhysicianAssessment',
        'Physician assessment usually follows triage. Please review the entries.'
      );
    }

    // Transfer validations
    if (transferRequestTime && dateOfAdmission && transferRequestTime < dateOfAdmission) {
      addWarning(
        'transferRequestDateTime',
        'Transfer request is logged before admission. Confirm the request time.'
      );
    }

    if (transferArrivalTime && transferRequestTime && transferArrivalTime < transferRequestTime) {
      addWarning(
        'transferArrivalDateTime',
        'Transfer arrival is before the request. Please correct these times.'
      );
    }

    // SRCA call time validations
    if (srcaCallTime && dateOfAdmission && srcaCallTime > dateOfAdmission) {
      addWarning(
        'srcaCallTime',
        'SRCA call time is after admission. Please verify the timeline.'
      );
    }

    // CT scan validations
    if (timeOfCtScanStart && dateOfAdmission && timeOfCtScanStart < dateOfAdmission) {
      addWarning(
        'timeOfCtScanStart',
        'CT scan start is before admission. Check both timestamps.'
      );
    }

    if (timeOfCtReportFinal && timeOfCtScanStart && timeOfCtReportFinal < timeOfCtScanStart) {
      addWarning(
        'timeOfCtReportFinal',
        'CT report final is before scan start. Please confirm these times.'
      );
    }

    // Swallowing screening validations
    if (timeOfSwallowingScreening && dateOfAdmission && timeOfSwallowingScreening < dateOfAdmission) {
      addWarning(
        'timeOfSwallowingScreening',
        'Swallowing screening is before admission. Please review the entries.'
      );
    }

    // Thrombolysis validations
    if (thrombolysisOrderTime && dateOfAdmission && thrombolysisOrderTime < dateOfAdmission) {
      addWarning(
        'thrombolysisOrderTime',
        'Thrombolysis order is before admission. Confirm the time.'
      );
    }

    if (ivThrombolysisAdminTime && thrombolysisOrderTime && ivThrombolysisAdminTime < thrombolysisOrderTime) {
      addWarning(
        'ivThrombolysisAdministrationTime',
        'IV thrombolysis administration is before order time. Please verify the sequence.'
      );
    }

    if (ivThrombolysisAdminTime && timeOfCtReportFinal && ivThrombolysisAdminTime < timeOfCtReportFinal) {
      addWarning(
        'ivThrombolysisAdministrationTime',
        'IV thrombolysis is given before CT report final. Please verify the sequence.'
      );
    }

    // Thrombectomy validations
    if (timeOfMechanicalThrombectomyPuncture && dateOfAdmission && timeOfMechanicalThrombectomyPuncture < dateOfAdmission) {
      addWarning(
        'timeOfMechanicalThrombectomyPuncture',
        'Thrombectomy puncture is before admission. Please review the entries.'
      );
    }

    if (timeOfThrombectomyComplete && timeOfMechanicalThrombectomyPuncture && timeOfThrombectomyComplete < timeOfMechanicalThrombectomyPuncture) {
      addWarning(
        'timeOfThrombectomyComplete',
        'Thrombectomy complete is before puncture. Please confirm these times.'
      );
    }

    // Transfer activation validations
    if (timeOfTransferActivation && dateOfAdmission && timeOfTransferActivation < dateOfAdmission) {
      addWarning(
        'timeOfTransferActivation',
        'Transfer activation is before admission. Check both timestamps.'
      );
    }

    if (timeOfTransferDeparture && timeOfTransferActivation && timeOfTransferDeparture < timeOfTransferActivation) {
      addWarning(
        'timeOfTransferDeparture',
        'Transfer departure is before activation. Please correct these times.'
      );
    }

    setTimelineWarnings((prev) => {
      const prevKeys = Object.keys(prev);
      const newKeys = Object.keys(warnings);

      if (
        prevKeys.length === newKeys.length &&
        prevKeys.every(
          (key) =>
            newKeys.includes(key) &&
            (prev[key]?.length || 0) === (warnings[key]?.length || 0) &&
            (prev[key] || []).every((message, index) => message === warnings[key]?.[index])
        )
      ) {
        return prev;
      }

      return warnings;
    });
  }, [formData]);

  const hasTimelineWarnings = useMemo(
    () => Object.keys(timelineWarnings).length > 0,
    [timelineWarnings]
  );

  // Track which steps have issues
  const stepIssues = useMemo(() => {
    const issues = [false, false, false, false, false];

    // Step 0 (Patient) - check validation errors and transfer warnings
    if (Object.keys(validationErrors).some(key => key.startsWith('patientInfo.') || key === 'originHospitalId' || key === 'destinationHospitalId' || key === 'modeOfArrival') ||
      Object.keys(timelineWarnings).some(key =>
        key.includes('transferRequestDateTime') ||
        key.includes('transferArrivalDateTime')
      )) {
      issues[0] = true;
    }

    // Step 1 (Assessment) - check validation errors and timeline warnings
    if (validationErrors['strokeType'] ||
      Object.keys(timelineWarnings).some(key =>
        key.includes('timeOfSymptomOnset') ||
        key.includes('dateOfAdmission') ||
        key.includes('timeOfTriage') ||
        key.includes('timeOfPhysicianAssessment') ||
        key.includes('srcaCallTime')
      )) {
      issues[1] = true;
    }

    // Step 2 (Diagnosis) - check timeline warnings
    if (Object.keys(timelineWarnings).some(key =>
      key.includes('timeOfCtScanStart') ||
      key.includes('timeOfCtReportFinal') ||
      key.includes('timeOfSwallowingScreening')
    )) {
      issues[2] = true;
    }

    // Step 3 (Treatment) - check timeline warnings
    if (Object.keys(timelineWarnings).some(key =>
      key.includes('thrombolysisOrderTime') ||
      key.includes('ivThrombolysisAdministrationTime') ||
      key.includes('timeOfMechanicalThrombectomyPuncture') ||
      key.includes('timeOfThrombectomyComplete') ||
      key.includes('timeOfTransferActivation') ||
      key.includes('timeOfTransferDeparture')
    )) {
      issues[3] = true;
    }

    // Step 4 (Review) - has timeline warnings
    if (hasTimelineWarnings) {
      issues[4] = true;
    }

    return issues;
  }, [validationErrors, timelineWarnings, hasTimelineWarnings]);

  const validateStep = async (step: number): Promise<Record<string, string>> => {
    const errors: Record<string, string> = {};

    switch (step) {
      case 0:
        // Validate patient info with Yup
        if (formData.patientInfo) {
          try {
            await patientInfoSchema.validate(formData.patientInfo, { abortEarly: false });
          } catch (err: any) {
            if (err.inner) {
              err.inner.forEach((error: any) => {
                errors[`patientInfo.${error.path}`] = error.message;
              });
            }
          }
        }

        if (!formData.originHospitalId) {
          errors['originHospitalId'] = 'Origin Hospital is required';
        }

        if (originRequiresDestination && !formData.destinationHospitalId) {
          errors['destinationHospitalId'] = DESTINATION_REQUIRED_MESSAGE;
        }

        if (!formData.modeOfArrival) {
          errors['modeOfArrival'] = 'Mode of Arrival is required';
        }
        break;
      case 1:
        if (!formData.strokeType) {
          errors['strokeType'] = 'Stroke Type is required';
        }
        break;
      case 2:
        // Diagnosis fields are mostly optional
        break;
      case 3:
        // Treatment fields are mostly optional
        break;
      case 4:
        // Review step
        break;
    }

    return errors;
  };

  const handleNext = async () => {
    const errors = await validateStep(activeStep);
    setValidationErrors(errors);

    // Only proceed if there are no validation errors
    if (Object.keys(errors).length === 0 && activeStep < steps.length - 1) {
      setActiveStep(prev => prev + 1);
    }
    setError(null);
  };

  const handleBack = () => {
    if (activeStep > 0) {
      setActiveStep(prev => prev - 1);
    }
    setError(null);
  };

  const handleSubmit = async () => {
    const patientErrors = await validateStep(0);
    const assessmentErrors = await validateStep(1);
    const combinedErrors = { ...patientErrors, ...assessmentErrors };

    if (Object.keys(combinedErrors).length > 0) {
      setValidationErrors(combinedErrors);
      setActiveStep(Object.keys(patientErrors).length > 0 ? 0 : 1);
      setError('Please correct the highlighted information before submitting.');
      return;
    }

    if (hasTimelineWarnings) {
      setActiveStep(4);
      const firstWarning = timelineWarnings[Object.keys(timelineWarnings)[0]]?.[0];
      setError(firstWarning || 'Please review the timeline warnings before submitting.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await onSubmit(formData);
      handleClose();
    } catch (err: any) {
      console.error('Error creating stroke case:', err);

      // Extract meaningful error message
      let errorMessage = 'Failed to create stroke case';

      if (err?.response?.data) {
        // Backend validation error
        const errorData = err.response.data;
        if (errorData.message) {
          errorMessage = Array.isArray(errorData.message)
            ? errorData.message.join(', ')
            : errorData.message;
        } else if (errorData.error) {
          errorMessage = errorData.error;
        } else if (typeof errorData === 'string') {
          errorMessage = errorData;
        }
      } else if (err?.message) {
        errorMessage = err.message;
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Typography variant="h6" component="div">
          Create Stroke Case
        </Typography>
        <Typography variant="body2" color="textSecondary">
          Complete all steps to create a new stroke case
        </Typography>
      </DialogTitle>

      <DialogContent>
        <Box sx={{ mb: 3 }}>
          <Stepper activeStep={activeStep} alternativeLabel nonLinear>
            {steps.map((label, index) => {
              const hasIssue = stepIssues[index];
              return (
                <Step key={label}>
                  <StepButton
                    onClick={() => {
                      setActiveStep(index);
                      setError(null);
                    }}
                    sx={{
                      '& .MuiStepLabel-label': {
                        fontWeight: hasIssue ? 700 : 500,
                        ...(hasIssue && { color: 'warning.main' }),
                        fontSize: hasIssue ? '1rem' : '0.95rem',
                      },
                      ...(hasIssue && {
                        '& .MuiStepIcon-root': {
                          color: 'warning.main !important',
                        },
                      }),
                    }}
                  >
                    {label}
                  </StepButton>
                </Step>
              );
            })}
          </Stepper>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box sx={{ minHeight: 400 }}>
          {renderStepContent(activeStep)}
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 3 }}>
        <Button onClick={handleClose} disabled={loading}>
          Cancel
        </Button>

        <Button
          onClick={handleBack}
          disabled={activeStep === 0 || loading}
        >
          Back
        </Button>

        {activeStep < steps.length - 1 ? (
          <Button
            onClick={handleNext}
            variant="contained"
            disabled={loading}
          >
            Next
          </Button>
        ) : (
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={loading || hasTimelineWarnings}
            startIcon={loading ? <CircularProgress size={20} /> : null}
          >
            {loading ? 'Creating...' : 'Create Case'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default CreateStrokeCaseDialog;