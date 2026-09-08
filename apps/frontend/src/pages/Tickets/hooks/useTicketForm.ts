import { useState, useEffect } from 'react';
import { CreateTicketData } from '../../../services/ticketService';

interface UseTicketFormProps {
  open: boolean;
  onSubmit: (data: CreateTicketData) => void;
}

export const useTicketForm = ({ open, onSubmit }: UseTicketFormProps) => {
  const [formData, setFormData] = useState<Partial<CreateTicketData>>({
    priority: 'MEDIUM',
    pathway: 'GENERAL',
    isEmergency: false,
    requiresBlood: false,
    requiresSpecialist: false,
    requiredResources: {
      icu: false,
      ventilator: false,
      cardiology: false,
      neurology: false,
      trauma: false,
      nicu: false,
      picu: false,
    },
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (open) {
      setFormData({
        priority: 'MEDIUM',
        pathway: 'GENERAL',
        isEmergency: false,
        requiresBlood: false,
        requiresSpecialist: false,
        requiredResources: {
          icu: false,
          ventilator: false,
          cardiology: false,
          neurology: false,
          trauma: false,
          nicu: false,
          picu: false,
        },
      });
      setError(null);
    }
  }, [open]);

  const handleDataChange = (data: Partial<CreateTicketData>) => {
    setFormData(prev => ({
      ...prev,
      ...data,
    }));
    
    // Clear error when user makes changes
    if (error) {
      setError(null);
    }
  };

  const validateForm = (): boolean => {
    if (!formData.patientId) {
      setError('Patient selection is required');
      return false;
    }

    if (!formData.originHospitalId) {
      setError('Origin hospital is required');
      return false;
    }

    if (formData.pathway === 'MATERNAL') {
      const ob = formData.obMaternalData;
      if (!ob?.gestationalAgeWeeks || ob.gestationalAgeWeeks < 1 || ob.gestationalAgeWeeks > 45) {
        setError('Gestational age (1–45 weeks) is required for OB pathway');
        return false;
      }
      if (!ob?.activationLevel) {
        setError('Activation level is required for OB pathway');
        return false;
      }
    }

    if (formData.pathway === 'NEUROSURGICAL') {
      if (!formData.neurosurgicalData?.severity) {
        setError('Neurosurgical severity (Red / Orange) is required');
        return false;
      }
    }

    return true;
  };

  const handleComplete = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Prepare the final data — omit empty strings (Nest IsDateString rejects "")
      const raw: CreateTicketData = {
        ...formData,
        patientId: formData.patientId!,
        originHospitalId: formData.originHospitalId!,
        priority: formData.priority!,
        pathway: formData.pathway!,
        bedAssignment: formData.bedAssignment,
        neurosurgicalData:
          formData.pathway === 'NEUROSURGICAL'
            ? {
                severity: formData.neurosurgicalData?.severity || 'ORANGE',
              }
            : undefined,
        obMaternalData:
          formData.pathway === 'MATERNAL' && formData.obMaternalData
            ? {
                ...formData.obMaternalData,
                activationLevel: formData.obMaternalData.activationLevel || 'MATERNAL_RED',
                expectedDeliveryMode: formData.obMaternalData.expectedDeliveryMode || 'PENDING',
                ambulanceType: formData.obMaternalData.ambulanceType || 'ALS',
              }
            : undefined,
      } as CreateTicketData;

      const finalData: CreateTicketData = { ...raw };
      for (const key of Object.keys(finalData) as (keyof CreateTicketData)[]) {
        if (finalData[key] === '' || finalData[key] === null) {
          delete finalData[key];
        }
      }

      // Ensure emsContactTime is properly formatted as ISO-8601 string
      if (finalData.emsContactTime && !finalData.emsContactTime.includes('Z')) {
        const date = new Date(finalData.emsContactTime);
        if (!isNaN(date.getTime())) {
          finalData.emsContactTime = date.toISOString();
        } else {
          delete finalData.emsContactTime;
        }
      }

      // Drop empty optional date fields
      for (const key of ['emsContactTime', 'triageTime', 'symptomOnsetTime'] as const) {
        const v = finalData[key];
        if (!v || (typeof v === 'string' && !v.trim())) {
          delete finalData[key];
        }
      }

      await onSubmit(finalData);
    } catch (err: any) {
      console.error('Error creating ticket:', err);
      const apiMessage =
        err?.response?.data?.message ||
        (Array.isArray(err?.response?.data?.message)
          ? err.response.data.message.join(', ')
          : null);
      setError(
        typeof apiMessage === 'string'
          ? apiMessage
          : Array.isArray(apiMessage)
            ? apiMessage.join(', ')
            : 'Failed to create ticket. Please try again.',
      );
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
