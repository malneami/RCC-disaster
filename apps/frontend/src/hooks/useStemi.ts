import { useState, useEffect, useCallback } from 'react';
import { StemiCase, CreateStemiCaseDto, UpdateStemiStatusDto, StemiFilters, KpiResult, HospitalRoute, RoutingCriteria } from '../services/stemiService';
import stemiService from '../services/stemiService';

export const useStemiCases = (filters?: StemiFilters) => {
  const [cases, setCases] = useState<StemiCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCases = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await stemiService.getStemiCases(filters);
      setCases(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch STEMI cases');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchCases();
  }, [fetchCases]);

  const createCase = async (data: CreateStemiCaseDto) => {
    try {
      const newCase = await stemiService.createStemiCase(data);
      setCases(prev => [newCase, ...prev]);
      return newCase;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create STEMI case');
      throw err;
    }
  };

  const updateCase = async (id: string, data: Partial<CreateStemiCaseDto>) => {
    try {
      const updatedCase = await stemiService.updateStemiCase(id, data);
      setCases(prev => prev.map(c => c.id === id ? updatedCase : c));
      return updatedCase;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update STEMI case');
      throw err;
    }
  };

  const updateStatus = async (id: string, data: UpdateStemiStatusDto) => {
    try {
      const updatedCase = await stemiService.updateStemiStatus(id, data);
      setCases(prev => prev.map(c => c.id === id ? updatedCase : c));
      return updatedCase;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update status');
      throw err;
    }
  };

  const deleteCase = async (id: string) => {
    try {
      await stemiService.deleteStemiCase(id);
      setCases(prev => prev.filter(c => c.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete STEMI case');
      throw err;
    }
  };

  return {
    cases,
    loading,
    error,
    fetchCases,
    createCase,
    updateCase,
    updateStatus,
    deleteCase,
  };
};

export const useActiveStemiCases = () => {
  const [activeCases, setActiveCases] = useState<StemiCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchActiveCases = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await stemiService.getActiveStemiCases();
      setActiveCases(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch active cases');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchActiveCases();
    // Refresh every 30 seconds for active cases
    const interval = setInterval(fetchActiveCases, 30000);
    return () => clearInterval(interval);
  }, [fetchActiveCases]);

  return {
    activeCases,
    loading,
    error,
    fetchActiveCases,
  };
};

export const useStemiCase = (id: string) => {
  const [caseData, setCaseData] = useState<StemiCase | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCase = useCallback(async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      setError(null);
      const data = await stemiService.getStemiCase(id);
      setCaseData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch STEMI case');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchCase();
  }, [fetchCase]);

  const updateCase = async (data: Partial<CreateStemiCaseDto>) => {
    try {
      const updatedCase = await stemiService.updateStemiCase(id, data);
      setCaseData(updatedCase);
      return updatedCase;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update STEMI case');
      throw err;
    }
  };

  const updateStatus = async (data: UpdateStemiStatusDto) => {
    try {
      const updatedCase = await stemiService.updateStemiStatus(id, data);
      setCaseData(updatedCase);
      return updatedCase;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update status');
      throw err;
    }
  };

  return {
    caseData,
    loading,
    error,
    fetchCase,
    updateCase,
    updateStatus,
  };
};

export const useStemiStatistics = () => {
  const [statistics, setStatistics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStatistics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await stemiService.getStemiStatistics();
      setStatistics(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch statistics');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatistics();
  }, [fetchStatistics]);

  return {
    statistics,
    loading,
    error,
    fetchStatistics,
  };
};

export const useStemiKpis = (stemiCaseId: string) => {
  const [kpis, setKpis] = useState<KpiResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const calculateKpis = useCallback(async () => {
    if (!stemiCaseId) return;
    
    try {
      setLoading(true);
      setError(null);
      const data = await stemiService.calculateCaseKpis(stemiCaseId);
      setKpis(data);
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to calculate KPIs');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [stemiCaseId]);

  return {
    kpis,
    loading,
    error,
    calculateKpis,
  };
};

export const useHospitalRouting = () => {
  const [routes, setRoutes] = useState<HospitalRoute[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const findHospitals = useCallback(async (criteria: RoutingCriteria) => {
    try {
      setLoading(true);
      setError(null);
      const data = await stemiService.findPciCapableHospitals(criteria);
      setRoutes(data);
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to find hospitals');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const findNearest = useCallback(async (latitude: number, longitude: number, requires24x7: boolean = false) => {
    try {
      setLoading(true);
      setError(null);
      const data = await stemiService.findNearestPciHospital(latitude, longitude, requires24x7);
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to find nearest hospital');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    routes,
    loading,
    error,
    findHospitals,
    findNearest,
  };
};
