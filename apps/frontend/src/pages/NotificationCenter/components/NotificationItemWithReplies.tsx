import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  ListItem,
  Typography,
  Chip,
  IconButton,
  Collapse,
  alpha,
  useTheme,
} from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCheck,
  faTrash,
  faComment,
  faChevronDown,
  faChevronUp,
  faChartLine,
  faClock,
  faHospital,
  faAmbulance,
  faUserInjured,
  faTicketAlt,
  faUser,
  faAngleDown,
  faAngleUp,
} from '@fortawesome/free-solid-svg-icons';
import { Notification } from '../../../services/notificationService';
import RepliesSection from './RepliesSection';

interface NotificationItemWithRepliesProps {
  notification: Notification;
  onMarkAsRead: (id: string) => void;
  onDelete: (id: string) => void;
}

const NotificationItemWithReplies: React.FC<NotificationItemWithRepliesProps> = ({
  notification,
  onMarkAsRead,
  onDelete,
}) => {
  const theme = useTheme();
  const [showReplies, setShowReplies] = useState(false);
  const [isMessageExpanded, setIsMessageExpanded] = useState(false);
  const [isMessageTruncated, setIsMessageTruncated] = useState(false);
  const messageRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const checkTruncation = () => {
      if (measureRef.current && messageRef.current) {
        const visibleWidth = messageRef.current.offsetWidth;
        if (visibleWidth > 0) {
          measureRef.current.style.width = `${visibleWidth}px`;
        }
        
        const element = measureRef.current;
        const lineHeight = parseFloat(getComputedStyle(element).lineHeight) || 22.4; // lineHeight 1.6 * 14px base
        const maxHeight = lineHeight * 3; // 3 lines
        const actualHeight = element.scrollHeight;
        setIsMessageTruncated(actualHeight > maxHeight);
      }
    };
    
    checkTruncation();
    const timeoutId = setTimeout(checkTruncation, 100);
    
    window.addEventListener('resize', checkTruncation);
    
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', checkTruncation);
    };
  }, [notification.message]);
  
  const isKpiBreach = notification.type === 'KPI_THRESHOLD_BREACH';


  const getKpiName = () => {
    if (notification.type === 'KPI_THRESHOLD_BREACH' && notification.metadata) {
      try {
        const metadata = JSON.parse(notification.metadata);
        return metadata.kpiName || null;
      } catch (e) {
        return null;
      }
    }
    return null;
  };

  const kpiName = getKpiName();

  const getNotificationTypeBadge = () => {
    switch (notification.type) {
      case 'KPI_THRESHOLD_BREACH':
        return {
          label: 'KPI Breach',
          icon: faChartLine,
          color: '#dc2626',
          bgColor: alpha('#dc2626', 0.1),
          borderColor: alpha('#dc2626', 0.3),
        };
      case 'CRITICAL_TIME_LIMIT_APPROACHING':
        return {
          label: 'Critical Time',
          icon: faClock,
          color: '#ea580c',
          bgColor: alpha('#ea580c', 0.1),
          borderColor: alpha('#ea580c', 0.3),
        };
      case 'CRITICAL_CASE_INCOMING':
        return {
          label: 'Incoming Case',
          icon: faHospital,
          color: '#ef4444',
          bgColor: alpha('#ef4444', 0.1),
          borderColor: alpha('#ef4444', 0.3),
        };
      case 'EMS_LATE_CASE':
        return {
          label: 'EMS Late',
          icon: faAmbulance,
          color: '#f59e0b',
          bgColor: alpha('#f59e0b', 0.1),
          borderColor: alpha('#f59e0b', 0.3),
        };
      default:
        return {
          label: `${notification.type}`,
          icon: faClock,
          color: '#ea580c',
          bgColor: alpha('#ea580c', 0.1),
          borderColor: alpha('#ea580c', 0.3),
        };;
    }
  };

  const typeBadge = getNotificationTypeBadge();

  const getIconColor = (priority: string) => {
    switch (priority) {
      case 'CRITICAL':
        return '#dc2626';
      case 'HIGH':
        return '#ea580c';
      case 'MEDIUM':
        return '#f59e0b';
      case 'LOW':
        return '#10b981';
      default:
        return theme.palette.info.main;
    }
  };

  const getNotificationIcon = (priority: string, type: string) => {
    const iconColor = getIconColor(priority);
    let icon = faComment;
    
    if (type === 'KPI_THRESHOLD_BREACH') {
      icon = faChartLine;
    } else if (type === 'CRITICAL_CASE_INCOMING') {
      icon = faHospital;
    } else if (type === 'EMS_LATE_CASE') {
      icon = faAmbulance;
    } else if (type === 'INCOMPLETE_PATIENT_DATA') {
      icon = faUserInjured;
    } else if (type === 'CASE_ASSIGNMENT' || type === 'CASE_COMPLETION') {
      icon = faTicketAlt;
    }
    else{
      icon = faClock;
    }
    
    return (
      <Box
        sx={{
          width: 48,
          height: 48,
          borderRadius: '12px',
          backgroundColor: alpha(iconColor, 0.1),
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: `2px solid ${alpha(iconColor, 0.3)}`,
          transition: 'all 0.2s ease',
        }}
      >
        <FontAwesomeIcon 
          icon={icon} 
          style={{ 
            color: iconColor, 
            fontSize: '1.2rem' 
          }} 
        />
      </Box>
    );
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

  const handleMarkAsRead = () => {
    onMarkAsRead(notification.id);
  };

  const handleDelete = () => {
    onDelete(notification.id);
  };

  const toggleReplies = () => {
    setShowReplies(!showReplies);
  };

  const priorityColor = getIconColor(notification.priority);
  const priorityBorderColor = alpha(priorityColor, 0.3);

  return (
    <ListItem
      sx={{
        border: `1px solid ${priorityBorderColor}`,
        borderRadius: 2,
        mb: 2,
        p: 0,
        backgroundColor: notification.isRead 
          ? '#ffffff' 
          : `linear-gradient(135deg, ${alpha(priorityColor, 0.03)} 0%, ${alpha(theme.palette.background.paper, 0.8)} 100%)`,
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: notification.isRead 
          ? '0 1px 3px rgba(0,0,0,0.08)' 
          : `0 2px 8px ${alpha(priorityColor, 0.15)}`,
        '&::before': {
          content: '""',
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: 5,
          backgroundColor: priorityColor,
          transition: 'width 0.2s ease',
        },
        '&:hover': {
          backgroundColor: notification.isRead 
            ? '#f8fafc' 
            : `linear-gradient(135deg, ${alpha(priorityColor, 0.06)} 0%, ${alpha(theme.palette.background.paper, 0.9)} 100%)`,
          transform: 'translateY(-3px)',
          boxShadow: `0 6px 20px ${alpha(priorityColor, 0.25)}`,
          borderColor: priorityColor,
          '&::before': {
            width: 6,
          },
        },
      }}
    >
      <Box sx={{ width: '100%' }}>
        {/* Header Section with Type Badge and Case Type */}
        <Box
          sx={{
            px: { xs: 2.5, sm: 3, md: 3.5 },
            pt: { xs: 2, sm: 2.5, md: 3 },
            pb: 1.5,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 1.5,
            flexWrap: 'wrap',
            borderBottom: `1px solid ${alpha(theme.palette.divider, 0.3)}`,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap', flex: 1 }}>
            {typeBadge && (
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.75,
                  px: 1.75,
                  py: 0.75,
                  borderRadius: 1.5,
                  backgroundColor: typeBadge.bgColor,
                  border: `1.5px solid ${typeBadge.borderColor}`,
                }}
              >
                <FontAwesomeIcon
                  icon={typeBadge.icon}
                  style={{
                    color: typeBadge.color,
                    fontSize: '0.8rem',
                  }}
                />
                <Typography
                  variant="caption"
                  sx={{
                    color: typeBadge.color,
                    fontWeight: 700,
                    fontSize: '0.75rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.8px',
                  }}
                >
                  {typeBadge.label}
                </Typography>
              </Box>
            )}

            {/* KPI Name Badge (for KPI breach notifications) */}
            {kpiName && (
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.75,
                  px: 1.75,
                  py: 0.75,
                  borderRadius: 1.5,
                  backgroundColor: alpha('#dc2626', 0.1),
                  border: `1.5px solid ${alpha('#dc2626', 0.3)}`,
                }}
              >
                <FontAwesomeIcon
                  icon={faChartLine}
                  style={{
                    color: '#dc2626',
                    fontSize: '0.8rem',
                  }}
                />
                <Typography
                  variant="caption"
                  sx={{
                    color: '#dc2626',
                    fontWeight: 700,
                    fontSize: '0.75rem',
                    letterSpacing: '0.3px',
                  }}
                >
                  {kpiName}
                </Typography>
              </Box>
            )}

            {/* Case Type - Large and Prominent */}
            {notification.caseType && notification.caseType !== 'GENERAL' && (
              <Chip
                label={notification.caseType}
                size="medium"
                sx={{ 
                  fontSize: '0.8rem',
                  height: 28,
                  fontWeight: 700,
                  bgcolor: notification.caseType === 'STEMI' ? '#ef4444' :
                           notification.caseType === 'STROKE' ? '#06b6d4' :
                           notification.caseType === 'TRAUMA' ? '#f59e0b' : '#6366f1',
                  color: '#ffffff',
                  boxShadow: `0 2px 6px ${alpha(
                    notification.caseType === 'STEMI' ? '#ef4444' :
                    notification.caseType === 'STROKE' ? '#06b6d4' :
                    notification.caseType === 'TRAUMA' ? '#f59e0b' : '#6366f1',
                    0.4
                  )}`,
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}
              />
            )}

            {/* Category Badge - Shows hospital/patient/EMS/ticket */}
            {notification.category && (
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.75,
                  px: 1.5,
                  py: 0.5,
                  borderRadius: 1.5,
                  backgroundColor: notification.category === 'PATIENTS' ? alpha('#6366f1', 0.1) :
                                   notification.category === 'EMS' ? alpha('#3b82f6', 0.1) :
                                   notification.category === 'HOSPITALS' ? alpha('#10b981', 0.1) :
                                   alpha('#f59e0b', 0.1),
                  border: `1.5px solid ${notification.category === 'PATIENTS' ? alpha('#6366f1', 0.3) :
                                           notification.category === 'EMS' ? alpha('#3b82f6', 0.3) :
                                           notification.category === 'HOSPITALS' ? alpha('#10b981', 0.3) :
                                           alpha('#f59e0b', 0.3)}`,
                }}
              >
                <FontAwesomeIcon
                  icon={notification.category === 'PATIENTS' ? faUser :
                        notification.category === 'EMS' ? faAmbulance :
                        notification.category === 'HOSPITALS' ? faHospital :
                        faTicketAlt}
                  style={{
                    color: notification.category === 'PATIENTS' ? '#6366f1' :
                           notification.category === 'EMS' ? '#3b82f6' :
                           notification.category === 'HOSPITALS' ? '#10b981' :
                           '#f59e0b',
                    fontSize: '0.75rem',
                  }}
                />
                <Typography
                  variant="caption"
                  sx={{
                    color: notification.category === 'PATIENTS' ? '#6366f1' :
                           notification.category === 'EMS' ? '#3b82f6' :
                           notification.category === 'HOSPITALS' ? '#10b981' :
                           '#f59e0b',
                    fontWeight: 600,
                    fontSize: '0.7rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                  }}
                >
                  {notification.category}
                </Typography>
              </Box>
            )}
          </Box>

          {/* Priority Badge */}
          <Chip
            label={notification.priority}
            size="small"
            sx={{ 
              fontSize: '0.7rem',
              height: 24,
              fontWeight: 700,
              backgroundColor: priorityColor,
              color: '#ffffff',
              boxShadow: `0 2px 4px ${alpha(priorityColor, 0.4)}`,
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}
          />
        </Box>

        {/* Main Notification Content */}
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'flex-start', 
          width: '100%',
          p: { xs: 2.5, sm: 3, md: 3.5 },
          gap: 2.5
        }}>
          {/* Icon */}
          <Box sx={{ 
            flexShrink: 0,
            mt: 0.5
          }}>
            {getNotificationIcon(notification.priority, notification.type)}
          </Box>

          {/* Content */}
          <Box sx={{ 
            flex: 1,
            minWidth: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: 1.5
          }}>
            {/* Title */}
            <Typography 
              variant="h6" 
              component="div"
              sx={{ 
                fontWeight: notification.isRead ? 600 : 700,
                fontSize: { xs: '1rem', sm: '1.1rem' },
                color: notification.isRead ? 'text.secondary' : 'text.primary',
                lineHeight: 1.3,
              }}
            >
              {notification.title}
            </Typography>

            {/* Message */}
            <Box sx={{ position: 'relative' }}>
              {/* Hidden element to measure full text height */}
              <Typography 
                ref={measureRef}
                variant="body2" 
                sx={{ 
                  position: 'absolute',
                  visibility: 'hidden',
                  height: 'auto',
                  width: '100%',
                  fontSize: { xs: '0.875rem', sm: '0.9rem' },
                  lineHeight: 1.6,
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  pointerEvents: 'none',
                  zIndex: -1,
                }}
              >
                {notification.message}
              </Typography>
              
              <Typography 
                ref={messageRef}
                variant="body2" 
                color="text.secondary"
                sx={{ 
                  fontSize: { xs: '0.875rem', sm: '0.9rem' },
                  lineHeight: 1.6,
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  ...(isMessageTruncated && !isMessageExpanded && {
                    display: '-webkit-box',
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }),
                }}
              >
                {notification.message}
              </Typography>
              {isMessageTruncated && (
                <Box
                  onClick={() => setIsMessageExpanded(!isMessageExpanded)}
                  sx={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 0.75,
                    mt: 1.5,
                    px: 1.5,
                    py: 0.75,
                    borderRadius: 1.5,
                    cursor: 'pointer',
                    backgroundColor: alpha(theme.palette.primary.main, 0.08),
                    border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                    color: theme.palette.primary.main,
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      backgroundColor: alpha(theme.palette.primary.main, 0.15),
                      borderColor: theme.palette.primary.main,
                      transform: 'translateY(-1px)',
                      boxShadow: `0 2px 8px ${alpha(theme.palette.primary.main, 0.2)}`,
                    },
                    '&:active': {
                      transform: 'translateY(0)',
                    },
                  }}
                >
                  <Typography
                    variant="caption"
                    sx={{
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      color: 'inherit',
                      letterSpacing: '0.3px',
                    }}
                  >
                    {isMessageExpanded ? 'Show less' : 'Show more'}
                  </Typography>
                  <FontAwesomeIcon
                    icon={isMessageExpanded ? faAngleUp : faAngleDown}
                    style={{
                      fontSize: '0.7rem',
                      color: 'inherit',
                      transition: 'transform 0.2s ease',
                    }}
                  />
                </Box>
              )}
            </Box>

            {/* Time */}
            <Box sx={{ mt: 0.5 }}>
              <Typography 
                variant="caption" 
                color="text.secondary"
                sx={{ 
                  fontSize: '0.75rem',
                  opacity: 0.7,
                  fontWeight: 500,
                }}
              >
                {formatTimeAgo(notification.createdAt)}
              </Typography>
            </Box>
          </Box>

          {/* Actions */}
          <Box sx={{ 
            display: 'flex', 
            flexDirection: { xs: 'column', sm: 'row' },
            gap: 1,
            flexShrink: 0,
            alignItems: 'flex-start',
            pt: 0.5
          }}>
            {!notification.isRead && (
              <IconButton
                size="small"
                onClick={handleMarkAsRead}
                title="Mark as read"
                sx={{
                  backgroundColor: alpha(theme.palette.primary.main, 0.1),
                  color: theme.palette.primary.main,
                  '&:hover': {
                    backgroundColor: alpha(theme.palette.primary.main, 0.2),
                    transform: 'scale(1.05)',
                  },
                  transition: 'all 0.2s ease',
                }}
              >
                <FontAwesomeIcon icon={faCheck} style={{ fontSize: '0.8rem' }} />
              </IconButton>
            )}
            <IconButton
              size="small"
              onClick={handleDelete}
              title="Delete"
              sx={{
                backgroundColor: alpha(theme.palette.error.main, 0.1),
                color: theme.palette.error.main,
                '&:hover': {
                  backgroundColor: alpha(theme.palette.error.main, 0.2),
                  transform: 'scale(1.05)',
                },
                transition: 'all 0.2s ease',
              }}
            >
              <FontAwesomeIcon icon={faTrash} style={{ fontSize: '0.8rem' }} />
            </IconButton>
            {!isKpiBreach && (
              <IconButton
                size="small"
                onClick={toggleReplies}
                title={showReplies ? "Hide replies" : "Show replies"}
                sx={{
                  backgroundColor: alpha(theme.palette.info.main, 0.1),
                  color: theme.palette.info.main,
                  '&:hover': {
                    backgroundColor: alpha(theme.palette.info.main, 0.2),
                    transform: 'scale(1.05)',
                  },
                  transition: 'all 0.2s ease',
                }}
              >
                <FontAwesomeIcon 
                  icon={showReplies ? faChevronUp : faChevronDown} 
                  style={{ fontSize: '0.8rem' }} 
                />
              </IconButton>
            )}
          </Box>
        </Box>

        {/* Replies Section (for non-KPI notifications) */}
        {!isKpiBreach && (
          <Collapse in={showReplies}>
            <Box sx={{ 
              px: { xs: 2, sm: 2.5, md: 3 },
              pb: 2,
              borderTop: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
              backgroundColor: alpha(theme.palette.background.paper, 0.3),
              borderLeft: `3px solid ${alpha(theme.palette.primary.main, 0.3)}`,
            }}>
              <RepliesSection
                caseNoteId={JSON.parse(notification.metadata || '{}').caseNoteId || notification.id}
                caseType={notification.caseType as 'STEMI' | 'STROKE' | 'TRAUMA'}
                caseId={notification.caseId}
                patientId={notification.patientId}
                patientName={notification.patientName}
                ticketId={notification.ticketId}
              />
            </Box>
          </Collapse>
        )}
      </Box>
    </ListItem>
  );
};

export default NotificationItemWithReplies;
