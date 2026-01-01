import { useState, useEffect } from 'react';
import { dataQualityService } from '../../../services/dataQualityService';
import { AuditKPIData, AuditKPIFilters } from '../../../types/dataQuality';

export const useAuditKPIs = (filters?: AuditKPIFilters) => {
  const [data, setData] = useState<AuditKPIData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadKPIs();
  }, [filters?.startDate, filters?.endDate, filters?.hospitalId, filters?.recordType, filters?.patientId]);

  const loadKPIs = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await dataQualityService.getAuditKPIs(filters);
      setData(result);
    } catch (err) {
      console.error('Error loading audit KPIs:', err);
      setError(err instanceof Error ? err.message : 'Failed to load audit KPIs');
    } finally {
      setLoading(false);
    }
  };

  return {
    data,
    loading,
    error,
    refetch: loadKPIs,
  };
};


