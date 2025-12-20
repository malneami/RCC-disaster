import React from 'react';
import { Card, CardContent, Typography, Grid, Box } from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faPlus,
  faMapMarkerAlt,
  faUserMd,
  faCalendarAlt,
  faChartLine,
  faBell,
  faBolt,
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
      icon: faPlus,
      color: '#1976d2',
      onClick: onAddAmbulance,
    },
    {
      title: 'Live Map',
      description: 'View real-time ambulance locations',
      icon: faMapMarkerAlt,
      color: '#2e7d32',
      onClick: onViewMap,
    },
    {
      title: 'Assignments',
      description: 'Manage active assignments',
      icon: faUserMd,
      color: '#ed6c02',
      onClick: onManageAssignments,
    },
    {
      title: 'Schedules',
      description: 'Manage driver schedules',
      icon: faCalendarAlt,
      color: '#9c27b0',
      onClick: onScheduleManagement,
    },
    {
      title: 'Analytics',
      description: 'View performance analytics',
      icon: faChartLine,
      color: '#f57c00',
      onClick: onViewAnalytics,
    },
    {
      title: 'Notifications',
      description: 'View system alerts',
      icon: faBell,
      color: '#d32f2f',
      onClick: onViewNotifications,
    },
  ];

  return (
    <Card sx={{ borderRadius: 2, boxShadow: 2 }}>
      <CardContent sx={{ p: 3 }}>
        <Typography 
          variant="h6" 
          gutterBottom 
          sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 1.5,
            mb: 3,
            fontWeight: 600,
            color: 'text.primary'
          }}
        >
          <FontAwesomeIcon icon={faBolt} color="#1976d2" />
          Quick Actions
        </Typography>
        
        <Grid container spacing={2}>
          {actions.map((action, index) => (
            <Grid item xs={12} sm={6} key={index}>
              <Box
                component="button"
                onClick={action.onClick}
                sx={{
                  width: '100%',
                  minHeight: '90px',
                  boxSizing: 'border-box',
                  p: 2,
                  border: `2px solid ${action.color}40`,
                  borderRadius: 2,
                  backgroundColor: 'background.paper',
                  color: action.color,
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 1,
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  position: 'relative',
                  overflow: 'hidden',
                  fontFamily: 'inherit',
                  outline: 'none',
                  '&:focus-visible': {
                    outline: `2px solid ${action.color}`,
                    outlineOffset: 2,
                  },
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: `linear-gradient(135deg, ${action.color}15 0%, ${action.color}05 100%)`,
                    opacity: 0,
                    transition: 'opacity 0.3s ease',
                  },
                  '&:hover': {
                    borderColor: action.color,
                    backgroundColor: `${action.color}08`,
                    transform: 'translateY(-4px)',
                    boxShadow: `0 8px 24px ${action.color}25`,
                    '&::before': {
                      opacity: 1,
                    },
                    '& .action-icon': {
                      transform: 'scale(1.15) rotate(5deg)',
                    },
                    '& .action-description': {
                      opacity: 1,
                      transform: 'translateY(0)',
                      maxHeight: '50px',
                    },
                    '& .action-title': {
                      transform: 'translateY(-6px)',
                    },
                  },
                }}
              >
                <Box
                  className="action-icon"
                  sx={{
                    transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    fontSize: '1.5rem',
                    color: action.color,
                    mb: 0.5,
                  }}
                >
                  <FontAwesomeIcon icon={action.icon} />
                </Box>
                
                <Typography
                  className="action-title"
                  variant="subtitle2"
                  sx={{
                    fontWeight: 600,
                    fontSize: '0.875rem',
                    transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    color: action.color,
                    textAlign: 'center',
                    lineHeight: 1.3,
                    width: '100%',
                    wordBreak: 'break-word',
                    px: 0.5,
                  }}
                >
                  {action.title}
                </Typography>
                
                <Typography
                  className="action-description"
                  variant="body2"
                  sx={{
                    color: 'text.secondary',
                    textAlign: 'center',
                    fontSize: '0.75rem',
                    lineHeight: 1.4,
                    opacity: 0,
                    maxHeight: 0,
                    overflow: 'hidden',
                    transform: 'translateY(-10px)',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    fontWeight: 400,
                    px: 1,
                  }}
                >
                  {action.description}
                </Typography>
              </Box>
            </Grid>
          ))}
        </Grid>
      </CardContent>
    </Card>
  );
};

export default EMSQuickActions;
