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

// Form step components
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

// Types and services
import {
  StemiCase,
  UpdateStemiCaseData,
  PatientInfo,
  CriticalTimestamps,
  InterventionsAndTreatments,
  ClinicalAssessment,
} from '../services/stemiService';
import { StemiDatetimeService } from '../services/stemiDatetimeService';
import { useAuth } from '../../../contexts/AuthContext';
import { Hospital, hospitalService } from '../../../services/hospitalService';
import { calculateAge } from '../../../utils/ageCalculator';

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

interface EditStemiCaseDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (id: string, data: any) => Promise<void>;
  stemiCase: StemiCase | null;
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

const EditStemiCaseDialog: React.FC<EditStemiCaseDialogProps> = ({
  open,
  onClose,
  onSubmit,
  stemiCase,
}) => {
  const { user } = useAuth();
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [timelineWarnings, setTimelineWarnings] = useState<Record<string, string[]>>({});
  const [originHospital, setOriginHospital] = useState<Hospital | null>(null);

  // Form data state (same structure as creation form)
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
    admissionTime: '',
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

  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';
  const originRequiresDestination = !!originHospital && !originHospital.hasStemiService;

  // Fetch origin hospital when it changes
  useEffect(() => {
    const fetchOriginHospital = async () => {
      if (patientInfo.originHospitalId) {
        try {
          const hospital = await hospitalService.getHospitalById(patientInfo.originHospitalId);
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
  }, [patientInfo.originHospitalId]);

  const handleOriginHospitalSelect = useCallback((hospital: Hospital | null) => {
    setOriginHospital(hospital);
    // Clear destination validation error if origin hospital provides STEMI service
    if (hospital?.hasStemiService) {
      setValidationErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors['patientInfo.destinationHospitalId'];
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
  }, [
    admissionDetails,
    criticalTimestamps,
    interventionsAndTreatments,
    clinicalAssessment,
  ]);

  // Helper function to reset form to initial state
  const resetForm = () => {
    setPatientInfo({
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

    setAdmissionDetails({
      admissionTime: '',
      modeOfArrival: 'AMBULANCE_RED_CRESCENT',
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
      currentStatus: 'SUSPECTED' as string,
      selectedTreatment: undefined as any,
      ecgResult: undefined as any,
      ecgFindings: '',
      isTroponinPositive: false,
      troponinValue: undefined,
      additionalNotes: '',
    });

    setBedAssignment(undefined);
    setActiveStep(0);
    setError(null);
    setSuccess(null);
    setValidationErrors({});
    setTimelineWarnings({});
    setOriginHospital(null);
    setLoading(false);
  };

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      resetForm();
    }
  }, [open]);

  // Load case data when dialog opens or case changes
  useEffect(() => {
    if (stemiCase && open) {
      setActiveStep(0);
      setError(null);
      setSuccess(null);
      setValidationErrors({});
      setTimelineWarnings({});
      setOriginHospital(null);
      setLoading(false);

      // Convert STEMI case data to form structure (exactly like creation form)
      const dateOfBirth = stemiCase.patient?.dateOfBirth 
        ? (typeof stemiCase.patient.dateOfBirth === 'string' 
            ? stemiCase.patient.dateOfBirth 
            : new Date(stemiCase.patient.dateOfBirth).toISOString().split('T')[0])
        : undefined;
      
      // Calculate age from dateOfBirth if age is not present
      let age = stemiCase.patient?.age;
      if (!age && dateOfBirth) {
        try {
          age = calculateAge(dateOfBirth).years;
        } catch (error) {
          console.error('Error calculating age from dateOfBirth:', error);
        }
      }

      setPatientInfo({
        firstName: stemiCase.patient?.firstName || '',
        lastName: stemiCase.patient?.lastName || '',
        nationalId: stemiCase.patient?.nationalId || '',
        dateOfBirth,
        age,
        gender: (stemiCase.patient?.gender as 'MALE' | 'FEMALE') || 'MALE',
        phoneNumber: stemiCase.patient?.phoneNumber || '',
        address: (stemiCase.patient as any)?.address || '',
        emergencyContact: (stemiCase.patient as any)?.emergencyContact || '',
        emergencyPhone: (stemiCase.patient as any)?.emergencyPhone || '',
        medicalHistory: (stemiCase.patient as any)?.medicalHistory || '',
        allergies: (stemiCase.patient as any)?.allergies || '',
        medications: (stemiCase.patient as any)?.medications || '',
        originHospitalId: stemiCase.originHospitalId || '',
        destinationHospitalId: stemiCase.destinationHospitalId || '',
        caseType: stemiCase.caseType as 'DIRECT' | 'TRANSFER' || 'DIRECT',
      });

      setAdmissionDetails({
        admissionTime: stemiCase.pathwayStarted ? StemiDatetimeService.formatForLocal(stemiCase.pathwayStarted) : '',
        modeOfArrival: stemiCase.modeOfArrival || '' as any,
        transferRequestDateTime: stemiCase.transferRequestDateTime ? StemiDatetimeService.formatForLocal(stemiCase.transferRequestDateTime) : undefined,
        transferArrivalDateTime: stemiCase.transferArrivalDateTime ? StemiDatetimeService.formatForLocal(stemiCase.transferArrivalDateTime) : undefined,
      });

      setCriticalTimestamps({
        triageTime: stemiCase.triageTime ? StemiDatetimeService.formatForLocal(stemiCase.triageTime) : '',
        firstEcgTime: stemiCase.firstEcgTime ? StemiDatetimeService.formatForLocal(stemiCase.firstEcgTime) : '',
      });

      setInterventionsAndTreatments({
        eligibleForPrimaryPci: stemiCase.eligibleForPrimaryPci || false,
        pciLocation: stemiCase.pciLocation || '',
        doorOutTime: stemiCase.doorOutTime ? StemiDatetimeService.formatForLocal(stemiCase.doorOutTime) : '',
        balloonInflationTime: stemiCase.balloonInflationTime ? StemiDatetimeService.formatForLocal(stemiCase.balloonInflationTime) : '',
        thrombolyticGiven: stemiCase.thrombolyticGiven || false,
        thrombolyticAdminTime: stemiCase.thrombolyticAdminTime ? StemiDatetimeService.formatForLocal(stemiCase.thrombolyticAdminTime) : '',
        pciType: stemiCase.pciType || undefined,
        fibrinolyticAbsoluteContraindications: stemiCase.fibrinolyticAbsoluteContraindications || undefined,
        fibrinolyticRelativeContraindications: stemiCase.fibrinolyticRelativeContraindications || undefined,
      });

      setClinicalAssessment({
        heartScore: stemiCase.heartScore || undefined,
        clinicalRiskLevel: stemiCase.clinicalRiskLevel || '',
        presentingSymptoms: stemiCase.presentingSymptoms || '',
        symptomOnset: stemiCase.symptomOnset ? StemiDatetimeService.formatForLocal(stemiCase.symptomOnset) : '',
        symptomDuration: stemiCase.symptomDuration || undefined,
        miType: stemiCase.miType || undefined,
        outcome: stemiCase.outcome || undefined,
      });

      setAdditionalData({
        currentStatus: stemiCase.currentStatus as any || 'SUSPECTED',
        selectedTreatment: stemiCase.selectedTreatment || undefined,
        ecgResult: stemiCase.ecgResult || undefined,
        ecgFindings: stemiCase.ecgFindings || '',
        isTroponinPositive: (stemiCase as any).isTroponinPositive || false,
        troponinValue: (stemiCase as any).troponinValue || undefined,
        additionalNotes: (stemiCase as any).additionalNotes || '',
      });

      // Initialize bed assignment from case
      if (stemiCase.assignedBed) {
        // Determine hospital type by comparing with origin/destination hospitals
        const bedHospitalId = stemiCase.assignedBed.hospital?.id;
        let hospitalType: 'origin' | 'destination' | undefined = undefined;
        if (bedHospitalId === stemiCase.originHospitalId) {
          hospitalType = 'origin';
        } else if (bedHospitalId === stemiCase.destinationHospitalId) {
          hospitalType = 'destination';
        }
        
        setBedAssignment({
          bedId: stemiCase.assignedBed.id,
          bedNumber: stemiCase.assignedBed.bedNumber,
          unitId: stemiCase.assignedBed.unit?.id,
          hospitalId: bedHospitalId,
          hospitalType: hospitalType,
          assignedBed: {
            id: stemiCase.assignedBed.id,
            bedNumber: stemiCase.assignedBed.bedNumber,
            unitName: stemiCase.assignedBed.unit?.name || '',
            hospitalName: stemiCase.assignedBed.hospital?.name || '',
          },
        } as BedAssignmentFormData);
      } else {
        setBedAssignment(undefined);
      }
    }
  }, [stemiCase?.id, open]);

  // Wrapper functions to clear validation errors on field changes
  const handlePatientInfoChange = useCallback((data: PatientInfo) => {
    setPatientInfo(data);
    // Clear validation errors for patientInfo fields
    setValidationErrors((prev) => {
      const newErrors = { ...prev };
      Object.keys(newErrors).forEach(key => {
        if (key.startsWith('patientInfo.')) {
          delete newErrors[key];
        }
      });
      return newErrors;
    });
  }, []);

  const handleAdmissionDetailsChange = useCallback((data: typeof admissionDetails) => {
    setAdmissionDetails(data);
    // Clear validation errors for admissionDetails fields
    setValidationErrors((prev) => {
      const newErrors = { ...prev };
      Object.keys(newErrors).forEach(key => {
        if (key.startsWith('admissionDetails.')) {
          delete newErrors[key];
        }
      });
      return newErrors;
    });
  }, []);

  const handleNext = async () => {
    const errors = await validateStep(activeStep);
    setValidationErrors(errors);

    // Only proceed if there are no validation errors
    if (Object.keys(errors).length === 0 && activeStep < steps.length - 1) {
      setActiveStep((prevActiveStep) => prevActiveStep + 1);
      setError(null); // Clear error when moving forward successfully
    } else if (Object.keys(errors).length > 0) {
      setError('Please correct the highlighted information before proceeding.');
    }
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
    setError(null);
  };

  const handleSubmit = async () => {
    if (!stemiCase) return;

    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      // Validate all required steps before submission
      const patientErrors = await validateStep(0);
      const admissionErrors = await validateStep(1);
      const combinedErrors = { ...patientErrors, ...admissionErrors };

      if (Object.keys(combinedErrors).length > 0) {
        setValidationErrors(combinedErrors);
        // Navigate to first step with error
        const firstErrorKey = Object.keys(combinedErrors)[0];
        let targetStep: number = 0;
        if (firstErrorKey.startsWith('patientInfo.')) {
          targetStep = 0;
        } else if (firstErrorKey.startsWith('admissionDetails.')) {
          targetStep = 1;
        }
        setActiveStep(targetStep);
        setError('Please correct the highlighted information before submitting.');
        setLoading(false);
        return;
      }

      // Prepare data for submission (matching UpdateStemiCaseData interface)
      const submitData: UpdateStemiCaseData = {
        caseType: patientInfo.caseType,
        admissionTime: StemiDatetimeService.formatForUTC(admissionDetails.admissionTime),
        modeOfArrival: admissionDetails.modeOfArrival,
        transferRequestDateTime: admissionDetails.transferRequestDateTime ? StemiDatetimeService.formatForUTC(admissionDetails.transferRequestDateTime) : undefined,
        transferArrivalDateTime: admissionDetails.transferArrivalDateTime ? StemiDatetimeService.formatForUTC(admissionDetails.transferArrivalDateTime) : undefined,
        criticalTimestamps: {
          triageTime: criticalTimestamps.triageTime ? StemiDatetimeService.formatForUTC(criticalTimestamps.triageTime) : undefined,
          firstEcgTime: criticalTimestamps.firstEcgTime ? StemiDatetimeService.formatForUTC(criticalTimestamps.firstEcgTime) : undefined,
        },
        interventionsAndTreatments: {
          eligibleForPrimaryPci: interventionsAndTreatments.eligibleForPrimaryPci,
          pciLocation: interventionsAndTreatments.pciLocation || undefined,
          doorOutTime: interventionsAndTreatments.doorOutTime ? StemiDatetimeService.formatForUTC(interventionsAndTreatments.doorOutTime) : undefined,
          balloonInflationTime: interventionsAndTreatments.balloonInflationTime ? StemiDatetimeService.formatForUTC(interventionsAndTreatments.balloonInflationTime) : undefined,
          thrombolyticGiven: interventionsAndTreatments.thrombolyticGiven,
          thrombolyticAdminTime: interventionsAndTreatments.thrombolyticAdminTime ? StemiDatetimeService.formatForUTC(interventionsAndTreatments.thrombolyticAdminTime) : undefined,
          pciType: interventionsAndTreatments.pciType || undefined,
          fibrinolyticAbsoluteContraindications: interventionsAndTreatments.fibrinolyticAbsoluteContraindications || undefined,
          fibrinolyticRelativeContraindications: interventionsAndTreatments.fibrinolyticRelativeContraindications || undefined,
        },
        clinicalAssessment: {
          heartScore: clinicalAssessment.heartScore || undefined,
          clinicalRiskLevel: clinicalAssessment.clinicalRiskLevel || undefined,
          presentingSymptoms: clinicalAssessment.presentingSymptoms || undefined,
          symptomOnset: clinicalAssessment.symptomOnset ? StemiDatetimeService.formatForUTC(clinicalAssessment.symptomOnset) : undefined,
          symptomDuration: clinicalAssessment.symptomDuration || undefined,
          miType: clinicalAssessment.miType || undefined,
          outcome: clinicalAssessment.outcome || undefined,
        },
        currentStatus: additionalData.currentStatus as any,
        selectedTreatment: additionalData.selectedTreatment,
        ecgResult: additionalData.ecgResult,
        ecgFindings: additionalData.ecgFindings || undefined,
        isTroponinPositive: additionalData.isTroponinPositive,
        troponinValue: additionalData.troponinValue,
        additionalNotes: additionalData.additionalNotes || undefined,
      };

      // Always include patient info in the update payload
      submitData.patientInfo = patientInfo;

      await onSubmit(stemiCase.id, submitData);

      // Handle bed assignment if changed
      const bedAssignmentData = bedAssignment as any;
      const currentBedId = stemiCase.assignedBed?.id;
      const newBedId = bedAssignmentData && 'bedId' in bedAssignmentData ? bedAssignmentData.bedId : undefined;

      if (newBedId && newBedId !== currentBedId && stemiCase.patientId) {
        try {
          await bedService.assignBed(newBedId, {
            patientId: stemiCase.patientId,
            caseId: stemiCase.id,
            caseType: 'STEMI',
            arrivalDate: bedAssignmentData?.arrivalDate,
          });
          enqueueSnackbar('STEMI case updated and bed assigned successfully', { variant: 'success' });
          // Invalidate hospitals queries and dispatch event to trigger refetch
          queryClient.invalidateQueries('hospitals');
          window.dispatchEvent(new CustomEvent('hospital-capacity-changed'));
        } catch (bedError: any) {
          console.error('Error assigning bed:', bedError);
          enqueueSnackbar(
            'Case updated but bed assignment failed: ' + (bedError?.response?.data?.message || bedError?.message || 'Unknown error'),
            { variant: 'warning' }
          );
        }
      }

      setSuccess('Case updated successfully!');
      setError(null);

      // Clear form and close dialog after a short delay to show success message
      setTimeout(() => {
        resetForm();
        onClose();
      }, 1500);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to update STEMI case');
      setSuccess(null);
      console.error('Error updating STEMI case:', err);
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

  const validateStep = async (step: number): Promise<Record<string, string>> => {
    const errors: Record<string, string> = {};

    switch (step) {
      case 0: {
        // Validate patient info with Yup
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
      case 2: // Critical Timestamps
        // Optional fields
        break;
      case 3: // Interventions & Treatments
        // Optional fields
        break;
      case 4: // Clinical Assessment
        // Optional fields
        break;
      case 5: // Bed Assignment
        // Optional fields
        break;
      case 6: // Review
        // Review step
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
            onChange={handleAdmissionDetailsChange}
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

  if (!stemiCase) return null;

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={2}>
            <span>✏️</span>
            <span>Edit STEMI Case - {stemiCase.patient?.firstName} {stemiCase.patient?.lastName}</span>
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
          <Box sx={{ mt: 1 }}>
            <Box sx={{
              fontSize: '0.875rem',
              color: 'text.secondary',
              fontWeight: 'medium'
            }}>
              Ticket: {stemiCase.ticket?.ticketNumber || 'None'}
            </Box>
          </Box>
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

          <Box sx={{ mb: 3 }}>
            <Stepper activeStep={activeStep} alternativeLabel>
              {steps.map((label) => (
                <Step key={label}>
                  <StepLabel>{label}</StepLabel>
                </Step>
              ))}
            </Stepper>
          </Box>

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

export default EditStemiCaseDialog;
