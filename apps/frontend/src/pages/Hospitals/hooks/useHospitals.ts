import { useState, useEffect } from 'react';
import { Hospital, HospitalFilters } from '../../../services/hospitalService';
import { hospitalService } from '../../../services/hospitalService';
import { filterHospitals } from '../utils/hospitalUtils';

interface UseHospitalsReturn {
  hospitals: Hospital[];
  loading: boolean;
  error: string | null;
  filters: HospitalFilters;
  filteredHospitals: Hospital[];
  loadHospitals: () => Promise<void>;
  setFilters: (filters: HospitalFilters) => void;
  resetFilters: () => void;
}

export const useHospitals = (): UseHospitalsReturn => {
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<HospitalFilters>({
    status: '',
    cluster: '',
    hasStemiService: undefined,
    hasStrokeService: undefined,
    hasTraumaService: undefined,
  });

  const loadHospitals = async () => {
    try {
      setLoading(true);
      const data = await hospitalService.getAllHospitals(filters);
      setHospitals(data);
      setError(null);
    } catch (err) {
      setError('Failed to load hospitals');
      console.error('Error loading hospitals:', err);
    } finally {
      setLoading(false);
    }
  };

  const resetFilters = () => {
    setFilters({
      status: '',
      cluster: '',
      hasStemiService: undefined,
      hasStrokeService: undefined,
      hasTraumaService: undefined,
    });
  };

  const filteredHospitals = filterHospitals(hospitals, filters);

  useEffect(() => {
    loadHospitals();
  }, [filters]);

  return {
    hospitals,
    loading,
    error,
    filters,
    filteredHospitals,
    loadHospitals,
    setFilters,
    resetFilters,
  };
};
