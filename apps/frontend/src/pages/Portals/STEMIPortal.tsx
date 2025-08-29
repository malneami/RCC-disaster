import React from 'react';
import { Typography, Box, Card, CardContent } from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHeart } from '@fortawesome/free-solid-svg-icons';
import { Helmet } from 'react-helmet-async';

const STEMIPortal: React.FC = () => {
  return (
    <>
      <Helmet>
        <title>STEMI Portal - RCC Healthcare Platform</title>
      </Helmet>
      
      <Box>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <FontAwesomeIcon icon={faHeart} style={{ marginRight: '16px', color: '#d32f2f', fontSize: '32px' }} />
          <Box>
            <Typography variant="h4" component="h1">
              STEMI Portal
            </Typography>
            <Typography variant="body2" color="text.secondary">
              ST-Elevation Myocardial Infarction coordination and management
            </Typography>
          </Box>
        </Box>
        
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              STEMI Network Overview
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Dedicated portal for managing ST-elevation myocardial infarction cases, 
              coordinating with catheterization labs, and ensuring rapid response times.
            </Typography>
            
            <Box sx={{ mt: 3 }}>
              <Typography variant="body2" color="text.secondary">
                Features in development:
              </Typography>
              <ul>
                <li>Real-time cath lab availability</li>
                <li>EKG transmission and review</li>
                <li>Door-to-balloon time tracking</li>
                <li>STEMI alert notifications</li>
              </ul>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </>
  );
};

export default STEMIPortal;