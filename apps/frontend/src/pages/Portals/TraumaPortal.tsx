import React, { useState } from 'react';
import { Box, Typography, Tabs, Tab, Alert, CircularProgress, Fab } from '@mui/material';
import { Add, Assessment, Timeline, Dashboard, LocalHospital } from '@mui/icons-material';
import { Helmet } from 'react-helmet-async';

import PortalSkeleton, { PortalStep, KPICard } from '../../components/Common/PortalSkeleton';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`trauma-tabpanel-${index}`}
      aria-labelledby={`trauma-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const TraumaPortal: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [loading] = useState(false);
  const [error] = useState<string | null>(null);

  // Define portal steps
  const portalSteps: PortalStep[] = [
    { label: 'Cases', description: 'View and manage trauma cases', icon: <Assessment /> },
    { label: 'KPI Dashboard', description: 'Monitor performance metrics', icon: <Dashboard /> },
    { label: 'Timeline View', description: 'Track case progression', icon: <Timeline /> },
  ];

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const headerActions = (
    <Fab
      color="primary"
      size="medium"
      onClick={() => {
        // TODO: Open create trauma case dialog
        console.log('Create trauma case');
      }}
      sx={{
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        color: 'white',
        '&:hover': {
          backgroundColor: 'rgba(255, 255, 255, 0.3)',
        },
      }}
    >
      <Add />
    </Fab>
  );

  // Create KPI cards data
  const kpiCards: KPICard[] = [
    {
      title: 'Total Cases',
      value: 0,
      icon: <Assessment />,
      color: '#d32f2f',
    },
    {
      title: 'Avg Response Time',
      value: 'N/A',
      icon: <Timeline />,
      color: '#ed6c02',
    },
    {
      title: 'Survival Rate',
      value: 'N/A',
      icon: <Dashboard />,
      color: '#2e7d32',
    },
    {
      title: 'Critical Cases',
      value: 'N/A',
      icon: <LocalHospital />,
      color: '#d32f2f',
    },
  ];

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <>
      <Helmet>
        <title>Trauma Portal - RCC Healthcare Platform</title>
      </Helmet>
      
      <PortalSkeleton
        title="Trauma Portal"
        subtitle="Comprehensive trauma care coordination and critical injury management"
        portalType="trauma"
        steps={portalSteps}
        activeStep={activeTab}
        onRefresh={() => {
          // TODO: Refresh trauma data
          console.log('Refresh trauma data');
        }}
        headerActions={headerActions}
        kpiCards={kpiCards}
      >
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* Main Content Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 1 }}>
          <Tabs value={activeTab} onChange={handleTabChange} aria-label="trauma portal tabs">
            <Tab label="Cases" />
            <Tab label="KPI Dashboard" />
            <Tab label="Timeline View" />
          </Tabs>
        </Box>

        <TabPanel value={activeTab} index={0}>
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="h6" color="text.secondary">
              Trauma Cases Management
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Trauma case management functionality will be implemented here.
            </Typography>
          </Box>
        </TabPanel>

        <TabPanel value={activeTab} index={1}>
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="h6" color="text.secondary">
              Trauma KPI Dashboard
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Trauma performance metrics and KPIs will be displayed here.
            </Typography>
          </Box>
        </TabPanel>

        <TabPanel value={activeTab} index={2}>
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="h6" color="text.secondary">
              Trauma Timeline View
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Trauma case timeline and progression tracking will be shown here.
            </Typography>
          </Box>
        </TabPanel>
      </PortalSkeleton>
    </>
  );
};

export default TraumaPortal;