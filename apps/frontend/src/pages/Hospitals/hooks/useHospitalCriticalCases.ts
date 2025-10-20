import { useQuery } from 'react-query';
import { hospitalService } from '../../../services/hospitalService';
import { ticketService } from '../../../services/ticketService';

export interface HospitalCriticalCase {
  id: string;
  ticketNumber: string;
  pathway: 'GENERAL' | 'STEMI' | 'STROKE' | 'TRAUMA';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' | 'EMERGENCY';
  status: 'PENDING' | 'ASSIGNED' | 'IN_TRANSPORT' | 'COMPLETED' | 'CANCELLED';
  createdAt: string;
  updatedAt: string;
  acknowledgedAt?: string;
  acknowledgedBy?: {
    firstName: string;
    lastName: string;
    email: string;
    role: string;
  };
  patient: {
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    gender: string;
    mrn?: string;
  };
  originHospital: {
    id: string;
    name: string;
    status: string;
  };
  destinationHospital?: {
    id: string;
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
        // Fetch transfer tickets where this hospital is the destination
        const destinationTickets = await hospitalService.getTransferTicketsForHospital(hospitalId);
        
        // Fetch transfer tickets where this hospital is the origin
        const originTicketsResponse = await ticketService.getTickets(1, 100, {
          originHospitalId: hospitalId,
        });
        const originTickets = originTicketsResponse.data || [];
        
        // Combine both sets of tickets
        const allTickets = [...destinationTickets, ...originTickets];
        
        // Remove duplicates based on ticket ID
        const uniqueTickets = allTickets.filter((ticket, index, self) => 
          index === self.findIndex(t => t.id === ticket.id)
        );
        
        // Filter for STEMI and Stroke cases only
        const criticalCases = uniqueTickets.filter((ticket: any) => 
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
          acknowledgedAt: ticket.acknowledgedAt,
          acknowledgedBy: ticket.acknowledgedBy,
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
  const twoHoursAgo = new Date(now.getTime() - 120 * 60 * 1000);

  const mockData = [
    {
      id: `mock-stemi-dest-${hospitalId}-1`,
      ticketNumber: 'T-2024-001',
      pathway: 'STEMI',
      priority: 'CRITICAL',
      status: 'IN_TRANSPORT',
      createdAt: thirtyMinutesAgo.toISOString(), // Newer case - destination
      updatedAt: now.toISOString(),
      patient: {
        firstName: 'John',
        lastName: 'Smith',
        dateOfBirth: '1980-05-15',
        gender: 'Male',
        mrn: 'MRN123456',
      },
      originHospital: {
        id: 'city-general-hospital',
        name: 'City General Hospital',
        status: 'ACTIVE',
      },
      destinationHospital: {
        id: 'regional-medical-center',
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
      id: `mock-stroke-origin-${hospitalId}-1`,
      ticketNumber: 'T-2024-002',
      pathway: 'STROKE',
      priority: 'HIGH',
      status: 'ASSIGNED',
      createdAt: oneHourAgo.toISOString(), // Origin case
      updatedAt: now.toISOString(),
      patient: {
        firstName: 'Sarah',
        lastName: 'Johnson',
        dateOfBirth: '1975-08-22',
        gender: 'Female',
        mrn: 'MRN789012',
      },
      originHospital: {
        id: 'community-hospital',
        name: 'Community Hospital',
        status: 'ACTIVE',
      },
      destinationHospital: {
        id: 'stroke-center',
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
    {
      id: `mock-stemi-origin-${hospitalId}-2`,
      ticketNumber: 'T-2024-003',
      pathway: 'STEMI',
      priority: 'EMERGENCY',
      status: 'PENDING',
      createdAt: twoHoursAgo.toISOString(), // Older origin case
      updatedAt: now.toISOString(),
      patient: {
        firstName: 'Michael',
        lastName: 'Brown',
        dateOfBirth: '1965-03-10',
        gender: 'Male',
        mrn: 'MRN345678',
      },
      originHospital: {
        id: 'regional-medical-center',
        name: 'Regional Medical Center',
        status: 'ACTIVE',
      },
      destinationHospital: {
        id: 'cardiac-center',
        name: 'Cardiac Center',
        status: 'ACTIVE',
      },
      chiefComplaint: 'Acute myocardial infarction with cardiogenic shock',
      estimatedArrival: new Date(now.getTime() + 20 * 60 * 1000).toISOString(),
      transportMode: 'Ambulance',
      emsUnit: 'EMS-003',
      isEmergency: true,
      requiresBlood: true,
      requiresSpecialist: true,
    },
  ];

  // Sort by newest first (createdAt desc)
  return mockData.sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  ) as HospitalCriticalCase[];
};
