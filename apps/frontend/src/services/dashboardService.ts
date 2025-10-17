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

export interface DashboardFilters {
  hospitalId?: string;
  startDate?: string;
  endDate?: string;
}

class DashboardService {
  async getDashboardMetrics(filters?: DashboardFilters): Promise<DashboardMetrics> {
    const params = new URLSearchParams();
    
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
    const url = queryString ? `/dashboard/metrics?${queryString}` : '/dashboard/metrics';
    
    const response = await apiClient.get(url);
    return response.data;
  }

  async getPathwayPerformanceMetrics(filters?: DashboardFilters): Promise<PathwayPerformanceMetrics> {
    const params = new URLSearchParams();
    
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
    const url = queryString ? `/dashboard/pathway-metrics?${queryString}` : '/dashboard/pathway-metrics';
    
    const response = await apiClient.get(url);
    return response.data;
  }
}

export const dashboardService = new DashboardService();
