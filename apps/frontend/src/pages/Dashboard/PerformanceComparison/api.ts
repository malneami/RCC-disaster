import { apiClient } from '../../../services/apiClient';

export interface PerformanceComparisonData {
  globalMetrics: {
    current: number;
    previousChange: number;
    averageChange: number;
  };
  dailySummary: {
    currentPeriod: number;
    previousPeriod: number;
    average: number;
  };
  changeAnalysis: {
    vsPreviousPeriod: number;
    vsAverage: number;
    trend: 'up' | 'down' | 'stable';
  };
  chartData: {
    data: Array<{
      date: string;
      stemi: number;
      stroke: number;
      trauma: number;
      other: number;
    }>;
  };
}

export const performanceComparisonApi = {
  async getPerformanceData(period: 'daily' | 'weekly' | 'monthly'): Promise<PerformanceComparisonData> {
    try {
      const response = await apiClient.get(`/performance/comparison?period=${period}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching performance comparison data:', error);
      // Return mock data for development
      return this.getMockData(period);
    }
  },

  getMockData(period: 'daily' | 'weekly' | 'monthly'): PerformanceComparisonData {
    // Generate mock data based on period
    const baseMultiplier = period === 'daily' ? 1 : period === 'weekly' ? 7 : 30;
    
    return {
      globalMetrics: {
        current: 0,
        previousChange: 0,
        averageChange: 0,
      },
      dailySummary: {
        currentPeriod: 0,
        previousPeriod: 0,
        average: 0,
      },
      changeAnalysis: {
        vsPreviousPeriod: 0,
        vsAverage: 0,
        trend: 'stable',
      },
      chartData: {
        data: this.generateMockChartData(period),
      },
    };
  },

  generateMockChartData(period: 'daily' | 'weekly' | 'monthly'): Array<{
    date: string;
    stemi: number;
    stroke: number;
    trauma: number;
    other: number;
  }> {
    const data = [];
    const now = new Date();
    
    if (period === 'daily') {
      // Generate hourly data for the last 24 hours
      for (let i = 23; i >= 0; i--) {
        const date = new Date(now);
        date.setHours(date.getHours() - i);
        data.push({
          date: date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
          stemi: 0,
          stroke: 0,
          trauma: 0,
          other: 0,
        });
      }
    } else if (period === 'weekly') {
      // Generate daily data for the last 7 days
      for (let i = 6; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        data.push({
          date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          stemi: 0,
          stroke: 0,
          trauma: 0,
          other: 0,
        });
      }
    } else {
      // Generate daily data for the last 30 days
      for (let i = 29; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        data.push({
          date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          stemi: 0,
          stroke: 0,
          trauma: 0,
          other: 0,
        });
      }
    }
    
    return data;
  },
};
