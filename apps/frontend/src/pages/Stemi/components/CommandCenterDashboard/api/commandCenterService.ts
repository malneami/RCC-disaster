import { apiClient } from '../../../../../services/apiClient';
import { CommandCenterFilters } from '../types';

export interface CommandCenterApiResponse {
  summary: {
    totalCases: number;
    totalPCI: number;
    mortalityRate: number;
    complianceRate: number;
  };
  kpis: Array<{
    id: string;
    name: string;
    value: number;
    target: number;
    unit: string;
    status: 'met' | 'missed' | 'warning';
    trend: 'up' | 'down' | 'stable';
    percentage: number;
  }>;
  hospitals: Array<{
    id: string;
    name: string;
    zone: string;
    metrics: {
      d2b: any;
      d2n: any;
      dido: any;
      pciSuccess: any;
      mortality: any;
    };
  }>;
  hospitalPerformanceHeatmap: Array<{
    hospitalId: string;
    hospitalName: string;
    totalCases: number;
    doorToEcgCompliance: number;
    doorToEcgValid: number;
    doorToEcgCompliant: number;
    doorToNeedleCompliance: number;
    doorToNeedleValid: number;
    doorToNeedleCompliant: number;
    doorToBalloonCompliance: number;
    doorToBalloonValid: number;
    doorToBalloonCompliant: number;
    activationDoorOutCompliance: number;
    activationDoorOutValid: number;
    activationDoorOutCompliant: number;
    doorInDoorOutCompliance: number;
    doorInDoorOutValid: number;
    doorInDoorOutCompliant: number;
    dataQualityScore: number;
    dataCompletenessScore: number;
  }>;
  charts: {
    referralSource: {
      labels: string[];
      datasets: Array<{
        label: string;
        data: number[];
        backgroundColor?: string | string[];
        borderColor?: string;
        fill?: boolean;
      }>;
    };
    pciBreakdown: any;
    didoCompliance: any;
    treatmentDistribution: any;
    outcomes: any;
    hospitalPerformance: any;
    trends: any;
    heatmap: any;
  };
  recentCases: Array<{
    id: string;
    patientName: string;
    hospital: string;
    status: string;
    timestamp: string;
  }>;
}

class CommandCenterService {
  async getDashboardData(filters: CommandCenterFilters): Promise<CommandCenterApiResponse> {
    const params = new URLSearchParams();
    
    if (filters.hospitalId) params.append('hospitalId', filters.hospitalId);
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);

    const response = await apiClient.get(`/stemi-command-center/dashboard?${params.toString()}`);
    return response.data;
  }

  async getKPIs(filters: CommandCenterFilters) {
    const params = new URLSearchParams();
    
    if (filters.hospitalId) params.append('hospitalId', filters.hospitalId);
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);

    const response = await apiClient.get(`/stemi-command-center/kpis?${params.toString()}`);
    return response.data;
  }

  async getHospitalPerformance(filters: CommandCenterFilters) {
    const params = new URLSearchParams();
    
    if (filters.hospitalId) params.append('hospitalId', filters.hospitalId);
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);

    const response = await apiClient.get(`/stemi-command-center/hospital-performance?${params.toString()}`);
    return response.data;
  }

  async getCharts(filters: CommandCenterFilters) {
    const params = new URLSearchParams();
    
    if (filters.hospitalId) params.append('hospitalId', filters.hospitalId);
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);

    const response = await apiClient.get(`/stemi-command-center/charts?${params.toString()}`);
    return response.data;
  }

  async getRecentCases(filters: CommandCenterFilters, limit = 10) {
    const params = new URLSearchParams();
    
    if (filters.hospitalId) params.append('hospitalId', filters.hospitalId);
    params.append('limit', limit.toString());

    const response = await apiClient.get(`/stemi-command-center/recent-cases?${params.toString()}`);
    return response.data;
  }

  async getSummary(filters: CommandCenterFilters) {
    const params = new URLSearchParams();
    
    if (filters.hospitalId) params.append('hospitalId', filters.hospitalId);
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);

    const response = await apiClient.get(`/stemi-command-center/summary?${params.toString()}`);
    return response.data;
  }
}

export const commandCenterService = new CommandCenterService();
