import { useQuery } from 'react-query';
import { hospitalService } from '../services/hospitalService';

export const useHospitals = () => {
  return useQuery(
    'hospitals',
    () => hospitalService.getAllHospitals(),
    {
      staleTime: 5 * 60 * 1000, // Consider data stale after 5 minutes
    }
  );
};
