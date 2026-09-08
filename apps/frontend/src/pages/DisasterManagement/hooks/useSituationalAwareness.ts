import { useState, useEffect, useCallback } from 'react';
import { disasterService } from '../../../services/disasterService';

declare type Socket = import('socket.io-client').Socket;

export interface SituationalAwareness {
  incident: {
    id: string;
    incidentType: string;
    escalationLevel: string | null;
    activatedAt: string | null;
    timeSinceActivationMinutes: number;
    estimatedCasualties: { green: number; yellow: number; red: number; black: number; total: number };
    affectedPathways: string[];
  };
  ems: {
    dispatched: number;
    onScene: number;
    enRoute: number;
    delayedUnits: number;
  };
  hospital: {
    icuAvailable: number;
    icuTotal: number;
    nicuAvailable: number;
    nicuTotal: number;
    orReadiness: string;
    bloodBankStatus: string;
  };
  kpis: {
    activationToDispatchMinutes: number | null;
    dispatchToArrivalMinutes: number | null;
    redCasesPending: number;
    bedAllocationDelayMinutes: number | null;
  };
  suggestedLevel?: string;
  escalationTriggers?: {
    redCasesLast10Min: number;
    activeCriticalCases: number;
    icuCapacityPercent: number;
  };
  requiredRolesForLevel?: string[];
}

export function useSituationalAwareness(
  incidentId: string | null,
  socketRef: React.RefObject<Socket | null>,
  enabled: boolean
) {
  const [data, setData] = useState<SituationalAwareness | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (!incidentId || !enabled) return;
    setLoading(true);
    setError(null);
    try {
      const result = await disasterService.getSituationalAwareness(incidentId);
      setData(result);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to load situational awareness');
      setData(null);
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
    socket.on('situational-awareness-updated', handler);
    socket.on('command-room-updated', handler);
    return () => {
      socket.off('situational-awareness-updated', handler);
      socket.off('command-room-updated', handler);
    };
  }, [socketRef, incidentId, refetch]);

  return { data, loading, error, refetch };
}
