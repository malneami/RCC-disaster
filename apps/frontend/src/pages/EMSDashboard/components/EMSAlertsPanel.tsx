import React from 'react';
import { Box, Typography, List, ListItem, ListItemIcon, ListItemText, Chip, Alert as MuiAlert } from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faExclamationTriangle, faInfoCircle, faCheckCircle, faTimesCircle, faBell } from '@fortawesome/free-solid-svg-icons';

// Vibrant Solid Colors
const COLORS = {
  skyBlue: '#0EA5E9',
  emerald: '#10B981',
  amber: '#F59E0B',
  rose: '#F43F5E',
};

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

const alertStyles = {
  error: { bg: '#FEE2E2', color: COLORS.rose },
  warning: { bg: '#FEF3C7', color: COLORS.amber },
  info: { bg: '#E0F2FE', color: COLORS.skyBlue },
  success: { bg: '#D1FAE5', color: COLORS.emerald },
};

const EMSAlertsPanel: React.FC<EMSAlertsPanelProps> = ({ alerts = [], onAlertClick }) => {
  const getIcon = (type: Alert['type']) => {
    const icons = { error: faTimesCircle, warning: faExclamationTriangle, info: faInfoCircle, success: faCheckCircle };
    return <FontAwesomeIcon icon={icons[type]} color={alertStyles[type].color} />;
  };

  if (alerts.length === 0) {
    return (
      <Box sx={{ bgcolor: '#fff', borderRadius: 4, p: 4, boxShadow: '0 4px 16px rgba(0,0,0,0.06)' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
          <Box sx={{ width: 44, height: 44, borderRadius: 3, bgcolor: COLORS.amber, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', boxShadow: `0 6px 20px ${COLORS.amber}40` }}>
            <FontAwesomeIcon icon={faBell} />
          </Box>
          <Typography sx={{ fontSize: '1.35rem', fontWeight: 800, color: '#0F172A' }}>System Alerts</Typography>
        </Box>
        <MuiAlert severity="success" sx={{ borderRadius: 3, bgcolor: '#D1FAE5' }}>All systems operational. No alerts.</MuiAlert>
      </Box>
    );
  }

  return (
    <Box sx={{ bgcolor: '#fff', borderRadius: 4, p: 4, boxShadow: '0 4px 16px rgba(0,0,0,0.06)' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <Box sx={{ width: 44, height: 44, borderRadius: 3, bgcolor: COLORS.amber, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', boxShadow: `0 6px 20px ${COLORS.amber}40` }}>
          <FontAwesomeIcon icon={faBell} />
        </Box>
        <Typography sx={{ fontSize: '1.35rem', fontWeight: 800, color: '#0F172A' }}>System Alerts ({alerts.length})</Typography>
      </Box>

      <List sx={{ maxHeight: 280, overflow: 'auto' }}>
        {alerts.map((alert) => {
          const style = alertStyles[alert.type];
          return (
            <ListItem key={alert.id} component="div" onClick={() => onAlertClick?.(alert)} sx={{ bgcolor: style.bg, borderLeft: `4px solid ${style.color}`, mb: 2, borderRadius: 3, cursor: 'pointer', transition: 'all 0.2s', '&:hover': { transform: 'translateX(4px)' } }}>
              <ListItemIcon sx={{ minWidth: 44 }}>
                <Box sx={{ width: 36, height: 36, borderRadius: 2, bgcolor: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{getIcon(alert.type)}</Box>
              </ListItemIcon>
              <ListItemText
                primary={<Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}><Typography sx={{ fontSize: '0.9rem', fontWeight: 700, color: '#0F172A' }}>{alert.title}</Typography><Chip label={alert.priority} size="small" sx={{ height: 22, fontSize: '0.65rem', fontWeight: 700, bgcolor: style.color, color: '#fff' }} /></Box>}
                secondary={<><Typography sx={{ fontSize: '0.8rem', color: '#475569', mt: 0.5 }}>{alert.message}</Typography><Typography sx={{ fontSize: '0.7rem', color: '#94A3B8', mt: 0.5 }}>{alert.timestamp.toLocaleString()}</Typography></>}
              />
            </ListItem>
          );
        })}
      </List>
    </Box>
  );
};

export default EMSAlertsPanel;
