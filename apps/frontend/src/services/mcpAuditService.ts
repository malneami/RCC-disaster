import { apiClient } from './apiClient';
import { AuditDimension } from '@prisma/client';

export interface AuditFilters {
  startDate?: string;
  endDate?: string;
  hospitalId?: string;
  patientId?: string;
  dimensions?: string[];
  entityType?: string;
}

export interface EventFilters extends AuditFilters {
  eventType?: string;
  severity?: string;
  page?: number;
  pageSize?: number;
}

export interface ReportFilters {
  startDate?: string;
  endDate?: string;
  reportType?: string;
  page?: number;
  pageSize?: number;
}

export interface TriggerAuditDto {
  dimensions: string[];
  startDate?: string;
  endDate?: string;
  hospitalId?: string;
  submitToMcp?: boolean;
}

export interface AuditEvent {
  id: string;
  eventType: string;
  dimension: string;
  entityType: string;
  entityId: string;
  severity: string;
  description: string;
  details?: any;
  mcpSubmitted: boolean;
  mcpResponse?: any;
  mcpSubmittedAt?: string;
  createdAt: string;
  createdBy?: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

export interface AuditReport {
  id: string;
  reportNumber: string;
  reportType: string;
  startDate: string;
  endDate: string;
  overallScore: number;
  dimensionScores: Record<string, number>;
  summary: any;
  mcpReportUrl?: string;
  generatedAt: string;
  generatedBy: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

export interface DashboardData {
  overallScore: number;
  dimensionScores: Record<string, number>;
  recentEvents: AuditEvent[];
  trends: Array<{
    dimension: string;
    trend: 'up' | 'down' | 'stable';
    change: number;
  }>;
  severityBreakdown: Record<string, number>;
}

export interface EventListResponse {
  events: AuditEvent[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ReportListResponse {
  reports: AuditReport[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface HealthStatus {
  mcpEnabled: boolean;
  mcpStatus: string;
  mcpMessage?: string;
  timestamp: string;
}

export const mcpAuditService = {
  async getDashboard(filters: AuditFilters = {}): Promise<DashboardData> {
    const { data } = await apiClient.get('/mcp-audit/dashboard', { params: filters });
    return data;
  },

  async listReports(filters: ReportFilters = {}): Promise<ReportListResponse> {
    const { data } = await apiClient.get('/mcp-audit/reports', { params: filters });
    return data;
  },

  async getReport(id: string): Promise<AuditReport> {
    const { data } = await apiClient.get(`/mcp-audit/reports/${id}`);
    return data;
  },

  async downloadReport(id: string, format: 'pdf' | 'excel' = 'pdf'): Promise<Blob> {
    const { data } = await apiClient.get(`/mcp-audit/reports/${id}/download`, {
      params: { format },
      responseType: 'blob',
    });
    return data;
  },

  async triggerAudit(dto: TriggerAuditDto): Promise<{ success: boolean; reportId: string; overallScore: number; dimensionCount: number }> {
    const { data } = await apiClient.post('/mcp-audit/audit/trigger', dto);
    return data;
  },

  async listEvents(filters: EventFilters = {}): Promise<EventListResponse> {
    const { data } = await apiClient.get('/mcp-audit/events', { params: filters });
    return data;
  },

  async checkHealth(): Promise<HealthStatus> {
    const { data } = await apiClient.get('/mcp-audit/health');
    return data;
  },
};

// Helper to get dimension label
export const getDimensionLabel = (dimension: string): string => {
  const labels: Record<string, string> = {
    COMPLETENESS: 'Completeness',
    ACCURACY: 'Accuracy',
    CONSISTENCY: 'Consistency',
    TIMELINESS: 'Timeliness',
    COMPLIANCE: 'Compliance',
    INTEGRITY: 'Integrity',
  };
  return labels[dimension] || dimension;
};

// Helper to get severity color
export const getSeverityColor = (severity: string): string => {
  const colors: Record<string, string> = {
    INFO: '#2196F3',
    WARNING: '#FF9800',
    ERROR: '#F44336',
    CRITICAL: '#9C27B0',
  };
  return colors[severity] || '#757575';
};
