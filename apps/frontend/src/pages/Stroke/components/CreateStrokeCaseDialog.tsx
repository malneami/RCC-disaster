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
  Alert,
} from '@mui/material';

import { CreateStrokeCaseData } from '../../../services/strokeService';
import BasicInformationStep from './CreateStrokeCase/BasicInformationStep';
import ClinicalAssessmentsStep from './CreateStrokeCase/ClinicalAssessmentsStep';
import TreatmentInformationStep from './CreateStrokeCase/TreatmentInformationStep';
import ReviewStep from './CreateStrokeCase/ReviewStep';

interface CreateStrokeCaseDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: CreateStrokeCaseData) => Promise<void>;
}

const steps = [
  'Basic Information',
  'Clinical Assessments', 
  'Treatment Information',
  'Review & Submit'
];

const CreateStrokeCaseDialog: React.FC<CreateStrokeCaseDialogProps> = ({
  open,
  onClose,
  onSubmit,
}) => {
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<CreateStrokeCaseData>({
    originHospitalId: '',
    strokeType: 'ISCHEMIC',
    currentStatus: 'SUSPECTED',
    patientInfo: {
      firstName: '',
      lastName: '',
      nationalId: '',
      mrn: '',
      age: undefined,
    },
  });

  const handleClose = () => {
    setActiveStep(0);
    setFormData({
      originHospitalId: '',
      strokeType: 'ISCHEMIC',
      currentStatus: 'SUSPECTED',
      patientInfo: {
        firstName: '',
        lastName: '',
        nationalId: '',
        mrn: '',
        age: undefined,
      },
    });
    setError(null);
    onClose();
  };

  const updateFormData = (field: keyof CreateStrokeCaseData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <BasicInformationStep
            formData={formData}
            updateFormData={updateFormData}
          />
        );
      case 1:
        return (
          <ClinicalAssessmentsStep
            formData={formData}
            updateFormData={updateFormData}
          />
        );
      case 2:
        return (
          <TreatmentInformationStep
            formData={formData}
            updateFormData={updateFormData}
          />
        );
      case 3:
        return <ReviewStep formData={formData} />;
      default:
        return null;
    }
  };

  const isStepValid = (step: number): boolean => {
    switch (step) {
      case 0:
        return !!(
          formData.patientInfo?.firstName && 
          formData.patientInfo?.lastName && 
          formData.patientInfo?.nationalId && 
          formData.patientInfo?.age && 
          formData.originHospitalId && 
          formData.strokeType
        );
      case 1:
        return true; // Clinical assessment is optional
      case 2:
        return true; // Treatment details are optional
      case 3:
        return true; // Review step
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (activeStep < steps.length - 1) {
      setActiveStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    if (activeStep > 0) {
      setActiveStep(prev => prev - 1);
    }
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError(null);
      await onSubmit(formData);
      handleClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create stroke case');
      console.error('Error creating stroke case:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>Create New Stroke Case</DialogTitle>
      
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        <Box sx={{ minHeight: 400 }}>
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
            disabled={!isStepValid(activeStep) || loading}
          >
            Next
          </Button>
        ) : (
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={loading}
          >
            {loading ? 'Creating...' : 'Create Case'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default CreateStrokeCaseDialog;