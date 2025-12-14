import React from 'react';
import { Box, Card, CardContent, Typography, Grid } from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faClock, faRoute, faChartLine } from '@fortawesome/free-solid-svg-icons';

interface PerformanceKPIsProps {
  kpis: {
    avgResponseTime: number;
    avgCasePreparationTime: number;
    avgAssignmentDuration: number;
    avgTotalTransferTime: number;
    onTimeArrivals: number;
    totalAssignments: number;
  };
}

const PerformanceKPIs: React.FC<PerformanceKPIsProps> = ({ kpis }) => {
  const getResponseTimeColor = (val: number) => {
    if (val < 5) return '#4caf50'; // Green
    if (val <= 10) return '#ff9800'; // Yellow
    return '#f44336'; // Red
  };

  const getCPTColor = (val: number) => {
    if (val < 10) return '#4caf50';
    if (val <= 20) return '#ff9800';
    return '#f44336';
  };

  const getOnTimeColor = (val: number) => val >= 90 ? '#4caf50' : '#f44336';

  const kpiCards = [
    {
      title: 'EMS Response Time',
      value: `${kpis.avgResponseTime.toFixed(1)} min`,
      icon: faClock,
      color: getResponseTimeColor(kpis.avgResponseTime),
      subtitle: 'Target: < 5 min',
    },
    {
      title: 'Case Preparation Time',
      value: `${kpis.avgCasePreparationTime.toFixed(1)} min`,
      icon: faClock,
      color: getCPTColor(kpis.avgCasePreparationTime),
      subtitle: 'Target: < 10 min',
    },
    {
      title: 'Avg Assignment Duration',
      value: `${kpis.avgAssignmentDuration.toFixed(1)} min`,
      icon: faRoute,
      color: kpis.avgAssignmentDuration <= 45 ? '#4caf50' : '#ff9800',
      subtitle: 'Door-out to Dest',
    },
    {
      title: 'Total Transfer Time',
      value: `${kpis.avgTotalTransferTime.toFixed(1)} min`,
      icon: faClock,
      color: kpis.avgTotalTransferTime <= 75 ? '#4caf50' : '#ff9800',
      subtitle: 'Contact to Dest',
    },
    {
      title: 'On-Time Arrival Rate',
      value: `${kpis.onTimeArrivals}%`,
      icon: faChartLine,
      color: getOnTimeColor(kpis.onTimeArrivals),
      subtitle: 'Target: ≥ 90%',
    },
    {
      title: 'Total Assignments',
      value: kpis.totalAssignments.toString(),
      icon: faRoute,
      color: '#1976d2',
      subtitle: 'Completed',
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
              <Typography variant="h6" sx={{ mb: 1, fontSize: '1rem', fontWeight: 500 }}>
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


