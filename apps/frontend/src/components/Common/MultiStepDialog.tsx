import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Stepper,
  Step,
  StepLabel,
  Typography,
  IconButton,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  Close as CloseIcon,
  NavigateNext as NextIcon,
  NavigateBefore as PrevIcon,
} from '@mui/icons-material';

export interface StepConfig {
  label: string;
  content: React.ReactNode;
  optional?: boolean;
  completed?: boolean;
  validate?: () => boolean | string | null;
}

export interface MultiStepDialogProps {
  open: boolean;
  title: string;
  steps: StepConfig[];
  onClose: () => void;
  onComplete: (data: any) => void;
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  fullWidth?: boolean;
  sx?: any;
  loading?: boolean;
  error?: string | null;
  completeLabel?: string;
}

const MultiStepDialog: React.FC<MultiStepDialogProps> = ({
  open,
  title,
  steps,
  onClose,
  onComplete,
  maxWidth = 'md',
  fullWidth = true,
  sx = {},
  loading = false,
  error = null,
  completeLabel = 'Complete',
}) => {
  const [activeStep, setActiveStep] = useState(0);
  const [formData, setFormData] = useState<any>({});

  useEffect(() => {
    if (open) {
      setActiveStep(0);
      setFormData({});
    }
  }, [open]);

  const handleNext = () => {
    const currentStep = steps[activeStep];
    if (currentStep?.validate) {
      const validationResult = currentStep.validate();
      if (validationResult !== true) {
        return;
      }
    }

    if (activeStep < steps.length - 1) {
      setActiveStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    if (activeStep > 0) {
      setActiveStep((prev) => prev - 1);
    }
  };

  const handleComplete = () => {
    if (!loading) {
      onComplete(formData);
    }
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
    }
  };

  const isLastStep = activeStep === steps.length - 1;
  const isFirstStep = activeStep === 0;

  return (
    <Dialog
      open={open}
      maxWidth={maxWidth}
      fullWidth={fullWidth}
      onClose={handleClose}
      PaperProps={{
        sx: {
          minHeight: '60vh',
          ...sx,
        },
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6">{title}</Typography>
          <IconButton onClick={handleClose} size="small" disabled={loading}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ pt: 2 }}>
        <Box sx={{ mb: 3 }}>
          <Stepper activeStep={activeStep} alternativeLabel>
            {steps.map((step, index) => (
              <Step key={index} completed={step.completed}>
                <StepLabel optional={step.optional}>{step.label}</StepLabel>
              </Step>
            ))}
          </Stepper>
        </Box>

        <Box sx={{ minHeight: '300px', position: 'relative' }}>
          {loading && (
            <Box
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'rgba(255, 255, 255, 0.8)',
                zIndex: 1,
              }}
            >
              <CircularProgress />
            </Box>
          )}
          {steps[activeStep]?.content}
          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 3, pt: 1 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
          <Button
            onClick={handleBack}
            disabled={isFirstStep || loading}
            startIcon={<PrevIcon />}
          >
            Back
          </Button>

          <Box>
            <Button onClick={handleClose} sx={{ mr: 1 }} disabled={loading}>
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={isLastStep ? handleComplete : handleNext}
              endIcon={!isLastStep ? <NextIcon /> : undefined}
              disabled={loading}
            >
              {isLastStep ? (loading ? 'Creating...' : completeLabel) : 'Next'}
            </Button>
          </Box>
        </Box>
      </DialogActions>
    </Dialog>
  );
};

export default MultiStepDialog;
