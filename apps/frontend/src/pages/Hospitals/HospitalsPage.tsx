import React from 'react';
import { Typography, Box } from '@mui/material';
import { Helmet } from 'react-helmet-async';

const HospitalsPage: React.FC = () => {
  return (
    <>
      <Helmet>
        <title>Hospitals - RCC Healthcare Platform</title>
      </Helmet>
      
      <Box>
        <Typography variant="h4" component="h1" gutterBottom>
          Hospital Network
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Monitor hospital capacity, services, and equipment status
        </Typography>
        
        <Box sx={{ mt: 4 }}>
          <Typography variant="body1">
            Hospital network management interface coming soon...
          </Typography>
        </Box>
      </Box>
    </>
  );
};

export default HospitalsPage;