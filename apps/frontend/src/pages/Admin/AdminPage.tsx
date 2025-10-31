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
        <Box sx={{ pt: 3 }}>
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
      
      <Box>
        <Typography variant="h4" component="h1" gutterBottom>
          System Administration
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Platform configuration, user management, and system monitoring
        </Typography>
        
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange}>
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