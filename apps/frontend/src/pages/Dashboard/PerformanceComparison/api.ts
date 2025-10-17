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

export interface PerformanceComparisonFilters {
  hospitalId?: string;
  startDate?: string;
  endDate?: string;
}

export const performanceComparisonApi = {
  async getPerformanceData(
    period: 'daily' | 'weekly' | 'monthly',
    filters?: PerformanceComparisonFilters
  ): Promise<PerformanceComparisonData> {
    try {
      // Build query parameters
      const params = new URLSearchParams();
      params.append('period', period);
      
      if (filters?.hospitalId && filters.hospitalId !== 'all') {
        params.append('hospitalId', filters.hospitalId);
      }
      if (filters?.startDate) {
        params.append('startDate', filters.startDate);
      }
      if (filters?.endDate) {
        params.append('endDate', filters.endDate);
      }

      const queryString = params.toString();
      const url = `/tickets/performance/comparison?${queryString}`;
      
      const response = await apiClient.get(url);
      return response.data;
    } catch (error) {
      console.error('Error fetching performance comparison data:', error);
      // Return mock data for development
      return this.getMockData(period);
    }
  },

  getMockData(period: 'daily' | 'weekly' | 'monthly'): PerformanceComparisonData {
    // Generate realistic mock data based on period
    const chartData = this.generateMockChartData(period);
    const totalCases = chartData.reduce((sum, point) => sum + point.stemi + point.stroke + point.trauma + point.other, 0);
    
    // Calculate metrics based on the generated data
    const currentPeriod = totalCases;
    const previousPeriod = Math.floor(currentPeriod * (0.8 + Math.random() * 0.4)); // ±20% variation
    const average = Math.floor(currentPeriod * (0.9 + Math.random() * 0.2)); // ±10% variation
    
    const previousChange = previousPeriod > 0 ? Math.round(((currentPeriod - previousPeriod) / previousPeriod) * 100) : 0;
    const averageChange = average > 0 ? Math.round(((currentPeriod - average) / average) * 100) : 0;
    
    return {
      globalMetrics: {
        current: currentPeriod,
        previousChange: previousChange,
        averageChange: averageChange,
      },
      dailySummary: {
        currentPeriod: currentPeriod,
        previousPeriod: previousPeriod,
        average: average,
      },
      changeAnalysis: {
        vsPreviousPeriod: previousChange,
        vsAverage: averageChange,
        trend: previousChange > 5 ? 'up' : previousChange < -5 ? 'down' : 'stable',
      },
      chartData: {
        data: chartData,
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
    
    // Helper function to generate realistic case numbers
    const generateCases = (base: number, variation: number = 0.3) => {
      return Math.max(0, Math.floor(base * (1 - variation + Math.random() * variation * 2)));
    };
    
    if (period === 'daily') {
      // Generate hourly data for the last 24 hours
      for (let i = 23; i >= 0; i--) {
        const date = new Date(now);
        date.setHours(date.getHours() - i);
        
        // More activity during day hours (6 AM - 10 PM)
        const hour = date.getHours();
        const isDayTime = hour >= 6 && hour <= 22;
        const activityMultiplier = isDayTime ? 1.5 : 0.3;
        
        data.push({
          date: date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
          stemi: generateCases(2 * activityMultiplier, 0.5),
          stroke: generateCases(3 * activityMultiplier, 0.4),
          trauma: generateCases(1.5 * activityMultiplier, 0.6),
          other: generateCases(1 * activityMultiplier, 0.7),
        });
      }
    } else if (period === 'weekly') {
      // Generate daily data for the last 7 days
      for (let i = 6; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        
        // More activity on weekdays
        const isWeekend = date.getDay() === 0 || date.getDay() === 6;
        const activityMultiplier = isWeekend ? 0.7 : 1.2;
        
        data.push({
          date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          stemi: generateCases(15 * activityMultiplier, 0.3),
          stroke: generateCases(25 * activityMultiplier, 0.3),
          trauma: generateCases(12 * activityMultiplier, 0.4),
          other: generateCases(8 * activityMultiplier, 0.5),
        });
      }
    } else {
      // Generate daily data for the last 30 days
      for (let i = 29; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        
        // Weekly patterns with some variation
        const dayOfWeek = date.getDay();
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
        const activityMultiplier = isWeekend ? 0.8 : 1.1;
        
        data.push({
          date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          stemi: generateCases(18 * activityMultiplier, 0.4),
          stroke: generateCases(30 * activityMultiplier, 0.3),
          trauma: generateCases(15 * activityMultiplier, 0.4),
          other: generateCases(10 * activityMultiplier, 0.5),
        });
      }
    }
    
    return data;
  },
};
