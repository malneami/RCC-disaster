export interface StrokeCommandCenterFilters {
  hospitalId: string;
  startDate: string;
  endDate: string;
}

export interface StrokeKPIData {
  totalCases: number;
  casesThisMonth: number;
  coverageRate: number;
  strokePerformance: number;
}

export interface StrokeDistributionData {
  ageDistribution: Array<{
    ageGroup: string;
    count: number;
    percentage: number;
  }>;
  genderDistribution: Array<{
    gender: string;
    count: number;
    percentage: number;
  }>;
  modeOfArrival: Array<{
    mode: string;
    count: number;
    percentage: number;
  }>;
}

export interface TherapyPerformanceData {
  thrombolyticTherapy: {
    successRate: number;
    treated: number;
    total: number;
    target: number; // >=5%
  };
  swallowingScreening: {
    successRate: number;
    screened: number;
    total: number;
    target: number; // >=85%
  };
}

export interface AdmissionFollowupData {
  strokeUnitAdmission: {
    successRate: number;
    admitted: number;
    total: number;
    target: number; // >=80%
  };
  followUpOutcomes: {
    successRate: number;
    completed: number;
    total: number;
    target: number; // >=80%
  };
}

export interface StrokeTypeDistributionData {
  strokeTypes: Array<{
    type: string;
    count: number;
    percentage: number;
  }>;
}

export interface PerformanceTrendData {
  daily: Array<{
    date: string;
    performance: number;
  }>;
  weekly: Array<{
    week: string;
    performance: number;
  }>;
  monthly: Array<{
    month: string;
    performance: number;
  }>;
}

export interface StrokeKPIMetric {
  id: string;
  name: string;
  target: string;
  currentValue: number;
  targetValue: number;
  percentage: number;
  status: 'GREEN' | 'YELLOW' | 'RED';
  trend: 'up' | 'down' | 'stable';
}

export interface StrokeCommandCenterData {
  kpiData: StrokeKPIData;
  distributionData: StrokeDistributionData;
  therapyPerformance: TherapyPerformanceData;
  admissionFollowup: AdmissionFollowupData;
  strokeTypeDistribution: StrokeTypeDistributionData;
  performanceTrend: PerformanceTrendData;
  kpis: StrokeKPIMetric[];
  hospitals: Array<{ id: string; name: string }>;
  hospitalPerformance: Array<{
    hospitalName: string;
    status: 'ACTIVE' | 'INACTIVE';
    cases: number;
    physicianMin: number;
    ctMin: number;
    ctReportMin: number;
    orderMin: number;
    needleMin: number;
    mtMin: number;
    physicianPct: number;
    ctPct: number;
    ctReportPct: number;
    needlePct: number;
    mtPct: number;
    swallowingPct: number;
    strokeUnitPct: number;
    followUpPct: number;
  }>;
}