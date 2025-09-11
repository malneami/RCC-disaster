import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Grid,
  Box,
  Avatar,
  LinearProgress,
} from '@mui/material';
import {
  LocalHospital,
  Warning,
  Schedule,
} from '@mui/icons-material';

import { StrokeKPISummary } from '../../../../services/strokeService';

interface StrokeTypeBreakdownProps {
  kpiSummary: StrokeKPISummary;
}

const StrokeTypeBreakdown: React.FC<StrokeTypeBreakdownProps> = ({ kpiSummary }) => {
  const totalCases = kpiSummary.totalCases;
  const strokeTypes = [
    {
      type: 'Ischemic',
      count: kpiSummary.strokeTypeBreakdown.ischemic,
      percentage: totalCases > 0 ? (kpiSummary.strokeTypeBreakdown.ischemic / totalCases) * 100 : 0,
      color: 'primary',
      icon: <LocalHospital />,
      description: 'Blocked blood vessel'
    },
    {
      type: 'Hemorrhagic',
      count: kpiSummary.strokeTypeBreakdown.hemorrhagic,
      percentage: totalCases > 0 ? (kpiSummary.strokeTypeBreakdown.hemorrhagic / totalCases) * 100 : 0,
      color: 'error',
      icon: <Warning />,
      description: 'Bleeding in brain'
    },
    {
      type: 'TIA',
      count: kpiSummary.strokeTypeBreakdown.tia,
      percentage: totalCases > 0 ? (kpiSummary.strokeTypeBreakdown.tia / totalCases) * 100 : 0,
      color: 'warning',
      icon: <Schedule />,
      description: 'Transient ischemic attack'
    },
  ];

  return (
    <Card sx={{ boxShadow: 3 }}>
      <CardContent sx={{ p: 3 }}>
        <Typography variant="h6" fontWeight="bold" gutterBottom>
          Stroke Type Distribution
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Breakdown of stroke cases by type
        </Typography>
        
        <Grid container spacing={3}>
          {strokeTypes.map((strokeType) => (
            <Grid item xs={12} sm={4} key={strokeType.type}>
              <Box 
                sx={{ 
                  textAlign: 'center',
                  p: 2,
                  borderRadius: 2,
                  border: `1px solid ${strokeType.color === 'primary' ? 'primary.main' : 
                                          strokeType.color === 'error' ? 'error.main' : 'warning.main'}`,
                  bgcolor: 'background.paper',
                  boxShadow: 1,
                  '&:hover': {
                    boxShadow: 3,
                    transform: 'translateY(-2px)',
                    transition: 'all 0.2s ease-in-out'
                  }
                }}
              >
                <Avatar 
                  sx={{ 
                    bgcolor: `${strokeType.color}.main`,
                    width: 60,
                    height: 60,
                    mx: 'auto',
                    mb: 2
                  }}
                >
                  {strokeType.icon}
                </Avatar>
                
                <Typography variant="h3" fontWeight="bold" color={`${strokeType.color}.main`} sx={{ textShadow: '0 1px 2px rgba(0,0,0,0.1)' }}>
                  {strokeType.count}
                </Typography>
                
                <Typography variant="h6" fontWeight="medium" sx={{ mb: 1 }}>
                  {strokeType.type}
                </Typography>
                
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {strokeType.description}
                </Typography>
                
                <Box sx={{ mb: 1 }}>
                  <LinearProgress
                    variant="determinate"
                    value={strokeType.percentage}
                    color={strokeType.color === 'primary' ? 'primary' : strokeType.color === 'error' ? 'error' : 'warning'}
                    sx={{ 
                      height: 6, 
                      borderRadius: 3,
                      bgcolor: 'grey.200'
                    }}
                  />
                </Box>
                
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 'bold', fontSize: '0.875rem' }}>
                  {Math.round(strokeType.percentage)}% of total cases
                </Typography>
              </Box>
            </Grid>
          ))}
        </Grid>
      </CardContent>
    </Card>
  );
};

export default StrokeTypeBreakdown;
