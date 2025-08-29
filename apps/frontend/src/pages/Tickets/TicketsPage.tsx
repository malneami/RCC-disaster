import React from 'react';
import { Typography, Box } from '@mui/material';
import { Helmet } from 'react-helmet-async';

const TicketsPage: React.FC = () => {
  return (
    <>
      <Helmet>
        <title>Transfer Tickets - RCC Healthcare Platform</title>
      </Helmet>
      
      <Box>
        <Typography variant="h4" component="h1" gutterBottom>
          Transfer Tickets
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Manage patient transfer requests across the healthcare network
        </Typography>
        
        <Box sx={{ mt: 4 }}>
          <Typography variant="body1">
            Transfer tickets management interface coming soon...
          </Typography>
        </Box>
      </Box>
    </>
  );
};

export default TicketsPage;