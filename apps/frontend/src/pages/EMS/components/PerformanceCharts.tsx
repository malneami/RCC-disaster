import React from 'react';
import { Box, Typography } from '@mui/material';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';

interface PerformanceChartsProps {
  responseTimeData: Array<{ name: string; avg: number; target: number }>;
  fuelConsumptionData: Array<{ name: string; consumption: number }>;
  assignmentStatusData: Array<{ name: string; value: number }>;
  COLORS: string[];
}

const PerformanceCharts: React.FC<PerformanceChartsProps> = ({
  responseTimeData,
  fuelConsumptionData,
  assignmentStatusData,
  COLORS,
}) => {
  return (
    <Box>
      {/* Response Time Chart */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Average Response Time (minutes)
        </Typography>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={responseTimeData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Line 
              type="monotone" 
              dataKey="avg" 
              stroke="#1976d2" 
              strokeWidth={2}
              name="Average Response Time"
            />
            <Line 
              type="monotone" 
              dataKey="target" 
              stroke="#f44336" 
              strokeWidth={2}
              strokeDasharray="5 5"
              name="Target Response Time"
            />
          </LineChart>
        </ResponsiveContainer>
      </Box>

      {/* Fuel Consumption Chart */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Fuel Consumption by Day
        </Typography>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={fuelConsumptionData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="consumption" fill="#4caf50" name="Fuel Consumption (L)" />
          </BarChart>
        </ResponsiveContainer>
      </Box>

      {/* Assignment Status Distribution */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Assignment Status Distribution
        </Typography>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={assignmentStatusData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {assignmentStatusData.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </Box>
    </Box>
  );
};

export default PerformanceCharts;
