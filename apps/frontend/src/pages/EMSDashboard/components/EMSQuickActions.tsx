import React from 'react';
import { Card, CardContent, Typography, Button, Grid } from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faPlus,
  faMapMarkerAlt,
  faUserMd,
  faCalendarAlt,
  faChartLine,
  faBell,
} from '@fortawesome/free-solid-svg-icons';

interface EMSQuickActionsProps {
  onAddAmbulance?: () => void;
  onViewMap?: () => void;
  onManageAssignments?: () => void;
  onScheduleManagement?: () => void;
  onViewAnalytics?: () => void;
  onViewNotifications?: () => void;
}

const EMSQuickActions: React.FC<EMSQuickActionsProps> = ({
  onAddAmbulance,
  onViewMap,
  onManageAssignments,
  onScheduleManagement,
  onViewAnalytics,
  onViewNotifications,
}) => {
  const actions = [
    {
      title: 'Add Ambulance',
      description: 'Register new ambulance to fleet',
      icon: <FontAwesomeIcon icon={faPlus} />,
      color: '#1976d2',
      onClick: onAddAmbulance,
    },
    {
      title: 'Live Map',
      description: 'View real-time ambulance locations',
      icon: <FontAwesomeIcon icon={faMapMarkerAlt} />,
      color: '#2e7d32',
      onClick: onViewMap,
    },
    {
      title: 'Assignments',
      description: 'Manage active assignments',
      icon: <FontAwesomeIcon icon={faUserMd} />,
      color: '#ed6c02',
      onClick: onManageAssignments,
    },
    {
      title: 'Schedules',
      description: 'Manage driver schedules',
      icon: <FontAwesomeIcon icon={faCalendarAlt} />,
      color: '#9c27b0',
      onClick: onScheduleManagement,
    },
    {
      title: 'Analytics',
      description: 'View performance analytics',
      icon: <FontAwesomeIcon icon={faChartLine} />,
      color: '#f57c00',
      onClick: onViewAnalytics,
    },
    {
      title: 'Notifications',
      description: 'View system alerts',
      icon: <FontAwesomeIcon icon={faBell} />,
      color: '#d32f2f',
      onClick: onViewNotifications,
    },
  ];

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <FontAwesomeIcon icon={faPlus} />
          Quick Actions
        </Typography>
        
        <Grid container spacing={2}>
          {actions.map((action, index) => (
            <Grid item xs={12} sm={6} md={4} key={index}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={action.icon}
                onClick={action.onClick}
                sx={{
                  height: '80px',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  justifyContent: 'flex-start',
                  textAlign: 'left',
                  p: 2,
                  borderColor: action.color,
                  color: action.color,
                  '&:hover': {
                    borderColor: action.color,
                    backgroundColor: `${action.color}10`,
                  },
                }}
              >
                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
                  {action.title}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {action.description}
                </Typography>
              </Button>
            </Grid>
          ))}
        </Grid>
      </CardContent>
    </Card>
  );
};

export default EMSQuickActions;
