import React, { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Stepper,
  Step,
  StepLabel,
  Box,
  Alert,
} from '@mui/material';
import * as yup from 'yup';

import { StrokeCase, CreateStrokeCaseData } from '../../../services/strokeService';
import { useAuth } from '../../../contexts/AuthContext';
import { Hospital, hospitalService } from '../../../services/hospitalService';
import PatientStep from './CreateStrokeCase/PatientStep';
import AssessmentStep from './CreateStrokeCase/AssessmentStep';
import DiagnosisStep from './CreateStrokeCase/DiagnosisStep';
import TreatmentStep from './CreateStrokeCase/TreatmentStep';
import ReviewStep from './CreateStrokeCase/ReviewStep';

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

interface EditStrokeCaseDialogProps {
  open: boolean;
  onClose: () => void;
  strokeCase: StrokeCase | null;
  onUpdate: (id: string, data: any) => Promise<void>;
}

const steps = [
  'Patient',
  'Assessment',
  'Diagnosis',
  'Treatment',
  'Review & Submit'
];

const EditStrokeCaseDialog: React.FC<EditStrokeCaseDialogProps> = ({
  open,
  onClose,
  strokeCase,
  onUpdate,
}) => {
  const { } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [activeStep, setActiveStep] = useState(0);
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
      gender: 'MALE',
      phoneNumber: '',
      email: '',
    },
  });

  const originRequiresDestination = !!originHospital && !originHospital.hasStrokeService;

  // Helper function to reset form to initial state
  const resetForm = () => {
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
        gender: 'MALE',
        phoneNumber: '',
        email: '',
      },
    });
    setActiveStep(0);
    setError(null);
    setSuccess(null);
    setValidationErrors({});
    setTimelineWarnings({});
    setOriginHospital(null);
    setLoading(false);
  };

  // Fetch origin hospital when it changes
  useEffect(() => {
    const fetchOriginHospital = async () => {
      if (formData.originHospitalId) {
        try {
          const hospital = await hospitalService.getHospitalById(formData.originHospitalId);
          setOriginHospital(hospital);
        } catch (error) {
          console.error('Error fetching origin hospital:', error);
          setOriginHospital(null);
        }
      } else {
        setOriginHospital(null);
      }
    };

    fetchOriginHospital();
  }, [formData.originHospitalId]);

  const handleOriginHospitalSelect = useCallback((hospital: Hospital | null) => {
    setOriginHospital(hospital);
    // Clear destination validation error if origin hospital provides stroke service
    if (hospital?.hasStrokeService) {
      setValidationErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors['destinationHospitalId'];
        return newErrors;
      });
    }
  }, []);

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

    if (timeOfSymptomOnset && dateOfAdmission && timeOfSymptomOnset > dateOfAdmission) {
      addWarning(
        'timeOfSymptomOnset',
        'Symptom onset happens after admission. Please confirm the order of events.'
      );
    }

    if (timeOfTriage && dateOfAdmission && timeOfTriage < dateOfAdmission) {
      addWarning(
        'timeOfTriage',
        'Triage time occurs before admission. Double-check both times.'
      );
    }

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

    if (srcaCallTime && dateOfAdmission && srcaCallTime > dateOfAdmission) {
      addWarning(
        'srcaCallTime',
        'SRCA call time is after admission. Please verify the timeline.'
      );
    }

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

    if (timeOfSwallowingScreening && dateOfAdmission && timeOfSwallowingScreening < dateOfAdmission) {
      addWarning(
        'timeOfSwallowingScreening',
        'Swallowing screening is before admission. Please review the entries.'
      );
    }

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

    setTimelineWarnings((prev: Record<string, string[]>) => {
      const prevKeys = Object.keys(prev);
      const newKeys = Object.keys(warnings);

      if (
        prevKeys.length === newKeys.length &&
        prevKeys.every(
          (key) =>
            newKeys.includes(key) &&
            (prev[key]?.length || 0) === (warnings[key]?.length || 0) &&
            (prev[key] || []).every((message: string, index: number) => message === warnings[key]?.[index])
        )
      ) {
        return prev;
      }

      return warnings;
    });
  }, [formData]);

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      resetForm();
    }
  }, [open]);

  // Load case data when dialog opens or case changes
  useEffect(() => {
    if (strokeCase && open) {
      setFormData({
        // Basic Information
        originHospitalId: strokeCase.originHospitalId,
        destinationHospitalId: strokeCase.destinationHospitalId,
        strokeType: strokeCase.strokeType,
        currentStatus: strokeCase.currentStatus,
        chiefComplaint: strokeCase.chiefComplaint || '',

        // Patient Information
        patientInfo: {
          firstName: strokeCase.patient?.firstName || '',
          lastName: strokeCase.patient?.lastName || '',
          nationalId: strokeCase.patient?.nationalId || '',
          mrn: strokeCase.patient?.mrn || '',
          dateOfBirth: strokeCase.patient?.dateOfBirth ? new Date(strokeCase.patient.dateOfBirth).toISOString().split('T')[0] : undefined,
          age: strokeCase.patient?.age || undefined,
          gender: (strokeCase.patient?.gender as 'MALE' | 'FEMALE') || 'MALE',
          phoneNumber: strokeCase.patient?.phoneNumber || '',
          email: strokeCase.patient?.email || '',
        },

        // Patient Arrival & Timing
        modeOfArrival: strokeCase.modeOfArrival,
        transferRequestDateTime: strokeCase.transferRequestDateTime ? new Date(strokeCase.transferRequestDateTime).toISOString().slice(0, 16) : '',
        transferArrivalDateTime: strokeCase.transferArrivalDateTime ? new Date(strokeCase.transferArrivalDateTime).toISOString().slice(0, 16) : '',
        srcaCallTime: strokeCase.srcaCallTime,
        timeOfSymptomOnset: strokeCase.timeOfSymptomOnset,
        lastKnownNormal: strokeCase.lastKnownNormal,
        dateOfAdmission: strokeCase.dateOfAdmission,
        timeOfTriage: strokeCase.timeOfTriage,
        timeOfPhysicianAssessment: strokeCase.timeOfPhysicianAssessment,

        // Clinical Assessment & Diagnosis
        strokeTypeDetailed: strokeCase.strokeTypeDetailed,
        swallowingScreeningPerformed: strokeCase.swallowingScreeningPerformed,
        timeOfSwallowingScreening: strokeCase.timeOfSwallowingScreening,
        swallowingScreeningResult: strokeCase.swallowingScreeningResult,
        ctScanPerformed: strokeCase.ctScanPerformed,
        timeOfCtScanStart: strokeCase.timeOfCtScanStart,
        timeOfCtReportFinal: strokeCase.timeOfCtReportFinal,
        ctFindings: strokeCase.ctFindings,
        lvoDetected: strokeCase.lvoDetected,
        candidateForIVThrombolysis: strokeCase.candidateForIVThrombolysis,
        thrombolysisOrderTime: strokeCase.thrombolysisOrderTime,
        ivThrombolysisAdministrationTime: strokeCase.ivThrombolysisAdministrationTime,
        ivThrombolysisGiven: strokeCase.ivThrombolysisGiven,
        reasonForNotAdministeringIV: strokeCase.reasonForNotAdministeringIV,
        candidateForMechanicalThrombectomy: strokeCase.candidateForMechanicalThrombectomy,
        timeOfMechanicalThrombectomyPuncture: strokeCase.timeOfMechanicalThrombectomyPuncture,
        mechanicalThrombectomyPerformed: strokeCase.mechanicalThrombectomyPerformed,
        timeOfThrombectomyComplete: strokeCase.timeOfThrombectomyComplete,

        // Disposition & Transfer Decisions
        facilityHasCt: strokeCase.facilityHasCt,
        transferToAnotherHospital: strokeCase.transferToAnotherHospital,
        timeOfTransferActivation: strokeCase.timeOfTransferActivation,
        timeOfTransferDeparture: strokeCase.timeOfTransferDeparture,
        prehospitalNotificationBySrca: strokeCase.prehospitalNotificationBySrca,
        prehospitalNotificationByUccPhc: strokeCase.prehospitalNotificationByUccPhc,
        disposition: strokeCase.disposition,
        referralTo: strokeCase.referralTo,
        admittedToStrokeUnit: strokeCase.admittedToStrokeUnit,

        // Follow-up & Outcome Tracking
        followUpContactAttempted: strokeCase.followUpContactAttempted,
        modifiedRankinScaleAt90Days: strokeCase.modifiedRankinScaleAt90Days,
      });
      setActiveStep(0);
      setError(null);
      setSuccess(null);
      setValidationErrors({});
      setTimelineWarnings({});
      setOriginHospital(null);
      setLoading(false);
    }
  }, [strokeCase?.id, open]);

  const updateFormData = (field: keyof CreateStrokeCaseData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));

    // Clear validation errors for fields that are being changed
    setValidationErrors((prev) => {
      const newErrors = { ...prev };

      if (field === 'patientInfo') {
        // Clear all patientInfo errors
        Object.keys(newErrors).forEach(key => {
          if (key.startsWith('patientInfo.')) {
            delete newErrors[key];
          }
        });
      } else if (field === 'originHospitalId') {
        delete newErrors['originHospitalId'];
        delete newErrors['destinationHospitalId'];
      } else if (field === 'destinationHospitalId') {
        delete newErrors['destinationHospitalId'];
      } else if (field === 'modeOfArrival') {
        delete newErrors['modeOfArrival'];
      } else if (field === 'strokeType') {
        delete newErrors['strokeType'];
      }

      return newErrors;
    });
  };

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
      setError(null); // Clear error when moving forward successfully
    } else if (Object.keys(errors).length > 0) {
      setError('Please correct the highlighted information before proceeding.');
    }
  };

  const handleBack = () => {
    if (activeStep > 0) {
      setActiveStep(prev => prev - 1);
    }
  };

  const handleSubmit = async () => {
    if (!strokeCase) return;

    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      // Validate all required steps before submission
      const patientErrors = await validateStep(0);
      const assessmentErrors = await validateStep(1);
      const combinedErrors = { ...patientErrors, ...assessmentErrors };

      if (Object.keys(combinedErrors).length > 0) {
        setValidationErrors(combinedErrors);
        // Navigate to first step with error
        const firstErrorKey = Object.keys(combinedErrors)[0];
        let targetStep: number = 0;
        if (firstErrorKey.startsWith('patientInfo.') || firstErrorKey === 'originHospitalId' || firstErrorKey === 'destinationHospitalId' || firstErrorKey === 'modeOfArrival') {
          targetStep = 0;
        } else if (firstErrorKey === 'strokeType') {
          targetStep = 1;
        }
        setActiveStep(targetStep);
        setError('Please correct the highlighted information before submitting.');
        setLoading(false);
        return;
      }

      // Prepare update data with patientInfo included
      const { patientInfo, ...otherData } = formData;

      // Clean empty string values and convert them to undefined
      const cleanedData = Object.entries(otherData).reduce((acc, [key, value]) => {
        if (value !== '' && value !== null && value !== undefined) {
          acc[key] = value;
        }
        return acc;
      }, {} as any);

      // Always include patientInfo in the update payload
      if (patientInfo) {
        cleanedData.patientInfo = patientInfo;
      }

      console.log('Sending update data:', cleanedData);
      await onUpdate(strokeCase.id, cleanedData);
      setSuccess('Case updated successfully!');
      setError(null);

      // Clear form and close dialog after a short delay to show success message
      setTimeout(() => {
        resetForm();
        onClose();
      }, 1500);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to update stroke case');
      setSuccess(null);
      console.error('Error updating stroke case:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      resetForm();
      onClose();
    }
  };

  if (!strokeCase) return null;

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        Edit Stroke Case - {strokeCase.patient?.firstName} {strokeCase.patient?.lastName}
      </DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {success}
          </Alert>
        )}

        <Box sx={{ width: '100%', mt: 2 }}>
          <Stepper activeStep={activeStep} alternativeLabel>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
        </Box>

        <Box sx={{ mt: 3 }}>
          {renderStepContent(activeStep)}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          Cancel
        </Button>
        {activeStep > 0 && (
          <Button onClick={handleBack} disabled={loading}>
            Back
          </Button>
        )}
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
            disabled={loading}
          >
            {loading ? 'Updating...' : 'Update'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default EditStrokeCaseDialog;