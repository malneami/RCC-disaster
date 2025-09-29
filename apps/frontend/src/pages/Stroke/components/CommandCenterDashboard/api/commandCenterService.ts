import { StrokeCommandCenterFilters, StrokeCommandCenterData } from '../types';
import { apiClient } from '../../../../../services/apiClient';

class CommandCenterService {

  async getDashboardData(filters: StrokeCommandCenterFilters): Promise<StrokeCommandCenterData> {
    try {
      const params = new URLSearchParams();
      
      if (filters.hospitalId) params.append('hospitalId', filters.hospitalId);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);

      const response = await apiClient.get(`/stroke-command-center/dashboard?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching stroke command center data:', error);
      throw error;
    }
  }

  async getKPIData(filters: StrokeCommandCenterFilters) {
    try {
      const params = new URLSearchParams();
      
      if (filters.hospitalId) params.append('hospitalId', filters.hospitalId);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);

      const response = await apiClient.get(`/stroke-command-center/kpis?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching KPI data:', error);
      throw error;
    }
  }

  async getDistributionData(filters: StrokeCommandCenterFilters) {
    try {
      const params = new URLSearchParams();
      
      if (filters.hospitalId) params.append('hospitalId', filters.hospitalId);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);

      const response = await apiClient.get(`/stroke-command-center/distribution?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching distribution data:', error);
      throw error;
    }
  }

  async getTrendData(filters: StrokeCommandCenterFilters, period: 'daily' | 'weekly' | 'monthly') {
    try {
      const params = new URLSearchParams();
      
      if (filters.hospitalId) params.append('hospitalId', filters.hospitalId);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      params.append('period', period);

      const response = await apiClient.get(`/stroke-command-center/trends?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching trend data:', error);
      throw error;
    }
  }

  async exportDashboard(options: any) {
    try {
      const response = await apiClient.post('/stroke-command-center/export', options, {
        responseType: 'blob',
      });
      return response.data;
    } catch (error) {
      console.error('Error exporting dashboard:', error);
      throw error;
    }
  }
}

export const commandCenterService = new CommandCenterService();
