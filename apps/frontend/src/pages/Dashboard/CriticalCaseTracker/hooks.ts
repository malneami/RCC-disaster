import { useQuery } from 'react-query';
import { criticalCaseApi, CriticalCase } from './api';

export const useCriticalCases = () => {
  return useQuery<CriticalCase[]>({
    queryKey: ['critical-cases'],
    queryFn: () => criticalCaseApi.getCriticalCases(),
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 30 * 1000, // Refetch every 30 seconds for real-time updates
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
};

export const useCriticalCase = (id: string) => {
  return useQuery<CriticalCase | null>({
    queryKey: ['critical-case', id],
    queryFn: () => criticalCaseApi.getCriticalCaseById(id),
    enabled: !!id,
    staleTime: 10 * 1000, // 10 seconds
    refetchInterval: 10 * 1000, // Refetch every 10 seconds for individual case
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
};
