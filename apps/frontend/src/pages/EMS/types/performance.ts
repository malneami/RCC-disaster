export interface EMSPerformanceMetric {
  id: string;
  ambulanceId: string;
  metricType: 'RESPONSE_TIME' | 'TRANSFER_TIME' | 'DISTANCE_TRAVELED' | 'DRIVER_RATING' | 'PATIENT_SATISFACTION' | 'ON_TIME_ARRIVALS' | 'DELAYED_ARRIVALS' | 'CANCELLED_TRANSFERS' | 'EQUIPMENT_FAILURES';
  value: number;
  unit: string;
  recordedAt: Date;
  period: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
  createdById: string;
  ambulance?: {
    id: string;
    callSign: string;
    plateNumber: string;
  };
}

export interface PerformanceFilters {
  ambulanceId?: string;
  metricType?: string;
  period?: string;
  startDate?: Date;
  endDate?: Date;
  search?: string;
}

export interface CreatePerformanceMetricData {
  ambulanceId: string;
  metricType: string;
  value: number;
  unit: string;
  recordedAt: string;
  period: string;
  metadata?: Record<string, any>;
}

export interface UpdatePerformanceMetricData extends Partial<CreatePerformanceMetricData> {}

export interface PerformanceKPIs {
  avgResponseTime: number;
  totalAssignments: number;
  onTimeArrivals: number;
  totalDistance: number;
  avgAssignmentDuration: number;
}

export interface PerformanceChartData {
  name: string;
  value: number;
  target?: number;
}
