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
    <div style={{ width: '100%', height: '350px', backgroundColor: '#1a1a1a', borderRadius: '8px', padding: '16px' }}>
      <h3 style={{ 
        textAlign: 'center', 
        marginBottom: '16px', 
        fontSize: '16px', 
        fontWeight: 'bold',
        color: '#ffffff'
      }}>
        {title}
      </h3>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart
          data={data}
          margin={{
            top: 20,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#444444" />
          <XAxis 
            dataKey="name" 
            tick={{ fill: '#ffffff' }}
            axisLine={{ stroke: '#666666' }}
          />
          <YAxis 
            tick={{ fill: '#ffffff' }}
            axisLine={{ stroke: '#666666' }}
          />
          <Tooltip 
            contentStyle={{
              backgroundColor: '#2a2a2a',
              border: '1px solid #444444',
              borderRadius: '8px',
              color: '#ffffff'
            }}
            labelStyle={{ color: '#ffffff' }}
          />
          <Legend 
            wrapperStyle={{ color: '#ffffff' }}
          />
          <Bar dataKey="value">
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={getColor(entry.value)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <div style={{ 
        textAlign: 'center', 
        marginTop: '8px', 
        fontSize: '12px', 
        color: '#cccccc'
      }}>
        🟢 Good (≥{threshold.toFixed(1)}%) | 🟡 Warning (≥{(threshold * 0.8).toFixed(1)}%) | 🔴 Poor (&lt;{(threshold * 0.8).toFixed(1)}%)
      </div>
    </div>
  );
};

export default HeatmapChartComponent;
