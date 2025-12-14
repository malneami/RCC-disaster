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
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';

interface PerformanceChartsProps {
  responseTimeData: Array<{ name: string; avg: number; target: number }>;
  assignmentStatusData: Array<{ name: string; value: number }>;
  COLORS: string[];
}

const PerformanceCharts: React.FC<PerformanceChartsProps> = ({
  responseTimeData,
  assignmentStatusData,
  COLORS,
}) => {
  return (
    <Box>
      {/* Response Time Chart */}
      {responseTimeData.length > 0 ? (
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
      ) : (
        <Box sx={{ mb: 4, textAlign: 'center', py: 4 }}>
          <Typography variant="body1" color="text.secondary">
            No response time data available for this period
          </Typography>
        </Box>
      )}

      {/* Assignment Status Distribution */}
      {assignmentStatusData.length > 0 ? (
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
      ) : (
        <Box sx={{ mb: 4, textAlign: 'center', py: 4 }}>
          <Typography variant="body1" color="text.secondary">
            No assignment status data available for this period
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default PerformanceCharts;
