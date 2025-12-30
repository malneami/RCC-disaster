import React from 'react';
import { Alert } from '@mui/material';
import { CreateTicketData } from '../../../services/ticketService';
import MultiStepDialog from '../../../components/Common/MultiStepDialog';
import {
  PatientSelectionStep,
  HospitalSelectionStep,
  MedicalInfoStep,
  TransportInfoStep,
  BedAssignmentStep,
  ReviewStep,
} from './TicketFormSteps';
import { useTicketForm } from '../hooks/useTicketForm';

interface MultiStepTicketFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: CreateTicketData) => void;
}

const MultiStepTicketForm: React.FC<MultiStepTicketFormProps> = ({
  open,
  onClose,
  onSubmit,
}) => {
  const { formData, loading, error, handleDataChange, handleComplete } = useTicketForm({
    open,
    onSubmit,
  });

  // State for validation errors
  const [validationErrors, setValidationErrors] = React.useState<Record<number, string | null>>({});
  const [validationAttempted, setValidationAttempted] = React.useState<Record<number, boolean>>({});
  const [patientMode, setPatientMode] = React.useState<'select' | 'existing' | 'new'>('select');

  // Reset validation state when dialog opens/closes
  React.useEffect(() => {
    if (open) {
      setValidationErrors({});
      setValidationAttempted({});
      setPatientMode('select');
    }
  }, [open]);

  // Helper function to create steps configuration
  const createStepsConfig = (
    formData: Partial<CreateTicketData>,
    onDataChange: (data: Partial<CreateTicketData>) => void
  ) => [
    {
      label: 'Patient Selection',
      content: (
        <PatientSelectionStep
          formData={formData}
          onDataChange={(data) => {
            onDataChange(data);
            // Track patient mode for validation
            if (data.patientId) {
              setPatientMode('existing');
              // Clear validation error if patient is selected after validation was attempted
              if (validationAttempted[0]) {
                setValidationErrors(prev => ({ ...prev, 0: null }));
              }
            }
          }}
          validationError={validationAttempted[0] ? (validationErrors[0] || null) : null}
          onModeChange={setPatientMode}
        />
      ),
      validate: () => {
        // Mark validation as attempted
        setValidationAttempted(prev => ({ ...prev, 0: true }));
        
        // First check if user hasn't chosen a mode yet (still on selection screen)
        if (patientMode === 'select') {
          setValidationErrors(prev => ({ ...prev, 0: 'Please choose how you would like to add a patient first' }));
          return 'Please choose how you would like to add a patient first';
        }
        // Then check if user has chosen 'existing' mode but hasn't selected a patient
        if (patientMode === 'existing' && !formData.patientId) {
          setValidationErrors(prev => ({ ...prev, 0: 'Please select a patient to continue' }));
          return 'Please select a patient to continue';
        }
        // If patient is selected or mode is 'new' (creating new patient), validation passes
        setValidationErrors(prev => ({ ...prev, 0: null }));
        return true;
      },
    },
    {
      label: 'Hospital Information',
      content: (
        <HospitalSelectionStep
          formData={formData}
          onDataChange={(data) => {
            onDataChange(data);
            // Clear validation error if origin hospital is selected after validation was attempted
            if (data.originHospitalId && validationAttempted[1]) {
              setValidationErrors(prev => ({ ...prev, 1: null }));
            }
          }}
          validationError={validationAttempted[1] ? (validationErrors[1] || null) : null}
        />
      ),
      validate: () => {
        // Mark validation as attempted
        setValidationAttempted(prev => ({ ...prev, 1: true }));
        
        // Check if origin hospital is selected
        if (!formData.originHospitalId) {
          setValidationErrors(prev => ({ ...prev, 1: 'Please select an origin hospital to continue' }));
          return 'Please select an origin hospital to continue';
        }
        // Clear error if validation passes
        setValidationErrors(prev => ({ ...prev, 1: null }));
        return true;
      },
    },
    {
      label: 'Medical Information',
      content: (
        <MedicalInfoStep
          formData={formData}
          onDataChange={onDataChange}
        />
      ),
    },
    {
      label: 'Transport Details',
      content: (
        <TransportInfoStep
          formData={formData}
          onDataChange={onDataChange}
        />
      ),
    },
    {
      label: 'Bed Assignment',
      content: (
        <BedAssignmentStep
          formData={formData}
          onDataChange={onDataChange}
          patientId={formData.patientId}
          mode="create"
          originHospitalId={formData.originHospitalId}
          destinationHospitalId={formData.destinationHospitalId}
        />
      ),
    },
    {
      label: 'Review',
      content: (
        <ReviewStep
          formData={formData}
        />
      ),
    },
  ];

  const steps = createStepsConfig(formData, handleDataChange);

  return (
    <>
      <MultiStepDialog
        open={open}
        title="Create Transfer Ticket"
        steps={steps}
        onClose={onClose}
        onComplete={handleComplete}
        loading={loading}
        maxWidth="lg"
        fullWidth
      />
      
      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}
    </>
  );
};

export default MultiStepTicketForm;
