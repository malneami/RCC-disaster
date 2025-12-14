import React from 'react';
import { Box, Card, CardContent, Typography, List, ListItem, ListItemIcon, ListItemText, Chip, Alert } from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faExclamationTriangle,
  faInfoCircle,
  faCheckCircle,
  faTimesCircle,
  faBell,
} from '@fortawesome/free-solid-svg-icons';

interface Alert {
  id: string;
  type: 'error' | 'warning' | 'info' | 'success';
  title: string;
  message: string;
  timestamp: Date;
  priority: 'high' | 'medium' | 'low';
}

interface EMSAlertsPanelProps {
  alerts?: Alert[];
  onAlertClick?: (alert: Alert) => void;
}

const EMSAlertsPanel: React.FC<EMSAlertsPanelProps> = ({ alerts = [], onAlertClick }) => {
  const getAlertIcon = (type: Alert['type']) => {
    switch (type) {
      case 'error':
        return <FontAwesomeIcon icon={faTimesCircle} color="#d32f2f" />;
      case 'warning':
        return <FontAwesomeIcon icon={faExclamationTriangle} color="#ed6c02" />;
      case 'info':
        return <FontAwesomeIcon icon={faInfoCircle} color="#1976d2" />;
      case 'success':
        return <FontAwesomeIcon icon={faCheckCircle} color="#2e7d32" />;
      default:
        return <FontAwesomeIcon icon={faInfoCircle} color="#1976d2" />;
    }
  };

  const getPriorityColor = (priority: Alert['priority']) => {
    switch (priority) {
      case 'high':
        return 'error';
      case 'medium':
        return 'warning';
      case 'low':
        return 'info';
      default:
        return 'default';
    }
  };

  if (alerts.length === 0) {
    return (
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <FontAwesomeIcon icon={faBell} />
            System Alerts
          </Typography>

          <Alert severity="success" sx={{ mt: 2 }}>
            All systems operational. No alerts at this time.
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <FontAwesomeIcon icon={faBell} />
          System Alerts ({alerts.length})
        </Typography>

        <List sx={{ maxHeight: 300, overflow: 'auto' }}>
          {alerts.map((alert) => (
            <ListItem
              key={alert.id}
              button
              onClick={() => onAlertClick?.(alert)}
              sx={{
                borderLeft: `4px solid ${alert.type === 'error' ? '#d32f2f' :
                    alert.type === 'warning' ? '#ed6c02' :
                      alert.type === 'info' ? '#1976d2' : '#2e7d32'
                  }`,
                mb: 1,
                borderRadius: 1,
                '&:hover': {
                  backgroundColor: 'action.hover',
                },
              }}
            >
              <ListItemIcon>
                {getAlertIcon(alert.type)}
              </ListItemIcon>
              <ListItemText
                primary={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                      {alert.title}
                    </Typography>
                    <Chip
                      label={alert.priority}
                      size="small"
                      color={getPriorityColor(alert.priority)}
                      variant="outlined"
                    />
                  </Box>
                }
                secondary={
                  <React.Fragment>
                    <Typography
                      component="span"
                      variant="body2"
                      color="text.secondary"
                      display="block"
                    >
                      {alert.message}
                    </Typography>
                    <Typography
                      component="span"
                      variant="caption"
                      color="text.secondary"
                    >
                      {alert.timestamp.toLocaleString()}
                    </Typography>
                  </React.Fragment>
                }
              />
            </ListItem>
          ))}
        </List>
      </CardContent>
    </Card>
  );
};

export default EMSAlertsPanel;
