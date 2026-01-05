import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Alert,
} from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faBell,
  faExclamationTriangle,
  faEnvelope,
  faSms,
} from '@fortawesome/free-solid-svg-icons';

import SkeletonLoader from '../../../components/Common/SkeletonLoader';
import { notificationService, NotificationSummary } from '../../../services/notificationService';
import { useNotificationSocket } from '../../../contexts/NotificationSocketContext';

interface SummaryCardProps {
  title: string;
  value: number;
  description: string;
  icon: React.ReactNode;
  color: 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success';
}

const SummaryCard: React.FC<SummaryCardProps> = ({
  title,
  value,
  description,
  icon,
  color,
}) => {
  return (
    <Card 
      sx={{ 
        height: '100%',
        borderRadius: 2,
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        transition: 'all 0.2s ease',
        border: '1px solid #e2e8f0',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
          borderColor: '#cbd5e1'
        }
      }}
    >
      <CardContent sx={{ 
        p: { xs: 2, sm: 2.5, md: 3 },
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between'
      }}>
        {/* Header with Icon and Value */}
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          mb: 2
        }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: { xs: 40, sm: 44, md: 48 },
              height: { xs: 40, sm: 44, md: 48 },
              borderRadius: 2,
              backgroundColor: `${color}.light`,
              color: `${color}.main`,
              fontSize: { xs: '1rem', sm: '1.1rem', md: '1.2rem' },
            }}
          >
            {icon}
          </Box>
          <Typography variant="h4" component="div" sx={{ 
            fontWeight: 700, 
            color: 'text.primary',
            fontSize: { xs: '1.8rem', sm: '2.2rem', md: '2.5rem' },
            lineHeight: 1
          }}>
            {value}
          </Typography>
        </Box>
        
        {/* Title and Description */}
        <Box>
          <Typography variant="h6" sx={{ 
            fontWeight: 600, 
            color: 'text.primary',
            fontSize: { xs: '0.9rem', sm: '1rem', md: '1.1rem' },
            mb: 1,
            lineHeight: 1.2
          }}>
            {title}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ 
            fontSize: { xs: '0.75rem', sm: '0.8rem', md: '0.875rem' },
            lineHeight: 1.4,
            opacity: 0.8
          }}>
            {description}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};

interface NotificationSummaryCardsProps {
  refreshTrigger?: number;
}

const NotificationSummaryCards: React.FC<NotificationSummaryCardsProps> = ({ refreshTrigger }) => {
  // Get socket connection from context
  const { socket, isConnected } = useNotificationSocket();

  const [summary, setSummary] = useState<NotificationSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadSummary = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await notificationService.getNotificationSummary();
      setSummary(data);
    } catch (err) {
      console.error('Error loading notification summary:', err);
      setError('Failed to load notification summary');
    } finally {
      setLoading(false);
    }
  };

  // Load summary on mount and set up polling
  useEffect(() => {
    loadSummary();
    const interval = setInterval(loadSummary, 30000);
    return () => {
      clearInterval(interval);
    };
  }, [refreshTrigger]);

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
  }, [socket, isConnected, refreshTrigger]);

  if (loading) {
    return (
      <Grid container spacing={{ xs: 2, sm: 2, md: 3 }}>
        {Array.from({ length: 4 }).map((_, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <SkeletonLoader variant="summary" />
          </Grid>
        ))}
      </Grid>
    );
  }

  if (error) {
    return (
      <Card sx={{ mt: 2 }}>
        <CardContent>
          <Alert severity="error">{error}</Alert>
        </CardContent>
      </Card>
    );
  }

  if (!summary) {
    return null;
  }

  return (
    <Grid container spacing={{ xs: 2, sm: 2, md: 3 }}>
      <Grid item xs={12} sm={6} md={3}>
        <SummaryCard
          title="Unread"
          value={summary.unreadNotifications}
          description="Need attention"
          icon={<FontAwesomeIcon icon={faBell} />}
          color="primary"
        />
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <SummaryCard
          title="High Priority"
          value={summary.highPriorityUnreadNotifications}
          description="Emergency alerts"
          icon={<FontAwesomeIcon icon={faExclamationTriangle} />}
          color="error"
        />
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <SummaryCard
          title="Email"
          value={summary.emailNotifications}
          description="Emails sent"
          icon={<FontAwesomeIcon icon={faEnvelope} />}
          color="info"
        />
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <SummaryCard
          title="SMS"
          value={summary.smsNotifications}
          description="SMS sent"
          icon={<FontAwesomeIcon icon={faSms} />}
          color="success"
        />
      </Grid>
    </Grid>
  );
};

export default NotificationSummaryCards;
