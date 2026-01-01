export enum KPIType {
  ACCURACY = 'accuracy',
  TIMELINESS = 'timeliness',
  COMPLETENESS = 'completeness',
  COVERAGE = 'coverage',
  PRECISION = 'precision',
  DUPLICATION = 'duplication',
}

export enum RecordType {
  ALL = 'all',
  STEMI = 'stemi',
  STROKE = 'stroke',
  TRAUMA = 'trauma',
  TICKET = 'ticket',
}

export interface AuditKPIFilters {
  startDate?: string;
  endDate?: string;
  hospitalId?: string;
  recordType?: RecordType;
  patientId?: string;
}

export interface KPIMetric {
  kpiType: KPIType;
  percentage: number;
  totalRecords: number;
  validRecords: number;
  invalidRecords: number;
  status: 'PASS' | 'WARNING' | 'FAIL';
}

export interface AuditKPIData {
  kpis: KPIMetric[];
  overallScore: number;
  totalRecords: number;
  summary: {
    totalRecords: number;
    validRecords: number;
    invalidRecords: number;
  };
}

export interface FailedRecord {
  recordId: string;
  patientId?: string;
  recordType: RecordType;
  hospitalId?: string;
  hospitalName?: string;
  failureReasons: string[];
  createdAt: Date;
  details?: Record<string, any>;
}

export interface FailedRecordsResponse {
  kpiType: KPIType;
  records: FailedRecord[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}


