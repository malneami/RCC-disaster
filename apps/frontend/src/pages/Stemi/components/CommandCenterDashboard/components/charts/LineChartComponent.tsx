import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface LineChartComponentProps {
  data: Array<{
    name: string;
    value: number;
    target?: number;
  }>;
  title: string;
  xAxisLabel?: string;
  yAxisLabel?: string;
  showTarget?: boolean;
}

const LineChartComponent: React.FC<LineChartComponentProps> = ({
  data,
  title,
  showTarget = false,
}) => {
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
        <LineChart
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
          <Line 
            type="monotone" 
            dataKey="value" 
            stroke="#64b5f6" 
            strokeWidth={2}
            name="Actual"
          />
          {showTarget && (
            <Line 
              type="monotone" 
              dataKey="target" 
              stroke="#f44336" 
              strokeWidth={2}
              strokeDasharray="5 5"
              name="Target"
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default LineChartComponent;
