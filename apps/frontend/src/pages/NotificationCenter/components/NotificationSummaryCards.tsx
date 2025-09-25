import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Alert,
} from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faBell,
  faExclamationTriangle,
  faEnvelope,
  faSms,
} from '@fortawesome/free-solid-svg-icons';

import { notificationService, NotificationSummary } from '../../../services/notificationService';

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
        borderRadius: 3,
        boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
        transition: 'all 0.3s ease',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
        }
      }}
    >
      <CardContent sx={{ p: { xs: 2, sm: 2.5, md: 3 } }}>
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          mb: 2,
          flexDirection: { xs: 'column', sm: 'row' },
          textAlign: { xs: 'center', sm: 'left' }
        }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: { xs: 48, sm: 56 },
              height: { xs: 48, sm: 56 },
              borderRadius: 3,
              backgroundColor: `${color}.light`,
              color: `${color}.main`,
              mr: { xs: 0, sm: 2 },
              mb: { xs: 1, sm: 0 },
              fontSize: { xs: '1.2rem', sm: '1.5rem' },
            }}
          >
            {icon}
          </Box>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h4" component="div" sx={{ 
              fontWeight: 700, 
              color: 'text.primary',
              fontSize: { xs: '1.5rem', sm: '2rem', md: '2.125rem' }
            }}>
              {value}
            </Typography>
            <Typography variant="h6" sx={{ 
              fontWeight: 600, 
              color: 'text.secondary',
              fontSize: { xs: '0.875rem', sm: '1rem' }
            }}>
              {title}
            </Typography>
          </Box>
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ 
          fontSize: { xs: '0.75rem', sm: '0.875rem' },
          textAlign: { xs: 'center', sm: 'left' }
        }}>
          {description}
        </Typography>
      </CardContent>
    </Card>
  );
};

interface NotificationSummaryCardsProps {
  refreshTrigger?: number;
}

const NotificationSummaryCards: React.FC<NotificationSummaryCardsProps> = ({ refreshTrigger }) => {
  const [summary, setSummary] = useState<NotificationSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadSummary();
  }, [refreshTrigger]);

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

  if (loading) {
    return (
      <Card sx={{ mt: 2 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        </CardContent>
      </Card>
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
    <Grid container spacing={2} sx={{ mt: 2 }}>
      <Grid item xs={12} sm={6} md={3}>
        <SummaryCard
          title="Unread Notifications"
          value={summary.unreadNotifications}
          description="Notifications that need your attention"
          icon={<FontAwesomeIcon icon={faBell} />}
          color="primary"
        />
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <SummaryCard
          title="High Priority Unread"
          value={summary.highPriorityUnreadNotifications}
          description="Time-sensitive and emergency alerts"
          icon={<FontAwesomeIcon icon={faExclamationTriangle} />}
          color="error"
        />
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <SummaryCard
          title="Email Notifications"
          value={summary.emailNotifications}
          description="Total emails sent to recipients"
          icon={<FontAwesomeIcon icon={faEnvelope} />}
          color="info"
        />
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <SummaryCard
          title="SMS Notifications"
          value={summary.smsNotifications}
          description="Total SMS messages sent to recipients"
          icon={<FontAwesomeIcon icon={faSms} />}
          color="success"
        />
      </Grid>
    </Grid>
  );
};

export default NotificationSummaryCards;
