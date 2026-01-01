import { useState, useEffect, useCallback, useRef } from 'react';
import { useQueryClient } from 'react-query';
import { hospitalService, Hospital, CriticalCase, HospitalTicket } from '../../../services/hospitalService';

export const useHospitalData = (hospitalId?: string) => {
  const queryClient = useQueryClient();
  const [hospital, setHospital] = useState<Hospital | null>(null);
  const [criticalCases, setCriticalCases] = useState<CriticalCase[]>([]);
  const [relatedTickets, setRelatedTickets] = useState<HospitalTicket[]>([]);
  const [transferTickets, setTransferTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const hasLoadedRef = useRef(false);

  const loadHospitalData = useCallback(async (isInitialLoad = false) => {
    if (!hospitalId) return;

    const shouldShowLoading = isInitialLoad || !hasLoadedRef.current;

    try {
      if (shouldShowLoading) {
        setLoading(true);
      }
      setError(null);

      const hospitalData = await hospitalService.getHospitalById(hospitalId);
      setHospital(hospitalData);

      const [criticalCasesData, transferTicketsData] = await Promise.all([
        hospitalService.getActiveCriticalCases(hospitalId),
        hospitalService.getTransferTicketsForHospital(hospitalId),
      ]);

      setCriticalCases(criticalCasesData);
      setRelatedTickets([]); // Seems like this was empty in the original code too?
      setTransferTickets(Array.isArray(transferTicketsData) ? transferTicketsData : []);

      // Refetch beds data using React Query
      queryClient.invalidateQueries(['beds', hospitalId]);

      hasLoadedRef.current = true;
    } catch (err) {
      setError('Failed to load hospital data');
      console.error('Error loading hospital data:', err);
    } finally {
      if (shouldShowLoading) {
        setLoading(false);
      }
    }
  }, [hospitalId, queryClient]);

  useEffect(() => {
    if (hospitalId) {
      hasLoadedRef.current = false;
      loadHospitalData(true);
    }
  }, [hospitalId, loadHospitalData]);

  // Auto-refresh data every 30 seconds
  useEffect(() => {
    if (hospitalId) {
      const interval = setInterval(() => {
        loadHospitalData(false);
      }, 30000); // Refresh every 30 seconds

      return () => clearInterval(interval);
    }
  }, [hospitalId, loadHospitalData]);

  return {
    hospital,
    setHospital,
    criticalCases,
    relatedTickets,
    transferTickets,
    loading,
    error,
    loadHospitalData,
  };
};
