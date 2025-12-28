import { useQuery } from 'react-query';
import { bedService, BedStats, GetBedStatsParams } from '../services/bedService';

export const useBedStats = (filters?: GetBedStatsParams) => {
  const query = useQuery<BedStats, Error>(
    ['bedStats', filters],
    () => bedService.getBedStats(filters),
    {
      refetchInterval: 20000, // Refetch every 20 seconds
      staleTime: 10000, 
      cacheTime: 5 * 60 * 1000, 
      retry: (failureCount, error: any) => {
        // Don't retry on 4xx errors
        if (error?.response?.status >= 400 && error?.response?.status < 500) {
          return false;
        }
        return failureCount < 3;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    }
  );

  return {
    stats: query.data,
    loading: query.isLoading,
    error: query.error ? (query.error as any)?.response?.data?.message || 'Failed to fetch bed stats' : null,
    refetch: query.refetch,
  };
};

