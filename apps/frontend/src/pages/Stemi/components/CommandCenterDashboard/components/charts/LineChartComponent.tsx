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
    <div style={{ width: '100%', height: '300px' }}>
      <h3 style={{ textAlign: 'center', marginBottom: '16px', fontSize: '16px', fontWeight: 'bold' }}>
        {title}
      </h3>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
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
          <Line 
            type="monotone" 
            dataKey="value" 
            stroke="#2196f3" 
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
