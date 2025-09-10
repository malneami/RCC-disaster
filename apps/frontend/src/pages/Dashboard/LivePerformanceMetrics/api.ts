import { apiClient } from '../../../services/apiClient';
import { LivePerformanceMetricsData } from '../types/performance';

export const livePerformanceApi = {
  async getLiveMetrics(): Promise<LivePerformanceMetricsData> {
    try {
      const response = await apiClient.get('/performance/live-metrics');
      return response.data;
    } catch (error) {
      console.error('Error fetching live performance metrics:', error);
      // Return mock data for development
      return this.getMockData();
    }
  },

  getMockData(): LivePerformanceMetricsData {
    return {
      activeTransports: 0,
      avgResponseTime: 15,
      hospitalCapacity: 100,
      ambulanceUtilization: 65,
      completedToday: 0,
    };
  },
};
