import React, { useState, useEffect } from 'react';
import {
  Box,
  List,
  CircularProgress,
  Alert,
  Pagination,
  Button,
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

interface NotificationListProps {
  filters: NotificationFilter;
  onNotificationChange?: () => void;
}

const NotificationList: React.FC<NotificationListProps> = ({ filters, onNotificationChange }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retrying, setRetrying] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });

  useEffect(() => {
    loadNotifications();
  }, [filters]);

  const loadNotifications = async () => {
    const requestFilters = {
      ...filters,
      page: pagination.page.toString(),
      limit: pagination.limit.toString(),
    };
    
    try {
      setLoading(true);
      setError(null);
      
      console.log('Loading notifications with filters:', requestFilters);
      console.log('Filter object keys and values:', Object.entries(requestFilters));
      
      const data = await notificationService.getNotifications(requestFilters);
      console.log('Received notifications:', data.notifications.length);
      console.log('Full response:', data);
      console.log('API call successful for filters:', requestFilters);
      
      setNotifications(data.notifications);
      setPagination(data.pagination);
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
      setLoading(false);
      setRetrying(false);
    }
  };

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
      
      // Dispatch custom event to notify sidebar
      window.dispatchEvent(new CustomEvent('notificationRead', { 
        detail: { notificationId, count: result.count } 
      }));
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
      
      // Dispatch custom event to notify sidebar
      window.dispatchEvent(new CustomEvent('notificationDeleted', { 
        detail: { notificationId, count: result.count } 
      }));
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

  if (notifications.length === 0) {
    return (
      <EmptyState
        icon={<FontAwesomeIcon icon={faBell} size="2x" />}
        title="No Notifications"
        description="You're all caught up! No new alerts or notifications at this time."
        size="small"
      />
    );
  }

  return (
    <Box>
      <List sx={{ p: 0 }}>
        {notifications.map((notification) => (
          <NotificationItemWithReplies
            key={notification.id}
            notification={notification}
            onMarkAsRead={handleMarkAsRead}
            onDelete={handleDeleteNotification}
          />
        ))}
      </List>

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
