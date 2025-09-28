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
} from 'recharts';

interface BarChartComponentProps {
  data: Array<{
    name: string;
    value: number;
    color?: string;
  }>;
  title: string;
  xAxisLabel?: string;
  yAxisLabel?: string;
  colors?: string[];
}

const BarChartComponent: React.FC<BarChartComponentProps> = ({
  data,
  title,
  colors = ['#2196f3', '#4caf50', '#ff9800', '#f44336', '#9c27b0'],
}) => {
  const chartData = data.map((item, index) => ({
    name: item.name,
    value: item.value,
    fill: item.color || colors[index % colors.length],
  }));

  return (
    <div style={{ width: '100%', height: '350px', backgroundColor: '#1a1a1a', borderRadius: '8px', padding: '16px' }}>
      <h3 style={{ 
        textAlign: 'center', 
        marginBottom: '16px', 
        fontSize: '16px', 
        fontWeight: 'bold',
        color: '#ffffff',
        height: '32px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        {title}
      </h3>
      <ResponsiveContainer width="100%" height="calc(100% - 48px)">
        <BarChart
          data={chartData}
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
          <Bar dataKey="value" fill="#64b5f6" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default BarChartComponent;
