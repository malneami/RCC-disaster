import { useState, useEffect, useCallback } from 'react';
import { bedService, Bed, GetBedsParams } from '../services/bedService';

export const useBeds = (params?: GetBedsParams) => {
  const [beds, setBeds] = useState<Bed[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBeds = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await bedService.getBeds(params);
      setBeds(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch beds');
      setBeds([]);
    } finally {
      setLoading(false);
    }
  }, [params?.hospitalId, params?.unitId, params?.status]);

  useEffect(() => {
    fetchBeds();
  }, [fetchBeds]);

  const updateBed = useCallback((updatedBed: Bed) => {
    setBeds((prevBeds) =>
      prevBeds.map((bed) => (bed.id === updatedBed.id ? updatedBed : bed))
    );
  }, []);

  return {
    beds,
    loading,
    error,
    refetch: fetchBeds,
    updateBed,
  };
};

