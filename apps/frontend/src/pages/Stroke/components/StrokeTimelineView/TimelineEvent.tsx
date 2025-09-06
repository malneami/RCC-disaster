import React from 'react';
import {
  StepContent,
  Paper,
  Box,
  Typography,
  Chip,
} from '@mui/material';
import {
  AccessTime as ClockIcon,
  Person as UserIcon,
  LocalHospital as HospitalIcon,
  MedicalServices as StethoscopeIcon,
} from '@mui/icons-material';

import { StrokeTimeline, StrokeService } from '../../../../services/strokeService';

interface TimelineEventProps {
  event: StrokeTimeline;
}

const TimelineEvent: React.FC<TimelineEventProps> = ({ event }) => {
  const getEventTypeColor = (eventType: string): string => {
    const colors: Record<string, string> = {
      ARRIVAL: '#1976d2',
      TRIAGE: '#ed6c02',
      ASSESSMENT: '#2e7d32',
      IMAGING: '#9c27b0',
      LABORATORY: '#f57c00',
      TREATMENT_START: '#d32f2f',
      TREATMENT_COMPLETE: '#388e3c',
      TRANSFER: '#1976d2',
      DISCHARGE: '#388e3c',
      COMPLICATION: '#d32f2f',
      FOLLOWUP: '#616161',
    };
    return colors[eventType] || '#616161';
  };

  const getEventTypeIcon = (eventType: string) => {
    switch (eventType) {
      case 'ARRIVAL':
      case 'TRANSFER':
        return HospitalIcon;
      case 'TRIAGE':
      case 'ASSESSMENT':
        return StethoscopeIcon;
      case 'IMAGING':
      case 'LABORATORY':
      case 'TREATMENT_START':
      case 'TREATMENT_COMPLETE':
        return StethoscopeIcon;
      case 'DISCHARGE':
      case 'FOLLOWUP':
        return UserIcon;
      default:
        return ClockIcon;
    }
  };

  const formatDateTime = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return 'Invalid Date';
      }
      return date.toLocaleString();
    } catch (error) {
      return 'Invalid Date';
    }
  };

  const formatDuration = (minutes?: number): string => {
    if (!minutes) return 'N/A';
    return StrokeService.formatDuration(minutes);
  };

  return (
    <StepContent>
      <Paper
        elevation={2}
        sx={{
          p: 2,
          borderLeft: 4,
          borderLeftColor: getEventTypeColor(event.eventType),
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
          <Box
            sx={{
              bgcolor: getEventTypeColor(event.eventType),
              borderRadius: '50%',
              p: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minWidth: 40,
              height: 40,
            }}
          >
            {React.createElement(getEventTypeIcon(event.eventType), {
              style: { color: 'white', fontSize: '20px' }
            })}
          </Box>
          <Box sx={{ flex: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <Typography variant="h6">
                {event.eventType}
              </Typography>
              <Chip
                label={event.toStatus}
                size="small"
                color={event.toStatus === 'TREATMENT_COMPLETE' ? 'success' : 'warning'}
              />
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <ClockIcon fontSize="small" />
              {formatDateTime(event.eventTimestamp)}
              {event.minutesFromSymptom && ` (${formatDuration(event.minutesFromSymptom)})`}
            </Typography>
            {event.eventDescription && (
              <Typography variant="body2" sx={{ mb: 1 }}>
                {event.eventDescription}
              </Typography>
            )}
            {event.triggeredByUser && (
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                Recorded by: {event.triggeredByUser.firstName} {event.triggeredByUser.lastName}
              </Typography>
            )}
          </Box>
        </Box>
      </Paper>
    </StepContent>
  );
};

export default TimelineEvent;
