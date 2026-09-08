import { AuditDimension } from '@prisma/client';

export interface McpAuditRequest {
  auditId: string;
  timestamp: string;
  auditType: 'SCHEDULED' | 'REAL_TIME' | 'ON_DEMAND';
  dimensions: AuditDimension[];
  filters: {
    startDate?: string;
    endDate?: string;
    hospitalId?: string;
    entityTypes?: string[];
  };
  data: {
    [key in AuditDimension]?: {
      score: number;
      issues: Array<{
        entityType: string;
        entityId: string;
        description: string;
        severity: string;
      }>;
    };
  };
}

export interface McpAuditResponse {
  auditId: string;
  status: 'SUCCESS' | 'FAILED';
  analysisUrl?: string;
  insights?: Array<{
    dimension: AuditDimension;
    severity: string;
    message: string;
    recommendation?: string;
  }>;
  overallScore?: number;
  processedAt: string;
  error?: string;
}

export interface McpHealthResponse {
  status: 'OK' | 'ERROR';
  message?: string;
  timestamp: string;
}
