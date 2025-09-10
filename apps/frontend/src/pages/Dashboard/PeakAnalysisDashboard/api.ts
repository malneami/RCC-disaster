import { apiClient } from '../../../services/apiClient';
import { PeakAnalysisData } from '../types/performance';

export const peakAnalysisApi = {
  async getPeakAnalysisData(): Promise<PeakAnalysisData> {
    try {
      const response = await apiClient.get('/performance/peak-analysis');
      return response.data;
    } catch (error) {
      console.error('Error fetching peak analysis data:', error);
      // Return mock data for development
      return this.getMockData();
    }
  },

  getMockData(): PeakAnalysisData {
    return {
      todaysCases: 0,
      yesterdaysCases: 0,
      weeklyAverage: 0,
      vsYesterday: 0,
      vsLastWeek: 0,
      peakHours: '19:00-20:00',
    };
  },
};
