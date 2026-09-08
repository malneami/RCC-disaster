import React from 'react';
import {
  Box,
  CircularProgress,
  List,
  ListItem,
  ListItemButton,
  Typography,
  IconButton,
  alpha,
  useTheme,
} from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck, faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';
import { useQuery, useQueryClient } from 'react-query';
import { useNavigate } from 'react-router-dom';
import EmptyState from '../../../components/Common/EmptyState';
import { notificationService, DisasterNotification } from '../../../services/notificationService';

const DisasterNotificationList: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery(
    'disasterNotifications',
    () => notificationService.getUnifiedNotifications(50),
    {
      refetchInterval: 30000,
      refetchOnWindowFocus: true,
      staleTime: 10000,
    }
  );

  const disasterNotifications = data?.disasterNotifications || [];

  const handleClick = (_dn: DisasterNotification) => {
    navigate('/disaster-management');
  };

  const handleMarkAsRead = async (e: React.MouseEvent, dn: DisasterNotification) => {
    e.stopPropagation();
    try {
      await notificationService.markDisasterNotificationRead(dn.id);
      queryClient.invalidateQueries('disasterNotifications');
      queryClient.invalidateQueries('notificationUnifiedSummary');
    } catch (err) {
      console.error('Error marking disaster notification as read:', err);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'CRITICAL':
        return theme.palette.error.main;
      case 'HIGH':
        return theme.palette.warning.main;
      case 'MEDIUM':
        return theme.palette.info.main;
      default:
        return theme.palette.text.secondary;
    }
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress size={32} />
      </Box>
    );
  }

  if (disasterNotifications.length === 0) {
    return (
      <EmptyState
        icon={<FontAwesomeIcon icon={faExclamationTriangle} style={{ fontSize: '3rem', color: theme.palette.text.secondary }} />}
        title="No disaster notifications"
        description="You have no disaster-related notifications. Incidents and announcements will appear here."
      />
    );
  }

  return (
    <List sx={{ p: 0 }}>
      {disasterNotifications.map((dn) => {
        const isRead = dn._recipientMeta?.isRead ?? false;
        return (
          <ListItem
            key={dn.id}
            disablePadding
            sx={{
              borderBottom: `1px solid ${theme.palette.divider}`,
              '&:hover': { backgroundColor: alpha(theme.palette.primary.main, 0.06) },
            }}
          >
            <ListItemButton onClick={() => handleClick(dn)} sx={{ py: 2, px: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, width: '100%' }}>
                <Box
                  sx={{
                    width: 10,
                    height: 10,
                    borderRadius: '50%',
                    backgroundColor: getPriorityColor(dn.priority),
                    flexShrink: 0,
                    mt: 0.75,
                  }}
                />
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography
                    variant="subtitle1"
                    sx={{
                      fontWeight: 600,
                      mb: 0.5,
                      opacity: isRead ? 0.7 : 1,
                    }}
                  >
                    {dn.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    {dn.message}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                    <Typography variant="caption" color="text.secondary">
                      {new Date(dn.createdAt).toLocaleString()}
                    </Typography>
                    <Typography variant="caption" color="primary" sx={{ fontWeight: 500 }}>
                      {dn.type.replace(/_/g, ' ')}
                    </Typography>
                    {!isRead && (
                      <IconButton
                        size="small"
                        onClick={(e) => handleMarkAsRead(e, dn)}
                        sx={{
                          ml: 'auto',
                          p: 0.5,
                          '&:hover': {
                            backgroundColor: alpha(theme.palette.success.main, 0.1),
                            color: theme.palette.success.main,
                          },
                        }}
                        title="Mark as read"
                      >
                        <FontAwesomeIcon icon={faCheck} style={{ fontSize: '0.875rem' }} />
                      </IconButton>
                    )}
                  </Box>
                </Box>
              </Box>
            </ListItemButton>
          </ListItem>
        );
      })}
    </List>
  );
};

export default DisasterNotificationList;
