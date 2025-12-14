import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tabs,
  Tab,
} from '@mui/material';
import { useQuery } from 'react-query';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

import { useEMSPerformance } from '../hooks/useEMSPerformance';
import { emsService } from '../services/emsService';
import PerformanceKPIs from './PerformanceKPIs';
import PerformanceCharts from './PerformanceCharts';
import FleetMetrics from './FleetMetrics';
import GenericPageHeader from '../../../components/Common/GenericPageHeader';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => (
  <div hidden={value !== index}>
    {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
  </div>
);

const PerformanceAnalytics: React.FC = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('7d');
  const { data: performanceData, isLoading, error } = useEMSPerformance(selectedPeriod);
  const [tabValue, setTabValue] = useState(0);

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  // Fetch response time trends
  const { data: responseTimeData = [] } = useQuery(
    ['ems-response-time-trends', selectedPeriod],
    () => emsService.getResponseTimeTrends(selectedPeriod),
    {
      refetchInterval: 300000,
      staleTime: 60000,
    }
  );

  // Fetch assignment status distribution
  const { data: assignmentStatusData = [] } = useQuery(
    ['ems-assignment-status-distribution', selectedPeriod],
    () => emsService.getAssignmentStatusDistribution(selectedPeriod),
    {
      refetchInterval: 300000,
      staleTime: 60000,
    }
  );

  const kpis = {
    avgResponseTime: performanceData?.summary?.avgResponseTime || 0,
    avgCasePreparationTime: performanceData?.summary?.avgCasePreparationTime || 0,
    avgAssignmentDuration: performanceData?.summary?.avgAssignmentDuration || 0,
    avgTotalTransferTime: performanceData?.summary?.avgTotalTransferTime || 0,
    onTimeArrivals: performanceData?.summary?.onTimeArrivals || 0,
    totalAssignments: performanceData?.summary?.totalAssignments || 0,
  };

  if (isLoading) return <Box>Loading...</Box>;
  if (error) return <Box>Error: {(error as Error)?.message || 'An error occurred'}</Box>;

  return (
    <Box>
      <GenericPageHeader
        title="EMS Performance Analytics"
        subtitle="Track and analyze EMS performance metrics"
        actions={[]}
      />

      <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Time Period</InputLabel>
          <Select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            label="Time Period"
          >
            <MenuItem value="24h">Last 24 Hours</MenuItem>
            <MenuItem value="7d">Last 7 Days</MenuItem>
            <MenuItem value="30d">Last 30 Days</MenuItem>
            <MenuItem value="90d">Last 90 Days</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {/* KPI Cards */}
      <Box sx={{ mt: 2 }}>
        <PerformanceKPIs kpis={kpis} />
      </Box>

      {/* Charts */}
      <Card sx={{ mt: 2 }}>
        <CardContent>
          <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)}>
            <Tab label="Performance Trends" />
            <Tab label="Resource Utilization" />
            <Tab label="Assignment Analysis" />
          </Tabs>

          <TabPanel value={tabValue} index={0}>
            <PerformanceCharts
              responseTimeData={responseTimeData}
              assignmentStatusData={assignmentStatusData}
              COLORS={COLORS}
            />
          </TabPanel>

          <TabPanel value={tabValue} index={1}>
            {performanceData?.fleet ? (
              <FleetMetrics metrics={performanceData.fleet} />
            ) : (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant="body1">No fleet data available for this period</Typography>
              </Box>
            )}
          </TabPanel>

          <TabPanel value={tabValue} index={2}>
            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Assignment Status Distribution
              </Typography>
              {assignmentStatusData.length > 0 ? (
                <Box>
                  <ResponsiveContainer width="100%" height={400}>
                    <PieChart>
                      <Pie
                        data={assignmentStatusData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                        outerRadius={120}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {assignmentStatusData.map((_item: { name: string; value: number }, index: number) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </Box>
              ) : (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Typography variant="body1">No assignment data available for this period</Typography>
                </Box>
              )}
            </Box>
          </TabPanel>
        </CardContent>
      </Card>
    </Box>
  );
};

export default PerformanceAnalytics;