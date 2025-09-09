import React from 'react';
import { Box, Grid, Card, CardContent, Typography, Chip, LinearProgress } from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faAmbulance,
  faUserMd,
  faClock,
  faCheckCircle
} from '@fortawesome/free-solid-svg-icons';

import { useEMSDashboard } from '../hooks/useEMSDashboard';
import EmptyState from '../../../components/common/EmptyState';

interface KPICardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
  trend?: number;
  subtitle?: string;
}

const KPICard: React.FC<KPICardProps> = ({ title, value, icon, color, trend, subtitle }) => (
  <Card sx={{ height: '100%' }}>
    <CardContent>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h6" color="text.secondary">
          {title}
        </Typography>
        <Box sx={{ color }}>
          {icon}
        </Box>
      </Box>
      <Typography variant="h4" component="div" sx={{ fontWeight: 'bold', mb: 1 }}>
        {value}
      </Typography>
      {subtitle && (
        <Typography variant="body2" color="text.secondary">
          {subtitle}
        </Typography>
      )}
      {trend !== undefined && (
        <Box sx={{ mt: 1 }}>
          <Chip 
            label={`${trend > 0 ? '+' : ''}${trend}%`}
            size="small"
            color={trend > 0 ? 'success' : trend < 0 ? 'error' : 'default'}
            variant="outlined"
          />
        </Box>
      )}
    </CardContent>
  </Card>
);

const EMSDashboard: React.FC = () => {
  const { data: dashboardData, isLoading, error } = useEMSDashboard();

  if (isLoading) {
    return (
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>Loading Dashboard...</Typography>
          <LinearProgress />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent>
          <Typography variant="h6" color="error" gutterBottom>
            Error loading dashboard data
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {(error as Error)?.message || 'An error occurred'}
          </Typography>
        </CardContent>
      </Card>
    );
  }

  // Check if we have any data to display
  const hasData = dashboardData && (
    dashboardData.summary.totalAmbulances > 0 ||
    dashboardData.summary.totalAssignments > 0 ||
    dashboardData.recentAlerts?.length > 0
  );

  if (!hasData) {
    return (
      <EmptyState
        icon={<FontAwesomeIcon icon={faAmbulance} size="3x" />}
        title="No EMS Data Available"
        description="There are no ambulances, assignments, or alerts to display. Start by adding ambulances to your fleet."
        actionLabel="Add Ambulance"
        onAction={() => {
          // This would navigate to ambulance management
          console.log('Navigate to add ambulance');
        }}
      />
    );
  }

  const summary = dashboardData?.summary || {};

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <FontAwesomeIcon icon={faAmbulance} />
          EMS Dashboard Overview
        </Typography>
        
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6} md={3}>
            <KPICard
              title="Total Ambulances"
              value={summary.totalAmbulances || 0}
              icon={<FontAwesomeIcon icon={faAmbulance} />}
              color="#1976d2"
              subtitle="Fleet Size"
            />
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <KPICard
              title="Active Ambulances"
              value={summary.activeAmbulances || 0}
              icon={<FontAwesomeIcon icon={faCheckCircle} />}
              color="#2e7d32"
              subtitle="Currently in Service"
            />
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <KPICard
              title="Available Ambulances"
              value={summary.availableAmbulances || 0}
              icon={<FontAwesomeIcon icon={faClock} />}
              color="#ed6c02"
              subtitle="Ready for Dispatch"
            />
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <KPICard
              title="Active Assignments"
              value={summary.activeAssignments || 0}
              icon={<FontAwesomeIcon icon={faUserMd} />}
              color="#9c27b0"
              subtitle="Ongoing Transfers"
            />
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <KPICard
              title="Active Schedules"
              value={summary.activeSchedules || 0}
              icon={<FontAwesomeIcon icon={faClock} />}
              color="#1976d2"
              subtitle="Driver Shifts"
            />
          </Grid>
          
          
          <Grid item xs={12} sm={6} md={3}>
            <KPICard
              title="Response Time"
              value="8.5 min"
              icon={<FontAwesomeIcon icon={faClock} />}
              color="#2e7d32"
              subtitle="Average Today"
              trend={-12}
            />
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
};

export default EMSDashboard;
