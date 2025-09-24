import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';

interface HeatmapChartComponentProps {
  data: Array<{
    name: string;
    value: number;
  }>;
  title: string;
  threshold?: number;
}

const HeatmapChartComponent: React.FC<HeatmapChartComponentProps> = ({
  data,
  title,
  threshold = 80,
}) => {
  const getColor = (value: number) => {
    if (value >= threshold) return '#4caf50'; // Green for good performance
    if (value >= threshold * 0.8) return '#ffc107'; // Yellow for warning
    return '#f44336'; // Red for poor performance
  };

  return (
    <div style={{ width: '100%', height: '300px' }}>
      <h3 style={{ textAlign: 'center', marginBottom: '16px', fontSize: '16px', fontWeight: 'bold' }}>
        {title}
      </h3>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{
            top: 20,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="value">
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={getColor(entry.value)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <div style={{ textAlign: 'center', marginTop: '8px', fontSize: '12px', color: '#666' }}>
        🟢 Good (≥{threshold}%) | 🟡 Warning (≥{threshold * 0.8}%) | 🔴 Poor (&lt;{threshold * 0.8}%)
      </div>
    </div>
  );
};

export default HeatmapChartComponent;
