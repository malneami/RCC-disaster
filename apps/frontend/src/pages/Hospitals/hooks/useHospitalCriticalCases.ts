import { useQuery } from 'react-query';
import { hospitalService } from '../../../services/hospitalService';

export interface HospitalCriticalCase {
  id: string;
  ticketNumber: string;
  pathway: 'GENERAL' | 'STEMI' | 'STROKE' | 'TRAUMA';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' | 'EMERGENCY';
  status: 'PENDING' | 'ASSIGNED' | 'IN_TRANSPORT' | 'COMPLETED' | 'CANCELLED';
  createdAt: string;
  updatedAt: string;
  patient: {
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    gender: string;
    mrn?: string;
  };
  originHospital: {
    name: string;
    status: string;
  };
  destinationHospital?: {
    name: string;
    status: string;
  };
  chiefComplaint: string;
  estimatedArrival?: string;
  actualArrival?: string;
  transportMode?: string;
  emsUnit?: string;
  isEmergency: boolean;
  requiresBlood: boolean;
  requiresSpecialist: boolean;
}

export const useHospitalCriticalCases = (hospitalId: string) => {
  return useQuery<HospitalCriticalCase[]>({
    queryKey: ['hospital-critical-cases', hospitalId],
    queryFn: async () => {
      try {
        // Fetch transfer tickets for this hospital (as destination)
        const transferTickets = await hospitalService.getTransferTicketsForHospital(hospitalId);
        
        // Filter for STEMI and Stroke cases only
        const criticalCases = transferTickets.filter((ticket: any) => 
          ticket.pathway === 'STEMI' || ticket.pathway === 'STROKE'
        );

        // Sort by newest first (createdAt desc)
        criticalCases.sort((a: any, b: any) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );

        // Transform to our interface
        return criticalCases.map((ticket: any): HospitalCriticalCase => ({
          id: ticket.id,
          ticketNumber: ticket.ticketNumber,
          pathway: ticket.pathway,
          priority: ticket.priority,
          status: ticket.status,
          createdAt: ticket.createdAt,
          updatedAt: ticket.updatedAt,
          patient: ticket.patient,
          originHospital: ticket.originHospital,
          destinationHospital: ticket.destinationHospital,
          chiefComplaint: ticket.chiefComplaint,
          estimatedArrival: ticket.estimatedArrival,
          actualArrival: ticket.actualArrival,
          transportMode: ticket.transportMode,
          emsUnit: ticket.emsUnit,
          isEmergency: ticket.isEmergency,
          requiresBlood: ticket.requiresBlood,
          requiresSpecialist: ticket.requiresSpecialist,
        }));
      } catch (error) {
        console.error('Error fetching hospital critical cases:', error);
        // Return mock data for development
        return getMockHospitalCriticalCases(hospitalId);
      }
    },
    enabled: !!hospitalId,
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 30 * 1000, // Refetch every 30 seconds for real-time updates
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
};

// Mock data for development
const getMockHospitalCriticalCases = (hospitalId: string): HospitalCriticalCase[] => {
  const now = new Date();
  const thirtyMinutesAgo = new Date(now.getTime() - 30 * 60 * 1000);
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

  const mockData = [
    {
      id: `mock-stemi-${hospitalId}-1`,
      ticketNumber: 'T-2024-001',
      pathway: 'STEMI',
      priority: 'CRITICAL',
      status: 'IN_TRANSPORT',
      createdAt: thirtyMinutesAgo.toISOString(), // Newer case
      updatedAt: now.toISOString(),
      patient: {
        firstName: 'John',
        lastName: 'Smith',
        dateOfBirth: '1980-05-15',
        gender: 'Male',
        mrn: 'MRN123456',
      },
      originHospital: {
        name: 'City General Hospital',
        status: 'ACTIVE',
      },
      destinationHospital: {
        name: 'Regional Medical Center',
        status: 'ACTIVE',
      },
      chiefComplaint: 'Chest pain with ST elevation on ECG',
      estimatedArrival: new Date(now.getTime() + 30 * 60 * 1000).toISOString(),
      transportMode: 'Ambulance',
      emsUnit: 'EMS-001',
      isEmergency: true,
      requiresBlood: false,
      requiresSpecialist: true,
    },
    {
      id: `mock-stroke-${hospitalId}-1`,
      ticketNumber: 'T-2024-002',
      pathway: 'STROKE',
      priority: 'HIGH',
      status: 'ASSIGNED',
      createdAt: oneHourAgo.toISOString(), // Older case
      updatedAt: now.toISOString(),
      patient: {
        firstName: 'Sarah',
        lastName: 'Johnson',
        dateOfBirth: '1975-08-22',
        gender: 'Female',
        mrn: 'MRN789012',
      },
      originHospital: {
        name: 'Community Hospital',
        status: 'ACTIVE',
      },
      destinationHospital: {
        name: 'Stroke Center',
        status: 'ACTIVE',
      },
      chiefComplaint: 'Sudden onset left-sided weakness and speech difficulty',
      estimatedArrival: new Date(now.getTime() + 45 * 60 * 1000).toISOString(),
      transportMode: 'Helicopter',
      emsUnit: 'HELI-002',
      isEmergency: true,
      requiresBlood: false,
      requiresSpecialist: true,
    },
  ];

  // Sort by newest first (createdAt desc)
  return mockData.sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  ) as HospitalCriticalCase[];
};
