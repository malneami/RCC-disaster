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
    <div style={{ width: '100%', height: '300px' }}>
      <h3 style={{ textAlign: 'center', marginBottom: '16px', fontSize: '16px', fontWeight: 'bold' }}>
        {title}
      </h3>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
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
          <Bar dataKey="value" fill="#2196f3" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default BarChartComponent;
