import { apiClient } from '../../../services/apiClient';

export interface CriticalCase {
  id: string;
  ticketNumber: string;
  pathway: 'GENERAL' | 'STEMI' | 'STROKE' | 'TRAUMA';
  priority: 'MEDIUM' | 'CRITICAL' | 'EMERGENCY';
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
  createdBy: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  estimatedArrival?: string;
  actualArrival?: string;
  transportMode?: string;
  emsUnit?: string;
  isEmergency: boolean;
  requiresBlood: boolean;
  requiresSpecialist: boolean;
  triageTime?: string;
  symptomOnset?: string;
}

export const criticalCaseApi = {
  async getCriticalCases(): Promise<CriticalCase[]> {
    try {
      const response = await apiClient.get('/tickets', {
        params: {
          status: 'PENDING,ASSIGNED,IN_TRANSPORT',
          pathway: 'STEMI,STROKE',
          limit: 100,
          sortBy: 'createdAt',
          sortOrder: 'desc'
        }
      });
      
      const tickets = response.data.data || [];
      
      return tickets.map((ticket: any) => {
          let triageTime = undefined;
          let symptomOnset = undefined;
          let chiefComplaint = '';

          if (ticket.pathway === 'STEMI' && ticket.stemiCases && ticket.stemiCases.length > 0) {
             triageTime = ticket.stemiCases[0].triageTime;
             symptomOnset = ticket.stemiCases[0].symptomOnset;
             chiefComplaint = ticket.stemiCases[0].presentingSymptoms || '';
          } else if (ticket.pathway === 'STROKE' && ticket.strokeCases && ticket.strokeCases.length > 0) {
             triageTime = ticket.strokeCases[0].timeOfTriage;
             symptomOnset = ticket.strokeCases[0].timeOfSymptomOnset || ticket.strokeCases[0].symptomOnset;
             chiefComplaint = ticket.strokeCases[0].chiefComplaint || '';
          }

          return {
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
            chiefComplaint: chiefComplaint || ticket.notes || '',
            createdBy: ticket.createdBy,
            estimatedArrival: ticket.estimatedArrival || ticket.transferArrivalDateTime,
            triageTime,
            symptomOnset,
            isEmergency: ticket.isEmergency,
            requiresBlood: ticket.requiresBlood,
            requiresSpecialist: ticket.requiresSpecialist,
            emsAssignmentStatus: ticket.emsAssignmentStatus,
            transportMode: ticket.transportMode,
            emsUnit: ticket.emsUnit,
          };
      });
    } catch (error) {
      console.error('Error fetching critical cases:', error);
      // Return mock data for development
      return this.getMockData();
    }
  },

  getMockData(): CriticalCase[] {
    const now = new Date();
    const thirtyMinutesAgo = new Date(now.getTime() - 30 * 60 * 1000);
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

    const mockData = [
      {
        id: 'mock-stemi-1',
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
        createdBy: {
          id: 'user-1',
          firstName: 'Dr. Sarah',
          lastName: 'Wilson',
          email: 'sarah.wilson@hospital.com',
        },
        estimatedArrival: new Date(now.getTime() + 30 * 60 * 1000).toISOString(),
        triageTime: new Date(now.getTime() - 15 * 60 * 1000).toISOString(), // 15 mins ago
        transportMode: 'Ambulance',
        emsUnit: 'EMS-001',
        isEmergency: true,
        requiresBlood: false,
        requiresSpecialist: true,
      },
      {
        id: 'mock-stroke-1',
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
        createdBy: {
          id: 'user-2',
          firstName: 'Dr. Michael',
          lastName: 'Chen',
          email: 'michael.chen@hospital.com',
        },
        estimatedArrival: new Date(now.getTime() + 45 * 60 * 1000).toISOString(),
        symptomOnset: new Date(now.getTime() - 90 * 60 * 1000).toISOString(), // 90 mins ago
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
    ) as CriticalCase[];
  },

  async getCriticalCaseById(id: string): Promise<CriticalCase | null> {
    try {
      const response = await apiClient.get(`/tickets/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching critical case:', error);
      return null;
    }
  },

  async updateCriticalCaseStatus(id: string, status: string): Promise<boolean> {
    try {
      await apiClient.patch(`/tickets/${id}`, { status });
      return true;
    } catch (error) {
      console.error('Error updating critical case status:', error);
      return false;
    }
  },
};
