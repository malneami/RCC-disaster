import React from 'react';
import { Box, Grid, Card, CardContent, Typography, Chip, LinearProgress, List, ListItem, ListItemText, Divider, Avatar } from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faAmbulance,
  faUserMd,
  faClock,
  faCheckCircle,
  faHistory,
  faCalendarAlt,
  faTasks
} from '@fortawesome/free-solid-svg-icons';

import { useEMSDashboard } from '../hooks/useEMSDashboard';
import EmptyState from '../../../components/Common/EmptyState';

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
    (dashboardData.summary.totalAssignments ?? 0) > 0 ||
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
          {/* Row 1: Operations Status (The Numbers User Cares About) */}
          <Grid item xs={12} sm={6} md={3}>
            <KPICard
              title="Pending Request"
              value={summary.pendingTickets || 0}
              icon={<FontAwesomeIcon icon={faClock} />}
              color="#ed6c02" // Warning Orange
              subtitle="Waiting for Assignment"
            />
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <KPICard
              title="Assigned"
              value={summary.assignedAssignments || 0}
              icon={<FontAwesomeIcon icon={faUserMd} />}
              color="#0288d1" // Info Blue
              subtitle="Crew Assigned / En Route to Patient"
            />
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <KPICard
              title="In Transport"
              value={summary.inTransportAssignments || 0}
              icon={<FontAwesomeIcon icon={faAmbulance} />}
              color="#9c27b0" // Purple
              subtitle="Patient On Board"
            />
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <KPICard
              title="Completed Today"
              value={summary.todayCompletedAssignments || 0}
              icon={<FontAwesomeIcon icon={faCheckCircle} />}
              color="#2e7d32" // Success Green
              subtitle="Arrivals Today"
            />
          </Grid>

          {/* Row 2: Fleet Status & Overview */}
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
              title="Total Completed"
              value={summary.totalCompletedAssignments || summary.totalAssignments || 0}
              icon={<FontAwesomeIcon icon={faTasks} />}
              color="#1976d2"
              subtitle="All Time Arrivals"
            />
          </Grid>
        </Grid>

        {/* Recent Activity Section */}
        {((dashboardData?.recentAssignments?.length ?? 0) > 0 || (dashboardData?.upcomingSchedules?.length ?? 0) > 0) && (
          <>
            <Divider sx={{ my: 3 }} />
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <FontAwesomeIcon icon={faHistory} />
              Recent Activity
            </Typography>

            <Grid container spacing={3}>
              {/* Recent Assignments */}
              {dashboardData?.recentAssignments && dashboardData.recentAssignments.length > 0 && (
                <Grid item xs={12} md={6}>
                  <Card>
                    <CardContent>
                      <Typography variant="subtitle1" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <FontAwesomeIcon icon={faAmbulance} size="sm" />
                        Recent Assignments
                      </Typography>
                      <List dense>
                        {dashboardData.recentAssignments.slice(0, 5).map((assignment, index) => (
                          <React.Fragment key={assignment.id}>
                            <ListItem>
                              <Avatar sx={{ bgcolor: assignment.status === 'ARRIVED' ? 'success.main' : 'primary.main', mr: 2 }}>
                                {assignment.ticketNumber?.slice(-2) || '?'}
                              </Avatar>
                              <ListItemText
                                primary={
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Typography variant="body2" fontWeight="medium">
                                      {assignment.ticketNumber ? `Ticket #${assignment.ticketNumber}` : 'Emergency Mission'}
                                    </Typography>
                                    <Chip
                                      label={assignment.status.replace('_', ' ')}
                                      size="small"
                                      color={assignment.status === 'ARRIVED' ? 'success' : 'default'}
                                    />
                                  </Box>
                                }
                                secondary={
                                  <Box>
                                    {assignment.ambulanceCallSign && (
                                      <Typography variant="caption" display="block">
                                        Ambulance: {assignment.ambulanceCallSign}
                                      </Typography>
                                    )}
                                    {assignment.driverName && (
                                      <Typography variant="caption" display="block">
                                        Driver: {assignment.driverName}
                                      </Typography>
                                    )}
                                    <Typography variant="caption" color="text.secondary">
                                      {new Date(assignment.assignedAt).toLocaleString()}
                                    </Typography>
                                  </Box>
                                }
                              />
                            </ListItem>
                            {index < dashboardData.recentAssignments!.slice(0, 5).length - 1 && <Divider component="li" />}
                          </React.Fragment>
                        ))}
                      </List>
                    </CardContent>
                  </Card>
                </Grid>
              )}

              {/* Upcoming Schedules */}
              {dashboardData?.upcomingSchedules && dashboardData.upcomingSchedules.length > 0 && (
                <Grid item xs={12} md={6}>
                  <Card>
                    <CardContent>
                      <Typography variant="subtitle1" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <FontAwesomeIcon icon={faCalendarAlt} size="sm" />
                        Upcoming Schedules
                      </Typography>
                      <List dense>
                        {dashboardData.upcomingSchedules.map((schedule, index) => (
                          <React.Fragment key={schedule.id}>
                            <ListItem>
                              <Avatar sx={{ bgcolor: 'info.main', mr: 2 }}>
                                <FontAwesomeIcon icon={faClock} />
                              </Avatar>
                              <ListItemText
                                primary={schedule.driverName}
                                secondary={
                                  <Box>
                                    <Typography variant="caption" display="block">
                                      Start: {new Date(schedule.shiftStart).toLocaleString()}
                                    </Typography>
                                    <Typography variant="caption" display="block">
                                      End: {new Date(schedule.shiftEnd).toLocaleString()}
                                    </Typography>
                                  </Box>
                                }
                              />
                            </ListItem>
                            {index < dashboardData.upcomingSchedules!.length - 1 && <Divider component="li" />}
                          </React.Fragment>
                        ))}
                      </List>
                    </CardContent>
                  </Card>
                </Grid>
              )}
            </Grid>
          </>
        )}
      </CardContent>
    </Card >
  );
};

export default EMSDashboard;
