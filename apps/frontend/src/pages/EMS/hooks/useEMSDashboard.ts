import { useQuery } from 'react-query';
import { emsService } from '../services/emsService';

export const useEMSDashboard = () => {
  return useQuery(
    'ems-dashboard',
    () => emsService.getDashboardData(),
    {
      refetchInterval: 30000, // Refetch every 30 seconds for real-time updates
      staleTime: 10000, // Consider data stale after 10 seconds
    }
  );
};


