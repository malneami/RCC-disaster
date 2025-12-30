import { useState, useEffect } from 'react';
import { Ticket, UpdateTicketData } from '../../../services/ticketService';
import { BedAssignmentFormData } from '../../Trauma/types/traumaTypes';

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

      let bedAssignment: BedAssignmentFormData | undefined;
      
      const allCases = [
        ...(ticket.traumaCases || []),
        ...(ticket.strokeCases || []),
        ...(ticket.stemiCases || []),
      ];
      
      const caseWithBed = allCases.find(c => c.assignedBed);
      if (caseWithBed?.assignedBed) {
        let hospitalType: 'origin' | 'destination' | undefined;
        if (ticket.originHospitalId && caseWithBed.assignedBed.hospital.id === ticket.originHospitalId) {
          hospitalType = 'origin';
        } else if (ticket.destinationHospitalId && caseWithBed.assignedBed.hospital.id === ticket.destinationHospitalId) {
          hospitalType = 'destination';
        }
        
        bedAssignment = {
          bedId: caseWithBed.assignedBed.id,
          hospitalId: caseWithBed.assignedBed.hospital.id,
          hospitalType,
          unitId: caseWithBed.assignedBed.unit.id,
          bedNumber: caseWithBed.assignedBed.bedNumber,
          location: caseWithBed.assignedBed.location,
          assignedBed: {
            id: caseWithBed.assignedBed.id,
            bedNumber: caseWithBed.assignedBed.bedNumber,
            unitName: caseWithBed.assignedBed.unit.name,
            hospitalName: caseWithBed.assignedBed.hospital.name,
          },
        };
      } else if (ticket.patientBeds && ticket.patientBeds.length > 0) {
        const patientBed = ticket.patientBeds[0]; 
        
        let hospitalType: 'origin' | 'destination' | undefined;
        if (ticket.originHospitalId && patientBed.hospital.id === ticket.originHospitalId) {
          hospitalType = 'origin';
        } else if (ticket.destinationHospitalId && patientBed.hospital.id === ticket.destinationHospitalId) {
          hospitalType = 'destination';
        }
        
        bedAssignment = {
          bedId: patientBed.id,
          hospitalId: patientBed.hospital.id,
          hospitalType,
          unitId: patientBed.unit.id,
          bedNumber: patientBed.bedNumber,
          location: patientBed.location,
          assignedBed: {
            id: patientBed.id,
            bedNumber: patientBed.bedNumber,
            unitName: patientBed.unit.name,
            hospitalName: patientBed.hospital.name,
          },
        };
      }

      setFormData({
        originHospitalId: ticket.originHospitalId || '',
        destinationHospitalId: ticket.destinationHospitalId || '',
        priority: ticket.priority,
        pathway: ticket.pathway,
        vitals: parseJsonField(ticket.vitals),
        diagnostics: parseJsonField(ticket.diagnostics),
        treatmentPlan: ticket.treatmentPlan || '',
        emsContactTime: ticket.emsContactTime ? ticket.emsContactTime: '',
        actualArrival: ticket.actualArrival ? new Date(ticket.actualArrival).toISOString().slice(0, 16) : '',
        transportMode: ticket.transportMode || '',
        emsUnit: ticket.emsUnit || '',
        notes: ticket.notes || '',
        isEmergency: ticket.isEmergency,
        requiresBlood: ticket.requiresBlood,
        requiresSpecialist: ticket.requiresSpecialist,
        requiredResources: parseJsonField(ticket.requiredResources) || {},
        bedAssignment,
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
        bedAssignment: formData.bedAssignment,
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
