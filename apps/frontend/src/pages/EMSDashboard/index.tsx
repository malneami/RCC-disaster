import React, { useState } from 'react';
import { Box, Tabs, Tab, Typography, IconButton, Tooltip, Chip } from '@mui/material';
import { Helmet } from 'react-helmet-async';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faAmbulance, faSyncAlt, faChartLine, faMapMarkedAlt, faClock } from '@fortawesome/free-solid-svg-icons';

import { EMSLiveStatus, PerformanceAnalytics } from './components';
import EMSOverviewSection from './components/EMSOverviewSection';
import { LiveAmbulanceMap } from '../../components/LiveTracking';
import { useEMSDashboard } from '../EMS/hooks/useEMSDashboard';

// Professional color palette - less saturated, more subtle
const COLORS = {
  primary: '#2563EB',      // Blue-600
  success: '#059669',      // Emerald-600
  warning: '#D97706',      // Amber-600
  error: '#DC2626',        // Red-600
  slate: {
    50: '#F8FAFC',
    100: '#F1F5F9',
    200: '#E2E8F0',
    300: '#CBD5E1',
    500: '#64748B',
    700: '#334155',
    900: '#0F172A',
  },
};

interface TabPanelProps { children?: React.ReactNode; index: number; value: number; }
const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => (
  <div hidden={value !== index}>{value === index && <Box sx={{ pt: 3 }}>{children}</Box>}</div>
);

// Recent Activity Item Component
const ActivityItem: React.FC<{
  callSign: string;
  status: string;
  time: string;
  origin?: string;
  destination?: string;
}> = ({ callSign, status, time, origin, destination }) => {
  const isDone = status === 'DONE';
  const statusConfig = isDone
    ? { label: 'Done', bg: '#D1FAE5', color: COLORS.success }
    : { label: 'In Use', bg: '#FEF3C7', color: COLORS.warning };

  return (
    <Box sx={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      py: 1.5,
      px: 2,
      borderBottom: `1px solid ${COLORS.slate[200]}`,
      '&:last-child': { borderBottom: 'none' },
      '&:hover': { bgcolor: COLORS.slate[50] },
    }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Box sx={{
          width: 36,
          height: 36,
          borderRadius: 2,
          bgcolor: statusConfig.color,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fff',
        }}>
          <FontAwesomeIcon icon={faAmbulance} size="sm" />
        </Box>
        <Box>
          <Typography sx={{ fontSize: '0.875rem', fontWeight: 600, color: COLORS.slate[900] }}>
            {callSign}
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
            {origin && (
              <Typography sx={{ fontSize: '0.75rem', color: COLORS.slate[500] }}>
                <span style={{ fontWeight: 600 }}>From:</span> {origin}
              </Typography>
            )}
            {destination && (
              <Typography sx={{ fontSize: '0.75rem', color: COLORS.slate[500] }}>
                <span style={{ fontWeight: 600 }}>To:</span> {destination}
              </Typography>
            )}
          </Box>
        </Box>
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Chip
          label={statusConfig.label}
          size="small"
          sx={{
            height: 24,
            fontSize: '0.7rem',
            fontWeight: 600,
            bgcolor: statusConfig.bg,
            color: statusConfig.color,
          }}
        />
        <Typography sx={{ fontSize: '0.75rem', color: COLORS.slate[500] }}>
          {time}
        </Typography>
      </Box>
    </Box>
  );
};

const EMSDashboardPage: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const { data: dashboardData, isLoading, refetch } = useEMSDashboard();

  const handleRefresh = () => { setLastUpdated(new Date()); refetch(); };

  // Get recent assignments for activity feed
  const recentActivity = dashboardData?.recentAssignments?.slice(0, 5).map(a => ({
    callSign: a.ambulanceCallSign || 'Unknown',
    status: ['ARRIVED', 'COMPLETED'].includes(a.status) ? 'DONE' : 'IN_USE',
    time: new Date(a.assignedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    origin: a.origin,
    destination: a.destination,
  })) || [];

  return (
    <>
      <Helmet><title>EMS Dashboard - RCC Healthcare Platform</title></Helmet>
      <Box sx={{ minHeight: '100vh', bgcolor: COLORS.slate[100], p: { xs: 2, md: 3 } }}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{
              width: 48,
              height: 48,
              borderRadius: 2,
              bgcolor: COLORS.primary,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
            }}>
              <FontAwesomeIcon icon={faAmbulance} size="lg" />
            </Box>
            <Box>
              <Typography sx={{ fontSize: '1.5rem', fontWeight: 700, color: COLORS.slate[900] }}>
                EMS Dashboard
              </Typography>
              <Typography sx={{ fontSize: '0.85rem', color: COLORS.slate[500] }}>
                Real-time fleet overview & analytics
              </Typography>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{ textAlign: 'right', display: { xs: 'none', md: 'block' } }}>
              <Typography sx={{ fontSize: '0.7rem', color: COLORS.slate[500], textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Last updated
              </Typography>
              <Typography sx={{ fontSize: '0.85rem', color: COLORS.slate[700], fontWeight: 600 }}>
                {lastUpdated.toLocaleTimeString()}
              </Typography>
            </Box>
            <Tooltip title="Refresh">
              <IconButton
                onClick={handleRefresh}
                disabled={isLoading}
                sx={{
                  width: 40,
                  height: 40,
                  bgcolor: '#fff',
                  border: `1px solid ${COLORS.slate[200]}`,
                  borderRadius: 2,
                  '&:hover': { bgcolor: COLORS.slate[50] },
                  '& svg': { animation: isLoading ? 'spin 1s linear infinite' : 'none' },
                  '@keyframes spin': { '100%': { transform: 'rotate(360deg)' } }
                }}
              >
                <FontAwesomeIcon icon={faSyncAlt} color={COLORS.primary} />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        {/* Main Container */}
        <Box sx={{ bgcolor: '#fff', borderRadius: 2, border: `1px solid ${COLORS.slate[200]}`, overflow: 'hidden' }}>
          <Tabs
            value={tabValue}
            onChange={(_, v) => setTabValue(v)}
            sx={{
              borderBottom: `1px solid ${COLORS.slate[200]}`,
              px: 2,
              '& .MuiTabs-indicator': { height: 3, bgcolor: COLORS.primary },
              '& .MuiTab-root': {
                textTransform: 'none',
                fontWeight: 600,
                fontSize: '0.875rem',
                minHeight: 52,
                color: COLORS.slate[500],
                gap: 1,
                '&.Mui-selected': { color: COLORS.primary }
              }
            }}
          >
            <Tab icon={<FontAwesomeIcon icon={faChartLine} />} iconPosition="start" label="Overview" />
            <Tab icon={<FontAwesomeIcon icon={faMapMarkedAlt} />} iconPosition="start" label="Live Map" />
          </Tabs>

          <TabPanel value={tabValue} index={0}>
            <Box sx={{ px: { xs: 2, md: 3 }, pb: 3 }}>
              {/* Live Status */}
              <EMSLiveStatus
                isLoading={isLoading}
                data={dashboardData ? {
                  totalAmbulances: dashboardData.summary.totalAmbulances,
                  activeAmbulances: dashboardData.summary.activeAmbulances,
                  availableAmbulances: dashboardData.summary.availableAmbulances,
                  inUseAmbulances: dashboardData.summary.activeAmbulances,
                  activeAssignments: dashboardData.summary.activeAssignments,
                  responseTime: dashboardData.summary.responseTime || 0,
                  averageResponseTime: dashboardData.summary.averageResponseTime || 0
                } : undefined}
              />

              {/* Two Column Layout: Overview + Recent Activity */}
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '2fr 1fr' }, gap: 3, mt: 4 }}>
                {/* Operations Overview */}
                <EMSOverviewSection />

                {/* Recent Ambulance Activity */}
                <Box sx={{
                  bgcolor: '#fff',
                  border: `1px solid ${COLORS.slate[200]}`,
                  borderRadius: 2,
                  overflow: 'hidden',
                }}>
                  <Box sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5,
                    px: 2,
                    py: 1.5,
                    borderBottom: `1px solid ${COLORS.slate[200]}`,
                    bgcolor: COLORS.slate[50],
                  }}>
                    <FontAwesomeIcon icon={faClock} color={COLORS.slate[500]} />
                    <Typography sx={{ fontSize: '0.875rem', fontWeight: 600, color: COLORS.slate[700] }}>
                      Recent Activity
                    </Typography>
                  </Box>
                  <Box>
                    {recentActivity.length > 0 ? (
                      recentActivity.map((activity, idx) => (
                        <ActivityItem key={idx} {...activity} />
                      ))
                    ) : (
                      <Box sx={{ py: 4, textAlign: 'center' }}>
                        <Typography sx={{ fontSize: '0.85rem', color: COLORS.slate[500] }}>
                          No recent activity
                        </Typography>
                      </Box>
                    )}
                  </Box>
                </Box>
              </Box>

              {/* Performance Analytics */}
              <Box sx={{ mt: 4 }}>
                <PerformanceAnalytics />
              </Box>
            </Box>
          </TabPanel>

          <TabPanel value={tabValue} index={1}>
            <Box sx={{ p: 2 }}>
              <Box sx={{ borderRadius: 2, overflow: 'hidden', border: `1px solid ${COLORS.slate[200]}` }}>
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
