import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  IconButton,
  Badge,
  Popover,
  Box,
  Typography,
  List,
  ListItem,
  ListItemButton,
  Divider,
  Button,
  CircularProgress,
  alpha,
  useTheme,
} from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faBell,
  faTimes,
  faCheck,
} from '@fortawesome/free-solid-svg-icons';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from 'react-query';
import { useNotificationSocket } from '../../contexts/NotificationSocketContext';
import { notificationService, Notification } from '../../services/notificationService';
import { useSnackbar } from 'notistack';

interface NotificationBellProps { }

const NotificationBell: React.FC<NotificationBellProps> = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { socket, isConnected } = useNotificationSocket();
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasNewNotification, setHasNewNotification] = useState(false);
  const [isShaking, setIsShaking] = useState(false);
  const vibrationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const { enqueueSnackbar } = useSnackbar();

  // Use React Query for automatic revalidation of unread count
  const { data: notificationSummary, refetch: refetchUnreadCount } = useQuery(
    'notificationSummary',
    () => notificationService.getNotificationSummary(),
    {
      refetchInterval: 30000, // Refetch every 30 seconds
      refetchOnWindowFocus: true, // Refetch when window gains focus
      staleTime: 10000, // Consider data stale after 10 seconds
      select: (data) => data.unreadNotifications || 0, // Extract unread count
    }
  );

  const unreadCount = notificationSummary || 0;
  const prevUnreadCountRef = useRef<number>(unreadCount);
  const isFirstRender = useRef(true);

  const playAudioAlert = useCallback((_pathway: 'GENERAL' | 'STEMI' | 'STROKE' | 'TRAUMA' = 'GENERAL') => {
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) {
        return;
      }
      const audioContext = new AudioContext();

      const generateBeep = (frequency: number, duration: number, delay: number = 0) => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime + delay);
        oscillator.type = 'sine';

        gainNode.gain.setValueAtTime(0, audioContext.currentTime + delay);
        gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + delay + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + delay + duration);

        oscillator.start(audioContext.currentTime + delay);
        oscillator.stop(audioContext.currentTime + delay + duration);
      };

      generateBeep(800, 0.2, 0);
      generateBeep(800, 0.2, 0.3);
      generateBeep(800, 0.2, 0.6);

    } catch (error) {
      console.warn('Audio alert failed:', error);
    }
  }, []);

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleNotificationClick = async (notification: Notification) => {
    handleClose();

    // Navigate based on notification type
    if (notification.ticketId) {
      navigate(`/tickets/${notification.ticketId}`);
    } else if (notification.caseId) {
      navigate(`/notifications`);
    } else {
      navigate('/notifications');
    }
  };

  // Helper to show the latest notification from existing data
  const showLatestNotification = useCallback((notification?: Notification) => {
    try {
      // If notificationis provided (from WebSocket), use it directly
      if (notification) {
        enqueueSnackbar(
          <Box
            onClick={() => handleNotificationClick(notification)}
            sx={{ cursor: 'pointer' }}
          >
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
              {notification.title || 'New Notification'}
            </Typography>
          </Box>,
          {
            variant: 'info',
            anchorOrigin: {
              vertical: 'top',
              horizontal: 'right'
            },
            autoHideDuration: 6000,
          }
        );
        return;
      }

      // Otherwise, use the notifications state (from loadNotifications fetch)
      if (notifications.length === 0) return;

      // Sort by createdAt descending to ensure we get the absolute latest
      const sorted = [...notifications].sort((a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      const latest = sorted[0];

      if (latest) {
        enqueueSnackbar(
          <Box
            onClick={() => handleNotificationClick(latest)}
            sx={{ cursor: 'pointer' }}
          >
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
              {latest.title || 'New Notification'}
            </Typography>
          </Box>,
          {
            variant: 'info',
            anchorOrigin: {
              vertical: 'top',
              horizontal: 'right'
            },
            autoHideDuration: 6000,
          }
        );
      }
    } catch (error) {
      console.error('Failed to show latest notification:', error);
    }
  }, [enqueueSnackbar, handleNotificationClick, notifications]);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      prevUnreadCountRef.current = unreadCount;
      return;
    }

    if (unreadCount > prevUnreadCountRef.current) {
      console.debug(`Unread count increased from ${prevUnreadCountRef.current} to ${unreadCount}, playing alert.`);
      playAudioAlert('GENERAL');
      showLatestNotification();
    }

    prevUnreadCountRef.current = unreadCount;
  }, [unreadCount, playAudioAlert, showLatestNotification]);


  const triggerVibration = useCallback(() => {
    if ('vibrate' in navigator) {
      try {
        navigator.vibrate([200, 100, 200]);
      } catch (error) {
        console.warn('Vibration not supported or failed:', error);
      }
    }
  }, []);

  // Load recent notifications
  const loadNotifications = useCallback(async () => {
    try {
      setLoading(true);
      // Load only unread notifications - backend handles the filtering
      const data = await notificationService.getNotifications({
        isRead: 'false',
        limit: '100',
        page: '1',
      });

      setNotifications(data.notifications || []);
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Listen to socket events for new notifications
  useEffect(() => {
    if (!socket || !isConnected) {
      return;
    }

    const handleNotificationCreated = (eventData: { notification: Notification; timestamp?: string } | Notification) => {
      const notification = 'notification' in eventData ? eventData.notification : eventData;

      setHasNewNotification(true);
      queryClient.invalidateQueries('notificationSummary');

      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500); // Animation duration

      console.log('Notification received:', notification);

      // Play sound and show toast notification immediately
      playAudioAlert(notification.caseType || 'GENERAL');
      showLatestNotification(notification);

      if (!notification.isRead) {
        setNotifications(prev => {
          const exists = prev.some(n => n.id === notification.id);
          if (exists) {
            return prev;
          }
          const updated = [notification, ...prev];
          return updated
        });
      }

      const isImportant = notification.priority === 'HIGH' || notification.priority === 'CRITICAL';

      if (isImportant) {
        triggerVibration();

        if (vibrationIntervalRef.current) {
          clearInterval(vibrationIntervalRef.current);
        }

        let vibrationCount = 0;
        vibrationIntervalRef.current = setInterval(() => {
          vibrationCount++;
          triggerVibration();
          if (vibrationCount >= 3) {
            if (vibrationIntervalRef.current) {
              clearInterval(vibrationIntervalRef.current);
              vibrationIntervalRef.current = null;
            }
          }
        }, 2000);
      }
    };

    const handleNotificationRead = (notificationIds: string[]) => {
      setNotifications(prev => prev.filter(n => !notificationIds.includes(n.id)));
      queryClient.invalidateQueries('notificationSummary');
    };

    socket.on('notification-created', handleNotificationCreated);
    socket.on('notification-read', handleNotificationRead);

    return () => {
      socket.off('notification-created', handleNotificationCreated);
      socket.off('notification-read', handleNotificationRead);
      if (vibrationIntervalRef.current) {
        clearInterval(vibrationIntervalRef.current);
      }
    };
  }, [socket, isConnected, queryClient, triggerVibration, playAudioAlert, showLatestNotification]);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
    loadNotifications();
    setHasNewNotification(false);
    if (vibrationIntervalRef.current) {
      clearInterval(vibrationIntervalRef.current);
      vibrationIntervalRef.current = null;
    }
    refetchUnreadCount();
  };


  const handleMarkAsRead = async (e: React.MouseEvent, notification: Notification) => {
    e.stopPropagation(); // Prevent triggering the notification click

    try {
      await notificationService.markNotificationsAsRead([notification.id]);
      queryClient.invalidateQueries('notificationSummary');
      setNotifications(prev => prev.filter(n => n.id !== notification.id));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleViewAll = () => {
    handleClose();
    navigate('/notifications');
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

  const open = Boolean(anchorEl);
  const id = open ? 'notification-popover' : undefined;

  return (
    <>
      <IconButton
        onClick={handleClick}
        sx={{
          position: 'relative',
          color: unreadCount > 0 ? theme.palette.primary.main : theme.palette.text.secondary,
          transition: 'all 0.3s ease',
          animation: hasNewNotification
            ? 'pulse 2s infinite'
            : isShaking
              ? 'shake 0.5s ease-in-out'
              : 'none',
          '&:hover': {
            color: theme.palette.primary.dark,
            backgroundColor: alpha(theme.palette.primary.main, 0.08),
            transform: 'scale(1.05)',
          },
          '@keyframes pulse': {
            '0%': {
              transform: 'scale(1)',
              color: theme.palette.primary.main,
            },
            '50%': {
              transform: 'scale(1.15)',
              color: theme.palette.warning.main,
            },
            '100%': {
              transform: 'scale(1)',
              color: theme.palette.primary.main,
            },
          },
          '@keyframes shake': {
            '0%, 100%': {
              transform: 'translateX(0) rotate(0deg)',
            },
            '10%, 30%, 50%, 70%, 90%': {
              transform: 'translateX(-8px) rotate(-5deg)',
            },
            '20%, 40%, 60%, 80%': {
              transform: 'translateX(8px) rotate(5deg)',
            },
          },
        }}
      >
        <Badge
          badgeContent={unreadCount > 0 ? unreadCount : undefined}
          color="error"
          sx={{
            '& .MuiBadge-badge': {
              fontSize: '0.7rem',
              fontWeight: 700,
              minWidth: '20px',
              height: '20px',
              padding: '0 5px',
              boxShadow: `0 2px 8px ${alpha(theme.palette.error.main, 0.4)}`,
              border: `2px solid ${theme.palette.background.paper}`,
            },
          }}
        >
          <FontAwesomeIcon
            icon={faBell}
            style={{
              fontSize: '1.2rem',
              color: 'inherit',
            }}
          />
        </Badge>
      </IconButton>

      <Popover
        id={id}
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        PaperProps={{
          sx: {
            width: 400,
            maxWidth: '90vw',
            maxHeight: '80vh',
            mt: 1,
            boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
            borderRadius: 2,
            border: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
            overflow: 'hidden',
          },
        }}
      >
        <Box
          sx={{
            p: 2,
            borderBottom: `1px solid ${theme.palette.divider}`,
            backgroundColor: alpha(theme.palette.primary.main, 0.05),
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <FontAwesomeIcon
                icon={faBell}
                style={{
                  color: theme.palette.primary.main,
                  fontSize: '1.2rem',
                }}
              />
              <Typography variant="h6" sx={{ fontWeight: 600, color: theme.palette.text.primary }}>
                Notifications
              </Typography>
              {unreadCount > 0 && (
                <Box
                  sx={{
                    px: 1,
                    py: 0.25,
                    borderRadius: 1,
                    backgroundColor: theme.palette.error.main,
                    color: '#fff',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    minWidth: 20,
                    textAlign: 'center',
                  }}
                >
                  {unreadCount}
                </Box>
              )}
            </Box>
            <IconButton
              size="small"
              onClick={handleClose}
              sx={{
                '&:hover': {
                  backgroundColor: alpha(theme.palette.error.main, 0.1),
                },
              }}
            >
              <FontAwesomeIcon icon={faTimes} />
            </IconButton>
          </Box>
        </Box>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress size={24} />
          </Box>
        ) : notifications.length === 0 ? (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <FontAwesomeIcon
              icon={faBell}
              style={{ fontSize: '2rem', color: theme.palette.text.secondary, marginBottom: '8px' }}
            />
            <Typography variant="body2" color="text.secondary">
              No new notifications
            </Typography>
          </Box>
        ) : (
          <List sx={{ p: 0, maxHeight: '60vh', overflow: 'auto' }}>
            {notifications.map((notification, index) => (
              <React.Fragment key={notification.id}>
                <ListItem
                  disablePadding
                  sx={{
                    '&:hover': {
                      backgroundColor: alpha(theme.palette.primary.main, 0.08),
                    },
                    transition: 'background-color 0.2s ease',
                  }}
                >
                  <ListItemButton
                    onClick={() => handleNotificationClick(notification)}
                    sx={{
                      py: 1.5,
                      px: 2,
                      '&:hover': {
                        backgroundColor: alpha(theme.palette.primary.main, 0.1),
                      },
                    }}
                  >
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 1.25,
                        width: '100%',
                      }}
                    >
                      <Box
                        sx={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          backgroundColor: getPriorityColor(notification.priority),
                          flexShrink: 0,
                          mt: 0.5,
                          transition: 'all 0.2s ease',
                          boxShadow: `0 0 0 2px ${alpha(getPriorityColor(notification.priority), 0.2)}`,
                        }}
                      />
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography
                          variant="body2"
                          sx={{
                            fontWeight: 600,
                            mb: 0.5,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            display: '-webkit-box',
                            WebkitLineClamp: 1,
                            WebkitBoxOrient: 'vertical',
                            opacity: notification.isRead ? 0.6 : 1,
                          }}
                        >
                          {notification.title}
                        </Typography>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            display: '-webkit-box',
                            WebkitLineClamp: 3,
                            WebkitBoxOrient: 'vertical',
                            mb: 1.5,
                            lineHeight: 1.5,
                          }}
                        >
                          {notification.message}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                          <Typography variant="caption" color="text.secondary">
                            {new Date(notification.createdAt).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </Typography>
                          {!notification.isRead && (
                            <IconButton
                              size="small"
                              onClick={(e) => handleMarkAsRead(e, notification)}
                              sx={{
                                p: 0.5,
                                ml: 'auto',
                                '&:hover': {
                                  backgroundColor: alpha(theme.palette.success.main, 0.1),
                                  color: theme.palette.success.main,
                                },
                              }}
                              title="Mark as read"
                            >
                              <FontAwesomeIcon
                                icon={faCheck}
                                style={{ fontSize: '0.875rem' }}
                              />
                            </IconButton>
                          )}
                        </Box>
                      </Box>
                    </Box>
                  </ListItemButton>
                </ListItem>
                {index < notifications.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        )}

        {notifications.length > 0 && (
          <Box
            sx={{
              p: 2,
              borderTop: `1px solid ${theme.palette.divider}`,
              backgroundColor: alpha(theme.palette.background.default, 0.5),
            }}
          >
            <Button
              fullWidth
              variant="contained"
              onClick={handleViewAll}
              sx={{
                textTransform: 'none',
                fontWeight: 600,
                borderRadius: 2,
                py: 1,
                boxShadow: `0 2px 8px ${alpha(theme.palette.primary.main, 0.3)}`,
                '&:hover': {
                  boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.4)}`,
                  transform: 'translateY(-1px)',
                },
                transition: 'all 0.2s ease',
              }}
            >
              View All Notifications
            </Button>
          </Box>
        )}
      </Popover>
    </>
  );
};

export default NotificationBell;

