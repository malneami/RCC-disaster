import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  LinearProgress,
  Stack,
  alpha,
} from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faClock,
  faTruck,
  faCalendarAlt,
  faCheckCircle,
  faHospital,
  faAmbulance,
} from '@fortawesome/free-solid-svg-icons';

import { useLivePerformanceMetrics } from './hooks';

const LivePerformanceMetrics: React.FC = () => {
  const { data, isLoading, error } = useLivePerformanceMetrics();

  if (isLoading) {
    return (
      <Card sx={{ borderRadius: 3, border: '1px solid rgba(0,0,0,0.08)' }}>
        <CardContent sx={{ p: 3 }}>
          <Typography>Loading live performance data...</Typography>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card sx={{ borderRadius: 3, border: '1px solid rgba(0,0,0,0.08)' }}>
        <CardContent sx={{ p: 3 }}>
          <Typography color="error">
            Error loading live performance data: {(error as Error)?.message || 'Unknown error'}
          </Typography>
        </CardContent>
      </Card>
    );
  }

  const metrics = data || {
    activeTransports: 0,
    avgResponseTime: 15,
    hospitalCapacity: 100,
    ambulanceUtilization: 65,
    completedToday: 0,
  };

  const performanceItems = [
    {
      label: 'Active Transports',
      value: metrics.activeTransports.toString(),
      icon: faTruck,
      secondaryIcon: faCalendarAlt,
      color: '#1976d2',
    },
    {
      label: 'Avg Response Time',
      value: `${metrics.avgResponseTime} min`,
      icon: faClock,
      color: '#4caf50',
      isHighlighted: true,
    },
    {
      label: 'Hospital Capacity',
      value: `${metrics.hospitalCapacity}%`,
      icon: faHospital,
      color: '#2196f3',
      progress: metrics.hospitalCapacity,
    },
    {
      label: 'Ambulance Utilization',
      value: `${metrics.ambulanceUtilization}%`,
      icon: faAmbulance,
      color: '#ff9800',
      progress: metrics.ambulanceUtilization,
    },
    {
      label: 'Completed Today',
      value: metrics.completedToday.toString(),
      icon: faCheckCircle,
      color: '#4caf50',
    },
  ];

  return (
    <Card sx={{ borderRadius: 3, border: '1px solid rgba(0,0,0,0.08)' }}>
      <CardContent sx={{ p: 3 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <FontAwesomeIcon 
            icon={faClock} 
            style={{ color: '#1976d2', marginRight: '16px', fontSize: '28px' }} 
          />
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 600 }}>
              Live Performance Metrics
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Real-time system performance indicators
            </Typography>
          </Box>
        </Box>

        {/* Metrics Grid */}
        <Stack spacing={3}>
          {performanceItems.map((item, index) => (
            <Box key={index}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <FontAwesomeIcon 
                    icon={item.icon} 
                    style={{ 
                      color: item.color, 
                      marginRight: '8px', 
                      fontSize: '16px' 
                    }} 
                  />
                  {item.secondaryIcon && (
                    <FontAwesomeIcon 
                      icon={item.secondaryIcon} 
                      style={{ 
                        color: item.color, 
                        marginRight: '8px', 
                        fontSize: '14px' 
                      }} 
                    />
                  )}
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {item.label}:
                  </Typography>
                </Box>
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: 600,
                    color: item.isHighlighted ? item.color : 'inherit',
                  }}
                >
                  {item.value}
                </Typography>
              </Box>
              
              {item.progress !== undefined && (
                <LinearProgress
                  variant="determinate"
                  value={item.progress}
                  sx={{
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: alpha(item.color, 0.1),
                    '& .MuiLinearProgress-bar': {
                      backgroundColor: item.color,
                      borderRadius: 4,
                    },
                  }}
                />
              )}
            </Box>
          ))}
        </Stack>
      </CardContent>
    </Card>
  );
};

export default LivePerformanceMetrics;
