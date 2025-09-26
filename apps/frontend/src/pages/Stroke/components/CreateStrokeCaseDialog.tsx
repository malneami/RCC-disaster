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
import PatientStep from './CreateStrokeCase/PatientStep';
import AssessmentStep from './CreateStrokeCase/AssessmentStep';
import DiagnosisStep from './CreateStrokeCase/DiagnosisStep';
import TreatmentStep from './CreateStrokeCase/TreatmentStep';
import ReviewStep from './CreateStrokeCase/ReviewStep';

interface CreateStrokeCaseDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: CreateStrokeCaseData) => Promise<void>;
}

const steps = [
  'Patient',
  'Assessment', 
  'Diagnosis',
  'Treatment',
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
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
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
    setValidationErrors({});
    onClose();
  };

  const updateFormData = (field: keyof CreateStrokeCaseData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear validation error for this field when user starts typing
    if (validationErrors[field]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <PatientStep
            formData={formData}
            updateFormData={updateFormData}
            validationErrors={validationErrors}
          />
        );
      case 1:
        return (
          <AssessmentStep
            formData={formData}
            updateFormData={updateFormData}
            validationErrors={validationErrors}
          />
        );
      case 2:
        return (
          <DiagnosisStep
            formData={formData}
            updateFormData={updateFormData}
          />
        );
      case 3:
        return (
          <TreatmentStep
            formData={formData}
            updateFormData={updateFormData}
          />
        );
      case 4:
        return <ReviewStep formData={formData} />;
      default:
        return null;
    }
  };

  const validateStep = (step: number): Record<string, string> => {
    const errors: Record<string, string> = {};
    
    switch (step) {
      case 0:
        if (!formData.patientInfo?.firstName) {
          errors['patientInfo.firstName'] = 'Patient Name is required';
        }
        if (!formData.patientInfo?.lastName) {
          errors['patientInfo.lastName'] = 'Patient Last Name is required';
        }
        if (!formData.patientInfo?.nationalId) {
          errors['patientInfo.nationalId'] = 'National ID is required';
        }
        if (!formData.patientInfo?.age) {
          errors['patientInfo.age'] = 'Age is required';
        }
        if (!formData.patientInfo?.gender) {
          errors['patientInfo.gender'] = 'Gender is required';
        }
        if (!formData.originHospitalId) {
          errors['originHospitalId'] = 'Origin Hospital is required';
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
        // Review step
        break;
    }
    
    return errors;
  };

  const handleNext = () => {
    const errors = validateStep(activeStep);
    setValidationErrors(errors);
    
    // Only proceed if there are no validation errors
    if (Object.keys(errors).length === 0 && activeStep < steps.length - 1) {
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
            {loading ? 'Creating...' : 'Create Case'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default CreateStrokeCaseDialog;