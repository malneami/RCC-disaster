import { apiClient } from '../../../services/apiClient';
import {
  Ambulance,
  EMSAssignment,
  DriverSchedule,
  EMSPerformanceMetric,
  EMSDashboardData,
  CreateAmbulanceDto,
  UpdateAmbulanceDto,
  CreateEMSAssignmentDto,
  UpdateEMSAssignmentDto,
  CreateDriverScheduleDto,
  UpdateDriverScheduleDto,
  AmbulanceFilter,
  AssignmentFilter,
  GPSTrackingFilter,
  PaginatedResponse,
} from '../types/ems';

class EMSService {
  private baseUrl = '';

  // Dashboard
  async getDashboardData(): Promise<EMSDashboardData> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/ems-dashboard`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      // Return mock data for development
      return {
        summary: {
          totalAmbulances: 0,
          activeAmbulances: 0,
          availableAmbulances: 0,
          activeAssignments: 0,
          activeSchedules: 0,
          totalAssignments: 0,
        },
        recentAlerts: [],
        timestamp: new Date().toISOString(),
      };
    }
  }

  // Ambulances
  async getAmbulances(filter?: AmbulanceFilter): Promise<PaginatedResponse<Ambulance>> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/ambulances`, { params: filter });
      // Handle both old array format (fallback) and new paginated format
      if (Array.isArray(response.data)) {
        return {
          data: response.data,
          total: response.data.length,
          page: 1,
          pageSize: response.data.length
        };
      }
      return {
        data: response.data.data || [],
        total: response.data.total || 0,
        page: response.data.page || 1,
        pageSize: response.data.limit || 10
      };
    } catch (error) {
      console.error('Failed to fetch ambulances:', error);
      return { data: [], total: 0, page: 1, pageSize: 10 };
    }
  }

  async getAllAmbulances(): Promise<Ambulance[]> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/ambulances`);
      if (Array.isArray(response.data)) {
        return response.data;
      }
      // If backend returns paginated response even without params (shouldn't happen with my fix, but safe fallback)
      return response.data.data || [];
    } catch (error) {
      console.error('Failed to fetch all ambulances:', error);
      return [];
    }
  }

  async getAmbulanceById(id: string): Promise<Ambulance> {
    const response = await apiClient.get(`${this.baseUrl}/ambulances/${id}`);
    return response.data;
  }

  async getAvailableAmbulances(): Promise<Ambulance[]> {
    const response = await apiClient.get(`${this.baseUrl}/ambulances/available`);
    return response.data;
  }

  async createAmbulance(data: CreateAmbulanceDto): Promise<Ambulance> {
    const response = await apiClient.post(`${this.baseUrl}/ambulances`, data);
    return response.data;
  }

  async updateAmbulance(id: string, data: UpdateAmbulanceDto): Promise<Ambulance> {
    const response = await apiClient.patch(`${this.baseUrl}/ambulances/${id}`, data);
    return response.data;
  }

  async deleteAmbulance(id: string): Promise<void> {
    await apiClient.delete(`${this.baseUrl}/ambulances/${id}`);
  }

  async updateAmbulanceLocation(vehicleImei: string, lat: number, lng: number, address?: string): Promise<Ambulance> {
    const response = await apiClient.patch(`${this.baseUrl}/ambulances/${vehicleImei}/location`, {
      lat,
      lng,
      address,
    });
    return response.data;
  }

  async getAmbulancesGPS(): Promise<any> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/ambulances/gps`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch GPS data:', error);
      throw error;
    }
  }

  async getRecommendedAmbulances(ticketId: string): Promise<any[]> {
    try {
      const response = await apiClient.get(`/tickets/${ticketId}/recommended-ambulances`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch recommended ambulances:', error);
      throw error;
    }
  }


  // EMS Assignments
  async getEMSAssignments(filter?: AssignmentFilter): Promise<EMSAssignment[]> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/ems-assignments`, { params: filter });
      return response.data || [];
    } catch (error) {
      console.error('Failed to fetch assignments:', error);
      return [];
    }
  }

  async getActiveAssignments(): Promise<EMSAssignment[]> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/ems-assignments/active`);
      return response.data || [];
    } catch (error) {
      console.error('Failed to fetch active assignments:', error);
      return [];
    }
  }

  async getAssignmentById(id: string): Promise<EMSAssignment> {
    const response = await apiClient.get(`${this.baseUrl}/ems-assignments/${id}`);
    return response.data;
  }

  async createEMSAssignment(data: CreateEMSAssignmentDto): Promise<EMSAssignment> {
    const response = await apiClient.post(`${this.baseUrl}/ems-assignments`, data);
    return response.data;
  }

  async updateEMSAssignment(id: string, data: UpdateEMSAssignmentDto): Promise<EMSAssignment> {
    const response = await apiClient.patch(`${this.baseUrl}/ems-assignments/${id}`, data);
    return response.data;
  }

  async deleteEMSAssignment(id: string): Promise<void> {
    await apiClient.delete(`${this.baseUrl}/ems-assignments/${id}`);
  }

  async startAssignment(id: string): Promise<EMSAssignment> {
    const response = await apiClient.post(`${this.baseUrl}/ems-assignments/${id}/start`);
    return response.data;
  }

  async markArrived(id: string): Promise<EMSAssignment> {
    const response = await apiClient.post(`${this.baseUrl}/ems-assignments/${id}/arrived`);
    return response.data;
  }

  async loadPatient(id: string): Promise<EMSAssignment> {
    const response = await apiClient.post(`${this.baseUrl}/ems-assignments/${id}/load-patient`);
    return response.data;
  }

  async markDeparted(id: string): Promise<EMSAssignment> {
    const response = await apiClient.post(`${this.baseUrl}/ems-assignments/${id}/departed`);
    return response.data;
  }

  async completeAssignment(id: string): Promise<EMSAssignment> {
    const response = await apiClient.post(`${this.baseUrl}/ems-assignments/${id}/complete`);
    return response.data;
  }

  async exportAssignment(id: string, format: 'PDF' | 'JSON' = 'PDF'): Promise<Blob> {
    const response = await apiClient.get(`${this.baseUrl}/ems-assignments/${id}/export`, {
      params: { format },
      responseType: 'blob',
    });
    return response.data;
  }

  // Driver Schedules
  async getDriverSchedules(): Promise<DriverSchedule[]> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/driver-schedules`);
      return response.data || [];
    } catch (error) {
      console.error('Failed to fetch schedules:', error);
      return [];
    }
  }

  async getActiveSchedules(): Promise<DriverSchedule[]> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/driver-schedules/active`);
      return response.data || [];
    } catch (error) {
      console.error('Failed to fetch active schedules:', error);
      return [];
    }
  }

  async getScheduleById(id: string): Promise<DriverSchedule> {
    const response = await apiClient.get(`${this.baseUrl}/schedules/${id}`);
    return response.data;
  }

  async createDriverSchedule(data: CreateDriverScheduleDto): Promise<DriverSchedule> {
    const response = await apiClient.post(`${this.baseUrl}/schedules`, data);
    return response.data;
  }

  async updateDriverSchedule(id: string, data: UpdateDriverScheduleDto): Promise<DriverSchedule> {
    const response = await apiClient.patch(`${this.baseUrl}/schedules/${id}`, data);
    return response.data;
  }

  async deleteDriverSchedule(id: string): Promise<void> {
    await apiClient.delete(`${this.baseUrl}/schedules/${id}`);
  }

  async startDriverBreak(id: string): Promise<DriverSchedule> {
    const response = await apiClient.patch(`${this.baseUrl}/schedules/${id}/start-break`);
    return response.data;
  }

  async endDriverBreak(id: string): Promise<DriverSchedule> {
    const response = await apiClient.patch(`${this.baseUrl}/schedules/${id}/end-break`);
    return response.data;
  }

  // GPS Tracking
  async getGPSTrackingLogs(filter?: GPSTrackingFilter): Promise<any[]> {
    const response = await apiClient.get(`${this.baseUrl}/tracking`, { params: filter });
    return response.data;
  }

  async getActiveAmbulanceLocations(): Promise<any[]> {
    const response = await apiClient.get(`${this.baseUrl}/tracking/active-locations`);
    return response.data;
  }

  async getAmbulanceLocationHistory(ambulanceId: string, hours?: number): Promise<any[]> {
    const response = await apiClient.get(`${this.baseUrl}/tracking/ambulance/${ambulanceId}/history`, {
      params: { hours },
    });
    return response.data;
  }

  async syncGPSTracking(): Promise<void> {
    await apiClient.post(`${this.baseUrl}/ambulance-tracking/sync`);
  }

  async getAmbulanceRoute(
    ambulanceId: string,
    options?: {
      startTime?: string;
      endTime?: string;
      limit?: number;
    }
  ): Promise<Array<{
    latitude: number;
    longitude: number;
    timestamp: string;
    speed?: number;
    direction?: number;
    distanceFromPrevious?: number;
    timeFromPrevious?: number;
  }>> {
    const url = `/ambulance-tracking/route/${encodeURIComponent(ambulanceId)}`;
    
    const response = await apiClient.get(url, {
      params: options,
    });
    // The backend returns { ambulanceId, ambulance, route: [...], totalPoints, ... }
    // Extract the route array from the response
    if (response.data && response.data.route) {
      return response.data.route;
    }
    return response.data;
  }

  async getSuspiciousZoneEntries(options?: {
    minMinutes?: number;
    maxMinutes?: number;
    startDate?: string;
    endDate?: string;
  }): Promise<any[]> {
    const response = await apiClient.get(`${this.baseUrl}/ambulance-tracking/investigation/suspicious-zone-entries`, {
      params: options,
    });
    return response.data;
  }

  async getZoneLogs(filters: {
    hospitalIds?: string[];
    ambulanceId?: string;
    startTime?: Date;
    endTime?: Date;
  }): Promise<any[]> {
    const params: any = {};
    if (filters.hospitalIds) params.hospitalIds = filters.hospitalIds;
    if (filters.ambulanceId) params.ambulanceId = filters.ambulanceId;
    if (filters.startTime) params.startTime = filters.startTime.toISOString();
    if (filters.endTime) params.endTime = filters.endTime.toISOString();

    const response = await apiClient.get(`${this.baseUrl}/ambulance-tracking/zone-logs`, { params });
    return response.data;
  }

  // Performance Analytics
  async getPerformanceData(period?: string): Promise<any> {
    try {
      // Convert period to startDate and endDate
      const endDate = new Date();
      let startDate = new Date();
      
      switch (period) {
        case '24h':
          startDate = new Date(endDate.getTime() - 24 * 60 * 60 * 1000);
          break;
        case '7d':
          startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case '30d':
          startDate = new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case '90d':
          startDate = new Date(endDate.getTime() - 90 * 24 * 60 * 60 * 1000);
          break;
        default:
          startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000); // Default to 7 days
      }
      
      const response = await apiClient.get(`${this.baseUrl}/ems-dashboard/performance-report`, {
        params: { 
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
        },
      });
      return response.data || {};
    } catch (error) {
      console.error('Failed to fetch performance data:', error);
      return {};
    }
  }

  async getAmbulancePerformance(ambulanceId: string): Promise<EMSPerformanceMetric[]> {
    const response = await apiClient.get(`${this.baseUrl}/performance/ambulance/${ambulanceId}`);
    return response.data;
  }

  async getDriverPerformance(driverId: string, days?: number): Promise<any> {
    const response = await apiClient.get(`${this.baseUrl}/performance/driver/${driverId}`, {
      params: { days },
    });
    return response.data;
  }

  async getPerformanceReport(startDate: string, endDate: string): Promise<any> {
    const response = await apiClient.get(`${this.baseUrl}/performance/reports`, {
      params: { startDate, endDate },
    });
    return response.data;
  }

  async getAssignmentStatusDistribution(period?: string): Promise<any> {
    try {
      const endDate = new Date();
      let startDate = new Date();
      
      switch (period) {
        case '24h':
          startDate = new Date(endDate.getTime() - 24 * 60 * 60 * 1000);
          break;
        case '7d':
          startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case '30d':
          startDate = new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case '90d':
          startDate = new Date(endDate.getTime() - 90 * 24 * 60 * 60 * 1000);
          break;
        default:
          startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000);
      }
      
      const response = await apiClient.get(`${this.baseUrl}/ems-dashboard/assignment-status-distribution`, {
        params: {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
        },
      });
      return response.data || [];
    } catch (error) {
      console.error('Failed to fetch assignment status distribution:', error);
      return [];
    }
  }

  async getResponseTimeTrends(period?: string): Promise<any> {
    try {
      const endDate = new Date();
      let startDate = new Date();
      
      switch (period) {
        case '24h':
          startDate = new Date(endDate.getTime() - 24 * 60 * 60 * 1000);
          break;
        case '7d':
          startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case '30d':
          startDate = new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case '90d':
          startDate = new Date(endDate.getTime() - 90 * 24 * 60 * 60 * 1000);
          break;
        default:
          startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000);
      }
      
      const response = await apiClient.get(`${this.baseUrl}/ems-dashboard/response-time-trends`, {
        params: {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
        },
      });
      return response.data || [];
    } catch (error) {
      console.error('Failed to fetch response time trends:', error);
      return [];
    }
  }

  // EMS Drivers
  async getEMSDrivers(params?: { page?: number; pageSize?: number; search?: string }): Promise<{ data: any[]; total: number; page: number; pageSize: number; }> {
    const { page = 1, pageSize = 10, search } = params || {};
    try {
      const response = await apiClient.get(`${this.baseUrl}/drivers`, { params: { page, limit: pageSize, search } });
      const r = response.data || {};
      // Handle backend response format: {data: [...], total: 4, page: 1, pages: 1, limit: 10}
      const data = r.data || [];
      const total = r.total || 0;
      const currentPage = r.page || page;
      // Use frontend's pageSize instead of backend's limit to prevent override
      const currentPageSize = pageSize;
      return { data, total, page: currentPage, pageSize: currentPageSize };
    } catch (error) {
      console.error('Failed to fetch EMS drivers:', error);
      // Return mock paginated data for development
      const data = [
        { id: '1', firstName: 'Ahmed', lastName: 'Al-Rashid', email: 'driver1@jazan-ems.com', phoneNumber: '+966501234567', status: 'ACTIVE' },
        { id: '2', firstName: 'Fatima', lastName: 'Al-Zahra', email: 'driver2@jazan-ems.com', phoneNumber: '+966501234568', status: 'ACTIVE' },
        { id: '3', firstName: 'Mohammed', lastName: 'Al-Sabah', email: 'driver3@jazan-ems.com', phoneNumber: '+966501234569', status: 'ACTIVE' },
        { id: '4', firstName: 'Sara', lastName: 'Al-Mansouri', email: 'driver4@jazan-ems.com', phoneNumber: '+966501234570', status: 'ACTIVE' },
      ];
      return { data, total: data.length, page, pageSize };
    }
  }

  async createDriver(data: any): Promise<any> {
    try {
      const response = await apiClient.post(`${this.baseUrl}/drivers`, data);
      return response.data;
    } catch (error) {
      console.error('Failed to create driver:', error);
      throw error;
    }
  }

  async updateDriver(id: string, data: any): Promise<any> {
    try {
      const response = await apiClient.patch(`${this.baseUrl}/drivers/${id}`, data);
      return response.data;
    } catch (error) {
      console.error('Failed to update driver:', error);
      throw error;
    }
  }

  async deleteDriver(id: string): Promise<void> {
    try {
      await apiClient.delete(`${this.baseUrl}/drivers/${id}`);
    } catch (error) {
      console.error('Failed to delete driver:', error);
      throw error;
    }
  }
}

export const emsService = new EMSService();
