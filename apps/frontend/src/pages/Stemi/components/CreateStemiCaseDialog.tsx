import React, { useState } from 'react';
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
  Typography,
  Alert,
  CircularProgress,
} from '@mui/material';
import { CreateStemiCaseData, PatientInfo, CriticalTimestamps, InterventionsAndTreatments, ClinicalAssessment } from '../services/stemiService';
import { StemiDatetimeService } from '../services/stemiDatetimeService';
import PatientInfoStep from './forms/PatientInfoStep';
import AdmissionDetailsStep from './forms/AdmissionDetailsStep';
import CriticalTimestampsStep from './forms/CriticalTimestampsStep';
import InterventionsAndTreatmentsStep from './forms/InterventionsAndTreatmentsStep';
import ClinicalAssessmentStep from './forms/ClinicalAssessmentStep';
import ReviewStep from './forms/ReviewStep';

interface CreateStemiCaseDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: CreateStemiCaseData) => Promise<void>;
}

const steps = [
  'Patient Information',
  'Admission Details',
  'Critical Timestamps',
  'Interventions & Treatments',
  'Clinical Assessment',
  'Review & Submit',
];

const CreateStemiCaseDialog: React.FC<CreateStemiCaseDialogProps> = ({
  open,
  onClose,
  onSubmit,
}) => {
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form data state
  const [patientInfo, setPatientInfo] = useState<PatientInfo>({
    firstName: '',
    lastName: '',
    nationalId: '',
    dateOfBirth: '',
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
    modeOfArrival: 'AMBULANCE' | 'PRIVATE_VEHICLE' | 'AIR_TRANSPORT' | 'WALK_IN' | 'POLICE' | 'TRANSFERRED_FROM_HOSPITAL' | 'OTHER';
  }>({
    admissionTime: StemiDatetimeService.getCurrentLocalDateTime(),
    modeOfArrival: '' as any,
  });

  const [criticalTimestamps, setCriticalTimestamps] = useState<CriticalTimestamps>({
    triageTime: '',
    firstEcgTime: '',
  });

  const [interventionsAndTreatments, setInterventionsAndTreatments] = useState<InterventionsAndTreatments>({
    eligibleForPrimaryPci: false,
    pciLocation: '',
    doorOutTime: '',
    balloonInflationTime: '',
    thrombolyticGiven: false,
    thrombolyticAdminTime: '',
  });

  const [clinicalAssessment, setClinicalAssessment] = useState<ClinicalAssessment>({
    heartScore: undefined,
    clinicalRiskLevel: '',
    presentingSymptoms: '',
    symptomOnset: '',
    symptomDuration: undefined,
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

  const handleNext = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
    setError(null);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
    setError(null);
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError(null);

      const formData: CreateStemiCaseData = {
        patientInfo,
        admissionTime: StemiDatetimeService.formatForUTC(admissionDetails.admissionTime),
        modeOfArrival: admissionDetails.modeOfArrival,
        criticalTimestamps: {
          triageTime: criticalTimestamps.triageTime ? StemiDatetimeService.formatForUTC(criticalTimestamps.triageTime) : undefined,
          firstEcgTime: criticalTimestamps.firstEcgTime ? StemiDatetimeService.formatForUTC(criticalTimestamps.firstEcgTime) : undefined,
        },
        interventionsAndTreatments: {
          ...interventionsAndTreatments,
          doorOutTime: interventionsAndTreatments.doorOutTime ? StemiDatetimeService.formatForUTC(interventionsAndTreatments.doorOutTime) : undefined,
          balloonInflationTime: interventionsAndTreatments.balloonInflationTime ? StemiDatetimeService.formatForUTC(interventionsAndTreatments.balloonInflationTime) : undefined,
          thrombolyticAdminTime: interventionsAndTreatments.thrombolyticAdminTime ? StemiDatetimeService.formatForUTC(interventionsAndTreatments.thrombolyticAdminTime) : undefined,
        },
        clinicalAssessment: {
          ...clinicalAssessment,
          symptomOnset: clinicalAssessment.symptomOnset ? StemiDatetimeService.formatForUTC(clinicalAssessment.symptomOnset) : undefined,
        },
        currentStatus: additionalData.currentStatus as any,
        selectedTreatment: additionalData.selectedTreatment,
        ecgResult: additionalData.ecgResult,
        ecgFindings: additionalData.ecgFindings || undefined,
      };

      await onSubmit(formData);
      
      // Reset form
      setActiveStep(0);
      setPatientInfo({
        firstName: '',
        lastName: '',
        nationalId: '',
        dateOfBirth: '',
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
        modeOfArrival: '' as any,
      });
      setCriticalTimestamps({
        triageTime: '',
        firstEcgTime: '',
      });
      setInterventionsAndTreatments({
        eligibleForPrimaryPci: false,
        pciLocation: '',
        doorOutTime: '',
        balloonInflationTime: '',
        thrombolyticGiven: false,
        thrombolyticAdminTime: '',
      });
      setClinicalAssessment({
        heartScore: undefined,
        clinicalRiskLevel: '',
        presentingSymptoms: '',
        symptomOnset: '',
        symptomDuration: undefined,
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
      onClose();
    }
  };

  const isStepValid = (step: number): boolean => {
    switch (step) {
      case 0: // Patient Information
        return !!(
          patientInfo.firstName &&
          patientInfo.lastName &&
          patientInfo.nationalId &&
          patientInfo.dateOfBirth &&
          patientInfo.gender &&
          patientInfo.originHospitalId
        );
      case 1: // Admission Details
        return !!(admissionDetails.admissionTime && admissionDetails.modeOfArrival);
      case 2: // Critical Timestamps
        return true; // Optional fields
      case 3: // Interventions & Treatments
        return true; // Optional fields
      case 4: // Clinical Assessment
        return true; // Optional fields
      case 5: // Review
        return true;
      default:
        return false;
    }
  };

  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <PatientInfoStep
            data={patientInfo}
            onChange={setPatientInfo}
          />
        );
      case 1:
        return (
          <AdmissionDetailsStep
            data={admissionDetails}
            onChange={setAdmissionDetails}
          />
        );
      case 2:
        return (
          <CriticalTimestampsStep
            data={criticalTimestamps}
            onChange={setCriticalTimestamps}
          />
        );
      case 3:
        return (
          <InterventionsAndTreatmentsStep
            data={interventionsAndTreatments}
            onChange={setInterventionsAndTreatments}
          />
        );
      case 4:
        return (
          <ClinicalAssessmentStep
            data={clinicalAssessment}
            onChange={setClinicalAssessment}
            additionalData={additionalData}
            onAdditionalDataChange={setAdditionalData}
          />
        );
      case 5:
        return (
          <ReviewStep
            patientInfo={patientInfo}
            admissionDetails={admissionDetails}
            criticalTimestamps={criticalTimestamps}
            interventionsAndTreatments={interventionsAndTreatments}
            clinicalAssessment={clinicalAssessment}
            additionalData={additionalData}
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
          <Stepper activeStep={activeStep} alternativeLabel>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
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
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : null}
          >
            {loading ? 'Creating...' : 'Create Case'}
          </Button>
        ) : (
          <Button
            onClick={handleNext}
            variant="contained"
            disabled={!isStepValid(activeStep) || loading}
          >
            Next
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default CreateStemiCaseDialog;
