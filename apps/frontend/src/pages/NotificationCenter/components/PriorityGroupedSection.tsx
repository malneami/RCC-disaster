import React, { useMemo, useState } from 'react';
import {
  Box,
  Typography,
  Chip,
  Collapse,
  Divider,
  IconButton,
  alpha,
} from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faChevronDown,
  faChevronUp,
  faExclamationTriangle,
} from '@fortawesome/free-solid-svg-icons';
import { Notification } from '../../../services/notificationService';
import NotificationItemWithReplies from './NotificationItemWithReplies';

interface PriorityGroupedSectionProps {
  notifications: Notification[];
  onMarkAsRead: (id: string) => void;
  onDelete: (id: string) => void;
  defaultExpanded?: boolean;
}

const PriorityGroupedSection: React.FC<PriorityGroupedSectionProps> = ({
  notifications,
  onMarkAsRead,
  onDelete,
  defaultExpanded = true,
}) => {
  const [expandedPriorities, setExpandedPriorities] = useState<Record<string, boolean>>({
    CRITICAL: defaultExpanded,
    HIGH: defaultExpanded,
    MEDIUM: defaultExpanded,
    LOW: defaultExpanded,
  });

  // Group notifications by priority
  const groupedByPriority = useMemo(() => {
    const groups: Record<string, Notification[]> = {
      CRITICAL: [],
      HIGH: [],
      MEDIUM: [],
      LOW: [],
    };

    notifications.forEach((notification) => {
      const priority = notification.priority || 'LOW';
      if (groups[priority]) {
        groups[priority].push(notification);
      }
    });

    return groups;
  }, [notifications]);

  const getPriorityConfig = (priority: string) => {
    switch (priority) {
      case 'CRITICAL':
        return {
          label: 'Critical',
          color: '#dc2626',
          bgColor: alpha('#dc2626', 0.08),
          borderColor: alpha('#dc2626', 0.25),
          iconColor: '#dc2626',
        };
      case 'HIGH':
        return {
          label: 'High',
          color: '#ea580c',
          bgColor: alpha('#ea580c', 0.08),
          borderColor: alpha('#ea580c', 0.25),
          iconColor: '#ea580c',
        };
      case 'MEDIUM':
        return {
          label: 'Medium',
          color: '#f59e0b',
          bgColor: alpha('#f59e0b', 0.08),
          borderColor: alpha('#f59e0b', 0.25),
          iconColor: '#f59e0b',
        };
      case 'LOW':
        return {
          label: 'Low',
          color: '#10b981',
          bgColor: alpha('#10b981', 0.08),
          borderColor: alpha('#10b981', 0.25),
          iconColor: '#10b981',
        };
      default:
        return {
          label: priority,
          color: '#6b7280',
          bgColor: alpha('#6b7280', 0.08),
          borderColor: alpha('#6b7280', 0.25),
          iconColor: '#6b7280',
        };
    }
  };

  const togglePriority = (priority: string) => {
    setExpandedPriorities((prev) => ({
      ...prev,
      [priority]: !prev[priority],
    }));
  };

  const priorityOrder: Array<'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'> = [
    'CRITICAL',
    'HIGH',
    'MEDIUM',
    'LOW',
  ];

  return (
    <Box>
      {priorityOrder.map((priority, index) => {
        const priorityNotifications = groupedByPriority[priority] || [];
        if (!priorityNotifications || priorityNotifications.length === 0) {
          return null;
        }

        const expanded = expandedPriorities[priority] ?? defaultExpanded;
        const priorityConfig = getPriorityConfig(priority);

        return (
          <Box key={priority}>
            {index > 0 && <Divider sx={{ my: 2 }} />}
            <Box
              sx={{
                border: `1px solid ${priorityConfig.borderColor}`,
                borderRadius: 2,
                mb: 2,
                overflow: 'hidden',
                backgroundColor: priorityConfig.bgColor,
                transition: 'all 0.3s ease',
                '&:hover': {
                  boxShadow: `0 2px 8px ${alpha(priorityConfig.color, 0.15)}`,
                },
              }}
            >
              {/* Priority Header */}
              <Box
                sx={{
                  p: 2,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  backgroundColor: alpha(priorityConfig.color, 0.05),
                  borderBottom: expanded
                    ? `1px solid ${priorityConfig.borderColor}`
                    : 'none',
                  transition: 'background 0.2s ease',
                  '&:hover': {
                    backgroundColor: alpha(priorityConfig.color, 0.1),
                  },
                }}
                onClick={() => togglePriority(priority)}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Box
                    sx={{
                      width: 4,
                      height: 28,
                      borderRadius: '2px',
                      backgroundColor: priorityConfig.color,
                    }}
                  />
                  {priority === 'CRITICAL' && (
                    <FontAwesomeIcon
                      icon={faExclamationTriangle}
                      style={{
                        color: priorityConfig.color,
                        fontSize: '1rem',
                      }}
                    />
                  )}
                  <Typography
                    variant="subtitle2"
                    sx={{
                      fontWeight: 600,
                      color: priorityConfig.color,
                      fontSize: '0.85rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                    }}
                  >
                    {priorityConfig.label} Priority
                  </Typography>
                  <Chip
                    label={priorityNotifications.length}
                    size="small"
                    sx={{
                      backgroundColor: priorityConfig.color,
                      color: '#ffffff',
                      fontWeight: 600,
                      fontSize: '0.7rem',
                      height: 22,
                      minWidth: 28,
                    }}
                  />
                </Box>
                <IconButton
                  size="small"
                  sx={{
                    color: priorityConfig.color,
                    '&:hover': {
                      backgroundColor: alpha(priorityConfig.color, 0.1),
                    },
                  }}
                >
                  <FontAwesomeIcon
                    icon={expanded ? faChevronUp : faChevronDown}
                    style={{ fontSize: '0.8rem' }}
                  />
                </IconButton>
              </Box>

              {/* Notifications List */}
              <Collapse in={expanded}>
                <Box sx={{ p: 2, pt: 1.5 }}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                    {priorityNotifications.map((notification) => (
                      <NotificationItemWithReplies
                        key={notification.id}
                        notification={notification}
                        onMarkAsRead={onMarkAsRead}
                        onDelete={onDelete}
                      />
                    ))}
                  </Box>
                </Box>
              </Collapse>
            </Box>
          </Box>
        );
      })}
    </Box>
  );
};

export default PriorityGroupedSection;

