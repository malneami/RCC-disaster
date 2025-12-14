import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Grid, Tabs, Tab, Paper } from '@mui/material';
import { Helmet } from 'react-helmet-async';

import {
  EMSDashboardHeader,
  EMSQuickActions,
  EMSAlertsPanel,
  EMSLiveStatus,
  EMSDashboard,
  PerformanceAnalytics,
} from './components';
import { LiveAmbulanceMap } from '../../components/LiveTracking';
import { useEMSDashboard } from '../EMS/hooks/useEMSDashboard';

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



const EMSDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [tabValue, setTabValue] = useState(0);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  const { data: dashboardData, isLoading, refetch } = useEMSDashboard();

  const handleRefresh = () => {
    setLastUpdated(new Date());
    refetch();
  };

  const handleSettings = () => {
    // Navigate to profile or admin settings
    navigate('/profile');
  };

  const handleQuickAction = (action: string) => {
    console.log(`Quick action: ${action}`);
    switch (action) {
      case 'add-ambulance':
        // Navigate to EMS Portal > Fleet (Tab 2)
        navigate('/portals/ems', { state: { activeTab: 2 } });
        break;
      case 'assignments':
        // Navigate to EMS Portal > Active Transports (Tab 0)
        navigate('/portals/ems', { state: { activeTab: 0 } });
        break;
      case 'schedules':
        // Navigate to EMS Portal > Schedules (Tab 4)
        navigate('/portals/ems', { state: { activeTab: 4 } });
        break;
      case 'notifications':
        navigate('/notifications');
        break;
      default:
        break;
    }
  };

  const handleAlertClick = (alert: any) => {
    console.log('Alert clicked:', alert);
    // Navigate to notifications page
    navigate('/notifications');
  };

  return (
    <>
      <Helmet>
        <title>EMS Dashboard - RCC Healthcare Platform</title>
      </Helmet>

      <Box sx={{ p: 3 }}>
        <EMSDashboardHeader
          onRefresh={handleRefresh}
          onSettings={handleSettings}
          lastUpdated={lastUpdated}
        />

        <Grid container spacing={3}>
          {/* Left Column - Main Dashboard */}
          <Grid item xs={12} lg={8}>
            <Paper sx={{ mb: 3 }}>
              <Tabs
                value={tabValue}
                onChange={(_, newValue) => setTabValue(newValue)}
                sx={{ borderBottom: 1, borderColor: 'divider' }}
              >
                <Tab label="Overview" />
                <Tab label="Live Map" />
                <Tab label="Analytics" />
              </Tabs>

              <TabPanel value={tabValue} index={0}>
                <EMSDashboard />
              </TabPanel>

              <TabPanel value={tabValue} index={1}>
                {/* <RealTimeMap /> */}
                <LiveAmbulanceMap
                  height={600}
                  autoRefresh={true}
                  refreshInterval={5000}
                  useGPSAPI={true}
                  showControls={true}
                  showFilters={true}
                />
              </TabPanel>

              <TabPanel value={tabValue} index={2}>
                <PerformanceAnalytics />
              </TabPanel>
            </Paper>
          </Grid>

          {/* Right Column - Status & Actions */}
          <Grid item xs={12} lg={4}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <EMSLiveStatus
                  isLoading={isLoading}
                  data={dashboardData ? {
                    totalAmbulances: dashboardData.summary.totalAmbulances,
                    activeAmbulances: dashboardData.summary.activeAmbulances,
                    availableAmbulances: dashboardData.summary.availableAmbulances,
                    inUseAmbulances: dashboardData.summary.activeAmbulances,
                    activeAssignments: dashboardData.summary.activeAssignments,
                    responseTime: dashboardData.summary.responseTime || 0,
                    averageResponseTime: dashboardData.summary.averageResponseTime || 0,
                  } : undefined}
                />
              </Grid>

              <Grid item xs={12}>
                <EMSQuickActions
                  onAddAmbulance={() => handleQuickAction('add-ambulance')}
                  onViewMap={() => setTabValue(1)}
                  onManageAssignments={() => handleQuickAction('assignments')}
                  onScheduleManagement={() => handleQuickAction('schedules')}
                  onViewAnalytics={() => setTabValue(2)}
                  onViewNotifications={() => handleQuickAction('notifications')}
                />
              </Grid>

              <Grid item xs={12}>
                <EMSAlertsPanel
                  alerts={dashboardData?.recentAlerts?.map(alert => {
                    // Map EMSAlert type to Alert type
                    const getAlertType = (emsType: string): 'error' | 'warning' | 'info' | 'success' => {
                      switch (emsType) {
                        case 'EMERGENCY':
                        case 'EQUIPMENT_FAILURE':
                          return 'error';
                        case 'DRIVER_OVERTIME':
                        case 'SPEED_VIOLATION':
                          return 'warning';
                        case 'MAINTENANCE_DUE':
                          return 'info';
                        default:
                          return 'info';
                      }
                    };

                    // Map priority to Alert priority type
                    const getPriority = (priority: string): 'high' | 'medium' | 'low' => {
                      const p = priority?.toLowerCase();
                      if (p === 'critical' || p === 'high') return 'high';
                      if (p === 'medium') return 'medium';
                      return 'low';
                    };

                    // Generate title from type
                    const getTitle = (type: string): string => {
                      return type
                        .split('_')
                        .map(word => word.charAt(0) + word.slice(1).toLowerCase())
                        .join(' ');
                    };

                    return {
                      id: alert.id,
                      type: getAlertType(alert.type),
                      title: getTitle(alert.type),
                      message: alert.message || '',
                      timestamp: new Date(alert.createdAt),
                      priority: getPriority(alert.priority),
                    };
                  }) || []}
                  onAlertClick={handleAlertClick}
                />
              </Grid>
            </Grid>
          </Grid>
        </Grid>
      </Box>
    </>
  );
};

export default EMSDashboardPage;
