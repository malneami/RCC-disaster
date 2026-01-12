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
} from '@mui/material';
import * as yup from 'yup';

import { StrokeCase, CreateStrokeCaseData } from '../../../services/strokeService';
import { useAuth } from '../../../contexts/AuthContext';
import { Hospital, hospitalService } from '../../../services/hospitalService';
import PatientStep from './CreateStrokeCase/PatientStep';
import { calculateAge } from '../../../utils/ageCalculator';
import AssessmentStep from './CreateStrokeCase/AssessmentStep';
import DiagnosisStep from './CreateStrokeCase/DiagnosisStep';
import TreatmentStep from './CreateStrokeCase/TreatmentStep';
import ReviewStep from './CreateStrokeCase/ReviewStep';
import BedAssignmentStep from '../../Trauma/components/forms/BedAssignmentStep';
import { bedService } from '../../Beds/services/bedService';
import { useSnackbar } from 'notistack';
import { useQueryClient } from 'react-query';

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
  'Bed Assignment',
  'Review & Submit'
];

const EditStrokeCaseDialog: React.FC<EditStrokeCaseDialogProps> = ({
  open,
  onClose,
  strokeCase,
  onUpdate,
}) => {
  const { } = useAuth();
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [activeStep, setActiveStep] = useState(0);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [timelineWarnings, setTimelineWarnings] = useState<Record<string, string[]>>({});
  const [kpiViolations, setKpiViolations] = useState<Record<string, string>>({});
  const [originHospital, setOriginHospital] = useState<Hospital | null>(null);

  const dialogContentRef = React.useRef<HTMLElement>(null);

  const [formData, setFormData] = useState<CreateStrokeCaseData>({
    originHospitalId: '',
    strokeType: 'ISCHEMIC',
    currentStatus: 'SUSPECTED',
    patientInfo: {
      firstName: '',
      lastName: '',
      nationalId: '',
      nationalIdNotAvailable: false,
      mrn: '',
      age: undefined,
      gender: 'MALE',
      phoneNumber: '',
      email: '',
    },
    bedAssignment: undefined,
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
        nationalIdNotAvailable: false,
        mrn: '',
        age: undefined,
        gender: 'MALE',
        phoneNumber: '',
        email: '',
      },
      bedAssignment: undefined,
    });
    setActiveStep(0);
    setError(null);
    setSuccess(null);
    setValidationErrors({});
    setTimelineWarnings({});
    setKpiViolations({});
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
    const transferRequestDateTime = parseDate(formData.transferRequestDateTime);
    const transferArrivalDateTime = parseDate(formData.transferArrivalDateTime);
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

    if (transferRequestDateTime && dateOfAdmission && transferRequestDateTime < dateOfAdmission) {
      addWarning(
        'transferRequestDateTime',
        'Transfer request is logged before admission. Confirm the request time.'
      );
    }

    if (transferArrivalDateTime && transferRequestDateTime && transferArrivalDateTime < transferRequestDateTime) {
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

    if (transferRequestDateTime && transferArrivalDateTime && transferArrivalDateTime < transferRequestDateTime) {
      addWarning(
        'transferArrivalDateTime',
        'Transfer arrival is before request. Please check valid timestamps.'
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

  // KPI Validation Logic (Yellow Warnings)
  useEffect(() => {
    const violations: Record<string, string> = {};

    const parseDate = (value?: string) => {
      if (!value) return null;
      const date = new Date(value);
      return isNaN(date.getTime()) ? null : date;
    };

    const calculateDiffMinutes = (start?: Date | null, end?: Date | null) => {
      if (!start || !end) return null;
      return (end.getTime() - start.getTime()) / (1000 * 60);
    };

    const dateOfAdmission = parseDate(formData.dateOfAdmission);
    const timeOfTriage = parseDate(formData.timeOfTriage);
    const timeOfPhysicianAssessment = parseDate(formData.timeOfPhysicianAssessment);
    const timeOfCtScanStart = parseDate(formData.timeOfCtScanStart);
    const timeOfCtReportFinal = parseDate(formData.timeOfCtReportFinal);
    const ivThrombolysisAdminTime = parseDate(formData.ivThrombolysisAdministrationTime);
    const timeOfPuncture = parseDate(formData.timeOfMechanicalThrombectomyPuncture);

    const timeOfTransferActivation = parseDate(formData.timeOfTransferActivation);
    const timeOfTransferDeparture = parseDate(formData.timeOfTransferDeparture);
    const srcaCallTime = parseDate(formData.srcaCallTime);
    const timeOfSwallowingScreening = parseDate(formData.timeOfSwallowingScreening);

    if (dateOfAdmission) {
      // Door to Triage: Target 10 min
      const doorToTriage = calculateDiffMinutes(dateOfAdmission, timeOfTriage);
      if (doorToTriage !== null && doorToTriage > 10) {
        violations['timeOfTriage'] = `Door to Triage exceeded 10 min (${Math.round(doorToTriage)} min)`;
      }

      // Door to Physician: Target 15 min
      const doorToPhysician = calculateDiffMinutes(dateOfAdmission, timeOfPhysicianAssessment);
      if (doorToPhysician !== null && doorToPhysician > 15) {
        violations['timeOfPhysicianAssessment'] = `Door to Physician exceeded 15 min (${Math.round(doorToPhysician)} min)`;
      }

      // Door to CT Start: Target 20 min
      const doorToCtStart = calculateDiffMinutes(dateOfAdmission, timeOfCtScanStart);
      if (doorToCtStart !== null && doorToCtStart > 20) {
        violations['timeOfCtScanStart'] = `Door to CT Scan exceeded 20 min (${Math.round(doorToCtStart)} min)`;
      }

      // Door to CT Final Report: Target 45 min
      const doorToCtFinal = calculateDiffMinutes(dateOfAdmission, timeOfCtReportFinal);
      if (doorToCtFinal !== null && doorToCtFinal > 45) {
        violations['timeOfCtReportFinal'] = `Door to CT Report exceeded 45 min (${Math.round(doorToCtFinal)} min)`;
      }

      // Door to Needle (IV Thrombolysis): Target 60 min
      const doorToNeedle = calculateDiffMinutes(dateOfAdmission, ivThrombolysisAdminTime);
      if (doorToNeedle !== null && doorToNeedle > 60) {
        violations['ivThrombolysisAdministrationTime'] = `Door to Needle exceeded 60 min (${Math.round(doorToNeedle)} min)`;
      }

      // Door to Puncture (Mechanical Thrombectomy): Target 120 min
      const doorToPuncture = calculateDiffMinutes(dateOfAdmission, timeOfPuncture);
      if (doorToPuncture !== null && doorToPuncture > 120) {
        violations['timeOfMechanicalThrombectomyPuncture'] = `Door to Puncture exceeded 120 min (${Math.round(doorToPuncture)} min)`;
      }
    }

    // SRCA Call to Arrival: Target 60 min (if admission date exists)
    const srcaToArrival = calculateDiffMinutes(srcaCallTime, dateOfAdmission);
    if (srcaToArrival !== null && srcaToArrival > 60) {
      violations['srcaCallTime'] = `SRCA Call to Arrival exceeded 60 min (${Math.round(srcaToArrival)} min)`;
    }

    // Swallowing Screening: Target 4 hours (240 min) from arrival
    const doorToSwallow = calculateDiffMinutes(dateOfAdmission, timeOfSwallowingScreening);
    if (doorToSwallow !== null && doorToSwallow > 240) {
      violations['timeOfSwallowingScreening'] = `Swallowing Screening exceeded 4 hrs (${Math.round(doorToSwallow / 60)} hrs)`;
    }

    // Transfer Time: Target 40 min (using Activation to Departure as proxy for DIDO logic if CT present)
    // Note: Standard typically says 20m without CT, 40m with CT. We'll warn if > 40 to be safe/broad.
    const transferTime = calculateDiffMinutes(timeOfTransferActivation, timeOfTransferDeparture);
    if (transferTime !== null && transferTime > 40) {
      violations['timeOfTransferDeparture'] = `Transfer time exceeded 40 min (${Math.round(transferTime)} min)`;
    }


    setKpiViolations(violations);
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
      let bedAssignment = undefined;
      if (strokeCase.assignedBed) {
        // Determine hospital type by comparing with origin/destination hospitals
        const bedHospitalId = strokeCase.assignedBed.hospital?.id;
        let hospitalType: 'origin' | 'destination' | undefined = undefined;
        if (bedHospitalId === strokeCase.originHospitalId) {
          hospitalType = 'origin';
        } else if (bedHospitalId === strokeCase.destinationHospitalId) {
          hospitalType = 'destination';
        }

        bedAssignment = {
          bedId: strokeCase.assignedBed.id,
          bedNumber: strokeCase.assignedBed.bedNumber,
          unitId: strokeCase.assignedBed.unit?.id,
          hospitalId: bedHospitalId,
          hospitalType: hospitalType,
          assignedBed: {
            id: strokeCase.assignedBed.id,
            bedNumber: strokeCase.assignedBed.bedNumber,
            unitName: strokeCase.assignedBed.unit?.name || '',
            hospitalName: strokeCase.assignedBed.hospital?.name || '',
          },
        };
      }

      setFormData({
        // Basic Information
        originHospitalId: strokeCase.originHospitalId,
        destinationHospitalId: strokeCase.destinationHospitalId,
        strokeType: strokeCase.strokeType,
        currentStatus: strokeCase.currentStatus,
        chiefComplaint: strokeCase.chiefComplaint || '',

        // Patient Information
        patientInfo: (() => {
          const dateOfBirth = strokeCase.patient?.dateOfBirth ? new Date(strokeCase.patient.dateOfBirth).toISOString().split('T')[0] : undefined;
          // Calculate age from dateOfBirth if age is not present
          let age = strokeCase.patient?.age;
          if (!age && dateOfBirth) {
            try {
              age = calculateAge(dateOfBirth).years;
            } catch (error) {
              console.error('Error calculating age from dateOfBirth:', error);
            }
          }
          return {
            firstName: strokeCase.patient?.firstName || '',
            lastName: strokeCase.patient?.lastName || '',
            nationalId: strokeCase.patient?.nationalId || '',
            nationalIdNotAvailable: (strokeCase.patient as any)?.nationalIdNotAvailable || !strokeCase.patient?.nationalId,
            mrn: strokeCase.patient?.mrn || '',
            dateOfBirth,
            age,
            gender: (strokeCase.patient?.gender as 'MALE' | 'FEMALE') || 'MALE',
            phoneNumber: strokeCase.patient?.phoneNumber || '',
            email: strokeCase.patient?.email || '',
          };
        })(),

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

        // Bed Assignment
        bedAssignment,
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
      } else if (field === 'bedAssignment') {
        Object.keys(newErrors).forEach(key => {
          if (key.startsWith('bedAssignment.')) {
            delete newErrors[key];
          }
        });
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
            kpiViolations={kpiViolations}
          />
        );
      case 1:
        return (
          <AssessmentStep
            formData={formData}
            updateFormData={updateFormData}
            validationErrors={validationErrors}
            timelineWarnings={timelineWarnings}
            kpiViolations={kpiViolations}
          />
        );
      case 2:
        return (
          <DiagnosisStep
            formData={formData}
            updateFormData={updateFormData}
            timelineWarnings={timelineWarnings}
            kpiViolations={kpiViolations}
          />
        );
      case 3:
        return (
          <TreatmentStep
            formData={formData}
            updateFormData={updateFormData}
            timelineWarnings={timelineWarnings}
            kpiViolations={kpiViolations}
          />
        );
      case 4:
        return (
          <BedAssignmentStep
            data={formData.bedAssignment || {}}
            onChange={(data) => updateFormData('bedAssignment', { ...formData.bedAssignment, ...data })}
            errors={validationErrors}
            validationErrors={validationErrors}
            patientInfo={{
              originHospitalId: formData.originHospitalId,
              destinationHospitalId: formData.destinationHospitalId,
            } as any}
          />
        );
      case 5:
        return <ReviewStep formData={formData} timelineWarnings={timelineWarnings} kpiViolations={kpiViolations} />;
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
        if (formData.bedAssignment && 'bedId' in formData.bedAssignment && (formData.bedAssignment as any).bedId) {
          try {
            const bedId = (formData.bedAssignment as any).bedId;
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
      case 5:
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
        } else if (firstErrorKey.startsWith('bedAssignment.')) {
          targetStep = 4;
        }
        setActiveStep(targetStep);
        setError('Please correct the highlighted information before submitting.');
        setLoading(false);
        if (dialogContentRef.current) {
          dialogContentRef.current.scrollTo({ top: 0, behavior: 'smooth' });
        }
        return;
      }

      // Check for timeline warnings (BLOCKING - Red Errors)
      if (Object.keys(timelineWarnings).length > 0) {
        setError('Please resolve all timeline errors (red) before submitting.');
        setLoading(false);
        // Find step with warning
        const warningKeys = Object.keys(timelineWarnings);
        if (warningKeys.some(k => ['timeOfTriage', 'timeOfPhysicianAssessment', 'dateOfAdmission'].includes(k))) setActiveStep(1);
        else if (warningKeys.some(k => ['timeOfCtScanStart', 'timeOfCtReportFinal'].includes(k))) setActiveStep(2);
        else if (warningKeys.some(k => ['thrombolysisOrderTime', 'ivThrombolysisAdministrationTime'].includes(k))) setActiveStep(3);
        else setActiveStep(5); // Review step

        if (dialogContentRef.current) {
          dialogContentRef.current.scrollTo({ top: 0, behavior: 'smooth' });
        }
        return;
      }

      // Prepare update data with patientInfo included
      const { patientInfo, bedAssignment, ...otherData } = formData;

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

      const bedAssignmentData = bedAssignment as any;
      const currentBedId = strokeCase.assignedBed?.id;
      const newBedId = bedAssignmentData && 'bedId' in bedAssignmentData ? bedAssignmentData.bedId : undefined;

      if (newBedId && newBedId !== currentBedId && strokeCase.patientId) {
        try {
          await bedService.assignBed(newBedId, {
            patientId: strokeCase.patientId,
            caseId: strokeCase.id,
            caseType: 'STROKE',
            arrivalDate: bedAssignmentData?.arrivalDate,
          });
          enqueueSnackbar('Stroke case updated and bed assigned successfully', { variant: 'success' });
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
      } else if (!newBedId && currentBedId) {
        enqueueSnackbar('Stroke case updated. Note: To unassign the bed, please use the bed management interface.', { variant: 'info' });
      } else if (newBedId && newBedId === currentBedId) {
        enqueueSnackbar('Stroke case updated successfully', { variant: 'success' });
      } else {
        enqueueSnackbar('Stroke case updated successfully', { variant: 'success' });
      }

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
      if (dialogContentRef.current) {
        dialogContentRef.current.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } finally {
      setLoading(false);
    }
  };

  const getStepSeverity = (stepIndex: number): 'error' | 'warning' | null => {
    const step0Fields = ['patientInfo', 'originHospitalId', 'destinationHospitalId', 'transferRequestDateTime', 'transferArrivalDateTime'];
    const step1Fields = ['timeOfSymptomOnset', 'dateOfAdmission', 'timeOfTriage', 'timeOfPhysicianAssessment', 'srcaCallTime'];
    const step2Fields = ['strokeType', 'timeOfCtScanStart', 'timeOfCtReportFinal', 'timeOfSwallowingScreening'];
    const step3Fields = ['thrombolysisOrderTime', 'ivThrombolysisAdministrationTime', 'timeOfMechanicalThrombectomyPuncture', 'timeOfThrombectomyComplete', 'timeOfTransferActivation', 'timeOfTransferDeparture'];
    const step4Fields = ['bedAssignment'];

    const getFieldsForStep = (index: number) => {
      switch (index) {
        case 0: return step0Fields;
        case 1: return step1Fields;
        case 2: return step2Fields;
        case 3: return step3Fields;
        case 4: return step4Fields;
        default: return [];
      }
    };

    const fields = getFieldsForStep(stepIndex);

    // 1. Check validation errors (recursive/prefix check) - RED
    const hasValidationError = fields.some(field => {
      return Object.keys(validationErrors).some(key => key.startsWith(field));
    });

    // 2. Check timeline warnings (Blocking) - RED
    const hasTimelineWarning = fields.some(field => {
      return Object.keys(timelineWarnings).some(key => key === field);
    });

    if (hasValidationError || hasTimelineWarning) {
      return 'error';
    }

    // 3. Check KPI Violations (Non-blocking) - YELLOW
    const hasKpiViolation = fields.some(field => {
      return Object.keys(kpiViolations).some(key => key === field);
    });

    if (hasKpiViolation) {
      return 'warning';
    }

    return null;
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
          <Stepper activeStep={activeStep} alternativeLabel nonLinear>
            {steps.map((label, index) => {
              const severity = getStepSeverity(index);
              const labelProps: { error?: boolean } = {};

              if (severity === 'error') {
                labelProps.error = true;
              }
              const isCompleted = activeStep > index;

              return (
                <Step key={label} completed={isCompleted}>
                  <StepButton
                    onClick={() => {
                      setActiveStep(index);
                      setError(null);
                    }}
                    {...labelProps}
                    sx={{
                      '& .MuiStepIcon-root': {
                        color: severity === 'warning' ? 'warning.main' : undefined,
                      },
                      '& .MuiStepIcon-text': {
                        fill: severity === 'warning' ? '#fff' : undefined,
                      }
                    }}
                  >
                    {label}
                  </StepButton>
                </Step>
              );
            })}
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