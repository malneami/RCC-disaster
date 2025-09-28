export interface CommandCenterFilters {
  hospitalId: string;
  startDate: string;
  endDate: string;
}

export interface KPIMetric {
  id: string;
  name: string;
  value: number;
  target: number;
  unit: string;
  status: 'met' | 'missed' | 'warning';
  trend: 'up' | 'down' | 'stable';
  percentage: number;
}

export interface HospitalPerformance {
  id: string;
  name: string;
  zone: string;
  metrics: {
    d2b: KPIMetric;
    d2n: KPIMetric;
    dido: KPIMetric;
    pciSuccess: KPIMetric;
    mortality: KPIMetric;
  };
}

export interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor?: string | string[];
    borderColor?: string;
    fill?: boolean;
  }[];
}

export interface HospitalPerformanceHeatmap {
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
}

export interface CommandCenterData {
  summary: {
    totalCases: number;
    totalPCI: number;
    mortalityRate: number;
    complianceRate: number;
  };
  kpis: KPIMetric[];
  hospitals: HospitalPerformance[];
  hospitalPerformanceHeatmap: HospitalPerformanceHeatmap[];
  charts: {
    referralSource: ChartData;
    pciBreakdown: ChartData;
    didoCompliance: ChartData;
    treatmentDistribution: ChartData;
    outcomes: ChartData;
    hospitalPerformance: ChartData;
    trends: ChartData;
    heatmap: ChartData;
  };
  recentCases: {
    id: string;
    patientName: string;
    hospital: string;
    status: string;
    timestamp: string;
  }[];
}

export interface ExportOptions {
  format: 'pdf' | 'image';
  includeCharts: boolean;
  includeData: boolean;
  dateRange: {
    start: string;
    end: string;
  };
}
