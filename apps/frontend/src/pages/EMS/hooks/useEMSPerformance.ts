import { useQuery } from 'react-query';
import { emsService } from '../services/emsService';

export const useEMSPerformance = (period?: string, customRange?: { startDate: Date; endDate: Date }) => {
  return useQuery(
    ['ems-performance', period, customRange],
    () => emsService.getPerformanceData(period, customRange),
    {
      refetchInterval: 300000, // Refetch every 5 minutes
      staleTime: 60000, // Consider data stale after 1 minute
    }
  );
};


