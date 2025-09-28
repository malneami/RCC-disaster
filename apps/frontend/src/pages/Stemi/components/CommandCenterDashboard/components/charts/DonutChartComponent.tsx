import React from 'react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts';

interface DonutChartComponentProps {
  data: Array<{
    name: string;
    value: number;
    color?: string;
  }>;
  title: string;
  colors?: string[];
  innerRadius?: number;
  outerRadius?: number;
}

const DonutChartComponent: React.FC<DonutChartComponentProps> = ({
  data,
  title,
  colors = ['#4caf50', '#2196f3', '#ff9800', '#9c27b0', '#607d8b', '#f44336'],
  innerRadius = 60,
  outerRadius = 100,
}) => {
  const chartData = data.map((item, index) => ({
    name: item.name,
    value: item.value,
    fill: item.color || colors[index % colors.length],
  }));

  // Handle empty data
  if (!data || data.length === 0 || chartData.every(item => item.value === 0)) {
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
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '250px',
          color: '#888888',
          fontSize: '14px'
        }}>
          No data available
        </div>
      </div>
    );
  }

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
            outerRadius={outerRadius}
            innerRadius={innerRadius}
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

export default DonutChartComponent;
