import { apiClient } from '../../../services/apiClient';

export interface CriticalCase {
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

export const criticalCaseApi = {
  async getCriticalCases(): Promise<CriticalCase[]> {
    try {
      const params = new URLSearchParams({
        sortBy: 'createdAt',
        sortOrder: 'desc',
      });
      const response = await apiClient.get(`/tickets/critical-cases?${params}`);
      return response.data?.data || response.data || [];
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
        estimatedArrival: new Date(now.getTime() + 30 * 60 * 1000).toISOString(),
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
