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
  async getAmbulances(filter?: AmbulanceFilter): Promise<Ambulance[]> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/ambulances`, { params: filter });
      return response.data || [];
    } catch (error) {
      console.error('Failed to fetch ambulances:', error);
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
    await apiClient.post(`${this.baseUrl}/tracking/sync`);
  }

  // Performance Analytics
  async getPerformanceData(period?: string): Promise<any> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/ems-dashboard/performance-report`, {
        params: { period },
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
