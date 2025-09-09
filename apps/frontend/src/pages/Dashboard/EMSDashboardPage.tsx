import React from 'react';
import { Box, Typography } from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faAmbulance } from '@fortawesome/free-solid-svg-icons';
import { Helmet } from 'react-helmet-async';

import EMSDashboard from '../EMS/components/EMSDashboard';

const EMSDashboardPage: React.FC = () => {
  return (
    <>
      <Helmet>
        <title>EMS Dashboard - RCC Healthcare Platform</title>
      </Helmet>

      <Box sx={{ p: 3 }}>
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <FontAwesomeIcon icon={faAmbulance} color="#1976d2" />
            EMS Dashboard
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            Real-time Emergency Medical Services Overview & Analytics
          </Typography>
        </Box>

        <EMSDashboard />
      </Box>
    </>
  );
};

export default EMSDashboardPage;


