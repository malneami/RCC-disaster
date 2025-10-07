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

export const useCriticalCases = () => {
  return useQuery<CriticalCase[]>(
    'critical-cases',
    async () => {
      try {
        // Fetch all tickets with STEMI and Stroke pathways
        const ticketsResponse = await ticketService.getTickets(1, 1000, {
          // No specific filters - get all tickets
        });
        
        const allTickets = ticketsResponse.data || [];
        
        // Filter for STEMI and Stroke cases only
        const criticalCases = allTickets.filter((ticket: any) => 
          ticket.pathway === 'STEMI' || ticket.pathway === 'STROKE'
        );

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
          patient: ticket.patient,
          originHospital: ticket.originHospital,
          destinationHospital: ticket.destinationHospital,
        }));
      } catch (error) {
        console.error('Error fetching critical cases:', error);
        // Return mock data for development
        return getMockCriticalCases();
      }
    },
    {
      refetchInterval: 10000, // Refetch every 10 seconds for real-time updates
      staleTime: 5000, // Consider data stale after 5 seconds
    }
  );
};

// Mock data for development
const getMockCriticalCases = (): CriticalCase[] => {
  const now = new Date();
  const thirtyMinutesAgo = new Date(now.getTime() - 30 * 60 * 1000);
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
  // Create an overdue STEMI case (130 minutes ago - past the 120 minute limit)
  const overdueStemi = new Date(now.getTime() - 130 * 60 * 1000);
  // Create a severely overdue case for immediate testing (150 minutes ago)
  const severelyOverdueStemi = new Date(now.getTime() - 150 * 60 * 1000);

  return [
    {
      id: 'mock-stemi-severely-overdue',
      pathway: 'STEMI',
      priority: 'CRITICAL',
      status: 'PENDING',
      chiefComplaint: 'Chest pain with ST elevation - SEVERELY OVERDUE (150 min)',
      createdAt: severelyOverdueStemi.toISOString(),
      estimatedArrival: new Date(now.getTime() + 30 * 60 * 1000).toISOString(),
      patient: {
        firstName: 'Test',
        lastName: 'Patient',
        mrn: 'TEST001',
      },
      originHospital: {
        id: 'test-hospital',
        name: 'Test Hospital',
      },
      destinationHospital: {
        id: 'destination-hospital',
        name: 'Destination Hospital',
      },
    },
    {
      id: 'mock-stemi-overdue',
      pathway: 'STEMI',
      priority: 'CRITICAL',
      status: 'PENDING',
      chiefComplaint: 'Chest pain with ST elevation on ECG - OVERDUE',
      createdAt: overdueStemi.toISOString(),
      estimatedArrival: new Date(now.getTime() + 30 * 60 * 1000).toISOString(),
      patient: {
        firstName: 'علي',
        lastName: 'مجرشي',
        mrn: '4212818',
      },
      originHospital: {
        id: 'al-tuwal-general',
        name: 'Al-Tuwal General Hospital',
      },
      destinationHospital: {
        id: 'ahad-al-masarhah',
        name: 'Ahad Al-Masarhah General Hospital',
      },
    },
    {
      id: 'mock-stemi-1',
      pathway: 'STEMI',
      priority: 'CRITICAL',
      status: 'PENDING',
      chiefComplaint: 'Chest pain with ST elevation on ECG',
      createdAt: thirtyMinutesAgo.toISOString(),
      estimatedArrival: new Date(now.getTime() + 30 * 60 * 1000).toISOString(),
      patient: {
        firstName: 'علي',
        lastName: 'مجرشي',
        mrn: '4212818',
      },
      originHospital: {
        id: 'al-tuwal-general',
        name: 'Al-Tuwal General Hospital',
      },
      destinationHospital: {
        id: 'ahad-al-masarhah',
        name: 'Ahad Al-Masarhah General Hospital',
      },
    },
    {
      id: 'mock-stroke-1',
      pathway: 'STROKE',
      priority: 'HIGH',
      status: 'ASSIGNED',
      chiefComplaint: 'Sudden onset left-sided weakness and speech difficulty',
      createdAt: oneHourAgo.toISOString(),
      estimatedArrival: new Date(now.getTime() + 45 * 60 * 1000).toISOString(),
      patient: {
        firstName: 'Sarah',
        lastName: 'Johnson',
        mrn: 'MRN789012',
      },
      originHospital: {
        id: 'community-hospital',
        name: 'Community Hospital',
      },
      destinationHospital: {
        id: 'stroke-center',
        name: 'Stroke Center',
      },
    },
  ];
};
