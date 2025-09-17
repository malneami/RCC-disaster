import React, { useState } from 'react';
import { Box, Grid, Tabs, Tab, Paper } from '@mui/material';
import { Helmet } from 'react-helmet-async';

import {
  EMSDashboardHeader,
  EMSQuickActions,
  EMSAlertsPanel,
  EMSLiveStatus,
  EMSDashboard,
  PerformanceAnalytics,
  RealTimeMap,
} from './components';

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
  const [tabValue, setTabValue] = useState(0);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  const handleRefresh = () => {
    setLastUpdated(new Date());
    // Trigger data refresh logic here
  };

  const handleSettings = () => {
    // Open dashboard settings
    console.log('Open dashboard settings');
  };

  const handleQuickAction = (action: string) => {
    console.log(`Quick action: ${action}`);
    // Handle quick actions - navigate to appropriate pages
  };

  const handleAlertClick = (alert: any) => {
    console.log('Alert clicked:', alert);
    // Handle alert click - show details or navigate
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
                <RealTimeMap />
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
                <EMSLiveStatus />
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
                  alerts={[
                    {
                      id: '1',
                      type: 'info',
                      title: 'System Update',
                      message: 'GPS tracking system updated successfully',
                      timestamp: new Date(),
                      priority: 'low',
                    },
                    {
                      id: '2',
                      type: 'warning',
                      title: 'Low Fuel Alert',
                      message: 'Ambulance A-001 fuel level below 20%',
                      timestamp: new Date(Date.now() - 300000),
                      priority: 'medium',
                    },
                  ]}
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
