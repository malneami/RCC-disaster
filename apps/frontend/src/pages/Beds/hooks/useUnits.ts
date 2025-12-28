import { useQuery } from 'react-query';
import { bedService } from '../services/bedService';

export interface UnitInfo {
  id: string;
  name: string;
}

export const useUnits = (hospitalId: string | null | undefined, enabled: boolean = true) => {
  const query = useQuery(
    ['units', hospitalId],
    () => bedService.getUnits(hospitalId || undefined),
    {
      enabled: enabled && !!hospitalId,
      staleTime: 5 * 60 * 1000, 
      cacheTime: 10 * 60 * 1000, 
      retry: (failureCount, error: any) => {
        if (error?.response?.status >= 400 && error?.response?.status < 500) {
          return false;
        }
        return failureCount < 2;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    }
  );

  return {
    units: (query.data || []).map(u => ({ id: u.id, name: u.name })) as UnitInfo[],
    loading: query.isLoading,
    error: query.error ? (query.error as any)?.response?.data?.message || 'Failed to fetch units' : null,
    refetch: query.refetch,
  };
};

