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

    if (!formData.chiefComplaint) {
      setError('Chief complaint is required');
      return false;
    }

    if (!formData.symptoms?.symptoms || formData.symptoms.symptoms.length === 0) {
      setError('At least one symptom is required');
      return false;
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

      // Prepare the final data
      const finalData: CreateTicketData = {
        ...formData,
        patientId: formData.patientId!,
        originHospitalId: formData.originHospitalId!,
        chiefComplaint: formData.chiefComplaint!,
        symptoms: formData.symptoms!,
        priority: formData.priority!,
        pathway: formData.pathway!,
      } as CreateTicketData;

      // Ensure emsContactTime is properly formatted as ISO-8601 string
      if (finalData.emsContactTime && !finalData.emsContactTime.includes('Z')) {
        const date = new Date(finalData.emsContactTime);
        if (!isNaN(date.getTime())) {
          finalData.emsContactTime = date.toISOString();
        }
      }

      await onSubmit(finalData);
    } catch (err) {
      console.error('Error creating ticket:', err);
      setError('Failed to create ticket. Please try again.');
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
