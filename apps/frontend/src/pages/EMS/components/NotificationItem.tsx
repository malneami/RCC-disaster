import React from 'react';
import {
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
  IconButton,
  Box,
  Typography,
} from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faExclamationTriangle, 
  faInfoCircle, 
  faCheckCircle,
  faTimes,
  faAmbulance,
  faClock
} from '@fortawesome/free-solid-svg-icons';

interface Notification {
  id: string;
  type: 'ALERT' | 'INFO' | 'SUCCESS' | 'WARNING';
  title: string;
  message: string;
  timestamp: Date;
  ambulanceId?: string;
  assignmentId?: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  acknowledged: boolean;
}

interface NotificationItemProps {
  notification: Notification;
  onAcknowledge: (id: string) => void;
  onDismiss: (id: string) => void;
}

const NotificationItem: React.FC<NotificationItemProps> = ({
  notification,
  onAcknowledge,
  onDismiss,
}) => {
  const getIcon = (type: string) => {
    switch (type) {
      case 'ALERT':
        return faExclamationTriangle;
      case 'INFO':
        return faInfoCircle;
      case 'SUCCESS':
        return faCheckCircle;
      case 'WARNING':
        return faExclamationTriangle;
      default:
        return faInfoCircle;
    }
  };

  const getIconColor = (type: string, priority: string) => {
    if (type === 'ALERT' || priority === 'CRITICAL') return '#f44336';
    if (type === 'WARNING' || priority === 'HIGH') return '#ff9800';
    if (type === 'SUCCESS') return '#4caf50';
    return '#2196f3';
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'CRITICAL': return 'error';
      case 'HIGH': return 'warning';
      case 'MEDIUM': return 'info';
      case 'LOW': return 'default';
      default: return 'default';
    }
  };

  const getContextIcon = (ambulanceId?: string, assignmentId?: string) => {
    if (ambulanceId) return faAmbulance;
    if (assignmentId) return faClock;
    return null;
  };

  const contextIcon = getContextIcon(notification.ambulanceId, notification.assignmentId);

  return (
    <ListItem
      sx={{
        borderLeft: `4px solid ${getIconColor(notification.type, notification.priority)}`,
        backgroundColor: notification.acknowledged ? '#f5f5f5' : 'white',
        mb: 2,
        borderRadius: 2,
        p: 2,
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        transition: 'all 0.2s ease-in-out',
        '&:hover': {
          boxShadow: '0 4px 8px rgba(0,0,0,0.15)',
          transform: 'translateY(-1px)',
        },
      }}
    >
      <ListItemIcon>
        <FontAwesomeIcon 
          icon={getIcon(notification.type)} 
          color={getIconColor(notification.type, notification.priority)}
        />
      </ListItemIcon>
      <ListItemText
        primary={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: '#333' }}>
              {notification.title}
            </Typography>
            <Chip
              label={notification.priority}
              color={getPriorityColor(notification.priority) as any}
              size="small"
              sx={{ fontWeight: 'medium' }}
            />
            {contextIcon && (
              <FontAwesomeIcon 
                icon={contextIcon} 
                size="sm" 
                color="#666"
              />
            )}
          </Box>
        }
        secondary={
          <Box sx={{ mt: 1 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1, lineHeight: 1.5 }}>
              {notification.message}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 'medium' }}>
              {notification.timestamp.toLocaleString()}
            </Typography>
          </Box>
        }
      />
      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
        {!notification.acknowledged && (
          <IconButton
            size="small"
            onClick={() => onAcknowledge(notification.id)}
            color="primary"
            title="Acknowledge"
            sx={{ 
              '&:hover': { 
                backgroundColor: 'primary.light',
                color: 'white'
              }
            }}
          >
            <FontAwesomeIcon icon={faCheckCircle} />
          </IconButton>
        )}
        <IconButton
          size="small"
          onClick={() => onDismiss(notification.id)}
          color="error"
          title="Dismiss"
          sx={{ 
            '&:hover': { 
              backgroundColor: 'error.light',
              color: 'white'
            }
          }}
        >
          <FontAwesomeIcon icon={faTimes} />
        </IconButton>
      </Box>
    </ListItem>
  );
};

export default NotificationItem;
