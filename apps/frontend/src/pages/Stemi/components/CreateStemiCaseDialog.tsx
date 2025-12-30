import React, { useCallback, useEffect, useMemo, useState } from 'react';
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
  Typography,
  Alert,
  CircularProgress,
} from '@mui/material';
import * as yup from 'yup';
import { CreateStemiCaseData, PatientInfo, CriticalTimestamps, InterventionsAndTreatments, ClinicalAssessment, StemiCase, StemiService } from '../services/stemiService';
import { StemiDatetimeService } from '../services/stemiDatetimeService';
import { Hospital } from '../../../services/hospitalService';
import PatientInfoStep from './forms/PatientInfoStep';
import AdmissionDetailsStep from './forms/AdmissionDetailsStep';
import CriticalTimestampsStep from './forms/CriticalTimestampsStep';
import InterventionsAndTreatmentsStep from './forms/InterventionsAndTreatmentsStep';
import ClinicalAssessmentStep from './forms/ClinicalAssessmentStep';
import ReviewStep from './forms/ReviewStep';
import BedAssignmentStep from '../../Trauma/components/forms/BedAssignmentStep';
import { bedService } from '../../Beds/services/bedService';
import { useSnackbar } from 'notistack';
import { useQueryClient } from 'react-query';
import { BedAssignmentFormData } from '../../Trauma/types/traumaTypes';

interface CreateStemiCaseDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: CreateStemiCaseData) => Promise<StemiCase>;
  onCaseCreated?: (createdCase: StemiCase) => void;
}

const steps = [
  'Patient Information',
  'Admission Details',
  'Critical Timestamps',
  'Interventions & Treatments',
  'Clinical Assessment',
  'Bed Assignment',
  'Review & Submit',
];

const DESTINATION_REQUIRED_MESSAGE =
  'Please select a destination hospital because the selected origin hospital does not provide STEMI service.';

// Regex patterns supporting Arabic characters
const NAME_REGEX = /^[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFFA-Za-z\s\u00C0-\u017F-]+$/;
const ALPHANUMERIC_REGEX = /^[A-Za-z0-9]+$/;
const PHONE_REGEX = /^\+?\d{7,15}$/;

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
    .oneOf(['MALE', 'FEMALE', 'OTHER'], 'Please select a gender')
    .required('Gender is required'),
  phoneNumber: yup
    .string()
    .nullable()
    .transform((value) => (value ? value.trim() : ''))
    .test('valid-phone', 'Phone numbers can only include digits and may start with +', (value) => {
      if (!value) return true;
      return PHONE_REGEX.test(value);
    }),
  emergencyPhone: yup
    .string()
    .nullable()
    .transform((value) => (value ? value.trim() : ''))
    .test('valid-emergency-phone', 'Emergency phone can only include digits and may start with +', (value) => {
      if (!value) return true;
      return PHONE_REGEX.test(value);
    }),
  originHospitalId: yup.string().required('Origin Hospital is required'),
  destinationHospitalId: yup.string().optional(),
});

const CreateStemiCaseDialog: React.FC<CreateStemiCaseDialogProps> = ({
  open,
  onClose,
  onSubmit,
  onCaseCreated,
}) => {
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [timelineWarnings, setTimelineWarnings] = useState<Record<string, string[]>>({});
  const [originHospital, setOriginHospital] = useState<Hospital | null>(null);

  // Form data state
  const [patientInfo, setPatientInfo] = useState<PatientInfo>({
    firstName: '',
    lastName: '',
    nationalId: '',
    age: undefined,
    gender: 'MALE',
    phoneNumber: '',
    address: '',
    emergencyContact: '',
    emergencyPhone: '',
    medicalHistory: '',
    allergies: '',
    medications: '',
    originHospitalId: '',
    destinationHospitalId: '',
  });

  const [admissionDetails, setAdmissionDetails] = useState<{
    admissionTime: string;
    modeOfArrival: 'AMBULANCE_RED_CRESCENT' | 'PRIVATE_CAR' | 'TRANSFERRED_FROM_ANOTHER_HOSPITAL';
    transferRequestDateTime?: string;
    transferArrivalDateTime?: string;
  }>({
    admissionTime: StemiDatetimeService.getCurrentLocalDateTime(),
    modeOfArrival: 'AMBULANCE_RED_CRESCENT',
  });

  const [criticalTimestamps, setCriticalTimestamps] = useState<CriticalTimestamps>({
    triageTime: '',
    firstEcgTime: '',
  });

  const [interventionsAndTreatments, setInterventionsAndTreatments] = useState<InterventionsAndTreatments>({
    eligibleForPrimaryPci: false,
    pciType: undefined,
    pciLocation: '',
    doorOutTime: '',
    balloonInflationTime: '',
    thrombolyticGiven: false,
    thrombolyticAdminTime: '',
    fibrinolyticAbsoluteContraindications: '',
    fibrinolyticRelativeContraindications: '',
  });

  const [clinicalAssessment, setClinicalAssessment] = useState<ClinicalAssessment>({
    heartScore: undefined,
    clinicalRiskLevel: '',
    presentingSymptoms: '',
    symptomOnset: '',
    symptomDuration: undefined,
    miType: undefined,
    outcome: undefined,
  });

  const [additionalData, setAdditionalData] = useState({
    currentStatus: 'SUSPECTED' as string,
    selectedTreatment: undefined as any,
    ecgResult: undefined as any,
    ecgFindings: '',
    isTroponinPositive: false,
    troponinValue: undefined as number | undefined,
    additionalNotes: '',
  });

  const [bedAssignment, setBedAssignment] = useState<BedAssignmentFormData | undefined>(undefined);

  const handlePatientInfoChange = useCallback((updated: PatientInfo) => {
    setPatientInfo((prev) => {
      setValidationErrors((prevErrors) => {
        let nextErrors = { ...prevErrors };

        Object.keys(prevErrors).forEach((key) => {
          if (!key.startsWith('patientInfo.')) {
            return;
          }

          const field = key.replace('patientInfo.', '') as keyof PatientInfo;
          if (prev[field] !== updated[field]) {
            const { [key]: _removed, ...rest } = nextErrors;
            nextErrors = rest;
          }
        });

        return nextErrors;
      });

      return updated;
    });

    if (updated.destinationHospitalId) {
      setValidationErrors((prev) => {
        if (!prev['patientInfo.destinationHospitalId']) {
          return prev;
        }

        const { ['patientInfo.destinationHospitalId']: _, ...rest } = prev;
        return rest;
      });
    }
  }, []);

  const handleOriginHospitalSelect = useCallback((hospital: Hospital | null) => {
    setOriginHospital(hospital);

    setValidationErrors((prev) => {
      if (!prev['patientInfo.destinationHospitalId']) {
        return prev;
      }

      if (!hospital || hospital.hasStemiService) {
        const { ['patientInfo.destinationHospitalId']: _, ...rest } = prev;
        return rest;
      }

      return prev;
    });
  }, []);

  const originRequiresDestination = !!originHospital && !originHospital.hasStemiService;

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

    const admissionTime = parseDate(admissionDetails.admissionTime);
    const triageTime = parseDate(criticalTimestamps.triageTime);
    const firstEcgTime = parseDate(criticalTimestamps.firstEcgTime);
    const transferRequestTime = parseDate(admissionDetails.transferRequestDateTime);
    const transferArrivalTime = parseDate(admissionDetails.transferArrivalDateTime);
    const doorOutTime = parseDate(interventionsAndTreatments.doorOutTime);
    const balloonInflationTime = parseDate(interventionsAndTreatments.balloonInflationTime);
    const thrombolyticAdminTime =
      interventionsAndTreatments.thrombolyticGiven === false
        ? null
        : parseDate(interventionsAndTreatments.thrombolyticAdminTime);
    const symptomOnset = parseDate(clinicalAssessment.symptomOnset);

    if (symptomOnset && admissionTime && symptomOnset > admissionTime) {
      addWarning(
        'clinicalAssessment.symptomOnset',
        'Symptom onset happens after admission time. Please confirm the order of events.'
      );
    }

    if (triageTime && admissionTime && triageTime < admissionTime) {
      addWarning(
        'criticalTimestamps.triageTime',
        'Triage time occurs before admission. Double-check both times.'
      );
    }

    if (firstEcgTime && admissionTime && firstEcgTime < admissionTime) {
      addWarning(
        'criticalTimestamps.firstEcgTime',
        'First ECG time is before the patient arrived. Please revise the timestamps.'
      );
    }

    if (firstEcgTime && triageTime && firstEcgTime < triageTime) {
      addWarning(
        'criticalTimestamps.firstEcgTime',
        'First ECG usually follows triage. Please review the entries.'
      );
    }

    if (transferRequestTime && admissionTime && transferRequestTime < admissionTime) {
      addWarning(
        'admissionDetails.transferRequestDateTime',
        'Transfer request is logged before admission. Confirm the request time.'
      );
    }

    if (transferArrivalTime && transferRequestTime && transferArrivalTime < transferRequestTime) {
      addWarning(
        'admissionDetails.transferArrivalDateTime',
        'Transfer arrival is before the request. Please correct these times.'
      );
    }

    if (doorOutTime && admissionTime && doorOutTime < admissionTime) {
      addWarning(
        'interventionsAndTreatments.doorOutTime',
        'Door-out time is before admission. Check both timestamps.'
      );
    }

    if (doorOutTime && triageTime && doorOutTime < triageTime) {
      addWarning(
        'interventionsAndTreatments.doorOutTime',
        'Door-out time is earlier than triage. Please confirm the sequence.'
      );
    }

    if (doorOutTime && firstEcgTime && doorOutTime < firstEcgTime) {
      addWarning(
        'interventionsAndTreatments.doorOutTime',
        'Door-out time is earlier than the first ECG. Ensure the timeline is correct.'
      );
    }

    if (balloonInflationTime && doorOutTime && balloonInflationTime < doorOutTime) {
      addWarning(
        'interventionsAndTreatments.balloonInflationTime',
        'Balloon inflation should occur after leaving the facility. Please confirm these times.'
      );
    }

    if (balloonInflationTime && admissionTime && balloonInflationTime < admissionTime) {
      addWarning(
        'interventionsAndTreatments.balloonInflationTime',
        'Balloon inflation time happens before admission. Please review the entries.'
      );
    }

    if (balloonInflationTime && firstEcgTime && balloonInflationTime < firstEcgTime) {
      addWarning(
        'interventionsAndTreatments.balloonInflationTime',
        'Balloon inflation is before the first ECG. Please verify the entries.'
      );
    }

    if (thrombolyticAdminTime && admissionTime && thrombolyticAdminTime < admissionTime) {
      addWarning(
        'interventionsAndTreatments.thrombolyticAdminTime',
        'Thrombolytic administration is before admission. Confirm the time.'
      );
    }

    if (thrombolyticAdminTime && firstEcgTime && thrombolyticAdminTime < firstEcgTime) {
      addWarning(
        'interventionsAndTreatments.thrombolyticAdminTime',
        'Thrombolytics are given before the first ECG. Please verify the sequence.'
      );
    }

    if (thrombolyticAdminTime && triageTime && thrombolyticAdminTime < triageTime) {
      addWarning(
        'interventionsAndTreatments.thrombolyticAdminTime',
        'Thrombolytic medication appears before triage time. Please double-check.'
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
  }, [
    admissionDetails,
    criticalTimestamps,
    interventionsAndTreatments,
    clinicalAssessment,
  ]);

  const timelineWarningKeys = useMemo(() => Object.keys(timelineWarnings), [timelineWarnings]);

  const hasTimelineWarnings = timelineWarningKeys.length > 0;

  const stepIssues = useMemo(() => {
    const issues = new Array(steps.length).fill(false);

    const hasPatientErrors = Object.keys(validationErrors).some((key) =>
      key.startsWith('patientInfo.')
    );
    const hasAdmissionErrors = Object.keys(validationErrors).some((key) =>
      key.startsWith('admissionDetails.')
    );

    issues[0] = hasPatientErrors;
    issues[1] =
      hasAdmissionErrors ||
      timelineWarningKeys.some((key) => key.startsWith('admissionDetails.'));
    issues[2] = timelineWarningKeys.some((key) => key.startsWith('criticalTimestamps.'));
    issues[3] = timelineWarningKeys.some((key) => key.startsWith('interventionsAndTreatments.'));
    issues[4] = timelineWarningKeys.some((key) => key.startsWith('clinicalAssessment.'));
    const hasBedAssignmentErrors = Object.keys(validationErrors).some((key) =>
      key.startsWith('bedAssignment.')
    );
    issues[5] = hasBedAssignmentErrors;
    issues[6] = hasTimelineWarnings;

    return issues;
  }, [validationErrors, timelineWarningKeys, hasTimelineWarnings]);

  const handleNext = async () => {
    const errors = await validateStep(activeStep);
    setValidationErrors(errors);

    if (Object.keys(errors).length === 0 && activeStep < steps.length - 1) {
      setActiveStep((prevActiveStep) => prevActiveStep + 1);
    }

    setError(null);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
    setError(null);
  };

  const handleSubmit = async () => {
    const patientErrors = await validateStep(0);
    const admissionErrors = await validateStep(1);
    const combinedErrors = { ...patientErrors, ...admissionErrors };

    if (Object.keys(combinedErrors).length > 0) {
      setValidationErrors(combinedErrors);
      setActiveStep(Object.keys(patientErrors).length > 0 ? 0 : 1);
      setError('Please correct the highlighted information before submitting.');
      return;
    }

    // Validate bed assignment step if on review step
    if (activeStep === 6) {
      const bedAssignmentErrors = await validateStep(5);
      if (Object.keys(bedAssignmentErrors).length > 0) {
        setValidationErrors((prev) => ({ ...prev, ...bedAssignmentErrors }));
        setActiveStep(5);
        setError('Please correct the bed assignment information before submitting.');
        return;
      }
    }

    if (hasTimelineWarnings) {
      setActiveStep(6);
      const firstWarning = timelineWarnings[Object.keys(timelineWarnings)[0]]?.[0];
      setError(firstWarning || 'Please review the timeline warnings before submitting.');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const formData: CreateStemiCaseData = {
        patientInfo,
        admissionTime: StemiDatetimeService.formatForUTC(admissionDetails.admissionTime),
        modeOfArrival: admissionDetails.modeOfArrival,
        transferRequestDateTime: admissionDetails.transferRequestDateTime ? StemiDatetimeService.formatForUTC(admissionDetails.transferRequestDateTime) : undefined,
        transferArrivalDateTime: admissionDetails.transferArrivalDateTime ? StemiDatetimeService.formatForUTC(admissionDetails.transferArrivalDateTime) : undefined,
        criticalTimestamps: {
          triageTime: criticalTimestamps.triageTime ? StemiDatetimeService.formatForUTC(criticalTimestamps.triageTime) : undefined,
          firstEcgTime: criticalTimestamps.firstEcgTime ? StemiDatetimeService.formatForUTC(criticalTimestamps.firstEcgTime) : undefined,
        },
        interventionsAndTreatments: {
          ...interventionsAndTreatments,
          pciType: interventionsAndTreatments.pciType || undefined,
          pciLocation: interventionsAndTreatments.pciLocation || undefined,
          doorOutTime: interventionsAndTreatments.doorOutTime ? StemiDatetimeService.formatForUTC(interventionsAndTreatments.doorOutTime) : undefined,
          balloonInflationTime: interventionsAndTreatments.balloonInflationTime ? StemiDatetimeService.formatForUTC(interventionsAndTreatments.balloonInflationTime) : undefined,
          thrombolyticAdminTime: interventionsAndTreatments.thrombolyticAdminTime ? StemiDatetimeService.formatForUTC(interventionsAndTreatments.thrombolyticAdminTime) : undefined,
          fibrinolyticAbsoluteContraindications: interventionsAndTreatments.fibrinolyticAbsoluteContraindications || undefined,
          fibrinolyticRelativeContraindications: interventionsAndTreatments.fibrinolyticRelativeContraindications || undefined,
        },
        clinicalAssessment: {
          ...clinicalAssessment,
          symptomOnset: clinicalAssessment.symptomOnset ? StemiDatetimeService.formatForUTC(clinicalAssessment.symptomOnset) : undefined,
        },
        currentStatus: additionalData.currentStatus as any,
        selectedTreatment: additionalData.selectedTreatment,
        ecgResult: additionalData.ecgResult,
        ecgFindings: additionalData.ecgFindings || undefined,
        isTroponinPositive: additionalData.isTroponinPositive,
        troponinValue: additionalData.troponinValue,
        additionalNotes: additionalData.additionalNotes || undefined,
      };

      const createdCase = await onSubmit(formData);

      // Assign bed if specified
      const bedAssignmentData = bedAssignment as any;
      if (bedAssignmentData && bedAssignmentData.bedId) {
        if (createdCase?.id && createdCase?.patientId) {
          try {
            await bedService.assignBed(bedAssignmentData.bedId, {
              patientId: createdCase.patientId,
              caseId: createdCase.id,
              caseType: 'STEMI',
              arrivalDate: bedAssignmentData.arrivalDate,
            });
            enqueueSnackbar('STEMI case created and bed assigned successfully', { variant: 'success' });
            // Invalidate hospitals queries and dispatch event to trigger refetch
            queryClient.invalidateQueries('hospitals');
            window.dispatchEvent(new CustomEvent('hospital-capacity-changed'));
            
            try {
              const refreshedCase = await StemiService.getStemiCaseById(createdCase.id);
              // Notify parent component with refreshed case
              if (onCaseCreated) {
                onCaseCreated(refreshedCase);
              }
            } catch (refreshError) {
              console.error('Error refreshing case after bed assignment:', refreshError);
            }
          } catch (bedErr: any) {
            console.error('Error assigning bed:', bedErr);
            enqueueSnackbar('STEMI case created but bed assignment failed: ' + (bedErr?.response?.data?.message || bedErr?.message || 'Unknown error'), { variant: 'warning' });
          }
        } else {
          console.warn('Case created but missing ID or patient ID for bed assignment');
          enqueueSnackbar('STEMI case created but bed assignment skipped (missing case or patient ID)', { variant: 'warning' });
        }
      }

      handleClose();
      setAdmissionDetails({
        admissionTime: '',
        modeOfArrival: '' as any,
      });
      setCriticalTimestamps({
        triageTime: '',
        firstEcgTime: '',
      });
      setInterventionsAndTreatments({
        eligibleForPrimaryPci: false,
        pciType: undefined,
        pciLocation: '',
        doorOutTime: '',
        balloonInflationTime: '',
        thrombolyticGiven: false,
        thrombolyticAdminTime: '',
        fibrinolyticAbsoluteContraindications: '',
        fibrinolyticRelativeContraindications: '',
      });
      setClinicalAssessment({
        heartScore: undefined,
        clinicalRiskLevel: '',
        presentingSymptoms: '',
        symptomOnset: '',
        symptomDuration: undefined,
        miType: undefined,
        outcome: undefined,
      });
      setAdditionalData({
        currentStatus: 'SUSPECTED',
        selectedTreatment: undefined,
        ecgResult: undefined,
        ecgFindings: '',
        isTroponinPositive: false,
        troponinValue: undefined,
        additionalNotes: '',
      });
      setBedAssignment(undefined);
      setOriginHospital(null);
      setValidationErrors({});
    } catch (err: any) {
      console.error('Error creating STEMI case:', err);
      setError(err.response?.data?.message || 'Failed to create STEMI case');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setActiveStep(0);
      setError(null);
      setValidationErrors({});
      setOriginHospital(null);
      setBedAssignment(undefined);
      onClose();
    }
  };

  const validateStep = async (step: number): Promise<Record<string, string>> => {
    const errors: Record<string, string> = {};

    switch (step) {
      case 0: {
        try {
          await patientInfoSchema.validate(patientInfo, { abortEarly: false });
        } catch (validationError: any) {
          if (validationError.inner) {
            validationError.inner.forEach((err: yup.ValidationError) => {
              if (err.path) {
                errors[`patientInfo.${err.path}`] = err.message;
              }
            });
          } else if (validationError.path) {
            errors[`patientInfo.${validationError.path}`] = validationError.message;
          }
        }

        if (originRequiresDestination && !patientInfo.destinationHospitalId) {
          errors['patientInfo.destinationHospitalId'] = DESTINATION_REQUIRED_MESSAGE;
        }

        break;
      }
      case 1: {
        if (!admissionDetails.admissionTime) {
          errors['admissionDetails.admissionTime'] = 'Admission Time is required';
        }
        if (!admissionDetails.modeOfArrival) {
          errors['admissionDetails.modeOfArrival'] = 'Mode of Arrival is required';
        }
        break;
      }
      default:
        break;
    }

    return errors;
  };

  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <PatientInfoStep
            data={patientInfo}
            onChange={handlePatientInfoChange}
            validationErrors={validationErrors}
            onOriginHospitalSelect={handleOriginHospitalSelect}
            destinationRequired={originRequiresDestination}
          />
        );
      case 1:
        return (
          <AdmissionDetailsStep
            data={admissionDetails}
            onChange={setAdmissionDetails}
            validationErrors={validationErrors}
            timelineWarnings={timelineWarnings}
          />
        );
      case 2:
        return (
          <CriticalTimestampsStep
            data={criticalTimestamps}
            onChange={setCriticalTimestamps}
            timelineWarnings={timelineWarnings}
          />
        );
      case 3:
        return (
          <InterventionsAndTreatmentsStep
            data={interventionsAndTreatments}
            onChange={setInterventionsAndTreatments}
            timelineWarnings={timelineWarnings}
          />
        );
      case 4:
        return (
          <ClinicalAssessmentStep
            data={clinicalAssessment}
            onChange={setClinicalAssessment}
            additionalData={additionalData}
            onAdditionalDataChange={setAdditionalData}
            timelineWarnings={timelineWarnings}
          />
        );
      case 5:
        return (
          <BedAssignmentStep
            data={bedAssignment || {}}
            onChange={(data) => setBedAssignment({ ...bedAssignment, ...data } as BedAssignmentFormData)}
            errors={validationErrors}
            validationErrors={validationErrors}
            patientInfo={{
              originHospitalId: patientInfo.originHospitalId,
              destinationHospitalId: patientInfo.destinationHospitalId,
            } as any}
          />
        );
      case 6:
        return (
          <ReviewStep
            patientInfo={patientInfo}
            admissionDetails={admissionDetails}
            criticalTimestamps={criticalTimestamps}
            interventionsAndTreatments={interventionsAndTreatments}
            clinicalAssessment={clinicalAssessment}
            additionalData={additionalData}
            timelineWarnings={timelineWarnings}
            bedAssignment={bedAssignment}
          />
        );
      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Typography variant="h6" component="div">
          Create STEMI Case
        </Typography>
        <Typography variant="body2" color="textSecondary">
          Complete all steps to create a new STEMI case
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
        {activeStep === steps.length - 1 ? (
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={loading || hasTimelineWarnings}
            startIcon={loading ? <CircularProgress size={20} /> : null}
          >
            {loading ? 'Creating...' : 'Create Case'}
          </Button>
        ) : (
          <Button
            onClick={handleNext}
            variant="contained"
            disabled={loading}
          >
            Next
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default CreateStemiCaseDialog;
