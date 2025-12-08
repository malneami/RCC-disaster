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
} from '@mui/material';

import { StrokeCase, CreateStrokeCaseData } from '../../../services/strokeService';
import { useAuth } from '../../../contexts/AuthContext';
import PatientStep from './CreateStrokeCase/PatientStep';
import AssessmentStep from './CreateStrokeCase/AssessmentStep';
import DiagnosisStep from './CreateStrokeCase/DiagnosisStep';
import TreatmentStep from './CreateStrokeCase/TreatmentStep';
import ReviewStep from './CreateStrokeCase/ReviewStep';

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
  'Review & Submit'
];

const EditStrokeCaseDialog: React.FC<EditStrokeCaseDialogProps> = ({
  open,
  onClose,
  strokeCase,
  onUpdate,
}) => {
  const { } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [activeStep, setActiveStep] = useState(0);
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
      gender: 'MALE',
      phoneNumber: '',
      email: '',
    },
  });

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
        mrn: '',
        age: undefined,
        gender: 'MALE',
        phoneNumber: '',
        email: '',
      },
    });
    setActiveStep(0);
    setError(null);
    setSuccess(null);
    setValidationErrors({});
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
    if (strokeCase && open) {
      setFormData({
        // Basic Information
        originHospitalId: strokeCase.originHospitalId,
        destinationHospitalId: strokeCase.destinationHospitalId,
        strokeType: strokeCase.strokeType,
        currentStatus: strokeCase.currentStatus,
        chiefComplaint: strokeCase.chiefComplaint || '',
        
        // Patient Information
        patientInfo: {
          firstName: strokeCase.patient?.firstName || '',
          lastName: strokeCase.patient?.lastName || '',
          nationalId: strokeCase.patient?.nationalId || '',
          mrn: strokeCase.patient?.mrn || '',
          age: strokeCase.patient?.age || undefined,
          gender: (strokeCase.patient?.gender as 'MALE' | 'FEMALE') || 'MALE',
          phoneNumber: strokeCase.patient?.phoneNumber || '',
          email: strokeCase.patient?.email || '',
        },
        
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
      });
      setActiveStep(0);
      setError(null);
      setSuccess(null);
      setValidationErrors({});
      setLoading(false);
    }
  }, [strokeCase?.id, open]);

  const updateFormData = (field: keyof CreateStrokeCaseData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
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
    if (!strokeCase) return;

    try {
      setLoading(true);
      setError(null);
      setSuccess(null);
      
      // Prepare update data with patientInfo included
      const { patientInfo, ...otherData } = formData;
      
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
          <Stepper activeStep={activeStep} alternativeLabel>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
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