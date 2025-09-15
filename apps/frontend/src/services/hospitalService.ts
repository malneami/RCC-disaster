import { apiClient } from './apiClient';

export interface Hospital {
  id: string;
  name: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  
  // Bed Capacity - ICU
  icuBeds: number;
  icuBedsAvailable: number;
  
  // Bed Capacity - PICU
  picuBeds: number;
  picuBedsAvailable: number;
  
  // Bed Capacity - Male/Female
  maleBeds: number;
  maleBedsAvailable: number;
  femaleBeds: number;
  femaleBedsAvailable: number;
  
  // Bed Capacity - Pediatric
  pediatricBeds: number;
  pediatricBedsAvailable: number;
  
  // Bed Capacity - Standard
  standardBeds: number;
  standardBedsAvailable: number;
  
  // Services
  hasStemiService: boolean;
  hasStrokeService: boolean;
  hasTraumaService: boolean;
  hasThrombolysis: boolean;
  hasThrombectomy: boolean;
  
  // Hospital Info
  cluster: string;
  status: string;
  contactPhone?: string;
  contactEmail?: string;
  
  // Update tokens
  updateToken?: string;
  updateTokenExpiry?: string;
  
  // Emergency Department
  emergencyDeptStatus: string;
  
  // NICU
  nicuBeds: number;
  nicuBedsAvailable: number;
  
  // Specialized Services
  hasStrokeUnit: boolean;
  traumaLevel: string;
  hasCardiologyCenter: boolean;
  
  // Audit fields
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

export interface CapacityAlert {
  hospitalId: string;
  hospitalName: string;
  type: 'CRITICAL' | 'WARNING';
  availabilityPercentage: number;
  availableBeds: number;
  totalBeds: number;
}

export interface CreateHospitalDto {
  name: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  icuBeds?: number;
  icuBedsAvailable?: number;
  picuBeds?: number;
  picuBedsAvailable?: number;
  maleBeds?: number;
  maleBedsAvailable?: number;
  femaleBeds?: number;
  femaleBedsAvailable?: number;
  pediatricBeds?: number;
  pediatricBedsAvailable?: number;
  standardBeds?: number;
  standardBedsAvailable?: number;
  hasStemiService?: boolean;
  hasStrokeService?: boolean;
  hasTraumaService?: boolean;
  cluster?: string;
  status?: string;
  contactPhone?: string;
  contactEmail?: string;
  emergencyDeptStatus?: string;
  nicuBeds?: number;
  nicuBedsAvailable?: number;
  hasStrokeUnit?: boolean;
  traumaLevel?: string;
  hasCardiologyCenter?: boolean;
}

export interface UpdateHospitalCapacityDto {
  icuBeds?: number;
  icuBedsAvailable?: number;
  picuBeds?: number;
  picuBedsAvailable?: number;
  maleBeds?: number;
  maleBedsAvailable?: number;
  femaleBeds?: number;
  femaleBedsAvailable?: number;
  pediatricBeds?: number;
  pediatricBedsAvailable?: number;
  standardBeds?: number;
  standardBedsAvailable?: number;
  nicuBeds?: number;
  nicuBedsAvailable?: number;
  updateSource?: string;
  updatedBy?: string;
}

export interface CriticalCase {
  id: string;
  patientName: string;
  caseType: 'STEMI' | 'STROKE' | 'TRAUMA';
  severity: 'CRITICAL' | 'URGENT' | 'STABLE';
  status: 'ACTIVE' | 'RESOLVED' | 'TRANSFERRED';
  startTime: string;
  lastUpdate: string;
  description: string;
  hospitalId: string;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  hospital?: {
    id: string;
    name: string;
    status: string;
  };
  createdBy?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

export interface HospitalTicket {
  id: string;
  title: string;
  description: string;
  type: 'TRANSFER' | 'CONSULTATION' | 'RESOURCE' | 'SYSTEM';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  hospitalId: string;
  createdById: string;
  assignedToId?: string;
  createdAt: string;
  updatedAt: string;
  hospital?: {
    id: string;
    name: string;
    status: string;
  };
  createdBy?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  assignedTo?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

export interface HospitalFilters {
  status?: string;
  cluster?: string;
  hasStemiService?: boolean;
  hasStrokeService?: boolean;
  hasTraumaService?: boolean;
}

class HospitalService {
  async getAllHospitals(filters: HospitalFilters = {}): Promise<Hospital[]> {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== '' && value !== null) {
        params.append(key, value.toString());
      }
    });

    const response = await apiClient.get(`/hospitals?${params.toString()}`);
    return response.data;
  }

  async getHospitalById(id: string): Promise<Hospital> {
    const response = await apiClient.get(`/hospitals/${id}`);
    return response.data;
  }

  async createHospital(data: CreateHospitalDto): Promise<Hospital> {
    const response = await apiClient.post('/hospitals', data);
    return response.data;
  }

  async updateHospital(id: string, data: Partial<CreateHospitalDto>): Promise<Hospital> {
    const response = await apiClient.put(`/hospitals/${id}`, data);
    return response.data;
  }

  async deleteHospital(id: string): Promise<void> {
    await apiClient.delete(`/hospitals/${id}`);
  }

  async updateHospitalCapacity(id: string, data: UpdateHospitalCapacityDto): Promise<Hospital> {
    const response = await apiClient.put(`/hospitals/${id}/capacity`, data);
    return response.data;
  }

  async getCapacityAlerts(): Promise<CapacityAlert[]> {
    const response = await apiClient.get('/hospitals/alerts');
    return response.data;
  }

  async bulkUpdateCapacity(updates: Array<{ hospitalId: string; capacity: UpdateHospitalCapacityDto }>): Promise<any[]> {
    const response = await apiClient.post('/hospitals/bulk/capacity', updates);
    return response.data;
  }

  // Critical Cases API
  async getCriticalCases(hospitalId?: string): Promise<CriticalCase[]> {
    const params = hospitalId ? `?hospitalId=${hospitalId}` : '';
    const response = await apiClient.get(`/critical-cases${params}`);
    return response.data;
  }

  async getActiveCriticalCases(hospitalId?: string): Promise<CriticalCase[]> {
    const params = hospitalId ? `?hospitalId=${hospitalId}` : '';
    const response = await apiClient.get(`/critical-cases/active${params}`);
    return response.data;
  }

  async getCriticalCaseStats(hospitalId?: string): Promise<any> {
    const params = hospitalId ? `?hospitalId=${hospitalId}` : '';
    const response = await apiClient.get(`/critical-cases/stats${params}`);
    return response.data;
  }

  // Hospital Tickets API
  async getHospitalTickets(hospitalId?: string): Promise<HospitalTicket[]> {
    const params = new URLSearchParams();
    if (hospitalId) {
      params.append('hospitalId', hospitalId);
    }
    params.append('sortBy', 'createdAt');
    params.append('sortOrder', 'desc');
    
    const response = await apiClient.get(`/hospital-tickets?${params}`);
    // Handle paginated response
    return response.data?.data || response.data || [];
  }

  // Get transfer tickets for a hospital (as destination)
  async getTransferTicketsForHospital(hospitalId?: string): Promise<any[]> {
    if (!hospitalId) return [];
    const params = new URLSearchParams({
      destinationHospitalId: hospitalId,
      sortBy: 'createdAt',
      sortOrder: 'desc',
    });
    const response = await apiClient.get(`/tickets?${params}`);
    // Handle paginated response
    return response.data?.data || response.data || [];
  }

  async getOpenHospitalTickets(hospitalId?: string): Promise<HospitalTicket[]> {
    const params = hospitalId ? `?hospitalId=${hospitalId}` : '';
    const response = await apiClient.get(`/hospital-tickets/open${params}`);
    // Handle paginated response
    return response.data?.data || response.data || [];
  }

  async getHospitalTicketStats(hospitalId?: string): Promise<any> {
    const params = hospitalId ? `?hospitalId=${hospitalId}` : '';
    const response = await apiClient.get(`/hospital-tickets/stats${params}`);
    return response.data;
  }

  // Get critical cases (STEMI/Stroke) for a hospital
  async getCriticalCasesForHospital(hospitalId: string): Promise<any[]> {
    try {
      const params = new URLSearchParams({
        hospitalId: hospitalId,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      });
      const response = await apiClient.get(`/tickets/critical-cases?${params}`);
      return response.data?.data || response.data || [];
    } catch (error) {
      console.error('Error fetching critical cases for hospital:', error);
      return [];
    }
  }
}

export const hospitalService = new HospitalService();
