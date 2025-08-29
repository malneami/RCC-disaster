import React from 'react';
import { Typography, Box } from '@mui/material';
import { Helmet } from 'react-helmet-async';

const AdminPage: React.FC = () => {
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
        
        <Box sx={{ mt: 4 }}>
          <Typography variant="body1">
            System administration interface coming soon...
          </Typography>
        </Box>
      </Box>
    </>
  );
};

export default AdminPage;