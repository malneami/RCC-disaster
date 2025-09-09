/**
 * Edit Trauma Case Dialog Component
 * Multi-step form for editing trauma cases
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
import { UpdateTraumaCaseData, TraumaCase } from '../../../services/traumaService';
import { TRAUMA_FORM_STEPS } from '../constants/traumaConstants';
import { validateTraumaCaseForm } from '../helpers/traumaHelpers';

interface EditTraumaCaseDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (id: string, data: UpdateTraumaCaseData) => Promise<void>;
  traumaCase: TraumaCase | null;
}

const EditTraumaCaseDialog: React.FC<EditTraumaCaseDialogProps> = ({
  open,
  onClose,
  onSubmit,
  traumaCase,
}) => {
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<any>({
    patientInfo: {
      originHospitalId: '',
      destinationHospitalId: '',
    },
    incidentDetails: {
      arrivalDateTime: new Date().toISOString(),
      incidentDateTime: '',
      modeOfArrival: 'AMBULANCE',
      transferRequestDateTime: '',
      transferArrivalDateTime: '',
      transferDurationMinutes: 0,
      chiefComplaint: '',
      mechanismOfInjury: 'BLUNT',
    },
    vitalsAssessment: {
      vitalSigns: {},
      glasgowComaScale: 15,
      systolicBloodPressure: 0,
      respiratoryRate: 0,
      additionalVitalSigns: '',
    },
    injuryAssessment: {
      headAndNeckInjury: '',
      faceInjury: '',
      chestInjury: '',
      abdomenInjury: '',
      extremitiesInjury: '',
      externalInjury: '',
      primarySurveyFindings: '',
    },
    disposition: {
      edDisposition: 'DISCHARGE',
      additionalNotes: '',
      disposition: {},
    },
  });

  // Initialize form data when trauma case changes
  useEffect(() => {
    if (traumaCase && open) {
      setFormData({
        patientInfo: {
          originHospitalId: traumaCase.originHospitalId || '',
          destinationHospitalId: traumaCase.destinationHospitalId || '',
        },
        incidentDetails: {
          arrivalDateTime: traumaCase.arrivalDateTime || new Date().toISOString(),
          incidentDateTime: traumaCase.incidentDateTime || '',
          modeOfArrival: traumaCase.modeOfArrival || 'AMBULANCE',
          transferRequestDateTime: traumaCase.transferRequestDateTime || '',
          transferArrivalDateTime: traumaCase.transferArrivalDateTime || '',
          transferDurationMinutes: traumaCase.transferDurationMinutes || 0,
          chiefComplaint: traumaCase.chiefComplaint || '',
          mechanismOfInjury: traumaCase.mechanismOfInjury || 'BLUNT',
        },
        vitalsAssessment: {
          vitalSigns: traumaCase.vitalSigns || {},
          glasgowComaScale: traumaCase.glasgowComaScale || 15,
          systolicBloodPressure: traumaCase.systolicBloodPressure || 0,
          respiratoryRate: traumaCase.respiratoryRate || 0,
          additionalVitalSigns: traumaCase.additionalVitalSigns || '',
        },
        injuryAssessment: {
          headAndNeckInjury: traumaCase.headAndNeckInjury || '',
          faceInjury: traumaCase.faceInjury || '',
          chestInjury: traumaCase.chestInjury || '',
          abdomenInjury: traumaCase.abdomenInjury || '',
          extremitiesInjury: traumaCase.extremitiesInjury || '',
          externalInjury: traumaCase.externalInjury || '',
          primarySurveyFindings: traumaCase.primarySurveyFindings || '',
        },
        disposition: {
          edDisposition: traumaCase.edDisposition || 'DISCHARGE',
          additionalNotes: traumaCase.additionalNotes || '',
          disposition: traumaCase.disposition || {},
        },
      });
      setActiveStep(0);
      setError(null);
    }
  }, [traumaCase, open]);

  const handleNext = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleReset = () => {
    setActiveStep(0);
    setFormData({
      patientInfo: {
        originHospitalId: '',
        destinationHospitalId: '',
      },
      incidentDetails: {
        arrivalDateTime: new Date().toISOString(),
        incidentDateTime: '',
        modeOfArrival: 'AMBULANCE',
        transferRequestDateTime: '',
        transferArrivalDateTime: '',
        transferDurationMinutes: 0,
        chiefComplaint: '',
        mechanismOfInjury: 'BLUNT',
      },
      vitalsAssessment: {
        vitalSigns: {},
        glasgowComaScale: 15,
        systolicBloodPressure: 0,
        respiratoryRate: 0,
        additionalVitalSigns: '',
      },
      injuryAssessment: {
        headAndNeckInjury: '',
        faceInjury: '',
        chestInjury: '',
        abdomenInjury: '',
        extremitiesInjury: '',
        externalInjury: '',
        primarySurveyFindings: '',
      },
      disposition: {
        edDisposition: 'DISCHARGE',
        additionalNotes: '',
        disposition: {},
      },
    });
  };

  const handleSubmit = async () => {
    if (!traumaCase) return;

    try {
      setLoading(true);
      setError(null);

      // Validate form data
      const validationError = validateTraumaCaseForm(formData);
      if (validationError) {
        setError(validationError);
        return;
      }

      // Map form data to API format
      const submitData: UpdateTraumaCaseData = {
        originHospitalId: formData.patientInfo.originHospitalId,
        destinationHospitalId: formData.patientInfo.destinationHospitalId || undefined,
        arrivalDateTime: formData.incidentDetails.arrivalDateTime,
        incidentDateTime: formData.incidentDetails.incidentDateTime || undefined,
        modeOfArrival: formData.incidentDetails.modeOfArrival,
        transferRequestDateTime: formData.incidentDetails.transferRequestDateTime || undefined,
        transferArrivalDateTime: formData.incidentDetails.transferArrivalDateTime || undefined,
        transferDurationMinutes: formData.incidentDetails.transferDurationMinutes || undefined,
        chiefComplaint: formData.incidentDetails.chiefComplaint || undefined,
        mechanismOfInjury: formData.incidentDetails.mechanismOfInjury,
        vitalSigns: formData.vitalsAssessment.vitalSigns || undefined,
        glasgowComaScale: formData.vitalsAssessment.glasgowComaScale || undefined,
        systolicBloodPressure: formData.vitalsAssessment.systolicBloodPressure || undefined,
        respiratoryRate: formData.vitalsAssessment.respiratoryRate || undefined,
        additionalVitalSigns: formData.vitalsAssessment.additionalVitalSigns || undefined,
        headAndNeckInjury: formData.injuryAssessment.headAndNeckInjury || undefined,
        faceInjury: formData.injuryAssessment.faceInjury || undefined,
        chestInjury: formData.injuryAssessment.chestInjury || undefined,
        abdomenInjury: formData.injuryAssessment.abdomenInjury || undefined,
        extremitiesInjury: formData.injuryAssessment.extremitiesInjury || undefined,
        externalInjury: formData.injuryAssessment.externalInjury || undefined,
        primarySurveyFindings: formData.injuryAssessment.primarySurveyFindings || undefined,
        edDisposition: formData.disposition.edDisposition,
        additionalNotes: formData.disposition.additionalNotes || undefined,
        disposition: formData.disposition.disposition || undefined,
      };

      await onSubmit(traumaCase.id, submitData);
      onClose();
    } catch (err: any) {
      console.error('Error updating trauma case:', err);
      setError(err.response?.data?.message || 'Failed to update trauma case');
    } finally {
      setLoading(false);
    }
  };

  const isStepValid = (step: number): boolean => {
    switch (step) {
      case 0: // Patient Info
        return !!(formData.patientInfo?.originHospitalId);
      case 1: // Incident Details
        return !!(formData.incidentDetails?.arrivalDateTime && formData.incidentDetails?.modeOfArrival && formData.incidentDetails?.mechanismOfInjury);
      case 2: // Vitals Assessment
        return true; // All fields are optional
      case 3: // Injury Assessment
        return true; // All fields are optional
      case 4: // Disposition
        return !!(formData.disposition?.edDisposition);
      default:
        return false;
    }
  };

  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <PatientInfoStep
            data={formData.patientInfo}
            onChange={(data) => setFormData({ ...formData, patientInfo: data })}
          />
        );
      case 1:
        return (
          <IncidentDetailsStep
            data={formData.incidentDetails}
            onChange={(data) => setFormData({ ...formData, incidentDetails: data })}
          />
        );
      case 2:
        return (
          <VitalsAssessmentStep
            data={formData.vitalsAssessment}
            onChange={(data) => setFormData({ ...formData, vitalsAssessment: data })}
          />
        );
      case 3:
        return (
          <InjuryAssessmentStep
            data={formData.injuryAssessment}
            onChange={(data) => setFormData({ ...formData, injuryAssessment: data })}
          />
        );
      case 4:
        return (
          <DispositionStep
            data={formData.disposition}
            onChange={(data) => setFormData({ ...formData, disposition: data })}
            originHospitalId={formData.patientInfo?.originHospitalId}
            destinationHospitalId={formData.patientInfo?.destinationHospitalId}
          />
        );
      default:
        return null;
    }
  };

  if (!traumaCase) return null;

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: { minHeight: '600px' }
        }}
      >
        <DialogTitle>
          Edit Trauma Case - {traumaCase.patient?.firstName} {traumaCase.patient?.lastName}
        </DialogTitle>
        
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Stepper activeStep={activeStep} sx={{ mb: 3 }}>
            {TRAUMA_FORM_STEPS.map((label, index) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          <Box sx={{ minHeight: '400px' }}>
            {renderStepContent(activeStep)}
          </Box>
        </DialogContent>

        <DialogActions sx={{ p: 3 }}>
          <Button onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleReset} disabled={loading}>
            Reset
          </Button>
          <Button
            disabled={activeStep === 0}
            onClick={handleBack}
            disabled={loading}
          >
            Back
          </Button>
          {activeStep === TRAUMA_FORM_STEPS.length - 1 ? (
            <Button
              onClick={handleSubmit}
              variant="contained"
              disabled={loading || !isStepValid(activeStep)}
            >
              {loading ? <CircularProgress size={20} /> : 'Update Case'}
            </Button>
          ) : (
            <Button
              onClick={handleNext}
              variant="contained"
              disabled={!isStepValid(activeStep)}
            >
              Next
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </LocalizationProvider>
  );
};

export default EditTraumaCaseDialog;
