import React, { useState, useEffect } from 'react';
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

// Form step components (same as creation)
import PatientInfoStep from './forms/PatientInfoStep';
import AdmissionDetailsStep from './forms/AdmissionDetailsStep';
import CriticalTimestampsStep from './forms/CriticalTimestampsStep';
import InterventionsAndTreatmentsStep from './forms/InterventionsAndTreatmentsStep';
import ClinicalAssessmentStep from './forms/ClinicalAssessmentStep';
import ReviewStep from './forms/ReviewStep';

// Types and services
import { StemiCase, UpdateStemiCaseData, PatientInfo, CriticalTimestamps, InterventionsAndTreatments, ClinicalAssessment } from '../services/stemiService';
import { StemiDatetimeService } from '../services/stemiDatetimeService';
import { useAuth } from '../../../contexts/AuthContext';

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
  'Review & Submit',
];

const EditStemiCaseDialog: React.FC<EditStemiCaseDialogProps> = ({
  open,
  onClose,
  onSubmit,
  stemiCase,
}) => {
  const { user } = useAuth();
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    modeOfArrival: 'AMBULANCE' | 'PRIVATE_VEHICLE' | 'AIR_TRANSPORT' | 'WALK_IN' | 'POLICE' | 'TRANSFERRED_FROM_HOSPITAL' | 'OTHER';
  }>({
    admissionTime: '',
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

  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';

  useEffect(() => {
    if (stemiCase && open) {
      setActiveStep(0);
      setError(null);
      setLoading(false);
      
      // Convert STEMI case data to form structure (exactly like creation form)
      setPatientInfo({
        firstName: stemiCase.patient?.firstName || '',
        lastName: stemiCase.patient?.lastName || '',
        nationalId: stemiCase.patient?.nationalId || '',
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
      });

      setAdmissionDetails({
        admissionTime: stemiCase.pathwayStarted ? StemiDatetimeService.formatForLocal(stemiCase.pathwayStarted) : '',
        modeOfArrival: stemiCase.modeOfArrival || '' as any,
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
      });

      setClinicalAssessment({
        heartScore: stemiCase.heartScore || undefined,
        clinicalRiskLevel: stemiCase.clinicalRiskLevel || '',
        presentingSymptoms: stemiCase.presentingSymptoms || '',
        symptomOnset: stemiCase.symptomOnset ? StemiDatetimeService.formatForLocal(stemiCase.symptomOnset) : '',
        symptomDuration: stemiCase.symptomDuration || undefined,
      });

      setAdditionalData({
        currentStatus: stemiCase.currentStatus as any || 'SUSPECTED',
        selectedTreatment: stemiCase.selectedTreatment || undefined,
        ecgResult: stemiCase.ecgResult || undefined,
        ecgFindings: stemiCase.ecgFindings || '',
        isTroponinPositive: false, // This field doesn't exist in the schema
        troponinValue: undefined, // This field doesn't exist in the schema
        additionalNotes: '', // This field doesn't exist in the schema
      });
    }
  }, [stemiCase, open]);

  const handleNext = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
    setError(null);
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

      // Prepare data for submission (matching UpdateStemiCaseData interface)
      const submitData: UpdateStemiCaseData = {
        admissionTime: StemiDatetimeService.formatForUTC(admissionDetails.admissionTime),
        modeOfArrival: admissionDetails.modeOfArrival,
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
        },
        clinicalAssessment: {
          heartScore: clinicalAssessment.heartScore || undefined,
          clinicalRiskLevel: clinicalAssessment.clinicalRiskLevel || undefined,
          presentingSymptoms: clinicalAssessment.presentingSymptoms || undefined,
          symptomOnset: clinicalAssessment.symptomOnset ? StemiDatetimeService.formatForUTC(clinicalAssessment.symptomOnset) : undefined,
          symptomDuration: clinicalAssessment.symptomDuration || undefined,
        },
        currentStatus: additionalData.currentStatus as any,
        selectedTreatment: additionalData.selectedTreatment,
        ecgResult: additionalData.ecgResult,
        ecgFindings: additionalData.ecgFindings || undefined,
      };

      // Add patient info for admins only
      if (isAdmin) {
        submitData.patientInfo = patientInfo;
      }

      await onSubmit(stemiCase.id, submitData);
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to update STEMI case');
      console.error('Error updating STEMI case:', err);
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
          patientInfo.age &&
          patientInfo.gender &&
          patientInfo.originHospitalId
        );
      case 1: // Admission Details
        return !!(admissionDetails.admissionTime);
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
              disabled={!isStepValid(activeStep) || loading}
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
