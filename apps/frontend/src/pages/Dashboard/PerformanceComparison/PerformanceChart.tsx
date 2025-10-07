import React from 'react';
import { Box, Typography } from '@mui/material';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';

export interface ChartDataPoint {
  date: string;
  stemi: number;
  stroke: number;
  trauma: number;
  other: number;
}

export interface PerformanceChartData {
  data: ChartDataPoint[];
}

interface PerformanceChartProps {
  data?: PerformanceChartData;
}

const PerformanceChart: React.FC<PerformanceChartProps> = ({ data }) => {
  const chartData = data?.data || [];

  // Default empty data if no data provided
  const defaultData = [
    { date: 'Aug 12', stemi: 0, stroke: 0, trauma: 0, other: 0 },
    { date: 'Aug 13', stemi: 0, stroke: 0, trauma: 0, other: 0 },
    { date: 'Aug 14', stemi: 0, stroke: 0, trauma: 0, other: 0 },
    { date: 'Aug 15', stemi: 0, stroke: 0, trauma: 0, other: 0 },
    { date: 'Aug 16', stemi: 0, stroke: 0, trauma: 0, other: 0 },
    { date: 'Aug 17', stemi: 0, stroke: 0, trauma: 0, other: 0 },
    { date: 'Aug 18', stemi: 0, stroke: 0, trauma: 0, other: 0 },
    { date: 'Aug 19', stemi: 0, stroke: 0, trauma: 0, other: 0 },
    { date: 'Aug 20', stemi: 0, stroke: 0, trauma: 0, other: 0 },
    { date: 'Aug 21', stemi: 0, stroke: 0, trauma: 0, other: 0 },
    { date: 'Aug 22', stemi: 0, stroke: 0, trauma: 0, other: 0 },
    { date: 'Aug 23', stemi: 0, stroke: 0, trauma: 0, other: 0 },
    { date: 'Aug 24', stemi: 0, stroke: 0, trauma: 0, other: 0 },
    { date: 'Aug 25', stemi: 0, stroke: 0, trauma: 0, other: 0 },
    { date: 'Aug 26', stemi: 0, stroke: 0, trauma: 0, other: 0 },
    { date: 'Aug 27', stemi: 0, stroke: 0, trauma: 0, other: 0 },
    { date: 'Aug 28', stemi: 0, stroke: 0, trauma: 0, other: 0 },
    { date: 'Aug 29', stemi: 0, stroke: 0, trauma: 0, other: 0 },
    { date: 'Aug 30', stemi: 0, stroke: 0, trauma: 0, other: 0 },
    { date: 'Aug 31', stemi: 0, stroke: 0, trauma: 0, other: 0 },
    { date: 'Sep 1', stemi: 0, stroke: 0, trauma: 0, other: 0 },
    { date: 'Sep 2', stemi: 0, stroke: 0, trauma: 0, other: 0 },
    { date: 'Sep 3', stemi: 0, stroke: 0, trauma: 0, other: 0 },
    { date: 'Sep 4', stemi: 0, stroke: 0, trauma: 0, other: 0 },
    { date: 'Sep 5', stemi: 0, stroke: 0, trauma: 0, other: 0 },
    { date: 'Sep 6', stemi: 0, stroke: 0, trauma: 0, other: 0 },
    { date: 'Sep 7', stemi: 0, stroke: 0, trauma: 0, other: 0 },
    { date: 'Sep 8', stemi: 0, stroke: 0, trauma: 0, other: 0 },
    { date: 'Sep 9', stemi: 0, stroke: 0, trauma: 0, other: 0 },
    { date: 'Sep 10', stemi: 0, stroke: 0, trauma: 0, other: 0 },
  ];

  const displayData = chartData.length > 0 ? chartData : defaultData;

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <Box
          sx={{
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: 2,
            p: 2,
          }}
        >
          <Typography variant="body2" sx={{ color: 'white', mb: 1 }}>
            {label}
          </Typography>
          {payload.map((entry: any, index: number) => (
            <Typography
              key={index}
              variant="body2"
              sx={{ color: entry.color }}
            >
              {entry.name}: {entry.value}
            </Typography>
          ))}
        </Box>
      );
    }
    return null;
  };

  return (
    <Box>
      <Box sx={{ height: 400, width: '100%' }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={displayData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(0, 0, 0, 0.1)" />
            <XAxis 
              dataKey="date" 
              stroke="currentColor"
              fontSize={12}
              tick={{ fill: 'currentColor' }}
            />
            <YAxis 
              stroke="currentColor"
              fontSize={12}
              tick={{ fill: 'currentColor' }}
              domain={[0, 1]}
              ticks={[0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0]}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              wrapperStyle={{ color: 'currentColor' }}
            />
            <Line
              type="monotone"
              dataKey="stemi"
              stroke="#f44336"
              strokeWidth={2}
              dot={{ fill: '#f44336', strokeWidth: 2, r: 4 }}
              name="STEMI"
            />
            <Line
              type="monotone"
              dataKey="stroke"
              stroke="#4caf50"
              strokeWidth={2}
              dot={{ fill: '#4caf50', strokeWidth: 2, r: 4 }}
              name="Stroke"
            />
            <Line
              type="monotone"
              dataKey="trauma"
              stroke="#ff9800"
              strokeWidth={2}
              dot={{ fill: '#ff9800', strokeWidth: 2, r: 4 }}
              name="Trauma"
            />
            <Line
              type="monotone"
              dataKey="other"
              stroke="#9c27b0"
              strokeWidth={2}
              dot={{ fill: '#9c27b0', strokeWidth: 2, r: 4 }}
              name="Other"
            />
          </LineChart>
        </ResponsiveContainer>
      </Box>
    </Box>
  );
};

export default PerformanceChart;
