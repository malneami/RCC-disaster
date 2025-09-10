export interface LivePerformanceMetricsData {
  activeTransports: number;
  avgResponseTime: number;
  hospitalCapacity: number;
  ambulanceUtilization: number;
  completedToday: number;
}

export interface PeakAnalysisData {
  todaysCases: number;
  yesterdaysCases: number;
  weeklyAverage: number;
  vsYesterday: number;
  vsLastWeek: number;
  peakHours: string;
}
