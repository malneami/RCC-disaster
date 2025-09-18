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
  const [activeStep, setActiveStep] = useState(0);
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

  useEffect(() => {
    if (strokeCase) {
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
        srcaCallTime: strokeCase.srcaCallTime,
        timeOfSymptomOnset: strokeCase.timeOfSymptomOnset,
        lastKnownNormal: strokeCase.lastKnownNormal,
        timeOfRegistration: strokeCase.timeOfRegistration,
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
    }
  }, [strokeCase]);

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
          />
        );
      case 1:
        return (
          <AssessmentStep
            formData={formData}
            updateFormData={updateFormData}
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

  const isStepValid = (step: number): boolean => {
    switch (step) {
      case 0:
        return !!(
          formData.patientInfo?.firstName && 
          formData.patientInfo?.lastName && 
          formData.patientInfo?.nationalId && 
          formData.originHospitalId && 
          formData.strokeType
        );
      case 1:
        return true; // Assessment fields are mostly optional
      case 2:
        return true; // Diagnosis fields are mostly optional
      case 3:
        return true; // Treatment fields are mostly optional
      case 4:
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
    if (!strokeCase) return;

    try {
      setLoading(true);
      setError(null);
      
      // Filter out patientInfo and other fields that shouldn't be in the update request
      const { patientInfo, ...updateData } = formData;
      
      // Also filter out any empty string values and convert them to undefined
      const cleanedData = Object.entries(updateData).reduce((acc, [key, value]) => {
        if (value !== '' && value !== null && value !== undefined) {
          acc[key] = value;
        }
        return acc;
      }, {} as any);
      
      console.log('Sending update data:', cleanedData);
      await onUpdate(strokeCase.id, cleanedData);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to update stroke case');
      console.error('Error updating stroke case:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setError(null);
    setActiveStep(0);
    onClose();
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
            disabled={!isStepValid(activeStep)}
          >
            Next
          </Button>
        ) : (
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={loading || !isStepValid(activeStep)}
          >
            {loading ? 'Updating...' : 'Update'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default EditStrokeCaseDialog;