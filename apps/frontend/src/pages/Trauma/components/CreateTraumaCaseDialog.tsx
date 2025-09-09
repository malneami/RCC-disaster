/**
 * Create Trauma Case Dialog Component
 * Multi-step form for creating trauma cases
 */

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

// Form step components
import PatientInfoStep from './forms/PatientInfoStep';
import IncidentDetailsStep from './forms/IncidentDetailsStep';
import VitalsAssessmentStep from './forms/VitalsAssessmentStep';
import InjuryAssessmentStep from './forms/InjuryAssessmentStep';
import DispositionStep from './forms/DispositionStep';

// Types and constants
import { CreateTraumaCaseData } from '../../../services/traumaService';
import { TRAUMA_FORM_STEPS } from '../constants/traumaConstants';
import { validateTraumaCaseForm } from '../helpers/traumaHelpers';

interface CreateTraumaCaseDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: CreateTraumaCaseData) => Promise<void>;
}

const CreateTraumaCaseDialog: React.FC<CreateTraumaCaseDialogProps> = ({
  open,
  onClose,
  onSubmit,
}) => {
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    patientInfo: {
      firstName: '',
      lastName: '',
      nationalId: '',
      dateOfBirth: '',
      gender: 'MALE' as const,
      phoneNumber: '',
      address: '',
      emergencyContact: '',
      emergencyContactPhone: '',
      medicalHistory: '',
      allergies: '',
      medications: '',
      originHospitalId: '',
      destinationHospitalId: '',
    },
    incidentDetails: {
      arrivalDateTime: '',
      incidentDateTime: '',
      modeOfArrival: 'AMBULANCE',
      transferRequestDateTime: '',
      transferArrivalDateTime: '',
      chiefComplaint: '',
      mechanismOfInjury: 'MOTOR_VEHICLE_ACCIDENT',
      primarySurveyFindings: '',
      additionalNotes: '',
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
  });
  const [stepErrors, setStepErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open) {
      setActiveStep(0);
      setError(null);
      setLoading(false);
      setStepErrors({});
    }
  }, [open]);

  const handleStepDataChange = (stepData: any) => {
    setFormData(prev => ({ ...prev, ...stepData }));
  };

  const handleNext = () => {
    setActiveStep(prev => prev + 1);
  };

  const handleBack = () => {
    setActiveStep(prev => prev - 1);
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError(null);

      // Validate the complete form
      const validationErrors = validateTraumaCaseForm(formData);
      if (validationErrors.length > 0) {
        setError(validationErrors.join(', '));
        return;
      }

      // Prepare data for submission
      const submitData: CreateTraumaCaseData = {
        patientInfo: formData.patientInfo,
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

      await onSubmit(submitData);
      onClose();
    } catch (err) {
      setError('Failed to create trauma case. Please try again.');
      console.error('Error creating trauma case:', err);
    } finally {
      setLoading(false);
    }
  };

  const isStepValid = (stepIndex: number): boolean => {
    switch (stepIndex) {
      case 0: // Patient Info
        return !!(formData.patientInfo.firstName && formData.patientInfo.lastName && 
                 formData.patientInfo.nationalId && formData.patientInfo.dateOfBirth &&
                 formData.patientInfo.originHospitalId);
      case 1: // Incident Details
        return !!(formData.incidentDetails.arrivalDateTime && 
                 formData.incidentDetails.modeOfArrival && 
                 formData.incidentDetails.mechanismOfInjury);
      case 2: // Vitals Assessment
        return true; // Optional step
      case 3: // Injury Assessment
        return true; // Optional step
      case 4: // Disposition
        return !!(formData.disposition.edDisposition);
      default:
        return false;
    }
  };

  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return (
          <PatientInfoStep
            data={formData.patientInfo}
            onChange={(data) => handleStepDataChange({ patientInfo: { ...formData.patientInfo, ...data } })}
            errors={stepErrors}
          />
        );
      case 1:
        return (
          <IncidentDetailsStep
            data={formData.incidentDetails}
            onChange={(data) => handleStepDataChange({ incidentDetails: { ...formData.incidentDetails, ...data } })}
            errors={stepErrors}
          />
        );
      case 2:
        return (
          <VitalsAssessmentStep
            data={formData.vitalsAssessment}
            onChange={(data) => handleStepDataChange({ vitalsAssessment: { ...formData.vitalsAssessment, ...data } })}
            errors={stepErrors}
          />
        );
      case 3:
        return (
          <InjuryAssessmentStep
            data={formData.injuryAssessment}
            onChange={(data) => handleStepDataChange({ injuryAssessment: { ...formData.injuryAssessment, ...data } })}
            errors={stepErrors}
          />
        );
      case 4:
        return (
          <DispositionStep
            data={formData.disposition}
            onChange={(data) => handleStepDataChange({ disposition: { ...formData.disposition, ...data } })}
            errors={stepErrors}
          />
        );
      default:
        return null;
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={2}>
            <span>🚨</span>
            <span>Create Trauma Case</span>
          </Box>
        </DialogTitle>
        
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
            {TRAUMA_FORM_STEPS.map((step) => (
              <Step key={step.id}>
                <StepLabel icon={step.icon}>
                  {step.label}
                </StepLabel>
              </Step>
            ))}
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
              disabled={!isStepValid(activeStep) || loading}
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
    </LocalizationProvider>
  );
};

export default CreateTraumaCaseDialog;