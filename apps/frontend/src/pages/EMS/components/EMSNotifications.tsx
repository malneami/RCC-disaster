import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  List,
  Collapse,
  Alert,
  AlertTitle,
  Typography,
} from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBell } from '@fortawesome/free-solid-svg-icons';

import { useWebSocket } from '../../../hooks/useWebSocket';
import NotificationHeader from './NotificationHeader';
import NotificationItem from './NotificationItem';
import GenericPageHeader from '../../../components/Common/GenericPageHeader';
import EmptyState from '../../../components/Common/EmptyState';

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

const EMSNotifications: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [expanded, setExpanded] = useState(true);
  const { socket, isConnected } = useWebSocket();

  // Sample notifications - in real implementation, these would come from the API
  useEffect(() => {
    const sampleNotifications: Notification[] = [
      {
        id: '1',
        type: 'ALERT',
        title: 'Low Fuel Alert',
        message: 'Ambulance Alpha-1 has less than 20% fuel remaining',
        timestamp: new Date(Date.now() - 5 * 60 * 1000),
        ambulanceId: 'amb-1',
        priority: 'HIGH',
        acknowledged: false,
      },
      {
        id: '2',
        type: 'INFO',
        title: 'Assignment Completed',
        message: 'Assignment #12345 has been completed successfully',
        timestamp: new Date(Date.now() - 15 * 60 * 1000),
        assignmentId: 'assign-1',
        priority: 'LOW',
        acknowledged: true,
      },
      {
        id: '3',
        type: 'WARNING',
        title: 'Maintenance Due',
        message: 'Ambulance Bravo-2 requires scheduled maintenance',
        timestamp: new Date(Date.now() - 30 * 60 * 1000),
        ambulanceId: 'amb-2',
        priority: 'MEDIUM',
        acknowledged: false,
      },
      {
        id: '4',
        type: 'ALERT',
        title: 'Speed Violation',
        message: 'Ambulance Charlie-3 exceeded speed limit by 15 km/h',
        timestamp: new Date(Date.now() - 45 * 60 * 1000),
        ambulanceId: 'amb-3',
        priority: 'CRITICAL',
        acknowledged: false,
      },
    ];

    setNotifications(sampleNotifications);
  }, []);

  // WebSocket connection for real-time notifications
  useEffect(() => {
    if (socket && isConnected) {
      socket.on('ems-notification', (notification: any) => {
        setNotifications(prev => [notification, ...prev]);
      });

      socket.on('ambulance-alert', (alert: any) => {
        const notification: Notification = {
          id: `alert-${Date.now()}`,
          type: 'ALERT',
          title: alert.title,
          message: alert.message,
          timestamp: new Date(),
          ambulanceId: alert.ambulanceId,
          priority: alert.priority || 'MEDIUM',
          acknowledged: false,
        };
        setNotifications(prev => [notification, ...prev]);
      });

      return () => {
        socket.off('ems-notification');
        socket.off('ambulance-alert');
      };
    }
  }, [socket, isConnected]);

  const handleAcknowledge = (id: string) => {
    setNotifications(prev =>
      prev.map(notification =>
        notification.id === id
          ? { ...notification, acknowledged: true }
          : notification
      )
    );
  };

  const handleDismiss = (id: string) => {
    setNotifications(prev =>
      prev.filter(notification => notification.id !== id)
    );
  };

  const unreadCount = notifications.filter(n => !n.acknowledged).length;
  const criticalAlerts = notifications.filter(n => n.priority === 'CRITICAL' && !n.acknowledged);

  return (
    <Box>
      <GenericPageHeader
        title="EMS Notifications"
        subtitle="Real-time alerts and notifications"
        actions={[]}
      />

      {/* Critical Alerts */}
      {criticalAlerts.length > 0 && (
        <Alert severity="error" sx={{ mt: 2 }}>
          <AlertTitle>Critical Alerts</AlertTitle>
          {criticalAlerts.map(alert => (
            <Typography key={alert.id} variant="body2">
              • {alert.title}: {alert.message}
            </Typography>
          ))}
        </Alert>
      )}

      {/* Notifications Panel */}
      <Card sx={{ mt: 2 }}>
        <NotificationHeader
          unreadCount={unreadCount}
          expanded={expanded}
          onToggleExpanded={() => setExpanded(!expanded)}
        />
        
        <Collapse in={expanded}>
          <CardContent sx={{ p: 0 }}>
            {notifications.length === 0 ? (
              <EmptyState
                icon={<FontAwesomeIcon icon={faBell} size="2x" />}
                title="No Notifications"
                description="You're all caught up! No new alerts or notifications at this time."
                size="small"
              />
            ) : (
              <List sx={{ p: 0 }}>
                {notifications.map((notification) => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    onAcknowledge={handleAcknowledge}
                    onDismiss={handleDismiss}
                  />
                ))}
              </List>
            )}
          </CardContent>
        </Collapse>
      </Card>
    </Box>
  );
};

export default EMSNotifications;