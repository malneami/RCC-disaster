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
import IncidentDetailsStep from './forms/IncidentDetailsStep';
import VitalsAssessmentStep from './forms/VitalsAssessmentStep';
import InjuryAssessmentStep from './forms/InjuryAssessmentStep';
import DispositionStep from './forms/DispositionStep';

// Types and constants
import { TraumaCase, UpdateTraumaCaseData } from '../../../services/traumaService';
import { TRAUMA_FORM_STEPS } from '../constants/traumaConstants';
import { validateTraumaCaseForm } from '../helpers/traumaHelpers';
import { useAuth } from '../../../contexts/AuthContext';

interface EditTraumaCaseDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (id: string, data: any) => Promise<void>;
  traumaCase: TraumaCase | null;
}

const EditTraumaCaseDialog: React.FC<EditTraumaCaseDialogProps> = ({
  open,
  onClose,
  onSubmit,
  traumaCase,
}) => {
  const { user } = useAuth();
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    patientInfo: {
      firstName: '',
      lastName: '',
      nationalId: '',
      age: undefined as number | undefined,
      gender: 'MALE' as 'MALE' | 'FEMALE',
      phoneNumber: '',
      address: '',
      emergencyContact: '',
      emergencyPhone: '',
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

  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';

  useEffect(() => {
    if (traumaCase && open) {
      setActiveStep(0);
      setError(null);
      setLoading(false);
      setStepErrors({});
      
      // Convert trauma case data to form structure (exactly like creation form)
      setFormData({
        patientInfo: {
          firstName: traumaCase.patient?.firstName || '',
          lastName: traumaCase.patient?.lastName || '',
          nationalId: traumaCase.patient?.nationalId || '',
          age: traumaCase.patient?.age || undefined,
          gender: (traumaCase.patient?.gender as 'MALE' | 'FEMALE') || ('MALE' as 'MALE' | 'FEMALE'),
          phoneNumber: traumaCase.patient?.phoneNumber || '',
          address: (traumaCase.patient as any)?.address || '',
          emergencyContact: (traumaCase.patient as any)?.emergencyContact || '',
          emergencyPhone: (traumaCase.patient as any)?.emergencyPhone || '',
          medicalHistory: (traumaCase.patient as any)?.medicalHistory || '',
          allergies: (traumaCase.patient as any)?.allergies || '',
          medications: (traumaCase.patient as any)?.medications || '',
          originHospitalId: traumaCase.originHospitalId || '',
          destinationHospitalId: traumaCase.destinationHospitalId || '',
        },
        incidentDetails: {
          arrivalDateTime: traumaCase.arrivalDateTime ? new Date(traumaCase.arrivalDateTime).toISOString().slice(0, 16) : '',
          incidentDateTime: traumaCase.incidentDateTime ? new Date(traumaCase.incidentDateTime).toISOString().slice(0, 16) : '',
          modeOfArrival: traumaCase.modeOfArrival || 'AMBULANCE',
          transferRequestDateTime: traumaCase.transferRequestDateTime ? new Date(traumaCase.transferRequestDateTime).toISOString().slice(0, 16) : '',
          transferArrivalDateTime: traumaCase.transferArrivalDateTime ? new Date(traumaCase.transferArrivalDateTime).toISOString().slice(0, 16) : '',
          chiefComplaint: traumaCase.chiefComplaint || '',
          mechanismOfInjury: traumaCase.mechanismOfInjury || 'MOTOR_VEHICLE_ACCIDENT',
          primarySurveyFindings: traumaCase.primarySurveyFindings || '',
          additionalNotes: traumaCase.additionalNotes || '',
        },
        vitalsAssessment: {
          vitalSigns: {
            temperature: traumaCase.vitalSigns?.temperature || 0,
            heartRate: traumaCase.vitalSigns?.heartRate || 0,
            bloodPressure: traumaCase.vitalSigns?.bloodPressure || '',
            oxygenSaturation: traumaCase.vitalSigns?.oxygenSaturation || 0,
            respiratoryRate: traumaCase.vitalSigns?.respiratoryRate || 0,
          },
          glasgowComaScale: traumaCase.glasgowComaScale || 15,
          systolicBloodPressure: traumaCase.systolicBloodPressure || 0,
          respiratoryRate: traumaCase.respiratoryRate || 0,
          additionalVitalSigns: traumaCase.additionalVitalSigns || '',
        },
        injuryAssessment: {
          headAndNeckInjury: traumaCase.headAndNeckInjury || '1 - No Injury: - No injury',
          faceInjury: traumaCase.faceInjury || '1 - No Injury: - No injury',
          chestInjury: traumaCase.chestInjury || '1 - No Injury: - No injury',
          abdomenInjury: traumaCase.abdomenInjury || '1 - No Injury: - No injury',
          extremitiesInjury: traumaCase.extremitiesInjury || '1 - No Injury: - No injury',
          externalInjury: traumaCase.externalInjury || '1 - No Injury: - No injury',
        },
        disposition: {
          edDisposition: traumaCase.edDisposition || 'DISCHARGE',
          disposition: {
            dischargeInstructions: traumaCase.disposition?.dischargeInstructions || '',
            followUpRequired: traumaCase.disposition?.followUpRequired || false,
            followUpDate: traumaCase.disposition?.followUpDate || '',
            medicationsPrescribed: traumaCase.disposition?.medicationsPrescribed || '',
            restrictions: traumaCase.disposition?.restrictions || '',
          },
        },
      });
    }
  }, [traumaCase, open]);

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
    if (!traumaCase) return;

    try {
      setLoading(true);
      setError(null);

      // Validate the complete form
      const validationErrors = validateTraumaCaseForm(formData);
      if (validationErrors.length > 0) {
        setError(validationErrors.join(', '));
        return;
      }

      // Prepare data for submission (exactly like creation form)
      const submitData: UpdateTraumaCaseData = {
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

      // Add patient info for admins only (exclude hospital IDs as they're already at top level)
      if (isAdmin) {
        const { originHospitalId, destinationHospitalId, ...patientInfoOnly } = formData.patientInfo;
        submitData.patientInfo = patientInfoOnly;
      }

      await onSubmit(traumaCase.id, submitData);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to update trauma case');
      console.error('Error updating trauma case:', err);
    } finally {
      setLoading(false);
    }
  };

  const isStepValid = (stepIndex: number): boolean => {
    switch (stepIndex) {
      case 0: // Patient Info
        return !!(formData.patientInfo.firstName && formData.patientInfo.lastName && 
                 formData.patientInfo.nationalId && formData.patientInfo.age &&
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
            isAdmin={isAdmin}
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

  if (!traumaCase) return null;

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={2}>
            <span>✏️</span>
            <span>Edit Trauma Case - {traumaCase.patient?.firstName} {traumaCase.patient?.lastName}</span>
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

export default EditTraumaCaseDialog;