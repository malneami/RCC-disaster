import React from 'react';
import { Typography, Box, Card, CardContent } from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBrain } from '@fortawesome/free-solid-svg-icons';
import { Helmet } from 'react-helmet-async';

const StrokePortal: React.FC = () => {
  return (
    <>
      <Helmet>
        <title>Stroke Portal - RCC Healthcare Platform</title>
      </Helmet>
      
      <Box>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <FontAwesomeIcon icon={faBrain} style={{ marginRight: '16px', color: '#ed6c02', fontSize: '32px' }} />
          <Box>
            <Typography variant="h4" component="h1">
              Stroke Portal
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Comprehensive stroke care coordination and time-sensitive protocols
            </Typography>
          </Box>
        </Box>
        
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Stroke Network Management
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Specialized portal for stroke care coordination, including acute stroke protocols,
              thrombectomy capabilities, and rehabilitation planning.
            </Typography>
            
            <Box sx={{ mt: 3 }}>
              <Typography variant="body2" color="text.secondary">
                Features in development:
              </Typography>
              <ul>
                <li>NIHSS score tracking</li>
                <li>CT/MRI imaging coordination</li>
                <li>Thrombolytic therapy protocols</li>
                <li>Stroke center capabilities</li>
              </ul>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </>
  );
};

export default StrokePortal;