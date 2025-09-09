import React from 'react';
import MultiStepDialog from '../../../../components/Common/MultiStepDialog';
import { useMedicalRecordForm } from '../../hooks/useMedicalRecordForm';
import { createMedicalRecordStepsConfig } from '../../config/medicalRecordFormSteps';
import { MedicalRecord } from '../../../../services/medicalRecordService';

interface MedicalRecordFormDialogProps {
  open: boolean;
  patientId: string;
  medicalRecord?: MedicalRecord | null;
  onClose: () => void;
  onMedicalRecordCreated?: (medicalRecord: MedicalRecord) => void;
  onMedicalRecordUpdated?: (medicalRecord: MedicalRecord) => void;
}

const MedicalRecordFormDialog: React.FC<MedicalRecordFormDialogProps> = ({
  open,
  patientId,
  medicalRecord,
  onClose,
  onMedicalRecordCreated,
  onMedicalRecordUpdated,
}) => {
  const {
    formData,
    loading,
    handleDataChange,
    handleComplete,
  } = useMedicalRecordForm({
    patientId,
    medicalRecord,
    open,
    onMedicalRecordCreated,
    onMedicalRecordUpdated,
  });

  const steps = createMedicalRecordStepsConfig(
    formData,
    handleDataChange,
    !!medicalRecord
  );

  const handleClose = () => {
    if (!loading) {
      onClose();
    }
  };

  return (
    <MultiStepDialog
      open={open}
      title={medicalRecord ? 'Edit Medical Record' : 'Add Medical Record'}
      steps={steps}
      onClose={handleClose}
      onComplete={handleComplete}
      loading={loading}
      maxWidth="md"
      fullWidth
    />
  );
};

export default MedicalRecordFormDialog;
