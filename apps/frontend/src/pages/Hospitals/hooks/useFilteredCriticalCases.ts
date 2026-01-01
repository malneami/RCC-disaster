import { useMemo, useEffect } from 'react';
import { useHospitalCriticalCases } from './useHospitalCriticalCases';
import { useAudioAlerts } from '../../Dashboard/CriticalCaseTracker/useAudioAlerts';

export const useFilteredCriticalCases = (hospitalId: string) => {
  const { data: criticalCases, isLoading, error, refetch } = useHospitalCriticalCases(hospitalId);
  const { playAlert } = useAudioAlerts();

  const { stemiStrokeCases, otherCriticalCases, allCriticalCases } = useMemo(() => {
    if (!criticalCases) {
      return { stemiStrokeCases: [], otherCriticalCases: [], allCriticalCases: [] };
    }

    const stemiStroke = criticalCases.filter(case_ => {
      if (case_.pathway !== 'STEMI' && case_.pathway !== 'STROKE') return false;
      if (case_.status === 'COMPLETED') return false;
      if (case_.acknowledgedAt) return false;

      const creationTime = new Date(case_.createdAt).getTime();
      const twentyFourHours = 24 * 60 * 60 * 1000;
      return (Date.now() - creationTime) < twentyFourHours;
    });

    const other = criticalCases.filter(case_ => {
      if (case_.pathway === 'STEMI' || case_.pathway === 'STROKE') return false;
      if (case_.priority !== 'CRITICAL' && case_.priority !== 'EMERGENCY') return false;
      if (case_.status === 'COMPLETED') return false;
      if (case_.acknowledgedAt) return false;
      return true;
    });

    return {
      stemiStrokeCases: stemiStroke,
      otherCriticalCases: other,
      allCriticalCases: [...stemiStroke, ...other],
    };
  }, [criticalCases]);

  useEffect(() => {
    if (stemiStrokeCases.length > 0) {
      const critical = stemiStrokeCases.filter(case_ => {
        const elapsed = Date.now() - new Date(case_.createdAt).getTime();
        const timeLimit = case_.pathway === 'STEMI' ? 120 * 60 * 1000 : 4.5 * 60 * 60 * 1000;
        const percentage = Math.min(100, (elapsed / timeLimit) * 100);
        return percentage >= 100;
      });

      if (critical.length > 0) {
        playAlert(critical[0].pathway);
      }
    }
  }, [stemiStrokeCases, playAlert]);

  return {
    criticalCases: allCriticalCases,
    stemiStrokeCases,
    otherCriticalCases,
    isLoading,
    error,
    refetch,
  };
};
