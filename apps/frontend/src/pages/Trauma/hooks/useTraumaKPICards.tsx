import { useMemo } from 'react';
import { Assessment, Warning, TransferWithinAStation, Schedule } from '@mui/icons-material';
import { TraumaKPISummary } from '../../../services/traumaService';

export const useTraumaKPICards = (kpiSummary: TraumaKPISummary | null) => {
  const kpiCards = useMemo(() => [
    {
      title: 'Total Cases',
      value: kpiSummary?.totalCases || 0,
      color: '#1976d2',
      icon: <Assessment />,
    },
    {
      title: 'Critical Cases',
      value: kpiSummary?.criticalCases || 0,
      color: '#d32f2f',
      icon: <Warning />,
    },
    {
      title: 'Transfer Cases',
      value: kpiSummary?.transferCases || 0,
      color: '#ed6c02',
      icon: <TransferWithinAStation />,
    },
    {
      title: 'Avg Response Time',
      value: kpiSummary?.averageResponseTime ? `${Math.round(kpiSummary.averageResponseTime)} min` : 'N/A',
      color: '#2e7d32',
      icon: <Schedule />,
    },
    {
      title: 'Mortality Rate',
      value: kpiSummary?.mortalityRate ? `${kpiSummary.mortalityRate.toFixed(1)}%` : 'N/A',
      color: '#d32f2f',
      icon: <Warning />,
    },
  ], [kpiSummary]);

  return { kpiCards };
};
