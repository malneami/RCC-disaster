import React from 'react';
import { Alert } from '@mui/material';
import { CreateTicketData } from '../../../services/ticketService';
import MultiStepDialog from '../../../components/common/MultiStepDialog';
import {
  PatientSelectionStep,
  HospitalSelectionStep,
  MedicalInfoStep,
  TransportInfoStep,
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
          onDataChange={onDataChange}
        />
      ),
    },
    {
      label: 'Hospital Information',
      content: (
        <HospitalSelectionStep
          formData={formData}
          onDataChange={onDataChange}
        />
      ),
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
