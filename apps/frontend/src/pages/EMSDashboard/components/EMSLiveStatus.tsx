import React from 'react';
import { Box, Card, CardContent, Typography, Grid, Chip, LinearProgress } from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faAmbulance,
  faClock,
} from '@fortawesome/free-solid-svg-icons';

interface LiveStatusData {
  totalAmbulances: number;
  activeAmbulances: number;
  availableAmbulances: number;
  inUseAmbulances: number;
  activeAssignments: number;
  responseTime: number;
  averageResponseTime: number;
}

interface EMSLiveStatusProps {
  data?: LiveStatusData;
  isLoading?: boolean;
}

const EMSLiveStatus: React.FC<EMSLiveStatusProps> = ({ data, isLoading }) => {
  if (isLoading) {
    return (
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Live Status
          </Typography>
          <LinearProgress />
        </CardContent>
      </Card>
    );
  }

  const statusData = data || {
    totalAmbulances: 0,
    activeAmbulances: 0,
    availableAmbulances: 0,
    inUseAmbulances: 0,
    activeAssignments: 0,
    responseTime: 0,
    averageResponseTime: 0,
  };

  const availabilityPercentage = statusData.totalAmbulances > 0 
    ? Math.round((statusData.availableAmbulances / statusData.totalAmbulances) * 100)
    : 0;

  const getStatusColor = (percentage: number) => {
    if (percentage >= 80) return '#2e7d32';
    if (percentage >= 60) return '#ed6c02';
    return '#d32f2f';
  };

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <FontAwesomeIcon icon={faAmbulance} />
          Live Status
        </Typography>
        
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6} md={3}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#1976d2' }}>
                {statusData.totalAmbulances}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Ambulances
              </Typography>
            </Box>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#2e7d32' }}>
                {statusData.availableAmbulances}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Available
              </Typography>
            </Box>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#ed6c02' }}>
                {statusData.inUseAmbulances}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                In Use
              </Typography>
            </Box>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#9c27b0' }}>
                {statusData.activeAssignments}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Active Assignments
              </Typography>
            </Box>
          </Grid>
          
          <Grid item xs={12}>
            <Box sx={{ mt: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  Fleet Availability
                </Typography>
                <Chip
                  label={`${availabilityPercentage}%`}
                  size="small"
                  sx={{ 
                    backgroundColor: getStatusColor(availabilityPercentage),
                    color: 'white',
                    fontWeight: 'bold',
                  }}
                />
              </Box>
              <LinearProgress
                variant="determinate"
                value={availabilityPercentage}
                sx={{
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: '#e0e0e0',
                  '& .MuiLinearProgress-bar': {
                    backgroundColor: getStatusColor(availabilityPercentage),
                    borderRadius: 4,
                  },
                }}
              />
            </Box>
          </Grid>
          
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 2 }}>
              <FontAwesomeIcon icon={faClock} color="#1976d2" />
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Current Response Time
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                  {statusData.responseTime} minutes
                </Typography>
              </Box>
              <Box sx={{ ml: 'auto' }}>
                <Typography variant="body2" color="text.secondary">
                  Average Today
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                  {statusData.averageResponseTime} min
                </Typography>
              </Box>
            </Box>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
};

export default EMSLiveStatus;
