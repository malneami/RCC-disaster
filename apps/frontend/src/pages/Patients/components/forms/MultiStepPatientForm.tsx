import React from 'react';
import { Alert } from '@mui/material';
import { Patient, CreatePatientData } from '../../../../services/patientService';
import MultiStepDialog from '../../../../components/Common/MultiStepDialog';
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
  const [selectedPatient, setSelectedPatient] = React.useState<Patient | null>(patient || null);
  
  // Reset selected patient when form opens/closes
  React.useEffect(() => {
    if (open) {
      setSelectedPatient(patient || null);
    }
  }, [open, patient]);
  
  const { formData, error, handleDataChange, handleComplete, loading } = usePatientForm({
    patient: selectedPatient,
    open,
    onPatientCreated,
    onPatientUpdated,
  });

  const handlePatientSelected = (patient: Patient) => {
    setSelectedPatient(patient);
  };

  // Helper function to create steps configuration
  const createStepsConfig = (
    formData: CreatePatientData,
    onDataChange: (data: Partial<CreatePatientData>) => void,
    isEditing: boolean
  ) => {
    const steps = [
      {
        label: 'Personal Info',
        content: (
          <PersonalInfoStep
            formData={formData}
            onDataChange={onDataChange}
            onViewDuplicate={onViewDuplicate}
            onPatientSelected={handlePatientSelected}
            isEditing={isEditing}
          />
        ),
      },
    ];

    // Only include Contact Info step in edit mode
    if (isEditing) {
      steps.push({
        label: 'Contact Info',
        content: (
          <ContactInfoStep
            formData={formData}
            onDataChange={onDataChange}
          />
        ),
      });
    }

    // Add remaining steps
    steps.push(
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
      }
    );

    return steps;
  };

  const steps = createStepsConfig(formData, handleDataChange, !!selectedPatient);

  return (
    <>
      <MultiStepDialog
        open={open}
        title={selectedPatient ? 'Edit Patient' : 'Create New Patient'}
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
