import React from 'react';
import { Typography, Box } from '@mui/material';
import { Helmet } from 'react-helmet-async';

const PatientsPage: React.FC = () => {
  return (
    <>
      <Helmet>
        <title>Patients - RCC Healthcare Platform</title>
      </Helmet>
      
      <Box>
        <Typography variant="h4" component="h1" gutterBottom>
          Patient Management
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Secure patient data management and medical history
        </Typography>
        
        <Box sx={{ mt: 4 }}>
          <Typography variant="body1">
            Patient management interface coming soon...
          </Typography>
        </Box>
      </Box>
    </>
  );
};

export default PatientsPage;