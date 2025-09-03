import { useState, useEffect } from 'react';
import { medicalRecordService, CreateMedicalRecordData, MedicalRecord, MedicalRecordType } from '../../../services/medicalRecordService';

export interface UseMedicalRecordFormProps {
  patientId: string;
  medicalRecord?: MedicalRecord | null;
  open: boolean;
  onMedicalRecordCreated?: (medicalRecord: MedicalRecord) => void;
  onMedicalRecordUpdated?: (medicalRecord: MedicalRecord) => void;
}

const initializeFormData = (medicalRecord: MedicalRecord | null): CreateMedicalRecordData => {
  if (medicalRecord) {
    return {
      patientId: medicalRecord.patientId,
      recordType: medicalRecord.recordType,
      title: medicalRecord.title,
      description: medicalRecord.description || '',
      diagnosis: medicalRecord.diagnosis || '',
      treatment: medicalRecord.treatment || '',
      medications: medicalRecord.medications || '',
      testResults: medicalRecord.testResults || '',
      attachments: medicalRecord.attachments || '',
      recordDate: medicalRecord.recordDate,
    };
  }

  return {
    patientId: '',
    recordType: 'CONSULTATION',
    title: '',
    description: '',
    diagnosis: '',
    treatment: '',
    medications: '',
    testResults: '',
    attachments: '',
    recordDate: new Date().toISOString().split('T')[0],
  };
};

export const useMedicalRecordForm = ({
  patientId,
  medicalRecord,
  open,
  onMedicalRecordCreated,
  onMedicalRecordUpdated,
}: UseMedicalRecordFormProps) => {
  const [formData, setFormData] = useState<CreateMedicalRecordData>(initializeFormData(medicalRecord));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize form with medical record data if editing
  useEffect(() => {
    if (open) {
      const initialData = initializeFormData(medicalRecord);
      initialData.patientId = patientId;
      setFormData(initialData);
    }
  }, [medicalRecord, open, patientId]);

  const handleDataChange = (newData: Partial<CreateMedicalRecordData>) => {
    setFormData(prev => ({
      ...prev,
      ...newData,
    }));
    
    if (error) {
      setError(null);
    }
  };

  const handleComplete = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!formData.title || !formData.recordType || !formData.recordDate) {
        setError('Title, record type, and record date are required.');
        return;
      }

      const submitData = {
        ...formData,
        recordDate: new Date(formData.recordDate).toISOString(),
      };

      if (medicalRecord) {
        const updatedMedicalRecord = await medicalRecordService.updateMedicalRecord(
          medicalRecord.id,
          submitData
        );
        onMedicalRecordUpdated?.(updatedMedicalRecord);
      } else {
        const newMedicalRecord = await medicalRecordService.createMedicalRecord(submitData);
        onMedicalRecordCreated?.(newMedicalRecord);
      }
    } catch (err) {
      console.error('Error saving medical record:', err);
      setError('Failed to save medical record. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return {
    formData,
    loading,
    error,
    handleDataChange,
    handleComplete,
  };
};
