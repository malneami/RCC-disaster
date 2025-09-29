import { useState, useEffect, useCallback } from 'react';
import { StrokeCommandCenterFilters, StrokeCommandCenterData } from '../types';
import { hospitalService } from '../../../../../services/hospitalService';
import { commandCenterService } from '../api/commandCenterService';

export const useStrokeCommandCenterData = (filters: StrokeCommandCenterFilters) => {
  const [data, setData] = useState<StrokeCommandCenterData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hospitalsLoaded, setHospitalsLoaded] = useState(false);

  const fetchHospitals = useCallback(async () => {
    if (hospitalsLoaded) return; // Only fetch once
    
    try {
      const hospitalsData = await hospitalService.getAllHospitals();
      console.log('[Stroke Dashboard] Hospitals fetched:', hospitalsData.length);
      setHospitalsLoaded(true);
    } catch (err) {
      console.error('Failed to fetch hospitals:', err);
      setHospitalsLoaded(true);
    }
  }, [hospitalsLoaded]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch hospitals first (only once)
      await fetchHospitals();
      
      // Fetch real data from the backend
      console.log('[Stroke Dashboard] Fetching data with filters:', filters);
      const dashboardData = await commandCenterService.getDashboardData(filters);
      console.log('[Stroke Dashboard] Data received:', dashboardData);
      
      setData(dashboardData);
    } catch (err) {
      console.error('Error fetching stroke command center data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  }, [filters, fetchHospitals]);

  const refreshData = useCallback(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    refreshData,
  };
};
