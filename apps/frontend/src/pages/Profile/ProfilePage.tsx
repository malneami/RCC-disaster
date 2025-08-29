import React from 'react';
import { Typography, Box } from '@mui/material';
import { Helmet } from 'react-helmet-async';

const ProfilePage: React.FC = () => {
  return (
    <>
      <Helmet>
        <title>User Profile - RCC Healthcare Platform</title>
      </Helmet>
      
      <Box>
        <Typography variant="h4" component="h1" gutterBottom>
          User Profile
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Manage your account settings and preferences
        </Typography>
        
        <Box sx={{ mt: 4 }}>
          <Typography variant="body1">
            User profile management interface coming soon...
          </Typography>
        </Box>
      </Box>
    </>
  );
};

export default ProfilePage;