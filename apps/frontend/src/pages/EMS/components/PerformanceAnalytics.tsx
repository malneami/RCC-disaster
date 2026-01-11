import React, { useState } from 'react';
import { Box, Typography, TextField, Tabs, Tab, Grid, useMediaQuery, Tooltip as MuiTooltip } from '@mui/material';
import { useQuery } from 'react-query';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChartLine, faClock, faUserMd, faTruck, faCheckCircle, faAmbulance } from '@fortawesome/free-solid-svg-icons';

import { useEMSPerformance } from '../hooks/useEMSPerformance';
import { emsService } from '../services/emsService';
import PerformanceCharts from './PerformanceCharts';
import FleetMetrics from './FleetMetrics';

// Vibrant Solid Colors
const COLORS = {
  skyBlue: '#0EA5E9',
  emerald: '#10B981',
  amber: '#F59E0B',
  violet: '#8B5CF6',
  cyan: '#06B6D4',
  pink: '#EC4899',
};

const CHART_COLORS = [COLORS.skyBlue, COLORS.emerald, COLORS.amber, COLORS.violet, COLORS.cyan];

// KPI configurations
const kpiConfigs = [
  { key: 'avgResponseTime', label: 'Response Time', unit: 'min', sub: 'Target: < 5 min', icon: faClock, color: COLORS.skyBlue },
  { key: 'avgCasePreparationTime', label: 'Ambulance Off Load', unit: 'min', sub: 'Target: < 10 min', icon: faUserMd, color: COLORS.emerald },
  { key: 'avgAssignmentDuration', label: 'Duration', unit: 'min', sub: 'Origin to Destination', icon: faTruck, color: COLORS.violet },
  { key: 'avgTotalTransferTime', label: 'Total Transfer Time', unit: 'min', sub: 'Contact to Destination', icon: faClock, color: COLORS.cyan },
  { key: 'onTimeArrivals', label: 'On-Time', unit: '%', sub: 'Target: ≥ 90%', icon: faCheckCircle, color: COLORS.pink },
  { key: 'totalAssignments', label: 'Total', unit: '', sub: 'Completed', icon: faAmbulance, color: COLORS.amber },
];

interface TabPanelProps { children?: React.ReactNode; index: number; value: number; }
const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => (
  <div hidden={value !== index}>{value === index && <Box sx={{ pt: 3 }}>{children}</Box>}</div>
);

const PerformanceAnalytics: React.FC = () => {
  const [startDate, setStartDate] = useState(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [activeCategory, setActiveCategory] = useState<'overall' | 'stroke' | 'stemi' | 'trauma'>('overall');

  const customRange = {
    startDate: new Date(startDate),
    endDate: new Date(endDate)
  };

  const { data: performanceData, isLoading, error } = useEMSPerformance(undefined, customRange);
  const [tabValue, setTabValue] = useState(0);
  const isMobile = useMediaQuery('(max-width: 768px)');

  const { data: responseTimeData = [] } = useQuery(['ems-response-time-trends', customRange], () => emsService.getResponseTimeTrends(undefined, customRange), { refetchInterval: 300000, staleTime: 60000 });
  const { data: assignmentStatusData = [] } = useQuery(['ems-assignment-status-distribution', customRange], () => emsService.getAssignmentStatusDistribution(undefined, customRange), { refetchInterval: 300000, staleTime: 60000 });

  const activeStats = performanceData?.breakdown?.[activeCategory] || performanceData?.summary;
  const kpis: Record<string, number> = {
    avgResponseTime: activeStats?.avgResponseTime || 0,
    avgCasePreparationTime: activeStats?.avgCasePreparationTime || 0,
    avgAssignmentDuration: activeStats?.avgAssignmentDuration || 0,
    avgTotalTransferTime: activeStats?.avgTotalTransferTime || 0,
    onTimeArrivals: activeStats?.onTimeArrivals || 0,
    totalAssignments: activeStats?.totalAssignments || 0,
  };

  const TRAFFIC_COLORS = {
    green: '#10B981',  // Emerald - Good
    yellow: '#F59E0B', // Amber - Warning
    red: '#EF4444',    // Red - Critical
  };

  const KPI_LEGENDS: Record<string, { green: string; yellow: string; red: string }> = {
    avgResponseTime: { green: '< 5 min', yellow: '5–10 min', red: '> 10 min' },
    avgCasePreparationTime: { green: '< 10 min', yellow: '10–20 min', red: '> 20 min' },
    avgAssignmentDuration: { green: '< 30 min', yellow: '30–60 min', red: '> 60 min' },
    avgTotalTransferTime: { green: '< 60 min', yellow: '60–90 min', red: '> 90 min' },
    onTimeArrivals: { green: '≥ 95%', yellow: '90–95%', red: '< 90%' },
  };

  // Get color based on KPI key and value
  const getKpiColor = (key: string, value: number): string => {
    switch (key) {
      case 'avgResponseTime':
        // Response Time: 🟢 <5 min, 🟡 5–10 min, 🔴 >10 min
        if (value < 5) return TRAFFIC_COLORS.green;
        if (value <= 10) return TRAFFIC_COLORS.yellow;
        return TRAFFIC_COLORS.red;

      case 'avgCasePreparationTime':
        // Ambulance Off Load: 🟢 <10 min, 🟡 10–20 min, 🔴 >20 min
        if (value < 10) return TRAFFIC_COLORS.green;
        if (value <= 20) return TRAFFIC_COLORS.yellow;
        return TRAFFIC_COLORS.red;

      case 'avgAssignmentDuration':
        // Duration: 🟢 <30 min, 🟡 30–60 min, 🔴 >60 min
        if (value < 30) return TRAFFIC_COLORS.green;
        if (value <= 60) return TRAFFIC_COLORS.yellow;
        return TRAFFIC_COLORS.red;

      case 'avgTotalTransferTime':
        // Transfer: 🟢 <60 min, 🟡 60–90 min, 🔴 >90 min
        if (value < 60) return TRAFFIC_COLORS.green;
        if (value <= 90) return TRAFFIC_COLORS.yellow;
        return TRAFFIC_COLORS.red;

      case 'onTimeArrivals':
        // On-Time %: 🟢 ≥95%, 🟡 90-95%, 🔴 <90%
        if (value >= 95) return TRAFFIC_COLORS.green;
        if (value >= 90) return TRAFFIC_COLORS.yellow;
        return TRAFFIC_COLORS.red;

      default:
        // For other metrics, use their default color from config
        return kpiConfigs.find(c => c.key === key)?.color || COLORS.skyBlue;
    }
  };

  if (isLoading) return <Box>Loading...</Box>;
  if (error) return <Box>Error: {(error as Error)?.message}</Box>;

  return (
    <Box sx={{
      bgcolor: '#fff',
      borderRadius: { xs: 2, md: 4 },
      p: { xs: 2, md: 4 },
      boxShadow: '0 4px 16px rgba(0,0,0,0.06)'
    }}>
      {/* Header */}
      <Box sx={{
        display: 'flex',
        alignItems: { xs: 'flex-start', md: 'center' },
        justifyContent: 'space-between',
        mb: { xs: 2, md: 4 },
        flexWrap: 'wrap',
        gap: 2,
        flexDirection: { xs: 'column', sm: 'row' },
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1.5, md: 2 } }}>
          <Box sx={{
            width: { xs: 36, md: 44 },
            height: { xs: 36, md: 44 },
            borderRadius: { xs: 2, md: 3 },
            bgcolor: COLORS.violet,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            boxShadow: `0 6px 20px ${COLORS.violet}40`
          }}>
            <FontAwesomeIcon icon={faChartLine} />
          </Box>
          <Typography sx={{
            fontSize: { xs: '1.125rem', md: '1.35rem' },
            fontWeight: 800,
            color: '#0F172A'
          }}>
            EMS Performance Analytics
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <TextField
            label="From"
            type="date"
            size="small"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
            sx={{ bgcolor: '#F1F5F9', borderRadius: 2 }}
          />
          <TextField
            label="To"
            type="date"
            size="small"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
            sx={{ bgcolor: '#F1F5F9', borderRadius: 2 }}
          />
        </Box>
      </Box>

      {/* Category Tabs */}
      <Tabs
        value={activeCategory}
        onChange={(_, v) => setActiveCategory(v)}
        variant="scrollable"
        scrollButtons="auto"
        sx={{
          mb: { xs: 2, md: 4 },
          '& .MuiTab-root': {
            textTransform: 'none',
            fontWeight: 700,
            minWidth: { xs: 60, md: 80 },
            fontSize: { xs: '0.8rem', md: '0.875rem' },
            color: '#64748B',
            '&:focus-visible': {
              outline: '2px solid',
              outlineColor: COLORS.skyBlue,
              outlineOffset: -2,
            },
          },
          '& .Mui-selected': { color: COLORS.skyBlue },
          '& .MuiTabs-indicator': { bgcolor: COLORS.skyBlue, height: 4, borderRadius: 2 }
        }}
      >
        <Tab label="Overall" value="overall" aria-label="Overall category" />
        <Tab label="Stroke" value="stroke" aria-label="Stroke category" />
        <Tab label="STEMI" value="stemi" aria-label="STEMI category" />
        <Tab label="Trauma" value="trauma" aria-label="Trauma category" />
      </Tabs>



      {/* KPI Cards - Dynamic Traffic Light Colors */}
      <Grid container spacing={{ xs: 1.5, md: 2.5 }} sx={{ mb: { xs: 2, md: 4 } }}>
        {kpiConfigs.map((cfg, i) => {
          const dynamicColor = getKpiColor(cfg.key, kpis[cfg.key]);
          const legend = KPI_LEGENDS[cfg.key];

          return (
            <Grid item xs={6} sm={4} md={2} key={i}>
              <MuiTooltip
                title={
                  legend ? (
                    <Box sx={{ p: 0.5 }}>
                      <Typography variant="caption" display="block" sx={{ fontWeight: 600, color: '#86EFAC', mb: 0.5 }}>🟢 {legend.green}</Typography>
                      <Typography variant="caption" display="block" sx={{ fontWeight: 600, color: '#FCD34D', mb: 0.5 }}>🟡 {legend.yellow}</Typography>
                      <Typography variant="caption" display="block" sx={{ fontWeight: 600, color: '#FCA5A5' }}>🔴 {legend.red}</Typography>
                    </Box>
                  ) : ""
                }
                arrow
                placement="top"
                componentsProps={{
                  tooltip: {
                    sx: {
                      bgcolor: 'rgba(15, 23, 42, 0.95)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
                      borderRadius: 2,
                      p: 1.5
                    }
                  },
                  arrow: { sx: { color: 'rgba(15, 23, 42, 0.95)' } }
                }}
              >
                <Box sx={{
                  bgcolor: dynamicColor,
                  borderRadius: { xs: 2, md: 4 },
                  p: { xs: 1.5, md: 2.5 },
                  height: '100%',
                  textAlign: 'center',
                  color: '#fff',
                  boxShadow: `0 6px 20px ${dynamicColor}40`,
                  transition: 'all 0.3s',
                  '&:hover': { transform: 'translateY(-4px)', boxShadow: `0 10px 28px ${dynamicColor}50` },
                  '&:focus-within': {
                    outline: '2px solid',
                    outlineColor: 'rgba(255,255,255,0.5)',
                    outlineOffset: 2,
                  },
                }}>
                  <Box sx={{
                    width: { xs: 32, md: 40 },
                    height: { xs: 32, md: 40 },
                    borderRadius: '50%',
                    bgcolor: 'rgba(255,255,255,0.25)',
                    mx: 'auto',
                    mb: { xs: 1, md: 1.5 },
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <FontAwesomeIcon icon={cfg.icon} style={{ fontSize: isMobile ? '0.875rem' : '1rem' }} />
                  </Box>
                  <Typography sx={{
                    fontSize: { xs: '1.125rem', md: '1.5rem' },
                    fontWeight: 800
                  }}>
                    {cfg.unit === '%' ? kpis[cfg.key] : kpis[cfg.key].toFixed(1)}{cfg.unit && ` ${cfg.unit}`}
                  </Typography>
                  <Typography sx={{
                    fontSize: { xs: '0.65rem', md: '0.7rem' },
                    fontWeight: 600,
                    opacity: 0.9,
                    mt: 0.5
                  }}>
                    {cfg.label}
                  </Typography>
                  <Typography sx={{
                    fontSize: { xs: '0.55rem', md: '0.6rem' },
                    opacity: 0.7
                  }}>
                    {cfg.sub}
                  </Typography>
                </Box>
              </MuiTooltip>
            </Grid>
          )
        })}
      </Grid>

      {/* Sub Tabs */}
      <Box sx={{ borderTop: '2px solid #E2E8F0', pt: { xs: 2, md: 3 } }}>
        <Tabs
          value={tabValue}
          onChange={(_, v) => setTabValue(v)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            mb: 2,
            '& .MuiTab-root': {
              textTransform: 'none',
              fontWeight: 600,
              fontSize: { xs: '0.75rem', md: '0.85rem' },
              color: '#64748B',
              minWidth: { xs: 'auto', md: 120 },
              px: { xs: 1, md: 2 },
              '&:focus-visible': {
                outline: '2px solid',
                outlineColor: COLORS.skyBlue,
                outlineOffset: -2,
              },
            },
            '& .Mui-selected': { color: COLORS.skyBlue },
            '& .MuiTabs-indicator': { bgcolor: COLORS.skyBlue }
          }}
        >
          <Tab label="Performance Trends" aria-label="Performance Trends tab" />
          <Tab label="Resource Utilization" aria-label="Resource Utilization tab" />
          <Tab label="Assignment Analysis" aria-label="Assignment Analysis tab" />
        </Tabs>

        <TabPanel value={tabValue} index={0}>
          <PerformanceCharts responseTimeData={responseTimeData} assignmentStatusData={assignmentStatusData} COLORS={CHART_COLORS} />
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          {performanceData?.fleet ? <FleetMetrics metrics={performanceData.fleet} /> : <Typography color="text.secondary" textAlign="center" py={4}>No fleet data</Typography>}
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          {assignmentStatusData.length > 0 ? (
            <Box sx={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: { xs: 3, md: 6 },
              flexWrap: 'wrap',
              flexDirection: { xs: 'column', sm: 'row' },
            }}>
              <Box sx={{
                width: { xs: '100%', sm: 280 },
                maxWidth: 280,
                height: { xs: 240, md: 280 }
              }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={assignmentStatusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={isMobile ? 40 : 60}
                      outerRadius={isMobile ? 80 : 100}
                      dataKey="value"
                      paddingAngle={4}
                    >
                      {assignmentStatusData.map((_: any, idx: number) => (<Cell key={`cell-${idx}`} fill={CHART_COLORS[idx % CHART_COLORS.length]} />))}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
              </Box>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 1, md: 1.5 } }}>
                {assignmentStatusData.map((item: any, idx: number) => (
                  <Box key={idx} sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1.5, md: 2 } }}>
                    <Box sx={{
                      width: { xs: 14, md: 16 },
                      height: { xs: 14, md: 16 },
                      borderRadius: 2,
                      bgcolor: CHART_COLORS[idx % CHART_COLORS.length],
                      flexShrink: 0,
                    }} />
                    <Typography sx={{
                      fontSize: { xs: '0.8rem', md: '0.9rem' },
                      fontWeight: 600,
                      color: '#334155'
                    }}>
                      {item.name}: {item.value}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Box>
          ) : (
            <Typography color="text.secondary" textAlign="center" py={4}>No data</Typography>
          )}
        </TabPanel>
      </Box>
    </Box>
  );
};

export default PerformanceAnalytics;