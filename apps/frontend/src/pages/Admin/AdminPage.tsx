import React, { useState } from 'react';
import { Typography, Box, Tabs, Tab } from '@mui/material';
import { Helmet } from 'react-helmet-async';
import UserRegistrationRequests from './components/UserRegistrationRequests';
import UserManagement from './components/UserManagement';
import AmbulanceTrackingData from './components/AmbulanceTrackingData';

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
      id={`admin-tabpanel-${index}`}
      aria-labelledby={`admin-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ py: 4 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const AdminPage: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  return (
    <>
      <Helmet>
        <title>System Administration - RCC Healthcare Platform</title>
      </Helmet>

      <Box sx={{
        maxWidth: 1600,
        mx: 'auto',
        minHeight: '100vh',
        background: 'transparent'
      }}>
        <Box sx={{
          borderBottom: 1,
          borderColor: 'divider',
          mb: 2,
          display: 'flex',
          alignItems: 'center',
          gap: 4
        }}>
          <Typography variant="h5" sx={{ fontWeight: 900, color: 'primary.main', letterSpacing: '-0.02em', mr: 2 }}>
            RCC ADMIN
          </Typography>
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            sx={{
              '& .MuiTabs-indicator': {
                height: 3,
                borderRadius: '3px 3px 0 0',
              },
              '& .MuiTab-root': {
                textTransform: 'none',
                fontWeight: 600,
                fontSize: '1rem',
                minWidth: 120,
                py: 2
              }
            }}
          >
            <Tab label="Registration Requests" />
            <Tab label="User Management" />
            <Tab label="Ambulance Tracking" />
          </Tabs>
        </Box>

        <TabPanel value={tabValue} index={0}>
          <UserRegistrationRequests />
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <UserManagement />
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <AmbulanceTrackingData />
        </TabPanel>
      </Box>
    </>
  );
};

export default AdminPage;