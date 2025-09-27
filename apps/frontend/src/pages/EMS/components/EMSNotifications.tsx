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
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'error'>('disconnected');
  const { socket, isConnected, connectionError } = useWebSocket('notifications');

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
      setConnectionStatus('connected');
      
      socket.on('case-note-created', (data: any) => {
        try {
          const notification: Notification = {
            id: data.caseNote.id,
            type: 'INFO',
            title: `Case Note Added - ${data.caseNote.patientName}`,
            message: data.caseNote.content.substring(0, 100) + (data.caseNote.content.length > 100 ? '...' : ''),
            timestamp: new Date(data.caseNote.createdAt),
            priority: data.caseNote.priority || 'MEDIUM',
            acknowledged: false,
          };
          setNotifications(prev => [notification, ...prev]);
        } catch (error) {
          console.error('Error processing case note notification:', error);
        }
      });

      socket.on('notification-created', (data: any) => {
        try {
          const notification: Notification = {
            id: data.notification.id,
            type: 'INFO',
            title: data.notification.title,
            message: data.notification.message,
            timestamp: new Date(data.notification.createdAt),
            priority: data.notification.priority || 'MEDIUM',
            acknowledged: false,
          };
          setNotifications(prev => [notification, ...prev]);
        } catch (error) {
          console.error('Error processing notification:', error);
        }
      });

      socket.on('connect_error', (error) => {
        console.error('WebSocket connection error:', error);
        setConnectionStatus('error');
      });

      socket.on('disconnect', (reason) => {
        console.warn('WebSocket disconnected:', reason);
        setConnectionStatus('disconnected');
      });

      return () => {
        socket.off('case-note-created');
        socket.off('notification-created');
        socket.off('connect_error');
        socket.off('disconnect');
      };
    } else if (connectionError) {
      setConnectionStatus('error');
    } else {
      setConnectionStatus('disconnected');
    }
  }, [socket, isConnected, connectionError]);

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

      {/* Connection Status */}
      {connectionStatus === 'error' && (
        <Alert severity="warning" sx={{ mt: 2 }}>
          <AlertTitle>Connection Issue</AlertTitle>
          <Typography variant="body2">
            Unable to connect to real-time notifications. You may not receive live updates.
            {connectionError && ` Error: ${connectionError}`}
          </Typography>
        </Alert>
      )}

      {connectionStatus === 'disconnected' && (
        <Alert severity="info" sx={{ mt: 2 }}>
          <AlertTitle>Connecting...</AlertTitle>
          <Typography variant="body2">
            Establishing connection to real-time notifications...
          </Typography>
        </Alert>
      )}

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
      <Card sx={{ mt: 3, borderRadius: 2, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
        <NotificationHeader
          unreadCount={unreadCount}
          expanded={expanded}
          onToggleExpanded={() => setExpanded(!expanded)}
        />
        
        <Collapse in={expanded}>
          <CardContent sx={{ p: 0, pt: 2 }}>
            {notifications.length === 0 ? (
              <EmptyState
                icon={<FontAwesomeIcon icon={faBell} size="2x" />}
                title="No Notifications"
                description="You're all caught up! No new alerts or notifications at this time."
                size="small"
              />
            ) : (
              <List sx={{ p: 2 }}>
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