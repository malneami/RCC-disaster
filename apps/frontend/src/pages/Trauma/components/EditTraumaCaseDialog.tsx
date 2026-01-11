import React, { useState, useEffect, useCallback } from 'react';
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
import BedAssignmentStep from './forms/BedAssignmentStep';
import ReviewStep from './forms/ReviewStep';

// Types and constants
import { TraumaCase, UpdateTraumaCaseData } from '../../../services/traumaService';
import { TRAUMA_FORM_STEPS } from '../constants/traumaConstants';
import { validateTraumaCaseForm } from '../helpers/traumaHelpers';
import { useAuth } from '../../../contexts/AuthContext';
import { Hospital, hospitalService } from '../../../services/hospitalService';
import { calculateAge } from '../../../utils/ageCalculator';

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
    .when('nationalIdNotAvailable', {
      is: true,
      then: (schema) => schema.notRequired(),
      otherwise: (schema) => schema
        .matches(ALPHANUMERIC_REGEX, 'National ID can only contain letters and numbers.')
        .required('National ID is required'),
    }),
  nationalIdNotAvailable: yup.boolean(),
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
  const [kpiViolations, setKpiViolations] = useState<Record<string, string[]>>({});
  const [originHospital, setOriginHospital] = useState<Hospital | null>(null);
  const [formData, setFormData] = useState({
    patientInfo: {
      firstName: '',
      lastName: '',
      nationalId: '',
      nationalIdNotAvailable: false,
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
      edStabilizationDateTime: '',
      hemorrhageControlDateTime: '',
      isMtpActivated: false,
      mtpActivationDateTime: '',
      firstBloodUnitTransfusionDateTime: '',
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
    bedAssignment: {
      assignedBed: null,
      bedId: '',
      bedNumber: '',
      unitName: '',
      hospitalName: '',
      arrivalDate: '',
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
      const dateOfBirth = traumaCase.patient?.dateOfBirth
        ? (typeof traumaCase.patient.dateOfBirth === 'string'
          ? traumaCase.patient.dateOfBirth
          : new Date(traumaCase.patient.dateOfBirth).toISOString().split('T')[0])
        : undefined;

      // Calculate age from dateOfBirth if age is not present
      let age = traumaCase.patient?.age;
      // If age is missing or null, try to calculate from DoB
      if ((age === undefined || age === null) && dateOfBirth) {
        try {
          age = calculateAge(dateOfBirth).years;
        } catch (error) {
          console.error('Error calculating age from dateOfBirth:', error);
        }
      }

      setFormData({
        patientInfo: {
          firstName: traumaCase.patient?.firstName || '',
          lastName: traumaCase.patient?.lastName || '',
          nationalId: traumaCase.patient?.nationalId || '',
          nationalIdNotAvailable: (traumaCase.patient as any)?.nationalIdNotAvailable || false,
          dateOfBirth,
          age,
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
          // New KPI Fields - Initialization
          edStabilizationDateTime: (traumaCase as any).edStabilizationDateTime ? new Date((traumaCase as any).edStabilizationDateTime).toISOString().slice(0, 16) : '',
          hemorrhageControlDateTime: (traumaCase as any).hemorrhageControlDateTime ? new Date((traumaCase as any).hemorrhageControlDateTime).toISOString().slice(0, 16) : '',
          isMtpActivated: (traumaCase as any).isMtpActivated || false,
          mtpActivationDateTime: (traumaCase as any).mtpActivationDateTime ? new Date((traumaCase as any).mtpActivationDateTime).toISOString().slice(0, 16) : '',
          firstBloodUnitTransfusionDateTime: (traumaCase as any).firstBloodUnitTransfusionDateTime ? new Date((traumaCase as any).firstBloodUnitTransfusionDateTime).toISOString().slice(0, 16) : '',
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
        bedAssignment: {
          assignedBed: (traumaCase as any).bedAssignment?.assignedBed || undefined,
          bedId: (traumaCase as any).bedAssignment?.bedId || '',
          bedNumber: (traumaCase as any).bedAssignment?.bedNumber || '',
          unitName: (traumaCase as any).bedAssignment?.unitName || '',
          hospitalName: (traumaCase as any).bedAssignment?.hospitalName || '',
          arrivalDate: (traumaCase as any).bedAssignment?.arrivalDate || '',
        },
      });
    }
  }, [traumaCase, open]);

  // Step Validation & Severity Logic
  const getStepSeverity = (stepIndex: number): 'error' | 'warning' | null => {

    // Map steps to field prefixes
    const stepPrefixes: Record<number, string[]> = {
      0: ['patientInfo'],
      1: ['incidentDetails'],
      2: ['vitalsAssessment'],
      3: ['injuryAssessment'],
      4: ['disposition'],
      5: ['bedAssignment']
    };

    const prefixes = stepPrefixes[stepIndex] || [];

    // 1. Check validation errors (Red/Blocking)
    const hasValidationError = prefixes.some(prefix =>
      Object.keys(validationErrors).some(key => key.startsWith(prefix))
    );

    // 2. Check timeline warnings (Red/Blocking for Trauma too?)
    // In Stroke we treated timeline as blocking. Doing the same here for consistency.
    const hasTimelineWarning = Object.keys(timelineWarnings).some(key =>
      prefixes.some(prefix => key.startsWith(prefix))
    );

    if (hasValidationError || hasTimelineWarning) {
      return 'error';
    }

    // 3. Check KPI Violations (Yellow/Warning)
    const hasKpiViolation = Object.keys(kpiViolations).some(key =>
      prefixes.some(prefix => key.startsWith(prefix))
    );

    if (hasKpiViolation) {
      return 'warning';
    }

    return null;
  };

  // Timeline validation
  useEffect(() => {
    const warnings: Record<string, string[]> = {};
    const violations: Record<string, string[]> = {};

    const addWarning = (field: string, message: string) => {
      warnings[field] = [...(warnings[field] || []), message];
    };

    const addViolation = (field: string, message: string) => {
      violations[field] = [...(violations[field] || []), message];
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

    // New KPI timestamps for validation
    const edStabilizationTime = parseDate(formData.incidentDetails.edStabilizationDateTime);
    const hemorrhageControlTime = parseDate(formData.incidentDetails.hemorrhageControlDateTime);
    const mtpActivationTime = parseDate(formData.incidentDetails.mtpActivationDateTime);
    const firstTransfusionTime = parseDate(formData.incidentDetails.firstBloodUnitTransfusionDateTime);

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

    // Validate Logical Order of Clinical Events
    if (edStabilizationTime && arrivalTime && edStabilizationTime < arrivalTime) {
      addWarning('incidentDetails.edStabilizationDateTime', 'ED Stabilization cannot be before Arrival Time.');
    }

    if (hemorrhageControlTime && edStabilizationTime && hemorrhageControlTime < edStabilizationTime) {
      addWarning('incidentDetails.hemorrhageControlDateTime', 'Hemorrhage control cannot be before stabilization.');
    }

    if (mtpActivationTime && arrivalTime && mtpActivationTime < arrivalTime) {
      addWarning('incidentDetails.mtpActivationDateTime', 'MTP Activation cannot be before Arrival Time.');
    }

    if (firstTransfusionTime && mtpActivationTime && firstTransfusionTime < mtpActivationTime) {
      addWarning('incidentDetails.firstBloodUnitTransfusionDateTime', 'Transfusion cannot happen before MTP Activation.');
    }

    // KPI VIOLATIONS (Yellow)
    // KPI 1: Response Time (Incident to Arrival) > 60 mins (approx 1 hour golden window concept for trauma)
    if (incidentTime && arrivalTime) {
      const diffMinutes = (arrivalTime.getTime() - incidentTime.getTime()) / (1000 * 60);
      if (diffMinutes > 60) {
        addViolation(
          'incidentDetails.arrivalDateTime',
          `Time from Incident to Arrival is ${Math.round(diffMinutes)} mins (Target: < 60 mins).`
        );
      }
    }

    // KPI: Time to Hemorrhage Control (Target <= 60 mins from stabilization)
    if (hemorrhageControlTime && edStabilizationTime) {
      const diffMinutes = (hemorrhageControlTime.getTime() - edStabilizationTime.getTime()) / (1000 * 60);
      if (diffMinutes > 60) {
        addViolation(
          'incidentDetails.hemorrhageControlDateTime',
          `Time to Hemorrhage Control is ${Math.round(diffMinutes)} mins (Target: ≤ 60 mins).`
        );
      }
    }

    // KPI: Time to First Blood Unit (Target <= 15 mins from MTP activation)
    if (firstTransfusionTime && mtpActivationTime) {
      const diffMinutes = (firstTransfusionTime.getTime() - mtpActivationTime.getTime()) / (1000 * 60);
      if (diffMinutes > 15) {
        addViolation(
          'incidentDetails.firstBloodUnitTransfusionDateTime',
          `Time to First Blood Unit is ${Math.round(diffMinutes)} mins (Target: ≤ 15 mins).`
        );
      }
    }

    // KPI 2: Illogical Vitals (Yellow)
    // KPI 2: Illogical Vitals (Yellow Warnings as requested)
    const { vitalSigns, systolicBloodPressure, respiratoryRate } = formData.vitalsAssessment || {};

    // Temperature (Celsius) - Warning if < 30 or > 45
    if (vitalSigns?.temperature) {
      const temp = Number(vitalSigns.temperature);
      if (!isNaN(temp) && (temp < 30 || temp > 45)) {
        addViolation('vitalsAssessment.vitalSigns.temperature', `Temperature ${temp}°C is outside logical range (30-45°C).`);
      }
    }

    // Heart Rate - Warning if < 30 or > 250
    if (vitalSigns?.heartRate) {
      const hr = Number(vitalSigns.heartRate);
      if (!isNaN(hr) && (hr < 30 || hr > 250)) {
        addViolation('vitalsAssessment.vitalSigns.heartRate', `Heart Rate ${hr} bpm is outside logical range (30-250 bpm).`);
      }
    }

    // Respiratory Rate - Warning if < 8 or > 60
    if (respiratoryRate) {
      const rr = Number(respiratoryRate);
      if (!isNaN(rr) && (rr < 8 || rr > 60)) {
        addViolation('vitalsAssessment.respiratoryRate', `Respiratory Rate ${rr} is outside logical range (8-60).`);
      }
    }

    // Systolic BP - Warning if < 50 or > 300
    if (systolicBloodPressure) {
      const sbp = Number(systolicBloodPressure);
      if (!isNaN(sbp) && (sbp < 50 || sbp > 300)) {
        addViolation('vitalsAssessment.systolicBloodPressure', `Systolic BP ${sbp} is outside logical range (50-300).`);
      }
    }

    // Oxygen Saturation - Warning if < 50 or > 100
    if (vitalSigns?.oxygenSaturation) {
      const o2 = Number(vitalSigns.oxygenSaturation);
      if (!isNaN(o2) && (o2 < 50 || o2 > 100)) {
        addViolation('vitalsAssessment.vitalSigns.oxygenSaturation', `O2 Saturation ${o2}% is outside logical range (50-100%).`);
      }
    }

    setTimelineWarnings((prev) => {
      if (JSON.stringify(prev) === JSON.stringify(warnings)) return prev;
      return warnings;
    });

    setKpiViolations((prev) => {
      if (JSON.stringify(prev) === JSON.stringify(violations)) return prev;
      return violations;
    });
  }, [formData.incidentDetails, formData.vitalsAssessment]);

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

      // Check for timeline warnings (BLOCKING - Red Errors)
      if (Object.keys(timelineWarnings).length > 0) {
        setError('Please resolve all timeline errors (red) before submitting.');
        setLoading(false);
        // All timeline errors are currently in Step 1 (Incident Details)
        setActiveStep(1);
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
        // New KPI Fields - Submission
        edStabilizationDateTime: formData.incidentDetails.edStabilizationDateTime || undefined,
        hemorrhageControlDateTime: formData.incidentDetails.hemorrhageControlDateTime || undefined,
        isMtpActivated: formData.incidentDetails.isMtpActivated,
        mtpActivationDateTime: formData.incidentDetails.mtpActivationDateTime || undefined,
        firstBloodUnitTransfusionDateTime: formData.incidentDetails.firstBloodUnitTransfusionDateTime || undefined,

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

      // Add patient info (exclude hospital IDs as they're already at top level)
      const { originHospitalId, destinationHospitalId, ...patientInfoOnly } = formData.patientInfo;
      submitData.patientInfo = patientInfoOnly;

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
        let patientDataToValidate = { ...formData.patientInfo };

        // Self-healing: Update age if missing but Date of Birth exists
        // This handles cases where age wasn't explicitly saved in DB or cleared
        if ((patientDataToValidate.age === undefined || patientDataToValidate.age === null) && patientDataToValidate.dateOfBirth) {
          try {
            const calculatedAge = calculateAge(patientDataToValidate.dateOfBirth).years;
            patientDataToValidate.age = calculatedAge;

            // Also update the form state so the user sees it and submission uses it
            // We use a functional update to ensure we don't overwrite other concurrent changes
            setFormData(prev => ({
              ...prev,
              patientInfo: {
                ...prev.patientInfo,
                age: calculatedAge
              }
            }));
          } catch (e) {
            console.error("Error auto-calculating age during validation", e);
          }
        }

        try {
          await patientInfoSchema.validate(patientDataToValidate, { abortEarly: false });
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
      case 5:
        return (
          <BedAssignmentStep
            data={{
              ...formData.bedAssignment,
              assignedBed: formData.bedAssignment.assignedBed || undefined
            }}
            onChange={(data) => handleStepDataChange({ bedAssignment: { ...formData.bedAssignment, ...data } })}
            errors={stepErrors}
            validationErrors={validationErrors}
          />
        );
      case 6:
        return (
          <ReviewStep
            formData={formData}
            timelineWarnings={timelineWarnings}
            validationErrors={validationErrors}
            kpiViolations={kpiViolations}
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

          <Stepper activeStep={activeStep} nonLinear sx={{ mb: 4 }}>
            {TRAUMA_FORM_STEPS.map((step, index) => {
              const severity = getStepSeverity(index);
              const labelProps: { error?: boolean } = {};

              if (severity === 'error') {
                labelProps.error = true;
              }

              const isCompleted = activeStep > index;

              return (
                <Step key={step.id} completed={isCompleted}>
                  <StepButton
                    onClick={() => {
                      setActiveStep(index);
                      setError(null);
                    }}
                    {...labelProps}
                    sx={{
                      '& .MuiStepLabel-label': {
                        color: severity === 'warning' ? 'warning.main' : undefined,
                      },
                      '& .MuiStepIcon-root': {
                        color: severity === 'warning' ? 'warning.main' : undefined,
                      },
                      '& .MuiStepIcon-text': {
                        fill: severity === 'warning' ? '#fff' : undefined,
                      }
                    }}
                  >
                    {step.label}
                  </StepButton>
                </Step>
              );
            })}
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