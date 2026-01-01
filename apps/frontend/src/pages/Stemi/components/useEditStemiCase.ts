import { useState, useEffect, useCallback } from 'react';
import * as yup from 'yup';
import { useAuth } from '../../../contexts/AuthContext';
import { Hospital, hospitalService } from '../../../services/hospitalService';
import {
  StemiCase,
  UpdateStemiCaseData,
  PatientInfo,
  CriticalTimestamps,
  InterventionsAndTreatments,
  ClinicalAssessment,
} from '../services/stemiService';
import { StemiDatetimeService } from '../services/stemiDatetimeService';

const DESTINATION_REQUIRED_MESSAGE =
  'Please select a destination hospital because the selected origin hospital does not provide STEMI service.';

// Regex patterns supporting Arabic characters
const NAME_REGEX = /^[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFFA-Za-z\s\u00C0-\u017F]+$/;
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

export const steps = [
  'Patient Information',
  'Admission Details',
  'Critical Timestamps',
  'Interventions & Treatments',
  'Clinical Assessment',
  'Review & Submit',
];

interface UseEditStemiCaseProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (id: string, data: any) => Promise<void>;
  stemiCase: StemiCase | null;
}

export const useEditStemiCase = ({
  open,
  onClose,
  onSubmit,
  stemiCase,
}: UseEditStemiCaseProps) => {
  const { user } = useAuth();
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
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

  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';
  const originRequiresDestination = !!originHospital && !originHospital.hasStemiService;

  const resetForm = useCallback(() => {
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

    setActiveStep(0);
    setError(null);
    setSuccess(null);
    setValidationErrors({});
    setTimelineWarnings({});
    setOriginHospital(null);
    setLoading(false);
  }, []);

  const handleClose = useCallback(() => {
    if (!loading) {
      resetForm();
      onClose();
    }
  }, [loading, onClose, resetForm]);

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

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      resetForm();
    }
  }, [open, resetForm]);

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

      setPatientInfo({
        firstName: stemiCase.patient?.firstName || '',
        lastName: stemiCase.patient?.lastName || '',
        nationalId: stemiCase.patient?.nationalId || '',
        dateOfBirth: stemiCase.patient?.dateOfBirth ? new Date(stemiCase.patient.dateOfBirth).toISOString().split('T')[0] : undefined,
        age: stemiCase.patient?.age || undefined,
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
    }
  }, [stemiCase, open]);

  const handlePatientInfoChange = useCallback((data: PatientInfo) => {
    setPatientInfo(data);
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
    }

    return errors;
  };

  const handleNext = async () => {
    const errors = await validateStep(activeStep);
    setValidationErrors(errors);

    if (Object.keys(errors).length === 0 && activeStep < steps.length - 1) {
      setActiveStep((prevActiveStep) => prevActiveStep + 1);
      setError(null);
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

      const patientErrors = await validateStep(0);
      const admissionErrors = await validateStep(1);
      const combinedErrors = { ...patientErrors, ...admissionErrors };

      if (Object.keys(combinedErrors).length > 0) {
        setValidationErrors(combinedErrors);
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

      submitData.patientInfo = patientInfo;

      await onSubmit(stemiCase.id, submitData);
      setSuccess('Case updated successfully!');
      setError(null);

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

  return {
    activeStep,
    loading,
    error,
    success,
    validationErrors,
    timelineWarnings,
    originHospital,
    patientInfo,
    admissionDetails,
    criticalTimestamps,
    interventionsAndTreatments,
    clinicalAssessment,
    additionalData,
    originRequiresDestination,
    isAdmin,
    handleOriginHospitalSelect,
    setPatientInfo,
    setAdmissionDetails,
    setCriticalTimestamps,
    setInterventionsAndTreatments,
    setClinicalAssessment,
    setAdditionalData,
    handlePatientInfoChange,
    handleAdmissionDetailsChange,
    handleNext,
    handleBack,
    handleSubmit,
    handleClose,
  };
};
