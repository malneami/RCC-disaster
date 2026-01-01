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
  CircularProgress,
} from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import * as yup from 'yup';

// Form step components (same as creation)
import PatientInfoStep from './forms/PatientInfoStep';
import IncidentDetailsStep from './forms/IncidentDetailsStep';
import VitalsAssessmentStep from './forms/VitalsAssessmentStep';
import InjuryAssessmentStep from './forms/InjuryAssessmentStep';
import DispositionStep from './forms/DispositionStep';

// Types and constants
import { TraumaCase, UpdateTraumaCaseData } from '../../../services/traumaService';
import { TRAUMA_FORM_STEPS } from '../constants/traumaConstants';
import { validateTraumaCaseForm } from '../helpers/traumaHelpers';
import { useAuth } from '../../../contexts/AuthContext';
import { Hospital, hospitalService } from '../../../services/hospitalService';

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
  emergencyPhone: yup
    .string()
    .nullable()
    .transform((value) => (value ? value.trim() : ''))
    .test('valid-emergency-phone', 'Emergency phone can only include digits and may start with +', (value) => {
      if (!value) return true;
      return PHONE_REGEX.test(value);
    }),
  email: yup
    .string()
    .nullable()
    .transform((value) => (value ? value.trim() : ''))
    .email('Please provide a valid email address'),
  originHospitalId: yup.string().required('Origin Hospital is required'),
  destinationHospitalId: yup.string().optional(),
});

interface EditTraumaCaseDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (id: string, data: any) => Promise<void>;
  traumaCase: TraumaCase | null;
}

const EditTraumaCaseDialog: React.FC<EditTraumaCaseDialogProps> = ({
  open,
  onClose,
  onSubmit,
  traumaCase,
}) => {
  const { user } = useAuth();
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [timelineWarnings, setTimelineWarnings] = useState<Record<string, string[]>>({});
  const [originHospital, setOriginHospital] = useState<Hospital | null>(null);
  const [formData, setFormData] = useState({
    patientInfo: {
      firstName: '',
      lastName: '',
      nationalId: '',
      dateOfBirth: undefined as string | undefined,
      age: undefined as number | undefined,
      gender: 'MALE' as 'MALE' | 'FEMALE',
      phoneNumber: '',
      email: '',
      address: '',
      emergencyContact: '',
      emergencyPhone: '',
      medicalHistory: '',
      allergies: '',
      medications: '',
      originHospitalId: '',
      destinationHospitalId: '',
    },
    incidentDetails: {
      arrivalDateTime: '',
      incidentDateTime: '',
      modeOfArrival: 'AMBULANCE_RED_CRESCENT',
      transferRequestDateTime: '',
      transferArrivalDateTime: '',
      chiefComplaint: '',
      mechanismOfInjury: 'MOTOR_VEHICLE_ACCIDENT',
      primarySurveyFindings: '',
      additionalNotes: '',
    },
    vitalsAssessment: {
      vitalSigns: {
        temperature: 0,
        heartRate: 0,
        bloodPressure: '',
        oxygenSaturation: 0,
        respiratoryRate: 0,
      },
      glasgowComaScale: 15,
      systolicBloodPressure: 0,
      respiratoryRate: 0,
      additionalVitalSigns: '',
    },
    injuryAssessment: {
      headAndNeckInjury: '1 - No Injury: - No injury',
      faceInjury: '1 - No Injury: - No injury',
      chestInjury: '1 - No Injury: - No injury',
      abdomenInjury: '1 - No Injury: - No injury',
      extremitiesInjury: '1 - No Injury: - No injury',
      externalInjury: '1 - No Injury: - No injury',
    },
    disposition: {
      edDisposition: 'DISCHARGE',
      disposition: {
        dischargeInstructions: '',
        followUpRequired: false,
        followUpDate: '',
        medicationsPrescribed: '',
        restrictions: '',
      },
    },
  });
  const [stepErrors, setStepErrors] = useState<Record<string, string>>({});

  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';
  const originRequiresDestination = !!originHospital && !originHospital.hasTraumaService;

  useEffect(() => {
    const fetchOriginHospital = async () => {
      if (formData.patientInfo.originHospitalId) {
        try {
          const hospital = await hospitalService.getHospitalById(formData.patientInfo.originHospitalId);
          setOriginHospital(hospital);
        } catch (error) {
          setOriginHospital(null);
        }
      } else {
        setOriginHospital(null);
      }
    };

    fetchOriginHospital();
  }, [formData.patientInfo.originHospitalId]);

  useEffect(() => {
    if (traumaCase && open) {
      setActiveStep(0);
      setError(null);
      setLoading(false);
      setStepErrors({});
      setValidationErrors({});
      setTimelineWarnings({});
      setOriginHospital(null);

      // Convert trauma case data to form structure (exactly like creation form)
      setFormData({
        patientInfo: {
          firstName: traumaCase.patient?.firstName || '',
          lastName: traumaCase.patient?.lastName || '',
          nationalId: traumaCase.patient?.nationalId || '',
          dateOfBirth: traumaCase.patient?.dateOfBirth ? new Date(traumaCase.patient.dateOfBirth).toISOString().split('T')[0] : undefined,
          age: traumaCase.patient?.age || undefined,
          gender: (traumaCase.patient?.gender as 'MALE' | 'FEMALE') || ('MALE' as 'MALE' | 'FEMALE'),
          phoneNumber: traumaCase.patient?.phoneNumber || '',
          email: traumaCase.patient?.email || '',
          address: (traumaCase.patient as any)?.address || '',
          emergencyContact: (traumaCase.patient as any)?.emergencyContact || '',
          emergencyPhone: (traumaCase.patient as any)?.emergencyPhone || '',
          medicalHistory: (traumaCase.patient as any)?.medicalHistory || '',
          allergies: (traumaCase.patient as any)?.allergies || '',
          medications: (traumaCase.patient as any)?.medications || '',
          originHospitalId: traumaCase.originHospitalId || '',
          destinationHospitalId: traumaCase.destinationHospitalId || '',
        },
        incidentDetails: {
          arrivalDateTime: traumaCase.arrivalDateTime ? new Date(traumaCase.arrivalDateTime).toISOString().slice(0, 16) : '',
          incidentDateTime: traumaCase.incidentDateTime ? new Date(traumaCase.incidentDateTime).toISOString().slice(0, 16) : '',
          modeOfArrival: traumaCase.modeOfArrival || 'AMBULANCE_RED_CRESCENT',
          transferRequestDateTime: traumaCase.transferRequestDateTime ? new Date(traumaCase.transferRequestDateTime).toISOString().slice(0, 16) : '',
          transferArrivalDateTime: traumaCase.transferArrivalDateTime ? new Date(traumaCase.transferArrivalDateTime).toISOString().slice(0, 16) : '',
          chiefComplaint: traumaCase.chiefComplaint || '',
          mechanismOfInjury: traumaCase.mechanismOfInjury || 'MOTOR_VEHICLE_ACCIDENT',
          primarySurveyFindings: traumaCase.primarySurveyFindings || '',
          additionalNotes: traumaCase.additionalNotes || '',
        },
        vitalsAssessment: {
          vitalSigns: {
            temperature: traumaCase.vitalSigns?.temperature || 0,
            heartRate: traumaCase.vitalSigns?.heartRate || 0,
            bloodPressure: traumaCase.vitalSigns?.bloodPressure || '',
            oxygenSaturation: traumaCase.vitalSigns?.oxygenSaturation || 0,
            respiratoryRate: traumaCase.vitalSigns?.respiratoryRate || 0,
          },
          glasgowComaScale: traumaCase.glasgowComaScale || 15,
          systolicBloodPressure: traumaCase.systolicBloodPressure || 0,
          respiratoryRate: traumaCase.respiratoryRate || 0,
          additionalVitalSigns: traumaCase.additionalVitalSigns || '',
        },
        injuryAssessment: {
          headAndNeckInjury: traumaCase.headAndNeckInjury || '1 - No Injury: - No injury',
          faceInjury: traumaCase.faceInjury || '1 - No Injury: - No injury',
          chestInjury: traumaCase.chestInjury || '1 - No Injury: - No injury',
          abdomenInjury: traumaCase.abdomenInjury || '1 - No Injury: - No injury',
          extremitiesInjury: traumaCase.extremitiesInjury || '1 - No Injury: - No injury',
          externalInjury: traumaCase.externalInjury || '1 - No Injury: - No injury',
        },
        disposition: {
          edDisposition: traumaCase.edDisposition || 'DISCHARGE',
          disposition: {
            dischargeInstructions: traumaCase.disposition?.dischargeInstructions || '',
            followUpRequired: traumaCase.disposition?.followUpRequired || false,
            followUpDate: traumaCase.disposition?.followUpDate || '',
            medicationsPrescribed: traumaCase.disposition?.medicationsPrescribed || '',
            restrictions: traumaCase.disposition?.restrictions || '',
          },
        },
      });
    }
  }, [traumaCase, open]);

  // Timeline validation
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

    const arrivalTime = parseDate(formData.incidentDetails.arrivalDateTime);
    const incidentTime = parseDate(formData.incidentDetails.incidentDateTime);
    const transferRequestTime = parseDate(formData.incidentDetails.transferRequestDateTime);
    const transferArrivalTime = parseDate(formData.incidentDetails.transferArrivalDateTime);

    if (incidentTime && arrivalTime && incidentTime > arrivalTime) {
      addWarning(
        'incidentDetails.incidentDateTime',
        'Incident time happens after arrival time. Please confirm the order of events.'
      );
    }

    if (transferRequestTime && arrivalTime && transferRequestTime < arrivalTime) {
      addWarning(
        'incidentDetails.transferRequestDateTime',
        'Transfer request is logged before arrival. Confirm the request time.'
      );
    }

    if (transferArrivalTime && transferRequestTime && transferArrivalTime < transferRequestTime) {
      addWarning(
        'incidentDetails.transferArrivalDateTime',
        'Transfer arrival is before the request. Please correct these times.'
      );
    }

    if (transferArrivalTime && arrivalTime && transferArrivalTime < arrivalTime) {
      addWarning(
        'incidentDetails.transferArrivalDateTime',
        'Transfer arrival is before initial arrival. Check both timestamps.'
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
  }, [formData.incidentDetails]);

  const handleOriginHospitalSelect = useCallback((hospital: Hospital | null) => {
    setOriginHospital(hospital);
    // Clear destination validation error if origin hospital provides trauma service
    if (hospital?.hasTraumaService) {
      setValidationErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors['patientInfo.destinationHospitalId'];
        return newErrors;
      });
    }
  }, []);

  const handleStepDataChange = (stepData: any) => {
    setFormData(prev => ({ ...prev, ...stepData }));

    // Clear validation errors for fields that are being changed
    if (stepData.patientInfo) {
      setValidationErrors((prev) => {
        const newErrors = { ...prev };
        Object.keys(stepData.patientInfo).forEach(key => {
          delete newErrors[`patientInfo.${key}`];
        });
        return newErrors;
      });
    }
    if (stepData.incidentDetails) {
      setValidationErrors((prev) => {
        const newErrors = { ...prev };
        Object.keys(stepData.incidentDetails).forEach(key => {
          delete newErrors[`incidentDetails.${key}`];
        });
        return newErrors;
      });
    }
    if (stepData.vitalsAssessment) {
      setValidationErrors((prev) => {
        const newErrors = { ...prev };
        Object.keys(stepData.vitalsAssessment).forEach(key => {
          delete newErrors[`vitalsAssessment.${key}`];
        });
        return newErrors;
      });
    }
    if (stepData.disposition) {
      setValidationErrors((prev) => {
        const newErrors = { ...prev };
        Object.keys(stepData.disposition).forEach(key => {
          delete newErrors[`disposition.${key}`];
        });
        return newErrors;
      });
    }
  };

  const handleNext = async () => {
    const errors = await validateStep(activeStep);
    setValidationErrors(errors);

    // Only proceed if there are no validation errors
    if (Object.keys(errors).length === 0 && activeStep < TRAUMA_FORM_STEPS.length - 1) {
      setActiveStep(prev => prev + 1);
      setError(null); // Clear error when moving forward successfully
    } else if (Object.keys(errors).length > 0) {
      setError('Please correct the highlighted information before proceeding.');
    }
  };

  const handleBack = () => {
    setActiveStep(prev => prev - 1);
  };

  const handleSubmit = async () => {
    if (!traumaCase) return;

    try {
      setLoading(true);
      setError(null);

      // Validate all required steps before submission
      const patientErrors = await validateStep(0);
      const incidentErrors = await validateStep(1);
      const dispositionErrors = await validateStep(4);
      const allErrors = { ...patientErrors, ...incidentErrors, ...dispositionErrors };

      if (Object.keys(allErrors).length > 0) {
        setValidationErrors(allErrors);
        const firstErrorKey = Object.keys(allErrors)[0];
        let targetStep: number = 0;
        if (firstErrorKey.startsWith('patientInfo.')) {
          targetStep = 0;
        } else if (firstErrorKey.startsWith('incidentDetails.')) {
          targetStep = 1;
        } else if (firstErrorKey.startsWith('disposition.')) {
          targetStep = 4;
        }
        setActiveStep(targetStep);
        setError('Please correct the highlighted information before submitting.');
        setLoading(false);
        return;
      }


      const validationErrors = validateTraumaCaseForm(formData);
      if (validationErrors.length > 0) {
        setError(validationErrors.join(', '));
        setLoading(false);
        return;
      }

      // Prepare data for submission (exactly like creation form)
      const submitData: UpdateTraumaCaseData = {
        originHospitalId: formData.patientInfo.originHospitalId,
        destinationHospitalId: formData.patientInfo.destinationHospitalId || undefined,
        arrivalDateTime: formData.incidentDetails.arrivalDateTime,
        incidentDateTime: formData.incidentDetails.incidentDateTime || undefined,
        modeOfArrival: formData.incidentDetails.modeOfArrival as any,
        transferRequestDateTime: formData.incidentDetails.transferRequestDateTime || undefined,
        transferArrivalDateTime: formData.incidentDetails.transferArrivalDateTime || undefined,
        chiefComplaint: formData.incidentDetails.chiefComplaint || undefined,
        mechanismOfInjury: formData.incidentDetails.mechanismOfInjury as any,
        vitalSigns: formData.vitalsAssessment.vitalSigns,
        glasgowComaScale: formData.vitalsAssessment.glasgowComaScale,
        systolicBloodPressure: formData.vitalsAssessment.systolicBloodPressure || undefined,
        respiratoryRate: formData.vitalsAssessment.respiratoryRate || undefined,
        additionalVitalSigns: formData.vitalsAssessment.additionalVitalSigns || undefined,
        headAndNeckInjury: formData.injuryAssessment.headAndNeckInjury as any,
        faceInjury: formData.injuryAssessment.faceInjury as any,
        chestInjury: formData.injuryAssessment.chestInjury as any,
        abdomenInjury: formData.injuryAssessment.abdomenInjury as any,
        extremitiesInjury: formData.injuryAssessment.extremitiesInjury as any,
        externalInjury: formData.injuryAssessment.externalInjury as any,
        primarySurveyFindings: formData.incidentDetails.primarySurveyFindings || undefined,
        edDisposition: formData.disposition.edDisposition as any,
        additionalNotes: formData.incidentDetails.additionalNotes || undefined,
        disposition: formData.disposition.disposition,
      };

      // Add patient info for admins only (exclude hospital IDs as they're already at top level)
      if (isAdmin) {
        const { originHospitalId, destinationHospitalId, ...patientInfoOnly } = formData.patientInfo;
        submitData.patientInfo = patientInfoOnly;
      }

      await onSubmit(traumaCase.id, submitData);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to update trauma case');
      console.error('Error updating trauma case:', err);
    } finally {
      setLoading(false);
    }
  };

  const validateStep = async (stepIndex: number): Promise<Record<string, string>> => {
    const errors: Record<string, string> = {};

    switch (stepIndex) {
      case 0: // Patient Info
        try {
          await patientInfoSchema.validate(formData.patientInfo, { abortEarly: false });
        } catch (err: any) {
          if (err.inner) {
            err.inner.forEach((error: any) => {
              errors[`patientInfo.${error.path}`] = error.message;
            });
          }
        }

        if (originRequiresDestination && !formData.patientInfo.destinationHospitalId) {
          errors['patientInfo.destinationHospitalId'] = 'Destination Hospital is required because the selected origin hospital does not provide Trauma service.';
        }
        break;
      case 1: // Incident Details
        if (!formData.incidentDetails.arrivalDateTime) {
          errors['incidentDetails.arrivalDateTime'] = 'Arrival Date Time is required';
        }
        if (!formData.incidentDetails.modeOfArrival) {
          errors['incidentDetails.modeOfArrival'] = 'Mode of Arrival is required';
        }
        if (!formData.incidentDetails.mechanismOfInjury) {
          errors['incidentDetails.mechanismOfInjury'] = 'Mechanism of Injury is required';
        }
        if (formData.incidentDetails.incidentDateTime && formData.incidentDetails.arrivalDateTime) {
          const incidentTime = new Date(formData.incidentDetails.incidentDateTime);
          const arrivalTime = new Date(formData.incidentDetails.arrivalDateTime);
          if (incidentTime > arrivalTime) {
            errors['incidentDetails.incidentDateTime'] = 'Incident time cannot be after arrival time. Please confirm the order of events.';
          }
        }
        if (formData.incidentDetails.transferRequestDateTime && formData.incidentDetails.arrivalDateTime) {
          const transferRequestTime = new Date(formData.incidentDetails.transferRequestDateTime);
          const arrivalTime = new Date(formData.incidentDetails.arrivalDateTime);
          if (transferRequestTime < arrivalTime) {
            errors['incidentDetails.transferRequestDateTime'] = 'Transfer request cannot be before arrival time.';
          }
        }
        if (formData.incidentDetails.transferArrivalDateTime && formData.incidentDetails.transferRequestDateTime) {
          const transferArrivalTime = new Date(formData.incidentDetails.transferArrivalDateTime);
          const transferRequestTime = new Date(formData.incidentDetails.transferRequestDateTime);
          if (transferArrivalTime < transferRequestTime) {
            errors['incidentDetails.transferArrivalDateTime'] = 'Transfer arrival cannot be before transfer request time.';
          }
        }
        if (formData.incidentDetails.transferArrivalDateTime && formData.incidentDetails.arrivalDateTime) {
          const transferArrivalTime = new Date(formData.incidentDetails.transferArrivalDateTime);
          const arrivalTime = new Date(formData.incidentDetails.arrivalDateTime);
          if (transferArrivalTime < arrivalTime) {
            errors['incidentDetails.transferArrivalDateTime'] = 'Transfer arrival cannot be before initial arrival time.';
          }
        }
        break;
      case 2: // Vitals Assessment
        // Optional step
        break;
      case 3: // Injury Assessment
        // Optional step
        break;
      case 4: // Disposition
        if (!formData.disposition.edDisposition) {
          errors['disposition.edDisposition'] = 'ED Disposition is required';
        }
        break;
    }

    return errors;
  };

  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return (
          <PatientInfoStep
            data={formData.patientInfo}
            onChange={(data) => handleStepDataChange({ patientInfo: { ...formData.patientInfo, ...data } })}
            errors={stepErrors}
            validationErrors={validationErrors}
            isAdmin={isAdmin}
            onOriginHospitalSelect={handleOriginHospitalSelect}
            destinationRequired={originRequiresDestination}
          />
        );
      case 1:
        return (
          <IncidentDetailsStep
            data={formData.incidentDetails}
            onChange={(data) => handleStepDataChange({ incidentDetails: { ...formData.incidentDetails, ...data } })}
            errors={stepErrors}
            validationErrors={validationErrors}
            timelineWarnings={timelineWarnings}
          />
        );
      case 2:
        return (
          <VitalsAssessmentStep
            data={formData.vitalsAssessment}
            onChange={(data) => handleStepDataChange({ vitalsAssessment: { ...formData.vitalsAssessment, ...data } })}
            errors={stepErrors}
            validationErrors={validationErrors}
          />
        );
      case 3:
        return (
          <InjuryAssessmentStep
            data={formData.injuryAssessment}
            onChange={(data) => handleStepDataChange({ injuryAssessment: { ...formData.injuryAssessment, ...data } })}
            errors={stepErrors}
            validationErrors={validationErrors}
          />
        );
      case 4:
        return (
          <DispositionStep
            data={formData.disposition}
            onChange={(data) => handleStepDataChange({ disposition: { ...formData.disposition, ...data } })}
            errors={stepErrors}
            validationErrors={validationErrors}
          />
        );
      default:
        return null;
    }
  };

  if (!traumaCase) return null;

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={2}>
            <span>✏️</span>
            <span>Edit Trauma Case - {traumaCase.patient?.firstName} {traumaCase.patient?.lastName}</span>
            {isAdmin && (
              <Box sx={{ ml: 'auto' }}>
                <Box sx={{
                  px: 1,
                  py: 0.5,
                  bgcolor: 'primary.main',
                  color: 'white',
                  borderRadius: 1,
                  fontSize: '0.75rem',
                  fontWeight: 'bold'
                }}>
                  ADMIN EDIT
                </Box>
              </Box>
            )}
          </Box>
        </DialogTitle>

        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
            {TRAUMA_FORM_STEPS.map((step) => (
              <Step key={step.id}>
                <StepLabel icon={step.icon}>
                  {step.label}
                </StepLabel>
              </Step>
            ))}
          </Stepper>

          <Box minHeight="400px">
            {renderStepContent()}
          </Box>
        </DialogContent>

        <DialogActions sx={{ p: 3 }}>
          <Button onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            onClick={handleBack}
            disabled={activeStep === 0 || loading}
          >
            Back
          </Button>
          {activeStep === TRAUMA_FORM_STEPS.length - 1 ? (
            <Button
              onClick={handleSubmit}
              variant="contained"
              disabled={loading}
              startIcon={loading ? <CircularProgress size={20} /> : null}
            >
              {loading ? 'Updating...' : 'Update Case'}
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
    </LocalizationProvider>
  );
};

export default EditTraumaCaseDialog;