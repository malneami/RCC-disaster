import React from 'react';
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

// Form step components
import PatientInfoStep from './forms/PatientInfoStep';
import AdmissionDetailsStep from './forms/AdmissionDetailsStep';
import CriticalTimestampsStep from './forms/CriticalTimestampsStep';
import InterventionsAndTreatmentsStep from './forms/InterventionsAndTreatmentsStep';
import ClinicalAssessmentStep from './forms/ClinicalAssessmentStep';
import ReviewStep from './forms/ReviewStep';

// Types and services
import { StemiCase } from '../services/stemiService';
import { useEditStemiCase, steps } from './useEditStemiCase';

interface EditStemiCaseDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (id: string, data: any) => Promise<void>;
  stemiCase: StemiCase | null;
}

const EditStemiCaseDialog: React.FC<EditStemiCaseDialogProps> = (props) => {
  const { open, onClose, stemiCase } = props;

  const {
    activeStep,
    loading,
    error,
    success,
    validationErrors,
    timelineWarnings,
    patientInfo,
    admissionDetails,
    criticalTimestamps,
    interventionsAndTreatments,
    clinicalAssessment,
    additionalData,
    originRequiresDestination,
    isAdmin,
    handleOriginHospitalSelect,
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
  } = useEditStemiCase(props);

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
          <ReviewStep
            patientInfo={patientInfo}
            admissionDetails={admissionDetails}
            criticalTimestamps={criticalTimestamps}
            interventionsAndTreatments={interventionsAndTreatments}
            clinicalAssessment={clinicalAssessment}
            additionalData={additionalData}
            timelineWarnings={timelineWarnings}
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
