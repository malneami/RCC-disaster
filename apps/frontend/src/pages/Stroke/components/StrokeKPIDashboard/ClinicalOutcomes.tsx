import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Grid,
  Box,
  Avatar,
  Chip,
  LinearProgress,
} from '@mui/material';
import {
  CheckCircle,
  Warning,
  Schedule,
  Home,
} from '@mui/icons-material';

import { StrokeKPISummary } from '../../../../services/strokeService';

interface ClinicalOutcomesProps {
  kpiSummary: StrokeKPISummary;
}

const ClinicalOutcomes: React.FC<ClinicalOutcomesProps> = ({ kpiSummary }) => {
  const outcomes = [
    {
      label: 'Treatment Success',
      value: kpiSummary.outcomes.successRate,
      unit: '%',
      icon: <CheckCircle />,
      color: 'success',
      description: 'Successful treatment outcomes',
      target: '>80%'
    },
    {
      label: '30-day Readmission',
      value: kpiSummary.outcomes.readmissionRate,
      unit: '%',
      icon: <Warning />,
      color: 'error',
      description: 'Patients readmitted within 30 days',
      target: '<10%'
    },
    {
      label: 'Length of Stay',
      value: kpiSummary.outcomes.averageLengthOfStay,
      unit: ' days',
      icon: <Schedule />,
      color: 'info',
      description: 'Average hospital stay duration',
      target: '<7 days'
    },
    {
      label: 'Independent Discharge',
      value: kpiSummary.outcomes.independentDischargeRate,
      unit: '%',
      icon: <Home />,
      color: 'primary',
      description: 'Patients discharged independently',
      target: '>70%'
    },
  ];

  const getPerformanceStatus = (outcome: any) => {
    if (outcome.label === 'Treatment Success' || outcome.label === 'Independent Discharge') {
      return outcome.value >= 80 ? 'excellent' : outcome.value >= 60 ? 'good' : 'needs improvement';
    } else if (outcome.label === '30-day Readmission') {
      return outcome.value <= 10 ? 'excellent' : outcome.value <= 20 ? 'good' : 'needs improvement';
    } else if (outcome.label === 'Length of Stay') {
      return outcome.value <= 7 ? 'excellent' : outcome.value <= 10 ? 'good' : 'needs improvement';
    }
    return 'good';
  };

  return (
    <Card sx={{ boxShadow: 3 }}>
      <CardContent sx={{ p: 3 }}>
        <Typography variant="h6" fontWeight="bold" gutterBottom>
          Clinical Outcomes
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Key clinical performance metrics
        </Typography>
        
        <Grid container spacing={3}>
          {outcomes.map((outcome) => {
            const status = getPerformanceStatus(outcome);
            const statusColor = status === 'excellent' ? 'success' : status === 'good' ? 'warning' : 'error';
            
            return (
              <Grid item xs={12} sm={6} md={3} key={outcome.label}>
                <Box 
                  sx={{ 
                    textAlign: 'center',
                    p: 3,
                    borderRadius: 2,
                    border: `1px solid ${statusColor === 'success' ? 'success.main' : 
                                            statusColor === 'warning' ? 'warning.main' : 'error.main'}`,
                    bgcolor: 'background.paper',
                    boxShadow: 1,
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    '&:hover': {
                      boxShadow: 3,
                      transform: 'translateY(-2px)',
                      transition: 'all 0.2s ease-in-out'
                    }
                  }}
                >
                  <Box>
                    <Avatar 
                      sx={{ 
                        bgcolor: `${statusColor}.main`,
                        width: 50,
                        height: 50,
                        mx: 'auto',
                        mb: 2
                      }}
                    >
                      {outcome.icon}
                    </Avatar>
                    
                    <Typography variant="h4" fontWeight="bold" color={`${statusColor}.main`} sx={{ mb: 1, textShadow: '0 1px 2px rgba(0,0,0,0.1)' }}>
                      {Math.round(outcome.value)}{outcome.unit}
                    </Typography>
                    
                    <Typography variant="h6" fontWeight="medium" sx={{ mb: 1 }}>
                      {outcome.label}
                    </Typography>
                    
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {outcome.description}
                    </Typography>
                  </Box>
                  
                  <Box>
                    <Chip 
                      label={`Target: ${outcome.target}`}
                      size="small"
                      variant="outlined"
                      color={statusColor}
                      sx={{ mb: 1, fontWeight: 'bold', fontSize: '0.75rem' }}
                    />
                    
                    <Chip 
                      label={status === 'excellent' ? 'Excellent' : status === 'good' ? 'Good' : 'Needs Improvement'}
                      size="small"
                      color={statusColor}
                      variant="filled"
                      sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}
                    />
                  </Box>
                </Box>
              </Grid>
            );
          })}
        </Grid>
      </CardContent>
    </Card>
  );
};

export default ClinicalOutcomes;
