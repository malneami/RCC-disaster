/**
 * Create Trauma Case Dialog Component
 * Multi-step form for creating trauma cases
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
  CircularProgress,
  Typography,
} from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import * as yup from 'yup';

// Form step components
import PatientInfoStep from './forms/PatientInfoStep';
import IncidentDetailsStep from './forms/IncidentDetailsStep';
import VitalsAssessmentStep from './forms/VitalsAssessmentStep';
import InjuryAssessmentStep from './forms/InjuryAssessmentStep';
import DispositionStep from './forms/DispositionStep';
import BedAssignmentStep from './forms/BedAssignmentStep';
import ReviewStep from './forms/ReviewStep';

// Types and constants
import { CreateTraumaCaseData, TraumaService } from '../../../services/traumaService';
import { TRAUMA_FORM_STEPS } from '../constants/traumaConstants';
import { Hospital } from '../../../services/hospitalService';
import { bedService } from '../../../pages/Beds/services/bedService';
import { useSnackbar } from 'notistack';
import { BedAssignmentFormData } from '../types/traumaTypes';

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

interface CreateTraumaCaseDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: CreateTraumaCaseData) => Promise<void>;
}

const steps = [...TRAUMA_FORM_STEPS.map(step => step.label), 'Review & Submit'];

const CreateTraumaCaseDialog: React.FC<CreateTraumaCaseDialogProps> = ({
  open,
  onClose,
  onSubmit,
}) => {
  const { enqueueSnackbar } = useSnackbar();
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [validatingBed, setValidatingBed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [timelineWarnings, setTimelineWarnings] = useState<Record<string, string[]>>({});
  const [originHospital, setOriginHospital] = useState<Hospital | null>(null);
  const [formData, setFormData] = useState({
    patientInfo: {
      firstName: '',
      lastName: '',
      nationalId: '',
      age: undefined,
      gender: 'MALE' as const,
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
    bedAssignment: undefined,
  });
  const originRequiresDestination = !!originHospital && !originHospital.hasTraumaService;

  const handleClose = useCallback(() => {
    setActiveStep(0);
    setError(null);
    setLoading(false);
    setValidationErrors({});
    setTimelineWarnings({});
    setOriginHospital(null);
    setFormData({
      patientInfo: {
        firstName: '',
        lastName: '',
        nationalId: '',
        age: undefined,
        gender: 'MALE' as const,
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
        bedAssignment: undefined,
    });
    onClose();
  }, [onClose]);

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

  useEffect(() => {
    if (open) {
      setActiveStep(0);
      setError(null);
      setLoading(false);
      setValidationErrors({});
      setTimelineWarnings({});
      setOriginHospital(null);
    }
  }, [open]);

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

    // Incident time cannot be after arrival time
    if (incidentTime && arrivalTime && incidentTime > arrivalTime) {
      addWarning(
        'incidentDetails.incidentDateTime',
        'Incident time happens after arrival time. Please confirm the order of events.'
      );
    }

    // Transfer request cannot be before arrival
    if (transferRequestTime && arrivalTime && transferRequestTime < arrivalTime) {
      addWarning(
        'incidentDetails.transferRequestDateTime',
        'Transfer request is logged before arrival. Confirm the request time.'
      );
    }

    // Transfer arrival cannot be before transfer request
    if (transferArrivalTime && transferRequestTime && transferArrivalTime < transferRequestTime) {
      addWarning(
        'incidentDetails.transferArrivalDateTime',
        'Transfer arrival is before the request. Please correct these times.'
      );
    }

    // Transfer arrival cannot be before arrival
    if (transferArrivalTime && arrivalTime && transferArrivalTime < arrivalTime) {
      addWarning(
        'incidentDetails.transferArrivalDateTime',
        'Transfer arrival is before initial arrival. Check both timestamps.'
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
  }, [formData.incidentDetails]);

  const hasTimelineWarnings = useMemo(
    () => Object.keys(timelineWarnings).length > 0,
    [timelineWarnings]
  );

  const hasValidationErrors = useMemo(
    () => Object.keys(validationErrors).length > 0,
    [validationErrors]
  );

  // Validate all steps when entering Review step
  useEffect(() => {
    if (activeStep === TRAUMA_FORM_STEPS.length) {
      // We're on the Review step, validate all required steps
      const validateAllSteps = async () => {
        const patientErrors = await validateStep(0);
        const incidentErrors = await validateStep(1);
        const dispositionErrors = await validateStep(4);
        const bedAssignmentErrors = await validateStep(5);
        const allErrors = { ...patientErrors, ...incidentErrors, ...dispositionErrors, ...bedAssignmentErrors };
        
        setValidationErrors(allErrors);
      };

      validateAllSteps();
    }
  }, [activeStep]);

  // Track which steps have issues
  const stepIssues = useMemo(() => {
    const issues = [false, false, false, false, false, false, false];
    
    // Step 0 (Patient) - check validation errors
    if (Object.keys(validationErrors).some(key => key.startsWith('patientInfo.') || key === 'originHospitalId' || key === 'destinationHospitalId')) {
      issues[0] = true;
    }

    // Step 1 (Incident Details) - check validation errors and timeline warnings
    if (Object.keys(validationErrors).some(key => key.startsWith('incidentDetails.')) ||
      Object.keys(timelineWarnings).some(key => key.startsWith('incidentDetails.'))) {
      issues[1] = true;
    }

    // Step 2 (Vitals) - check validation errors
    if (Object.keys(validationErrors).some(key => key.startsWith('vitalsAssessment.'))) {
      issues[2] = true;
    }

    // Step 3 (Injury) - check validation errors
    if (Object.keys(validationErrors).some(key => key.startsWith('injuryAssessment.'))) {
      issues[3] = true;
    }

    // Step 4 (Disposition) - check validation errors
    if (Object.keys(validationErrors).some(key => key.startsWith('disposition.'))) {
      issues[4] = true;
    }
    
    // Step 5 (Bed Assignment) - optional, no validation needed
    
    // Step 6 (Review) - check timeline warnings and validation errors
    if (hasTimelineWarnings || hasValidationErrors) {
      issues[6] = true;
    }

    return issues;
  }, [validationErrors, timelineWarnings, hasTimelineWarnings, hasValidationErrors]);

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

        // Check destination hospital requirement
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
        // Validate incident date is not after arrival date
        if (formData.incidentDetails.incidentDateTime && formData.incidentDetails.arrivalDateTime) {
          const incidentTime = new Date(formData.incidentDetails.incidentDateTime);
          const arrivalTime = new Date(formData.incidentDetails.arrivalDateTime);
          if (incidentTime > arrivalTime) {
            errors['incidentDetails.incidentDateTime'] = 'Incident time cannot be after arrival time. Please confirm the order of events.';
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
      case 5: // Bed Assignment (optional, but validate if bed is selected)
        if (formData.bedAssignment && 'bedId' in formData.bedAssignment && (formData.bedAssignment as BedAssignmentFormData).bedId) {
          try {
            const bedId = (formData.bedAssignment as BedAssignmentFormData).bedId;
            if (bedId) {
              const bed = await bedService.getBedById(bedId);
              if (bed.status !== 'VACANT' && bed.status !== 'RESERVED') {
                errors['bedAssignment.bedId'] = `Bed ${bed.bedNumber} is ${bed.status} and cannot be assigned. Please select a VACANT or RESERVED bed.`;
              }
            }
          } catch (err: any) {
            errors['bedAssignment.bedId'] = err?.response?.data?.message || 'Failed to validate bed. Please select a different bed.';
          }
          if (validationErrors['bedAssignment.bedId']) {
            errors['bedAssignment.bedId'] = validationErrors['bedAssignment.bedId'];
          }
        }
        break;
    }

    return errors;
  };

  const handleNext = async () => {
    if (activeStep === 5) {
      const bedAssignment = formData.bedAssignment as BedAssignmentFormData | undefined;
      if (bedAssignment && (bedAssignment.bedNumber || bedAssignment.location || bedAssignment.bedId)) {
        setValidatingBed(true);
        try {
          const bedErrors = await validateStep(5);
          setValidationErrors(bedErrors);
          
          if (bedErrors['bedAssignment.bedId']) {
            try {
              if (bedAssignment && bedAssignment.unitId) {
                const availableBeds = await bedService.getBeds({ unitId: bedAssignment.unitId });
                const validBeds = availableBeds.filter(
                  (bed) => bed.status === 'VACANT' || bed.status === 'RESERVED'
                );
                
                if (validBeds.length > 0) {
                  const firstVacantBed = validBeds.find((bed) => bed.status === 'VACANT') || validBeds[0];
                  const bed = await bedService.getBedById(firstVacantBed.id);
                  
                  handleStepDataChange({
                    bedAssignment: {
                      ...bedAssignment,
                      bedId: bed.id,
                      bedNumber: bed.bedNumber,
                      assignedBed: {
                        id: bed.id,
                        bedNumber: bed.bedNumber,
                        unitName: bed.unit.name,
                        hospitalName: bed.hospital.name,
                      },
                    },
                  });
                  
                  setValidatingBed(false);
                  setError(null);
                  setActiveStep((activeStep + 1) as any);
                  return;
                }
              }
            } catch (autoAssignErr: any) {
              setValidatingBed(false);
              const errorMessage = autoAssignErr?.response?.data?.message 
                || autoAssignErr?.message 
                || 'Failed to auto-assign a bed. Please try selecting a bed manually or try again.';
              setError(errorMessage);
              return;
            }
            
            setValidatingBed(false);
            if (!bedAssignment.unitId) {
              setError('Please select a unit first before assigning a bed.');
            } else {
              setError('No available beds found in the selected unit. Please select a different unit or skip bed assignment.');
            }
            return;
          }
          
          if (bedAssignment.bedId && !bedAssignment.assignedBed) {
            try {
              const bed = await bedService.getBedById(bedAssignment.bedId);
              if (bed.status === 'VACANT' || bed.status === 'RESERVED') {
                handleStepDataChange({
                  bedAssignment: {
                    ...bedAssignment,
                    assignedBed: {
                      id: bed.id,
                      bedNumber: bed.bedNumber,
                      unitName: bed.unit.name,
                      hospitalName: bed.hospital.name,
                    },
                  },
                });
              } else {
                setValidatingBed(false);
                setError(`The selected bed "${bed.bedNumber}" is ${bed.status} and cannot be assigned. Please select a VACANT or RESERVED bed.`);
                return;
              }
            } catch (err: any) {
              setValidatingBed(false);
              const errorMessage = err?.response?.data?.message 
                || err?.message 
                || 'Failed to fetch bed details. The bed may not exist or there was a network error. Please try selecting a different bed.';
              setError(errorMessage);
              return;
            }
          }
          
          setValidatingBed(false);
          setActiveStep((activeStep + 1) as any);
          setError(null);
          return;
        } catch (err: any) {
          setValidatingBed(false);
          const errorMessage = err?.response?.data?.message 
            || err?.message 
            || 'Failed to validate bed assignment. Please check your selection and try again.';
          setError(errorMessage);
          return;
        }
      }
    }
    
    const errors = await validateStep(activeStep);
    setValidationErrors(errors);
    
    // If on last step before review, validate all required steps first
    if (activeStep === TRAUMA_FORM_STEPS.length - 1) {
      // Validate all required steps before going to review
      const patientErrors = await validateStep(0);
      const incidentErrors = await validateStep(1);
      const dispositionErrors = await validateStep(4);
      const bedAssignmentErrors = await validateStep(5);
      const allErrors = { ...patientErrors, ...incidentErrors, ...dispositionErrors, ...bedAssignmentErrors };
      
      setValidationErrors(allErrors);
      
      // If there are validation errors, navigate to first step with error
      if (Object.keys(allErrors).length > 0) {
        const firstErrorKey = Object.keys(allErrors)[0];
        let targetStep: number = TRAUMA_FORM_STEPS.length; // Default to review step
        if (firstErrorKey.startsWith('patientInfo.')) {
          targetStep = 0;
        } else if (firstErrorKey.startsWith('incidentDetails.')) {
          targetStep = 1;
        } else if (firstErrorKey.startsWith('disposition.')) {
          targetStep = 4;
        } else if (firstErrorKey.startsWith('bedAssignment.')) {
          targetStep = 5;
        }
        setActiveStep(targetStep as any);
        setError('Please correct the highlighted information before proceeding.');
        return;
      }
    
      // If there are timeline warnings, go to review step
      if (hasTimelineWarnings) {
        setActiveStep(TRAUMA_FORM_STEPS.length as any); // Go to review step
        const firstWarning = timelineWarnings[Object.keys(timelineWarnings)[0]]?.[0];
        setError(firstWarning || 'Please review the timeline warnings before submitting.');
        return;
      }

      // No errors or warnings, proceed to review
      setActiveStep(TRAUMA_FORM_STEPS.length as any);
      setError(null);
      return;
    }

    // Only proceed if there are no validation errors
    if (Object.keys(errors).length === 0 && activeStep < TRAUMA_FORM_STEPS.length) {
      setActiveStep(prev => prev + 1);
      setError(null); // Clear error when moving forward successfully
    } else if (Object.keys(errors).length > 0) {
      // Find first step with error
      const firstErrorKey = Object.keys(errors)[0];
      let targetStep: number = activeStep;
      if (firstErrorKey.startsWith('patientInfo.')) {
        targetStep = 0;
      } else if (firstErrorKey.startsWith('incidentDetails.')) {
        targetStep = 1;
      } else if (firstErrorKey.startsWith('disposition.')) {
        targetStep = 4;
      }
      setActiveStep(targetStep as any);
      setError('Please correct the highlighted information before proceeding.');
    }
  };

  const handleBack = () => {
    setActiveStep(prev => prev - 1);
  };

  const handleSubmit = async () => {
    // Re-validate all required steps
    const patientErrors = await validateStep(0);
    const incidentErrors = await validateStep(1);
    const dispositionErrors = await validateStep(4);
    const bedAssignmentErrors = await validateStep(5);
    const combinedErrors = { ...patientErrors, ...incidentErrors, ...dispositionErrors, ...bedAssignmentErrors };
    
    if (bedAssignmentErrors['bedAssignment.bedId']) {
      setValidationErrors(combinedErrors);
      setError('Please go back to the Bed Assignment step and select a valid VACANT or RESERVED bed, or let the system auto-assign one.');
      // Navigate to bed assignment step
      setActiveStep(5);
      return;
    }

    // Update validation errors state
    setValidationErrors(combinedErrors);

    // If there are validation errors, navigate to the first step with errors and show message
    if (Object.keys(combinedErrors).length > 0) {
      // Determine which step has the first error
      const firstErrorKey = Object.keys(combinedErrors)[0];
      let targetStep: number = TRAUMA_FORM_STEPS.length; // Default to review step

      if (firstErrorKey.startsWith('patientInfo.')) {
        targetStep = 0;
      } else if (firstErrorKey.startsWith('incidentDetails.')) {
        targetStep = 1;
      } else if (firstErrorKey.startsWith('disposition.')) {
        targetStep = 4;
      }

      setActiveStep(targetStep as any);
      setError('Please correct the highlighted information before submitting.');
      return;
    }

    // If there are timeline warnings, stay on review step and show message
    if (hasTimelineWarnings) {
      setActiveStep(TRAUMA_FORM_STEPS.length as any);
      const firstWarning = timelineWarnings[Object.keys(timelineWarnings)[0]]?.[0];
      setError(firstWarning || 'Please review the timeline warnings before submitting.');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Prepare data for submission
      console.log('=== FORM DATA BEFORE SUBMISSION ===');
      console.log('Patient Info:', JSON.stringify(formData.patientInfo, null, 2));
      console.log('Age:', formData.patientInfo.age);
      console.log('Address:', formData.patientInfo.address);
      console.log('Emergency Contact:', formData.patientInfo.emergencyContact);
      console.log('Emergency Phone:', formData.patientInfo.emergencyPhone);
      console.log('Medical History:', formData.patientInfo.medicalHistory);
      console.log('Allergies:', formData.patientInfo.allergies);
      console.log('Medications:', formData.patientInfo.medications);

      const submitData: CreateTraumaCaseData = {
        patientInfo: formData.patientInfo,
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

      const createdCase = await TraumaService.createTraumaCase(submitData);
      
      const bedAssignment = formData.bedAssignment as BedAssignmentFormData | undefined;
      if (bedAssignment && 'bedId' in bedAssignment && bedAssignment.bedId && createdCase?.id && createdCase?.patientId) {
        try {
          await bedService.assignBed(bedAssignment.bedId as string, {
            patientId: createdCase.patientId,
            caseId: createdCase.id,
            caseType: 'TRAUMA',
            arrivalDate: 'arrivalDate' in bedAssignment ? bedAssignment.arrivalDate : undefined,
          });
          enqueueSnackbar('Trauma case created and bed assigned successfully', { variant: 'success' });
        } catch (bedError: any) {
          console.error('Error assigning bed:', bedError);
          enqueueSnackbar(
            'Case created but bed assignment failed: ' + (bedError?.response?.data?.message || bedError?.message || 'Unknown error'),
            { variant: 'warning' }
          );
        }
      }
      
      await onSubmit(submitData);
      handleClose();
    } catch (err: any) {
      console.error('Error creating trauma case:', err);

      // Extract meaningful error message
      let errorMessage = 'Failed to create trauma case';

      if (err?.response?.data) {
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

  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return (
          <PatientInfoStep
            data={formData.patientInfo}
            onChange={(data) => handleStepDataChange({ patientInfo: { ...formData.patientInfo, ...data } })}
            errors={{}}
            validationErrors={validationErrors}
            onOriginHospitalSelect={handleOriginHospitalSelect}
            destinationRequired={originRequiresDestination}
          />
        );
      case 1:
        return (
          <IncidentDetailsStep
            data={formData.incidentDetails}
            onChange={(data) => handleStepDataChange({ incidentDetails: { ...formData.incidentDetails, ...data } })}
            errors={{}}
            validationErrors={validationErrors}
            timelineWarnings={timelineWarnings}
          />
        );
      case 2:
        return (
          <VitalsAssessmentStep
            data={formData.vitalsAssessment}
            onChange={(data) => handleStepDataChange({ vitalsAssessment: { ...formData.vitalsAssessment, ...data } })}
            errors={{}}
          />
        );
      case 3:
        return (
          <InjuryAssessmentStep
            data={formData.injuryAssessment}
            onChange={(data) => handleStepDataChange({ injuryAssessment: { ...formData.injuryAssessment, ...data } })}
            errors={{}}
          />
        );
      case 4:
        return (
          <DispositionStep
            data={formData.disposition}
            onChange={(data) => handleStepDataChange({ disposition: { ...formData.disposition, ...data } })}
            errors={{}}
            validationErrors={validationErrors}
          />
        );
      case 5:
        return (
          <BedAssignmentStep
            data={formData.bedAssignment || {}}
            onChange={(data) => handleStepDataChange({ bedAssignment: { ...(formData.bedAssignment || {}), ...data } })}
            errors={{}}
            validationErrors={validationErrors}
            patientInfo={formData.patientInfo}
            onValidationError={(error) => {
              if (error) {
                setValidationErrors((prev) => ({
                  ...prev,
                  'bedAssignment.bedId': error,
                }));
              } else {
                setValidationErrors((prev) => {
                  const newErrors = { ...prev };
                  delete newErrors['bedAssignment.bedId'];
                  return newErrors;
                });
              }
            }}
          />
        );
      case 6:
        return (
          <ReviewStep
            formData={formData}
            timelineWarnings={timelineWarnings}
            validationErrors={validationErrors}
          />
        );
      default:
        return null;
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle>
          <Typography variant="h6" component="div">
            Create Trauma Case
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Complete all steps to create a new trauma case
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

          <Box minHeight="400px">
            {renderStepContent()}
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
              disabled={loading || hasTimelineWarnings || hasValidationErrors}
              startIcon={loading ? <CircularProgress size={20} /> : null}
            >
              {loading ? 'Creating...' : 'Create Case'}
            </Button>
          ) : (
            <Button
              onClick={handleNext}
              variant="contained"
              disabled={loading || validatingBed}
              startIcon={validatingBed ? <CircularProgress size={20} /> : null}
            >
              {validatingBed ? 'Validating Bed...' : 'Next'}
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </LocalizationProvider>
  );
};

export default CreateTraumaCaseDialog;