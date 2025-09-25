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
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 56,
              height: 56,
              borderRadius: 3,
              backgroundColor: `${color}.light`,
              color: `${color}.main`,
              mr: 2,
              fontSize: '1.5rem',
            }}
          >
            {icon}
          </Box>
          <Box>
            <Typography variant="h4" component="div" sx={{ fontWeight: 700, color: 'text.primary' }}>
              {value}
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 600, color: 'text.secondary' }}>
              {title}
            </Typography>
          </Box>
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem' }}>
          {description}
        </Typography>
      </CardContent>
    </Card>
  );
};

const NotificationSummaryCards: React.FC = () => {
  const [summary, setSummary] = useState<NotificationSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadSummary();
  }, []);

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
    <Grid container spacing={3} sx={{ mt: 2 }}>
      <Grid item xs={12} sm={6} md={3}>
        <SummaryCard
          title="Total Notifications"
          value={summary.totalNotifications}
          description="All notifications in the system"
          icon={<FontAwesomeIcon icon={faBell} />}
          color="primary"
        />
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <SummaryCard
          title="High Priority"
          value={summary.highPriorityNotifications}
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
