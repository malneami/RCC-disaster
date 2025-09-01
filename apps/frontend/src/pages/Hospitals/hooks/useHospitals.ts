import { useState, useEffect } from 'react';
import { Hospital, CapacityAlert, HospitalFilters } from '../../../services/hospitalService';
import { hospitalService } from '../../../services/hospitalService';
import { filterHospitals } from '../utils/hospitalUtils';

interface UseHospitalsReturn {
  hospitals: Hospital[];
  alerts: CapacityAlert[];
  loading: boolean;
  error: string | null;
  filters: HospitalFilters;
  filteredHospitals: Hospital[];
  loadHospitals: () => Promise<void>;
  loadAlerts: () => Promise<void>;
  setFilters: (filters: HospitalFilters) => void;
  resetFilters: () => void;
}

export const useHospitals = (): UseHospitalsReturn => {
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [alerts, setAlerts] = useState<CapacityAlert[]>([]);
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

  const loadAlerts = async () => {
    try {
      const data = await hospitalService.getCapacityAlerts();
      setAlerts(data);
    } catch (err) {
      console.error('Error loading alerts:', err);
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
    loadAlerts();
  }, [filters]);

  return {
    hospitals,
    alerts,
    loading,
    error,
    filters,
    filteredHospitals,
    loadHospitals,
    loadAlerts,
    setFilters,
    resetFilters,
  };
};
