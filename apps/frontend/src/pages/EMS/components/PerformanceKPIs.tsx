import React from 'react';
import { Box, Card, CardContent, Typography, Grid } from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faClock, faRoute, faGasPump, faChartLine } from '@fortawesome/free-solid-svg-icons';

interface PerformanceKPIsProps {
  kpis: {
    avgResponseTime: number;
    totalAssignments: number;
    avgFuelConsumption: number;
    onTimeArrivals: number;
    totalDistance: number;
    avgAssignmentDuration: number;
  };
}

const PerformanceKPIs: React.FC<PerformanceKPIsProps> = ({ kpis }) => {
  const kpiCards = [
    {
      title: 'Avg Response Time',
      value: `${kpis.avgResponseTime.toFixed(1)} min`,
      icon: faClock,
      color: '#1976d2',
      subtitle: 'Target: < 10 min',
    },
    {
      title: 'Total Assignments',
      value: kpis.totalAssignments.toString(),
      icon: faRoute,
      color: '#4caf50',
      subtitle: 'This period',
    },
    {
      title: 'Avg Fuel Consumption',
      value: `${kpis.avgFuelConsumption.toFixed(1)} L`,
      icon: faGasPump,
      color: '#ff9800',
      subtitle: 'Per assignment',
    },
    {
      title: 'On-Time Arrivals',
      value: `${kpis.onTimeArrivals}%`,
      icon: faChartLine,
      color: '#9c27b0',
      subtitle: 'Success rate',
    },
    {
      title: 'Total Distance',
      value: `${kpis.totalDistance.toFixed(0)} km`,
      icon: faRoute,
      color: '#f44336',
      subtitle: 'This period',
    },
    {
      title: 'Avg Assignment Duration',
      value: `${kpis.avgAssignmentDuration.toFixed(1)} min`,
      icon: faClock,
      color: '#607d8b',
      subtitle: 'Door to door',
    },
  ];

  return (
    <Grid container spacing={2}>
      {kpiCards.map((kpi, index) => (
        <Grid item xs={12} sm={6} md={4} key={index}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Box sx={{ mb: 2 }}>
                <FontAwesomeIcon 
                  icon={kpi.icon} 
                  size="2x" 
                  style={{ color: kpi.color }}
                />
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
                {kpi.value}
              </Typography>
              <Typography variant="h6" sx={{ mb: 1 }}>
                {kpi.title}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {kpi.subtitle}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
};

export default PerformanceKPIs;


