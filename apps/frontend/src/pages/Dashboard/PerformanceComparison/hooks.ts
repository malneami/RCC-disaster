import { useQuery } from 'react-query';
import { performanceComparisonApi, PerformanceComparisonData } from './api';

export interface PerformanceComparisonFilters {
  hospitalId?: string;
  startDate?: string;
  endDate?: string;
}

export const usePerformanceComparison = (
  period: 'daily' | 'weekly' | 'monthly',
  filters?: PerformanceComparisonFilters
) => {
  return useQuery<PerformanceComparisonData>({
    queryKey: ['performance-comparison', period, filters],
    queryFn: () => performanceComparisonApi.getPerformanceData(period, filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
};
