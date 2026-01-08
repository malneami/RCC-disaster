import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box,
  CircularProgress,
  Alert,
  Pagination,
  Button,
  Chip,
  Stack,
  alpha,
  useTheme,
} from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faBell,
  faRefresh,
} from '@fortawesome/free-solid-svg-icons';

import EmptyState from '../../../components/Common/EmptyState';
import SkeletonLoader from '../../../components/Common/SkeletonLoader';
import { notificationService, Notification, NotificationFilter, ApiError } from '../../../services/notificationService';
import NotificationItemWithReplies from './NotificationItemWithReplies';
import { useNotificationSocket } from '../../../contexts/NotificationSocketContext';

interface NotificationListProps {
  filters: NotificationFilter;
  onNotificationChange?: () => void;
  onNotificationsLoaded?: (notifications: Notification[]) => void;
}

const NotificationList: React.FC<NotificationListProps> = ({ filters, onNotificationChange, onNotificationsLoaded }) => {
  // Get socket connection from context
  const { socket, isConnected } = useNotificationSocket();
  const theme = useTheme();

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retrying, setRetrying] = useState(false);
  const [selectedPriority, setSelectedPriority] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });

  const loadNotifications = useCallback(async (silent: boolean = false) => {
    // Clean up filters - remove undefined values
    const cleanFilters: NotificationFilter = {};
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        cleanFilters[key as keyof NotificationFilter] = value;
      }
    });
    
    const requestFilters: NotificationFilter = {
      ...cleanFilters,
      page: pagination.page.toString(),
      limit: pagination.limit.toString(),
    };
        
    try {
      if (!silent) {
        setLoading(true);
      }
      setError(null);
      
      const data = await notificationService.getNotifications(requestFilters);
      setNotifications(data.notifications);
      setPagination(data.pagination);
      
      // Notify parent of loaded notifications for case type counts
      if (onNotificationsLoaded) {
        onNotificationsLoaded(data.notifications);
      }
    } catch (err: any) {
      console.error('Error loading notifications:', err);
      
      // Handle enhanced error types
      const apiError = err as ApiError;
      
      if (apiError.status === 404) {
        // No notifications found - show empty state instead of error
        setNotifications([]);
        setPagination({ page: 1, limit: 20, total: 0, totalPages: 0 });
        setError(null);
        return;
      } else if (apiError.status === 401) {
        setError('Authentication required. Please log in again.');
      } else if (apiError.code === 'NETWORK_ERROR') {
        setError('Network error. Please check your connection and try again.');
      } else {
        setError(apiError.message || 'Failed to load notifications. Please try again.');
      }
    } finally {
      if (!silent) {
        setLoading(false);
      }
      setRetrying(false);
    }
  }, [filters, pagination.page, pagination.limit]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setPagination(prev => {
      if (prev.page === 1) {
        return prev; // No change needed
      }
      return { ...prev, page: 1 };
    });
  }, [filters]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  // Set up polling interval (silent refresh)
  useEffect(() => {
    const interval = setInterval(() => loadNotifications(true), 30000);
    return () => {
      clearInterval(interval);
    };
  }, [loadNotifications]);

  // Listen to socket events using context hook
  useEffect(() => {
    if (!socket || !isConnected) {
      return;
    }

    const handleNotificationCreated = () => {
      loadNotifications(true);
    };

    const handleNotificationRead = () => {
      loadNotifications(true);
    };

    const handleNotificationDeleted = () => {
      loadNotifications(true);
    };

    socket.on('notification-created', handleNotificationCreated);
    socket.on('notification-read', handleNotificationRead);
    socket.on('notification-deleted', handleNotificationDeleted);

    return () => {
      socket.off('notification-created', handleNotificationCreated);
      socket.off('notification-read', handleNotificationRead);
      socket.off('notification-deleted', handleNotificationDeleted);
    };
  }, [socket, isConnected, loadNotifications]);

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      console.log('Marking notification as read:', notificationId);
      const result = await notificationService.markNotificationsAsRead([notificationId]);
      console.log('Mark as read result:', result);
      
      setNotifications(prev =>
        prev.map(notification =>
          notification.id === notificationId
            ? { ...notification, isRead: true, readAt: new Date().toISOString() }
            : notification
        )
      );
      // Trigger refresh of summary cards
      if (onNotificationChange) {
        onNotificationChange();
      }
    } catch (err) {
      console.error('Error marking notification as read:', err);
      // Revert the optimistic update
      setNotifications(prev =>
        prev.map(notification =>
          notification.id === notificationId
            ? { ...notification, isRead: false, readAt: undefined }
            : notification
        )
      );
    }
  };

  const handleDeleteNotification = async (notificationId: string) => {
    try {
      console.log('Deleting notification:', notificationId);
      const result = await notificationService.deleteNotification(notificationId);
      console.log('Delete result:', result);
      
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      // Trigger refresh of summary cards
      if (onNotificationChange) {
        onNotificationChange();
      }
    } catch (err) {
      console.error('Error deleting notification:', err);
    }
  };

  const handlePageChange = (_event: React.ChangeEvent<unknown>, page: number) => {
    setPagination(prev => ({ ...prev, page }));
  };


  const handleRetry = () => {
    setRetrying(true);
    setError(null);
    loadNotifications();
  };
  const filteredNotifications = useMemo(() => {
    if (!selectedPriority) {
      return notifications;
    }
    return notifications.filter(n => n.priority === selectedPriority);
  }, [notifications, selectedPriority]);

  const getPriorityConfig = (priority: string) => {
    switch (priority) {
      case 'HIGH':
        return {
          label: 'High',
          color: '#ea580c',
          bgColor: alpha('#ea580c', 0.1),
          borderColor: alpha('#ea580c', 0.3),
        };
      case 'MEDIUM':
        return {
          label: 'Medium',
          color: '#f59e0b',
          bgColor: alpha('#f59e0b', 0.1),
          borderColor: alpha('#f59e0b', 0.3),
        };
      case 'LOW':
        return {
          label: 'Low',
          color: '#10b981',
          bgColor: alpha('#10b981', 0.1),
          borderColor: alpha('#10b981', 0.3),
        };
      default:
        return {
          label: priority,
          color: '#6b7280',
          bgColor: alpha('#6b7280', 0.1),
          borderColor: alpha('#6b7280', 0.3),
        };
    }
  };

  if (loading) {
    return <SkeletonLoader variant="notification" count={5} />;
  }

  if (error) {
    return (
      <Alert 
        severity="error" 
        action={
          <Button 
            color="inherit" 
            size="small" 
            onClick={handleRetry}
            disabled={retrying}
            startIcon={retrying ? <CircularProgress size={16} /> : <FontAwesomeIcon icon={faRefresh} />}
          >
            {retrying ? 'Retrying...' : 'Retry'}
          </Button>
        }
      >
        {error}
      </Alert>
    );
  }

  return (
    <Box>
      {notifications.length > 0 && (
        <Stack 
          direction="row" 
          spacing={1.5} 
          sx={{ 
            mb: 3,
            flexWrap: 'wrap',
            gap: 1,
          }}
        >
          <Chip
            label="All"
            onClick={() => setSelectedPriority(null)}
            variant={selectedPriority === null ? 'filled' : 'outlined'}
            sx={{
              backgroundColor: selectedPriority === null 
                ? alpha(theme.palette.primary.main, 0.1) 
                : 'transparent',
              borderColor: selectedPriority === null 
                ? theme.palette.primary.main 
                : theme.palette.divider,
              color: selectedPriority === null 
                ? theme.palette.primary.main 
                : theme.palette.text.secondary,
              fontWeight: selectedPriority === null ? 600 : 400,
              '&:hover': {
                backgroundColor: alpha(theme.palette.primary.main, 0.08),
              },
            }}
          />
          {['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map((priority) => {
            const config = getPriorityConfig(priority);
            const isSelected = selectedPriority === priority;
            
            return (
              <Chip
                key={priority}
                label={config.label}
                onClick={() => setSelectedPriority(isSelected ? null : priority)}
                variant={isSelected ? 'filled' : 'outlined'}
                sx={{
                  backgroundColor: isSelected ? config.color : 'transparent',
                  borderColor: isSelected ? config.color : config.borderColor,
                  color: isSelected ? '#ffffff' : config.color,
                  fontWeight: isSelected ? 600 : 400,
                  '&:hover': {
                    backgroundColor: isSelected 
                      ? config.color 
                      : config.bgColor,
                    borderColor: config.color,
                  },
                }}
              />
            );
          })}
        </Stack>
      )}

      {filteredNotifications.length === 0 ? (
        <EmptyState
          icon={<FontAwesomeIcon icon={faBell} size="2x" />}
          title={selectedPriority ? `No ${getPriorityConfig(selectedPriority).label} Priority Notifications` : "No Notifications"}
          description={selectedPriority 
            ? `No ${getPriorityConfig(selectedPriority).label.toLowerCase()} priority notifications found. Try selecting a different priority or "All".`
            : "You're all caught up! No new alerts or notifications at this time."}
          size="small"
        />
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {filteredNotifications.map((notification) => (
            <NotificationItemWithReplies
              key={notification.id}
              notification={notification}
              onMarkAsRead={handleMarkAsRead}
              onDelete={handleDeleteNotification}
            />
          ))}
        </Box>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          mt: 3,
          pt: 2,
          borderTop: '1px solid #e2e8f0'
        }}>
          <Pagination
            count={pagination.totalPages}
            page={pagination.page}
            onChange={handlePageChange}
            color="primary"
            size="small"
            sx={{
              '& .MuiPaginationItem-root': {
                fontSize: '0.875rem'
              }
            }}
          />
        </Box>
      )}
    </Box>
  );
};

export default NotificationList;
