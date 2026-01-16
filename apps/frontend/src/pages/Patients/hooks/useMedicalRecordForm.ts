import { useState, useEffect } from 'react';
import { medicalRecordService, CreateMedicalRecordData, MedicalRecord } from '../../../services/medicalRecordService';
import { useMutation } from 'react-query';

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
      attachments: [],
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
    attachments: [],
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
  const [formData, setFormData] = useState<CreateMedicalRecordData>(initializeFormData(medicalRecord || null));
  const [error, setError] = useState<string | null>(null);

  // Initialize form with medical record data if editing
  useEffect(() => {
    if (open) {
      const initialData = initializeFormData(medicalRecord || null);
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

  const { mutateAsync: saveRecord, isLoading } = useMutation(
    async () => {
      if (!formData.title || !formData.recordType || !formData.recordDate) {
        throw new Error('Title, record type, and record date are required.');
      }

      // Extract attachments with raw files for separate upload
      const attachmentsWithFiles = formData.attachments?.filter(att => att.file) || [];

      const submitData = {
        ...formData,
        attachments: undefined, // Don't send attachments in JSON body
        recordDate: new Date(formData.recordDate).toISOString(),
      };

      let resultRecord: MedicalRecord;

      if (medicalRecord) {
        resultRecord = await medicalRecordService.updateMedicalRecord(
          medicalRecord.id,
          submitData
        );
      } else {
        resultRecord = await medicalRecordService.createMedicalRecord(submitData);
      }

      // Upload new attachments
      for (const attachment of attachmentsWithFiles) {
        if (attachment.file) {
          await medicalRecordService.uploadAttachment(resultRecord.id, attachment.file);

        }
      }

      return resultRecord;
    },
    {
      onSuccess: (data) => {
        if (medicalRecord) {
          onMedicalRecordUpdated?.(data);
        } else {
          onMedicalRecordCreated?.(data);
        }
      },
      onError: (err: any) => {
        console.error('Error saving medical record:', err);
        setError(err.message || 'Failed to save medical record. Please try again.');
      }
    }
  );

  const handleComplete = async () => {
    setError(null);

    await saveRecord();

  };

  return {
    formData,
    loading: isLoading,
    error,
    handleDataChange,
    handleComplete,
  };
};
