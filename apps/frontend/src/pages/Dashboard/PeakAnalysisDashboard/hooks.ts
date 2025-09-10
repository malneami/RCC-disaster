import { useQuery } from 'react-query';
import { peakAnalysisApi } from './api';
import { PeakAnalysisData } from '../types/performance';

export const usePeakAnalysisData = () => {
  return useQuery<PeakAnalysisData>({
    queryKey: ['peak-analysis-data'],
    queryFn: () => peakAnalysisApi.getPeakAnalysisData(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
};
