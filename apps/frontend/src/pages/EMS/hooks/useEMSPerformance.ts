import { useQuery } from 'react-query';
import { emsService } from '../services/emsService';

export const useEMSPerformance = (period?: string) => {
  return useQuery(
    ['ems-performance', period],
    () => emsService.getPerformanceData(period),
    {
      refetchInterval: 300000, // Refetch every 5 minutes
      staleTime: 60000, // Consider data stale after 1 minute
    }
  );
};


