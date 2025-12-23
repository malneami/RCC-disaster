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
  const [activeCategory, setActiveCategory] = useState<'overall' | 'stroke' | 'stemi' | 'trauma'>('overall');
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

  // Determine which stats to show based on active category
  const activeStats = performanceData?.breakdown?.[activeCategory] || performanceData?.summary;

  const kpis = {
    avgResponseTime: activeStats?.avgResponseTime || 0,
    avgCasePreparationTime: activeStats?.avgCasePreparationTime || 0,
    avgAssignmentDuration: activeStats?.avgAssignmentDuration || 0,
    avgTotalTransferTime: activeStats?.avgTotalTransferTime || 0,
    onTimeArrivals: activeStats?.onTimeArrivals || 0,
    totalAssignments: activeStats?.totalAssignments || 0,
  };

  const handleCategoryChange = (_: React.SyntheticEvent, newValue: 'overall' | 'stroke' | 'stemi' | 'trauma') => {
    setActiveCategory(newValue);
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

      <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
        {/* Category Tabs */}
        <Tabs
          value={activeCategory}
          onChange={handleCategoryChange}
          textColor="primary"
          indicatorColor="primary"
          sx={{
            '& .MuiTab-root': { minWidth: 100, fontWeight: 600 },
            bgcolor: 'background.paper',
            borderRadius: 1,
            boxShadow: 1
          }}
        >
          <Tab label="Overall" value="overall" />
          <Tab label="Stroke" value="stroke" />
          <Tab label="STEMI" value="stemi" />
          <Tab label="Trauma" value="trauma" />
        </Tabs>

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