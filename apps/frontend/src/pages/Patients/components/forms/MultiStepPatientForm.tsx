import React from 'react';
import { Alert } from '@mui/material';
import { Patient, CreatePatientData } from '../../../../services/patientService';
import MultiStepDialog from '../../../../components/common/MultiStepDialog';
import PersonalInfoStep from '../PatientFormSteps/PersonalInfoStep';
import ContactInfoStep from '../PatientFormSteps/ContactInfoStep';
import MedicalInfoStep from '../PatientFormSteps/MedicalInfoStep';
import InsurancePrivacyStep from '../PatientFormSteps/InsurancePrivacyStep';
import ReviewStep from '../PatientFormSteps/ReviewStep';
import { usePatientForm } from '../../hooks/usePatientForm';

interface MultiStepPatientFormProps {
  open: boolean;
  patient?: Patient | null;
  onClose: () => void;
  onPatientCreated: (patient: Patient) => void;
  onPatientUpdated: (patient: Patient) => void;
  onViewDuplicate?: (patient: Patient) => void;
}

const MultiStepPatientForm: React.FC<MultiStepPatientFormProps> = ({
  open,
  patient,
  onClose,
  onPatientCreated,
  onPatientUpdated,
  onViewDuplicate,
}) => {
  const { formData, error, handleDataChange, handleComplete, loading } = usePatientForm({
    patient,
    open,
    onPatientCreated,
    onPatientUpdated,
  });

  // Helper function to create steps configuration
  const createStepsConfig = (
    formData: CreatePatientData,
    onDataChange: (data: Partial<CreatePatientData>) => void,
    isEditing: boolean
  ) => [
    {
      label: 'Personal Info',
      content: (
        <PersonalInfoStep
          formData={formData}
          onDataChange={onDataChange}
          onViewDuplicate={onViewDuplicate}
          isEditing={isEditing}
        />
      ),
    },
    {
      label: 'Contact Info',
      content: (
        <ContactInfoStep
          formData={formData}
          onDataChange={onDataChange}
        />
      ),
    },
    {
      label: 'Medical Info',
      content: (
        <MedicalInfoStep
          formData={formData}
          onDataChange={onDataChange}
        />
      ),
    },
    {
      label: 'Insurance & Privacy',
      content: (
        <InsurancePrivacyStep
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

  const steps = createStepsConfig(formData, handleDataChange, !!patient);

  return (
    <>
      <MultiStepDialog
        open={open}
        title={patient ? 'Edit Patient' : 'Create New Patient'}
        steps={steps}
        onClose={onClose}
        onComplete={handleComplete}
        maxWidth="lg"
        loading={loading}
      />
      
      {error && (
        <Alert severity="error" sx={{ position: 'fixed', top: 16, right: 16, zIndex: 9999 }}>
          {error}
        </Alert>
      )}
    </>
  );
};

export default MultiStepPatientForm;
