import { useState, useEffect } from 'react';
import { Ticket, UpdateTicketData } from '../../../services/ticketService';

interface UseTicketEditFormProps {
  ticket: Ticket | null;
  open: boolean;
  onSubmit: (data: UpdateTicketData) => void;
}

export const useTicketEditForm = ({ ticket, open, onSubmit }: UseTicketEditFormProps) => {
  const [formData, setFormData] = useState<Partial<UpdateTicketData>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize form data when ticket changes
  useEffect(() => {
    if (ticket && open) {
      const parseJsonField = (field: string | undefined) => {
        if (!field) return null;
        try {
          return JSON.parse(field);
        } catch {
          return field;
        }
      };

      setFormData({
        destinationHospitalId: ticket.destinationHospitalId || '',
        priority: ticket.priority,
        pathway: ticket.pathway,
        vitals: parseJsonField(ticket.vitals),
        diagnostics: parseJsonField(ticket.diagnostics),
        treatmentPlan: ticket.treatmentPlan || '',
        emsContactTime: ticket.emsContactTime ? new Date(ticket.emsContactTime).toISOString().slice(0, 16) : '',
        actualArrival: ticket.actualArrival ? new Date(ticket.actualArrival).toISOString().slice(0, 16) : '',
        transportMode: ticket.transportMode || '',
        emsUnit: ticket.emsUnit || '',
        notes: ticket.notes || '',
        isEmergency: ticket.isEmergency,
        requiresBlood: ticket.requiresBlood,
        requiresSpecialist: ticket.requiresSpecialist,
        requiredResources: parseJsonField(ticket.requiredResources) || {},
      });
      setError(null);
    }
  }, [ticket, open]);

  const handleDataChange = (data: Partial<UpdateTicketData>) => {
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
      const finalData: UpdateTicketData = {
        ...formData,
        emsContactTime: formData.emsContactTime ? new Date(formData.emsContactTime).toISOString() : undefined,
        actualArrival: formData.actualArrival ? new Date(formData.actualArrival).toISOString() : undefined,
      };

      await onSubmit(finalData);
    } catch (err) {
      console.error('Error updating ticket:', err);
      setError('Failed to update ticket. Please try again.');
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
