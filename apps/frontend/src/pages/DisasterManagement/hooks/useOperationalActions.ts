import { useState, useEffect, useCallback } from 'react';
import { disasterService } from '../../../services/disasterService';

declare type Socket = import('socket.io-client').Socket;

export interface OperationalAction {
  id: string;
  action: string;
  details?: string | Record<string, unknown>;
  userId: string;
  user?: { id: string; firstName?: string; lastName?: string };
  createdAt: string;
  source: 'audit' | 'decision';
  rawAction: string;
}

export function useOperationalActions(
  incidentId: string | null,
  socketRef: React.RefObject<Socket | null>,
  enabled: boolean
) {
  const [actions, setActions] = useState<OperationalAction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (!incidentId || !enabled) return;
    setLoading(true);
    setError(null);
    try {
      const result = await disasterService.getOperationalActions(incidentId);
      setActions(result?.actions ?? []);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to load operational actions');
      setActions([]);
    } finally {
      setLoading(false);
    }
  }, [incidentId, enabled]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  useEffect(() => {
    const socket = socketRef?.current;
    if (!socket || !incidentId) return;
    const handler = (payload: { incidentId?: string }) => {
      if (payload?.incidentId === incidentId) refetch();
    };
    socket.on('command-room-updated', handler);
    socket.on('situational-awareness-updated', handler);
    return () => {
      socket.off('command-room-updated', handler);
      socket.off('situational-awareness-updated', handler);
    };
  }, [socketRef, incidentId, refetch]);

  return { actions, loading, error, refetch };
}
