import React, { useState } from 'react';
import { Box, Tabs, Tab, Typography, IconButton, Tooltip, Chip, useMediaQuery } from '@mui/material';
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
      alignItems: { xs: 'flex-start', sm: 'center' },
      justifyContent: 'space-between',
      py: { xs: 1, md: 1.5 },
      px: { xs: 1.5, md: 2 },
      borderBottom: `1px solid ${COLORS.slate[200]}`,
      '&:last-child': { borderBottom: 'none' },
      '&:hover': { bgcolor: COLORS.slate[50] },
      flexDirection: { xs: 'column', sm: 'row' },
      gap: { xs: 1, sm: 0 },
    }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, md: 2 }, flex: 1 }}>
        <Box sx={{
          width: { xs: 32, md: 36 },
          height: { xs: 32, md: 36 },
          borderRadius: 2,
          bgcolor: statusConfig.color,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fff',
          flexShrink: 0,
        }}>
          <FontAwesomeIcon icon={faAmbulance} size="sm" />
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography sx={{ 
            fontSize: { xs: '0.8rem', md: '0.875rem' }, 
            fontWeight: 600, 
            color: COLORS.slate[900] 
          }}>
            {callSign}
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
            {origin && (
              <Typography sx={{ 
                fontSize: { xs: '0.7rem', md: '0.75rem' }, 
                color: COLORS.slate[500] 
              }}>
                <span style={{ fontWeight: 600 }}>From:</span> {origin}
              </Typography>
            )}
            {destination && (
              <Typography sx={{ 
                fontSize: { xs: '0.7rem', md: '0.75rem' }, 
                color: COLORS.slate[500] 
              }}>
                <span style={{ fontWeight: 600 }}>To:</span> {destination}
              </Typography>
            )}
          </Box>
        </Box>
      </Box>
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: { xs: 1, md: 1.5 },
        alignSelf: { xs: 'flex-end', sm: 'center' },
      }}>
        <Chip
          label={statusConfig.label}
          size="small"
          sx={{
            height: { xs: 22, md: 24 },
            fontSize: { xs: '0.65rem', md: '0.7rem' },
            fontWeight: 600,
            bgcolor: statusConfig.bg,
            color: statusConfig.color,
          }}
        />
        <Typography sx={{ 
          fontSize: { xs: '0.7rem', md: '0.75rem' }, 
          color: COLORS.slate[500] 
        }}>
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
  const isMobile = useMediaQuery('(max-width: 768px)');

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
      <Box sx={{ minHeight: '100vh', bgcolor: COLORS.slate[100], p: { xs: 1, sm: 2, md: 3 } }}>
        {/* Header */}
        <Box sx={{ 
          display: 'flex', 
          alignItems: { xs: 'flex-start', md: 'center' }, 
          justifyContent: 'space-between', 
          mb: { xs: 2, md: 3 },
          flexDirection: { xs: 'column', md: 'row' },
          gap: { xs: 2, md: 0 },
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1.5, md: 2 } }}>
            <Box sx={{
              width: { xs: 40, md: 48 },
              height: { xs: 40, md: 48 },
              borderRadius: 2,
              bgcolor: COLORS.primary,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              flexShrink: 0,
            }}>
              <FontAwesomeIcon icon={faAmbulance} size={isMobile ? 'sm' : 'lg'} />
            </Box>
            <Box>
              <Typography sx={{ 
                fontSize: { xs: '1.25rem', sm: '1.375rem', md: '1.5rem' }, 
                fontWeight: 700, 
                color: COLORS.slate[900] 
              }}>
                EMS Dashboard
              </Typography>
              <Typography sx={{ 
                fontSize: { xs: '0.75rem', md: '0.85rem' }, 
                color: COLORS.slate[500] 
              }}>
                Real-time fleet overview & analytics
              </Typography>
            </Box>
          </Box>
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: { xs: 1, md: 2 },
            width: { xs: '100%', md: 'auto' },
            justifyContent: { xs: 'space-between', md: 'flex-end' },
          }}>
            <Box sx={{ 
              textAlign: { xs: 'left', md: 'right' }, 
              display: { xs: 'block', sm: 'none', md: 'block' } 
            }}>
              <Typography sx={{ 
                fontSize: { xs: '0.65rem', md: '0.7rem' }, 
                color: COLORS.slate[500], 
                textTransform: 'uppercase', 
                letterSpacing: '0.05em' 
              }}>
                Last updated
              </Typography>
              <Typography sx={{ 
                fontSize: { xs: '0.75rem', md: '0.85rem' }, 
                color: COLORS.slate[700], 
                fontWeight: 600 
              }}>
                {lastUpdated.toLocaleTimeString()}
              </Typography>
            </Box>
            <Tooltip title="Refresh">
              <IconButton
                onClick={handleRefresh}
                disabled={isLoading}
                aria-label="Refresh dashboard"
                sx={{
                  width: { xs: 36, md: 40 },
                  height: { xs: 36, md: 40 },
                  bgcolor: '#fff',
                  border: `1px solid ${COLORS.slate[200]}`,
                  borderRadius: 2,
                  '&:hover': { bgcolor: COLORS.slate[50] },
                  '&:focus-visible': {
                    outline: '2px solid',
                    outlineColor: COLORS.primary,
                    outlineOffset: 2,
                  },
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
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              borderBottom: `1px solid ${COLORS.slate[200]}`,
              px: { xs: 1, md: 2 },
              '& .MuiTabs-indicator': { height: 3, bgcolor: COLORS.primary },
              '& .MuiTab-root': {
                textTransform: 'none',
                fontWeight: 600,
                fontSize: { xs: '0.8rem', md: '0.875rem' },
                minHeight: { xs: 48, md: 52 },
                color: COLORS.slate[500],
                gap: { xs: 0.5, md: 1 },
                px: { xs: 1.5, md: 2 },
                '&.Mui-selected': { color: COLORS.primary },
                '&:focus-visible': {
                  outline: '2px solid',
                  outlineColor: COLORS.primary,
                  outlineOffset: -2,
                },
              }
            }}
          >
            <Tab 
              icon={<FontAwesomeIcon icon={faChartLine} />} 
              iconPosition="start" 
              label="Overview"
              aria-label="Overview tab"
            />
            <Tab 
              icon={<FontAwesomeIcon icon={faMapMarkedAlt} />} 
              iconPosition="start" 
              label="Live Map"
              aria-label="Live Map tab"
            />
          </Tabs>

          <TabPanel value={tabValue} index={0}>
            <Box sx={{ px: { xs: 1, sm: 2, md: 3 }, pb: { xs: 2, md: 3 } }}>
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
              <Box sx={{ 
                display: 'grid', 
                gridTemplateColumns: { xs: '1fr', lg: '2fr 1fr' }, 
                gap: { xs: 2, md: 3 }, 
                mt: { xs: 2, md: 4 } 
              }}>
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
              <Box sx={{ mt: { xs: 2, md: 4 } }}>
                <PerformanceAnalytics />
              </Box>
            </Box>
          </TabPanel>

          <TabPanel value={tabValue} index={1}>
            <Box sx={{ p: { xs: 1, md: 2 } }}>
              <Box sx={{ 
                borderRadius: 2, 
                overflow: 'hidden', 
                border: `1px solid ${COLORS.slate[200]}` 
              }}>
                <LiveAmbulanceMap 
                  height={isMobile ? 400 : 600} 
                  autoRefresh 
                  refreshInterval={5000} 
                  useGPSAPI 
                  showControls 
                  showFilters 
                />
              </Box>
            </Box>
          </TabPanel>
        </Box>
      </Box>
    </>
  );
};

export default EMSDashboardPage;
