import React, { useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Alert,
  Button,
  CircularProgress,
  Stack,
  alpha,
} from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faExclamationTriangle,
  faRedo,
  faHeart,
  faBrain,
} from '@fortawesome/free-solid-svg-icons';

import { useCriticalCases } from './hooks';
import CriticalCaseCard from './CriticalCaseCard';
import { useAudioAlerts } from './useAudioAlerts';

const CriticalCaseTracker: React.FC = () => {
  const { data: criticalCases, isLoading, error, refetch } = useCriticalCases();
  const { playAlert } = useAudioAlerts();

  // Filter for STEMI and Stroke cases only, excluding completed cases and cases older than 24 hours
  const stemiStrokeCases = criticalCases?.filter(case_ => {
    // Must be STEMI or Stroke pathway
    if (case_.pathway !== 'STEMI' && case_.pathway !== 'STROKE') {
      return false;
    }

    // Exclude completed cases
    if (case_.status === 'COMPLETED') {
      return false;
    }

    // Exclude cases older than 24 hours
    // Exclude cases older than 24 hours from start time
    let startTime = new Date(case_.createdAt).getTime();
    if (case_.pathway === 'STEMI' && case_.triageTime) {
      startTime = new Date(case_.triageTime).getTime();
    } else if (case_.pathway === 'STROKE' && case_.symptomOnset) {
      startTime = new Date(case_.symptomOnset).getTime();
    }

    const twentyFourHours = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
    const isWithin24Hours = (Date.now() - startTime) < twentyFourHours;

    return isWithin24Hours;
  }) || [];

  // Check for critical time warnings and play alerts
  useEffect(() => {
    if (stemiStrokeCases.length > 0) {
      const criticalCases = stemiStrokeCases.filter(case_ => {
        let startTime = new Date(case_.createdAt).getTime();
        if (case_.pathway === 'STEMI' && case_.triageTime) {
          startTime = new Date(case_.triageTime).getTime();
        } else if (case_.pathway === 'STROKE' && case_.symptomOnset) {
          startTime = new Date(case_.symptomOnset).getTime();
        }

        const elapsed = Date.now() - startTime;
        const timeLimit = case_.pathway === 'STEMI' ? 120 * 60 * 1000 : 4.5 * 60 * 60 * 1000; // 120 min or 4.5 hr
        const remaining = timeLimit - elapsed;

        // Play alert if less than 10 minutes remaining
        return remaining < 10 * 60 * 1000 && remaining > 0;
      });

      if (criticalCases.length > 0) {
        playAlert(criticalCases[0].pathway);
      }
    }
  }, [stemiStrokeCases, playAlert]);

  if (isLoading) {
    return (
      <Card sx={{ borderRadius: 3, border: '1px solid rgba(0,0,0,0.08)' }}>
        <CardContent sx={{ p: 3 }}>
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
            <CircularProgress />
          </Box>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card sx={{ borderRadius: 3, border: '1px solid rgba(0,0,0,0.08)' }}>
        <CardContent sx={{ p: 3 }}>
          {/* Header */}
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <FontAwesomeIcon
              icon={faExclamationTriangle}
              style={{ color: '#d32f2f', marginRight: '16px', fontSize: '28px' }}
            />
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 600, color: '#d32f2f' }}>
                Real-Time Critical Case Tracker
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Live countdown tracking for STEMI (120 min) and Stroke (4.5 hr) cases with hospital routes and progress monitoring.
              </Typography>
            </Box>
          </Box>

          {/* Error Card */}
          <Card sx={{
            borderRadius: 2,
            border: '1px solid rgba(211, 47, 47, 0.3)',
            backgroundColor: alpha('#d32f2f', 0.05),
          }}>
            <CardContent sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <FontAwesomeIcon
                  icon={faExclamationTriangle}
                  style={{ color: '#d32f2f', marginRight: '8px' }}
                />
                <Typography variant="h6" sx={{ fontWeight: 600, color: '#d32f2f' }}>
                  Error Loading Alerts
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Failed to load critical ticket alerts. Please try again.
              </Typography>
              <Button
                variant="outlined"
                startIcon={<FontAwesomeIcon icon={faRedo} />}
                onClick={() => refetch()}
                sx={{
                  borderColor: '#666',
                  color: '#666',
                  '&:hover': {
                    borderColor: '#d32f2f',
                    color: '#d32f2f',
                  },
                }}
              >
                Retry
              </Button>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card sx={{ borderRadius: 3, border: '1px solid rgba(0,0,0,0.08)' }}>
      <CardContent sx={{ p: 3 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <FontAwesomeIcon
            icon={faExclamationTriangle}
            style={{ color: '#d32f2f', marginRight: '16px', fontSize: '28px' }}
          />
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 600, color: '#d32f2f' }}>
              Real-Time Critical Case Tracker
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Live countdown tracking for STEMI (120 min) and Stroke (4.5 hr) cases with hospital routes and progress monitoring.
            </Typography>
          </Box>
        </Box>

        {/* Cases Display */}
        {stemiStrokeCases.length === 0 ? (
          <Alert severity="success" sx={{ borderRadius: 2 }}>
            No active STEMI or Stroke cases requiring critical tracking.
          </Alert>
        ) : (
          <Stack spacing={2}>
            {stemiStrokeCases.map((case_) => (
              <CriticalCaseCard
                key={case_.id}
                criticalCase={case_}
                onViewDetails={() => {
                  // Navigate to ticket details
                  window.open(`/tickets/${case_.id}`, '_blank');
                }}
              />
            ))}
          </Stack>
        )}

        {/* Summary Stats */}
        {stemiStrokeCases.length > 0 && (
          <Box sx={{ mt: 3, p: 2, backgroundColor: alpha('#d32f2f', 0.05), borderRadius: 2 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
              Active Critical Cases Summary
            </Typography>
            <Stack direction="row" spacing={3}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <FontAwesomeIcon icon={faHeart} style={{ color: '#d32f2f', marginRight: '8px' }} />
                <Typography variant="body2">
                  STEMI: {stemiStrokeCases.filter(c => c.pathway === 'STEMI').length}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <FontAwesomeIcon icon={faBrain} style={{ color: '#d32f2f', marginRight: '8px' }} />
                <Typography variant="body2">
                  Stroke: {stemiStrokeCases.filter(c => c.pathway === 'STROKE').length}
                </Typography>
              </Box>
            </Stack>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default CriticalCaseTracker;
