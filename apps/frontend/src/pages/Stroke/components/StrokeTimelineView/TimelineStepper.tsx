import React from 'react';
import {
  Stepper,
  Step,
  StepLabel,
  Box,
  Typography,
  Alert,
  CircularProgress,
} from '@mui/material';

import { StrokeTimeline, StrokeService } from '../../../../services/strokeService';
import TimelineEvent from './TimelineEvent';

interface TimelineStepperProps {
  timeline: StrokeTimeline[];
  loading: boolean;
  error: string | null;
}

const TimelineStepper: React.FC<TimelineStepperProps> = ({
  timeline,
  loading,
  error,
}) => {
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error">
        {error}
      </Alert>
    );
  }

  if (timeline.length === 0) {
    return (
      <Alert severity="info">
        No timeline events found for this case
      </Alert>
    );
  }

  // Sort timeline events by date
  const sortedTimeline = [...timeline].sort(
    (a, b) => new Date(a.eventTimestamp).getTime() - new Date(b.eventTimestamp).getTime()
  );

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Timeline Events ({timeline.length})
      </Typography>
      
      <Stepper orientation="vertical" sx={{ mt: 2 }}>
        {sortedTimeline.map((event, index) => (
          <Step key={event.id} active={true} completed={event.toStatus === 'TREATMENT_COMPLETE'}>
            <StepLabel
              StepIconProps={{
                style: {
                  color: event.toStatus === 'TREATMENT_COMPLETE' ? '#4caf50' : '#ff9800',
                },
              }}
            >
              <Typography variant="subtitle1" fontWeight="medium">
                {event.eventType}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {new Date(event.eventTimestamp).toLocaleString()}
              </Typography>
            </StepLabel>
            <TimelineEvent event={event} />
          </Step>
        ))}
      </Stepper>
    </Box>
  );
};

export default TimelineStepper;
