import React from 'react';
import { Box, Tooltip, Typography } from '@mui/material';
import type { DisasterIncident } from '../../services/disasterService';

const RESPONSE_STATUSES = ['AT_SCENE', 'PATIENT_LOADED', 'EN_ROUTE_TO_HOSPITAL', 'ARRIVED'];

interface StepInfo {
  id: string;
  label: string;
  done: boolean;
}

function getSteps(incident: DisasterIncident): StepInfo[] {
  const announcements = incident.announcements ?? [];
  const assignments = incident.ambulanceAssignments ?? [];
  const announcementSent = announcements.some((a) => a.status === 'SENT');
  const hasAssignments = assignments.length > 0;
  const responseStarted = assignments.some((a) =>
    RESPONSE_STATUSES.includes(a.status),
  );
  const resolved = incident.status === 'RESOLVED';

  return [
    { id: 'notification', label: 'Notification', done: true },
    { id: 'announcement', label: 'Announcement', done: announcementSent },
    { id: 'assign', label: 'Assign Resources', done: hasAssignments },
    { id: 'response', label: 'Response', done: responseStarted },
    { id: 'resolve', label: 'Resolve', done: resolved },
  ];
}

export interface DisasterStepsIndicatorProps {
  incident: DisasterIncident;
  variant?: 'compact' | 'detailed';
}

const DisasterStepsIndicator: React.FC<DisasterStepsIndicatorProps> = ({
  incident,
  variant = 'compact',
}) => {
  const steps = getSteps(incident);
  const currentIndex = steps.findIndex((s) => !s.done);
  const currentStep = currentIndex >= 0 ? currentIndex : steps.length - 1;

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 0.5,
        mt: 1,
        flexWrap: 'wrap',
      }}
    >
      {steps.map((step, idx) => {
        const isDone = step.done;
        const isCurrent = !isDone && idx === currentStep;
        return (
          <React.Fragment key={step.id}>
            {idx > 0 && (
              <Box
                component="span"
                sx={{
                  width: 12,
                  height: 1,
                  bgcolor: isDone ? 'primary.main' : 'action.disabled',
                  opacity: isDone ? 1 : 0.4,
                }}
              />
            )}
            <Tooltip title={`${idx + 1}. ${step.label}${isDone ? ' ✓' : ''}`}>
              <Box
                component="span"
                sx={{
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  border: '2px solid',
                  borderColor: isDone || isCurrent ? 'primary.main' : 'action.disabled',
                  bgcolor: isDone ? 'primary.main' : 'transparent',
                  opacity: isDone || isCurrent ? 1 : 0.5,
                }}
              />
            </Tooltip>
          </React.Fragment>
        );
      })}
      {variant === 'detailed' && (
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ ml: 0.5, fontSize: '0.7rem' }}
        >
          {steps[currentStep]?.label}
        </Typography>
      )}
    </Box>
  );
};

export default DisasterStepsIndicator;
