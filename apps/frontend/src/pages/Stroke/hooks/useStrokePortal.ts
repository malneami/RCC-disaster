import { useState, useEffect } from 'react';
import { StrokeService, StrokeCase, StrokeKPISummary } from '../../../services/strokeService';

export const useStrokePortal = () => {
  const [strokeCases, setStrokeCases] = useState<StrokeCase[]>([]);
  const [kpiSummary, setKpiSummary] = useState<StrokeKPISummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [casesData, kpiData] = await Promise.all([
        StrokeService.getStrokeCases(),
        StrokeService.getKPISummary()
      ]);

      setStrokeCases(casesData);
      setKpiSummary(kpiData);
    } catch (err) {
      setError('Failed to load stroke portal data');
      console.error('Error loading stroke portal data:', err);
    } finally {
      setLoading(false);
    }
  };

  const createCase = async (data: any) => {
    try {
      const newCase = await StrokeService.createStrokeCase(data);
      setStrokeCases(prev => [newCase, ...prev]);
      // Refresh KPI data
      const updatedKpi = await StrokeService.getKPISummary();
      setKpiSummary(updatedKpi);
      return newCase;
    } catch (err) {
      console.error('Error creating stroke case:', err);
      throw err;
    }
  };

  const updateCase = async (id: string, data: any) => {
    try {
      const updatedCase = await StrokeService.updateStrokeCase(id, data);
      setStrokeCases(prev => prev.map(case_ => case_.id === id ? updatedCase : case_));
      // Refresh KPI data
      const updatedKpi = await StrokeService.getKPISummary();
      setKpiSummary(updatedKpi);
      return updatedCase;
    } catch (err) {
      console.error('Error updating stroke case:', err);
      throw err;
    }
  };

  const deleteCase = async (id: string) => {
    try {
      await StrokeService.deleteStrokeCase(id);
      setStrokeCases(prev => prev.filter(case_ => case_.id !== id));
      // Refresh KPI data
      const updatedKpi = await StrokeService.getKPISummary();
      setKpiSummary(updatedKpi);
    } catch (err) {
      console.error('Error deleting stroke case:', err);
      throw err;
    }
  };

  const refreshData = () => {
    loadData();
  };

  useEffect(() => {
    loadData();
  }, []);

  return {
    strokeCases,
    kpiSummary,
    loading,
    error,
    createCase,
    updateCase,
    deleteCase,
    refreshData,
  };
};

export default useStrokePortal;
