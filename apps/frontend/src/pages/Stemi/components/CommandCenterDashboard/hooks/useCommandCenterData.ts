import { useState, useEffect, useCallback } from 'react';
import { CommandCenterFilters, CommandCenterData } from '../types';
import { hospitalService, Hospital } from '../../../../../services/hospitalService';
import { commandCenterService } from '../api/commandCenterService';

export const useCommandCenterData = (filters: CommandCenterFilters) => {
  const [data, setData] = useState<CommandCenterData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [hospitalsLoaded, setHospitalsLoaded] = useState(false);

  const fetchHospitals = useCallback(async () => {
    if (hospitalsLoaded) return; // Only fetch once
    
    try {
      const hospitalsData = await hospitalService.getAllHospitals();
      console.log('[Dashboard] Hospitals fetched:', hospitalsData.length);
      setHospitals(hospitalsData);
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
      
      // Call the real API service
      console.log('[Dashboard] Fetching data with filters:', filters);
      const apiData = await commandCenterService.getDashboardData(filters);
      console.log('[Dashboard] API response received:', apiData);
      
      // Transform API response to match our frontend types
      const transformedData: CommandCenterData = {
        summary: apiData.summary,
        kpis: apiData.kpis,
        hospitals: apiData.hospitals,
        hospitalPerformanceHeatmap: apiData.hospitalPerformanceHeatmap || [],
        charts: apiData.charts,
        recentCases: apiData.recentCases,
      };
      
      setData(transformedData);
    } catch (err) {
      console.error('Error fetching command center data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
      
      // Don't use mock data - show the actual error
      console.log('API call failed - no fallback data will be shown');
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
    hospitals,
  };
};