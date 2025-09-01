import React from 'react';
import { Box, Typography, Alert, Chip, List, ListItem, ListItemText, ListItemIcon, Divider } from '@mui/material';
import {
  Warning as WarningIcon,
  Error as ErrorIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';

export interface AlertItem {
  id: string;
  title: string;
  message: string;
  type: 'CRITICAL' | 'WARNING' | 'INFO' | 'SUCCESS';
  metadata?: Record<string, any>;
  timestamp?: Date;
}

export interface AlertDisplayProps {
  alerts: AlertItem[];
  title?: string;
  showCount?: boolean;
  variant?: 'list' | 'cards' | 'compact';
  maxHeight?: number | string;
  emptyMessage?: string;
  emptyIcon?: React.ReactNode;
  sx?: any;
}

const AlertDisplay: React.FC<AlertDisplayProps> = ({
  alerts,
  title,
  showCount = true,
  variant = 'list',
  maxHeight,
  emptyMessage = 'No alerts at this time.',
  emptyIcon = <CheckCircleIcon color="success" />,
  sx = {},
}) => {
  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'CRITICAL':
        return <ErrorIcon color="error" />;
      case 'WARNING':
        return <WarningIcon color="warning" />;
      case 'SUCCESS':
        return <CheckCircleIcon color="success" />;
      default:
        return <CheckCircleIcon color="info" />;
    }
  };

  const getAlertColor = (type: string) => {
    switch (type) {
      case 'CRITICAL':
        return 'error';
      case 'WARNING':
        return 'warning';
      case 'SUCCESS':
        return 'success';
      default:
        return 'info';
    }
  };

  const getAlertSeverity = (type: string) => {
    switch (type) {
      case 'CRITICAL':
        return 'error';
      case 'WARNING':
        return 'warning';
      case 'SUCCESS':
        return 'success';
      default:
        return 'info';
    }
  };

  const groupedAlerts = alerts.reduce((acc, alert) => {
    if (!acc[alert.type]) {
      acc[alert.type] = [];
    }
    acc[alert.type].push(alert);
    return acc;
  }, {} as Record<string, AlertItem[]>);

  const alertTypes = ['CRITICAL', 'WARNING', 'INFO', 'SUCCESS'];

  if (variant === 'cards') {
    return (
      <Box sx={sx}>
        {title && (
          <Typography variant="h6" mb={2}>
            {title} {showCount && `(${alerts.length})`}
          </Typography>
        )}
        
        {alerts.length === 0 ? (
          <Box textAlign="center" py={4}>
            {React.cloneElement(emptyIcon as React.ReactElement, { 
              sx: { fontSize: 64, mb: 2 } 
            })}
            <Typography variant="h6" color="success.main" gutterBottom>
              No Alerts
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {emptyMessage}
            </Typography>
          </Box>
        ) : (
          <Box sx={{ maxHeight, overflow: 'auto' }}>
            {alertTypes.map(type => {
              const typeAlerts = groupedAlerts[type];
              if (!typeAlerts || typeAlerts.length === 0) return null;

              return (
                <Box key={type} mb={3}>
                  <Typography variant="subtitle1" color={`${getAlertColor(type)}.main`} mb={1}>
                    {type} Alerts ({typeAlerts.length})
                  </Typography>
                  {typeAlerts.map((alert) => (
                    <Alert 
                      key={alert.id} 
                      severity={getAlertSeverity(alert.type)} 
                      sx={{ mb: 1 }}
                    >
                      <Typography variant="subtitle2" gutterBottom>
                        {alert.title}
                      </Typography>
                      <Typography variant="body2">
                        {alert.message}
                      </Typography>
                      {alert.metadata && (
                        <Box mt={1}>
                          {Object.entries(alert.metadata).map(([key, value]) => (
                            <Chip 
                              key={key}
                              label={`${key}: ${value}`}
                              size="small"
                              sx={{ mr: 1, mb: 1 }}
                            />
                          ))}
                        </Box>
                      )}
                    </Alert>
                  ))}
                </Box>
              );
            })}
          </Box>
        )}
      </Box>
    );
  }

  if (variant === 'compact') {
    return (
      <Box sx={sx}>
        {title && (
          <Typography variant="h6" mb={2}>
            {title} {showCount && `(${alerts.length})`}
          </Typography>
        )}
        
        {alerts.length === 0 ? (
          <Alert severity="success">
            {emptyMessage}
          </Alert>
        ) : (
          <Box sx={{ maxHeight, overflow: 'auto' }}>
            {alerts.map((alert) => (
              <Alert 
                key={alert.id} 
                severity={getAlertSeverity(alert.type)} 
                sx={{ mb: 1 }}
              >
                {alert.title}: {alert.message}
              </Alert>
            ))}
          </Box>
        )}
      </Box>
    );
  }

  // Default list variant
  return (
    <Box sx={sx}>
      {title && (
        <Typography variant="h6" mb={2}>
          {title} {showCount && `(${alerts.length})`}
        </Typography>
      )}
      
      {alerts.length === 0 ? (
        <Alert severity="success">
          {emptyMessage}
        </Alert>
      ) : (
        <Box sx={{ maxHeight, overflow: 'auto' }}>
          <List>
            {alerts.map((alert, index) => (
              <React.Fragment key={alert.id}>
                <ListItem>
                  <ListItemIcon>
                    {getAlertIcon(alert.type)}
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Typography variant="subtitle1">
                          {alert.title}
                        </Typography>
                        <Chip
                          label={alert.type}
                          color={getAlertColor(alert.type) as any}
                          size="small"
                        />
                      </Box>
                    }
                    secondary={
                      <Box mt={1}>
                        <Typography variant="body2" color="text.secondary">
                          {alert.message}
                        </Typography>
                        {alert.metadata && (
                          <Box mt={1}>
                            {Object.entries(alert.metadata).map(([key, value]) => (
                              <Chip 
                                key={key}
                                label={`${key}: ${value}`}
                                size="small"
                                sx={{ mr: 1, mb: 1 }}
                              />
                            ))}
                          </Box>
                        )}
                        {alert.timestamp && (
                          <Typography variant="caption" color="text.secondary">
                            {alert.timestamp.toLocaleString()}
                          </Typography>
                        )}
                      </Box>
                    }
                  />
                </ListItem>
                {index < alerts.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        </Box>
      )}
    </Box>
  );
};

export default AlertDisplay;
