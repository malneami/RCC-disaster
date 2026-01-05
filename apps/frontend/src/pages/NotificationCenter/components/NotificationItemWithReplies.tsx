import React, { useState } from 'react';
import {
  Box,
  ListItem,
  Typography,
  Chip,
  IconButton,
  Collapse,
  Stack,
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

  const getNotificationIcon = (priority: string) => {
    const getIconColor = (priority: string) => {
      switch (priority) {
        case 'HIGH':
          return theme.palette.error.main;
        case 'MEDIUM':
          return theme.palette.warning.main;
        case 'LOW':
          return theme.palette.success.main;
        default:
          return theme.palette.info.main;
      }
    };
    
    const iconColor = getIconColor(priority);
    return (
      <Box
        sx={{
          width: 40,
          height: 40,
          borderRadius: '50%',
          backgroundColor: alpha(iconColor, 0.1),
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: `2px solid ${alpha(iconColor, 0.3)}`,
        }}
      >
        <FontAwesomeIcon 
          icon={faComment} 
          style={{ 
            color: iconColor, 
            fontSize: '1.1rem' 
          }} 
        />
      </Box>
    );
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'HIGH':
        return 'error';
      case 'MEDIUM':
        return 'warning';
      case 'LOW':
        return 'success';
      default:
        return 'info';
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

  const handleMarkAsRead = () => {
    onMarkAsRead(notification.id);
  };

  const handleDelete = () => {
    onDelete(notification.id);
  };

  const toggleReplies = () => {
    setShowReplies(!showReplies);
  };

  return (
    <ListItem
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
      <Box sx={{ width: '100%' }}>
        {/* Main Notification Content */}
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
            {getNotificationIcon(notification.priority)}
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
              
              {/* Case Type Indicator */}
              <Chip
                label={notification.caseType}
                size="small"
                sx={{ 
                  fontSize: '0.7rem',
                  height: 18,
                  fontWeight: 600,
                  bgcolor: notification.caseType === 'STEMI' ? '#ef4444' :
                           notification.caseType === 'STROKE' ? '#06b6d4' :
                           notification.caseType === 'TRAUMA' ? '#f59e0b' : '#6366f1',
                  color: '#ffffff',
                  mr: 1,
                }}
              />
              
              <Chip
                label={notification.priority}
                size="small"
                color={getPriorityColor(notification.priority) as 'error' | 'warning' | 'success' | 'info'}
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

            {/* Time and Created By */}
            <Stack direction="row" alignItems="center" spacing={2} sx={{ flexWrap: 'wrap' }}>
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
            </Stack>
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
                onClick={handleMarkAsRead}
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
              onClick={handleDelete}
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
            <IconButton
              size="small"
              onClick={toggleReplies}
              title={showReplies ? "Hide replies" : "Show replies"}
              sx={{
                backgroundColor: alpha(theme.palette.primary.main, 0.1),
                color: theme.palette.primary.main,
                '&:hover': {
                  backgroundColor: alpha(theme.palette.primary.main, 0.2)
                }
              }}
            >
              <FontAwesomeIcon 
                icon={showReplies ? faChevronUp : faChevronDown} 
                style={{ fontSize: '0.8rem' }} 
              />
            </IconButton>
          </Box>
        </Box>

        {/* Replies Section */}
        <Collapse in={showReplies}>
          <Box sx={{ 
            px: { xs: 2, sm: 2.5, md: 3 },
            pb: 2,
            borderTop: '1px solid #e2e8f0',
            backgroundColor: alpha(theme.palette.background.paper, 0.5)
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
      </Box>
    </ListItem>
  );
};

export default NotificationItemWithReplies;
