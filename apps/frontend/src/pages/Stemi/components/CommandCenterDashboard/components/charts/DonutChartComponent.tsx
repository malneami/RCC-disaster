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

const  DonutChartComponent: React.FC<DonutChartComponentProps> = ({
  data,
  title,
  colors = ['#4caf50', '#2196f3', '#ff9800', '#9c27b0', '#607d8b', '#f44336'],
  innerRadius = 70,
  outerRadius = 110,
}) => {
  const chartData = data.map((item, index) => ({
    name: item.name,
    value: item.value,
    fill: item.color || colors[index % colors.length],
  }));

  const total = chartData.reduce((sum, item) => sum + item.value, 0);

  // Custom label renderer - show value and percentage
  const renderCustomLabel = ({ cx, cy, midAngle, outerRadius, percent, value }: any) => {
    if (percent < 0.05) return null; // Don't show labels for very small slices
    
    const RADIAN = Math.PI / 180;
    const radius = outerRadius + 30;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text
        x={x}
        y={y}
        fill="#ffffff"
        textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline="central"
        style={{ fontSize: '13px', fontWeight: 500 }}
      >
        {`${value} (${(percent * 100).toFixed(0)}%)`}
      </text>
    );
  };

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const percentage = total > 0 ? ((data.value / total) * 100).toFixed(1) : 0;
      return (
        <div style={{
          backgroundColor: '#2a2a2a',
          border: '1px solid #444444',
          borderRadius: '8px',
          padding: '12px 16px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
        }}>
          <p style={{ 
            color: data.fill, 
            margin: 0, 
            fontWeight: 600,
            fontSize: '14px',
            marginBottom: '4px',
          }}>
            {data.name}
          </p>
          <p style={{ 
            color: '#ffffff', 
            margin: 0,
            fontSize: '13px',
          }}>
            Count: <strong>{data.value}</strong>
          </p>
          <p style={{ 
            color: 'rgba(255,255,255,0.7)', 
            margin: 0,
            fontSize: '12px',
          }}>
            {percentage}% of total
          </p>
        </div>
      );
    }
    return null;
  };

  // Custom legend
  const renderLegend = (props: any) => {
    const { payload } = props;
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        flexWrap: 'wrap', 
        gap: '16px',
        marginTop: '12px',
      }}>
        {payload.map((entry: any, index: number) => {
          const matchedData = chartData.find(item => item.name === entry.value);
          const value = matchedData?.value || entry.payload?.value || 0;
          
          return (
            <div key={`legend-${index}`} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ 
                width: '12px', 
                height: '12px', 
                borderRadius: '3px',
                backgroundColor: entry.color,
              }} />
              <span style={{ 
                color: '#ffffff', 
                fontSize: '13px',
                fontWeight: 500,
              }}>
                {entry.value}
              </span>
              <span style={{ 
                color: 'rgba(255,255,255,0.5)', 
                fontSize: '12px',
              }}>
                ({value})
              </span>
            </div>
          );
        })}
      </div>
    );
  };

  // Handle empty data
  if (!data || data.length === 0 || chartData.every(item => item.value === 0)) {
    return (
      <div style={{ 
        width: '100%', 
        height: '380px', 
        backgroundColor: '#1a1a1a', 
        borderRadius: '12px', 
        padding: '20px',
        border: '1px solid rgba(255,255,255,0.08)',
        display: 'flex',
        flexDirection: 'column',
      }}>
        <h3 style={{ 
          textAlign: 'center', 
          marginBottom: '16px', 
          fontSize: '1.1rem', 
          fontWeight: 600,
          color: '#ffffff'
        }}>
          {title}
        </h3>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flex: 1,
          color: 'rgba(255,255,255,0.4)',
          fontSize: '14px'
        }}>
          No data available
        </div>
      </div>
    );
  }

  return (
    <div style={{ 
      width: '100%', 
      height: '380px', 
      backgroundColor: '#1a1a1a', 
      borderRadius: '12px', 
      padding: '20px',
      border: '1px solid rgba(255,255,255,0.08)',
    }}>
      <h3 style={{ 
        textAlign: 'center', 
        marginBottom: '8px', 
        fontSize: '1.1rem', 
        fontWeight: 600,
        color: '#ffffff'
      }}>
        {title}
      </h3>
      {/* Total count */}
      <p style={{ 
        textAlign: 'center', 
        margin: '0 0 8px 0',
        fontSize: '0.85rem',
        color: 'rgba(255,255,255,0.5)',
      }}>
        Total: {total}
      </p>
      <ResponsiveContainer width="100%" height={280}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="45%"
            labelLine={false}
            label={renderCustomLabel}
            outerRadius={outerRadius}
            innerRadius={innerRadius}
            fill="#8884d8"
            dataKey="value"
            paddingAngle={2}
          >
            {chartData.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={entry.fill}
                stroke="rgba(0,0,0,0.3)"
                strokeWidth={1}
              />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend content={renderLegend} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export default DonutChartComponent;
