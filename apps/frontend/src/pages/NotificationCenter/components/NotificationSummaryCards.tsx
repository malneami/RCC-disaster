import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Alert,
  alpha,
} from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faBell,
  faExclamationTriangle,
  faExclamationCircle,
} from '@fortawesome/free-solid-svg-icons';

import { notificationService, NotificationSummary, NotificationFilter } from '../../../services/notificationService';
import { useNotificationSocket } from '../../../contexts/NotificationSocketContext';

interface StatCardProps {
  icon: React.ReactNode;
  value: number | string;
  label: string;
  color: string;
}

const StatCard: React.FC<StatCardProps> = ({
  icon,
  value,
  label,
  color,
}) => {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        px: 2,
        py: 1,
        borderRadius: 3,
        backgroundColor: alpha(color, 0.08),
        border: `1px solid ${alpha(color, 0.2)}`,
        transition: 'all 0.2s ease',
        cursor: 'default',
        '&:hover': {
          backgroundColor: alpha(color, 0.12),
          transform: 'translateY(-1px)',
        },
      }}
    >
      <Box sx={{ color: color, display: 'flex', alignItems: 'center', '& svg': { fontSize: 18 } }}>
        {icon}
      </Box>
      <Typography sx={{ fontWeight: 700, color: color, fontSize: '1rem', lineHeight: 1 }}>
        {value}
      </Typography>
      <Typography sx={{ color: 'text.secondary', fontSize: '0.75rem', fontWeight: 500, lineHeight: 1 }}>
        {label}
      </Typography>
    </Box>
  );
};

interface NotificationSummaryCardsProps {
  refreshTrigger?: number;
  filters?: NotificationFilter;
}

const NotificationSummaryCards: React.FC<NotificationSummaryCardsProps> = ({ refreshTrigger, filters }) => {
  // Get socket connection from context
  const { socket, isConnected } = useNotificationSocket();

  const [summary, setSummary] = useState<NotificationSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadSummary = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await notificationService.getNotificationSummary(filters);
      setSummary(data);
    } catch (err) {
      console.error('Error loading notification summary:', err);
      setError('Failed to load notification summary');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  // Load summary on mount, when filters change, and set up polling
  useEffect(() => {
    loadSummary();
    const interval = setInterval(loadSummary, 30000);
    return () => {
      clearInterval(interval);
    };
  }, [refreshTrigger, loadSummary]);

  // Listen to socket events using context hook
  useEffect(() => {
    if (!socket || !isConnected) {
      return;
    }

    const handleNotificationCreated = () => {
      loadSummary();
    };

    const handleNotificationRead = () => {
      loadSummary();
    };

    const handleNotificationDeleted = () => {
      loadSummary();
    };

    socket.on('notification-created', handleNotificationCreated);
    socket.on('notification-read', handleNotificationRead);
    socket.on('notification-deleted', handleNotificationDeleted);

    return () => {
      socket.off('notification-created', handleNotificationCreated);
      socket.off('notification-read', handleNotificationRead);
      socket.off('notification-deleted', handleNotificationDeleted);
    };
  }, [socket, isConnected, loadSummary]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        {Array.from({ length: 3 }).map((_, index) => (
          <Box
            key={index}
            sx={{
              width: 150,
              height: 40,
              borderRadius: 3,
              backgroundColor: alpha('#1976d2', 0.08),
              border: `1px solid ${alpha('#1976d2', 0.2)}`,
            }}
          />
        ))}
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        {error}
      </Alert>
    );
  }

  if (!summary) {
    return null;
  }

  const mediumPriorityUnread = summary.mediumPriorityUnreadNotifications || 0;

  return (
    <Box
      sx={{
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: 2,
      }}
    >
      <StatCard
        icon={<FontAwesomeIcon icon={faBell} />}
        value={summary.unreadNotifications}
        label="Unread"
        color="#1976d2"
      />
      <StatCard
        icon={<FontAwesomeIcon icon={faExclamationTriangle} />}
        value={summary.highPriorityUnreadNotifications}
        label="High Priority"
        color="#ea580c"
      />
      <StatCard
        icon={<FontAwesomeIcon icon={faExclamationCircle} />}
        value={mediumPriorityUnread}
        label="Medium Priority"
        color="#f59e0b"
      />
    </Box>
  );
};

export default NotificationSummaryCards;
