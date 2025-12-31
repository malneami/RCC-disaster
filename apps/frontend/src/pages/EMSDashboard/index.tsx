import React, { useState } from 'react';
import { Box, Tabs, Tab, Typography, IconButton, Tooltip } from '@mui/material';
import { Helmet } from 'react-helmet-async';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faAmbulance, faSyncAlt, faChartLine, faMapMarkedAlt } from '@fortawesome/free-solid-svg-icons';

import { EMSLiveStatus, EMSAlertsPanel, PerformanceAnalytics } from './components';
import EMSOverviewSection from './components/EMSOverviewSection';
import { LiveAmbulanceMap } from '../../components/LiveTracking';
import { useEMSDashboard } from '../EMS/hooks/useEMSDashboard';

// Vibrant Solid Colors - No Gradients
const COLORS = {
  skyBlue: '#0EA5E9',      // Primary - Sky Blue
  emerald: '#10B981',      // Success - Emerald Green
  amber: '#F59E0B',        // Warning - Amber
  rose: '#F43F5E',         // Error - Rose
  violet: '#8B5CF6',       // Accent - Violet
  slate: '#64748B',        // Neutral
  white: '#FFFFFF',
  background: '#F1F5F9',
};

interface TabPanelProps { children?: React.ReactNode; index: number; value: number; }
const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => (
  <div hidden={value !== index}>{value === index && <Box sx={{ pt: 4 }}>{children}</Box>}</div>
);

const EMSDashboardPage: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const { data: dashboardData, isLoading, refetch } = useEMSDashboard();

  const handleRefresh = () => { setLastUpdated(new Date()); refetch(); };

  const mappedAlerts = dashboardData?.recentAlerts?.map(alert => ({
    id: alert.id,
    type: (['EMERGENCY', 'EQUIPMENT_FAILURE'].includes(alert.type) ? 'error' : alert.type.includes('VIOLATION') ? 'warning' : 'info') as 'error' | 'warning' | 'info' | 'success',
    title: alert.type.split('_').map(w => w.charAt(0) + w.slice(1).toLowerCase()).join(' '),
    message: alert.message || '',
    timestamp: new Date(alert.createdAt),
    priority: (alert.priority?.toLowerCase() === 'critical' || alert.priority?.toLowerCase() === 'high' ? 'high' : alert.priority?.toLowerCase() === 'medium' ? 'medium' : 'low') as 'high' | 'medium' | 'low',
  })) || [];

  return (
    <>
      <Helmet><title>EMS Dashboard - RCC Healthcare Platform</title></Helmet>
      <Box sx={{ minHeight: '100vh', bgcolor: COLORS.background, p: { xs: 2, md: 4 } }}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5 }}>
            <Box sx={{ width: 56, height: 56, borderRadius: 3, bgcolor: COLORS.skyBlue, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', boxShadow: '0 8px 24px rgba(14, 165, 233, 0.35)' }}>
              <FontAwesomeIcon icon={faAmbulance} size="xl" />
            </Box>
            <Box>
              <Typography sx={{ fontSize: '1.75rem', fontWeight: 800, color: '#0F172A' }}>EMS Dashboard</Typography>
              <Typography sx={{ fontSize: '0.9rem', color: COLORS.slate }}>Real-time Emergency Medical Services Overview & Analytics</Typography>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <Box sx={{ textAlign: 'right', display: { xs: 'none', md: 'block' } }}>
              <Typography sx={{ fontSize: '0.75rem', color: COLORS.slate }}>Last updated</Typography>
              <Typography sx={{ fontSize: '0.9rem', color: '#334155', fontWeight: 600 }}>{lastUpdated.toLocaleTimeString()}</Typography>
            </Box>
            <Tooltip title="Refresh">
              <IconButton onClick={handleRefresh} disabled={isLoading} sx={{ width: 48, height: 48, bgcolor: COLORS.white, borderRadius: 3, boxShadow: '0 2px 8px rgba(0,0,0,0.08)', '&:hover': { bgcolor: '#E0F2FE' }, '& svg': { animation: isLoading ? 'spin 1s linear infinite' : 'none' }, '@keyframes spin': { '100%': { transform: 'rotate(360deg)' } } }}>
                <FontAwesomeIcon icon={faSyncAlt} color={COLORS.skyBlue} />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        {/* Main Container */}
        <Box sx={{ bgcolor: COLORS.white, borderRadius: 4, boxShadow: '0 4px 24px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
          <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)} sx={{ borderBottom: '2px solid #E2E8F0', px: 3, '& .MuiTabs-indicator': { height: 4, borderRadius: 2, bgcolor: COLORS.skyBlue }, '& .MuiTab-root': { textTransform: 'none', fontWeight: 700, fontSize: '0.95rem', minHeight: 60, color: COLORS.slate, gap: 1.5, '&.Mui-selected': { color: COLORS.skyBlue } } }}>
            <Tab icon={<FontAwesomeIcon icon={faChartLine} />} iconPosition="start" label="Overview" />
            <Tab icon={<FontAwesomeIcon icon={faMapMarkedAlt} />} iconPosition="start" label="Live Map" />
          </Tabs>

          <TabPanel value={tabValue} index={0}>
            <Box sx={{ px: { xs: 2, md: 4 }, pb: 4 }}>
              <EMSLiveStatus isLoading={isLoading} data={dashboardData ? { totalAmbulances: dashboardData.summary.totalAmbulances, activeAmbulances: dashboardData.summary.activeAmbulances, availableAmbulances: dashboardData.summary.availableAmbulances, inUseAmbulances: dashboardData.summary.activeAmbulances, activeAssignments: dashboardData.summary.activeAssignments, responseTime: dashboardData.summary.responseTime || 0, averageResponseTime: dashboardData.summary.averageResponseTime || 0 } : undefined} />
              <Box sx={{ mt: 5 }}><EMSOverviewSection /></Box>
              {mappedAlerts.length > 0 && <Box sx={{ mt: 5 }}><EMSAlertsPanel alerts={mappedAlerts} onAlertClick={() => { }} /></Box>}
              <Box sx={{ mt: 5 }}><PerformanceAnalytics /></Box>
            </Box>
          </TabPanel>

          <TabPanel value={tabValue} index={1}>
            <Box sx={{ p: 3 }}>
              <Box sx={{ borderRadius: 4, overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}>
                <LiveAmbulanceMap height={600} autoRefresh refreshInterval={5000} useGPSAPI showControls showFilters />
              </Box>
            </Box>
          </TabPanel>
        </Box>
      </Box>
    </>
  );
};

export default EMSDashboardPage;
