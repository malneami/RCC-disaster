import React from 'react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts';

interface PieChartComponentProps {
  data: Array<{
    name: string;
    value: number;
    color?: string;
  }>;
  title: string;
  colors?: string[];
}

const PieChartComponent: React.FC<PieChartComponentProps> = ({
  data,
  title,
  colors = ['#4caf50', '#2196f3', '#ff9800', '#9c27b0', '#607d8b', '#f44336'],
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
        color: '#ffffff'
      }}>
        {title}
      </h3>
      <ResponsiveContainer width="100%" height={250}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(1)}%`}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.fill} />
            ))}
          </Pie>
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
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export default PieChartComponent;
