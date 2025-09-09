import { useState, useEffect, useCallback } from 'react';
import { TraumaService, TraumaCase, TraumaKPISummary } from '../../../services/traumaService';

export const useTraumaData = () => {
  const [traumaCases, setTraumaCases] = useState<TraumaCase[]>([]);
  const [kpiSummary, setKpiSummary] = useState<TraumaKPISummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [casesData, kpiData] = await Promise.all([
        TraumaService.getTraumaCases(),
        TraumaService.getKPISummary()
      ]);

      setTraumaCases(casesData.cases);
      setKpiSummary(kpiData);
    } catch (err) {
      console.error('Error loading trauma portal data:', err);
      setError('Failed to load trauma portal data');
    } finally {
      setLoading(false);
    }
  }, []);

  const createCase = useCallback(async (data: any) => {
    try {
      await TraumaService.createTraumaCase(data);
      await loadData(); // Refresh data
    } catch (err) {
      console.error('Error creating trauma case:', err);
      throw err;
    }
  }, [loadData]);

  const deleteCase = useCallback(async (id: string) => {
    try {
      await TraumaService.deleteTraumaCase(id);
      await loadData(); // Refresh data
    } catch (err) {
      console.error('Error deleting trauma case:', err);
      throw err;
    }
  }, [loadData]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return {
    traumaCases,
    kpiSummary,
    loading,
    error,
    loadData,
    createCase,
    deleteCase
  };
};