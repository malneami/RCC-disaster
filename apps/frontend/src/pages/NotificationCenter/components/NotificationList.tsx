import React, { useState, useEffect } from 'react';
import {
  Box,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  Chip,
  IconButton,
  Typography,
  CircularProgress,
  Alert,
  Pagination,
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
} from '@fortawesome/free-solid-svg-icons';

import EmptyState from '../../../components/Common/EmptyState';
import { notificationService, Notification, NotificationFilter } from '../../../services/notificationService';

interface NotificationListProps {
  filters: NotificationFilter;
}

const NotificationList: React.FC<NotificationListProps> = ({ filters }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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
    try {
      setLoading(true);
      setError(null);
      const data = await notificationService.getNotifications({
        ...filters,
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      });
      setNotifications(data.notifications);
      setPagination(data.pagination);
    } catch (err) {
      console.error('Error loading notifications:', err);
      setError('Failed to load notifications. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await notificationService.markNotificationsAsRead([notificationId]);
      setNotifications(prev =>
        prev.map(notification =>
          notification.id === notificationId
            ? { ...notification, isRead: true, readAt: new Date().toISOString() }
            : notification
        )
      );
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  const handleDeleteNotification = async (notificationId: string) => {
    try {
      await notificationService.deleteNotification(notificationId);
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
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

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
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
              borderBottom: '1px solid',
              borderColor: 'divider',
              backgroundColor: notification.isRead ? 'transparent' : 'action.hover',
              '&:hover': {
                backgroundColor: 'action.selected',
              },
            }}
          >
            <ListItemIcon>
              {getNotificationIcon(notification.type, notification.priority)}
            </ListItemIcon>
            <ListItemText
              primary={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="body1" component="span">
                    {notification.title}
                  </Typography>
                  <Chip
                    label={notification.priority}
                    size="small"
                    color={getPriorityColor(notification.priority) as any}
                    variant="outlined"
                  />
                </Box>
              }
              secondary={
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    {notification.message}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {formatTimeAgo(notification.createdAt)}
                  </Typography>
                </Box>
              }
            />
            <ListItemSecondaryAction>
              <Box sx={{ display: 'flex', gap: 1 }}>
                {!notification.isRead && (
                  <IconButton
                    size="small"
                    onClick={() => handleMarkAsRead(notification.id)}
                    title="Mark as read"
                  >
                    <FontAwesomeIcon icon={faCheck} />
                  </IconButton>
                )}
                <IconButton
                  size="small"
                  onClick={() => handleDeleteNotification(notification.id)}
                  title="Delete"
                >
                  <FontAwesomeIcon icon={faTrash} />
                </IconButton>
              </Box>
            </ListItemSecondaryAction>
          </ListItem>
        ))}
      </List>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
          <Pagination
            count={pagination.totalPages}
            page={pagination.page}
            onChange={handlePageChange}
            color="primary"
            size="small"
          />
        </Box>
      )}
    </Box>
  );
};

export default NotificationList;
