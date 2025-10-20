import { useQuery } from 'react-query';
import { ticketService } from '../services/ticketService';

export interface CriticalCase {
  id: string;
  pathway: string;
  priority: string;
  status: string;
  chiefComplaint: string;
  createdAt: string;
  estimatedArrival?: string;
  emsAssignmentStatus?: string;
  acknowledgedAt?: string;
  acknowledgedBy?: {
    firstName: string;
    lastName: string;
    email: string;
    role: string;
  };
  patient?: {
    firstName?: string;
    lastName?: string;
    mrn?: string;
  };
  originHospital?: {
    id: string;
    name: string;
  };
  destinationHospital?: {
    id: string;
    name: string;
  };
}

export interface CriticalCasesFilters {
  hospitalId?: string;
}

export const useCriticalCases = (filters?: CriticalCasesFilters) => {
  return useQuery<CriticalCase[], Error>(
    ['critical-cases', filters],
    async () => {
      try {
        // Build query parameters for ticket service
        const queryParams: any = {};
        
        // Add hospital filter if provided
        if (filters?.hospitalId && filters.hospitalId !== 'all') {
          // Note: The ticket service might need to be updated to support hospital filtering
          // For now, we'll filter on the client side
        }
        
        // Fetch all tickets with STEMI and Stroke pathways
        const ticketsResponse = await ticketService.getTickets(1, 1000, queryParams);
        
        const allTickets = ticketsResponse.data || [];
        
        // Filter for STEMI and Stroke cases only
        let criticalCases = allTickets.filter((ticket: any) => 
          ticket.pathway === 'STEMI' || ticket.pathway === 'STROKE'
        );

        // Apply hospital filter on client side if provided
        if (filters?.hospitalId && filters.hospitalId !== 'all') {
          criticalCases = criticalCases.filter((ticket: any) => {
            const isFromHospital = ticket.originHospitalId === filters.hospitalId;
            const isToHospital = ticket.destinationHospitalId === filters.hospitalId;
            return isFromHospital || isToHospital;
          });
        }

        // Transform to our interface
        return criticalCases.map((ticket: any): CriticalCase => ({
          id: ticket.id,
          pathway: ticket.pathway,
          priority: ticket.priority,
          status: ticket.status,
          chiefComplaint: ticket.chiefComplaint,
          createdAt: ticket.createdAt,
          estimatedArrival: ticket.estimatedArrival,
          emsAssignmentStatus: ticket.emsAssignmentStatus,
          acknowledgedAt: ticket.acknowledgedAt,
          acknowledgedBy: ticket.acknowledgedBy,
          patient: ticket.patient,
          originHospital: ticket.originHospital,
          destinationHospital: ticket.destinationHospital,
        }));
      } catch (error) {
        console.error('Error fetching critical cases:', error);
        throw error;
      }
    },
    {
      refetchInterval: 10000, // Refetch every 10 seconds for real-time updates
      staleTime: 5000, // Consider data stale after 5 seconds
    }
  );
};