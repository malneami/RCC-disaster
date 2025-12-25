import { useState, useEffect, useCallback } from 'react';
import { bedService } from '../services/bedService';
import { useSnackbar } from 'notistack';

export interface UnitInfo {
  id: string;
  name: string;
}

export const useUnits = (hospitalId: string | null | undefined, enabled: boolean = true) => {
  const { enqueueSnackbar } = useSnackbar();
  const [units, setUnits] = useState<UnitInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUnits = useCallback(async () => {
    if (!enabled || !hospitalId) {
      setUnits([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await bedService.getUnits(hospitalId);
      setUnits(data.map(u => ({ id: u.id, name: u.name })));
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to fetch units';
      setError(errorMessage);
      enqueueSnackbar(errorMessage, { variant: 'error' });
      setUnits([]);
    } finally {
      setLoading(false);
    }
  }, [hospitalId, enabled, enqueueSnackbar]);

  useEffect(() => {
    fetchUnits();
  }, [fetchUnits]);

  return { units, loading, error, refetch: fetchUnits };
};

