import { useQuery } from 'react-query';
import { bedService, Bed } from '../services/bedService';

export const useBed = (bedId: string | null) => {
  const query = useQuery(
    ['bed', bedId],
    () => bedService.getBedById(bedId!),
    {
      enabled: !!bedId,
      staleTime: 30000, 
      cacheTime: 5 * 60 * 1000, 
      retry: (failureCount, error: any) => {
        // Don't retry on 4xx errors
        if (error?.response?.status >= 400 && error?.response?.status < 500) {
          return false;
        }
        return failureCount < 2;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    }
  );

  return {
    bed: query.data as Bed | undefined,
    loading: query.isLoading,
    error: query.error ? (query.error as any)?.response?.data?.message || 'Failed to fetch bed' : null,
    refetch: query.refetch,
  };
};

