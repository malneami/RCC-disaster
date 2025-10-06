import { apiClient } from './apiClient';

export interface DashboardMetrics {
  activeTransfers: number;
  urgentPathwayCases: number;
  completedToday: number;
  delayedTransfers: number;
  timestamp: string;
}

export interface PathwayMetric {
  label: string;
  value: string;
  progress: number;
  color: string;
}

export interface PathwayPerformance {
  pathway: string;
  color: string;
  activeCount: number;
  metrics: PathwayMetric[];
}

export interface PathwayPerformanceMetrics {
  pathways: PathwayPerformance[];
  timestamp: string;
}

class DashboardService {
  async getDashboardMetrics(): Promise<DashboardMetrics> {
    const response = await apiClient.get('/dashboard/metrics');
    return response.data;
  }

  async getPathwayPerformanceMetrics(): Promise<PathwayPerformanceMetrics> {
    const response = await apiClient.get('/dashboard/pathway-metrics');
    return response.data;
  }
}

export const dashboardService = new DashboardService();
