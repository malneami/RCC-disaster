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

import { useEMSPerformance } from '../hooks/useEMSPerformance';
import PerformanceKPIs from './PerformanceKPIs';
import PerformanceCharts from './PerformanceCharts';
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
  const { isLoading, error } = useEMSPerformance();
  const [selectedPeriod, setSelectedPeriod] = useState('7d');
  const [tabValue, setTabValue] = useState(0);

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  // Sample data - in real implementation, this would come from the API
  const responseTimeData = [
    { name: 'Mon', avg: 8.2, target: 10 },
    { name: 'Tue', avg: 7.8, target: 10 },
    { name: 'Wed', avg: 9.1, target: 10 },
    { name: 'Thu', avg: 8.5, target: 10 },
    { name: 'Fri', avg: 7.9, target: 10 },
    { name: 'Sat', avg: 8.7, target: 10 },
    { name: 'Sun', avg: 8.3, target: 10 },
  ];

  const fuelConsumptionData = [
    { name: 'Mon', consumption: 45 },
    { name: 'Tue', consumption: 52 },
    { name: 'Wed', consumption: 38 },
    { name: 'Thu', consumption: 48 },
    { name: 'Fri', consumption: 55 },
    { name: 'Sat', consumption: 42 },
    { name: 'Sun', consumption: 39 },
  ];

  const assignmentStatusData = [
    { name: 'Completed', value: 85 },
    { name: 'In Progress', value: 10 },
    { name: 'Cancelled', value: 5 },
  ];

  const kpis = {
    avgResponseTime: 8.4,
    totalAssignments: 156,
    avgFuelConsumption: 45.7,
    onTimeArrivals: 92,
    totalDistance: 2847,
    avgAssignmentDuration: 28.5,
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
              fuelConsumptionData={fuelConsumptionData}
              assignmentStatusData={assignmentStatusData}
              COLORS={COLORS}
            />
          </TabPanel>

          <TabPanel value={tabValue} index={1}>
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="h6" color="text.secondary">
                Resource Utilization Charts
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Additional charts for resource utilization analysis
              </Typography>
            </Box>
          </TabPanel>

          <TabPanel value={tabValue} index={2}>
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="h6" color="text.secondary">
                Assignment Analysis Charts
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Detailed assignment analysis and reporting
              </Typography>
            </Box>
          </TabPanel>
        </CardContent>
      </Card>
    </Box>
  );
};

export default PerformanceAnalytics;