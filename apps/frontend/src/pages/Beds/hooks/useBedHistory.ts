import { useState, useCallback } from 'react';
import { bedService, BedStatusHistoryItem } from '../services/bedService';
import { useSnackbar } from 'notistack';

export const useBedHistory = (bedId: string | null, enabled: boolean = true) => {
  const { enqueueSnackbar } = useSnackbar();
  const [history, setHistory] = useState<BedStatusHistoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = useCallback(async () => {
    if (!enabled || !bedId) {
      setHistory([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await bedService.getBedStatusHistory(bedId);
      setHistory(data);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to load bed history';
      setError(errorMessage);
      enqueueSnackbar(errorMessage, { variant: 'error' });
      setHistory([]);
    } finally {
      setLoading(false);
    }
  }, [bedId, enabled, enqueueSnackbar]);

  return {
    history,
    loading,
    error,
    refetch: fetchHistory,
  };
};

