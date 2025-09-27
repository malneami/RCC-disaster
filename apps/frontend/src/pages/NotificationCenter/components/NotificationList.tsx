import React, { useState, useEffect } from 'react';
import {
  Box,
  List,
  ListItem,
  Chip,
  IconButton,
  Typography,
  CircularProgress,
  Alert,
  Pagination,
  Button,
} from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCheck,
  faTrash,
  faComment,
  faExclamationTriangle,
  faInfoCircle,
  faCheckCircle,
  faArrowUp,
  faBell,
  faRefresh,
} from '@fortawesome/free-solid-svg-icons';

import EmptyState from '../../../components/Common/EmptyState';
import SkeletonLoader from '../../../components/Common/SkeletonLoader';
import { notificationService, Notification, NotificationFilter, ApiError } from '../../../services/notificationService';

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

  const getNotificationIcon = (type: string, priority: string) => {
    if (priority === 'HIGH') {
      return <FontAwesomeIcon icon={faExclamationTriangle} color="#f44336" />;
    }
    
    switch (type) {
      case 'CASE_COMMENT':
        return <FontAwesomeIcon icon={faComment} color="#2196f3" />;
      case 'CASE_UPDATE':
        return <FontAwesomeIcon icon={faInfoCircle} color="#ff9800" />;
      case 'CASE_ASSIGNMENT':
        return <FontAwesomeIcon icon={faArrowUp} color="#9c27b0" />;
      case 'CASE_COMPLETION':
        return <FontAwesomeIcon icon={faCheckCircle} color="#4caf50" />;
      case 'CASE_ESCALATION':
        return <FontAwesomeIcon icon={faExclamationTriangle} color="#f44336" />;
      default:
        return <FontAwesomeIcon icon={faInfoCircle} color="#757575" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'HIGH':
        return 'error';
      case 'MEDIUM':
        return 'warning';
      case 'LOW':
        return 'info';
      default:
        return 'default';
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 30) return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
    
    const diffInMonths = Math.floor(diffInDays / 30);
    return `${diffInMonths} month${diffInMonths > 1 ? 's' : ''} ago`;
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
          <ListItem
            key={notification.id}
            sx={{
              border: '1px solid #e2e8f0',
              borderRadius: 2,
              mb: 2,
              p: 0,
              backgroundColor: notification.isRead ? '#ffffff' : '#f8fafc',
              transition: 'all 0.2s ease',
              '&:hover': {
                backgroundColor: notification.isRead ? '#f8fafc' : '#f1f5f9',
                transform: 'translateY(-1px)',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                borderColor: '#cbd5e1'
              },
            }}
          >
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'flex-start', 
              width: '100%',
              p: { xs: 2, sm: 2.5, md: 3 },
              gap: 2
            }}>
              {/* Icon */}
              <Box sx={{ 
                flexShrink: 0,
                mt: 0.5
              }}>
                {getNotificationIcon(notification.type, notification.priority)}
              </Box>

              {/* Content */}
              <Box sx={{ 
                flex: 1,
                minWidth: 0,
                display: 'flex',
                flexDirection: 'column',
                gap: 1
              }}>
                {/* Title and Priority */}
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 1,
                  flexWrap: 'wrap'
                }}>
                  <Typography 
                    variant="body1" 
                    component="span"
                    sx={{ 
                      fontWeight: notification.isRead ? 500 : 600,
                      fontSize: { xs: '0.9rem', sm: '1rem' },
                      color: notification.isRead ? 'text.secondary' : 'text.primary',
                      flex: 1,
                      minWidth: 0,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {notification.title}
                  </Typography>
                  <Chip
                    label={notification.priority}
                    size="small"
                    color={getPriorityColor(notification.priority) as any}
                    variant="filled"
                    sx={{ 
                      fontSize: '0.75rem',
                      height: 20,
                      fontWeight: 600
                    }}
                  />
                </Box>

                {/* Message */}
                <Typography 
                  variant="body2" 
                  color="text.secondary"
                  sx={{ 
                    fontSize: { xs: '0.8rem', sm: '0.875rem' },
                    lineHeight: 1.4,
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}
                >
                  {notification.message}
                </Typography>

                {/* Time */}
                <Typography 
                  variant="caption" 
                  color="text.secondary"
                  sx={{ 
                    fontSize: '0.75rem',
                    opacity: 0.7
                  }}
                >
                  {formatTimeAgo(notification.createdAt)}
                </Typography>

                {/* Created By */}
                {notification.createdBy && (
                  <Typography 
                    variant="caption" 
                    color="text.secondary"
                    sx={{ 
                      fontSize: '0.75rem',
                      opacity: 0.7,
                      fontStyle: 'italic'
                    }}
                  >
                    Created by {notification.createdBy.firstName} {notification.createdBy.lastName}
                  </Typography>
                )}
              </Box>

              {/* Actions */}
              <Box sx={{ 
                display: 'flex', 
                flexDirection: { xs: 'column', sm: 'row' },
                gap: 0.5,
                flexShrink: 0,
                alignItems: 'center'
              }}>
                {!notification.isRead && (
                  <IconButton
                    size="small"
                    onClick={() => handleMarkAsRead(notification.id)}
                    title="Mark as read"
                    sx={{
                      backgroundColor: '#e3f2fd',
                      color: '#1976d2',
                      '&:hover': {
                        backgroundColor: '#bbdefb'
                      }
                    }}
                  >
                    <FontAwesomeIcon icon={faCheck} style={{ fontSize: '0.8rem' }} />
                  </IconButton>
                )}
                <IconButton
                  size="small"
                  onClick={() => handleDeleteNotification(notification.id)}
                  title="Delete"
                  sx={{
                    backgroundColor: '#ffebee',
                    color: '#d32f2f',
                    '&:hover': {
                      backgroundColor: '#ffcdd2'
                    }
                  }}
                >
                  <FontAwesomeIcon icon={faTrash} style={{ fontSize: '0.8rem' }} />
                </IconButton>
              </Box>
            </Box>
          </ListItem>
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
