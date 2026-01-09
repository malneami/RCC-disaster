import { ChartDataPoint } from './PerformanceChart';

export interface CaseDistribution {
  name: string;
  value: number;
  count: number;
  percentage: number;
  color: string;
}

export const calculateCaseDistribution = (
  chartData: ChartDataPoint[]
): CaseDistribution[] => {
  // Sum all cases by type
  const totals = chartData.reduce(
    (acc, point) => ({
      stemi: acc.stemi + (point.stemi || 0),
      stroke: acc.stroke + (point.stroke || 0),
      trauma: acc.trauma + (point.trauma || 0),
      other: acc.other + (point.other || 0),
    }),
    { stemi: 0, stroke: 0, trauma: 0, other: 0 }
  );

  // Calculate total cases
  const totalCases =
    totals.stemi + totals.stroke + totals.trauma + totals.other;

  // If no cases, return empty distribution
  if (totalCases === 0) {
    return [
      {
        name: 'STEMI',
        value: 0,
        count: 0,
        percentage: 0,
        color: '#f44336',
      },
      {
        name: 'Stroke',
        value: 0,
        count: 0,
        percentage: 0,
        color: '#4caf50',
      },
      {
        name: 'Trauma',
        value: 0,
        count: 0,
        percentage: 0,
        color: '#ff9800',
      },
      {
        name: 'Other',
        value: 0,
        count: 0,
        percentage: 0,
        color: '#9c27b0',
      },
    ];
  }

  // Calculate percentages and format data
  return [
    {
      name: 'STEMI',
      value: totals.stemi,
      count: totals.stemi,
      percentage: Math.round((totals.stemi / totalCases) * 100 * 10) / 10,
      color: '#f44336',
    },
    {
      name: 'Stroke',
      value: totals.stroke,
      count: totals.stroke,
      percentage: Math.round((totals.stroke / totalCases) * 100 * 10) / 10,
      color: '#4caf50',
    },
    {
      name: 'Trauma',
      value: totals.trauma,
      count: totals.trauma,
      percentage: Math.round((totals.trauma / totalCases) * 100 * 10) / 10,
      color: '#ff9800',
    },
    {
      name: 'Other',
      value: totals.other,
      count: totals.other,
      percentage: Math.round((totals.other / totalCases) * 100 * 10) / 10,
      color: '#9c27b0',
    },
  ];
};