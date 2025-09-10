import { useQuery } from 'react-query';
import { livePerformanceApi } from './api';
import { LivePerformanceMetricsData } from '../types/performance';

export const useLivePerformanceMetrics = () => {
  return useQuery<LivePerformanceMetricsData>({
    queryKey: ['live-performance-metrics'],
    queryFn: () => livePerformanceApi.getLiveMetrics(),
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 30 * 1000, // Refetch every 30 seconds for live data
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
};
